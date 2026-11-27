/* Oklahoma Long Term Care Nurse Aide written exam (CareerTech 7C, assessment 8607) — practice blueprint.
 * Every number below was read on official Oklahoma CareerTech documents (checked 2026-11-22):
 *   S1 Certified Nurse Aide Study Guide      — 70 questions, 2 hours, 70% to pass, duty weights
 *   S2 Badge Details 8607 (CareerTech)       — 70 questions, 70% to pass, duty weights (identical to S1)
 *   S3 HPCP "cheat sheet" tables by test     — 7C Long-Term Care Aide 8607: 70%, 70 questions, 2 hours
 *   S4 HCP Test Site Coordinator Manual      — 70% to pass, 2 hours; BUT its Table 1 lists 75 questions
 * The practice exam uses 70 questions (S1, S2, S3 agree) and tells the user one document says 75. */
(function (root) {
  'use strict';
  const B = 'https://oklahoma.gov/content/dam/ok/en/careertech/';
  const sources = [
    { title: 'Certified Nurse Aide Study Guide (Standard and Test Content, 7C Long Term Care Nurse Aide)', by: 'Oklahoma CareerTech Testing Center', url: B + 'testing-centers/testing/study-guides/certified-nurse-aide-sg.pdf' },
    { title: 'Badge Details: 8607 – Long Term Care Nurse Aide', by: 'Oklahoma CareerTech', url: B + 'educators/certifications-and-badging/8607-long-term-care-nurse-aide.pdf' },
    { title: 'HPCP Cheat Sheet – by name of test', by: 'Oklahoma CareerTech Testing Center', url: B + 'testing-centers/testing/hcp-coordinator-resources/testing-cheat-sheet-tables-by-test.pdf' },
    { title: 'HCP Test Site Coordinator Manual (with OSDH)', by: 'Oklahoma CareerTech Testing Center', url: B + 'testing-centers/testing/hcp-coordinator-resources/test-site-coord-manual.pdf' },
  ];
  const facts = [
    { text: 'The written test has 70 questions.', sources: [0, 1, 2], note: 'The Test Site Coordinator Manual (Table 1) lists 75 questions for Long Term Care. Ask your test site which applies when you register.' },
    { text: 'You have 2 hours for the written test.', sources: [0, 2, 3] },
    { text: 'You need 70% or higher to pass the written test.', sources: [0, 1, 2, 3] },
    { text: 'You take the written test after passing the clinical skills test, and you may ask for it to be read aloud (oral).', sources: [0, 1, 3] },
    { text: 'How many questions come from each area (the duty weights below).', sources: [0, 1], partial: 'Two official sources (the study guide and the 8607 badge page) give identical weights; no third document lists them.' },
  ];
  // Duty areas, weights and question counts exactly as listed for 7C Long Term Care Nurse Aide (S1, S2).
  const duties = [
    { id: 'A', title: 'Basic understanding of the healthcare industry', weight: 1, count: 1 },
    { id: 'B', title: 'Legal and ethical behaviors', weight: 9, count: 6 },
    { id: 'C', title: 'Protect and promote resident rights', weight: 10, count: 7 },
    { id: 'D', title: 'Communicate effectively with residents, families and coworkers', weight: 10, count: 7 },
    { id: 'E', title: 'Assistance with activities of daily living', weight: 19, count: 13 },
    { id: 'F', title: 'Infection control', weight: 10, count: 7 },
    { id: 'G', title: 'Resident safety', weight: 10, count: 7 },
    { id: 'H', title: 'Basic nursing skills', weight: 16, count: 11 },
    { id: 'I', title: 'Promote resident independence', weight: 9, count: 6 },
    { id: 'J', title: 'Psychosocial care skills', weight: 2, count: 2 },
    { id: 'K', title: 'Care for residents with Alzheimer\'s and dementia', weight: 4, count: 3 },
  ];
  const TOTAL = 70, MINUTES = 120, PASS = 70;

  // Which Oklahoma duty each lesson's questions test (by the official outline in S1), plus single-question overrides.
  const DUTY_BY_LESSON = {
    'role-1': 'B', 'role-2': 'B', 'anatomy-1': 'H', 'role-3': 'H', 'rights-1': 'C', 'rights-2': 'B', 'rights-3': 'I',
    'infection-1': 'F', 'infection-2': 'F', 'infection-3': 'F', 'infection-4': 'F',
    'safety-1': 'G', 'safety-2': 'G', 'safety-3': 'G', 'safety-4': 'G',
    'communication-1': 'D', 'communication-2': 'D',
    'personal-care-1': 'E', 'personal-care-2': 'E', 'personal-care-3': 'E', 'personal-care-4': 'E', 'personal-care-5': 'E', 'personal-care-6': 'E',
    'nutrition-1': 'E', 'nutrition-2': 'E',
    'vitals-1': 'H', 'vitals-2': 'H', 'mobility-1': 'H', 'mobility-2': 'H', 'documentation-1': 'H',
    'documentation-2': 'B', 'dementia-1': 'K', 'dementia-2': 'K', 'dementia-5': 'K', 'dementia-6': 'J', 'dementia-3': 'J', 'dementia-4': 'H',
    // skills-1 / skills-2 are test-taking tips, not exam content: excluded.
  };
  const DUTY_OVERRIDES = {
    'role-1#2': 'A',   // who supervises nurse aides — healthcare team (Duty A.2)
    'rights-2#1': 'C', // knock before entering — privacy (Duty C)
  };
  const dutyOf = (q) => q.duty || DUTY_OVERRIDES[q.id] || DUTY_BY_LESSON[q.lesson] || null;

  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const POSITIONAL_CHOICE = /\b(all|none|both)\s+of\s+the\s+above|\b[A-D]\s+and\s+[A-D]\b/i;

  /** Display index order for choices so legacy MC answers aren't skewed to slot B (~60%). */
  function choiceOrder(q, rand) {
    const idx = (q && Array.isArray(q.choices) ? q.choices : []).map((_, i) => i);
    if (!q || q.type === 'tf' || idx.length <= 2 || q.choices.some((c) => POSITIONAL_CHOICE.test(c))) return idx;
    return (rand || shuffle)(idx);
  }

  /** Build a 70-question practice exam following the Oklahoma blueprint. If an area does not have enough
   * questions yet, the gap is filled from other areas and reported in `shortages` (shown to the user). */
  function build(questions, rand) {
    const pick = rand || shuffle;
    const pool = {};
    for (const q of questions) { const d = dutyOf(q); if (d) (pool[d] = pool[d] || []).push(q); }
    const chosen = [], shortages = [], used = new Set();
    for (const d of duties) {
      const avail = pick(pool[d.id] || []);
      const take = avail.slice(0, d.count);
      take.forEach((q) => { chosen.push(q); used.add(q.id); });
      if (take.length < d.count) shortages.push({ duty: d.id, title: d.title, have: take.length, need: d.count });
    }
    if (chosen.length < TOTAL) {
      const rest = pick(questions.filter((q) => dutyOf(q) && !used.has(q.id)));
      chosen.push(...rest.slice(0, TOTAL - chosen.length));
    }
    return { questions: pick(chosen), shortages };
  }

  /** Score by duty area. */
  function breakdown(questions, answers) {
    const by = {};
    duties.forEach((d) => { by[d.id] = { duty: d, total: 0, correct: 0 }; });
    questions.forEach((q, i) => { const d = dutyOf(q); if (!d || !by[d]) return; by[d].total++; if (answers[i] === q.answer) by[d].correct++; });
    return duties.map((d) => by[d.id]);
  }

  const api = { sources, facts, duties, TOTAL, MINUTES, PASS, DUTY_BY_LESSON, DUTY_OVERRIDES, dutyOf, choiceOrder, build, breakdown };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.CNA = root.CNA || {}; root.CNA.exam = api; }
})(typeof self !== 'undefined' ? self : this);
