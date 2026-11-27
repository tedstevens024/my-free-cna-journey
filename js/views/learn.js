/* Curriculum: unit list, lesson reader, knowledge check, lesson completion. */
(function () {
  'use strict';
  const CNA = window.CNA;
  const T = CNA.time;
  const V = (CNA.views = CNA.views || {});

  function unitProgress(st, unit) {
    const ls = CNA.curriculum.lessons.filter((l) => l.unit === unit.id);
    const done = ls.filter((l) => (st.progress.lessons[l.id] || {}).completed).length;
    return { done, total: ls.length, pct: Math.round((done / ls.length) * 100) };
  }

  V.learn = function (root) {
    const app = CNA.app, st = app.state, esc = app.esc;
    const comp = app.completion();
    const rec = CNA.planner.nextLesson(st, CNA.curriculum.lessons);
    root.innerHTML =
      app.header('Learn') +
      '<div class="card"><div class="row"><div class="grow"><b>Your CNA course</b><div class="small muted">' + comp.done + ' of ' + comp.total + ' lessons complete</div></div><b>' + comp.pct + '%</b></div>' +
      '<div class="bar" style="margin-top:8px"><span style="width:' + comp.pct + '%"></span></div>' +
      (rec ? '<a class="btn block" style="margin-top:12px" href="#/lesson/' + rec.id + '">Continue: ' + esc(rec.title) + '</a>' : '') + '</div>' +
      '<div class="card soft small">📋 Lessons follow the topic order of <b>Oklahoma\'s official nurse aide Course Standards</b> (Oklahoma State Department of Health) — the order an Oklahoma training program teaches. ' +
      '<b>⭐ First 16 hours</b> marks topics a federal rule (42 CFR 483.152) requires before you care for any resident. Your own instructor\'s order comes first.</div>' +
      '<div class="card"><ul class="list">' + CNA.curriculum.units.map((u, i) => {
        const p = unitProgress(st, u);
        return '<li><a class="item" href="#/unit/' + u.id + '"><span class="ico">' + u.icon + '</span><span class="grow"><span class="title">' + (i + 1) + '. ' + esc(u.title) + '</span><br>' +
          '<span class="sub">' + (u.first16 ? '⭐ First 16 hours · ' : '') + (u.ok ? 'Oklahoma topic' + (u.ok.length > 1 ? 's ' : ' ') + u.ok.join(', ') + ' · ' : '') + (p.done === p.total ? '✅ Complete' : p.done + ' of ' + p.total + ' lessons') + ' · 🔎 ' + CNA.sources.forUnit(u.id, CNA.curriculum.lessons).length + ' official sources</span></span><span class="chev">›</span></a></li>';
      }).join('') + '</ul></div>' +
      '<div class="disclaimer">Lessons are general study material for exam preparation. Your approved training program, clinical instructor, facility policies and Oklahoma\'s official study guide always come first.</div>';
  };

  V.unit = function (root, params) {
    const app = CNA.app, st = app.state, esc = app.esc;
    const u = app.unitById(params[0]);
    if (!u) return V.learn(root);
    const ls = CNA.curriculum.lessons.filter((l) => l.unit === u.id);
    root.innerHTML = app.header(u.icon + ' ' + u.title, '#/learn') +
      '<div class="card"><ul class="list">' + ls.map((l) => {
        const p = st.progress.lessons[l.id] || {};
        return '<li><a class="item" href="#/lesson/' + l.id + '"><span class="ico">' + (p.completed ? '✅' : '📄') + '</span><span class="grow"><span class="title">' + esc(l.title) + '</span><br>' +
          '<span class="sub">About ' + l.minutes + ' min' + (p.checkScore != null ? ' · Check: ' + p.checkScore + '%' : '') + '</span></span><span class="chev">›</span></a></li>';
      }).join('') + '</ul></div>' +
      '<div class="btnrow"><button class="secondary" id="unitQuiz">Quiz me on this unit</button></div>' +
      app.sourceBox(CNA.sources.forUnit(u.id, CNA.curriculum.lessons), 'Official sources for this subject');
    app.$('#unitQuiz', root).addEventListener('click', () => CNA.quiz.start({ mode: 'topic', topic: u.topic, title: u.title + ' quiz' }));
  };

  V.lesson = function (root, params) {
    const app = CNA.app, st = app.state, esc = app.esc;
    const l = app.lessonById(params[0]);
    if (!l) return V.learn(root);
    const u = app.unitById(l.unit);
    const prog = st.progress.lessons[l.id] || {};
    const qs = CNA.questions.questions.filter((q) => q.lesson === l.id);
    const all = CNA.curriculum.lessons;
    const idx = all.indexOf(l);
    const nextL = all[idx + 1];
    const active = app.activeSession && st.sessions.find((s) => s.id === app.activeSession && s.status === 'planned');
    const note = st.notes.find((n) => n.lessonId === l.id);

    const sectionHtml = l.sections.map((s) => '<h3>' + esc(s.h) + '</h3>' + (s.text ? '<p>' + esc(s.text) + '</p>' : '') +
      (s.list ? '<ul>' + s.list.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '')).join('');

    root.innerHTML =
      app.header(l.title, '#/unit/' + l.unit) +
      '<div class="small muted">' + u.icon + ' ' + esc(u.title) + ' · about ' + l.minutes + ' min' + (prog.completed ? ' · ✅ completed' : '') + '</div>' +
      (active ? '<div class="card soft small">⏱️ Study session in progress: ' + active.minutes + ' min. Mark it done when you finish.</div>' : '') +
      app.sourceBox(CNA.sources.forLesson(l.id), 'Where this lesson comes from', 'Oklahoma\'s official study guide and your instructor have the final word on exact procedures') +
      '<div class="card"><p><b>' + esc(l.summary) + '</b></p><div class="lesson-body">' + sectionHtml + '</div></div>' +
      '<div class="keypoints"><b>Key points</b> <span class="small muted">— each one checked against official sources</span>' + l.keyPoints.map((k, i) => {
        const v = CNA.sources.forKeyPoint(l.id, i);
        const badge = v.tip ? '<span class="pill">Study tip</span>'
          : v.partial ? '<span class="pill unverified">' + v.list.length + ' official source' + (v.list.length === 1 ? '' : 's') + ' so far</span>'
          : '<span class="pill done">✓ ' + v.list.length + ' official sources agree</span>';
        const links = v.list.map((x) => '<a class="srcbtn" href="' + esc(x.url) + '" target="_blank" rel="noopener noreferrer"><span class="grow"><span class="t">' + esc(x.title) + '</span><span class="by">' + esc(x.by) + '</span></span><span aria-hidden="true">↗</span></a>').join('');
        return '<div class="kp"><p>' + esc(k) + '</p>' + (v.tip ? badge : '<details><summary class="small">' + badge + ' <span class="muted">tap to check</span></summary>' +
          (v.note ? '<p class="small"><b>Note:</b> ' + esc(v.note) + '</p>' : '') + (v.partial ? '<p class="small"><b>Not fully cross-checked:</b> ' + esc(v.partial) + '</p>' : '') + links + '</details>') + '</div>';
      }).join('') + '</div>' +
      '<h2>Knowledge check</h2><div id="check"></div>' +
      '<h2>My notes for this lesson</h2><div class="card"><textarea id="lnote" placeholder="Write anything that helps you remember (no patient information)">' + esc(note ? note.text : '') + '</textarea>' +
      '<div class="btnrow"><button class="secondary" id="saveNote">Save note</button></div></div>' +
      '<div class="btnrow">' + (prog.completed ? '<button class="secondary" id="undo">Mark as not complete</button>' : '<button id="complete">Mark lesson complete</button>') +
      (active ? '<button class="secondary" id="sessDone">Session done</button>' : '') + '</div>' +
      (nextL ? '<a class="btn secondary block" style="margin-top:8px" href="#/lesson/' + nextL.id + '">Next lesson: ' + esc(nextL.title) + ' ›</a>' : '');

    // knowledge check (inline, instant feedback)
    const check = app.$('#check', root);
    let right = 0, answered = 0;
    check.innerHTML = qs.map((q, i) => {
      const ord = CNA.exam && CNA.exam.choiceOrder ? CNA.exam.choiceOrder(q) : q.choices.map((_, j) => j);
      return '<div class="card" data-q="' + i + '"><p><b>' + (i + 1) + '. ' + esc(q.q) + '</b></p>' +
        ord.map((origIdx) => '<button class="choice" data-c="' + origIdx + '">' + esc(q.choices[origIdx]) + '</button>').join('') + '<div class="fb"></div></div>';
    }).join('') ||
      '<div class="empty">No questions for this lesson yet.</div>';
    app.$$('[data-q]', check).forEach((card) => {
      const q = qs[Number(card.dataset.q)];
      app.$$('.choice', card).forEach((b) => b.addEventListener('click', () => {
        if (card.dataset.done) return;
        card.dataset.done = '1';
        const pick = Number(b.dataset.c), ok = pick === q.answer;
        answered++; if (ok) right++;
        CNA.quiz.recordAnswer(q.id, ok);
        app.$$('.choice', card).forEach((x) => { const cj = Number(x.dataset.c); if (cj === q.answer) x.classList.add('right'); else if (cj === pick) x.classList.add('wrong'); });
        const src = CNA.quiz && CNA.quiz.srcLine ? CNA.quiz.srcLine(q) : '';
        app.$('.fb', card).innerHTML = '<div class="explain ' + (ok ? 'right' : 'wrong') + '"><b>' + (ok ? '✓ Correct!' : '✗ Not quite.') + '</b> ' + esc(q.explain) + src + '</div>';
        if (answered === qs.length) {
          const pct = Math.round((right / qs.length) * 100);
          (st.progress.lessons[l.id] = st.progress.lessons[l.id] || {}).checkScore = pct;
          app.save();
          app.toast('Knowledge check: ' + right + '/' + qs.length + (pct >= 80 ? ' — nice work!' : ' — review the key points and try again later.'));
        }
      }));
    });

    app.$('#saveNote', root).addEventListener('click', () => {
      const text = app.$('#lnote', root).value.trim();
      if (note) { note.text = text; note.at = new Date().toISOString(); }
      else if (text) st.notes.unshift({ id: CNA.planner.uid('n'), at: new Date().toISOString(), lessonId: l.id, text });
      st.notes = st.notes.filter((n) => n.text);
      app.save(); app.toast('Note saved.');
    });
    const complete = app.$('#complete', root);
    if (complete) complete.addEventListener('click', () => {
      st.progress.lessons[l.id] = Object.assign(st.progress.lessons[l.id] || {}, { completed: true, completedAt: T.toLocal(new Date()) });
      if (active) app.finishSession(active.id, 'done'); else app.replan(true);
      app.toast('Lesson complete! 🎉');
      app.celebrate();
      app.route();
    });
    const undo = app.$('#undo', root);
    if (undo) undo.addEventListener('click', () => { st.progress.lessons[l.id].completed = false; app.replan(true); app.route(); });
    const sd = app.$('#sessDone', root);
    if (sd) sd.addEventListener('click', () => { app.finishSession(active.id, 'done'); app.toast('Session logged. Great job!'); app.route(); });
  };
})();
