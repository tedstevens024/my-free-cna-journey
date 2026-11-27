/* Daily verified updates for the Android app (APK). The website updates itself through its service worker.
 *
 * User rule (2026-11-25): on the first launch of each day, if there is internet, the app checks the live site for a newer
 * version. If there is one, the screen pauses with a "Downloading update" bar, then asks to restart so the new lessons,
 * questions, exam, skills, sources and health library take effect.
 *
 * Safety (independent review 2026-11-25, research/verification/update-system-review.md):
 *  - Only the published site is used, and it only publishes versions that passed the team's verification.
 *  - Every downloaded file must match its SHA-256 fingerprint; every copied (unchanged) file is checked natively too.
 *  - At most one attempt per day. A failure changes nothing, shows one short calm message, and waits until tomorrow.
 *  - An update that was downloaded but not restarted is not downloaded again: the app just asks to restart.
 *  - "Started fine" is reported only after a full screen has loaded with the course data, so a broken version rolls
 *    back to the previous good one by itself (apk/native/UpdaterPlugin.java).
 */
(function () {
  const LIVE = 'https://tedstevens024.github.io/my-free-cna-journey/';
  const KEY_DAY = 'cna-update-checked-day';
  const CHUNK = 1536 * 1024; // bytes per write to the phone's storage

  const native = () => window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() &&
    window.Capacitor.Plugins && window.Capacitor.Plugins.Updater;
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function vnum(v) { const m = String(v || '').match(/(\d+)\.(\d+)\.(\d+)/); return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0]; }
  function newer(a, b) { const x = vnum(a), y = vnum(b); for (let i = 0; i < 3; i++) { if (x[i] !== y[i]) return x[i] > y[i]; } return false; }
  /* Install when the live build differs and its version is not LOWER (two changes can share a version number). */
  function shouldInstall(live, local) { return !!(live && live.build && live.files && live.build !== local.build && !newer(local.version, live.version)); }

  async function fetchTimeout(url, ms, asText) {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const r = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return asText ? await r.text() : await r.arrayBuffer();
    } finally { clearTimeout(t); }
  }
  async function sha256(buf) {
    const h = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  function b64(bytes) {
    let s = ''; const step = 0x8000;
    for (let i = 0; i < bytes.length; i += step) s += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
    return btoa(s);
  }

  // ---------- full-screen overlay ("pause the screen") ----------
  let ov = null;
  function overlay(html) {
    if (!ov || !document.body.contains(ov)) { // (re)create if missing or removed
      ov = document.createElement('div');
      ov.className = 'upd-overlay';
      ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
      ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(10,40,38,.78);display:flex;align-items:center;justify-content:center;padding:20px';
      document.body.appendChild(ov);
    }
    ov.innerHTML = '<div class="card" style="max-width:420px;width:100%;margin:0">' + html + '</div>';
  }
  function progress(done, total) {
    const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
    overlay('<h2 style="margin-top:0">⬇️ Downloading update</h2>' +
      '<p>New, checked information for your lessons, tests and health library is being downloaded. Please keep the app open.</p>' +
      '<div style="background:#dfeeed;border-radius:99px;height:14px;overflow:hidden" aria-hidden="true"><div style="height:100%;width:' + pct + '%;background:#2f8f88;transition:width .2s"></div></div>' +
      '<p class="small muted" style="margin:.5em 0 0" aria-live="polite">' + pct + '%</p>');
  }
  function close() { if (ov) { ov.remove(); ov = null; } }
  function askRestart(U, version) {
    overlay('<h2 style="margin-top:0">✅ Update ready</h2><p>The newest checked information (version ' + esc(String(version).replace(/^cna-v/, '')) +
      ') has been downloaded. Restart the app to use it.</p><div class="btnrow"><button id="upd-restart">Restart now</button></div>');
    const b = document.getElementById('upd-restart');
    b.addEventListener('click', () => { b.disabled = true; close(); U.restart(); });
  }
  function calmFail(msg) {
    overlay('<h2 style="margin-top:0">Update not finished</h2><p>' + esc(msg) + ' Nothing was changed — you can keep using the app as it is. ' +
      'It will try again tomorrow.</p><div class="btnrow"><button id="upd-ok">OK</button></div>');
    document.getElementById('upd-ok').addEventListener('click', close);
  }

  async function getFile(path, build, size, sum) {
    const url = LIVE + path.split('/').map(encodeURIComponent).join('/');
    const ms = 60000 + Math.ceil(size / 25); // at least ~25 KB/s for big files on a weak signal
    let buf = await fetchTimeout(url + '?b=' + build, ms, false);
    if ((await sha256(buf)) === sum) return buf;
    // Right after a release the site's cache may still hold the old copy: ask once more with a fresh address.
    buf = await fetchTimeout(url + '?b=' + build + '&r=' + Date.now(), ms, false);
    if ((await sha256(buf)) === sum) return buf;
    throw new Error('mismatch');
  }

  let running = false;
  async function check(opts) {
    const U = native();
    if (!U || running) return { status: 'skip' };
    if (!(opts && opts.force) && get(KEY_DAY) === today()) return { status: 'checked-today' };
    if (navigator.onLine === false) return { status: 'offline' };
    if (!(opts && opts.force) && /^#\/quiz/.test(location.hash)) return { status: 'busy' }; // never interrupt a quiz or exam
    const last = +(get('cna-update-last-try') || 0);
    if (!(opts && opts.force) && Date.now() - last < 3600000) return { status: 'waiting' }; // site unreachable: at most one try per hour
    running = true;
    let build = null;
    try {
      let live, local;
      try { live = JSON.parse(await fetchTimeout(LIVE + 'update-manifest.json?t=' + Date.now(), 10000, true)); } catch (e) { set('cna-update-last-try', String(Date.now())); return { status: 'unreachable' }; }
      set(KEY_DAY, today()); // one attempt per day, whatever happens next
      try { local = JSON.parse(await fetchTimeout('update-manifest.json?t=' + Date.now(), 5000, true)); } catch (e) { local = { version: '', build: '', files: {} }; }
      if (!shouldInstall(live, local)) return { status: 'current', version: local.version };
      let info = {}; try { info = await U.info(); } catch (e) { /* ignore */ }
      if (info.rolledBack && info.rolledBack === live.build) return { status: 'skipped-broken', version: live.version };
      // Already downloaded on an earlier day but not restarted yet: just ask to restart.
      if (info.base && info.base.split('/').pop() === live.build && info.base !== info.running) { askRestart(U, live.version); return { status: 'ready', version: live.version }; }

      build = live.build;
      const paths = Object.keys(live.files);
      const total = paths.reduce((t, p) => t + (local.files[p] && local.files[p].sha256 === live.files[p].sha256 ? 0 : live.files[p].size), 0) || 1;
      const need = paths.reduce((t, p) => t + live.files[p].size, 0) * 1.3;
      if (info.freeBytes && info.freeBytes < need) { calmFail('There is not enough free storage space on the phone for the update.'); return { status: 'no-space' }; }
      let done = 0;
      progress(0, total);
      await U.begin({ build });
      for (const p of paths) {
        const f = live.files[p];
        try { await U.copyCurrent({ build, path: p, sha256: f.sha256 }); continue; } catch (e) { /* changed or missing: download it */ }
        const bytes = new Uint8Array(await getFile(p, build, f.size, f.sha256));
        if (!bytes.length) await U.write({ build, path: p, data: '', append: false });
        for (let i = 0; i < bytes.length; i += CHUNK) await U.write({ build, path: p, data: b64(bytes.subarray(i, i + CHUNK)), append: i > 0 });
        done += f.size;
        progress(done, total);
      }
      // The new version's own fingerprint list, so tomorrow's check knows what is installed.
      await U.write({ build, path: 'update-manifest.json', data: b64(new TextEncoder().encode(JSON.stringify(live))), append: false });
      await U.activate({ build });
      askRestart(U, live.version);
      return { status: 'ready', version: live.version };
    } catch (e) {
      if (build) { try { await U.discard({ build }); } catch (x) { /* ignore */ } }
      calmFail('The update could not be downloaded completely (the internet connection may have been too weak).');
      return { status: 'failed', error: String(e && e.message || e) };
    } finally { running = false; }
  }

  /* Report "this version started fine" only once a real screen with the course data is showing. */
  async function confirmWhenHealthy(U) {
    for (let i = 0; i < 40; i++) {
      const okData = window.CNA && CNA.curriculum && (CNA.curriculum.lessons || []).length >= 30 && CNA.questions && (CNA.questions.questions || []).length >= 200;
      const root = document.getElementById('app');
      const okScreen = root && root.innerText.trim().length > 60 && !/^\s*Loading/.test(root.innerText);
      if (okData && okScreen && window.CNA.app) { try { await U.confirm(); } catch (e) { /* ignore */ } return true; }
      await new Promise((r) => setTimeout(r, 500));
    }
    return false; // never confirmed: the native crash guard rolls this version back after 2 tries
  }

  async function start() {
    const U = native();
    if (!U) return;
    await confirmWhenHealthy(U);
    check();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); }); // a new day while the app stayed open
  }
  window.CNA = window.CNA || {};
  window.CNA.updater = { check, newer, shouldInstall, LIVE };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 1500)); else setTimeout(start, 1500);
})();
