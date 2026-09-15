// Supabase Edge Function name: teacher-admin
// Paste this entire file into Supabase > Edge Functions > teacher-admin > index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

type AdminClient = typeof admin

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8'
}

const STUDENT_EMAIL_DOMAIN = '@students.connectplus.app'
const PRIMARY_TEACHER_EMAIL = 'mr.mahmd@gmail.com'
const CONNECT_PLUS_APP = 'connect-plus-4'
const ENGLISH4_APP = 'english4-term1'
const COURSE_IDS = [CONNECT_PLUS_APP, ENGLISH4_APP]
const SETTINGS_ID = 'grade4'
const HERO_BUCKET = 'hero-of-week'
const GRADE4_CLASSES = new Set(['4A', '4B'])
const cleanCode = (value: unknown) => String(value || '').trim().toUpperCase().replace(/\s+/g, '')
const grade4Class = (value: unknown) => String(value || '').trim().toUpperCase().replace(/\s+/g, '')
const studentEmail = (code: string) => `cp4.${code.toLowerCase()}${STUDENT_EMAIL_DOMAIN}`
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: corsHeaders })

function validateStudent(code: string, pin?: string) {
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) throw new Error('Username must use 3–30 English letters or numbers.')
  if (pin !== undefined && !/^\d{6}$/.test(String(pin))) throw new Error('PIN must contain exactly 6 numbers.')
}

function validateGrade4Class(value: unknown) {
  const className = grade4Class(value)
  if (!GRADE4_CLASSES.has(className)) throw Object.assign(new Error('Choose Grade 4 Class 4A or 4B.'), { status: 400 })
  return className
}

async function requireGrade4Student(admin: AdminClient, userId: string) {
  if (!userId) throw Object.assign(new Error('Student is required.'), { status: 400 })
  const [profile, auth] = await Promise.all([
    admin.from('profiles').select('class_name').eq('id', userId).maybeSingle(),
    admin.auth.admin.getUserById(userId)
  ])
  if (profile.error) throw profile.error
  if (auth.error || !auth.data.user) throw Object.assign(new Error(auth.error?.message || 'Student was not found.'), { status: 404 })
  const className = grade4Class(profile.data?.class_name || auth.data.user.user_metadata?.class_name)
  if (!GRADE4_CLASSES.has(className)) throw Object.assign(new Error('This dashboard manages Grade 4 students only.'), { status: 403 })
  return { user: auth.data.user, className }
}

