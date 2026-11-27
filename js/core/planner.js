/* Availability + study planner. Pure functions, no DOM.
 *
 * Free study time for a day =
 *     (daily study window for that weekday  ∪  "available" blocks the user marked)
 *   − (work shifts, padded by rest buffers)
 *   − (appointments / commitments)
 *   − ("blocked" time and days marked "no study")
 *   − (time already in the past)
 *
 * The planner regenerates all FUTURE planned sessions every time it runs, so editing a shift
 * automatically re-flows the plan. Completed/skipped sessions are never touched. Planned sessions
 * whose time has passed without being completed become "missed" and their lesson goes back in the queue.
 */
(function (root) {
  'use strict';
  const T = (typeof module !== 'undefined' && module.exports) ? require('./time.js') : root.CNA.time;

  const SESSION_LENGTHS = [10, 15, 30, 45];
  const BUSY_TYPES = ['shift', 'appointment', 'blocked'];

  function uid(prefix) {
    return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  /** Busy intervals (ms) from events, shifts padded with before/after buffers. */
  function busyIntervals(events, settings) {
    const before = (settings.bufferBeforeShift || 0) * T.MIN;
    const after = (settings.bufferAfterShift || 0) * T.MIN;
    const out = [];
    for (const e of events) {
      if (!BUSY_TYPES.includes(e.type)) continue;
      let s = T.ms(e.start), en = T.ms(e.end);
      if (e.type === 'shift') { s -= before; en += after; }
      out.push([s, en]);
    }
    return T.merge(out);
  }

  /** Free intervals (ms) for one date key. */
  function freeIntervalsForDay(state, date, nowMs) {
    const settings = state.settings;
    const dayStart = T.ms(date);
    const dayEnd = T.ms(T.addDays(date, 1));
    const dow = T.parse(date).getDay();
    const base = [];

    if (!(settings.noStudyDays || []).includes(date)) {
      const w = (settings.studyWindows || {})[dow];
      if (w && w.enabled !== false && w.start && w.end) {
        const span = T.spanFromTimes(date, w.start, w.end);
        base.push([T.ms(span.start), Math.min(T.ms(span.end), dayEnd)]);
      }
      for (const e of state.events) {
        if (e.type === 'available') base.push([T.ms(e.start), T.ms(e.end)]);
      }
    } else {
      return [];
    }

    let free = T.clip(T.merge(base), dayStart, dayEnd);
    free = T.subtract(free, busyIntervals(state.events, settings));
    if (nowMs != null) free = T.clip(free, Math.max(dayStart, nowMs), dayEnd);
    // Round starts up to the next 5 minutes so sessions start at tidy times.
    const five = 5 * T.MIN;
    free = free.map((i) => [Math.ceil(i[0] / five) * five, i[1]]).filter((i) => i[1] - i[0] >= 10 * T.MIN);
    return free;
  }

  function freeMinutesForDay(state, date, nowMs) {
    return T.totalMinutes(freeIntervalsForDay(state, date, nowMs));
  }

  /** Minutes studied (completed sessions) in the Mon–Sun week containing `date`. */
  function minutesDoneInWeek(state, date) {
    const ws = T.weekStart(date);
    const we = T.addDays(ws, 7);
    return state.sessions
      .filter((s) => s.status === 'done' && s.date >= ws && s.date < we)
      .reduce((t, s) => t + (s.minutes || 0), 0);
  }

  /** Ordered list of lessons that still need time, with minutes remaining for each. */
  function lessonQueue(state, lessons) {
    const doneMin = {};
    for (const s of state.sessions) {
      if (s.status === 'done' && s.lessonId) doneMin[s.lessonId] = (doneMin[s.lessonId] || 0) + s.minutes;
    }
    const q = [];
    for (const l of lessons) {
      if (state.progress.lessons[l.id] && state.progress.lessons[l.id].completed) continue;
      const remaining = Math.max(5, (l.minutes || 15) - (doneMin[l.id] || 0));
      q.push({ id: l.id, title: l.title, remaining });
    }
    return q;
  }

  function nextLesson(state, lessons) {
    const q = lessonQueue(state, lessons);
    return q.length ? lessons.find((l) => l.id === q[0].id) : null;
  }

  /** Mark past planned sessions as missed. Returns number changed. */
  function markMissed(state, nowMs) {
    let n = 0;
    for (const s of state.sessions) {
      if (s.status === 'planned' && T.ms(s.end) <= nowMs) { s.status = 'missed'; n++; }
    }
    return n;
  }

  /**
   * Rebuild the study plan from `today` for `days` days.
   * opts: { now: Date, days: 14, lessons: [...] }
   * Mutates state.sessions and returns a summary.
   */
  function replan(state, opts) {
    const now = opts.now || new Date();
    const nowMs = now.getTime();
    const days = opts.days || 14;
    const lessons = opts.lessons || [];
    const settings = state.settings;
    const today = T.dateKey(now);

    const missed = markMissed(state, nowMs);
    // Drop future planned sessions (they will be regenerated). Keep done/skipped/missed history.
    // A session the user is in the middle of (started, not finished) is kept.
    state.sessions = state.sessions.filter((s) => s.status !== 'planned' || T.ms(s.start) <= nowMs);
    const inProgress = state.sessions.filter((s) => s.status === 'planned');

    const queue = lessonQueue(state, lessons);
    // Time already reserved by an in-progress session counts against its lesson.
    for (const s of inProgress) {
      const item = queue.find((x) => x.id === s.lessonId);
      if (item) item.remaining = Math.max(0, item.remaining - s.minutes);
    }
    let qi = 0;
    const takeContent = (len) => {
      while (qi < queue.length && queue[qi].remaining <= 0) qi++;
      if (qi < queue.length) {
        const item = queue[qi];
        item.remaining -= len;
        return { kind: 'lesson', lessonId: item.id, title: item.title };
      }
      return { kind: 'practice', lessonId: null, title: 'Practice test & review' };
    };

    const pref = SESSION_LENGTHS.includes(settings.sessionLength) ? settings.sessionLength : 30;
    const gap = (settings.breakBetween != null ? settings.breakBetween : 10) * T.MIN;
    const maxPerDay = settings.maxSessionsPerDay || 3;
    const created = [];

    // Plan week by week so the weekly goal is respected.
    let d = today;
    const end = T.addDays(today, days);
    while (d < end) {
      const ws = T.weekStart(d);
      const weekEnd = T.addDays(ws, 7);
      let remainingGoal = Math.max(0, (settings.weeklyGoalMinutes || 0) - minutesDoneInWeek(state, d));
      // subtract in-progress sessions this week
      for (const s of inProgress) if (s.date >= ws && s.date < weekEnd) remainingGoal -= s.minutes;

      const weekDays = [];
      for (let x = d; x < weekEnd && x < end; x = T.addDays(x, 1)) weekDays.push(x);

      // A session already in progress is busy time too (otherwise a new one could land on top of it).
      const reserved = inProgress.map((s) => [T.ms(s.start), T.ms(s.end) + gap]);
      const freeByDay = weekDays.map((day) => T.subtract(freeIntervalsForDay(state, day, day === today ? nowMs : null), reserved)
        .filter((i) => i[1] - i[0] >= 10 * T.MIN));
      for (let i = 0; i < weekDays.length && remainingGoal > 0; i++) {
        const daysLeft = freeByDay.slice(i).filter((f) => T.totalMinutes(f) >= 10).length || 1;
        let quota = Math.ceil(remainingGoal / daysLeft);
        let count = 0;
        const free = freeByDay[i].map((iv) => iv.slice());
        for (const iv of free) {
          let cursor = iv[0];
          while (quota > 0 && count < maxPerDay && remainingGoal > 0) {
            const room = Math.floor((iv[1] - cursor) / T.MIN);
            // pick the preferred length, or the biggest standard length that fits the room and quota
            let len = pref;
            const want = Math.min(pref, Math.max(10, quota));
            len = SESSION_LENGTHS.filter((l) => l <= want && l <= room).pop();
            if (!len) break;
            const content = takeContent(len);
            const start = T.toLocal(new Date(cursor));
            const sess = {
              id: uid('s'), date: weekDays[i], start, end: T.addMinutes(start, len), minutes: len,
              status: 'planned', kind: content.kind, lessonId: content.lessonId, title: content.title,
            };
            state.sessions.push(sess);
            created.push(sess);
            cursor += len * T.MIN + gap;
            quota -= len; remainingGoal -= len; count++;
          }
          if (quota <= 0 || count >= maxPerDay) break;
        }
      }
      d = weekEnd;
    }
    state.sessions.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
    state.meta.lastPlanned = T.toLocal(now);
    return { created: created.length, missed, minutes: created.reduce((t, s) => t + s.minutes, 0) };
  }

  /** Check whether a proposed event overlaps an existing shift/appointment (for warnings in the UI). */
  function conflicts(state, ev, ignoreId) {
    const s = T.ms(ev.start), e = T.ms(ev.end);
    return state.events.filter((x) => x.id !== ignoreId && BUSY_TYPES.includes(x.type) && T.ms(x.start) < e && T.ms(x.end) > s);
  }

  /** Create repeated copies of an event on chosen weekdays for N weeks (rotating schedules). */
  function repeatEvent(ev, weekdays, weeks) {
    const out = [];
    const startTime = ev.start.split('T')[1];
    const durMin = T.minutesBetween(ev.start, ev.end);
    const base = ev.start.split('T')[0];
    for (let i = 0; i < weeks * 7; i++) {
      const day = T.addDays(base, i);
      if (day === base) continue;
      if (!weekdays.includes(T.parse(day).getDay())) continue;
      const start = day + 'T' + startTime;
      out.push(Object.assign({}, ev, { id: uid('e'), start, end: T.addMinutes(start, durMin) }));
    }
    return out;
  }

  /** Rotation pattern, e.g. 4 on / 3 off starting on a date, for N days. */
  function rotationEvents(template, startDate, onDays, offDays, totalDays) {
    const out = [];
    const durMin = T.minutesBetween(template.start, template.end);
    const startTime = template.start.split('T')[1];
    for (let i = 0; i < totalDays; i++) {
      if (i % (onDays + offDays) >= onDays) continue;
      const day = T.addDays(startDate, i);
      const start = day + 'T' + startTime;
      out.push(Object.assign({}, template, { id: uid('e'), start, end: T.addMinutes(start, durMin) }));
    }
    return out;
  }

  const api = {
    SESSION_LENGTHS, BUSY_TYPES, uid, busyIntervals, freeIntervalsForDay, freeMinutesForDay,
    minutesDoneInWeek, lessonQueue, nextLesson, markMissed, replan, conflicts, repeatEvent, rotationEvents,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.CNA = root.CNA || {}; root.CNA.planner = api; }
})(typeof self !== 'undefined' ? self : this);
