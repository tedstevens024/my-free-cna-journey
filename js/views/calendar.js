/* Work calendar: shifts, appointments, busy/available time, and the auto study plan. */
(function () {
  'use strict';
  const CNA = window.CNA;
  const T = CNA.time, P = CNA.planner;
  const V = (CNA.views = CNA.views || {});

  V.calendar = function (root, params) {
    const app = CNA.app, st = app.state, esc = app.esc;
    const offset = Number(params[0] || 0); // 7-day pages starting today
    const today = T.dateKey(new Date());
    const start = T.addDays(today, offset * 7);
    const days = [];
    for (let i = 0; i < 7; i++) days.push(T.addDays(start, i));
    const weekFree = days.reduce((t, d) => t + (d < today ? 0 : P.freeMinutesForDay(st, d, d === today ? Date.now() : null)), 0);
    const planned = st.sessions.filter((s) => s.date >= days[0] && s.date <= days[6] && s.status !== 'missed' && s.status !== 'skipped')
      .reduce((t, s) => t + s.minutes, 0);

    root.innerHTML =
      app.header('Calendar') +
      '<div id="cal-add"><div class="btnrow"><a class="btn" href="#/event/new/shift">＋ Work shift</a><a class="btn secondary" href="#/event/new/appointment">＋ Appointment</a></div>' +
      '<div class="btnrow"><a class="btn secondary" href="#/event/new/available">＋ Free time</a><a class="btn secondary" href="#/event/new/blocked">＋ Busy time</a></div></div>' +
      '<div class="row" style="margin-top:14px"><button class="ghost" id="prev" aria-label="Previous 7 days">‹ Prev</button>' +
      '<div class="grow center"><b>' + esc(T.fmtDate(days[0])) + ' – ' + esc(T.fmtDate(days[6])) + '</b></div>' +
      '<button class="ghost" id="next" aria-label="Next 7 days">Next ›</button></div>' +
      '<div class="grid2"><div class="stat"><div class="num">' + T.fmtMinutes(weekFree) + '</div><div class="lbl">Free time in these 7 days</div></div>' +
      '<div class="stat"><div class="num">' + T.fmtMinutes(planned) + '</div><div class="lbl">Study planned or done (weekly goal ' + T.fmtMinutes(st.settings.weeklyGoalMinutes) + ')</div></div></div>' +
      days.map((d) => {
        const free = d < today ? 0 : P.freeMinutesForDay(st, d, d === today ? Date.now() : null);
        const off = (st.settings.noStudyDays || []).includes(d);
        return '<div class="card daycard"' + (d === today ? ' style="border-color:var(--teal)"' : '') + '><h3><span>' + (d === today ? 'Today · ' : '') + esc(T.fmtDate(d)) + '</span>' +
          (d >= today ? '<span class="small muted">' + (off ? 'No study' : T.fmtMinutes(free) + ' free') + '</span>' : '') + '</h3>' +
          app.renderTimeline(d) +
          (d >= today ? '<div class="btnrow"><a class="btn secondary" href="#/event/new/shift/' + d + '">＋ Add</a>' +
            '<button class="ghost" data-off="' + d + '">' + (off ? 'Allow study this day' : 'No study this day') + '</button></div>' : '') +
          '</div>';
      }).join('') +
      '<p class="small muted">Study sessions are placed automatically in your free time, outside work shifts (plus rest time before and after — change it in Settings), appointments and busy time. If you miss a session, it moves to your next free time.</p>';

    app.$('#prev', root).addEventListener('click', () => app.go('#/calendar/' + (offset - 1)));
    app.$('#next', root).addEventListener('click', () => app.go('#/calendar/' + (offset + 1)));
    app.bindTimeline(root);
    app.$$('[data-off]', root).forEach((b) => b.addEventListener('click', () => {
      const d = b.dataset.off, list = st.settings.noStudyDays || (st.settings.noStudyDays = []);
      const i = list.indexOf(d);
      if (i >= 0) list.splice(i, 1); else list.push(d);
      app.replan();
      app.route();
    }));
  };

  // ---------- event editor: #/event/new/<type>/<date>  or  #/event/<id> ----------
  V.event = function (root, params) {
    const app = CNA.app, st = app.state, esc = app.esc;
    const isNew = params[0] === 'new';
    const existing = isNew ? null : st.events.find((e) => e.id === params[0]);
    if (!isNew && !existing) { root.innerHTML = app.header('Not found', '#/calendar') + '<div class="empty">That item no longer exists.</div>'; return; }
    const type = existing ? existing.type : (params[1] || 'shift');
    const date = existing ? existing.start.split('T')[0] : (params[2] || T.dateKey(new Date()));
    const defaults = { shift: ['07:00', '15:00'], appointment: ['10:00', '11:00'], available: ['18:00', '20:00'], blocked: ['12:00', '13:00'] };
    const sT = existing ? existing.start.split('T')[1] : defaults[type][0];
    const eT = existing ? existing.end.split('T')[1] : defaults[type][1];
    const types = app.eventLabel;
    const dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const startDow = T.parse(date).getDay();

    root.innerHTML =
      app.header(isNew ? 'Add to calendar' : 'Edit', '#/calendar') +
      '<div class="card">' +
      '<label for="ev-type">Type</label><select id="ev-type">' + Object.keys(types).map((k) => '<option value="' + k + '"' + (k === type ? ' selected' : '') + '>' + types[k] + '</option>').join('') + '</select>' +
      '<label for="ev-title">Name (optional)</label><input id="ev-title" value="' + esc(existing ? existing.title : '') + '" placeholder="e.g. Day shift, Doctor visit">' +
      '<label for="ev-date">Date</label><input type="date" id="ev-date" value="' + date + '">' +
      '<div class="grid2"><div><label for="ev-s">Starts</label><input type="time" id="ev-s" value="' + sT + '"></div>' +
      '<div><label for="ev-e">Ends</label><input type="time" id="ev-e" value="' + eT + '"></div></div>' +
      '<p class="small muted" id="ev-note"></p>' +
      (isNew ? '<label for="ev-rep">Repeat</label><select id="ev-rep"><option value="none">Does not repeat</option><option value="weekly">Weekly on certain days</option><option value="rotation">Rotation (e.g. 4 on, 3 off)</option></select>' +
        '<div id="rep-weekly" hidden><label>On these days</label><div class="seg" id="ev-dows">' + dows.map((n, i) => '<button type="button" data-d="' + i + '" class="' + (i === startDow ? 'on' : '') + '">' + n + '</button>').join('') + '</div>' +
        '<label for="ev-weeks">For how many weeks?</label><input type="number" id="ev-weeks" min="1" max="26" value="4"></div>' +
        '<div id="rep-rot" hidden><div class="grid2"><div><label for="ev-on">Days on</label><input type="number" id="ev-on" min="1" max="14" value="4"></div>' +
        '<div><label for="ev-off">Days off</label><input type="number" id="ev-off" min="1" max="14" value="3"></div></div>' +
        '<label for="ev-days">Fill how many days ahead?</label><input type="number" id="ev-days" min="7" max="180" value="28"></div>' : '') +
      '<label for="ev-notes">Notes (optional)</label><textarea id="ev-notes" placeholder="Anything to remember (no patient information)">' + esc(existing ? existing.notes || '' : '') + '</textarea>' +
      '<div id="ev-warn"></div>' +
      '<div class="btnrow"><button id="ev-save">Save</button>' + (existing ? '<button class="danger" id="ev-del">Delete</button>' : '') + '</div>' +
      (existing && existing.series ? '<button class="ghost block" id="ev-del-series">Delete this and all later repeats</button>' : '') +
      '</div>';

    const $ = (id) => app.$('#' + id, root);
    function span() { return T.spanFromTimes($('ev-date').value, $('ev-s').value, $('ev-e').value); }
    function updateNote() {
      if (!$('ev-date').value || !$('ev-s').value || !$('ev-e').value) return;
      const sp = span();
      const mins = T.minutesBetween(sp.start, sp.end);
      const overnight = sp.end.split('T')[0] !== sp.start.split('T')[0];
      $('ev-note').textContent = T.fmtMinutes(mins) + (overnight ? ' · Overnight — ends ' + T.fmtDate(sp.end.split('T')[0]) + ' at ' + T.fmtTime(sp.end) : '');
      const c = P.conflicts(st, sp, existing && existing.id).filter((x) => $('ev-type').value !== 'available');
      $('ev-warn').innerHTML = c.length ? '<div class="card warn small">Heads up: this overlaps ' + c.map((x) => esc(x.title || types[x.type]) + ' (' + esc(T.fmtDate(x.start.split('T')[0])) + ')').join(', ') + '.</div>' : '';
    }
    // Some Android time/date pickers only fire "change", others only "input": listen to both.
    ['ev-date', 'ev-s', 'ev-e', 'ev-type'].forEach((id) => ['input', 'change'].forEach((evt) => $(id).addEventListener(evt, updateNote)));
    updateNote();

    if (isNew) {
      $('ev-rep').addEventListener('change', () => {
        $('rep-weekly').hidden = $('ev-rep').value !== 'weekly';
        $('rep-rot').hidden = $('ev-rep').value !== 'rotation';
      });
      app.$$('#ev-dows button', root).forEach((b) => b.addEventListener('click', () => b.classList.toggle('on')));
    }

    $('ev-save').addEventListener('click', () => {
      if (!$('ev-date').value || !$('ev-s').value || !$('ev-e').value) { app.toast('Please choose a date and times.'); return; }
      if ($('ev-s').value === $('ev-e').value && !confirm('The start and end times are the same, so this will last a full 24 hours. Is that right?')) return;
      if (isNew && $('ev-rep').value === 'weekly' && !app.$$('#ev-dows button.on', root).length) {
        app.toast('Pick at least one day for the weekly repeat.');
        return;
      }
      const sp = span();
      const ev = {
        id: existing ? existing.id : P.uid('e'), type: $('ev-type').value, title: $('ev-title').value.trim(),
        start: sp.start, end: sp.end, notes: $('ev-notes').value.trim(),
      };
      if (existing && existing.series) ev.series = existing.series;
      let added = [ev];
      if (isNew && $('ev-rep').value !== 'none') {
        ev.series = P.uid('series');
        if ($('ev-rep').value === 'weekly') {
          const sel = app.$$('#ev-dows button.on', root).map((b) => Number(b.dataset.d));
          const weeks = Math.min(26, Math.max(1, Number($('ev-weeks').value) || 1));
          added = added.concat(P.repeatEvent(ev, sel, weeks));
          if (!sel.includes(T.parse(sp.start).getDay())) added.shift();
        } else {
          const on = Math.max(1, Number($('ev-on').value) || 1), off = Math.max(1, Number($('ev-off').value) || 1);
          const total = Math.min(180, Math.max(7, Number($('ev-days').value) || 28));
          added = P.rotationEvents(ev, sp.start.split('T')[0], on, off, total);
          added.forEach((x) => { x.series = ev.series; });
        }
      }
      if (existing) Object.assign(existing, ev);
      else st.events.push(...added);
      st.events.sort((a, b) => (a.start < b.start ? -1 : 1));
      app.replan();
      app.go('#/calendar');
    });

    if (existing) {
      $('ev-del').addEventListener('click', () => {
        if (!confirm('Delete this item?')) return;
        st.events = st.events.filter((e) => e.id !== existing.id);
        app.replan();
        app.go('#/calendar');
      });
      if (existing.series) $('ev-del-series').addEventListener('click', () => {
        if (!confirm('Delete this and all later repeats?')) return;
        st.events = st.events.filter((e) => !(e.series === existing.series && e.start >= existing.start));
        app.replan();
        app.go('#/calendar');
      });
    }
  };
})();
