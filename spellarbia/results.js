(() => {
  'use strict';
  const {storageKey, words, rosters} = window.SpellArabiaData;
  const cloud = window.SpellArabiaCloud;
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let filter = 'all';
  let channel;

  function read() {
    if(cloud?.ready)return cloud.toState();
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return {
        records: {
          A: Array.isArray(value.records?.A) ? value.records.A : [],
          B: Array.isArray(value.records?.B) ? value.records.B : []
        },
        absent: {
          A: Array.isArray(value.absent?.A) ? value.absent.A : [],
          B: Array.isArray(value.absent?.B) ? value.absent.B : []
        },
        completed: {
          A: Array.isArray(value.completed?.A) ? value.completed.A : [],
          B: Array.isArray(value.completed?.B) ? value.completed.B : []
        }
      };
    } catch { return {records:{A:[],B:[]},absent:{A:[],B:[]},completed:{A:[],B:[]}}; }
  }

  function summary(data) {
    const classes = filter === 'all' ? ['A','B'] : [filter];
    const rows = classes.flatMap(classKey => rosters[classKey].map((name,index) => {
      const results = data.records[classKey].filter(item => item.studentIndex === index && Number.isInteger(item.wordIndex) && words[item.wordIndex]);
      const correct = results.filter(item => item.correct === true).length;
      const status = data.absent[classKey].includes(index) ? 'Absent' : results.some(item => item.isRetry && item.correct) ? 'Qualified after retry' : correct ? 'Qualified' : results.some(item => item.isRetry) ? 'Not qualified' : results.length ? 'Retry available' : 'Awaiting turn';
      return {classKey,index,name,results,correct,status};
    }));
    const attempts = classes.flatMap(classKey => data.records[classKey].filter(item => Number.isInteger(item.studentIndex) && rosters[classKey][item.studentIndex] && Number.isInteger(item.wordIndex) && words[item.wordIndex]).map(item => ({...item,classKey,name:rosters[classKey][item.studentIndex],word:words[item.wordIndex]}))).sort((a,b) => (a.time || 0) - (b.time || 0));
    return {rows,attempts};
  }

  function resultTag(result) {
    return `<span class="word-tag ${result.correct ? 'ok':'no'}">${esc(words[result.wordIndex])} <span>${result.correct ? '✓':'✕'}</span>${result.isRetry ? ' · Retry' : ''}</span>`;
  }

  function render() {
    const {rows,attempts} = summary(read());
    const participated = rows.filter(row => row.results.length).length;
    const correct = attempts.filter(item => item.correct === true).length;
    $('#participated').textContent = String(participated);
    $('#attempts').textContent = String(attempts.length);
    $('#correct').textContent = String(correct);
    $('#accuracy').textContent = attempts.length ? `${Math.round(correct / attempts.length * 100)}%` : '—';
    $('#reportCount').textContent = `${rows.length} students`;
    $('#attemptCount').textContent = `${attempts.length} answers`;
    $('#studentRows').innerHTML = rows.map((row,i) => `<tr><td>${i+1}</td><td class="student">${esc(row.name)}${cloud?.ready?` <button type="button" class="edit-name" data-edit-name="${esc(cloud.rosterIds[row.classKey][row.index])}" data-student-name="${esc(row.name)}">Edit</button>`:''}</td><td>Grade 4${row.classKey}</td><td class="words">${row.results.length ? row.results.map(resultTag).join('') : '—'}</td><td><b>${row.correct}/${row.results.length}</b></td><td><span class="result-pill ${row.status.startsWith('Qualified') ? 'ok' : row.status === 'Absent' ? 'absent' : row.status === 'Not qualified' ? 'no' : 'waiting'}">${row.status}</span></td></tr>`).join('') || '<tr><td colspan="6" class="empty-row">No students in this class.</td></tr>';
    $('#attemptRows').innerHTML = attempts.length ? attempts.map(item => `<tr><td>${esc(item.time ? new Date(item.time).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}) : '—')}</td><td>4${item.classKey}</td><td class="student">${esc(item.name)}</td><td>${esc(item.word)}${item.isRetry ? ' · Retry' : ''}</td><td><span class="result-pill ${item.correct ? 'ok':'no'}">${item.correct ? 'Correct':'Incorrect'}</span></td></tr>`).join('') : '<tr><td colspan="5" class="empty-row">No answers recorded yet. Mark a word at the Judges’ Desk to see it here.</td></tr>';
    document.querySelectorAll('[data-filter]').forEach(button => button.classList.toggle('active',button.dataset.filter === filter));
  }

  const csvCell = value => `"${String(value ?? '').replace(/"/g,'""')}"`;
  function download(blob,name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = name; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  }
  function downloadCsv() {
    const {rows} = summary(read());
    const lines = [['Class','Student number','Student','Word 1','Result 1','Word 2','Result 2','Retry word','Retry result','Correct','Attempts','Status'].map(csvCell).join(',')];
    for (const row of rows) {
      const regular = row.results.filter(item => !item.isRetry);
      const retry = row.results.find(item => item.isRetry);
      lines.push([
        `4${row.classKey}`,row.index+1,row.name,
        words[regular[0]?.wordIndex] || '',regular[0] ? regular[0].correct ? 'Correct':'Incorrect' : '',
        words[regular[1]?.wordIndex] || '',regular[1] ? regular[1].correct ? 'Correct':'Incorrect' : '',
        words[retry?.wordIndex] || '',retry ? retry.correct ? 'Correct':'Incorrect' : '',
        row.correct,row.results.length,row.status
      ].map(csvCell).join(','));
    }
    download(new Blob(['\ufeff',lines.join('\r\n')],{type:'text/csv;charset=utf-8'}),`Spell_Arabia_Round_1_${filter === 'all' ? 'All_Classes' : `Grade_4${filter}`}.csv`);
  }
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click',() => { filter = button.dataset.filter; render(); }));
  $('#downloadCsv').addEventListener('click',downloadCsv);
  $('#printReport').addEventListener('click',() => window.print());
  $('#studentRows').addEventListener('click',async event=>{
    const button=event.target.closest('[data-edit-name]');if(!button||!cloud?.ready)return;
    const name=prompt('Edit the student name in English:',button.dataset.studentName);
    if(name===null||name.trim()===button.dataset.studentName)return;
    button.disabled=true;
    try{await cloud.rename(button.dataset.editName,name.trim());await cloud.refresh(render)}
    catch(error){alert(`Name was not saved: ${error.message}`);button.disabled=false}
  });
  window.addEventListener('storage',event => { if (event.key === storageKey) render(); });
  try { channel = new BroadcastChannel('spell-arabia-preview'); channel.onmessage = event => { if (event.data?.type === 'update') render(); }; } catch {}
  if(cloud)cloud.init(render);
  render();
})();
