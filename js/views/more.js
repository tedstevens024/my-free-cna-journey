/* More menu: Skills Library, State Requirements, Notes, Backup & Restore, Settings, About. */
(function () {
  'use strict';
  const CNA = window.CNA;
  const T = CNA.time, S = CNA.store;
  const V = (CNA.views = CNA.views || {});

  V.more = function (root) {
    const app = CNA.app, st = app.state;
    const days = st.meta.lastBackup ? Math.floor((Date.now() - new Date(st.meta.lastBackup).getTime()) / T.DAY) : null;
    const li = (href, ico, title, sub) => '<li><a class="item" href="' + href + '"><span class="ico">' + ico + '</span><span class="grow"><span class="title">' + title + '</span><br><span class="sub">' + app.esc(sub) + '</span></span><span class="chev">›</span></a></li>';
    root.innerHTML = app.header('More') +
      (days == null || days >= 7 ? '<div class="card warn small">💾 ' + (days == null ? 'You haven\'t made a backup yet.' : 'Last backup was ' + days + ' days ago.') + ' <a href="#/backup">Back up now</a></div>' : '') +
      '<div class="card"><a class="profile-link" href="#/profile">' + app.avatar(56) + '<span class="grow"><b>' + app.esc(st.profile.firstName + ' ' + st.profile.lastName) + '</b><br><span class="small muted">Edit name or picture</span></span><span class="chev">›</span></a></div>' +
      '<div class="card"><ul class="list">' +
      li('#/skills', '🧤', 'Skills Library', 'Step-by-step skills, checklists and practice') +
      li('#/state', '🗺️', 'Oklahoma Requirements', 'Verified official Oklahoma rules + free official study guide') +
      li('#/abbreviations', '🔤', 'Abbreviations', 'Oklahoma official exam list (' + CNA.abbreviations.list.length + ')') +
      li('#/glossary', '📚', 'Oklahoma Glossary', 'Official meanings of 239 nurse aide words, with page numbers') +
      li('#/notes', '📝', 'My Notes', st.notes.length + ' notes') +
      li('#/backup', '💾', 'Backup & Restore', 'Save your data to a file, or restore it') +
      li('#/settings', '⚙️', 'Settings', 'Study goal, session length, study hours, text size') +
      li('#/help', '🧭', 'App tour & help', 'Watch the guided tour again, or get quick answers') +
      li('#/about', 'ℹ️', 'About & Privacy', 'Free, open source, no tracking') +
      '</ul></div>';
  };

  // ---------- Skills ----------
  // Saved checkmarks are stored by step position; if a skill's steps change in an update, drop the old checks.
  const stepSig = (s) => s.steps.length + ':' + s.steps.join('|').length;
  const skillProgress = (st, s) => {
    const p = st.skills[s.id];
    if (p && p.sig !== stepSig(s)) { p.checked = {}; p.sig = stepSig(s); }
    return p;
  };

  V.skills = function (root) {
    const app = CNA.app, st = app.state, esc = app.esc;
    const groups = {};
    CNA.skills.skills.forEach((s) => { (groups[s.topic] = groups[s.topic] || []).push(s); });
    root.innerHTML = app.header('Skills Library', '#/more') +
      '<div class="disclaimer">Study and home-practice guides only. In Oklahoma, the skills you can be tested on are listed in the official CareerTech study guide, and the official step-by-step procedures are set by the Oklahoma State Department of Health — follow your instructor and those documents. Hands-on competency is learned in supervised clinical training and confirmed by Oklahoma\'s skills exam.</div>' +
      (CNA.skills.coverageNote ? '<div class="card soft small">' + esc(CNA.skills.coverageNote) + '</div>' : '') +
      Object.keys(groups).map((topic) => {
        const u = CNA.curriculum.units.find((x) => x.topic === topic);
        return '<h2>' + (u ? u.icon + ' ' + esc(u.title) : topic) + '</h2><div class="card"><ul class="list">' + groups[topic].map((s) => {
          const p = skillProgress(st, s) || {};
          const checked = Object.values(p.checked || {}).filter(Boolean).length;
          const n = (p.practiced || []).length;
          const vt = CNA.skills.critical && CNA.skills.critical.vitalTolerances[s.id];
          return '<li><a class="item" href="#/skill/' + s.id + '"><span class="ico">' + (n ? '✅' : '🧤') + '</span><span class="grow"><span class="title">' + esc(s.title) + (vt ? ' <span class="pill crit">' + esc(vt.badge) + '</span>' : '') + '</span><br><span class="sub">' +
            (n ? 'Practiced ' + n + '×' : 'Not practiced yet') + ' · ' + checked + '/' + s.steps.length + ' steps checked</span></span><span class="chev">›</span></a></li>';
        }).join('') + '</ul></div>';
      }).join('');
  };

  V.skill = function (root, params) {
    const app = CNA.app, st = app.state, esc = app.esc;
    const s = CNA.skills.skills.find((x) => x.id === params[0]);
    if (!s) return V.skills(root);
    const p = st.skills[s.id] = skillProgress(st, s) || { checked: {}, practiced: [], sig: stepSig(s) };
    const ul = (arr) => '<ul>' + arr.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
    const crit = CNA.skills.critical;
    const vt = crit && crit.vitalTolerances[s.id];
    const critList = crit ? (crit.bySkill[s.id] || []).map((id) => crit.generalTasks.find((t) => t.id === id)).filter(Boolean) : [];
    const critCard = crit ? '<div class="card crit"><h3>🚨 Oklahoma Exam Critical Tasks</h3>' +
      (vt ? '<p style="margin-bottom:.6em"><span class="pill crit">Critical tolerance</span> <b>' + esc(vt.label) + ':</b> ' + esc(vt.text) + ' <span class="small muted">(' + esc(vt.where) + ')</span></p>' : '') +
      '<details><summary><span class="pill crit">Oklahoma critical tasks</span> <span class="small"><b>' + critList.length + ' exam-wide checks</b> related to this skill</span></summary>' +
      '<ul class="small" style="margin:.6em 0 0;padding-left:1.2em">' + critList.map((t) => '<li><b>' + esc(t.id) + ':</b> ' + esc(t.text) + '</li>').join('') + '</ul>' +
      '<p class="small muted" style="margin:.5em 0 0">' + esc(crit.scopeNote) + '</p>' +
      ((crit.criticalActions || []).length ? '<p class="small" style="margin:.6em 0 .2em"><b>The critical actions on the score sheet:</b></p><ul class="small" style="margin:0;padding-left:1.2em">' + crit.criticalActions.map((a) => '<li>' + esc(a.text) + ' <span class="muted">(' + esc(a.where) + ')</span></li>').join('') + '</ul>' : '') +
      '</details></div>' : '';
    root.innerHTML = app.header(s.title, '#/skills') +
      (s.okRef ? '<div class="card soft small"><b>🟢 Oklahoma:</b> ' + esc(s.okRef) + (s.okNote ? '<p style="margin:.5em 0 0">' + esc(s.okNote) + '</p>' : '') + '</div>' : '') +
      critCard +
      app.sourceBox(CNA.sources.forSkill(s.id), 'Where this skill comes from', 'The exact skills tested in Oklahoma are listed in the official CareerTech study guide (More → Oklahoma Requirements)') +
      '<div class="card"><p><b>Why:</b> ' + esc(s.why) + '</p><h3>Equipment</h3>' + ul(s.equipment) + '</div>' +
      (s.noOpenClose ? '' : '<div class="card soft"><h3>Opening steps (every skill)</h3>' + ul(CNA.skills.opening) + '</div>') +
      '<div class="card"><h3>Steps — check them off as you practice</h3>' +
      s.steps.map((step, i) => step.startsWith('—') ? '<h3>' + esc(step.replace(/—/g, '').trim()) + '</h3>' :
        '<label class="check"><input type="checkbox" data-i="' + i + '"' + (p.checked[i] ? ' checked' : '') + '><span>' + esc(step) + '</span></label>').join('') +
      '<div class="btnrow"><button class="ghost" id="clear">Clear checks</button></div></div>' +
      (s.noOpenClose ? '' : '<div class="card soft"><h3>Closing steps (every skill)</h3>' + ul(CNA.skills.closing) + '</div>') +
      '<div class="card warn"><h3>⚠️ Safety precautions</h3>' + ul(s.precautions) + '</div>' +
      '<div class="card"><h3>Common mistakes</h3>' + ul(s.mistakes) + '</div>' +
      '<div class="btnrow"><button id="prac">I practiced this today</button><button class="secondary" id="quiz">Practice questions</button></div>' +
      '<p class="small muted">' + (p.practiced.length ? 'Practiced ' + p.practiced.length + ' time(s). Last: ' + esc(T.fmtDate(p.practiced[p.practiced.length - 1])) : 'Tip: practice out loud with a family member playing the resident.') + '</p>';

    app.$$('[data-i]', root).forEach((c) => c.addEventListener('change', () => { p.checked[c.dataset.i] = c.checked; app.save(); }));
    app.$('#clear', root).addEventListener('click', () => { p.checked = {}; app.save(); app.route(); });
    app.$('#prac', root).addEventListener('click', () => {
      const d = T.dateKey(new Date());
      if (p.practiced[p.practiced.length - 1] !== d) p.practiced.push(d);
      app.save(); app.toast('Practice logged — nice!'); app.route();
    });
    app.$('#quiz', root).addEventListener('click', () => {
      const u = CNA.curriculum.units.find((x) => x.topic === s.topic);
      CNA.quiz.start({ mode: 'topic', topic: s.topic, title: (u ? u.title : 'Skills') + ' quiz', count: 10 });
    });
  };

  // ---------- State requirements ----------
  V.state = function (root) {
    const app = CNA.app, st = app.state, esc = app.esc;
    const F = CNA.states.federal;
    const info = CNA.states.getState('OK'); // Oklahoma only (user's standing rule)
    const src = (arr) => '<ul class="small">' + arr.map((x) => '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.title) + '</a>' + (x.checked ? ' (checked ' + esc(x.checked) + ')' : '') + '</li>').join('') + '</ul>';

    let stateHtml;
    if (!info) stateHtml = '<div class="empty">Choose your state above.</div>';
    else if (!info.verified) {
      stateHtml = '<p><span class="pill unverified">Not yet verified</span></p><p>We haven\'t checked ' + esc(info.name) + '\'s official rules yet, so we won\'t show any numbers that might be wrong. Many states require more training hours than the federal minimum.</p>' +
        '<h3>How to find the official rules</h3><ol>' + CNA.states.howToFind.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>';
    } else {
      const S = info.sources || [];
      const btns = (idx) => idx.map((i) => S[i]).filter(Boolean).map((s) => '<a class="srcbtn" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer"><span class="grow"><span class="t">' + esc(s.title) + '</span><span class="by">' + esc(new URL(s.url).hostname.replace(/^www\./, '')) + '</span></span><span aria-hidden="true">↗</span></a>').join('');
      stateHtml = '<p><span class="pill done">✓ Verified ' + esc(info.verifiedDate) + '</span></p>' +
        '<p class="small muted">' + esc(info.title || '') + '. Each fact below was read on the official documents and agrees across <b>at least 3 official sources</b>. Tap "Check sources" to see them yourself.</p>' +
        (info.facts || []).map((f, i) => '<div class="card" style="margin:10px 0"><h3>' + esc(f.h) + '</h3><p>' + esc(f.text) + '</p>' +
          '<details><summary class="small"><b>🔎 Check sources</b> <span class="pill done">' + f.sources.length + ' official sources agree</span></summary>' + btns(f.sources) + '</details></div>').join('') +
        ((info.partial || []).length ? '<h3>Not fully cross-checked yet</h3>' + info.partial.map((f) => '<div class="card warn" style="margin:10px 0"><p>' + esc(f.text) + '</p><p class="small"><b>Why it\'s marked:</b> ' + esc(f.why) + '</p>' +
          '<details><summary class="small"><b>🔎 Check sources</b> (' + f.sources.length + ')</summary>' + btns(f.sources) + '</details></div>').join('') : '') +
        (info.correction ? '<div class="card ok small">' + esc(info.correction) + '</div>' : '') +
        ((info.resources || []).length ? '<h3>Free official study materials for ' + esc(info.name) + '</h3>' +
          info.resources.map((r) => '<a class="srcbtn" href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer"><span class="grow"><span class="t">' + esc(r.title) + '</span><span class="by">' + esc(new URL(r.url).hostname.replace(/^www\./, '')) + '</span></span><span aria-hidden="true">↗</span></a>').join('') : '') +
        '<p class="small muted" style="margin-top:12px"><b>Agency:</b> ' + esc(info.agency) + '</p>';
    }

    root.innerHTML = app.header('Oklahoma CNA Requirements', '#/more') +
      '<div class="card"><h2>Oklahoma</h2>' + stateHtml +
      '<label class="check"><input type="checkbox" id="checked"' + (st.settings.stateChecked ? ' checked' : '') + '><span>I\'ve read Oklahoma\'s official requirements</span></label></div>' +
      '<h2>Federal rules Oklahoma follows</h2><div class="card"><p class="small muted">Last verified: <b>' + esc(F.verifiedDate) + '</b> from the official Code of Federal Regulations.</p><ul>' +
      F.facts.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' +
      '<div class="card ok"><h3>💰 Training may be free for you</h3><ul>' + F.money.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
      '<p class="small">Ask a nursing home in your area if they offer paid or free CNA training for employees.</p></div>' +
      '<div class="card"><h3>Sources</h3>' + src(F.sources) + '</div>' +
      '<div class="disclaimer">This screen summarizes official sources for convenience. Rules change — always confirm with the Oklahoma State Department of Health Nurse Aide Registry, (405) 426-8150, before you enroll or schedule a test.</div>';

    const c = app.$('#checked', root);
    if (c) c.addEventListener('change', () => { st.settings.stateChecked = c.checked; app.save(); });
  };

  // ---------- Notes ----------
  // ---------- Abbreviations (Oklahoma official list) ----------
  V.abbreviations = function (root) {
    const app = CNA.app, esc = app.esc, A = CNA.abbreviations;
    let hide = false, q = '';
    root.innerHTML = app.header('Abbreviations', '#/more') +
      '<div class="card soft small">These are the abbreviations in <b>Oklahoma\'s official CareerTech nurse aide study guide</b> (page ' + A.PAGE + '), in the same wording. <b>✓ sources agree</b> means at least two other official curricula define it the same way; <b>2 sources agree</b> means one other does; <b>Oklahoma list only</b> means no other official source was found yet — the meaning is still Oklahoma\'s official one.</div>' +
      '<div class="card"><label for="ab-q">Search</label><input id="ab-q" type="search" placeholder="Type an abbreviation or word" autocomplete="off">' +
      '<label class="row" style="gap:8px;font-weight:600"><input type="checkbox" id="ab-hide"> Hide meanings (tap a row to check yourself)</label></div>' +
      '<div class="card"><ul class="list" id="ab-list"></ul><p class="small muted" id="ab-none" hidden>No match.</p></div>' +
      app.sourceBox(CNA.sources.get(['okSG', 'okCore', 'vaCur', 'inCur', 'ncAA', 'ncHB']), 'Where this list comes from', 'The Oklahoma study guide is the official list for your exam');
    const ul = app.$('#ab-list', root);
    const SHORT = { okCore: 'Oklahoma course standards', inCur: 'Indiana', vaCur: 'Virginia', ncAA: 'North Carolina', ncHB: 'North Carolina' };
    const names = (ids) => Array.from(new Set(ids.map((id) => SHORT[id] || id))).join(', ');
    const draw = () => {
      const k = q.toLowerCase();
      const rows = A.list.filter((x) => !k || x.a.toLowerCase().includes(k) || x.m.toLowerCase().includes(k));
      ul.innerHTML = rows.map((x, i) => '<li class="abbr' + (hide ? ' covered' : '') + '" data-i="' + i + '" tabindex="0" role="button" aria-label="' + esc(x.a) + '">' +
        '<b class="ab">' + esc(x.a) + '</b><span class="grow"><span class="mean">' + esc(x.m) + '</span>' +
        (x.note ? '<br><span class="small muted mean">' + esc(x.note) + '</span>' : '') +
        '<br><span class="small mean">' + (x.agree >= 3 ? '<span class="pill done">✓ ' + x.agree + ' sources agree</span> ' : x.agree === 2 ? '<span class="pill">2 sources agree</span> ' : '<span class="pill">Oklahoma list only</span> ') +
        (x.also.length ? '<span class="muted">Also: ' + esc(names(x.also)) + '</span>' : '') + '</span></span></li>').join('');
      app.$('#ab-none', root).hidden = rows.length > 0;
    };
    app.$('#ab-q', root).addEventListener('input', (e) => { q = e.target.value.trim(); draw(); });
    app.$('#ab-hide', root).addEventListener('change', (e) => { hide = e.target.checked; draw(); });
    const reveal = (li) => { if (li) li.classList.toggle('covered'); };
    ul.addEventListener('click', (e) => { if (hide) reveal(e.target.closest('li.abbr')); });
    ul.addEventListener('keydown', (e) => { if (hide && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); reveal(e.target.closest('li.abbr')); } });
    draw();
  };

  // ---------- Oklahoma glossary (definitions from the official OSDH Course Standards, page-cited) ----------
  V.glossary = function (root) {
    const app = CNA.app, esc = app.esc;
    root.innerHTML = app.header('Oklahoma Glossary', '#/more') + '<div class="card small muted" id="gl-wait">Loading the definitions…</div>';
    const ready = CNA.okCourseStandards ? Promise.resolve(true) : (CNA.helpbot && CNA.helpbot.loadOkcs ? CNA.helpbot.loadOkcs() : Promise.resolve(false));
    ready.then(() => {
      const D = CNA.okCourseStandards;
      if (!D || !D.defs) { app.$('#gl-wait', root).textContent = 'The glossary could not be loaded. Close and reopen the app, then try again.'; return; }
      const defs = D.defs.slice().sort((a, b) => a.term.localeCompare(b.term));
      let hide = false, q = '';
      root.innerHTML = app.header('Oklahoma Glossary', '#/more') +
        '<div class="card soft small">These ' + defs.length + ' words and meanings come word-for-word from <b>Oklahoma\'s official nurse aide Course Standards</b> (Oklahoma State Department of Health, ' + esc(String(D.year)) + '). Each one shows its page — tap it to open that page of the official document.</div>' +
        '<div class="card"><label for="gl-q">Search</label><input id="gl-q" type="search" placeholder="Type a word, like aspiration or dementia" autocomplete="off">' +
        '<label class="row" style="gap:8px;font-weight:600"><input type="checkbox" id="gl-hide"> Hide meanings (tap a word to check yourself)</label></div>' +
        '<div class="card"><p class="small muted" id="gl-count"></p><ul class="list" id="gl-list"></ul><p class="small muted" id="gl-none" hidden>No match. Try a shorter word, or ask the 💬 chat.</p></div>';
      const ul = app.$('#gl-list', root);
      const draw = () => {
        const k = q.toLowerCase();
        const rows = defs.filter((x) => !k || x.term.toLowerCase().includes(k) || x.def.toLowerCase().includes(k));
        // Words whose name matches come first, then words that only mention it in the meaning.
        if (k) rows.sort((a, b) => (b.term.toLowerCase().includes(k) ? 1 : 0) - (a.term.toLowerCase().includes(k) ? 1 : 0));
        ul.innerHTML = rows.slice(0, 300).map((x) => '<li class="gl' + (hide ? ' covered' : '') + '" tabindex="0" role="button" aria-label="' + esc(x.term) + '">' +
          '<b class="term">' + esc(x.term) + '</b><span class="hint">Tap to show the meaning</span>' +
          '<div class="mean">' + esc(x.def) + '<br><a class="small" href="' + esc(D.url) + '#page=' + x.p + '" target="_blank" rel="noopener">Oklahoma Course Standards, page ' + x.p + '</a></div></li>').join('');
        app.$('#gl-count', root).textContent = k ? rows.length + ' of ' + defs.length + ' words' : defs.length + ' words, A to Z';
        app.$('#gl-none', root).hidden = rows.length > 0;
      };
      app.$('#gl-q', root).addEventListener('input', (e) => { q = e.target.value.trim(); draw(); });
      app.$('#gl-hide', root).addEventListener('change', (e) => { hide = e.target.checked; draw(); });
      const reveal = (li) => { if (li) li.classList.toggle('covered'); };
      ul.addEventListener('click', (e) => { if (hide && !e.target.closest('a')) reveal(e.target.closest('li.gl')); });
      ul.addEventListener('keydown', (e) => { if (hide && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); reveal(e.target.closest('li.gl')); } });
      draw();
    });
  };

  V.notes = function (root) {
    const app = CNA.app, st = app.state, esc = app.esc;
    root.innerHTML = app.header('My Notes', '#/more') +
      '<div class="card"><label for="nn">New note</label><textarea id="nn" placeholder="Study notes, questions for your instructor, things to remember… (never patient information)"></textarea>' +
      '<div class="btnrow"><button id="add">Save note</button></div></div>' +
      (st.notes.length ? st.notes.map((n) => {
        const l = n.lessonId ? app.lessonById(n.lessonId) : null;
        return '<div class="card"><div class="small muted">' + esc(new Date(n.at).toLocaleString()) + (l ? ' · <a href="#/lesson/' + l.id + '">' + esc(l.title) + '</a>' : '') + '</div>' +
          '<p style="white-space:pre-wrap">' + esc(n.text) + '</p><div class="btnrow"><button class="ghost" data-del="' + n.id + '">Delete</button></div></div>';
      }).join('') : '<div class="empty">No notes yet.</div>');
    app.$('#add', root).addEventListener('click', () => {
      const t = app.$('#nn', root).value.trim();
      if (!t) return;
      st.notes.unshift({ id: CNA.planner.uid('n'), at: new Date().toISOString(), text: t });
      app.save(); app.route();
    });
    app.$$('[data-del]', root).forEach((b) => b.addEventListener('click', () => {
      if (!confirm('Delete this note?')) return;
      st.notes = st.notes.filter((n) => n.id !== b.dataset.del); app.save(); app.route();
    }));
  };

  // ---------- Backup ----------
  V.backup = function (root) {
    const app = CNA.app, st = app.state, esc = app.esc;
    // Inside the Android app (APK) a browser download does nothing, so use the app's own Save as / Share (apk/native/BackupFilePlugin.java).
    const BF = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.Capacitor.Plugins && window.Capacitor.Plugins.BackupFile;
    const NATIVE = !!BF;
    const firstRun = !st.settings.onboarded;
    root.innerHTML = app.header('Backup & Restore', firstRun ? '#/welcome' : '#/more') +
      '<div class="card"><h3>💾 Make a backup</h3><p>Saves everything — your profile, shifts, study plan, progress, scores, notes — into one small file. Keep it somewhere safe (e.g. your Downloads folder, email it to yourself, or copy it to a computer).</p>' +
      '<p class="small muted">Last backup: ' + (st.meta.lastBackup ? esc(new Date(st.meta.lastBackup).toLocaleString()) : 'never') + '</p>' +
      '<div class="btnrow"><button id="exp">' + (NATIVE ? 'Save backup file' : 'Download backup file') + '</button>' + (NATIVE || navigator.canShare ? '<button class="secondary" id="share">Share backup…</button>' : '') + '</div></div>' +
      '<div class="card"><h3>📂 Restore from a backup</h3><p>This replaces the data on this phone with the data in the backup file.</p>' +
      '<label for="imp">Choose backup file</label><input type="file" id="imp" accept=".json,application/json"></div>' +
      '<div class="card"><h3>🗑️ Start over</h3><p class="small">Erases all data on this phone. Make a backup first!</p><button class="danger" id="reset">Erase all my data</button></div>' +
      '<p class="small muted">Your data is stored only in this browser on this phone. Clearing the browser\'s site data, or uninstalling the app, deletes it — so back up regularly.</p>';

    const file = () => {
      const name = 'cna-journey-backup-' + T.dateKey(new Date()) + '.json';
      st.meta.lastBackup = new Date().toISOString();
      app.save();
      return { name, text: S.exportJSON(st) };
    };
    app.$('#exp', root).addEventListener('click', () => {
      if (NATIVE) {
        const prev = st.meta.lastBackup, f = file();
        BF.save({ name: f.name, text: f.text })
          .then(() => { app.toast('Backup saved: ' + f.name); app.route(); })
          .catch((e) => { st.meta.lastBackup = prev; app.save(); if (!/cancel/i.test(String(e && e.message))) app.toast(String((e && e.message) || e)); });
        return;
      }
      const f = file();
      const url = URL.createObjectURL(new Blob([f.text], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      app.toast('Backup saved: ' + f.name);
      app.route(); // refresh "Last backup"
    });
    const sh = app.$('#share', root);
    if (sh) sh.addEventListener('click', async () => {
      if (NATIVE) { const f = file(); BF.share({ name: f.name, text: f.text }).then(() => app.route()).catch((e) => app.toast(String((e && e.message) || e))); return; }
      const f = file();
      const fileObj = new File([f.text], f.name, { type: 'application/json' });
      try {
        if (navigator.canShare({ files: [fileObj] })) { await navigator.share({ files: [fileObj], title: 'CNA Journey backup' }); app.route(); }
        else app.toast('Sharing files isn\'t supported here — use Download instead.');
      } catch (e) { /* user cancelled */ }
    });
    app.$('#imp', root).addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const data = S.parseBackup(r.result);
          if (!confirm('Replace the data on this phone with this backup?')) return;
          app.state = data; app.replan(true); app.applyTextSize();
          app.toast('Backup restored!'); app.go('#/home');
        } catch (err) { app.toast(err.message); }
      };
      r.readAsText(f);
    });
    app.$('#reset', root).addEventListener('click', () => {
      if (!confirm('Erase ALL data? This cannot be undone unless you have a backup.')) return;
      if (!confirm('Are you really sure?')) return;
      app.state = S.reset(); app.save(); if (CNA.quiz && CNA.quiz.clearSaved) CNA.quiz.clearSaved(); app.quiz = null;
      app.go('#/welcome'); app.route();
    });
  };

  // ---------- My profile ----------
  V.profile = function (root) {
    const app = CNA.app, st = app.state;
    const first = !app.hasProfile(); // used the app before profiles existed
    root.innerHTML = (first ? '<header class="top"><h1>Create your profile</h1></header><div class="card soft small">New: the app now has a profile. Your study progress, shifts and notes are all still here.</div>'
      : app.header('My profile', '#/more')) +
      '<div class="card">' + app.profileFields(st.profile) + '<button class="block" id="pf-save">' + (first ? 'Save and continue' : 'Save profile') + '</button></div>';
    const read = app.bindProfileFields(root, st.profile);
    app.$('#pf-save', root).addEventListener('click', () => {
      const p = read();
      if (!p) return;
      st.profile = p;
      st.settings.name = p.firstName;
      app.save();
      app.toast(first ? 'Welcome back, ' + p.firstName + '!' : 'Profile saved.');
      app.go(first ? '#/home' : '#/more');
    });
  };

  // ---------- Settings ----------
  V.settings = function (root) {
    const app = CNA.app, st = app.state, s = st.settings, esc = app.esc;
    const dn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const seg = (id, vals, cur, fmt) => '<div class="seg" id="' + id + '">' + vals.map((v) => '<button type="button" data-v="' + v + '" class="' + (cur === v ? 'on' : '') + '">' + fmt(v) + '</button>').join('') + '</div>';
    root.innerHTML = app.header('Settings', '#/more') +
      '<div class="card"><p class="small muted" style="margin-top:0">Your name and picture are in <a href="#/profile">My profile</a>.</p>' +
      '<label for="goal">Weekly study goal (minutes)</label><input type="number" id="goal" min="10" max="2100" step="10" value="' + s.weeklyGoalMinutes + '">' +
      '<p class="small muted" id="goalH"></p>' +
      '<label>Session length</label>' + seg('len', [10, 15, 30, 45], s.sessionLength, (v) => v + ' min') +
      '<label>Most sessions per day</label>' + seg('max', [1, 2, 3, 4, 6], s.maxSessionsPerDay, String) +
      '<label for="brk">Break between sessions (minutes)</label><input type="number" id="brk" min="0" max="120" value="' + s.breakBetween + '">' +
      '<div class="grid2"><div><label for="bb">Rest before a shift (min)</label><input type="number" id="bb" min="0" max="480" step="15" value="' + s.bufferBeforeShift + '"></div>' +
      '<div><label for="ba">Rest after a shift (min)</label><input type="number" id="ba" min="0" max="720" step="15" value="' + s.bufferAfterShift + '"></div></div>' +
      '<p class="small muted">No studying is scheduled during your shifts or these rest times (getting ready, commuting, sleeping after nights).</p></div>' +
      '<h2>Hours I could study</h2><div class="card"><p class="small muted">The planner only uses these hours (plus any "Free time" you add on the calendar), minus shifts and appointments.</p>' +
      dn.map((name, d) => {
        const w = s.studyWindows[d];
        return '<div class="dayrow"><label class="row" style="margin:0"><input type="checkbox" data-en="' + d + '"' + (w.enabled !== false ? ' checked' : '') + '> ' + name + '</label>' +
          '<div class="times"><input type="time" data-ws="' + d + '" value="' + w.start + '" aria-label="' + name + ' start"><span>to</span><input type="time" data-we="' + d + '" value="' + w.end + '" aria-label="' + name + ' end"></div></div>';
      }).join('') + '</div>' +
      '<h2>Help chat</h2><a class="card item" href="#/aihelp" style="text-decoration:none"><span class="ico" aria-hidden="true">🌐</span><span class="grow"><span class="title">Online AI helper (optional)</span><br><span class="sub">' + (CNA.helpOnline && CNA.helpOnline.settings().on ? 'On' : 'Off') + ' — smarter chat answers when you have signal</span></span><span class="chev">›</span></a>' +
      '<h2>Display</h2><div class="card"><label>Text size</label>' + seg('ts', ['normal', 'large', 'xl'], s.textSize, (v) => ({ normal: 'Normal', large: 'Large', xl: 'Extra large' }[v])) + '</div>' +
      '<button class="block" id="save">Save settings</button>';

    const pick = {};
    ['len', 'max', 'ts'].forEach((id) => app.$$('#' + id + ' button', root).forEach((b) => b.addEventListener('click', () => {
      app.$$('#' + id + ' button', root).forEach((x) => x.classList.remove('on')); b.classList.add('on'); pick[id] = b.dataset.v;
      if (id === 'ts') { s.textSize = b.dataset.v; app.applyTextSize(); }
    })));
    const goalH = () => { app.$('#goalH', root).textContent = '= ' + T.fmtMinutes(Number(app.$('#goal', root).value) || 0) + ' per week'; };
    app.$('#goal', root).addEventListener('input', goalH); goalH();
    app.$('#save', root).addEventListener('click', () => {
      const num = (id, lo, hi, def) => { const v = Number(app.$('#' + id, root).value); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def; };
      s.weeklyGoalMinutes = num('goal', 10, 2100, 180);
      if (pick.len) s.sessionLength = Number(pick.len);
      if (pick.max) s.maxSessionsPerDay = Number(pick.max);
      s.breakBetween = num('brk', 0, 120, 10);
      s.bufferBeforeShift = num('bb', 0, 480, 60);
      s.bufferAfterShift = num('ba', 0, 720, 60);
      for (let d = 0; d < 7; d++) {
        s.studyWindows[d] = { enabled: app.$('[data-en="' + d + '"]', root).checked, start: app.$('[data-ws="' + d + '"]', root).value || '08:00', end: app.$('[data-we="' + d + '"]', root).value || '21:00' };
      }
      app.replan();
      app.go('#/more');
    });
  };

  V.about = function (root) {
    const app = CNA.app;
    root.innerHTML = app.header('About & Privacy', '#/more') +
      '<div class="card"><h3>My Free CNA Journey</h3><p>A free, open-source personal study companion for becoming a Certified Nursing Assistant. <span id="about-ver">Version …</span></p>' +
      '<ul><li>100% free — no ads, subscriptions, or in-app purchases</li><li>No account or login</li><li>Works offline after the first visit</li><li>MIT License — free to use, change and share</li></ul></div>' +
      '<div class="card"><h3>🔒 Privacy</h3><ul><li>All your data stays on this phone.</li><li>No analytics, tracking, accounts, or cookies. Study progress, shifts, and notes stay on this phone; network requests happen only to check static health-library updates, or when you look up an FDA drug label or turn on the optional Online AI helper with your own key.</li><li>Backups are files you control.</li><li><b>Never enter patient or resident information.</b> This app is for your own studying only.</li></ul></div>' +
      '<div class="disclaimer">Educational preparation only. This app is not a state-approved training program and does not replace supervised clinical training, your instructor, facility policies, or the state competency evaluation required for certification.</div>';
    // Real version number (from sw.js) and when updates were last checked.
    fetch('sw.js', { cache: 'no-store' }).then((r) => r.text()).then((t) => {
      const v = (t.match(/cna-v([\d.]+)/) || [])[1]; const el = document.getElementById('about-ver');
      let day = null; try { day = localStorage.getItem('cna-update-checked-day'); } catch (e) { /* ignore */ }
      if (el && v) el.textContent = 'Version ' + v + '. ' + (CNA.updater && window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()
        ? 'Checks for new, verified information once a day when you have internet' + (day ? ' (last checked ' + day + ').' : '.')
        : 'Updates itself with new, verified information when you open it with internet.');
    }).catch(() => {});
  };
})();
