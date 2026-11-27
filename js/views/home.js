/* Home dashboard + first-run welcome. */
(function () {
  'use strict';
  const CNA = window.CNA;
  const T = CNA.time, P = CNA.planner;
  const V = (CNA.views = CNA.views || {});

  V.home = function (root) {
    const app = CNA.app, st = app.state, esc = app.esc;
    const today = T.dateKey(new Date());
    const freeToday = P.freeMinutesForDay(st, today, Date.now());
    const comp = app.completion();
    const weekDone = P.minutesDoneInWeek(st, today);
    const goal = st.settings.weeklyGoalMinutes || 1;
    const weekPct = Math.min(100, Math.round((weekDone / goal) * 100));
    const next = app.nextSession();
    const rec = P.nextLesson(st, CNA.curriculum.lessons);
    const now = Date.now();
    const upcoming = st.events.filter((e) => e.type === 'shift' && T.ms(e.end) > now)
      .sort((a, b) => (a.start < b.start ? -1 : 1)).slice(0, 3);
    const missedRecent = st.sessions.filter((s) => s.status === 'missed' && T.ms(s.end) > now - 3 * T.DAY).length;

    let nextHtml;
    if (next) {
      const isNow = T.ms(next.start) <= now;
      nextHtml = '<div class="card soft"><div class="small muted">' + (isNow ? 'Happening now' : 'Next study session') + '</div>' +
        '<h3 style="margin:.2em 0">📚 ' + esc(next.title) + '</h3>' +
        '<div class="muted">' + esc(T.fmtDate(next.date)) + ' · ' + esc(T.fmtTime(next.start)) + ' · ' + next.minutes + ' min</div>' +
        '<div class="btnrow"><button data-start="' + next.id + '">Start now</button>' +
        '<button class="secondary" id="doneNext">Mark done</button><button class="ghost" id="skipNext">Skip</button></div></div>';
    } else {
      nextHtml = '<div class="card soft"><h3>No sessions planned yet</h3><p class="muted">Add your work shifts on the Calendar and the app will fit study time around them. You can also start any lesson now.</p>' +
        '<div class="btnrow"><a class="btn" href="#/calendar">Open calendar</a></div></div>';
    }

    const milestones = buildMilestones(st, comp);

    root.innerHTML =
      app.header('My Free CNA Journey') +
      '<div class="card hero"><a class="profile-link hero-row" href="#/profile" aria-label="My profile">' + app.avatar(52) + '<div style="font-size:1.15em;font-weight:700">' + esc(app.greeting()) + '</div></a>' +
      '<div class="muted" style="margin:.3em 0 .8em">' + esc(app.cheer()) + '</div>' +
      '<div class="row"><div class="grow small">This week: ' + T.fmtMinutes(weekDone) + ' of ' + T.fmtMinutes(goal) + '</div><b>' + weekPct + '%</b></div>' +
      '<div class="bar" role="progressbar" aria-valuenow="' + weekPct + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + weekPct + '%"></span></div></div>' +

      '<div class="grid2">' +
      '<div class="stat"><div class="num">' + T.fmtMinutes(freeToday) + '</div><div class="lbl">Free study time left today</div></div>' +
      '<div class="stat"><div class="num">' + comp.pct + '%</div><div class="lbl">Course complete (' + comp.done + '/' + comp.total + ' lessons)</div></div>' +
      '</div>' +

      (!st.settings.tourDone ? '<div class="card soft row wrap-btn" id="tourCard"><span style="font-size:1.8em" aria-hidden="true">🧭</span><span class="grow"><b>New here?</b><br><span class="small">Take a quick tour to see how everything works.</span></span><button id="tourGo">Start tour</button></div>' : '') +

      (missedRecent ? '<div class="card warn small">You missed ' + missedRecent + ' session' + (missedRecent > 1 ? 's' : '') + ' recently — no problem. They\'ve been moved into your upcoming free time automatically.</div>' : '') +

      nextHtml +

      (rec ? '<div class="card"><div class="small muted">Recommended next lesson</div>' +
        '<a class="item" href="#/lesson/' + rec.id + '"><span class="ico">' + (app.unitById(rec.unit) || {}).icon + '</span>' +
        '<span class="grow"><span class="title">' + esc(rec.title) + '</span><br><span class="sub">' + esc((app.unitById(rec.unit) || {}).title) + ' · about ' + rec.minutes + ' min</span></span><span class="chev">›</span></a></div>'
        : '<div class="card ok"><h3>🎉 All lessons complete!</h3><p>Keep sharp with practice exams and the skills checklists.</p><a class="btn" href="#/tests">Take a practice exam</a></div>') +

      '<h2>Today · ' + esc(T.fmtDate(today)) + '</h2><div class="card">' + app.renderTimeline(today) + '</div>' +

      '<h2>Upcoming work shifts</h2><div class="card">' +
      (upcoming.length ? '<ul class="list">' + upcoming.map((e) =>
        '<li><a class="item" href="#/event/' + e.id + '"><span class="ico">💼</span><span class="grow"><span class="title">' + esc(e.title || 'Work shift') + '</span><br><span class="sub">' +
        esc(T.fmtDate(e.start.split('T')[0])) + ' · ' + esc(T.fmtTime(e.start)) + ' – ' + esc(T.fmtTime(e.end)) + '</span></span><span class="chev">›</span></a></li>').join('') + '</ul>'
        : '<div class="empty small">No upcoming shifts entered. <a href="#/event/new">Add a shift</a></div>') + '</div>' +

      '<h2>Milestones</h2><div class="card"><ul class="list">' + milestones.map((m) =>
        '<li class="item"><span class="ico">' + (m.done ? '✅' : '⬜') + '</span><span class="grow"><span class="title">' + esc(m.title) + '</span>' +
        (m.sub ? '<br><span class="sub">' + esc(m.sub) + '</span>' : '') + '</span></li>').join('') + '</ul></div>' +
      '<p class="small muted center">Educational preparation only — not a substitute for an approved training program, supervised clinical hours, or the Oklahoma competency evaluation.</p>';

    app.bindTimeline(root);
    const tg = app.$('#tourGo', root);
    if (tg) tg.addEventListener('click', () => CNA.tour.start('full'));
    if (next) {
      app.$('#doneNext', root).addEventListener('click', () => { app.finishSession(next.id, 'done'); app.toast('Great work! Session logged.'); app.route(); });
      app.$('#skipNext', root).addEventListener('click', () => { app.finishSession(next.id, 'skipped'); app.toast('Skipped — the plan has been adjusted.'); app.route(); });
    }
  };

  function buildMilestones(st, comp) {
    const units = CNA.curriculum.units, lessons = CNA.curriculum.lessons;
    const unitDone = (u) => lessons.filter((l) => l.unit === u.id).every((l) => (st.progress.lessons[l.id] || {}).completed);
    const doneUnits = units.filter(unitDone).length;
    const exams = st.attempts.filter((a) => a.mode === 'exam');
    const bestExam = exams.reduce((m, a) => Math.max(m, Math.round((a.correct / a.total) * 100)), 0);
    const skillCount = CNA.skills.skills.length;
    const practiced = Object.values(st.skills).filter((s) => (s.practiced || []).length).length;
    return [
      { title: 'Set up your schedule', done: st.events.length > 0, sub: 'Enter at least one work shift' },
      { title: 'Finish your first lesson', done: comp.done > 0 },
      { title: 'Complete 3 units', done: doneUnits >= 3, sub: doneUnits + ' of ' + units.length + ' units done' },
      { title: 'Practice every skill at least once', done: practiced >= skillCount, sub: practiced + ' of ' + skillCount + ' skills practiced' },
      { title: 'Finish all lessons', done: comp.done === comp.total, sub: comp.done + ' of ' + comp.total },
      { title: 'Score 80%+ on a full practice exam', done: bestExam >= 80, sub: exams.length ? 'Best so far: ' + bestExam + '%' : 'Not attempted yet' },
      { title: 'Read Oklahoma\'s official requirements', done: !!st.settings.stateChecked, sub: 'More → Oklahoma Requirements' },
    ];
  }

  // ---------- first-run welcome ----------
  V.welcome = function (root) {
    const app = CNA.app, s = app.state.settings, esc = app.esc;
    root.innerHTML =
      '<header class="top"><h1>Welcome 💚</h1></header>' +
      '<div class="card hero"><div style="font-size:1.2em;font-weight:700">Your personal Oklahoma CNA school in your pocket.</div>' +
      '<p class="muted">Free forever. No ads, no account, no tracking. Everything stays on this phone.</p></div>' +
      '<h2>Create your profile</h2><div class="card">' + app.profileFields(app.state.profile) + '</div>' +
      '<h2>Your study plan</h2><div class="card">' +
      '<label>How much do you want to study each week?</label><div class="seg" id="w-goal">' +
      [[60, '1 hr'], [120, '2 hr'], [180, '3 hr'], [300, '5 hr'], [420, '7 hr']].map((g) => '<button type="button" data-v="' + g[0] + '" class="' + (s.weeklyGoalMinutes === g[0] ? 'on' : '') + '">' + g[1] + '</button>').join('') + '</div>' +
      '<label>Usual session length</label><div class="seg" id="w-len">' +
      [10, 15, 30, 45].map((n) => '<button type="button" data-v="' + n + '" class="' + (s.sessionLength === n ? 'on' : '') + '">' + n + ' min</button>').join('') + '</div>' +
      '<p class="small muted">You can change all of this later in Settings.</p>' +
      '<button class="block" id="w-go">Let\'s get started</button>' +
      '<p class="center small" style="margin:12px 0 0"><a href="#/backup">New phone? Restore your backup file instead</a></p></div>' +
      '<div class="disclaimer">This app helps you study and prepare. It does not replace a state-approved nurse aide training program, supervised clinical training, or the Oklahoma competency evaluation. Never enter real patient information.</div>';

    const seg = (id, key) => app.$$('#' + id + ' button', root).forEach((b) => b.addEventListener('click', () => {
      app.$$('#' + id + ' button', root).forEach((x) => x.classList.remove('on'));
      b.classList.add('on'); s[key] = Number(b.dataset.v);
    }));
    seg('w-goal', 'weeklyGoalMinutes');
    seg('w-len', 'sessionLength');
    const readProfile = app.bindProfileFields(root, app.state.profile);
    app.$('#w-go', root).addEventListener('click', () => {
      const p = readProfile();
      if (!p) { window.scrollTo(0, 0); return; }
      app.state.profile = p;
      s.name = p.firstName;
      s.state = 'OK';
      s.onboarded = true;
      app.replan(true);
      app.go('#/home');
      setTimeout(() => CNA.tour.start('full'), 500); // guided tour for new users (they can close it)
    });
  };
})();
