/* Keeps the help chat's MedlinePlus (NIH) library up to date by itself.
 *
 * Phones cannot download from medlineplus.gov directly (NIH only allows its own websites), so a daily
 * GitHub Actions job (.github/workflows/medlineplus.yml) rebuilds app/data/medlineplus.json from the official
 * MedlinePlus file and publishes it with the app. This file checks for it:
 *   - every time the app is opened (and whenever the phone reconnects), only when online. If there is new
 *     information at launch, a full-screen notice downloads it BEFORE the app can be used (user's requirement);
 *   - downloads the 2 MB library ONLY when its content fingerprint changed (saves mobile data);
 *   - checks the download is a complete, official MedlinePlus library before using it;
 *   - keeps it on the phone (Cache Storage), so it works offline. If anything fails, the built-in copy is used.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.CNA = root.CNA || {}; root.CNA.medlineUpdate = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const BASE = 'data/';                 // same place the app is hosted
  const CACHE = 'cna-mlp-data';
  const K_HASH = 'cna-mlp-hash', K_DATE = 'cna-mlp-date', K_CHECKED = 'cna-mlp-checked';
  const MIN_GAP = 60 * 1000;            // ignore repeat checks within a minute (e.g. open + reconnect together)

  /* A downloaded library is used only if it is complete and every topic is an official MedlinePlus page. */
  function validate(d) {
    if (!d || typeof d !== 'object' || !Array.isArray(d.topics)) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date || '') || d.topics.length < 900) return false;
    return d.topics.every((t) => t && typeof t.t === 'string' && t.t && typeof t.s === 'string' && t.s.length >= 80 &&
      typeof t.u === 'string' && t.u.indexOf('https://medlineplus.gov/') === 0);
  }

  function ls() { try { return window.localStorage; } catch (e) { return null; } }
  function get(k) { try { const s = ls(); return s ? s.getItem(k) : null; } catch (e) { return null; } }
  function set(k, v) { try { const s = ls(); if (s) s.setItem(k, v); } catch (e) { /* storage blocked */ } }

  function builtIn() { return (typeof CNA !== 'undefined' && CNA.medlineplusBuiltIn) || {}; }
  /* What the phone has now: a downloaded update, or the copy built into the app. */
  function current() {
    const h = get(K_HASH), d = get(K_DATE), b = builtIn();
    return h && d && (!b.date || d >= b.date) ? { hash: h, date: d, downloaded: true } : { hash: b.hash || '', date: b.date || '', downloaded: false };
  }

  /* The downloaded library, if there is one newer than the built-in copy (else null → use the built-in file). */
  async function loadDownloaded() {
    const c = current();
    if (!c.downloaded || typeof caches === 'undefined') return null;
    try {
      const r = await (await caches.open(CACHE)).match('medlineplus.json');
      if (!r) return null;
      const d = await r.json();
      return validate(d) ? d : null;
    } catch (e) { return null; }
  }

  let running = null;
  /* Ask the hosted app which MedlinePlus library is newest. → { needed, v } or { status } on failure. */
  async function newestVersion() {
    if (typeof fetch !== 'function' || typeof caches === 'undefined') return { status: 'unsupported' };
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return { status: 'offline' };
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), 8000) : null;    // a slow network must not hold up the app
    try {
      const vr = await fetch(BASE + 'medlineplus-version.json?t=' + Date.now(), { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined });
      if (!vr.ok) return { status: 'unavailable' };
      const v = await vr.json();
      set(K_CHECKED, String(Date.now()));
      const have = current();
      const needed = !!(v && v.hash && v.hash !== have.hash && !(have.date && v.date < have.date));
      return { needed, v, have };
    } catch (e) {
      return { status: 'unavailable' };
    } finally { if (timer) clearTimeout(timer); }
  }

  /* Download, check and store a new library. onProgress(0..1) when the size is known. */
  async function download(v, onProgress) {
    try {
      const dr = await fetch(BASE + 'medlineplus.json?h=' + encodeURIComponent(v.hash), { cache: 'no-store' });
      if (!dr.ok) return { status: 'unavailable' };
      let text;
      const total = Number(dr.headers.get('content-length')) || v.bytes || 0;
      if (dr.body && dr.body.getReader && typeof TextDecoder !== 'undefined') {
        const reader = dr.body.getReader(), dec = new TextDecoder();
        let got = 0; text = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          got += value.length; text += dec.decode(value, { stream: true });
          if (onProgress && total) onProgress(Math.min(1, got / total));
        }
        text += dec.decode();
      } else text = await dr.text();
      let d;
      try { d = JSON.parse(text); } catch (e) { return { status: 'bad' }; }
      if (!validate(d)) return { status: 'bad' };
      await (await caches.open(CACHE)).put('medlineplus.json', new Response(text, { headers: { 'content-type': 'application/json' } }));
      set(K_HASH, d.hash || v.hash);
      set(K_DATE, d.date);
      if (typeof CNA !== 'undefined' && CNA.helpbot && CNA.helpbot.reloadMedline) CNA.helpbot.reloadMedline();
      return { status: 'updated', date: d.date };
    } catch (e) {
      return { status: 'unavailable' };
    }
  }

  /* force = check even if one just ran (the "Check now" button). Returns a short status for the screen. */
  function check(force, onProgress) {
    if (running) return running;
    running = (async () => {
      try {
        const last = Number(get(K_CHECKED) || 0);
        if (!force && Date.now() - last < MIN_GAP) return { status: 'recent' };
        const n = await newestVersion();
        if (n.status) return n;
        if (!n.needed) return { status: 'current', date: n.have.date };
        return await download(n.v, onProgress);
      } finally { running = null; }
    })();
    return running;
  }

  // ---------- launch: if MedlinePlus has new information, update before the app is used ----------
  function fmtDate(d) {
    if (!d) return '';
    const p = String(d).split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
  }
  function overlay() {
    const o = document.createElement('div');
    o.className = 'upd-screen';
    o.setAttribute('role', 'alertdialog');
    o.setAttribute('aria-modal', 'true');
    o.setAttribute('aria-labelledby', 'upd-title');
    o.innerHTML = '<div class="upd-card"><div class="upd-ico" aria-hidden="true">📚</div><h2 id="upd-title">Updating your health library</h2>' +
      '<p class="upd-text">MedlinePlus (U.S. National Library of Medicine) has new health information. The app is downloading it so the help chat is up to date. Please wait — this only takes a moment.</p>' +
      '<div class="bar upd-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span style="width:4%"></span></div>' +
      '<p class="small muted upd-note">Downloading…</p><button class="block upd-go" hidden>Continue</button></div>';
    document.body.appendChild(o);
    document.documentElement.classList.add('updating');
    return o;
  }
  async function launchCheck() {
    const n = await newestVersion();
    if (n.status || !n.needed) return; // offline, unreachable or already current: open the app normally
    const o = overlay();
    const bar = o.querySelector('.upd-bar'), fill = bar.querySelector('span'), note = o.querySelector('.upd-note'), go = o.querySelector('.upd-go');
    const r = await download(n.v, (p) => { const pct = Math.max(4, Math.round(p * 100)); fill.style.width = pct + '%'; bar.setAttribute('aria-valuenow', String(pct)); note.textContent = 'Downloading… ' + pct + '%'; });
    fill.style.width = '100%';
    if (r.status === 'updated') {
      o.querySelector('#upd-title').textContent = 'Health library updated ✓';
      o.querySelector('.upd-text').textContent = 'Your help chat now has MedlinePlus information from ' + fmtDate(r.date) + '. It works offline too.';
      note.textContent = '';
    } else {
      o.querySelector('#upd-title').textContent = 'Update did not finish';
      o.querySelector('.upd-text').textContent = 'The connection dropped or the download was incomplete, so your current health library is kept. The app will try again the next time you open it with internet.';
      note.textContent = '';
    }
    go.hidden = false;
    go.focus();
    go.addEventListener('click', () => { o.remove(); document.documentElement.classList.remove('updating'); });
  }

  function start() {
    launchCheck();                                                          // every launch, right away
    window.addEventListener('online', () => setTimeout(() => check(false), 3000)); // reconnected later: update quietly
  }
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  }

  return { validate, current, loadDownloaded, check, newestVersion, download };
});
