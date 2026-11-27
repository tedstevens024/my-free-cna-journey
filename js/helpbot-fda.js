/* Live medicine information from the U.S. Food and Drug Administration (openFDA drug labels).
 * Free, official, no key, allowed from phones (CORS). Used by the help chat when a question names a medicine and
 * the lessons, Oklahoma's Course Standards and MedlinePlus don't cover it. Needs internet.
 * Every answer links the official label on DailyMed (U.S. National Library of Medicine).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.CNA = root.CNA || {}; root.CNA.helpFda = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const API = 'https://api.fda.gov/drug/label.json';
  const SKIP = new Set(('what is are does do the a an for used use uses about tell me side effects effect take taking medicine medication ' +
    'medicines medications drug drugs pill pills dose dosage resident patient someone they their when why how can should would ' +
    'with without and or of to in on it its this that give given normal blood pressure sugar pain high low ' +
    // Everyday words that are also inside some product names ("common" matched a wart remover for COMMON warts).
    'common most more much many some other main serious severe mild usual usually side interact interactions interaction ' +
    'food foods drink after before during morning night daily older adults adult elderly people person nurse aide aides ' +
    'safe safely okay crush crushed swallow could does makes make cause causes caused warning warnings sign signs symptom ' +
    'symptoms reaction reactions allergic allergy mixed mixing every hour hours ever also just like need needs need know ' +
    'from have been being which what whats there these those your mine help care stop start missed miss').split(' '));
  const cache = new Map();

  /* Words in the question that could be a medicine name (4+ letters, not common words). */
  function candidates(q) {
    return Array.from(new Set(String(q).toLowerCase().replace(/[^a-z0-9 -]+/g, ' ').split(/\s+/)
      .filter((w) => w.length >= 4 && !SKIP.has(w) && !/^\d+$/.test(w)))).slice(0, 4);
  }
  function first(r, key, n) { const v = r[key]; return Array.isArray(v) && v[0] ? String(v[0]).replace(/\s+/g, ' ').trim().slice(0, n) : ''; }
  function dateOf(s) { return /^\d{8}$/.test(s || '') ? s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8) : ''; }

  async function fetchJson(url) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 8000) : null;
    try {
      const r = await fetch(url, { signal: ctrl ? ctrl.signal : undefined, cache: 'no-store' });
      return r.ok ? await r.json() : null;
    } catch (e) { state.noNetwork = true; return null; } finally { if (timer) clearTimeout(timer); }
  }
  // noNetwork: the last lookup could not reach the FDA at all (no signal), so the chat can say so instead of "not found".
  const state = { noNetwork: false };

  /* → { name, generic, setId, date, url, sections: [{ label, text }] } or null. */
  /* How well a label's drug name matches the word: 3 = a generic name starts with it ("metformin" → METFORMIN
     HYDROCHLORIDE), 2 = a brand name starts with it, 1 = the word only appears inside a longer name (weak, e.g. a
     product description), 0 = no match. */
  function quality(r, w) {
    const gen = ((r.openfda && r.openfda.generic_name) || []).map((n) => n.toLowerCase());
    const brand = ((r.openfda && r.openfda.brand_name) || []).map((n) => n.toLowerCase());
    if (gen.some((n) => n === w || n.startsWith(w + ' ') || n.startsWith(w + ','))) return 3;
    if (brand.some((n) => n === w || n.startsWith(w + ' '))) return 2;
    return gen.concat(brand).some((n) => n.indexOf(w) !== -1) ? 1 : 0;
  }

  async function lookup(q) {
    state.noNetwork = false;
    if (typeof fetch !== 'function') return null;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { state.noNetwork = true; return null; }
    // Check every candidate word and keep the best-matching label, so an everyday word that happens to be inside a
    // product name never wins over the real medicine name later in the question.
    let best = null;
    for (const w of candidates(q)) {
      if (cache.has(w)) { const c = cache.get(w); if (c && (!best || c.q > best.q)) best = c; if (best && best.q === 3) break; continue; }
      const term = encodeURIComponent('"' + w + '"');
      const d = await fetchJson(API + '?search=openfda.generic_name:' + term + '+openfda.brand_name:' + term + '&limit=5');
      if (!d && state.noNetwork) break; // no signal: stop, and don't remember this word as "no such medicine"
      const results = (d && d.results) || [];
      const named = results.map((r) => ({ r, q: quality(r, w) })).filter((x) => x.q >= 2);
      // Best match first; among equals, the shortest generic name (single ingredient beats combinations).
      named.sort((a, b) => b.q - a.q || String((a.r.openfda.generic_name || [''])[0]).length - String((b.r.openfda.generic_name || [''])[0]).length);
      const r = named[0] && named[0].r;
      if (!r) { cache.set(w, null); continue; }
      const sections = [
        { label: 'What it is used for (FDA label)', text: first(r, 'indications_and_usage', 1200) },
        { label: 'Boxed warning (FDA label)', text: first(r, 'boxed_warning', 600) },
        { label: 'Use in older adults (FDA label)', text: first(r, 'geriatric_use', 700) },
        { label: 'Information for patients (FDA label)', text: first(r, 'information_for_patients', 700) },
        { label: 'Common side effects (FDA label)', text: first(r, 'adverse_reactions', 1500) },
      ].filter((s) => s.text);
      if (!sections.length) { cache.set(w, null); continue; }
      const setId = r.set_id || '';
      const out = {
        name: (r.openfda.brand_name || [w])[0], generic: (r.openfda.generic_name || [''])[0], setId,
        date: dateOf(r.effective_time),
        url: setId ? 'https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=' + encodeURIComponent(setId) : 'https://open.fda.gov/',
        sections, q: named[0].q,
      };
      cache.set(w, out);
      if (!best || out.q > best.q) best = out;
      if (best.q === 3) break;
    }
    return best;
  }

  return { lookup, candidates, quality, wasOffline: () => state.noNetwork };
});