async function requireTeacher(req: Request) {
  const authorization = req.headers.get('Authorization') || ''
  const token = authorization.replace(/^Bearer\s+/i, '').trim()
  if (!token) throw Object.assign(new Error('Teacher sign-in required.'), { status: 401 })

  const authResult = await admin.auth.getUser(token)
  const user = authResult.data?.user
  if (authResult.error || !user) throw Object.assign(new Error('Teacher session is invalid or expired.'), { status: 401 })

  const email = String(user.email || '').trim().toLowerCase()
  const role = await admin.from('teacher_users').select('user_id,full_name,active').eq('user_id', user.id).maybeSingle()
  if (role.error) throw Object.assign(new Error(`Teacher verification failed: ${role.error.message}`), { status: 500 })

  let teacher = role.data
  if (!teacher && email === PRIMARY_TEACHER_EMAIL) {
    const repaired = await admin.from('teacher_users').upsert({
      user_id: user.id,
      full_name: 'Mr.Mohamed Farid',
      active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' }).select('user_id,full_name,active').single()
    if (repaired.error || !repaired.data) throw Object.assign(new Error(`Teacher authorization could not be repaired: ${repaired.error?.message || 'unknown error'}`), { status: 500 })
    teacher = repaired.data
  }

  if (!teacher?.active) throw Object.assign(new Error('This account is not authorized as a teacher.'), { status: 403 })
  return { user, teacher }
}

async function listAllUsers(admin: AdminClient) {
  const users: any[] = []
  for (let page = 1; page <= 100; page++) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (result.error) throw result.error
    const batch = result.data.users || []
    users.push(...batch)
    if (batch.length < 1000) break
  }
  return users
}

async function selectAll(admin: AdminClient, table: string, columns = '*') {
  const rows: any[] = []
  for (let start = 0; start < 100000; start += 1000) {
    const result = await admin.from(table).select(columns).range(start, start + 999)
    if (result.error) throw result.error
    rows.push(...(result.data || []))
    if ((result.data || []).length < 1000) break
  }
  return rows
}

function progressStats(row: any) {
  const state = row?.app_state || {}
  const activities = Object.entries(state.activities || {}) as [string, any][]
  const answered = Math.max(Number(row?.answered_count || 0), activities.reduce((sum, [, a]) => sum + Object.keys(a?.answers || {}).length, 0))
  const correct = activities.reduce((sum, [, a]) => sum + Number(a?.score || 0), 0)
  const lessonsCompleted = activities.filter(([id, a]) => id.startsWith('lesson:') && a?.completed).length
  const challengesCompleted = activities.filter(([id, a]) => id.startsWith('boss:') && a?.completed).length
  return {
    answered,
    correct,
    accuracy: answered ? Math.round(correct / answered * 100) : 0,
    points: Math.max(Number(row?.points || 0), Number(state.xp || 0)),
    coins: Number(state.coins || 0),
    stars: Number(state.stars || 0),
    lessonsCompleted,
    challengesCompleted,
    lastPage: row?.last_page || state.lastPage || null,
    lastQuestion: row?.last_question || state.lastQuestion || null,
    lastActivityAt: row?.client_updated_at || row?.updated_at || null
  }
}

function english4ProgressStats(row: any) {
  const state = row?.state || {}
  const completedLessons = Object.values(state.completedLessons || {}).filter(Boolean).length
  const completedChallenges = Object.values(state.completedUnits || {}).filter(Boolean).length
  return {
    answered: Number(row?.answered_count || 0),
    points: Math.max(Number(row?.xp || 0), Number(state.xp || 0)),
    coins: Number(state.coins || 0),
    stars: Math.max(Number(row?.stars || 0), Number(state.stars || 0)),
    lessonsCompleted: completedLessons,
    challengesCompleted: completedChallenges,
    lastActivityAt: row?.updated_at || null
  }
}

function latestDate(...values: any[]) {
  return values.filter(Boolean).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null
}

async function logAction(admin: AdminClient, teacherId: string, action: string, targetUserId: string | null, details: Record<string, unknown> = {}) {
  await admin.from('teacher_action_log').insert({ teacher_id: teacherId, action_name: action, target_user_id: targetUserId, details })
}

async function readSettings(admin: AdminClient) {
  const result = await admin.from('platform_settings').select('*').eq('id', SETTINGS_ID).maybeSingle()
  if (result.error) throw result.error
  return result.data || {
    id: SETTINGS_ID, registration_enabled: true, login_enabled: true,
    connect_plus_visible: true, english4_visible: true,
    hero_week_number: '', heroes: [], featured_student_ids: []
  }
}

async function overview(admin: AdminClient) {
  const [authUsers, profiles, progress, courseProgress, studentAccess, classAccess, recentActions, settings] = await Promise.all([
    listAllUsers(admin),
    selectAll(admin, 'profiles', 'id,student_code,full_name,class_name,avatar_path'),
    selectAll(admin, 'student_progress', 'user_id,app_state,answered_count,points,last_page,last_question,client_updated_at,updated_at'),
    selectAll(admin, 'course_progress', 'user_id,app_id,state,answered_count,xp,stars,updated_at'),
    selectAll(admin, 'course_student_lesson_access', 'user_id,app_id,lesson_id,access_status,updated_at'),
    selectAll(admin, 'course_class_lesson_access', 'class_name,app_id,lesson_id,access_status,updated_at'),
    admin.from('teacher_action_log').select('id,action_name,target_user_id,details,created_at').order('created_at', { ascending: false }).limit(100),
    readSettings(admin)
  ])
  if (recentActions.error) throw recentActions.error
  const profileById = new Map(profiles.map((row: any) => [row.id, row]))
  const progressById = new Map(progress.map((row: any) => [row.user_id, row]))
  const english4ById = new Map(courseProgress.filter((row: any) => row.app_id === 'english4-term1').map((row: any) => [row.user_id, row]))
  const accessById: Record<string, Record<string, Record<string, string>>> = {}
  for (const row of studentAccess) {
    accessById[row.user_id] ||= { [CONNECT_PLUS_APP]: {}, [ENGLISH4_APP]: {} }
    ;(accessById[row.user_id][row.app_id] ||= {})[row.lesson_id] = row.access_status
  }
  const avatarByPath = new Map<string, string>()
  const avatarPaths = [...new Set(profiles.map((row: any) => row.avatar_path).filter(Boolean))] as string[]
  if (avatarPaths.length) {
    const signed = await admin.storage.from('student-avatars').createSignedUrls(avatarPaths, 3600)
    for (const item of signed.data || []) if (item.path && item.signedUrl) avatarByPath.set(item.path, item.signedUrl)
  }

  const students = authUsers
    .filter((user: any) => profileById.has(user.id) || String(user.email || '').endsWith(STUDENT_EMAIL_DOMAIN))
    .map((user: any) => {
      const profile: any = profileById.get(user.id) || {}
      const connectPlus = progressStats(progressById.get(user.id))
      const english4 = english4ProgressStats(english4ById.get(user.id))
      const stats = {
        answered: connectPlus.answered + english4.answered,
        correct: connectPlus.correct,
        accuracy: connectPlus.accuracy,
        points: connectPlus.points + english4.points,
        coins: connectPlus.coins + english4.coins,
        stars: connectPlus.stars + english4.stars,
        lessonsCompleted: connectPlus.lessonsCompleted + english4.lessonsCompleted,
        challengesCompleted: connectPlus.challengesCompleted + english4.challengesCompleted,
        lastPage: connectPlus.lastPage,
        lastQuestion: connectPlus.lastQuestion,
        lastActivityAt: latestDate(connectPlus.lastActivityAt, english4.lastActivityAt),
        courses: { connectPlus, english4 }
      }
      const bannedUntil = user.banned_until || null
      return {
        id: user.id,
        username: cleanCode(profile.student_code || user.user_metadata?.student_code || String(user.email || '').replace(/^cp4\./, '').replace(STUDENT_EMAIL_DOMAIN, '')),
        fullName: profile.full_name || user.user_metadata?.full_name || 'Student',
        className: profile.class_name || user.user_metadata?.class_name || '',
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        bannedUntil,
        suspended: !!(bannedUntil && new Date(bannedUntil).getTime() > Date.now()),
        createdByTeacher: !!user.app_metadata?.created_by_teacher,
        avatarUrl: avatarByPath.get(profile.avatar_path) || '',
        access: {
          connectPlus: accessById[user.id]?.[CONNECT_PLUS_APP] || {},
          english4: accessById[user.id]?.[ENGLISH4_APP] || {}
        },
        ...stats
      }
    })
    .filter((student: any) => GRADE4_CLASSES.has(grade4Class(student.className)))
  const grade4StudentIds = new Set(students.map((student: any) => student.id))
  const grade4Actions = (recentActions.data || []).filter((row: any) => {
    if (!row.target_user_id) return !row.details?.className || GRADE4_CLASSES.has(grade4Class(row.details.className))
    return grade4StudentIds.has(row.target_user_id)
  }).slice(0, 30)
  const grade4ClassAccess = classAccess.filter((row: any) => GRADE4_CLASSES.has(grade4Class(row.class_name)))
  return { students, classAccess: grade4ClassAccess, recentActions: grade4Actions, settings }
}

async function updatePlatformSettings(admin: AdminClient, body: any, teacherId: string) {
  const current = await readSettings(admin)
  const fields = ['registration_enabled','login_enabled','connect_plus_visible','english4_visible']
  const patch: Record<string, unknown> = { id: SETTINGS_ID, updated_at: new Date().toISOString(), updated_by: teacherId }
  for (const field of fields) patch[field] = typeof body[field] === 'boolean' ? body[field] : !!current[field]
  const requestedIds = Array.isArray(body.featuredStudentIds) ? body.featuredStudentIds.map(String) : current.featured_student_ids
  const uniqueIds = [...new Set(requestedIds)].filter(Boolean).slice(0, 3)
  patch.featured_student_ids = uniqueIds
  const saved = await admin.from('platform_settings').upsert(patch, { onConflict: 'id' }).select('*').single()
  if (saved.error) throw saved.error
  await logAction(admin, teacherId, 'update_platform_settings', null, {
    registrationEnabled: patch.registration_enabled, loginEnabled: patch.login_enabled,
    connectPlusVisible: patch.connect_plus_visible, english4Visible: patch.english4_visible,
    featuredStudentIds: uniqueIds
  })
  return { settings: saved.data }
}

function parseHeroImage(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/)
  if (!match) throw Object.assign(new Error('Choose a JPG, PNG, or WebP student photo.'), { status: 400 })
  const bytes = Uint8Array.from(atob(match[2]), char => char.charCodeAt(0))
  if (bytes.byteLength > 3 * 1024 * 1024) throw Object.assign(new Error('The optimized image must be smaller than 3 MB.'), { status: 400 })
  return { bytes, mime: match[1], extension: match[1].split('/')[1].replace('jpeg', 'jpg') }
}

