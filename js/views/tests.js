/* Testing Center: quick quiz, topic quiz, question types, missed-question review, practice exam, score history. */
(function () {
  'use strict';
  const CNA = window.CNA;
  const T = CNA.time;
  const V = (CNA.views = CNA.views || {});

  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const TYPE_NAME = { mc: 'Multiple choice', tf: 'True or false', sc: 'Scenario' };

  // An unfinished quiz/exam is saved on the phone, so it survives the app being closed (a phone call,
  // switching apps, Android freeing memory). Questions are stored by id.
  const QKEY = 'cna-active-quiz';
  function persistQuiz(qz) {
    try {
      // Nothing answered yet = nothing to lose: don't leave an "unfinished" card for a quiz she only peeked at.
      if (!qz || qz.scored || qz.i >= qz.questions.length || !qz.answers.some((x) => x != null)) { localStorage.removeItem(QKEY); return; }
      localStorage.setItem(QKEY, JSON.stringify(Object.assign({}, qz, { questions: qz.questions.map((q) => q.id) })));
    } catch (e) { /* storage unavailable: the quiz just isn't resumable */ }
  }
  function savedQuiz() {
    try {
      const o = JSON.parse(localStorage.getItem(QKEY) || 'null');
      if (!o || !Array.isArray(o.questions)) return null;
      const byId = {}; CNA.questions.questions.forEach((q) => { byId[q.id] = q; });
      const qs = o.questions.map((id) => byId[id]);
      if (qs.some((q) => !q)) { localStorage.removeItem(QKEY); return null; } // app content changed
      return Object.assign(o, { questions: qs, answers: Array.isArray(o.answers) ? o.answers : [] });
    } catch (e) { return null; }
  }

  const quiz = (CNA.quiz = {
    /** Track missed questions. A missed question leaves the review list after 2 correct answers in a row. */
    recordAnswer(qid, ok) {
      const st = CNA.app.state, m = st.missedQuestions;
      if (!ok) m[qid] = { wrong: ((m[qid] || {}).wrong || 0) + 1, streak: 0, last: T.toLocal(new Date()) };
      else if (m[qid]) { m[qid].streak = (m[qid].streak || 0) + 1; if (m[qid].streak >= 2) delete m[qid]; }
    },
    start(opts) {
      const all = CNA.questions.questions;
      let pool;
      if (opts.mode === 'topic') pool = all.filter((q) => q.topic === opts.topic);
      else if (opts.mode === 'type') pool = all.filter((q) => q.type === opts.type);
      else if (opts.mode === 'missed') pool = all.filter((q) => CNA.app.state.missedQuestions[q.id]);
      else pool = all;
      let qs, shortages = [], deadline = null;
      if (opts.mode === 'exam') {
        // Oklahoma 7C Long Term Care Nurse Aide written-test blueprint (see js/data/exam.js for sources).
        const built = CNA.exam.build(all);
        qs = built.questions; shortages = built.shortages;
        deadline = Date.now() + CNA.exam.MINUTES * 60000;
      } else {
        const n = opts.count || (opts.mode === 'quick' ? 10 : 15);
        qs = shuffle(pool).slice(0, n);
      }
      if (!qs.length) { CNA.app.toast('No questions to show here yet.'); return; }
      const order = qs.map((q) => (CNA.exam && CNA.exam.choiceOrder ? CNA.exam.choiceOrder(q) : q.choices.map((_, j) => j)));
      CNA.app.quiz = { mode: opts.mode, topic: opts.topic || null, title: opts.title, questions: qs, order, answers: [], i: 0, feedback: opts.mode !== 'exam', startedAt: Date.now(), deadline, shortages };
      persistQuiz(CNA.app.quiz);
      CNA.app.go('#/quiz');
    },
    resume() {
      const qz = savedQuiz();
      if (!qz) { CNA.app.toast('That quiz could not be resumed.'); return; }
      CNA.app.quiz = qz;
      CNA.app.go('#/quiz');
    },
    saved: savedQuiz,
    clearSaved() { try { localStorage.removeItem(QKEY); } catch (e) { /* ignore */ } },
    srcLine,
  });

  V.tests = function (root) {
    const app = CNA.app, st = app.state, esc = app.esc;
    const missedCount = Object.keys(st.missedQuestions).length;
    const recent = st.attempts.slice(-10);
    const avg = recent.length ? Math.round(recent.reduce((t, a) => t + (a.correct / a.total) * 100, 0) / recent.length) : null;
    const total = CNA.questions.questions.length;

    const saved = (app.quiz && !app.quiz.scored && app.quiz.i < app.quiz.questions.length && app.quiz.answers.some((x) => x != null)) ? app.quiz : quiz.saved();
    const savedLeft = saved && saved.mode === 'exam' && saved.deadline ? saved.deadline - Date.now() : null;
    root.innerHTML =
      app.header('Testing Center') +
      (saved ? '<div class="card warn"><b>⏸️ Unfinished: ' + esc(saved.title || 'Quiz') + '</b><p class="small" style="margin:4px 0 8px">' +
        saved.answers.filter((x) => x != null).length + ' of ' + saved.questions.length + ' answered' +
        (savedLeft != null ? ' · ' + (savedLeft > 0 ? fmtLeft(savedLeft) + ' left on the timer (it keeps running)' : 'time is up — open it to see your score') : '') +
        '</p><div class="btnrow"><button id="resumeQ">' + (savedLeft != null && savedLeft <= 0 ? 'See score' : 'Resume') + '</button><button class="ghost" id="discardQ">Discard</button></div></div>' : '') +
      '<div class="grid2"><div class="stat"><div class="num">' + (avg == null ? '—' : avg + '%') + '</div><div class="lbl">Average of last ' + (recent.length || 0) + ' tests</div></div>' +
      '<div class="stat"><div class="num">' + missedCount + '</div><div class="lbl">Questions to review</div></div></div>' +
      '<div class="card"><ul class="list">' +
      item('quick', '⚡', 'Quick quiz', '10 random questions with instant explanations') +
      item('missed', '🔁', 'Review missed questions', missedCount ? missedCount + ' saved — answer each right twice to clear it' : 'Nothing saved yet — great!') +
      item('exam', '🎓', 'Oklahoma practice exam', CNA.exam.TOTAL + ' questions · ' + (CNA.exam.MINUTES / 60) + ' hours · ' + CNA.exam.PASS + '% to pass · weighted like the real Oklahoma test') +
      item('tf', '⚖️', 'True or false', 'Practice the true/false questions') +
      item('sc', '🧩', 'Scenario questions', 'What would you do?') +
      '</ul></div>' +
      examInfo() +
      '<h2>Quiz by topic</h2><div class="card"><ul class="list">' + CNA.curriculum.units.map((u) => {
        const n = CNA.questions.questions.filter((q) => q.topic === u.topic).length;
        return '<li><button class="item" data-topic="' + u.topic + '" data-title="' + esc(u.title) + '"><span class="ico">' + u.icon + '</span><span class="grow"><span class="title">' + esc(u.title) + '</span><br><span class="sub">' + n + ' questions</span></span><span class="chev">›</span></button></li>';
      }).join('') + '</ul></div>' +
      '<h2>Score history</h2><div class="card">' + history(st) + '</div>' +
      '<p class="small muted center">' + total + ' original practice questions. These are not the official state exam questions.</p>';

    function item(mode, ico, title, sub) {
      return '<li><button class="item" data-mode="' + mode + '"><span class="ico">' + ico + '</span><span class="grow"><span class="title">' + title + '</span><br><span class="sub">' + esc(sub) + '</span></span><span class="chev">›</span></button></li>';
    }
    if (saved) {
      app.$('#resumeQ', root).addEventListener('click', () => { if (app.quiz !== saved) app.quiz = saved; app.go('#/quiz'); });
      app.$('#discardQ', root).addEventListener('click', () => {
        if (!confirm('Discard this unfinished ' + (saved.mode === 'exam' ? 'exam' : 'quiz') + '? Your answers will not be scored.')) return;
        quiz.clearSaved();
        if (app.quiz === saved) app.quiz = null;
        app.route();
      });
    }
    app.$$('[data-mode]', root).forEach((b) => b.addEventListener('click', () => {
      const m = b.dataset.mode;
      if (m === 'tf' || m === 'sc') quiz.start({ mode: 'type', type: m, title: TYPE_NAME[m] });
      else if (m === 'missed') quiz.start({ mode: 'missed', title: 'Missed question review', count: 30 });
      else quiz.start({ mode: m, title: m === 'exam' ? 'Practice exam' : 'Quick quiz' });
    }));
    app.$$('[data-topic]', root).forEach((b) => b.addEventListener('click', () => quiz.start({ mode: 'topic', topic: b.dataset.topic, title: b.dataset.title + ' quiz' })));
  };

  /** "About the Oklahoma written test" card: every fact with its official sources. */
  function examInfo() {
    const esc = CNA.app.esc, E = CNA.exam;
    const link = (s) => '<a class="srcbtn" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer"><span class="grow"><span class="t">' + esc(s.title) + '</span><span class="by">' + esc(s.by) + '</span></span><span aria-hidden="true">↗</span></a>';
    return '<details class="card"><summary><b>📋 About the real Oklahoma written test</b> <span class="small muted">(tap)</span></summary>' +
      E.facts.map((f) => '<div class="kp"><p>' + esc(f.text) + '</p>' +
        '<details><summary class="small">' + (f.partial ? '<span class="pill unverified">' + f.sources.length + ' official sources</span>' : '<span class="pill done">✓ ' + f.sources.length + ' official sources agree</span>') + ' <span class="muted">tap to check</span></summary>' +
        (f.note ? '<p class="small"><b>Note:</b> ' + esc(f.note) + '</p>' : '') + (f.partial ? '<p class="small"><b>Not fully cross-checked:</b> ' + esc(f.partial) + '</p>' : '') +
        f.sources.map((i) => link(E.sources[i])).join('') + '</details></div>').join('') +
      '<h3>Questions by area (Oklahoma 7C Long Term Care Nurse Aide)</h3><ul class="list">' +
      E.duties.map((d) => '<li class="item"><span class="grow">' + esc(d.id + '. ' + d.title) + '</span><b>' + d.weight + '% · ' + d.count + ' Q</b></li>').join('') + '</ul>' +
      '<p class="small muted">The practice exam uses original questions written from the app\'s Oklahoma-sourced lessons. They are not the official test questions.</p></details>';
  }

  function history(st) {
    const list = st.attempts.slice(-12);
    if (!list.length) return '<div class="empty small">Take a quiz to start tracking your scores.</div>';
    const cols = list.map((a) => { const p = Math.round((a.correct / a.total) * 100); return '<div class="col" style="height:' + Math.max(4, p) + '%" title="' + p + '%"><span>' + p + '</span></div>'; }).join('');
    const rows = st.attempts.slice(-6).reverse().map((a) => '<li class="item"><span class="ico">' + (a.mode === 'exam' ? '🎓' : '📝') + '</span><span class="grow"><span class="title">' + CNA.app.esc(a.title || a.mode) + '</span><br><span class="sub">' +
      CNA.app.esc(T.fmtDate(a.at.split('T')[0])) + ' · ' + a.correct + '/' + a.total + '</span></span><b>' + Math.round((a.correct / a.total) * 100) + '%</b></li>').join('');
    return '<div class="chart" aria-label="Recent scores">' + cols + '</div><ul class="list" style="margin-top:10px">' + rows + '</ul>';
  }

  V.quiz = function (root) {
    const app = CNA.app, esc = app.esc;
    if (!app.quiz) app.quiz = savedQuiz();
    const qz = app.quiz;
    if (!qz) return app.go('#/tests');
    if (qz.mode === 'exam' && qz.deadline && Date.now() >= qz.deadline && qz.i < qz.questions.length) { qz.timedOut = true; qz.i = qz.questions.length; app.toast('Time ran out while the app was closed — your exam has been submitted.'); }
    if (qz.i >= qz.questions.length) return app.go('#/results');
    persistQuiz(qz);
    const q = qz.questions[qz.i];
    const answered = qz.answers[qz.i];
    const pct = Math.round((qz.i / qz.questions.length) * 100);

    const exam = qz.mode === 'exam';
    const last = qz.i + 1 === qz.questions.length;
    const answeredCount = qz.answers.filter((a) => a != null).length;
    const ord = (qz.order && Array.isArray(qz.order[qz.i]) && qz.order[qz.i].length === q.choices.length)
      ? qz.order[qz.i] : q.choices.map((_, j) => j);
    root.innerHTML =
      app.header(qz.title, '#/tests') +
      (exam ? '<div class="card soft row" style="padding:10px 14px"><span class="grow small">⏱️ Time left: <b id="timer">' + fmtLeft(qz.deadline - Date.now()) + '</b></span><span class="small muted">' + answeredCount + '/' + qz.questions.length + ' answered</span></div>' : '') +
      '<div class="row small muted"><div class="grow">Question ' + (qz.i + 1) + ' of ' + qz.questions.length + '</div><span class="pill">' + TYPE_NAME[q.type] + '</span></div>' +
      '<div class="bar" style="margin:8px 0"><span style="width:' + pct + '%"></span></div>' +
      '<div class="card"><p style="font-size:1.05em"><b>' + esc(q.q) + '</b></p>' +
      ord.map((origIdx) => '<button class="choice" data-c="' + origIdx + '">' + esc(q.choices[origIdx]) + '</button>').join('') +
      '<div id="fb"></div></div>' +
      '<div class="btnrow">' + (exam && qz.i > 0 ? '<button class="secondary" id="prevQ">‹ Previous</button>' : '') +
      '<button id="nextQ" ' + (answered == null && !exam ? 'disabled' : '') + '>' + (last ? (exam ? 'Finish exam' : 'See results') : 'Next question') + '</button>' +
      '<button class="ghost" id="quit">' + (exam ? 'End exam' : 'End quiz') + '</button></div>' +
      (exam ? '<p class="small muted center">No answers are shown until you finish — like the real test. You can skip and come back with Previous.</p>' : '');

    const show = (pick) => {
      const ok = pick === q.answer;
      app.$$('.choice', root).forEach((x) => {
        const cj = Number(x.dataset.c);
        x.classList.remove('picked');
        if (qz.feedback) { if (cj === q.answer) x.classList.add('right'); else if (cj === pick) x.classList.add('wrong'); }
        else if (cj === pick) x.classList.add('picked');
      });
      if (qz.feedback) app.$('#fb', root).innerHTML = '<div class="explain ' + (ok ? 'right' : 'wrong') + '"><b>' + (ok ? '✓ Correct!' : '✗ Not quite.') + '</b> ' + esc(q.explain) + srcLine(q) + '</div>';
    };
    if (answered != null) show(answered);

    app.$$('.choice', root).forEach((b) => b.addEventListener('click', () => {
      if (qz.feedback && qz.answers[qz.i] != null) return; // locked after feedback
      qz.answers[qz.i] = Number(b.dataset.c);
      persistQuiz(qz);
      show(qz.answers[qz.i]);
      app.$('#nextQ', root).disabled = false;
    }));
    const finishExam = () => { qz.i = qz.questions.length; app.go('#/results'); };
    app.$('#nextQ', root).addEventListener('click', () => {
      if (exam && last) {
        const left = qz.questions.length - qz.answers.filter((a) => a != null).length;
        if (left && !confirm(left + ' question(s) are unanswered and will be marked wrong. Finish the exam?')) return;
        return finishExam();
      }
      qz.i++; app.route();
    });
    const prev = app.$('#prevQ', root);
    if (prev) prev.addEventListener('click', () => { qz.i--; app.route(); });
    app.$('#quit', root).addEventListener('click', () => {
      if (exam) { if (confirm('End the exam now? Unanswered questions count as wrong.')) finishExam(); return; }
      if (!qz.answers.length || confirm('End the quiz now? Answered questions will be scored.')) { qz.questions = qz.questions.slice(0, Math.max(1, qz.answers.length)); qz.i = qz.questions.length; app.go('#/results'); }
    });

    // Exam countdown: updates every second and submits automatically when time runs out.
    if (exam) {
      if (app._examTimer) clearInterval(app._examTimer);
      app._examTimer = setInterval(() => {
        if (location.hash !== '#/quiz' || app.quiz !== qz || qz.i >= qz.questions.length) { clearInterval(app._examTimer); return; }
        const ms = qz.deadline - Date.now();
        const el = document.getElementById('timer');
        if (el) el.textContent = fmtLeft(ms);
        if (ms <= 0) { clearInterval(app._examTimer); qz.timedOut = true; app.toast('Time is up — your exam has been submitted.'); finishExam(); }
      }, 1000);
    }
  };

  /** Official Oklahoma source line for questions that carry one. */
  function srcLine(q) {
    if (!q.src) return '';
    const esc = CNA.app.esc;
    return '<div class="small" style="margin-top:6px">🔎 Oklahoma source: <i>"' + esc(q.src.quote) + '"</i> — <a href="' + esc(q.src.url) + '" target="_blank" rel="noopener noreferrer">' + esc(q.src.title) + '</a></div>';
  }

  function fmtLeft(ms) {
    ms = Math.max(0, ms);
    const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h + ':' + String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  }

  V.results = function (root) {
    const app = CNA.app, st = app.state, esc = app.esc;
    if (!app.quiz) { app.quiz = savedQuiz(); if (app.quiz) app.quiz.i = app.quiz.questions.length; }
    const qz = app.quiz;
    if (!qz) return app.go('#/tests');
    if (!qz.scored) {
      let correct = 0;
      const wrongIds = [];
      qz.questions.forEach((q, i) => {
        const ok = qz.answers[i] === q.answer;
        if (ok) correct++; else wrongIds.push(q.id);
        if (qz.answers[i] != null) quiz.recordAnswer(q.id, ok);
      });
      qz.correct = correct;
      const attempt = { id: CNA.planner.uid('t'), at: T.toLocal(new Date()), mode: qz.mode, topic: qz.topic, title: qz.title, total: qz.questions.length, correct, wrongIds };
      if (qz.mode === 'exam') {
        qz.duties = CNA.exam.breakdown(qz.questions, qz.answers);
        attempt.minutes = Math.round((Date.now() - qz.startedAt) / 60000);
        attempt.duties = qz.duties.map((d) => ({ id: d.duty.id, correct: d.correct, total: d.total }));
      }
      st.attempts.push(attempt);
      if (st.attempts.length > 300) st.attempts = st.attempts.slice(-300);
      qz.scored = true;
      qz.justScored = true;
      persistQuiz(qz); // removes the saved copy
      const active = app.activeSession && st.sessions.find((s) => s.id === app.activeSession && s.status === 'planned');
      if (active && !active.lessonId) app.finishSession(active.id, 'done');
      app.save();
    }
    const pct = Math.round((qz.correct / qz.questions.length) * 100);
    if (qz.justScored) { qz.justScored = false; if (qz.mode === 'exam' ? pct >= CNA.exam.PASS : pct >= 80) setTimeout(app.celebrate, 250); }
    const msg = pct >= 90 ? 'Outstanding! 🌟' : pct >= 80 ? 'Great job — you\'re on track! 💪' : pct >= 60 ? 'Good effort. Review the explanations below.' : 'Keep going — every review makes you stronger. 💚';
    const wrong = qz.questions.map((q, i) => ({ q, a: qz.answers[i] })).filter((x) => x.a !== x.q.answer);

    let examHtml = '';
    if (qz.mode === 'exam') {
      const passed = pct >= CNA.exam.PASS;
      const weak = (qz.duties || []).filter((d) => d.total && d.correct / d.total < CNA.exam.PASS / 100);
      const lessonFor = (dutyId) => Object.keys(CNA.exam.DUTY_BY_LESSON).filter((l) => CNA.exam.DUTY_BY_LESSON[l] === dutyId).map((l) => app.lessonById(l)).filter(Boolean);
      examHtml =
        '<div class="card ' + (passed ? 'ok' : 'warn') + ' center"><b style="font-size:1.15em">' + (passed ? '✓ Passing score' : 'Not passing yet') + '</b><br><span class="small">Oklahoma requires ' + CNA.exam.PASS + '% on the written test.' +
        (qz.timedOut ? ' Time ran out.' : '') + '</span></div>' +
        '<h2>Score by Oklahoma test area</h2><div class="card"><ul class="list">' + (qz.duties || []).filter((d) => d.total).map((d) => {
          const p = Math.round((d.correct / d.total) * 100);
          return '<li class="item"><span class="grow"><span class="title">' + esc(d.duty.id + '. ' + d.duty.title) + '</span><br><span class="sub">' + d.correct + ' of ' + d.total + ' correct</span></span><b class="' + (p >= CNA.exam.PASS ? '' : 'muted') + '">' + p + '%</b></li>';
        }).join('') + '</ul></div>' +
        (weak.length ? '<h2>Study these next</h2><div class="card"><ul class="list">' + weak.map((d) => lessonFor(d.duty.id).slice(0, 3).map((l) =>
          '<li><a class="item" href="#/lesson/' + l.id + '"><span class="ico">📖</span><span class="grow"><span class="title">' + esc(l.title) + '</span><br><span class="sub">' + esc(d.duty.title) + '</span></span><span class="chev">›</span></a></li>').join('')).join('') + '</ul></div>' : '') +
        ((qz.shortages || []).length ? '<p class="small muted">Note: the app does not have enough Oklahoma-sourced questions yet for ' + qz.shortages.map((s) => esc(s.title) + ' (' + s.have + ' of ' + s.need + ')').join(', ') + '; extra questions came from other areas.</p>' : '');
    }

    root.innerHTML =
      app.header('Results', '#/tests') +
      '<div class="card hero center"><div style="font-size:2.6em;font-weight:800">' + pct + '%</div><div>' + qz.correct + ' of ' + qz.questions.length + ' correct</div><div class="muted">' + esc(msg) + '</div></div>' +
      examHtml +
      (wrong.length ? '<h2>Review (' + wrong.length + ')</h2><p class="small muted">These are saved to "Review missed questions".</p>' + wrong.map((x) =>
        '<div class="card"><p><b>' + esc(x.q.q) + '</b></p>' +
        (x.a != null ? '<div class="explain wrong small">Your answer: ' + esc(x.q.choices[x.a]) + '</div>' : '<div class="explain wrong small">Not answered</div>') +
        '<div class="explain right small"><b>Correct: ' + esc(x.q.choices[x.q.answer]) + '</b><br>' + esc(x.q.explain) + srcLine(x.q) + '</div></div>').join('')
        : '<div class="card ok center">Perfect score — nothing to review!</div>') +
      '<div class="btnrow"><a class="btn" href="#/tests">Back to Testing Center</a><button class="secondary" id="again">Try another</button></div>';
    app.$('#again', root).addEventListener('click', () => quiz.start({ mode: qz.mode, topic: qz.topic, type: qz.questions[0].type, title: qz.title }));
  };
})();
