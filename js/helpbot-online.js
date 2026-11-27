/* Optional online AI for the help chat (Google Gemini API, free tier).
 *
 * OFF until the user turns it on and pastes their OWN free API key (More → Settings → Online AI helper).
 * The key is kept only on this phone (localStorage), never in backup files and never in the app's code.
 * The AI is told to answer ONLY from the app text we send with the question (lesson sections, key points,
 * skills, abbreviations, app-help answers), and the chat always shows which lessons it used plus their
 * official sources. If the phone is offline, the key is missing/wrong, or anything fails, the chat quietly
 * uses its offline answer instead.
 * Google's free tier may use what is sent to improve Google's products — the settings screen says so.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.CNA = root.CNA || {}; root.CNA.helpOnline = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/';
  // Free-tier models listed on Google's official pricing page (checked 2026-11-23). First that works is used.
  const MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash-lite']; // built-in fallback list
  // Automatic model choice (user rule 2026-11-25): once a week (or when a model is retired) the app asks Google which
  // Gemini models exist and uses the newest free "Flash" and "Flash-Lite" models. The model that answered last is tried
  // first, so a slow or busy model doesn't make every answer wait.
  const K_MODELS = 'cna-ai-models', K_GOOD = 'cna-ai-good-model', WEEK = 7 * 864e5;
  // Stable model names only: "gemini-3.8-flash", "gemini-3.5-flash-lite", or with a numbered suffix ("-001").
  function versionOf(id) { const m = id.match(/^gemini-(\d+)(?:\.(\d+))?-flash(-lite)?(?:-\d{3})?$/); return m ? +m[1] + (+(m[2] || 0)) / 100 : null; }
  const isLite = (n) => /-flash-lite(?:-\d{3})?$/.test(n);
  function pickModels(names) {
    const ok = names.map((n) => String(n).replace(/^models\//, '')).filter((n) => versionOf(n) != null);
    // newest version first; for the same version prefer the plain name over a numbered one
    const best = (lite) => ok.filter((n) => isLite(n) === lite).sort((a, b) => versionOf(b) - versionOf(a) || a.length - b.length)[0];
    return [best(false), best(true)].filter(Boolean);
  }
  // A short fingerprint of the key (never the key itself) so a saved model list belongs to the key that found it.
  function keyTag(key) { let h = 0; for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) | 0; return String(h); }
  async function refreshModels(key, force) {
    const s = store(); let saved = null;
    try { saved = JSON.parse((s && s.getItem(K_MODELS)) || 'null'); } catch (e) { saved = null; }
    if (saved && saved.tag !== keyTag(key)) saved = null;
    if (!force && saved && Date.now() - saved.at < WEEK) return saved.list;
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 8000);
      const names = [];
      let page = '';
      for (let i = 0; i < 5; i++) { // follow the next pages too
        const res = await fetch(ENDPOINT.replace(/models\/$/, 'models') + '?pageSize=1000' + (page ? '&pageToken=' + encodeURIComponent(page) : ''), { headers: { 'x-goog-api-key': key }, signal: ctrl.signal, cache: 'no-store' });
        if (!res.ok) { clearTimeout(t); return saved ? saved.list : null; }
        const data = await res.json();
        (data.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).forEach((m) => names.push(m.name));
        page = data.nextPageToken || ''; if (!page) break;
      }
      clearTimeout(t);
      const list = pickModels(names);
      if (list.length && s) s.setItem(K_MODELS, JSON.stringify({ at: Date.now(), list, tag: keyTag(key) }));
      return list.length ? list : (saved ? saved.list : null);
    } catch (e) { return saved ? saved.list : null; }
  }
  // The weekly list lookup never makes a question wait if a list is already saved: it refreshes in the background.
  async function modelOrder(key, force) {
    const s = store(); let saved = null;
    try { saved = JSON.parse((s && s.getItem(K_MODELS)) || 'null'); } catch (e) { saved = null; }
    let found;
    if (!force && saved && saved.tag === keyTag(key)) { found = saved.list; if (Date.now() - saved.at >= WEEK) refreshModels(key, true); }
    else found = (await refreshModels(key, force)) || [];
    const all = [...new Set(found.concat(MODELS))];
    let good = null; try { good = JSON.parse((s && s.getItem(K_GOOD)) || 'null'); } catch (e) { good = null; }
    // The model that answered last is tried first for 6 hours only, so a newer or stronger model gets its turn again.
    return good && good.m && Date.now() - good.at < 6 * 3600000 && all.includes(good.m) ? [good.m].concat(all.filter((m) => m !== good.m)) : all;
  }
  function rememberGood(model) { const s = store(); try { if (s) s.setItem(K_GOOD, JSON.stringify({ m: model, at: Date.now() })); } catch (e) { /* ignore */ } }
  // Errors that are not the key's fault: retired model (404), free limit (429), Google server trouble (500-504), too slow.
  // 400/403 that are NOT "invalid key" (e.g. a model this key may not use) also go to the next model.
  const RETRY = (e) => e === 404 || e === 429 || e === 400 || e === 403 || (typeof e === 'number' && e >= 500 && e <= 504) || e === 'timeout'; // stronger model first; lighter one if busy/limited
  const K_ON = 'cna-ai-on', K_KEY = 'cna-ai-key';
  const TIMEOUT_MS = 22000;              // per model; at most 2 models per question, so an answer never waits ~45 s+              // the stronger model can take 10-25 s with several official passages
  const NOT_FOUND = 'NOT_IN_APP';

  const SYSTEM = [
    'You are the help assistant inside "My Free CNA Journey", a study app for the Oklahoma nurse aide (CNA) exam.',
    'The APP TEXT items come from several official sources; each item says which one in its label: the app\'s Oklahoma lessons and app help,',
    'Oklahoma\'s official documents (OSDH Course Standards and definitions), federal nursing-home rules (42 CFR), U.S. government health pages',
    '(NIA/NIH, OSHA, AHRQ, SAMHSA, Alzheimers.gov), MedlinePlus (NIH), and FDA drug labels.',
    'Before answering, read ALL the items and compare what they say. Combine the facts that agree into one clear answer, using every item that helps.',
    'Which source wins: for anything the Oklahoma exam tests (procedures, steps, normal ranges, CNA role), the Oklahoma lessons and Oklahoma documents decide.',
    'Federal rules decide legal requirements. For medicines, use the FDA label. For general health topics the lessons do not cover, use the U.S. government pages and MedlinePlus.',
    'If two sources disagree, give the Oklahoma answer first and then add one short sentence such as "Another official source (MedlinePlus) says …" — never hide a disagreement and never blend two different numbers into one.',
    'For medicines: explain what it is used for and what a nurse aide should watch for and report. Never give doses or tell anyone to start, stop or change a medicine.',
    'If the question is not about nurse aide work, health, caring for residents, the CNA exam or using this app (for example recipes, sports, shopping, weather), reply with exactly ' + NOT_FOUND + ' even if a word in it appears in the APP TEXT.',
    'Answer ONLY with information found in the APP TEXT items given with the question. Do not use outside knowledge.',
    'Never add medical facts, numbers, steps, drug or treatment advice that are not in the APP TEXT.',
    'For questions about using the app, explain which tab, screen and buttons to use, exactly as the APP TEXT describes. Never invent app features.',
    'If the question adds a personal detail such as weight, height, sex or age (for example "for someone 180 pounds") and the APP TEXT gives a normal range for adults, START by saying plainly that this normal range is the same for all adults whatever their weight (or that detail), then give the range.',
    'If the APP TEXT answers only PART of the question, answer that part. Do not suggest that a missing detail exists (for example, do not say "the lessons do not list it by weight"); just state what the lessons say, e.g. "The lessons give one normal range for adults."',
    'On the line before the USED line, write COVERED: FULL if the APP TEXT fully answers the question, or COVERED: PARTIAL if part of the question (such as a detail about weight, age or a condition) is not covered.',
    'Reply with exactly ' + NOT_FOUND + ' and nothing else ONLY if nothing in the APP TEXT is related to the question.',
    'If the question is about a specific real resident or a real emergency, tell them to get the nurse right away (call 911 outside work), then answer from the APP TEXT if it helps.',
    'Write for an adult learner: short, kind, plain words, under 150 words. Plain text only — no markdown, no bullet symbols other than "- ".',
    'On the very last line write USED: followed by the numbers of EVERY APP TEXT item you took a fact from, including items that agree with each other, for example USED: 2,5,11',
  ].join('\n');

  // Step 2, only when the lessons do not cover the question: official MedlinePlus (NIH) health-topic text.
  const SYSTEM_GENERAL = [
    'You are the help assistant inside a study app for the Oklahoma nurse aide (CNA) exam.',
    'The app\'s lessons did not cover this question. Answer ONLY with information found in the MEDLINEPLUS TEXT items',
    '(official health information from the U.S. National Library of Medicine). Do not use outside knowledge, and never invent numbers.',
    'If the MEDLINEPLUS TEXT answers part of the question, answer that part and say what it does not cover.',
    'Reply with exactly ' + NOT_FOUND + ' and nothing else ONLY if nothing in the MEDLINEPLUS TEXT is related.',
    'This is general health information, not a diagnosis. For a real person\'s symptoms, say to ask the nurse or a doctor (911 in an emergency).',
    'Remember nurse aides do not give medications, diagnose or change treatments; they observe and report to the nurse.',
    'Short, kind, plain words, under 120 words. Plain text only — no markdown.',
    'On the very last line write USED: followed by the numbers of the MEDLINEPLUS TEXT items you used, for example USED: 1',
  ].join('\n');

  // Step 3, for medicine questions: the official FDA drug label (openFDA / DailyMed).
  const SYSTEM_FDA = [
    'You are the help assistant inside a study app for the Oklahoma nurse aide (CNA) exam.',
    'Answer ONLY with information found in the FDA LABEL TEXT items (the official U.S. Food and Drug Administration drug label).',
    'Explain in plain, simple words what the medicine is used for and anything a nurse aide should watch for. Never give doses or tell anyone to start, stop or change a medicine.',
    'Always end with: Nurse aides do not give or change medications — report any side effects or changes to the nurse.',
    'If the FDA LABEL TEXT is not about the medicine asked about, reply with exactly ' + NOT_FOUND + '.',
    'Short, kind, plain words, under 120 words. Plain text only — no markdown.',
    'On the very last line write USED: followed by the numbers of the FDA LABEL TEXT items you used, for example USED: 1',
  ].join('\n');

  function store() { try { return window.localStorage; } catch (e) { return null; } }
  function settings() {
    const s = store();
    let on = false, key = '';
    try { on = !!s && s.getItem(K_ON) === '1'; key = (s && s.getItem(K_KEY)) || ''; } catch (e) { /* storage blocked */ }
    return { on, key };
  }
  function save(on, key) {
    const s = store();
    if (!s) return false;
    try {
      s.setItem(K_ON, on ? '1' : '0');
      if (key) s.setItem(K_KEY, String(key).trim()); else s.removeItem(K_KEY);
      return true;
    } catch (e) { return false; }
  }
  function ready() {
    const c = settings();
    return c.on && c.key.length >= 20 && typeof fetch === 'function' && (typeof navigator === 'undefined' || navigator.onLine !== false);
  }

  /* items: [{ label, text }] — the app text the AI may use. */
  function buildPrompt(question, items, header, maxChars) {
    const lines = items.map((it, i) => '[' + (i + 1) + '] (' + it.label + ') ' + String(it.text).replace(/\s+/g, ' ').slice(0, maxChars || 700));
    return (header || 'APP TEXT') + ':\n' + lines.join('\n') + '\n\nQUESTION: ' + String(question).slice(0, 1200);
  }

  /* Returns { text, used: [0-based indexes] }, { notFound: true } when the AI says the app does not cover it,
   * or { error: 'citation' } when the answer has no valid USED citation. Citation formats such as
   * "USED: 1,3", "Used: [1, 3].", and "USED 2" are accepted; missing, malformed, or out-of-range
   * citations fail closed so unsupported AI text is never shown as a sourced answer. */
  function parseReply(raw, count) {
    let text = String(raw || '').trim();
    if (!text) return null;
    if (/^\W*NOT_IN_APP\W*$/i.test(text) || (text.indexOf(NOT_FOUND) !== -1 && text.length < 40)) return { notFound: true };
    text = text.replace(new RegExp(NOT_FOUND, 'g'), '').trim();
    // A reply that OPENS by saying the texts don't cover it ("The provided texts do not mention metformin…") is a
    // not-found, even though the model wrote a sentence instead of NOT_IN_APP — so the chat moves on to the next source.
    // Only when nothing real follows: "The lessons do not list it by weight. For adults, … 120/80." is still an answer.
    if (/^\W*(the\s+)?(provided\s+|given\s+)?(texts?|medlineplus(\s+texts?)?|app\s+texts?|lessons?|fda\s+label(\s+texts?)?|information|sources?)\s+(provided\s+|given\s+)?(do(es)?\s+not|do(es)?n['’]t|did\s+not|contains?\s+no)\s*(mention|contain|include|cover|say|discuss|provide|address|list|give|describe|information)/i.test(text)) {
      const rest = text.replace(/(?:^|\n)[ \t*_]*(covered|used)[ \t*_]*:?[^\n]*/ig, '')
        .split(/(?<=[.!?])\s+/).slice(1)
        .filter((sen) => !/(ask (the )?(nurse|doctor|pharmacist)|call 911|nurse aides do not|consult|talk to)/i.test(sen))
        .join(' ').trim();
      if (rest.length < 25) return { notFound: true };
    }
    // "COVERED: PARTIAL" (any position, any case) → the chat adds MedlinePlus for the rest.
    let partial = false;
    text = text.replace(/(?:^|\n)[ \t*_]*covered[ \t*_]*:?[ \t*_]*(full|partial)[ \t*_.]*(?=\n|$)/ig, (all, k) => { if (/partial/i.test(k)) partial = true; return ''; }).trim();
    let used = [];
    const m = text.match(/(?:^|\n)[ \t*_]*used[ \t*_]*:?[ \t*_]*\[?([0-9][0-9,\s and]*)\]?\.?[ \t*_]*$/i);
    if (!m) return { error: 'citation' };
    const nums = (m[1].match(/\d+/g) || []).map(Number);
    if (!nums.length || nums.some((n) => n < 1 || n > count)) return { error: 'citation' };
    used = Array.from(new Set(nums.map((n) => n - 1)));
    text = text.slice(0, m.index).trim();
    text = text.replace(/\*\*|__|`/g, '').replace(/^#+\s*/gm, '').trim();
    // Drop sentences like "The lessons do not list blood pressure by weight." — they suggest a missing number
    // exists. Kept only if nothing else would be left.
    const MISSING = /(^|[.!?]\s+|\n)\s*(the\s+)?(lessons?|app|text|app text|medlineplus( text)?)\s+(do(es)?\s+not|do(es)?n['’]t)\s+(list|give|include|cover|mention|say|provide|show)[^.!?\n]*[.!?]?/gi;
    const trimmed = text.replace(MISSING, (all, lead) => (lead && lead.trim() ? lead.replace(/\s+$/, ' ') : '')).replace(/\s{2,}/g, ' ').trim();
    if (trimmed.length >= 25) text = trimmed;
    text = text.replace(/^(hello|hi|hey)( there)?[!,.]\s*/i, '');   // no chatty greeting before the answer
    if (!text) return null;
    const out = { text: text.slice(0, 1500), used: Array.from(new Set(used)) };
    if (partial) out.partial = true;
    return out;
  }

  async function callModel(model, key, prompt, system) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), TIMEOUT_MS) : null;
    try {
      const res = await fetch(ENDPOINT + encodeURIComponent(model) + ':generateContent', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system || SYSTEM }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }, // room for the model's thinking + the answer
        }),
        signal: ctrl ? ctrl.signal : undefined,
        cache: 'no-store',
      });
      if (!res.ok) {
        // Only Google's own "invalid key" answer means the key is wrong; other 400/403s are about the model.
        let body = ''; try { body = await res.text(); } catch (e) { /* ignore */ }
        return { error: (res.status === 400 || res.status === 403) && /API_KEY_INVALID|API key not valid|API key expired/i.test(body) ? 'badkey' : res.status };
      }
      const data = await res.json();
      const cand = (data.candidates || [])[0] || {};
      const parts = (cand.content || {}).parts || [];
      const text = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
      if (!text.trim()) return { error: cand.finishReason === 'SAFETY' ? 'safety' : 'empty' };
      return { text };
    } catch (e) {
      return { error: e && e.name === 'AbortError' ? 'timeout' : 'network' };
    } finally { if (timer) clearTimeout(timer); }
  }

  /* Ask the AI. Returns { text, used } | { error } | null (not answerable from app text). */
  /* mode 'general' = step 2 (MedlinePlus text instead of lesson text). */
  async function ask(question, items, mode) {
    const c = settings();
    if (!ready()) return { error: 'off' };
    const general = mode === 'general', fda = mode === 'fda';
    const prompt = fda ? buildPrompt(question, items, 'FDA LABEL TEXT', 1200) : general ? buildPrompt(question, items, 'MEDLINEPLUS TEXT', 1500) : buildPrompt(question, items, 'APP TEXT', 1000);
    const system = fda ? SYSTEM_FDA : general ? SYSTEM_GENERAL : SYSTEM;
    let last = null, retired = false;
    for (const model of (await modelOrder(c.key)).slice(0, 2)) {
      const r = await callModel(model, c.key, prompt, system);
      if (r.error === 404) retired = true;
      if (RETRY(r.error)) { last = r; continue; } // retired, over its free limit, Google server trouble (5xx) or too slow: try the next
      if (r.error) return r;
      rememberGood(model);
      if (retired) refreshModels(c.key, true); // a model was retired: look up the current list for next time
      return parseReply(r.text, items.length);
    }
    if (retired) refreshModels(c.key, true);
    return last || { error: 'model' };
  }

  /* Quick check from the settings screen: does this key work? Google server trouble (5xx), a busy model or a used-up
     free limit on one model is not the key's fault, so the next model is tried and the most useful error is returned. */
  async function testKey(key) {
    let last = null;
    for (const model of await modelOrder(String(key).trim(), true)) {
      const r = await callModel(model, String(key).trim(), 'Reply with the single word OK.');
      if (RETRY(r.error)) { if (!last || last.error === 404) last = r; continue; }
      if (r.error) return { ok: false, error: r.error };
      rememberGood(model);
      return { ok: true, model };
    }
    return { ok: false, error: last && last.error !== 404 ? last.error : 'model' };
  }

  return { settings, save, ready, buildPrompt, parseReply, ask, testKey, MODELS, pickModels, modelOrder, SYSTEM, SYSTEM_GENERAL, SYSTEM_FDA, NOT_FOUND };
});