async function saveHeroes(admin: AdminClient, body: any, teacherId: string) {
  const current = await readSettings(admin)
  const incoming = Array.isArray(body.heroes) ? body.heroes.slice(0, 2) : []
  const oldHeroes = Array.isArray(current.heroes) ? current.heroes : []
  const heroes: any[] = []
  for (let index = 0; index < 2; index++) {
    const raw = incoming[index] || {}
    const old = oldHeroes[index] || {}
    const className = index === 0 ? '4A' : '4B'
    const name = String(raw.name || '').trim().slice(0, 80)
    let photo = String(old.photo || ''), path = String(old.path || '')
    if (raw.removePhoto) { photo = ''; path = '' }
    if (raw.imageData) {
      const image = parseHeroImage(String(raw.imageData))
      const nextPath = `grade4/${className.toLowerCase()}-${Date.now()}.${image.extension}`
      const uploaded = await admin.storage.from(HERO_BUCKET).upload(nextPath, image.bytes, { contentType: image.mime, upsert: false, cacheControl: '3600' })
      if (uploaded.error) throw uploaded.error
      const publicUrl = admin.storage.from(HERO_BUCKET).getPublicUrl(nextPath).data.publicUrl
      if (path) await admin.storage.from(HERO_BUCKET).remove([path]).catch(() => {})
      path = nextPath; photo = publicUrl
    } else if (raw.removePhoto && old.path) await admin.storage.from(HERO_BUCKET).remove([old.path]).catch(() => {})
    heroes.push({ name: name || 'STUDENT NAME', className, photo, path })
  }
  const week = String(body.weekNumber || '').trim().slice(0, 24)
  const saved = await admin.from('platform_settings').upsert({
    id: SETTINGS_ID, hero_week_number: week, heroes,
    updated_at: new Date().toISOString(), updated_by: teacherId
  }, { onConflict: 'id' }).select('*').single()
  if (saved.error) throw saved.error
  await logAction(admin, teacherId, 'update_hero_of_week', null, { weekNumber: week, heroes: heroes.map(hero => ({ name: hero.name, className: hero.className })) })
  return { settings: saved.data }
}

