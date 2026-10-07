// Shared competition data for the teacher wheel and the results dashboard.
// The teacher roster is loaded securely after PIN sign-in.
let projectorRoster = null;
if (new URLSearchParams(location.search).get('screen') === 'projector') {
  try { projectorRoster = JSON.parse(localStorage.getItem('spellArbiaProjectorRosterV1')); } catch {}
}
window.SpellArabiaData = Object.freeze({
  storageKey: 'spellArabiaRound1PreviewV1',
  words: window.SpellArabiaWords,
  rosters: {
    A: Array.isArray(projectorRoster?.A) ? projectorRoster.A : Array.from({length:21},(_,i)=>`Student ${i+1}`),
    B: Array.isArray(projectorRoster?.B) ? projectorRoster.B : Array.from({length:20},(_,i)=>`Student ${i+1}`)
  }
});
