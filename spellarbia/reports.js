(() => {
  'use strict';
  const cloud = window.SpellArabiaCloud;
  const words = window.SpellArabiaData.words;
  const view = new URLSearchParams(location.search).get('view') === 'all' ? 'all' : 'winners';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const reportDate = new Date();
  let ready = false;

  function studentRows(classKey) {
    const roster = cloud.data.roster.filter(row => row.class_key === classKey && row.active).sort((a,b) => a.position-b.position);
    return roster.map(row => {
      const attempts = cloud.data.attempts.filter(item => item.roster_id === row.id).sort((a,b) => a.attempt_no-b.attempt_no);
      const qualified = attempts.some(item => item.correct === true);
      const retryWin = attempts.some(item => item.is_retry === true && item.correct === true);
      return {...row, attempts, qualified, retryWin};
    });
  }

  function status(row) {
    if (row.retryWin) return ['Qualified after retry','retry-win'];
    if (row.qualified) return ['Qualified','winner'];
    if (row.absent) return ['Absent','absent'];
    if (!row.attempts.length) return ['Awaiting turn','pending'];
    if (row.attempts.some(item => item.is_retry)) return ['Not qualified','lost'];
    return ['Retry available','retry-ready'];
  }

  function wordPills(row) {
    if (!row.attempts.length) return '<span class="no-words">No word tested yet</span>';
    return row.attempts.map(item => `<span class="word-pill ${item.correct?'correct':'incorrect'} ${item.is_retry?'retry':''}">${esc(words[item.word_index] || `Word ${item.word_index+1}`)} <span aria-label="${item.correct?'correct':'incorrect'}">${item.correct?'✓':'✕'}</span>${item.is_retry && view === 'all'?' · Retry':''}</span>${item.is_retry && item.correct && view === 'winners' ? '<span class="retry-success-badge">Won on retry</span>' : ''}`).join('');
  }

  function classTable(classKey, rows) {
    const shown = view === 'winners' ? rows.filter(row => row.qualified) : rows;
    const body = shown.length ? shown.map((row,index) => {
      const [label,kind] = status(row);
      const firstCells = `<td class="row-number">${String(index+1).padStart(2,'0')}</td><td class="student-name">${esc(row.display_name)}</td><td><div class="word-list">${wordPills(row)}</div></td>`;
      return view === 'winners' ? `<tr>${firstCells}</tr>` : `<tr>${firstCells}<td>${row.attempts.length}</td><td><span class="status-pill ${kind}">${label}</span></td></tr>`;
    }).join('') : `<tr><td colspan="${view === 'winners' ? 3 : 5}" class="empty-class">No qualified students recorded in Grade 4${classKey} yet.</td></tr>`;
    const headings = view === 'winners'
      ? '<th style="width:5%">#</th><th style="width:50%">Student</th><th>Spelled words &amp; result</th>'
      : '<th style="width:5%">#</th><th style="width:34%">Student</th><th>Tested words &amp; outcome</th><th style="width:7%">Tries</th><th style="width:17%">Round 1 status</th>';
    return `<section class="class-block ${classKey.toLowerCase()}"><div class="continuation-brand"><img src="school-logo.webp" alt="Alandalus Private Schools"><div><b>ALANDALUS PRIVATE SCHOOLS</b><span>SPELL ARABIA · ROUND 1 · GRADE 4${classKey}</span></div></div><div class="class-heading"><div><h2>Grade 4${classKey}</h2><p>${view === 'winners' ? 'Round 1 qualified students' : 'Full class roster and tested words'}</p></div><span class="class-count">${shown.length} ${view === 'winners' ? shown.length === 1 ? 'winner' : 'winners' : shown.length === 1 ? 'student' : 'students'}</span></div><p class="swipe-hint">Swipe the table sideways to see ${view === 'winners' ? 'the words' : 'words and status'} →</p><div class="report-table-wrap"><table class="report-table"><thead><tr>${headings}</tr></thead><tbody>${body}</tbody></table></div></section>`;
  }

  function summaryItem(kind,label,number,note) {
    return `<div class="summary-item ${kind}"><span>${label}</span><strong>${number}</strong><small>${note}</small></div>`;
  }

  function render() {
    if (!cloud?.ready || !cloud.data) return;
    const a = studentRows('A'), b = studentRows('B'), all = [...a,...b];
    const qualified = all.filter(row => row.qualified);
    const retryWinners = qualified.filter(row => row.retryWin);
    $('#reportSheet').classList.toggle('winners',view === 'winners');
    $('#winnersLink').classList.toggle('active',view === 'winners');
    $('#allLink').classList.toggle('active',view === 'all');
    $('#reportTitle').textContent = view === 'winners' ? 'Round 1 Winners' : 'All Students & Words';
    $('#heroKicker').textContent = view === 'winners' ? 'SPELL ARABIA · HALL OF ACHIEVEMENT' : 'SPELL ARABIA · COMPLETE ROUND 1 RECORD';
    $('#reportSubtitle').textContent = view === 'winners'
      ? 'Celebrating every student who spelled at least one word correctly, including success on the retry.'
      : 'A clear record of every Grade 4 student, each tested word, and the outcome of every attempt.';
    $('#summaryStrip').innerHTML = view === 'winners'
      ? summaryItem('teal','QUALIFIED STUDENTS',qualified.length,'Correct on any attempt') + summaryItem('gold','GRADE 4A WINNERS',a.filter(row => row.qualified).length,'Round 1') + summaryItem('purple','GRADE 4B WINNERS',b.filter(row => row.qualified).length,'Round 1')
      : summaryItem('teal','STUDENTS',all.length,'Grade 4A + Grade 4B') + summaryItem('gold','PARTICIPATED',all.filter(row => row.attempts.length).length,'At least one tested word') + summaryItem('purple','WORDS TESTED',cloud.data.attempts.length,'Every recorded attempt');
    $('#reportExplainer').innerHTML = view === 'winners'
      ? `<b>Qualification rule:</b> One correct word qualifies; a successful retry also counts.${retryWinners.length ? ` ${retryWinners.length} ${retryWinners.length === 1 ? 'student won' : 'students won'} on a retry.` : ''}`
      : '<b>Reading this report:</b> Words appear in attempt order. Green means correct, red means incorrect, and “Retry” marks the extra chance. Students who have not competed remain on the class list.';
    $('#classReports').innerHTML = classTable('A',a) + classTable('B',b);
    $('#generatedAt').textContent = `Generated ${reportDate.toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})}`;
    document.title = `Spell Arabia | ${view === 'winners' ? 'Round 1 Winners' : 'All Students & Words'}`;
    ready = true;
  }

  async function imageDataUrl(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error('The school logo could not be loaded.');
    const blob = await response.blob();
    return new Promise((resolve,reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function download(blob,filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  }

  async function downloadHtml() {
    if (!ready) return;
    const button = $('#downloadHtml');
    button.disabled = true; button.textContent = 'Preparing report…';
    try {
      const [css,logo] = await Promise.all([
        fetch('reports.css').then(response => {if(!response.ok)throw new Error('The report style could not be loaded.');return response.text()}),
        imageDataUrl('school-logo.webp')
      ]);
      const copy = document.documentElement.cloneNode(true);
      copy.querySelectorAll('script,link[rel="stylesheet"],link[rel="preconnect"]').forEach(node => node.remove());
      copy.querySelector('.report-toolbar')?.remove();
      copy.querySelector('#schoolLogo').src = logo;
      copy.querySelectorAll('.continuation-brand img').forEach(img => { img.src = logo; });
      const style = document.createElement('style'); style.textContent = css;
      copy.querySelector('head').append(style);
      download(new Blob(['<!doctype html>\n',copy.outerHTML],{type:'text/html;charset=utf-8'}),`Spell_Arabia_Round_1_${view === 'winners' ? 'Winners' : 'All_Students'}.html`);
    } catch (error) { alert(`Could not prepare the report: ${error.message}`); }
    finally { button.disabled = false; button.textContent = '↓ Download report'; }
  }

  $('#downloadHtml').addEventListener('click',downloadHtml);
  $('#printReport').addEventListener('click',() => {if (ready) window.print()});
  cloud.init(render);
})();