async function createStudent(admin: AdminClient, body: any, teacherId: string) {
  const username = cleanCode(body.username)
  const pin = String(body.pin || '')
  const fullName = String(body.fullName || '').trim() || username
  const className = validateGrade4Class(body.className)
  validateStudent(username, pin)
  const created = await admin.auth.admin.createUser({
    email: studentEmail(username), password: pin, email_confirm: true,
    user_metadata: { student_code: username, full_name: fullName, class_name: className },
    app_metadata: { created_by_teacher: true }
  })
  if (created.error || !created.data.user) throw created.error || new Error('Account could not be created.')
  const user = created.data.user
  const profile = await admin.from('profiles').upsert({ id: user.id, student_code: username, full_name: fullName, class_name: className }, { onConflict: 'id' })
  if (profile.error) { await admin.auth.admin.deleteUser(user.id); throw profile.error }
  await admin.from('course_controls').upsert(COURSE_IDS.map(appId => ({ user_id: user.id, app_id: appId })), { onConflict: 'user_id,app_id' })
  await logAction(admin, teacherId, 'create_student', user.id, { username, fullName, className })
  return { id: user.id, username, fullName, className }
}

async function updateStudent(admin: AdminClient, body: any, teacherId: string) {
  const userId = String(body.userId || '')
  const fullName = String(body.fullName || '').trim()
  const className = validateGrade4Class(body.className)
  if (!userId || !fullName) throw new Error('Student name and class are required.')
  const current = await admin.auth.admin.getUserById(userId)
  if (current.error || !current.data.user) throw current.error || new Error('Student was not found.')
  const username = cleanCode(current.data.user.user_metadata?.student_code || String(current.data.user.email || '').replace(/^cp4\./, '').replace(STUDENT_EMAIL_DOMAIN, ''))
  validateStudent(username)
  const profile = await admin.from('profiles').upsert({ id: userId, student_code: username, full_name: fullName, class_name: className }, { onConflict: 'id' })
  if (profile.error) throw profile.error
  const metadata = { ...(current.data.user.user_metadata || {}), full_name: fullName, class_name: className }
  const auth = await admin.auth.admin.updateUserById(userId, { user_metadata: metadata })
  if (auth.error) throw auth.error
  await logAction(admin, teacherId, 'update_student', userId, { fullName, className })
  return { ok: true }
}

