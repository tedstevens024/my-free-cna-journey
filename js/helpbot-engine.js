/* Offline question matcher for the help chat.
 * Pure JavaScript, no network, no model file: BM25 ranking over word stems plus a synonym list,
 * so "BP" finds "blood pressure" and "washing hands" finds "handwashing". It only ever returns
 * text that already exists in the app, so it cannot make anything up.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.CNA = root.CNA || {}; root.CNA.helpEngine = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STOP = new Set(('a an and are as at be been but by can could do does did for from had has have how i if in into is it its ' +
    'me my of on or our should so than that the their them then there these they this to too us was we were what when where which ' +
    'who why will with without would you your yours am any about tell explain mean means meaning please know need want help get go much many ' +
    'some just really also very thing things way ok okay hi hello hey thanks thank be being think guess someone something he she her his him cant dont wont im today best better good bad buy buying cheap money car cars use using often recommend favorite up during having myself yourself himself herself itself ourselves themselves').split(' '));

  // Each group: words that mean the same thing. Every word in a query is expanded to its whole group.
  const SYN = [
    ['bp', 'blood pressure', 'hypertension', 'systolic', 'diastolic'],
    ['temp', 'temperature', 'fever', 'thermometer'],
    ['pulse', 'heart rate', 'heartbeat', 'bpm'],
    ['respiration', 'breathing', 'breaths', 'breath', 'short of breath', 'shortness of breath', 'catch her breath', 'catch his breath', 'cant breathe'],
    ['vital', 'vitals', 'vital signs'],
    ['handwashing', 'wash hands', 'washing hands', 'hand washing', 'hand hygiene', 'sanitizer'],
    ['ppe', 'gloves', 'gown', 'mask', 'protective equipment'],
    ['cdiff', 'c diff', 'c difficile', 'difficile'],
    ['gait belt', 'transfer belt'],
    ['wheelchair', 'chair'],
    ['transfer', 'move', 'moving', 'lift', 'pivot'],
    ['fall', 'falls', 'fell', 'falling'],
    ['dementia', 'alzheimer', 'alzheimers', 'memory loss', 'confused', 'confusion'],
    ['resident', 'patient', 'client'],
    ['nurse', 'rn', 'lpn', 'charge nurse', 'supervisor'],
    ['abuse', 'neglect', 'mistreatment', 'hit', 'hitting', 'slapped', 'beaten', 'beating'],
    ['resident rights', 'residents rights', 'right to refuse', 'dignity'],
    ['restraint', 'restraints', 'bed rails', 'side rails'],
    ['choking', 'heimlich', 'abdominal thrusts', 'airway'],
    ['seizure', 'seizures', 'convulsion', 'convulsing', 'shaking', 'jerking'],
    ['stroke', 'cva'],
    ['catheter', 'foley', 'urinary catheter'],
    ['bedpan', 'urinal', 'toileting', 'elimination', 'toilet', 'bathroom'],
    ['incontinence', 'incontinent', 'wetting', 'wet the bed', 'accidents', 'leaking urine'],
    ['peri', 'perineal', 'perineal care', 'private area'],
    ['bed bath', 'bath', 'bathing', 'shower'],
    ['mouth care', 'oral care', 'teeth', 'dentures', 'brushing'],
    ['eat', 'eating', 'feeding', 'meal', 'meals', 'food', 'diet', 'nutrition'],
    ['npo', 'nothing by mouth'],
    ['fluid', 'fluids', 'intake', 'output', 'drink', 'water', 'hydration'],
    ['weight', 'weigh', 'scale'],
    ['rom', 'range of motion', 'exercise'],
    ['pressure injury', 'pressure ulcer', 'bedsore', 'bed sore', 'skin breakdown', 'decubitus'],
    ['position', 'positioning', 'reposition', 'turning', 'turn'],
    ['documentation', 'document', 'chart', 'charting', 'record', 'notes'],
    ['hipaa', 'privacy', 'confidential', 'confidentiality', 'tell my friends', 'tell friends', 'tell my family', 'talk about residents', 'gossip', 'social media', 'facebook', 'post online'],
    ['death', 'dying', 'end of life', 'hospice', 'postmortem'],
    ['infection', 'germs', 'infectious', 'contagious'],
    ['isolation', 'precautions', 'transmission'],
    ['oxygen', 'o2'],
    ['exam', 'test', 'certification test', 'state test', 'written test'],
    ['skills test', 'clinical test', 'skills exam'],
    ['adl', 'adls', 'activities of daily living'],
    ['stockings', 'compression', 'ted hose', 'anti embolism'],
    ['abbreviation', 'abbreviations', 'acronym', 'stand for', 'stands for'],
    ['shift', 'work', 'job', 'schedule'],
    ['backup', 'back up', 'save', 'export', 'restore'],
    ['delete', 'remove', 'erase'],
    // Added at the END so earlier group numbers stay the same. "hurt my back" -> the body mechanics lesson.
    ['hurt', 'hurting', 'injure', 'injured', 'strain', 'body mechanics'],
    ['988', 'crisis line', 'crisis lifeline', 'hotline', 'suicide hotline', 'lifeline', 'crisis text line'],
    ['cost', 'costs', 'fee', 'fees', 'price', 'pay', 'charge'],
    ['talk', 'talking', 'communicate', 'communicating', 'communication', 'speak', 'speaking'],
    ['bedbound', 'bed bound', 'bedridden', 'bedfast'],
    ['hearing loss', 'hard of hearing', 'deaf', 'cannot hear', "can't hear", 'hearing aid', 'hearing aids'],
    ['suicide', 'suicidal', 'self harm', 'self-harm', 'want to die', 'wants to die', 'not wanting to live', 'dont want to live', 'doesnt want to live', 'end my life', 'end her life', 'end his life', 'end their life', 'kill myself', 'kill herself', 'kill himself', 'kill themselves', 'hurt myself', 'hurt herself', 'hurt himself'],
    ['mistake', 'mistakes', 'error', 'errors', 'wrong entry'],
    ['info', 'information'],
    ['tb', 'tuberculosis'],
    ['scrub hands', 'scrub my hands', 'scrubbing hands', 'wash my hands', 'washing my hands', 'clean my hands', 'handwashing', 'hand hygiene'],
    ['dollar tip', 'money tip', 'cash tip', 'tip from a resident', 'tips from residents', 'tips or gifts', 'gifts of money', 'gift of money', 'accept tips', 'accept a tip', 'take a tip', 'gratuity'],
    ['immediately', 'right away', 'at once'],
    ['blind', 'vision loss', 'visually impaired', 'low vision', 'cannot see', "can't see"],
    ['bedbound', 'bed bound', 'bedridden', 'bedfast', 'residents in bed', 'confined to bed'],
    ['normal aging', 'aging', 'aging process', 'changes with age', 'older adult', 'older adults', 'elderly', 'getting old'],
    ['race', 'fire plan', 'fire safety', 'fire emergency', 'fire drill', 'in case of fire', 'pass extinguisher'],
    ['proof', 'evidence', 'what you suspect', 'suspected', 'not sure if it is abuse', 'need to be sure'],
    ['family complains', 'family complaint', 'family complaints', 'family is upset', 'family member complains', 'complains about care', 'complain about care', 'unhappy with care', 'handling complaints', 'working with families'],
  ];

  function stem(w) {
    if (w.length <= 3) return w;
    return w.replace(/(ing|edly|ed|ies|es|s|ly)$/, (m) => (m === 'ies' ? 'y' : ''));
  }
  function words(text) {
    return String(text || '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9°#%. ]+/g, ' ').replace(/\.(?!\d)/g, ' ')
      .split(/\s+/).filter(Boolean);
  }
  function tokens(text) { return words(text).filter((w) => !STOP.has(w)).map(stem); }

  // Phrase → canonical token, so multi-word synonyms collapse to one searchable token.
  const SYN_MAP = [];
  SYN.forEach((g, gi) => g.forEach((p) => SYN_MAP.push({ p: words(p).map(stem), tag: 'syn' + gi })));
  SYN_MAP.sort((a, b) => b.p.length - a.p.length);
  function withSynonyms(text) {
    const w = words(text).map(stem);
    const out = [];
    for (let i = 0; i < w.length; i++) {
      for (const s of SYN_MAP) {
        if (s.p.every((x, j) => w[i + j] === x)) { for (const s2 of SYN_MAP) { if (s2.p.length === s.p.length && s2.p.every((x, j) => w[i + j] === x)) out.push(s2.tag); } break; }
      }
    }
    return out;
  }
  function analyze(text) { return tokens(text).concat(withSynonyms(text)); }

  // For questions: a word that is part of a synonym phrase counts only through its synonym group, so
  // "shaking and jerking" (words the lessons never use) is read as "seizure" instead of two unknown words.
  function analyzeQuery(text) {
    const w = words(text).map(stem);
    const covered = new Set(), tags = [];
    for (let i = 0; i < w.length; i++) {
      for (const s of SYN_MAP) {
        if (s.p.every((x, j) => w[i + j] === x)) { for (const s2 of SYN_MAP) { if (s2.p.length === s.p.length && s2.p.every((x, j) => w[i + j] === x)) tags.push(s2.tag); } s.p.forEach((_, j) => covered.add(i + j)); break; }
      }
    }
    // Details such as numbers, weights and ages ("for someone 180 pounds", "a 70 year old") still help the
    // score, but are not required to match — the lessons give general adult ranges.
    const rest = words(text).filter((x, i) => !covered.has(i) && !STOP.has(x) && !STOP.has(stem(x)) && !DETAIL.test(x)).map(stem);
    return rest.concat(tags);
  }
  const DETAIL = /^(\d+([.,]\d+)?(lbs?|kg|yo)?|pounds?|lbs?|kilos?|kg|years?|yrs?|old|aged?|man|woman|male|female|person|people|someone|tall|weigh(s|ing)?|whats)$/;

  /* docs: [{ id, title, keywords?, body, weight? }]. Title and keywords count more than the body. */
  function build(docs) {
    const idx = docs.map((d) => {
      const tf = new Map();
      const add = (txt, w) => analyze(txt).forEach((t) => tf.set(t, (tf.get(t) || 0) + w));
      add(d.title, 3);
      add((d.keywords || []).join(' . '), 2);
      add(d.body, 1);
      add(d.context, 0.5);
      let len = 0; tf.forEach((v) => { len += v; });
      return { doc: d, tf, len };
    });
    const df = new Map();
    idx.forEach((x) => x.tf.forEach((_, t) => df.set(t, (df.get(t) || 0) + 1)));
    const avg = idx.reduce((s, x) => s + x.len, 0) / Math.max(1, idx.length);
    return { idx, df, avg, N: idx.length };
  }

  function idf(I, t) { const n = I.df.get(t) || 0; return Math.log(1 + (I.N - n + 0.5) / (n + 0.5)); }

  /* Returns ranked hits with score and coverage (share of the question's meaning the doc matched, 0–1). */
  function search(I, query, limit) {
    // Score with every word and synonym; measure coverage only over the words that carry meaning on their own
    // (a word inside a synonym phrase is represented by its synonym group, so an unknown synonym word costs nothing).
    const q = Array.from(new Set(analyze(query)));
    const need = Array.from(new Set(analyzeQuery(query)));
    if (!q.length || !need.length) return [];
    const known = need.filter((t) => I.df.has(t));
    if (!known.length) return [];
    const totalIdf = known.reduce((s, t) => s + idf(I, t), 0) || 1;
    const knownShare = Math.sqrt(known.length / need.length);
    const needSet = new Set(known);
    const k1 = 1.2, b = 0.75;
    const hits = [];
    I.idx.forEach((x) => {
      let score = 0, matched = 0;
      q.forEach((t) => {
        const f = x.tf.get(t);
        if (!f) return;
        const w = idf(I, t);
        if (needSet.has(t)) matched += w;
        score += w * (f * (k1 + 1)) / (f + k1 * (1 - b + b * (x.len / I.avg)));
      });
      if (score > 0) hits.push({ doc: x.doc, score: score * (x.doc.weight || 1), coverage: (matched / totalIdf) * knownShare });
    });
    hits.sort((a, b2) => b2.score - a.score);
    return hits.slice(0, limit || 5);
  }

  return { build, search, analyze, analyzeQuery, tokens, SYN };
});
