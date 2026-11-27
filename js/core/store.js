/* On-device storage. Everything lives in localStorage under one key, as JSON.
 * No network, no accounts. Export/import gives a plain JSON backup file. */
(function (root) {
  'use strict';
  const KEY = 'cna-journey-v1';
  const SCHEMA = 1;

  function defaults() {
    const windows = {};
    for (let d = 0; d < 7; d++) windows[d] = { enabled: true, start: '08:00', end: '21:00' };
    return {
      schema: SCHEMA,
      app: 'my-free-cna-journey',
      settings: {
        name: '',
        state: 'OK',
        weeklyGoalMinutes: 180,
        sessionLength: 30,
        maxSessionsPerDay: 3,
        breakBetween: 10,
        bufferBeforeShift: 60,
        bufferAfterShift: 60,
        studyWindows: windows,
        noStudyDays: [],
        textSize: 'large',
        onboarded: false,
        tourDone: false,
      },
      profile: { firstName: '', lastName: '', photo: '' }, // photo = small JPEG data: URL, stays on this phone
      events: [],      // {id, type: shift|appointment|blocked|available, title, start, end, notes}
      sessions: [],    // {id, date, start, end, minutes, status: planned|done|missed|skipped, kind, lessonId, title}
      progress: { lessons: {} },  // lessonId -> {completed, completedAt, checkScore}
      attempts: [],    // test attempts {id, at, mode, topic, total, correct, wrongIds}
      missedQuestions: {}, // qid -> {wrong, right, last}
      skills: {},      // skillId -> {checked: {stepIndex: true}, practiced: [dates]}
      notes: [],       // {id, at, text, lessonId}
      meta: { created: new Date().toISOString(), lastPlanned: null, lastBackup: null },
    };
  }

  /** Fill in any missing fields (older backups, partial imports). */
  function normalize(data) {
    const d = defaults();
    if (!data || typeof data !== 'object') return d;
    const out = Object.assign(d, data);
    out.settings = Object.assign(defaults().settings, data.settings || {});
    out.settings.studyWindows = Object.assign(defaults().settings.studyWindows, (data.settings || {}).studyWindows || {});
    out.progress = Object.assign({ lessons: {} }, data.progress || {});
    out.profile = Object.assign(defaults().profile, data.profile || {});
    for (const k of ['firstName', 'lastName']) out.profile[k] = String(out.profile[k] || '').trim().slice(0, 40);
    if (!out.profile.firstName && out.settings.name) out.profile.firstName = String(out.settings.name).trim().slice(0, 40); // older saves
    if (typeof out.profile.photo !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(out.profile.photo)) out.profile.photo = '';
    out.meta = Object.assign(defaults().meta, data.meta || {});
    for (const k of ['events', 'sessions', 'attempts', 'notes']) if (!Array.isArray(out[k])) out[k] = [];
    for (const k of ['missedQuestions', 'skills']) if (!out[k] || typeof out[k] !== 'object') out[k] = {};
    out.schema = SCHEMA;
    return out;
  }

  function load() {
    try {
      const raw = root.localStorage && root.localStorage.getItem(KEY);
      return normalize(raw ? JSON.parse(raw) : null);
    } catch (e) {
      console.warn('Could not read saved data', e);
      return normalize(null);
    }
  }

  function save(state) {
    try {
      root.localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn('Could not save', e);
      return false;
    }
  }

  function exportJSON(state) {
    return JSON.stringify({ exportedAt: new Date().toISOString(), data: state }, null, 2);
  }

  /** Validate and parse a backup file's text. Throws a friendly Error if it isn't a backup. */
  function parseBackup(text) {
    let obj;
    try { obj = JSON.parse(text); } catch (e) { throw new Error('That file is not a valid backup (not JSON).'); }
    const data = obj && obj.data ? obj.data : obj;
    if (!data || data.app !== 'my-free-cna-journey') throw new Error('That file is not a My Free CNA Journey backup.');
    return normalize(data);
  }

  function reset() { root.localStorage.removeItem(KEY); return defaults(); }

  const api = { KEY, SCHEMA, defaults, normalize, load, save, exportJSON, parseBackup, reset };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.CNA = root.CNA || {}; root.CNA.store = api; }
})(typeof self !== 'undefined' ? self : this);
