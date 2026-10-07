import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false }
})
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8'
}
const reply = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers })
const fail = (message: string, status = 400) => reply({ error: message }, status)
const uuid = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
const bytesToB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
const b64ToBytes = (value: string) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4)), c => c.charCodeAt(0))
async function sha256(value: string) { return bytesToB64(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))) }
async function pinHash(pin: string, salt: string, iterations: number) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  return bytesToB64(new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: b64ToBytes(salt), iterations, hash: 'SHA-256' }, key, 256)))
}
function equalHash(a: string, b: string) { const x=b64ToBytes(a), y=b64ToBytes(b); if(x.length!==y.length)return false;let diff=0;for(let i=0;i<x.length;i++)diff|=x[i]^y[i];return diff===0 }

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return fail('POST required.', 405)
  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>
    const action = String(body.action || '')
    const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim()

    if (action === 'set_pin') {
      if (!token) return fail('Sign in with the existing teacher account to set the PIN.', 401)
      const auth = await admin.auth.getUser(token)
      if (auth.error || !auth.data.user) return fail('Teacher account session is invalid.', 401)
      const role = await admin.from('teacher_users').select('active').eq('user_id', auth.data.user.id).maybeSingle()
      if (role.error) throw role.error
      if (!role.data?.active) return fail('Teacher access is required.', 403)
      const pin=String(body.pin||'')
      if(!/^\d{8}$/.test(pin))return fail('Choose an eight-digit teacher PIN.')
      const salt=bytesToB64(crypto.getRandomValues(new Uint8Array(24))),iterations=210000
      const hash=await pinHash(pin,salt,iterations)
      const saved=await admin.from('spell_arbia_teacher_pin').upsert({id:1,salt,pin_hash:hash,iterations,failed_count:0,locked_until:null,updated_by:auth.data.user.id,updated_at:new Date().toISOString()},{onConflict:'id'})
      if(saved.error)throw saved.error
      const cleared=await admin.from('spell_arbia_teacher_sessions').delete().gte('created_at','1970-01-01')
      if(cleared.error)throw cleared.error
      await admin.from('teacher_action_log').insert({teacher_id:auth.data.user.id,action_name:'spell_arbia_set_pin',details:{}})
      return reply({saved:true})
    }

    if (action === 'pin_login') {
      const row=await admin.from('spell_arbia_teacher_pin').select('*').eq('id',1).maybeSingle()
      if(row.error)throw row.error
      if(!row.data)return fail('Teacher PIN is not set yet. Use Set teacher PIN with your existing teacher account.',428)
      if(row.data.locked_until && new Date(row.data.locked_until).getTime()>Date.now())return fail('Too many incorrect attempts. Try again in 15 minutes.',429)
      const pin=String(body.pin||''),candidate=/^\d{8}$/.test(pin)?await pinHash(pin,row.data.salt,row.data.iterations):''
      if(!candidate||!equalHash(candidate,row.data.pin_hash)){
        const previous=row.data.locked_until&&new Date(row.data.locked_until).getTime()<=Date.now()?0:Number(row.data.failed_count||0)
        const failed=Math.min(5,previous+1)
        await admin.from('spell_arbia_teacher_pin').update({failed_count:failed,locked_until:failed>=5?new Date(Date.now()+15*60*1000).toISOString():null}).eq('id',1)
        return fail(failed>=5?'Too many incorrect attempts. Try again in 15 minutes.':'Incorrect teacher PIN.',401)
      }
      const teacher=await admin.from('teacher_users').select('active').eq('user_id',row.data.updated_by).maybeSingle()
      if(teacher.error)throw teacher.error
      if(!teacher.data?.active)return fail('Teacher access is disabled.',403)
      await admin.from('spell_arbia_teacher_pin').update({failed_count:0,locked_until:null}).eq('id',1)
      const sessionToken=bytesToB64(crypto.getRandomValues(new Uint8Array(32)))
      const saved=await admin.from('spell_arbia_teacher_sessions').insert({token_hash:await sha256(sessionToken),teacher_id:row.data.updated_by,expires_at:new Date(Date.now()+8*60*60*1000).toISOString()})
      if(saved.error)throw saved.error
      return reply({token:sessionToken,expiresInSeconds:28800})
    }

    if (!token) return fail('Teacher PIN sign-in required.', 401)
    const session=await admin.from('spell_arbia_teacher_sessions').select('teacher_id').eq('token_hash',await sha256(token)).gt('expires_at',new Date().toISOString()).maybeSingle()
    if(session.error)throw session.error
    if(!session.data)return fail('Teacher PIN session is invalid or expired.',401)
    const teacherId=session.data.teacher_id
    const teacher=await admin.from('teacher_users').select('user_id,active,full_name').eq('user_id',teacherId).maybeSingle()
    if(teacher.error)throw teacher.error
    if(!teacher.data?.active)return fail('Teacher access is required.',403)

    if (action === 'load') {
      const [roster, attempts] = await Promise.all([
        admin.from('spell_arbia_roster').select('id,class_key,position,display_name,absent,active').eq('active', true).order('class_key').order('position'),
        admin.from('spell_arbia_attempts').select('id,roster_id,class_key,attempt_no,word_index,correct,created_at').order('created_at')
      ])
      if (roster.error) throw roster.error
      if (attempts.error) throw attempts.error
      return reply({ roster: roster.data || [], attempts: attempts.data || [], teacher: teacher.data.full_name })
    }

    if (action === 'save_attempt') {
      if (!uuid(body.rosterId)) return fail('Choose a valid student.')
      const attemptNo = Number(body.attemptNo), wordIndex = Number(body.wordIndex)
      if (![1, 2].includes(attemptNo) || !Number.isInteger(wordIndex) || wordIndex < 0 || wordIndex > 49 || typeof body.correct !== 'boolean') return fail('Invalid word result.')
      const student = await admin.from('spell_arbia_roster').select('id,class_key,active,absent').eq('id', body.rosterId).maybeSingle()
      if (student.error) throw student.error
      if (!student.data?.active || student.data.absent) return fail('This student is unavailable.')
      const existing = await admin.from('spell_arbia_attempts').select('id,attempt_no,word_index,correct,created_at').eq('roster_id', body.rosterId).order('attempt_no')
      if (existing.error) throw existing.error
      const same = (existing.data || []).find(item => item.attempt_no === attemptNo)
      if (same) return same.word_index === wordIndex && same.correct === body.correct ? reply({ attempt: same, alreadySaved: true }) : fail('This attempt is already recorded with another result.', 409)
      if ((existing.data || []).length + 1 !== attemptNo) return fail('Record the first word before the second.', 409)
      const inserted = await admin.from('spell_arbia_attempts').insert({
        roster_id: body.rosterId,
        class_key: student.data.class_key,
        attempt_no: attemptNo,
        word_index: wordIndex,
        correct: body.correct,
        marked_by: teacherId
      }).select('id,roster_id,class_key,attempt_no,word_index,correct,created_at').single()
      if (inserted.error) {
        if (inserted.error.code === '23505') return fail('This student attempt or word is already recorded. Refresh results.', 409)
        throw inserted.error
      }
      return reply({ attempt: inserted.data })
    }

    if (action === 'set_absent') {
      if (!uuid(body.rosterId) || typeof body.absent !== 'boolean') return fail('Invalid attendance change.')
      if (body.absent) {
        const prior = await admin.from('spell_arbia_attempts').select('id').eq('roster_id', body.rosterId).limit(1)
        if (prior.error) throw prior.error
        if (prior.data?.length) return fail('A student with recorded results cannot be marked absent.', 409)
      }
      const changed = await admin.from('spell_arbia_roster').update({ absent: body.absent, updated_at: new Date().toISOString() }).eq('id', body.rosterId).eq('active', true).select('id,absent').single()
      if (changed.error) throw changed.error
      return reply({ student: changed.data })
    }

    if (action === 'rename_student') {
      if (!uuid(body.rosterId)) return fail('Choose a valid student.')
      const name = String(body.name || '').trim().replace(/\s+/g, ' ')
      if (!/^[A-Za-z .'-]{2,120}$/.test(name)) return fail('Use an English student name (2-120 characters).')
      const changed = await admin.from('spell_arbia_roster').update({ display_name: name, updated_at: new Date().toISOString() }).eq('id', body.rosterId).eq('active', true).select('id,display_name').single()
      if (changed.error) throw changed.error
      await admin.from('teacher_action_log').insert({ teacher_id: teacherId, action_name: 'spell_arbia_rename', details: { roster_id: body.rosterId, new_name: name } })
      return reply({ student: changed.data })
    }
    return fail('Unknown competition action.', 404)
  } catch (error) {
    console.error('spell-arabia', error)
    return fail(error instanceof Error ? error.message : 'Competition request failed.', 500)
  }
})