async function resetPin(admin: AdminClient, body: any, teacherId: string) {
  const userId = String(body.userId || ''), pin = String(body.pin || '')
  validateStudent('VALID', pin)
  const result = await admin.auth.admin.updateUserById(userId, { password: pin })
  if (result.error) throw result.error
  await logAction(admin, teacherId, 'reset_pin', userId)
  return { ok: true }
}

async function suspendStudent(admin: AdminClient, body: any, teacherId: string) {
  const userId = String(body.userId || ''), suspended = !!body.suspended
  const result = await admin.auth.admin.updateUserById(userId, { ban_duration: suspended ? '876000h' : 'none' })
  if (result.error) throw result.error
  await logAction(admin, teacherId, suspended ? 'suspend_student' : 'activate_student', userId)
  return { ok: true }
}

async function resetProgress(admin: AdminClient, body: any, teacherId: string) {
  const userId = String(body.userId || '')
  if (!userId) throw new Error('Student is required.')
  const requestedApp = String(body.appId || 'all')
  if (![...COURSE_IDS, 'all'].includes(requestedApp)) throw new Error('Choose a valid course.')
  const targets = requestedApp === 'all' ? COURSE_IDS : [requestedApp]
  const current = await admin.from('course_controls').select('app_id,reset_version').eq('user_id', userId).in('app_id', targets)
  if (current.error) throw current.error
  const versions = new Map((current.data || []).map((row: any) => [row.app_id, Number(row.reset_version || 0)]))
  if (targets.includes(CONNECT_PLUS_APP)) {
    const deleted = await admin.from('student_progress').delete().eq('user_id', userId)
    if (deleted.error) throw deleted.error
  }
  if (targets.includes(ENGLISH4_APP)) {
    const deleted = await admin.from('course_progress').delete().eq('user_id', userId).eq('app_id', ENGLISH4_APP)
    if (deleted.error) throw deleted.error
  }
  const now = new Date().toISOString()
  const controls = targets.map(appId => ({ user_id: userId, app_id: appId, reset_version: Number(versions.get(appId) || 0) + 1, reset_requested_at: now, updated_at: now }))
  const control = await admin.from('course_controls').upsert(controls, { onConflict: 'user_id,app_id' })
  if (control.error) throw control.error
  await logAction(admin, teacherId, 'reset_progress', userId, { appId: requestedApp, resetVersions: Object.fromEntries(controls.map(row => [row.app_id, row.reset_version])) })
  return { ok: true, appId: requestedApp }
}

async function deleteStudent(admin: AdminClient, body: any, teacherId: string) {
  const userId = String(body.userId || '')
  if (!userId) throw new Error('Student is required.')
  const profile = await admin.from('profiles').select('student_code,avatar_path').eq('id', userId).maybeSingle()
  if (profile.data?.avatar_path) await admin.storage.from('student-avatars').remove([profile.data.avatar_path])
  await logAction(admin, teacherId, 'delete_student', userId, { username: profile.data?.student_code || '' })
  await admin.from('course_student_lesson_access').delete().eq('user_id', userId)
  await admin.from('course_controls').delete().eq('user_id', userId)
  await admin.from('student_progress').delete().eq('user_id', userId)
  await admin.from('course_progress').delete().eq('user_id', userId)
  await admin.from('profiles').delete().eq('id', userId)
  const result = await admin.auth.admin.deleteUser(userId)
  if (result.error) throw result.error
  return { ok: true }
}

