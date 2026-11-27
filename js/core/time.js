/* Time + interval helpers. Pure functions, no DOM.
 * Datetimes are stored as local strings "YYYY-MM-DDTHH:MM" so they stay readable in backups.
 * Works in the browser (window.CNA.time) and in Node (require). */
(function (root) {
  'use strict';
  const MIN = 60000;
  const DAY = 86400000;

  const pad = (n) => String(n).padStart(2, '0');

  /** "YYYY-MM-DD" for a Date (local). */
  function dateKey(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  /** "HH:MM" for a Date (local). */
  function timeKey(d) {
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  /** "YYYY-MM-DDTHH:MM" for a Date (local). */
  function toLocal(d) {
    return dateKey(d) + 'T' + timeKey(d);
  }
  /** Parse "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM" as local time. */
  function parse(s) {
    const [datePart, timePart] = String(s).split('T');
    const [y, m, d] = datePart.split('-').map(Number);
    let hh = 0, mm = 0;
    if (timePart) [hh, mm] = timePart.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0);
  }
  function ms(s) { return parse(s).getTime(); }
  function addDays(dateStr, n) {
    const d = parse(dateStr);
    d.setDate(d.getDate() + n);
    return dateKey(d);
  }
  function addMinutes(localStr, n) {
    return toLocal(new Date(ms(localStr) + n * MIN));
  }
  /** Start of the week (Monday) for a date key. */
  function weekStart(dateStr) {
    const d = parse(dateStr);
    const dow = (d.getDay() + 6) % 7; // Mon=0
    d.setDate(d.getDate() - dow);
    return dateKey(d);
  }
  /** Minutes between two local strings. */
  function minutesBetween(a, b) { return Math.round((ms(b) - ms(a)) / MIN); }

  /** Build start/end from a date + "HH:MM" times. If end <= start the end is on the next day (overnight). */
  function spanFromTimes(date, startHHMM, endHHMM) {
    const start = date + 'T' + startHHMM;
    let end = date + 'T' + endHHMM;
    if (ms(end) <= ms(start)) end = addDays(date, 1) + 'T' + endHHMM;
    return { start, end };
  }

  // ---- Interval math on [startMs, endMs) pairs ----
  function merge(list) {
    const s = list.filter((i) => i[1] > i[0]).map((i) => [i[0], i[1]]).sort((a, b) => a[0] - b[0]);
    const out = [];
    for (const iv of s) {
      const last = out[out.length - 1];
      if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1]);
      else out.push(iv);
    }
    return out;
  }
  function subtract(base, cuts) {
    let result = merge(base);
    for (const c of merge(cuts)) {
      const next = [];
      for (const b of result) {
        if (c[1] <= b[0] || c[0] >= b[1]) { next.push(b); continue; }
        if (c[0] > b[0]) next.push([b[0], c[0]]);
        if (c[1] < b[1]) next.push([c[1], b[1]]);
      }
      result = next;
    }
    return result;
  }
  function clip(list, lo, hi) {
    return list.map((i) => [Math.max(i[0], lo), Math.min(i[1], hi)]).filter((i) => i[1] > i[0]);
  }
  function totalMinutes(list) {
    return Math.round(list.reduce((t, i) => t + (i[1] - i[0]), 0) / MIN);
  }

  function fmtTime(localStr) {
    const d = parse(localStr);
    let h = d.getHours();
    const m = d.getMinutes();
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + pad(m) + ' ' + ap;
  }
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(dateStr) {
    const d = parse(dateStr);
    return DOW[d.getDay()] + ', ' + MON[d.getMonth()] + ' ' + d.getDate();
  }
  function fmtMinutes(n) {
    n = Math.max(0, Math.round(n));
    const h = Math.floor(n / 60), m = n % 60;
    if (!h) return m + ' min';
    return m ? h + ' hr ' + m + ' min' : h + ' hr';
  }

  const api = {
    MIN, DAY, pad, dateKey, timeKey, toLocal, parse, ms, addDays, addMinutes, weekStart,
    minutesBetween, spanFromTimes, merge, subtract, clip, totalMinutes, fmtTime, fmtDate, fmtMinutes, DOW, MON,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.CNA = root.CNA || {}; root.CNA.time = api; }
})(typeof self !== 'undefined' ? self : this);
