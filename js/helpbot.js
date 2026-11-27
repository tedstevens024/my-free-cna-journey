/* Help chat: a floating bubble that opens an offline "Ask me" panel.
 * Answers come only from text already in the app — the app-help list (data/helpbot-kb.js), the
 * lessons and key points (with their official sources), the skills and Oklahoma's abbreviation list.
 * Nothing is sent anywhere and nothing is saved.
 */
(function () {
  'use strict';
  const CNA = window.CNA;
  const E = CNA.helpEngine;
  let index = null, docs = null;

  const MIN_COVERAGE = 0.5;   // share of the question's important words that must match
  const MIN_SCORE = 2.2;      // BM25 score floor so one weak shared word is not "an answer"
  const MIN_SCORE_ONE_WORD = 6;
  // Meaning match: all-MiniLM-L6-v2 (quantized) run by Transformers.js + ONNX Runtime, all from app/ai/ (offline,
  // no outside requests). Tested 2026-11-23: off-topic questions score about 0.2–0.35, good matches about 0.6–0.7,
  // but some wrong picks score 0.45–0.5 — so it only overrides the word match when it is confident.
  const SEMANTIC_ENABLED = true;
  const SEM_PICK = 0.55;      // prefer the meaning match among the word matches when it is at least this close
  const SEM_RESCUE = 0.62;    // answer by meaning alone (no word match) only at this level or higher.
                              // 0.58 let "resident is being hit by family" reach a falls answer (0.60) — never again.
  const SEM_SUGGEST = 0.42;   // "Did you mean" buttons
  const URGENT = /\b(911|emergency|not breathing|cant breathe|can['’]?t breathe|chest pain|unresponsive|unconscious|suicid\w*|self[- ]?harm\w*|wants? to die|not wanting to live|(?:don['’]?t|doesn['’]?t|do not|does not) want to live|end (?:my|his|her|their) life|(?:kill|hurt|harm) (?:my|him|her|them)sel\w*|overdos\w*|severe bleeding)\b/i;

  function buildDocs() {
    const out = [];
    CNA.helpbotKB.entries.forEach((e) => {
      out.push({ id: 'app:' + e.id, kind: 'app', title: e.question, keywords: e.keywords, body: e.answer,
        answer: e.answer, link: e.link, linkLabel: e.linkLabel, weight: 1.15 });
      // Each alternate phrasing is searchable on its own (same answer), so everyday wording finds it.
      (e.alts || []).forEach((alt, n) => out.push({ id: 'app:' + e.id + '~' + n, kind: 'app', title: e.question, keywords: [], body: alt,
        embedAs: alt, answer: e.answer, link: e.link, linkLabel: e.linkLabel, weight: 1.15 }));
    });
    CNA.curriculum.lessons.forEach((l) => {
      (l.sections || []).forEach((s, i) => {
        const body = s.text || (s.list || []).join('. ');
        out.push({ id: 'les:' + l.id + ':' + i, kind: 'cna', lesson: l, title: s.h, keywords: [l.topic], context: l.title, body,
          heading: s.h, text: s.text, list: s.list });
      });
      (l.keyPoints || []).forEach((k, i) => out.push({ id: 'kp:' + l.id + ':' + i, kind: 'cna', lesson: l, title: k, context: l.title, body: '',
        heading: 'Key point', text: k, weight: 0.9 }));
    });
    CNA.skills.skills.forEach((s) => out.push({ id: 'sk:' + s.id, kind: 'skill', skill: s, title: s.title + ' skill steps how to', keywords: [s.topic],
      body: [s.why].concat(s.steps || []).join('. '), weight: 1.05 }));
    CNA.abbreviations.list.forEach((a, i) => out.push({ id: 'ab:' + i, kind: 'abbr', abbr: a, title: a.a + ' abbreviation stand for',
      body: a.m, weight: 1.3 }));
    return out;
  }

  function ensureIndex() {
    if (!index) { docs = buildDocs(); index = E.build(docs); }
    return index;
  }

  // ---------- optional on-device meaning match ----------
  // If anything fails (old phone, no WebAssembly, files missing), sem.state becomes 'failed' and the chat keeps
  // using the word matcher, which works everywhere.
  const sem = { state: 'idle', worker: null, vecs: null };
  const DIM = 384;
  const embText = (d) => d.kind === 'abbr' ? d.abbr.a + ': ' + d.abbr.m
    : d.kind === 'skill' ? 'How to ' + d.skill.title
    : d.kind === 'app' ? (d.embedAs || d.title)
    : (d.heading && d.heading !== 'Key point' ? d.heading + '. ' : '') + String(d.text || d.body || (d.list || []).join('. ')).slice(0, 400);
  // The model runs in a background thread (js/ai-worker.js): loading it and reading every lesson used to block the
  // screen for many seconds on a phone. Each call here is one message to the worker.
  let callId = 0;
  const pending = new Map();
  function work(msg) {
    return new Promise((resolve, reject) => {
      const id = ++callId;
      pending.set(id, { resolve, reject });
      sem.worker.postMessage(Object.assign({ id }, msg));
    });
  }
  function startWorker() {
    const w = new Worker(new URL('js/ai-worker.js', document.baseURI).href, { type: 'module' });
    w.onmessage = (ev) => {
      const m = ev.data || {}, p = pending.get(m.id);
      if (!p) return;
      pending.delete(m.id);
      if (m.ok) p.resolve(m); else p.reject(new Error(m.error || 'worker error'));
    };
    w.onerror = (e) => { pending.forEach((p) => p.reject(new Error('worker failed'))); pending.clear(); if (e && e.preventDefault) e.preventDefault(); };
    return w;
  }
  async function embedMany(texts) {
    return (await work({ type: 'embed', texts })).vecs;
  }
  function dot(a, b) { let t = 0; for (let i = 0; i < a.length; i++) t += a[i] * b[i]; return t; }
  function hash(str) { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

  async function loadSemantic(onReady) {
    if (!SEMANTIC_ENABLED || sem.state !== 'idle' || typeof WebAssembly === 'undefined') return;
    sem.state = 'loading';
    try {
      if (typeof Worker === 'undefined') throw new Error('no background threads');
      ensureIndex();
      const base = new URL('.', document.baseURI).href;
      sem.worker = startWorker();
      await work({ type: 'init', base, modelPath: new URL('ai/models/', document.baseURI).pathname });
      const texts = docs.map(embText);
      const key = base + '__vecs/minilm-' + hash(texts.join('|'));
      let saved = null;
      try { const c = await caches.open('cna-ai-vecs'); const r = await c.match(key); if (r) saved = await r.json(); } catch (e) { /* no cache: compute */ }
      if (saved && saved.length === texts.length) sem.vecs = saved.map((v) => Float32Array.from(v));
      else {
        const out = [];
        for (let i = 0; i < texts.length; i += 16) out.push(...await embedMany(texts.slice(i, i + 16)));
        sem.vecs = out;
        try {
          const c = await caches.open('cna-ai-vecs');
          await Promise.all((await c.keys()).map((k) => c.delete(k)));
          await c.put(key, new Response(JSON.stringify(out.map((v) => Array.from(v, (x) => Math.round(x * 1e4) / 1e4)))));
        } catch (e) { /* fine: computed again next time */ }
      }
      sem.state = 'ready';
      if (onReady) onReady();
    } catch (e) {
      sem.state = 'failed';
      try { if (sem.worker) sem.worker.terminate(); } catch (x) { /* ignore */ }
      if (window.console) console.warn('Help chat: meaning match unavailable, using word match only.', e);
    }
  }
  async function queryVec(q) {
    if (sem.state !== 'ready') return null;
    try { return (await embedMany([String(q).slice(0, 300)]))[0]; } catch (e) { return null; }
  }

  /* q = the question; qv = its meaning vector when the model is ready (otherwise word match only). */
  function answer(q, qv) {
    let hits = E.search(ensureIndex(), q, 10);
    const ranked = qv && sem.vecs ? docs.map((d, i) => ({ doc: d, sim: dot(qv, sem.vecs[i]) })).sort((a, b) => b.sim - a.sim) : null;
    // A one-word question ("time", "tired") needs a much stronger match before it counts as an answer.
    const knownWords = Array.from(new Set(E.analyzeQuery(q))).filter((t) => index.df.has(t)).length;
    const floor = knownWords <= 1 ? MIN_SCORE_ONE_WORD : MIN_SCORE;
    const passes = (h) => h.coverage >= MIN_COVERAGE && h.score >= floor && (h.doc.kind !== 'app' || (h.score >= 6.6 && (knownWords >= 2 || h.coverage >= 0.9 || h.score >= 9)));
    if (ranked && hits.length) {
      // Among the word matches, put a confident meaning match first ("choking" → the Choking section).
      const top = ranked[0];
      const i = hits.findIndex((h) => h.doc.id === top.doc.id);
      if (top.sim >= SEM_PICK && i > 0 && top.doc.kind !== 'abbr' && passes(hits[i])) hits = [Object.assign({}, hits[i], { sim: top.sim })].concat(hits.filter((_, k) => k !== i));
    }
    // The top word match may fail the bar (e.g. a skill that only shares "temperature") while the next one is a full
    // match ("normal" + "temperature" in the vital-signs lesson): use the best match that passes, not only the first.
    // Among passing matches, prefer the one whose OWN text (not just its lesson title) has the question's words:
    // "normal temperature" -> the temperature list, not the pulse key point that only shares the lesson title.
    const qt = Array.from(new Set(E.analyzeQuery(q)));
    const own = (h) => { const t = new Set(E.analyze((h.doc.title || '') + ' ' + (h.doc.keywords || []).join(' ') + ' ' + (h.doc.body || ''))); return qt.length ? qt.filter((x) => t.has(x)).length / qt.length : 0; };
    // Only as a tie-break among CLOSE scores (within 70% of the best passing one), so a strong title match like the
    // "Choking" section is never overtaken by a long skill that happens to mention choking.
    const pass0 = hits.filter(passes);
    const topPass = pass0.length ? pass0[0].score : 0;
    const kpRank = (x, y) => (x.h.doc.kind === 'cna' && y.h.doc.kind === 'cna' && x.h.score >= topPass * 0.9 && y.h.score >= topPass * 0.9) ? ((x.h.doc.id.startsWith('kp:') ? 1 : 0) - (y.h.doc.id.startsWith('kp:') ? 1 : 0)) : 0;
    const passing = pass0.map((h, i) => ({ h, i, o: h.score >= topPass * 0.7 ? own(h) : -1 })).sort((x, y) => y.o - x.o || kpRank(x, y) || x.i - y.i);
    const best = passing.length ? passing[0].h : hits[0];
    // App-help answers ("Where are the skills checklists?") win only when the question is about USING the app; a CNA
    // question ("how many skills are on the skills test") goes to a close-scoring lesson instead.
    if (best && best.doc.kind === 'app' && !APP_INTENT.test(q)) {
      const lessonHit = passing.map((x) => x.h).find((h) => h.doc.kind !== 'app' && h.score >= best.score * 0.75);
      if (lessonHit) { hits = [lessonHit].concat(hits.filter((h) => h !== lessonHit)); return answerFrom(lessonHit, hits, q, passes); }
    }
    const ok = best && passes(best);
    if (!ok && ranked && ranked[0].sim >= SEM_RESCUE) {
      // The words did not match but the meaning clearly does ("what if I forget to study one day").
      const b = { doc: ranked[0].doc, score: 0, coverage: 1, sim: ranked[0].sim, byMeaning: true };
      const rel = uniqueRel(ranked.slice(1).filter((r) => r.sim >= SEM_RESCUE - 0.08), b).slice(0, 2);
      return { hit: b, related: rel, urgent: URGENT.test(q) };
    }
    if (!ok && ranked) {
      const sug = uniqueRel(ranked.filter((r) => r.sim >= SEM_SUGGEST)).slice(0, 3);
      return { hit: null, related: sug, urgent: URGENT.test(q) };
    }
    const related = ok ? uniqueRel(hits.filter((h) => h !== best).filter((h) => h.score >= best.score * 0.55 && h.coverage >= MIN_COVERAGE), best).slice(0, 2)
      : uniqueRel(hits.filter((h) => h.coverage >= MIN_COVERAGE && h.score >= MIN_SCORE)).slice(0, 3);
    return { hit: ok ? best : null, related, urgent: URGENT.test(q) };
  }
  const APP_INTENT = /\b(where|find|open|add|edit|change|set|delete|remove|tap|button|screen|page|app|my|backup|restore|see|show|calendar|shifts?|schedule|reminders?|notifications?|tour|settings?|key|plan|study|practice|quiz|score|progress|notes?|tab)\b|\bturn\s+(?:on|off)\b[^?.!]*\b(ai|helper|key|notifications?|reminders?|dark\s*mode|online|chat)\b|\b(ai|helper|key|notifications?|reminders?|dark\s*mode|online|chat)\b[^?.!]*\bturn\s+(?:on|off)\b/i;
  function answerFrom(best, hits, q, passes) {
    const related = uniqueRel(hits.filter((h) => h !== best).filter((h) => h.score >= best.score * 0.55 && h.coverage >= MIN_COVERAGE), best).slice(0, 2);
    return { hit: best, related, urgent: URGENT.test(q) };
  }
  function uniqueRel(list, best) {
    const seen = new Set(best ? [relTitle(best)] : []);
    return list.filter((h) => { const t = relTitle(h); if (seen.has(t)) return false; seen.add(t); return true; });
  }
  function relTitle(h) {
    const d = h.doc;
    if (d.kind === 'app') return d.title;
    if (d.kind === 'skill') return 'How to: ' + d.skill.title;
    if (d.kind === 'abbr') return 'What does ' + d.abbr.a.replace(/\s*\(.*\)$/, '') + ' mean?';
    return d.lesson.title + (d.heading && d.heading !== 'Key point' ? ' — ' + d.heading : '');
  }

  // ---------- rendering ----------
  function sourcesHtml(lessonId) {
    const esc = CNA.app.esc;
    // Oklahoma's source first, then topic sources (NHLBI, MedlinePlus, CDC...); general training regulations
    // (42 CFR 483.15x) only if nothing else is listed.
    const all = CNA.sources.forLesson(lessonId) || [];
    const id = (x) => String(x.id || '');
    const ok = all.find((x) => /^ok/.test(id(x)));
    let list = [ok].concat(all.filter((x) => !/^ok/.test(id(x)) && !/^cfr/.test(id(x)))).filter(Boolean).slice(0, 3);
    if (!list.length) list = all.slice(0, 3);
    if (!list.length) return '';
    return '<div class="chat-src"><span class="small muted">Official sources:</span> ' + list.map((s) =>
      '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + '</a>').join(' · ') + '</div>';
  }
  function hitHtml(h) {
    const esc = CNA.app.esc, d = h.doc;
    if (d.kind === 'app') {
      return '<p>' + esc(d.answer) + '</p>' + (d.link ? '<a class="btn secondary chat-go" href="' + d.link + '">' + esc(d.linkLabel || 'Open') + '</a>' : '');
    }
    if (d.kind === 'abbr') {
      const a = d.abbr;
      return '<p><b>' + esc(a.a) + '</b> means <b>' + esc(a.m) + '</b>.' + (a.note ? ' ' + esc(a.note) : '') + '</p>' +
        '<p class="small muted">From Oklahoma\'s official abbreviation list (CareerTech study guide, page ' + CNA.abbreviations.PAGE + ').</p>' +
        '<a class="btn secondary chat-go" href="#/abbreviations">See all abbreviations</a>';
    }
    if (d.kind === 'skill') {
      const s = d.skill;
      return '<p><b>' + esc(s.title) + '</b> — ' + esc(s.why) + '</p>' +
        '<ol class="chat-steps">' + (s.steps || []).map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>' +
        '<a class="btn secondary chat-go" href="#/skill/' + encodeURIComponent(s.id) + '">Open the full skill</a>';
    }
    const l = d.lesson;
    return '<p class="small muted">From the lesson “' + esc(l.title) + '”</p>' +
      (d.heading !== 'Key point' ? '<p><b>' + esc(d.heading) + '</b></p>' : '') +
      (d.id === 'kp:dementia-5:0' && l.keyPoints ? '<ul class="chat-steps">' + l.keyPoints.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : (d.text ? '<p>' + esc(d.text) + '</p>' : '')) +
      (d.list ? '<ul class="chat-steps">' + d.list.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
      sourcesHtml(l.id) +
      '<a class="btn secondary chat-go" href="#/lesson/' + encodeURIComponent(l.id) + '">Open the lesson</a>';
  }

  const URGENT_HTML = '<div class="chat-urgent">If this is happening right now: at work, get the nurse immediately. Otherwise call 911. For a mental-health crisis, call or text 988.</div>';

  function reply(q, qv) {
    const esc = CNA.app.esc;
    const r = answer(q, qv);
    let html = '';
    if (r.urgent) html += URGENT_HTML;
    if (r.hit) html += hitHtml(r.hit);
    else {
      html += '<p>Sorry — I couldn\'t find that in the app. I only answer from this app\'s lessons and features, so I won\'t guess.</p>' +
        '<p class="small">Try different words, like “normal blood pressure”, “how to use a gait belt” or “how do I add a shift”.</p>';
    }
    if (r.related.length) {
      html += '<div class="chat-rel"><span class="small muted">' + (r.hit ? 'Related:' : 'Did you mean:') + '</span>' +
        r.related.map((h) => '<button type="button" class="chip" data-ask="' + esc(relTitle(h)) + '" data-doc="' + esc(h.doc.id) + '">' + esc(relTitle(h)) + '</button>').join('') + '</div>';
    }
    return html;
  }

  // ---------- UI ----------
  let fab, panel, log, input, open = false;

  function addMsg(who, html) {
    const m = document.createElement('div');
    m.className = 'chat-msg ' + who;
    m.innerHTML = html;
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  }
  // ---------- optional online AI (js/helpbot-online.js) ----------
  const ON = () => CNA.helpOnline;
  function itemOf(d) {
    if (d.kind === 'app') return { label: 'App help: ' + d.title, text: d.answer };
    if (d.kind === 'abbr') return { label: 'Oklahoma abbreviation list', text: d.abbr.a + ' means ' + d.abbr.m + (d.abbr.note ? '. ' + d.abbr.note : '') };
    if (d.kind === 'skill') return { label: 'Skill: ' + d.skill.title, text: [d.skill.why].concat(d.skill.steps || []).join('. ') };
    if (d.kind === 'mlp') return { label: 'MedlinePlus (NIH) health topic: ' + d.topic.t, text: String(d.topic.s).slice(0, 1000) };
    if (d.kind === 'fda') return { label: 'FDA drug label for ' + (d.label.generic || d.label.name) + ': ' + d.section.label, text: d.section.text };
    if (d.kind === 'gov') return { label: 'Official U.S. government health page: ' + d.src.t + ' (' + d.src.a + ')', text: d.snippet || d.chunk.x };
    if (d.kind === 'fed') return { label: 'Federal nursing-home rule ' + d.chunk.t + ' (42 CFR, eCFR)', text: d.snippet || d.chunk.x };
    if (d.kind === 'okcs') return { label: 'Oklahoma official Course Standards (OSDH), page ' + d.page.p, text: d.snippet || d.page.t };
    return { label: 'Lesson "' + d.lesson.title + '"' + (d.heading !== 'Key point' ? ' — ' + d.heading : ' — key point'), text: d.text || (d.list || []).join('. ') };
  }
  /* The app text sent with the question: the best word matches plus the best meaning matches. */
  function contextDocs(q, qv) {
    const out = [], seen = new Set();
    const add = (d) => { if (d && !seen.has(d.id) && out.length < 10) { seen.add(d.id); out.push(d); } };
    const words = E.search(ensureIndex(), q, 6).map((h) => h.doc);
    const meaning = qv && sem.vecs ? docs.map((d, i) => ({ d, s: dot(qv, sem.vecs[i]) })).sort((a, b) => b.s - a.s).slice(0, 6).map((x) => x.d) : [];
    for (let i = 0; i < 6; i++) { add(words[i]); add(meaning[i]); }
    const od = okDefinition(q);
    if (od) out.unshift({ id: 'okdef:' + od.term, kind: 'okcs', page: { p: od.p }, snippet: 'Oklahoma official definition: ' + okDefText(od) });
    // Each source type has its own slots (Oklahoma pages 3, federal rules 2, government pages 2), so lessons never crowd out the other official sources.
    // Oklahoma's official Course Standards: the 3 best-matching pages (best passage of each).
    okcsHits(q, 3).filter((h) => h.coverage >= 0.4).forEach((h) => {
      out.push({ id: h.doc.id, kind: 'okcs', page: h.doc.page, snippet: okcsSnippet(h.doc.page.t, q, 700) });
    });
    fedHits(q, 2).filter((h) => h.coverage >= 0.5).forEach((h) => {
      out.push({ id: h.doc.id, kind: 'fed', chunk: h.doc.chunk, snippet: okcsSnippet(h.doc.chunk.x, q, 700) });
    });
    // Same measured cutoff as the offline answer: off-topic questions ("pizza recipe") never score 8 here.
    govHits(q, 2).filter((h) => h.score >= 8 && h.coverage >= 0.3).forEach((h) => {
      out.push({ id: h.doc.id, kind: 'gov', chunk: h.doc.chunk, src: h.doc.src, snippet: okcsSnippet(h.doc.chunk.x, q, 700) });
    });
    if (out.length < 4) docs.filter((d) => d.kind === 'app').slice(0, 4).forEach(add);
    return out;
  }
  /* Everything the online AI compares for one question: the app/Oklahoma/federal/government items from contextDocs,
     plus the best MedlinePlus topics and, when the question names a medicine, the FDA label sections. */
  async function gatherAll(q, qv) {
    const [, , , mlpOk, label] = await Promise.all([loadOkcs(), loadFed(), loadGov(), loadMedline(),
      CNA.helpFda ? CNA.helpFda.lookup(q) : Promise.resolve(null)]);
    const ctx = contextDocs(q, qv);
    if (mlpOk) medlineTopicsFor(q).slice(0, 2).forEach((t) => ctx.push({ id: 'mlp:' + t.t, kind: 'mlp', topic: t }));
    if (label && fdaMatches(label, q)) label.sections.forEach((s, i) => ctx.push({ id: 'fda:' + i, kind: 'fda', label, section: s }));
    return ctx;
  }
  function linkFor(d) {
    const esc = CNA.app.esc;
    if (d.kind === 'app') return d.link ? '<a class="btn secondary chat-go" href="' + d.link + '">' + esc(d.linkLabel || 'Open') + '</a>' : '';
    if (d.kind === 'abbr') return '<a class="btn secondary chat-go" href="#/abbreviations">See all abbreviations</a>';
    if (d.kind === 'skill') return '<a class="btn secondary chat-go" href="#/skill/' + encodeURIComponent(d.skill.id) + '">Skill: ' + esc(d.skill.title) + '</a>';
    if (d.kind === 'okcs' || d.kind === 'fed' || d.kind === 'gov' || d.kind === 'mlp' || d.kind === 'fda') return '';
    return '<a class="btn secondary chat-go" href="#/lesson/' + encodeURIComponent(d.lesson.id) + '">Lesson: ' + esc(d.lesson.title) + '</a>';
  }
  function onlineHtml(r, used, urgent) {
    const esc = CNA.app.esc;
    const lesson = used.find((d) => d.lesson);
    const links = [], seenLink = new Set();
    used.forEach((d) => { const l = linkFor(d); if (l && !seenLink.has(l) && links.length < 3) { seenLink.add(l); links.push(l); } });
    return (urgent ? URGENT_HTML : '') +
      '<p class="small muted">🌐 Online AI answer, compared across ' + sourceNames(used) + '. Check the source to be sure.</p>' +
      String(r.text).split(/\n+/).map((line) => '<p>' + esc(line) + '</p>').join('') +
      (lesson ? sourcesHtml(lesson.lesson.id) : '') +
      (used.some((d) => d.kind === 'okcs') ? '<div class="chat-src"><span class="small muted">Oklahoma official:</span> ' +
        Array.from(new Set(used.filter((d) => d.kind === 'okcs').map((d) => d.page.p))).slice(0, 2).map(okcsLink).join(' · ') + '</div>' : '') +
      (used.some((d) => d.kind === 'fed') ? '<div class="chat-src"><span class="small muted">Federal rule:</span> ' +
        used.filter((d) => d.kind === 'fed').slice(0, 2).map((d) => fedLink(d.chunk)).join(' · ') + '</div>' : '') +
      (used.some((d) => d.kind === 'gov') ? '<div class="chat-src"><span class="small muted">U.S. government page:</span> ' +
        Array.from(new Map(used.filter((d) => d.kind === 'gov').map((d) => [d.src.u, d.src])).values()).slice(0, 2).map(govLink).join(' · ') + '</div>' : '') +
      (used.some((d) => d.kind === 'mlp') ? mlpLinks(Array.from(new Set(used.filter((d) => d.kind === 'mlp').map((d) => d.topic)))) : '') +
      (used.some((d) => d.kind === 'fda') ? fdaFoot(used.find((d) => d.kind === 'fda').label) : '') +
      '<div class="chat-links">' + links.join('') + '</div>';
  }
  function onlinePresentation(r, ctx, urgent) {
    if (!r || !r.text) return null;
    const used = Array.isArray(r.used) ? r.used.map((i) => ctx[i]).filter(Boolean) : [];
    if (!used.length) return { error: 'citation' };
    return { html: onlineHtml(r, used, urgent) };
  }
  /* "your lessons, Oklahoma's official documents and the FDA drug label" — the kinds of source the answer used. */
  function sourceNames(used) {
    const has = (k) => used.some((d) => k.indexOf(d.kind) !== -1);
    const names = [];
    if (used.some((d) => d.lesson || d.kind === 'skill' || d.kind === 'abbr' || d.kind === 'app')) names.push('your lessons');
    if (has(['okcs'])) names.push('Oklahoma\'s official documents');
    if (has(['fed'])) names.push('federal nursing-home rules');
    if (has(['gov'])) names.push('U.S. government health pages');
    if (has(['mlp'])) names.push('MedlinePlus (NIH)');
    if (has(['fda'])) names.push('the FDA drug label');
    if (!names.length) return 'the app\'s official sources';
    return names.length === 1 ? names[0] : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  // ---------- Oklahoma's official Course Standards (OSDH, 2008), full text by page ----------
  // js/data/ok-course-standards.js (built by tools/build_ok_reference.py), loaded only when first needed.
  const okcs = { state: 'idle', index: null, data: null, waiters: [] };
  function loadOkcs() {
    if (okcs.state === 'ready') return Promise.resolve(true);
    if (okcs.state === 'failed') return Promise.resolve(false);
    return new Promise((resolve) => {
      okcs.waiters.push(resolve);
      if (okcs.state === 'loading') return;
      okcs.state = 'loading';
      const done = (ok) => { okcs.state = ok ? 'ready' : 'failed'; okcs.waiters.splice(0).forEach((w) => w(ok)); };
      const finish = () => {
        const D = CNA.okCourseStandards;
        if (!D || !D.pages) return done(false);
        okcs.data = D;
        okcs.index = E.build(D.pages.map((pg) => ({ id: 'okcs:' + pg.p, kind: 'okcs', page: pg, title: '', body: pg.t })));
        done(true);
      };
      if (CNA.okCourseStandards) return finish();
      if (typeof document === 'undefined') return done(false);
      const s = document.createElement('script');
      s.src = 'js/data/ok-course-standards.js';
      s.onload = finish;
      s.onerror = () => done(false);
      document.head.appendChild(s);
    });
  }
  function okcsHits(q, n) { return okcs.state === 'ready' ? E.search(okcs.index, q, n || 3) : []; }
  /* The few sentences of a page that best match the question (pages are long). */
  function okcsSnippet(pageText, q, maxLen) {
    const want = new Set(E.analyzeQuery(q));
    const sents = pageText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [pageText];
    const score = sents.map((x) => E.analyze(x).filter((t) => want.has(t)).length);
    let best = 0, bestScore = -1;
    for (let i = 0; i < sents.length; i++) {
      let len = 0, sc = 0;
      for (let j = i; j < sents.length && len < (maxLen || 450); j++) { len += sents[j].length; sc += score[j]; }
      if (sc > bestScore) { bestScore = sc; best = i; }
    }
    let out = '';
    for (let j = best; j < sents.length && out.length < (maxLen || 450); j++) out += sents[j];
    return out.trim();
  }
  function okcsLink(p) {
    const esc = CNA.app.esc, D = okcs.data;
    return '<a href="' + esc(D.url) + '#page=' + p + '" target="_blank" rel="noopener">Oklahoma Course Standards, page ' + p + '</a>';
  }
  function okcsLabel(p) {
    return '📘 From Oklahoma\'s official nurse aide <b>Course Standards</b> (Oklahoma State Department of Health, 2008), page ' + p + '.';
  }
  /* "what is X", "define X", "what does X mean" → Oklahoma's own definition of X (word for word, with its page). */
  function defTerm(q) {
    const m = String(q).trim().replace(/[?.!]+$/, '').match(/^(?:what(?:'s| is| are| does)|whats|define|definition of|meaning of|what is meant by)\s+(?:a |an |the )?(.+?)(?:\s+mean(?:s)?)?$/i);
    return m ? m[1].trim() : '';
  }
  function okDefinition(q) {
    if (okcs.state !== 'ready' || !okcs.data.defs) return null;
    const t = defTerm(q);
    if (!t) return null;
    const norm = (x) => String(x).toLowerCase().replace(/['’]s\b/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/s$/, '');
    const want = norm(t);
    if (!want) return null;
    const defs = okcs.data.defs;
    const short = (d) => { const m = d.term.match(/\(([A-Za-z]{2,8})\)/); return m ? m[1].toLowerCase() : ''; }; // "Tuberculosis (TB)" → tb
    return defs.find((d) => norm(d.term) === want) || defs.find((d) => short(d) && short(d) === want.replace(/ /g, '')) ||
      defs.find((d) => { const n = norm(d.term); return n.split(' ').length <= 3 && (n.indexOf(want + ' ') === 0 || n.replace(/ disease$| infection$/, '') === want); }) || null;
  }
  function okDefText(d) { return /^(is|are|means)\b/i.test(d.def) ? d.term + ' ' + d.def.charAt(0).toLowerCase() + d.def.slice(1) : d.term + ': ' + d.def; }
  function okDefinitionHtml(q) {
    const d = okDefinition(q);
    if (!d) return '';
    const esc = CNA.app.esc;
    return '<p class="small muted">📘 Oklahoma\'s official definition — nurse aide <b>Course Standards</b> (Oklahoma State Department of Health, 2008), page ' + d.p + '.</p>' +
      '<p><b>' + esc(d.term) + '</b>' + esc(okDefText(d).slice(d.term.length)) + '</p>' +
      '<div class="chat-src"><span class="small muted">Official source:</span> ' + okcsLink(d.p) + '</div>';
  }
  /* Offline: quote the best-matching passage word for word, when the page clearly matches. */
  function okcsOfflineHtml(q) {
    const h = okcsHits(q, 1)[0];
    if (!h || h.coverage < 0.6 || h.score < 6) return '';
    const pg = h.doc.page;
    return '<p class="small muted">' + okcsLabel(pg.p) + '</p><p>' + CNA.app.esc(okcsSnippet(pg.t, q, 500)) + '</p>' +
      '<div class="chat-src"><span class="small muted">Official source:</span> ' + okcsLink(pg.p) + '</div>';
  }

  // ---------- Federal nursing-home rules (42 CFR Part 483, official eCFR) ----------
  // js/data/fed-reference.js (built by tools/build_fed_reference.py), loaded only when first needed.
  const fed = { state: 'idle', index: null, data: null, waiters: [] };
  function loadFed() {
    if (fed.state === 'ready') return Promise.resolve(true);
    if (fed.state === 'failed') return Promise.resolve(false);
    return new Promise((resolve) => {
      fed.waiters.push(resolve);
      if (fed.state === 'loading') return;
      fed.state = 'loading';
      const done = (ok) => { fed.state = ok ? 'ready' : 'failed'; fed.waiters.splice(0).forEach((w) => w(ok)); };
      const finish = () => {
        const D = CNA.fedReference;
        if (!D || !D.chunks) return done(false);
        fed.data = D;
        fed.index = E.build(D.chunks.map((c, i) => ({ id: 'fed:' + i, kind: 'fed', chunk: c, title: c.t, body: c.x })));
        done(true);
      };
      if (CNA.fedReference) return finish();
      if (typeof document === 'undefined') return done(false);
      const el = document.createElement('script');
      el.src = 'js/data/fed-reference.js';
      el.onload = finish;
      el.onerror = () => done(false);
      document.head.appendChild(el);
    });
  }
  function fedHits(q, n) { return fed.state === 'ready' ? E.search(fed.index, q, n || 2) : []; }
  function fedLink(c) {
    return '<a href="' + CNA.app.esc(c.u) + '" target="_blank" rel="noopener">42 CFR § ' + CNA.app.esc(c.s) + ' (eCFR)</a>';
  }
  function fedLabel(c) {
    return '⚖️ Federal nursing-home rule that applies in Oklahoma — <b>' + CNA.app.esc(c.t) + '</b> (42 CFR, official eCFR' +
      (fed.data && fed.data.date ? ', current as of ' + CNA.app.esc(fed.data.date) : '') + ').';
  }
  function fedOfflineHtml(q) {
    const h = fedHits(q, 1)[0];
    if (!h || h.coverage < 0.6 || h.score < 8) return '';
    const c = h.doc.chunk;
    return '<p class="small muted">' + fedLabel(c) + '</p><p>' + CNA.app.esc(okcsSnippet(c.x, q, 520)) + '</p>' +
      '<div class="chat-src"><span class="small muted">Official source:</span> ' + fedLink(c) + '</div>';
  }

  // ---------- Official U.S. government health library (NIA/NIH, Alzheimers.gov, AHRQ, OSHA, SAMHSA) ----------
  // js/data/gov-library.js (built by tools/build_gov_library.py), saved on the phone so it works offline.
  const gov = { state: 'idle', index: null, data: null, waiters: [] };
  function loadGov() {
    if (gov.state === 'ready') return Promise.resolve(true);
    if (gov.state === 'failed') return Promise.resolve(false);
    return new Promise((resolve) => {
      gov.waiters.push(resolve);
      if (gov.state === 'loading') return;
      gov.state = 'loading';
      const done = (ok) => { gov.state = ok ? 'ready' : 'failed'; gov.waiters.splice(0).forEach((w) => w(ok)); };
      const finish = () => {
        const D = CNA.govLibrary;
        if (!D || !D.chunks) return done(false);
        gov.data = D;
        gov.index = E.build(D.chunks.map((c, i) => {
          const doc = D.docs[c.d] || {};
          return { id: 'gov:' + i, kind: 'gov', chunk: c, src: doc, title: (doc.t || '') + ' ' + (c.h || ''), body: c.x };
        }));
        done(true);
      };
      if (CNA.govLibrary) return finish();
      if (typeof document === 'undefined') return done(false);
      const el = document.createElement('script');
      el.src = 'js/data/gov-library.js';
      el.onload = finish;
      el.onerror = () => done(false);
      document.head.appendChild(el);
    });
  }
  function govHits(q, n) { return gov.state === 'ready' ? E.search(gov.index, q, n || 2) : []; }
  function govLink(src) {
    return '<a href="' + CNA.app.esc(src.u) + '" target="_blank" rel="noopener">' + CNA.app.esc(src.t) + ' (' + CNA.app.esc(src.a) + ')</a>';
  }
  function govOfflineHtml(q) {
    const h = govHits(q, 1)[0];
    // Measured on real and off-topic questions: off-topic ones ("movie times", "bake bread") never score above ~7.3.
    if (!h || h.score < 8 || h.coverage < 0.3) return '';
    const src = h.doc.src;
    return '<p class="small muted">🏛️ Official U.S. government health page — <b>' + CNA.app.esc(src.t) + '</b> (' + CNA.app.esc(src.a) +
      (gov.data && gov.data.date ? ', saved ' + CNA.app.esc(gov.data.date) : '') + ').</p><p>' + CNA.app.esc(okcsSnippet(h.doc.chunk.x, q, 520)) + '</p>' +
      '<div class="chat-src"><span class="small muted">Official source:</span> ' + govLink(src) + '</div>';
  }

  // ---------- MedlinePlus (NIH) general health library, for questions the lessons do not cover ----------
  // js/data/medlineplus.js (built by tools/build_medlineplus.py) is loaded only when first needed.
  const mlp = { state: 'idle', index: null, data: null, waiters: [] };
  function loadMedline() {
    if (mlp.state === 'ready') return Promise.resolve(true);
    if (mlp.state === 'failed') return Promise.resolve(false);
    return new Promise((resolve) => {
      mlp.waiters.push(resolve);
      if (mlp.state === 'loading') return;
      mlp.state = 'loading';
      const done = (ok) => { mlp.state = ok ? 'ready' : 'failed'; mlp.waiters.splice(0).forEach((w) => w(ok)); };
      const finish = (fresh) => {
        const M = fresh || CNA.medlineplus;
        if (!M || !M.topics) return done(false);
        mlp.data = M;
        mlp.index = E.build(M.topics.map((t, i) => ({ id: 'mlp:' + i, kind: 'mlp', topic: t, title: t.t, keywords: t.a, body: t.s })));
        // Each topic's names (title + official "also called" names) as word lists, for exact-name matching.
        mlp.names = M.topics.map((t) => [t.t].concat(t.a || []).map((n) => E.tokens(n)).filter((w) => w.length));
        done(true);
      };
      const builtIn = () => {
        if (CNA.medlineplus) return finish();
        const s = document.createElement('script');
        s.src = 'js/data/medlineplus.js';
        s.onload = () => finish();
        s.onerror = () => done(false);
        document.head.appendChild(s);
      };
      // Prefer the newest library downloaded by js/medline-update.js; fall back to the copy built into the app.
      const U = CNA.medlineUpdate;
      if (U && U.loadDownloaded) U.loadDownloaded().then((d) => (d ? finish(d) : builtIn()), builtIn);
      else builtIn();
    });
  }
  /* Called by the updater after a new library is downloaded: use it from the next question on. */
  function reloadMedline() {
    if (mlp.state === 'loading') return;
    const wasUsed = mlp.state === 'ready';
    mlp.state = 'idle'; mlp.index = null; mlp.data = null;
    if (wasUsed) loadMedline();
  }
  function medlineHits(q, n) {
    if (mlp.state !== 'ready') return [];
    return E.search(mlp.index, q, n || 4);
  }
  /* Topics whose full name (or an official alternate name) appears in the question: "what is COPD" → COPD.
   * Longer names win ("heart attack" beats "heart"). This is strict on purpose — it is what the offline chat shows. */
  function medlineByName(q) {
    if (mlp.state !== 'ready') return [];
    const qs = new Set(E.tokens(q));
    const out = [];
    mlp.names.forEach((names, i) => {
      let best = 0;
      names.forEach((w) => { if (w.every((x) => qs.has(x)) && w.length > best) best = w.length; });
      if (best) out.push({ topic: mlp.data.topics[i], len: best });
    });
    return out.sort((a, b) => b.len - a.len || a.topic.t.length - b.topic.t.length).map((x) => x.topic);
  }
  /* MedlinePlus topics to send to the AI: topics named in the question first, then the best text matches. */
  function medlineTopicsFor(q) {
    const topics = [];
    medlineByName(q).concat(medlineHits(q, 4).filter((h) => h.coverage >= 0.5).map((h) => h.doc.topic))
      .forEach((t) => { if (topics.length < 4 && !topics.includes(t)) topics.push(t); });
    return topics;
  }
  function mlpDate() {
    const d = mlp.data && mlp.data.date;
    if (!d) return '';
    const p = d.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function mlpLabel() {
    return '📚 General health information from <b>MedlinePlus</b> (U.S. National Library of Medicine, NIH)' +
      (mlpDate() ? ', updated ' + CNA.app.esc(mlpDate()) : '') + '. This is not part of your Oklahoma lessons — for the exam, follow your lessons.';
  }
  function mlpLinks(topics) {
    const esc = CNA.app.esc;
    return '<div class="chat-src"><span class="small muted">Official source:</span> ' + topics.slice(0, 3).map((t) =>
      '<a href="' + esc(t.u) + '" target="_blank" rel="noopener">' + esc(t.t) + ' (MedlinePlus)</a>').join(' · ') + '</div>';
  }
  /* Offline: show the start of the best MedlinePlus summary, word for word, when it clearly matches. */
  function mlpOfflineHtml(q) {
    const t = medlineByName(q)[0];
    if (!t) return '';
    const sentences = t.s.match(/[^.!?]+[.!?]+/g) || [t.s];
    let text = '';
    for (const x of sentences) { if ((text + x).length > 420 && text) break; text += x; }
    return '<p class="small muted">' + mlpLabel() + '</p><p><b>' + CNA.app.esc(t.t) + '</b></p><p>' + CNA.app.esc(text.trim()) + '</p>' + mlpLinks([t]);
  }

  /* The offline answer, plus MedlinePlus when the lessons have nothing. */
  const LESSON_WEAK = 6;   // measured: wrong lesson matches that should give way score about 5.4; right ones 6.4 and up
  async function offlineReply(q, qv) {
    const r = answer(q, qv);
    if (defTerm(q) && await loadOkcs()) {
      const def = okDefinitionHtml(q);
      if (def) return def + (r.hit ? '<div class="chat-more"><p class="small muted">In your lessons:</p>' + reply(q, qv) + '</div>' : '');
    }
    // Oklahoma lessons first: a lesson match that passes wins, unless it is truly weak (score < LESSON_WEAK — e.g. "bed sores"
    // matching only "sores" in the mouth-care skill). Then a named medicine (with internet) goes to its FDA label, and the
    // other offline official sources are checked in order: Oklahoma's Course Standards, U.S. government health pages,
    // federal nursing-home rules. (Comparing raw scores across sources does not work — the libraries score differently.)
    const lessonScore = r.hit ? (r.hit.byMeaning ? 99 : r.hit.score) : 0;
    if (r.hit && (lessonScore >= LESSON_WEAK || r.hit.doc.kind === 'app')) return reply(q, qv);
    const label = CNA.helpFda ? await CNA.helpFda.lookup(q) : null;
    if (label && fdaMatches(label, q)) {
      const pick = label.sections.filter((x, i) => i === 0 || (/side effect|adverse/i.test(q) && /side effects/i.test(x.label))).slice(0, 2);
      return (r.urgent ? URGENT_HTML : '') + fdaLabelHead(label) + pick.map((x) => '<p><b>' + CNA.app.esc(x.label) + ':</b> ' +
        CNA.app.esc(x.text.slice(0, 600)) + (x.text.length > 600 ? '…' : '') + '</p>').join('') + fdaFoot(label);
    }
    await Promise.all([loadOkcs(), loadFed(), loadGov()]);
    const lead = (what) => (r.urgent ? URGENT_HTML : '') + '<p class="small muted">Your lessons don\'t answer this directly, but ' + what + ':</p>';
    const okHtml = okcsOfflineHtml(q);
    if (okHtml) return lead('Oklahoma\'s official Course Standards do') + okHtml;
    const govHtml = govOfflineHtml(q);
    if (govHtml) return lead('an official U.S. government health page does') + govHtml;
    const fedHtml = fedOfflineHtml(q);
    if (fedHtml) return lead('the federal nursing-home rules do') + fedHtml;
    if (r.hit) return reply(q, qv);
    await loadMedline();
    const extra = mlpOfflineHtml(q);
    if (extra) return (r.urgent ? URGENT_HTML : '') + '<p class="small muted">Your lessons don\'t cover this, but MedlinePlus does:</p>' + extra;
    // A medicine question that could not reach the FDA label because there is no internet: say that plainly.
    if (!r.hit && MED_WORDS.test(q) && CNA.helpFda && CNA.helpFda.wasOffline && CNA.helpFda.wasOffline()) {
      return (r.urgent ? URGENT_HTML : '') + '<p>💊 Medicine questions are answered from the official FDA drug label, and that needs internet. ' +
        'It looks like you\'re offline right now — try again when you have signal.</p><p class="small muted">Always ask the nurse about a resident\'s medicines; nurse aides do not give medications.</p>';
    }
    return reply(q, qv);
  }
  /* Use an FDA label only when it is really the medicine asked about: its generic name matches a word in the question,
     or a brand name matches AND the question is clearly about a medicine ("pizza recipe" must never show a sunscreen
     sold under the brand name RECIPE). */
  const MED_WORDS = /\b(medicines?|medications?|meds?|drugs?|pills?|tablets?|capsules?|side effects?|doses?|dosage|prescri\w*|taking|used for)\b/i;
  function fdaMatches(label, q) { return !!label && (label.q === 3 || (label.q === 2 && MED_WORDS.test(q))); }
  function fdaLabelHead(label) {
    const esc = CNA.app.esc;
    return '<p class="small muted">💊 Official U.S. Food and Drug Administration (FDA) drug label for <b>' + esc(label.name) + '</b>' +
      (label.generic && label.generic.toLowerCase() !== label.name.toLowerCase() ? ' (' + esc(label.generic.toLowerCase()) + ')' : '') +
      (label.date ? ', label dated ' + esc(label.date) : '') + '. Not part of your Oklahoma lessons.</p>';
  }
  function fdaFoot(label) {
    return '<p class="small"><b>Nurse aides do not give or change medications</b> — report side effects or changes to the nurse.</p>' +
      '<div class="chat-src"><span class="small muted">Official source:</span> <a href="' + CNA.app.esc(label.url) + '" target="_blank" rel="noopener">FDA label on DailyMed (U.S. National Library of Medicine)</a></div>';
  }

  async function ask(q, docId) {
    q = String(q || '').trim().slice(0, 300);
    if (!q) return;
    addMsg('me', CNA.app.esc(q));
    const d = docId && docs ? docs.find((x) => x.id === docId) : null;
    if (d) { addMsg('bot', hitHtml({ doc: d })); return; }
    const qv = await queryVec(q);
    if (!(ON() && ON().ready())) {
      // Show "Looking…" first and let the screen draw it: the first search of the big official libraries can take a moment.
      const w = addMsg('bot', '<p class="small muted chat-wait">Looking in your lessons and official sources…</p>');
      await new Promise((r) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(() => setTimeout(r, 0)) : setTimeout(r, 0)));
      let html;
      try { html = await offlineReply(q, qv); } catch (e) { html = '<p>Sorry — something went wrong. Please try asking again.</p>'; }
      w.innerHTML = html; log.scrollTop = log.scrollHeight;
      return;
    }

    const wait = addMsg('bot', '<p class="small muted chat-wait">Checking all official sources… (online AI)</p>');
    const show = (html) => { wait.innerHTML = html; log.scrollTop = log.scrollHeight; };
    // Gather EVERY source first — lessons, Oklahoma documents, federal rules, U.S. government pages, MedlinePlus and
    // (for a named medicine) the FDA label — and let the AI compare them in one pass, so the best answer wins
    // instead of whichever source happened to be checked first.
    let ctx = [], r = null;
    try {
      ctx = await gatherAll(q, qv);
      r = await ON().ask(q, ctx.map(itemOf));
    } catch (err) {
      // Never leave a question stuck on "Checking…": fall back to the app's own answer.
      let off = ''; try { off = await offlineReply(q, qv); } catch (e2) { off = '<p>Sorry — something went wrong. Please try asking again.</p>'; }
      show('<p class="small muted">The online AI did not answer. Here is what the app itself found:</p>' + off);
      return;
    }
    const online = onlinePresentation(r, ctx, URGENT.test(q));
    if (online && !online.error) {
      show(online.html);
      return;
    }
    if (r && r.notFound) {
      // Don't show a lesson here: the AI already found no source answers this, so a "closest lesson" would be off-topic.
      const rel = answer(q, qv).related;
      show('<p class="small muted">🌐 The online AI compared your lessons, Oklahoma\'s official documents, federal nursing-home rules, U.S. government health pages, MedlinePlus (NIH)' +
        ' and FDA drug labels' + ', and none of them answers that question.</p>' +
        '<p>Try asking with different words, or with the exact medicine name. For questions about a resident\'s care or medicines, ask the nurse.</p>' +
        (rel.length ? '<div class="chat-rel"><span class="small muted">Did you mean:</span>' + rel.map((h) => '<button type="button" class="chip" data-ask="' + CNA.app.esc(relTitle(h)) + '" data-doc="' + CNA.app.esc(h.doc.id) + '">' + CNA.app.esc(relTitle(h)) + '</button>').join('') + '</div>' : ''));
      return;
    }
    // Always say what happened, so a silent fallback never looks like "the AI is not working".
    const e = online && online.error === 'citation' ? 'citation' : r && r.error;
    const why = e === 'badkey' || e === 401 ? 'The online AI key did not work — check it in Settings → Online AI helper.' :
      e === 400 || e === 403 ? 'Google\'s online AI did not accept the request right now.' :
      e === 429 ? 'The free online AI limit is used up for now (it resets later).' :
      typeof e === 'number' && e >= 500 ? 'Google\'s online AI service is having trouble right now — try again in a minute.' :
      e === 'timeout' || e === 'network' ? 'Couldn\'t reach the online AI (weak signal or no internet).' :
      e === 404 || e === 'model' ? 'Google\'s free AI model is not available right now.' :
      e === 'safety' ? 'The online AI would not answer that question.' :
      e === 'citation' ? 'The online AI answer did not include a valid source citation, so it was not shown.' :
      e ? 'The online AI did not send an answer (' + e + ').' : 'The online AI did not send an answer.';
    show('<p class="small muted">' + CNA.app.esc(why) + ' Here is what the app itself found:</p>' + await offlineReply(q, qv));
  }

  function setOpen(v) {
    open = v;
    panel.hidden = !v;
    fab.setAttribute('aria-expanded', String(v));
    fab.setAttribute('aria-label', v ? 'Close help chat' : 'Open help chat');
    fab.innerHTML = v ? '<span aria-hidden="true">✕</span>' : '<span aria-hidden="true">💬</span>';
    document.documentElement.classList.toggle('chat-open', v);
    if (v) {
      ensureIndex();
      modeLabel();
      loadSemantic(modeLabel);
      if (!log.childElementCount) greet();
      setTimeout(() => input.focus(), 50);
    } else fab.focus();
  }

  function modeLabel() {
    const t = panel && panel.querySelector('.chat-mode');
    if (!t) return;
    const online = ON() && ON().ready();
    t.textContent = (online ? 'Online AI on' : sem.state === 'ready' ? 'Smart search on' : 'App help + CNA lessons') + ' · ' + (online ? 'offline answers if no signal' : 'works offline');
  }

  function greet() {
    const esc = CNA.app.esc, name = CNA.app.firstName ? CNA.app.firstName() : '';
    addMsg('bot', '<p>Hi' + (name ? ' ' + esc(name) : '') + '! 👋 Ask me how to use the app, or about anything in your CNA lessons.</p>' +
      '<p class="small muted">I answer only from this app\'s lessons, which use official Oklahoma sources. For real residents, always ask the nurse.' +
      (ON() && ON().ready() ? ' Online AI is on: your questions go to Google when you have signal — never type resident names or health details.' : ' I work offline. <a href="#/aihelp" class="chat-go-link">Turn on online AI</a> for smarter answers when you have signal.') + '</p>' +
      '<div class="chat-rel">' + CNA.helpbotKB.starters.map((s) => '<button type="button" class="chip" data-ask="' + esc(s) + '">' + esc(s) + '</button>').join('') + '</div>');
  }

  function syncVisible() {
    const tabs = document.getElementById('tabs');
    const show = tabs && tabs.style.display !== 'none';
    fab.hidden = !show;
    if (!show && open) setOpen(false);
  }

  function mount() {
    fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'chat-fab';
    fab.setAttribute('aria-controls', 'chat-panel');
    panel = document.createElement('section');
    panel.id = 'chat-panel';
    panel.className = 'chat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Help chat');
    panel.hidden = true;
    panel.innerHTML =
      '<div class="chat-head"><span class="chat-ava" aria-hidden="true">💬</span><div class="grow"><b>Ask me</b><br><span class="small muted chat-mode">App help + CNA lessons · works offline</span></div>' +
      '<button type="button" class="ghost chat-x" aria-label="Close help chat">✕</button></div>' +
      '<div class="chat-log" aria-live="polite"></div>' +
      '<form class="chat-form"><label for="chat-in" class="sr-only">Your question</label>' +
      '<input id="chat-in" autocomplete="off" maxlength="300" placeholder="Type a question…" enterkeyhint="send">' +
      '<button type="submit" aria-label="Send">➤</button></form>';
    document.body.appendChild(panel);
    document.body.appendChild(fab);
    log = panel.querySelector('.chat-log');
    input = panel.querySelector('#chat-in');
    setOpen(false);

    fab.addEventListener('click', () => setOpen(!open));
    panel.querySelector('.chat-x').addEventListener('click', () => setOpen(false));
    panel.querySelector('form').addEventListener('submit', (e) => { e.preventDefault(); const q = input.value; input.value = ''; ask(q); });
    log.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-ask]');
      if (chip) { ask(chip.dataset.ask, chip.dataset.doc); return; }
      const go = e.target.closest('a.chat-go, a.chat-go-link');
      if (go) setOpen(false); // the link itself navigates
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });
    window.addEventListener('hashchange', () => setTimeout(syncVisible, 0));
    setTimeout(syncVisible, 0);
  }

  // ---------- More → Settings → Online AI helper ----------
  CNA.views = CNA.views || {};
  CNA.views.aihelp = function (root) {
    const app = CNA.app, esc = app.esc, c = ON().settings();
    root.innerHTML = app.header('Online AI helper', '#/settings') +
      '<div class="card hero"><div style="font-size:1.1em;font-weight:800">🌐 Smarter chat answers when you have signal</div>' +
      '<p style="margin:6px 0 0">When this is on and the phone is online, the help chat asks Google\'s free Gemini AI to answer in plain words — using <b>only</b> the text of this app\'s lessons. It always shows which lesson it used. If your lessons do not cover a question, it uses MedlinePlus, the official health library of the U.S. National Library of Medicine (NIH), and labels that clearly. With no signal, the chat works offline like before.</p></div>' +
      '<div class="card warn small"><b>Privacy:</b> your question and the matching lesson text are sent to Google. On the free plan, Google says it may use this to improve its products. <b>Never type resident names or health information.</b> Everything else in the app stays on this phone.</div>' +
      '<h2>Your free key</h2><div class="card">' +
      '<ol class="small" style="padding-left:20px;margin-top:0"><li>On this phone, open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> and sign in with a Google account.</li><li>Tap <b>Create API key</b> and copy it.</li><li>Paste it below and tap <b>Test & save</b>.</li></ol>' +
      '<label for="ai-key">API key</label><input id="ai-key" type="password" autocomplete="off" spellcheck="false" placeholder="Paste your key here" value="' + esc(c.key) + '">' +
      '<label class="row" style="margin-top:12px"><input type="checkbox" id="ai-on"' + (c.on ? ' checked' : '') + '> Use online AI in the help chat</label>' +
      '<p class="small muted" id="ai-msg"></p>' +
      '<div class="btnrow"><button id="ai-save">Test & save</button><button class="ghost" id="ai-clear">Remove key</button></div>' +
      '<p class="small muted">The key is saved only on this phone. It is not in backup files, so add it again on a new phone.</p></div>' +
      '<h2>Health library (MedlinePlus)</h2><div class="card"><p class="small" style="margin-top:0" id="mlp-status"></p>' +
      '<p class="small muted">Used for questions your lessons don\'t cover — with or without the online AI. Every time the app opens with internet, it checks for new MedlinePlus information and downloads only what changed.</p>' +
      '<button class="secondary" id="mlp-check">Check for updates now</button><p class="small muted" id="mlp-msg"></p></div>';
    const U = CNA.medlineUpdate;
    const fmt = (d) => { if (!d) return 'unknown'; const p = d.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }); };
    const showLib = () => {
      const c = U ? U.current() : { date: (CNA.medlineplusBuiltIn || {}).date };
      app.$('#mlp-status', root).textContent = 'Your library: MedlinePlus information from ' + fmt(c.date) + (c.downloaded ? ' (downloaded update).' : ' (built into the app).');
    };
    showLib();
    app.$('#mlp-check', root).addEventListener('click', async () => {
      const m = app.$('#mlp-msg', root);
      if (!U) { m.textContent = 'Updates are not available in this version.'; return; }
      m.textContent = 'Checking…';
      const r = await U.check(true);
      m.textContent = {
        updated: 'Updated! New MedlinePlus information from ' + fmt(r.date) + ' is now on this phone.',
        current: 'You already have the newest MedlinePlus information.',
        offline: 'You are offline. The app will check next time it opens with internet.',
        unavailable: 'Could not reach the update right now. The app will try again next time it opens.',
        bad: 'The update did not look complete, so it was not used. Your current library is still here.',
        unsupported: 'This browser cannot store updates. The built-in library is used.',
      }[r.status] || 'Done.';
      showLib();
    });
    const msg = app.$('#ai-msg', root);
    app.$('#ai-save', root).addEventListener('click', async () => {
      const key = app.$('#ai-key', root).value.trim(), on = app.$('#ai-on', root).checked;
      if (on && key.length < 20) { msg.textContent = 'Paste your API key first.'; return; }
      if (on) {
        if (!navigator.onLine) { msg.textContent = 'You are offline. Connect to the internet to test the key.'; return; }
        msg.textContent = 'Testing the key…';
        const t = await ON().testKey(key);
        // Only a real "invalid key" answer from Google (or 401) rejects the key; anything else saves it with an honest note.
        const badKey = t.error === 'badkey' || t.error === 401;
        if (!t.ok && badKey) { msg.textContent = 'That key did not work — Google says it is not a valid key. Check that you copied all of it.'; return; }
        if (!t.ok) msg.textContent = t.error === 429 ? 'The key works but the free limit is used up for now. Saved — try again later.' :
          t.error === 'timeout' || t.error === 'network' ? 'Could not reach Google\'s AI service right now (weak signal?). Your key is saved — the chat will use it when there is signal.' :
          'Google\'s AI service did not answer right now (' + t.error + '). Your key was not rejected, so it is saved — the chat will use it when the service is back.';
      }
      ON().save(on, key);
      app.toast(on ? (msg.textContent && msg.textContent !== 'Testing the key…' ? msg.textContent : 'Online AI is on.') : 'Saved. Online AI is off.');
      app.go('#/settings');
    });
    app.$('#ai-clear', root).addEventListener('click', () => { ON().save(false, ''); app.toast('Key removed. Online AI is off.'); app.route(); });
  };

  CNA.helpbot = { contextDocs: (q) => contextDocs(q, null), itemOf, answer, fdaMatches, offlineReply: (q) => offlineReply(q, null), onlinePresentation, wordHits: (q, n) => E.search(ensureIndex(), q, n || 8), loadFed, fedHits, fedOfflineHtml, loadGov, govHits, govOfflineHtml, loadOkcs, okcsHits, okcsOfflineHtml, okDefinition, okDefinitionHtml, loadMedline, reloadMedline, medlineHits, medlineByName, mlpOfflineHtml, medlineDate: () => mlp.data && mlp.data.date, answerSmart: async (q) => answer(q, await queryVec(q)), loadSmart: () => loadSemantic(), semanticState: () => sem.state, ask: (q) => { if (!open) setOpen(true); ask(q); }, open: () => setOpen(true), close: () => setOpen(false) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