async function setStudentAccess(admin: AdminClient, body: any, teacherId: string) {
  const userId = String(body.userId || ''), appId = String(body.appId || ''), entries = Array.isArray(body.entries) ? body.entries : []
  if (!userId) throw new Error('Student is required.')
  if (!COURSE_IDS.includes(appId)) throw new Error('Choose one course before changing lesson access.')
  const valid = entries.filter((x: any) => /^[a-z0-9]+$/i.test(String(x.lessonId || '')) && ['inherit','visible','locked','hidden'].includes(x.status))
  const inherit = valid.filter((x: any) => x.status === 'inherit').map((x: any) => x.lessonId)
  if (inherit.length) {
    const deleted = await admin.from('course_student_lesson_access').delete().eq('user_id', userId).eq('app_id', appId).in('lesson_id', inherit)
    if (deleted.error) throw deleted.error
  }
  const rows = valid.filter((x: any) => x.status !== 'inherit').map((x: any) => ({ user_id: userId, app_id: appId, lesson_id: x.lessonId, access_status: x.status, updated_by: teacherId, updated_at: new Date().toISOString() }))
  if (rows.length) {
    const saved = await admin.from('course_student_lesson_access').upsert(rows, { onConflict: 'user_id,app_id,lesson_id' })
    if (saved.error) throw saved.error
  }
  await logAction(admin, teacherId, 'set_student_lesson_access', userId, { appId, entries: valid })
  return { ok: true }
}

async function setClassAccess(admin: AdminClient, body: any, teacherId: string) {
  const className = validateGrade4Class(body.className), appId = String(body.appId || ''), entries = Array.isArray(body.entries) ? body.entries : []
  if (!COURSE_IDS.includes(appId)) throw new Error('Choose one course before changing lesson access.')
  const valid = entries.filter((x: any) => /^[a-z0-9]+$/i.test(String(x.lessonId || '')) && ['inherit','visible','locked','hidden'].includes(x.status))
  const inherit = valid.filter((x: any) => x.status === 'inherit').map((x: any) => x.lessonId)
  if (inherit.length) {
    const deleted = await admin.from('course_class_lesson_access').delete().eq('class_name', className).eq('app_id', appId).in('lesson_id', inherit)
    if (deleted.error) throw deleted.error
  }
  const rows = valid.filter((x: any) => x.status !== 'inherit').map((x: any) => ({ class_name: className, app_id: appId, lesson_id: x.lessonId, access_status: x.status, updated_by: teacherId, updated_at: new Date().toISOString() }))
  if (rows.length) {
    const saved = await admin.from('course_class_lesson_access').upsert(rows, { onConflict: 'class_name,app_id,lesson_id' })
    if (saved.error) throw saved.error
  }
  await logAction(admin, teacherId, 'set_class_lesson_access', null, { className, appId, entries: valid })
  return { ok: true }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)
  try {
    const { user, teacher } = await requireTeacher(req)
    const teacherId = user.id
    const body = await req.json().catch(() => ({}))
    const action = String(body.action || 'overview')
    const guardedStudentActions = new Set(['update_student','reset_pin','suspend_student','reset_progress','delete_student','set_student_access'])
    if (guardedStudentActions.has(action)) await requireGrade4Student(admin, String(body.userId || ''))
    let data: any
    if (action === 'overview') data = await overview(admin)
    else if (action === 'create_student') data = await createStudent(admin, body, teacherId)
    else if (action === 'update_student') data = await updateStudent(admin, body, teacherId)
    else if (action === 'reset_pin') data = await resetPin(admin, body, teacherId)
    else if (action === 'suspend_student') data = await suspendStudent(admin, body, teacherId)
    else if (action === 'reset_progress') data = await resetProgress(admin, body, teacherId)
    else if (action === 'delete_student') data = await deleteStudent(admin, body, teacherId)
    else if (action === 'set_student_access') data = await setStudentAccess(admin, body, teacherId)
    else if (action === 'set_class_access') data = await setClassAccess(admin, body, teacherId)
    else if (action === 'update_platform_settings') data = await updatePlatformSettings(admin, body, teacherId)
    else if (action === 'save_heroes') data = await saveHeroes(admin, body, teacherId)
    else throw Object.assign(new Error('Unknown teacher action.'), { status: 400 })
    return json({ ok: true, teacher: teacher.full_name, ...data })
  } catch (error) {
    console.error(error)
    const status = Number((error as any)?.status || 400)
    return json({ error: (error as Error)?.message || 'Teacher request failed.' }, status)
  }
})
