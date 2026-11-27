/* App shell: state, router, shared UI helpers. Views live in js/views/*.js and register in CNA.views. */
(function () {
  'use strict';
  const CNA = window.CNA;
  const T = CNA.time, P = CNA.planner, S = CNA.store;
  const lessons = CNA.curriculum.lessons;

  const app = (CNA.app = {
    state: S.load(),
    params: [],
    quiz: null, // active quiz (kept in memory)
  });

  // ---------- helpers ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  app.esc = esc;
  app.$ = (sel, el) => (el || document).querySelector(sel);
  app.$$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

  app.save = function () {
    if (!S.save(app.state)) app.toast('Could not save — your phone storage may be full.');
  };
  /** Re-plan study sessions (call after any change to shifts, events or settings). */
  app.replan = function (quiet) {
    const r = P.replan(app.state, { now: new Date(), days: 14, lessons });
    app.save();
    if (!quiet && r) app.toast('Study plan updated — ' + r.created + ' sessions over the next 2 weeks.');
    return r;
  };

  /** A short, gentle confetti burst for milestones (lesson complete, passing score). Skipped when the
   * phone asks for reduced motion. */
  app.celebrate = function () {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = document.createElement('div');
    box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
    const colors = ['#3a9e98', '#7fd1c7', '#f2b84b', '#f28b82', '#8a6bb0', '#5b7bb3'];
    for (let i = 0; i < 36; i++) {
      const p = document.createElement('i');
      p.style.left = (Math.random() * 100) + '%';
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (Math.random() * 0.25) + 's';
      p.style.animationDuration = (1.1 + Math.random() * 0.9) + 's';
      p.style.setProperty('--x', ((Math.random() - 0.5) * 160) + 'px');
      p.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 2400);
  };

  app.toast = function (msg) {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  };

  app.go = (hash) => { location.hash = hash; };

  const CHEERS = [
    'Every minute you study is a step toward your certificate.',
    'Small sessions add up. You\'ve got this!',
    'Your future residents are lucky to have someone who cares this much.',
    'Progress, not perfection.',
    'Rest is part of the plan too — especially after a long shift.',
    'You are building real skills that help real people.',
    'One lesson at a time. Look how far you\'ve come.',
  ];
  app.cheer = () => CHEERS[Math.floor(Date.now() / 86400000) % CHEERS.length];

  app.greeting = function () {
    const h = new Date().getHours();
    const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    const name = app.firstName();
    return part + (name ? ', ' + name : '') + '!';
  };

  // ---------- Profile (stays on this phone; no account, no password) ----------
  app.firstName = () => (app.state.profile && app.state.profile.firstName) || '';
  app.hasProfile = () => !!(app.state.profile && app.state.profile.firstName && app.state.profile.lastName);

  /** Round profile picture, or her initials when there is no photo. */
  app.avatar = function (size, profile) {
    const p = profile || app.state.profile || {};
    const px = (size || 48) + 'px';
    const style = 'width:' + px + ';height:' + px + ';font-size:' + Math.round((size || 48) * 0.4) + 'px';
    if (p.photo) return '<img class="avatar" src="' + esc(p.photo) + '" alt="Profile picture" style="' + style + '">';
    const ini = ((p.firstName || '')[0] || '') + ((p.lastName || '')[0] || '');
    return '<span class="avatar" role="img" aria-label="Profile picture" style="' + style + '">' + esc(ini.toUpperCase() || '🙂') + '</span>';
  };

  /** Shrink a chosen photo to a 256×256 square JPEG (about 20–40 KB) so it fits in on-phone storage. */
  app.readPhoto = function (file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) return reject(new Error('Please choose a picture file.'));
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const S = 256, side = Math.min(img.naturalWidth, img.naturalHeight);
        const c = document.createElement('canvas'); c.width = S; c.height = S;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S, S);
        ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, S, S);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That picture could not be opened. Try another one.')); };
      img.src = url;
    });
  };

  /** Profile fields (first name, last name, optional photo). Used by Welcome and the My Profile screen. */
  app.profileFields = function (p) {
    return '<div class="row" style="gap:14px;align-items:center;margin-bottom:6px"><span id="pf-av">' + app.avatar(72, p) + '</span>' +
      '<div class="grow"><label class="btn secondary" for="pf-photo">📷 ' + (p.photo ? 'Change picture' : 'Add a picture (optional)') + '</label>' +
      '<input type="file" id="pf-photo" accept="image/*" class="visually-hidden">' +
      '<button type="button" class="ghost small" id="pf-rm"' + (p.photo ? '' : ' hidden') + '>Remove picture</button></div></div>' +
      '<label for="pf-first">First name</label><input id="pf-first" autocomplete="given-name" maxlength="40" required value="' + esc(p.firstName || '') + '">' +
      '<label for="pf-last">Last name</label><input id="pf-last" autocomplete="family-name" maxlength="40" required value="' + esc(p.lastName || '') + '">' +
      '<p class="small muted">Your name and picture stay on this phone only. Nothing is uploaded.</p>' +
      '<p class="small" id="pf-err" role="alert" style="color:var(--danger,#b3261e)"></p>';
  };
  /** Wires up the profile fields. Returns read(): the new profile, or null (with a message shown) if a name is missing. */
  app.bindProfileFields = function (root, start) {
    const draft = Object.assign({ firstName: '', lastName: '', photo: '' }, start || {});
    const err = app.$('#pf-err', root);
    const refresh = () => {
      draft.firstName = app.$('#pf-first', root).value.trim();
      draft.lastName = app.$('#pf-last', root).value.trim();
      app.$('#pf-av', root).innerHTML = app.avatar(72, draft);
      app.$('#pf-rm', root).hidden = !draft.photo;
      app.$('label[for="pf-photo"]', root).textContent = '📷 ' + (draft.photo ? 'Change picture' : 'Add a picture (optional)');
    };
    app.$('#pf-photo', root).addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      app.readPhoto(f).then((d) => { draft.photo = d; err.textContent = ''; refresh(); }).catch((x) => { err.textContent = x.message; });
      e.target.value = '';
    });
    app.$('#pf-rm', root).addEventListener('click', () => { draft.photo = ''; refresh(); });
    ['#pf-first', '#pf-last'].forEach((id) => app.$(id, root).addEventListener('input', refresh));
    return function read() {
      refresh();
      if (!draft.firstName || !draft.lastName) {
        err.textContent = 'Please type your first and last name.';
        app.$(draft.firstName ? '#pf-last' : '#pf-first', root).focus();
        return null;
      }
      err.textContent = '';
      return { firstName: draft.firstName.slice(0, 40), lastName: draft.lastName.slice(0, 40), photo: draft.photo };
    };
  };

  app.lessonById = (id) => lessons.find((l) => l.id === id);
  app.unitById = (id) => CNA.curriculum.units.find((u) => u.id === id);

  app.completion = function () {
    const done = lessons.filter((l) => (app.state.progress.lessons[l.id] || {}).completed).length;
    return { done, total: lessons.length, pct: Math.round((done / lessons.length) * 100) };
  };

  app.eventLabel = { shift: 'Work shift', appointment: 'Appointment', blocked: 'Busy', available: 'Free for study' };

  /** Items (events + sessions) touching a given date, sorted by start. */
  app.itemsForDay = function (date) {
    const dayStart = T.ms(date), dayEnd = T.ms(T.addDays(date, 1));
    const ev = app.state.events
      .filter((e) => T.ms(e.start) < dayEnd && T.ms(e.end) > dayStart)
      .map((e) => ({ kind: 'event', start: e.start, end: e.end, data: e }));
    const ss = app.state.sessions.filter((s) => s.date === date).map((s) => ({ kind: 'session', start: s.start, end: s.end, data: s }));
    return ev.concat(ss).sort((a, b) => (a.start < b.start ? -1 : 1));
  };

  app.timeRange = function (start, end, date) {
    const s = start.split('T')[0] !== date ? '(prev day) ' + T.fmtTime(start) : T.fmtTime(start);
    const e = end.split('T')[0] !== date ? T.fmtTime(end) + ' (next day)' : T.fmtTime(end);
    return s + ' – ' + e;
  };

  /** Render a day timeline (used by Home and Calendar). */
  app.renderTimeline = function (date, opts) {
    opts = opts || {};
    const items = app.itemsForDay(date);
    if (!items.length) return '<div class="empty small">Nothing scheduled.</div>';
    return '<div class="timeline">' + items.map((it) => {
      if (it.kind === 'event') {
        const e = it.data;
        return '<a class="ev ' + e.type + '" href="#/event/' + e.id + '" style="color:inherit;text-decoration:none">' +
          '<div class="t">' + esc(app.timeRange(e.start, e.end, date)) + '</div>' +
          '<div class="grow"><b>' + esc(e.title || app.eventLabel[e.type]) + '</b> <span class="pill ' + e.type + '">' + app.eventLabel[e.type] + '</span></div></a>';
      }
      const s = it.data;
      const status = s.status === 'planned' ? '' : '<span class="pill ' + s.status + '">' + s.status + '</span>';
      return '<div class="ev session ' + s.status + '">' +
        '<div class="t">' + esc(T.fmtTime(s.start)) + '<br><span class="small">' + s.minutes + ' min</span></div>' +
        '<div class="grow"><b>📚 ' + esc(s.title) + '</b> ' + status + '</div>' +
        (s.status === 'planned' && opts.actions !== false ? '<button class="ghost" data-start="' + s.id + '" aria-label="Start session">Start ›</button>' : '') +
        '</div>';
    }).join('') + '</div>';
  };

  /** Wire "Start" buttons rendered by renderTimeline. */
  app.bindTimeline = function (root) {
    app.$$('[data-start]', root).forEach((b) => b.addEventListener('click', () => app.startSession(b.dataset.start)));
  };

  app.startSession = function (id) {
    const s = app.state.sessions.find((x) => x.id === id);
    if (!s) return;
    app.activeSession = id;
    if (s.lessonId) app.go('#/lesson/' + s.lessonId);
    else app.go('#/tests');
  };

  /** Mark a session done/skipped. */
  app.finishSession = function (id, status) {
    const s = app.state.sessions.find((x) => x.id === id);
    if (!s) return;
    s.status = status;
    s.finishedAt = T.toLocal(new Date());
    // Done ahead of schedule (e.g. tomorrow's session studied today): log it when it really happened,
    // so it counts toward this week's goal and the planner can reuse tomorrow's slot.
    if (status === 'done' && T.ms(s.start) > Date.now()) {
      const end = new Date(), start = new Date(end.getTime() - (s.minutes || 0) * T.MIN);
      s.start = T.toLocal(start); s.end = T.toLocal(end); s.date = T.dateKey(start);
    }
    if (app.activeSession === id) app.activeSession = null;
    app.replan(true);
  };

  /** The planned session happening now or next. */
  app.nextSession = function () {
    const now = Date.now();
    return app.state.sessions.find((s) => s.status === 'planned' && T.ms(s.end) > now) || null;
  };

  // ---------- router ----------
  const TABS = [
    ['home', '🏠', 'Home'], ['calendar', '🗓️', 'Calendar'], ['learn', '📖', 'Learn'], ['tests', '✅', 'Tests'], ['more', '☰', 'More'],
  ];
  const TAB_OF = { home: 'home', calendar: 'calendar', event: 'calendar', learn: 'learn', unit: 'learn', lesson: 'learn', tests: 'tests', quiz: 'tests', results: 'tests', more: 'more', skills: 'more', skill: 'more', state: 'more', notes: 'more', backup: 'more', settings: 'more', about: 'more', abbreviations: 'more', glossary: 'more', profile: 'more', help: 'more', aihelp: 'more' };

  function renderNav(route) {
    const nav = document.getElementById('tabs');
    const on = TAB_OF[route] || 'home';
    nav.innerHTML = '<div class="inner">' + TABS.map((t) =>
      '<a href="#/' + t[0] + '" class="' + (t[0] === on ? 'on' : '') + '"' + (t[0] === on ? ' aria-current="page"' : '') + '><span class="i" aria-hidden="true">' + t[1] + '</span>' + t[2] + '</a>').join('') + '</div>';
  }

  app.header = function (title, back) {
    return '<header class="top">' + (back ? '<button class="ghost back" data-back="' + esc(back) + '" aria-label="Back">‹</button>' : '') +
      '<h1>' + esc(title) + '</h1></header>';
  };
  // Back buttons (no inline handlers: the Content-Security-Policy blocks them).
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-back]');
    if (!b) return;
    app._navDir = 'back';
    if (history.length > 1) history.back(); else location.hash = b.dataset.back;
  });

  /** "Check the official source" buttons. Every lesson, unit and skill shows these. */
  app.sourceBox = function (list, heading, note) {
    if (!list || !list.length) return '<div class="card warn small">No official source linked yet — do not rely on this page until one is added.</div>';
    return '<div class="card sources"><div class="row"><span aria-hidden="true">🔎</span><b class="grow">' + esc(heading || 'Check the official source') + '</b></div>' +
      list.map((s) => '<a class="srcbtn" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="grow"><span class="t">' + esc(s.title) + '</span><span class="by">' + esc(s.by) + ' · ' + esc(new URL(s.url).hostname.replace(/^www\./, '')) + '</span></span><span aria-hidden="true">↗</span></a>').join('') +
      '<div class="small muted" style="margin-top:6px">Official government sources · links checked ' + esc(CNA.sources.VERIFIED) + (note ? '. ' + esc(note) : '') + '</div></div>';
  };

  function route() {
    const hash = location.hash.replace(/^#\/?/, '') || 'home';
    const parts = hash.split('/');
    let name = parts[0];
    app.params = parts.slice(1).map(decodeURIComponent);
    // No profile yet: brand-new users get Welcome; people who used the app before the profile
    // feature get just the profile screen. Once a profile exists the app always opens straight in.
    if (!app.state.settings.onboarded) name = name === 'backup' ? 'backup' : 'welcome'; // a new phone can restore a backup before setup
    else if (!app.hasProfile()) name = 'profile';
    const view = CNA.views[name] || CNA.views.home;
    const root = document.getElementById('app');
    document.getElementById('tabs').style.display = (name === 'welcome' || !app.state.settings.onboarded || !app.hasProfile()) ? 'none' : '';
    renderNav(name);
    // Screen transition: slide forward into a screen, slide back with the Back button, fade between tabs.
    // A re-render of the same screen (after saving something) does not animate.
    const fullHash = location.hash || '#/home';
    const TAB_ROOTS = ['home', 'calendar', 'learn', 'tests', 'more'];
    let dir = app._navDir || (TAB_ROOTS.includes(name) && !app.params.length ? 'tab' : 'fwd');
    if (fullHash === app._lastHash && !app._navDir) dir = 'none';
    app._navDir = null; app._lastHash = fullHash;
    root.classList.remove('v-fwd', 'v-back', 'v-tab');
    root.innerHTML = '';
    view(root, app.params);
    if (dir !== 'none') { void root.offsetWidth; root.classList.add('v-' + dir); }
    if (dir !== 'none') window.scrollTo(0, 0);
    const h1 = root.querySelector('h1');
    if (h1) document.title = h1.textContent.trim() === 'My Free CNA Journey' ? 'My Free CNA Journey' : h1.textContent + ' · My Free CNA Journey';
  }
  app.route = route;

  function applyTextSize() {
    document.documentElement.dataset.text = app.state.settings.textSize || 'large';
  }
  app.applyTextSize = applyTextSize;

  window.addEventListener('hashchange', route);
  // Keyboard open (the app gets much shorter): hide the tab bar and chat bubble so what she is typing into gets the room.
  let fullH = window.innerHeight;
  function kbCheck() {
    const h = window.innerHeight;
    if (h > fullH) fullH = h;
    document.documentElement.classList.toggle('kb', h < fullH * 0.75);
  }
  window.addEventListener('resize', kbCheck);
  window.addEventListener('orientationchange', () => { fullH = 0; setTimeout(kbCheck, 300); });
  document.addEventListener('DOMContentLoaded', () => {
    applyTextSize();
    // Ask the phone to keep this app's data (profile, progress) instead of clearing it when storage is low.
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) { /* not supported */ }
    if (app.state.settings.onboarded) app.replan(true);
    route();
    // Re-plan when the app comes back to the foreground (e.g. next day) so missed sessions move.
    // Only redraw screens that show the plan (Home, Calendar) or when the day changed, never one with unsaved typing
    // or a quiz in progress, and keep the scroll position — so switching to another app and back loses nothing.
    let planDay = new Date().toDateString();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible' || !app.state.settings.onboarded) return;
      const today = new Date().toDateString(), newDay = today !== planDay;
      planDay = today;
      app.replan(true);
      const name = (location.hash || '#/home').replace(/^#\/?/, '').split('/')[0] || 'home';
      if (name === 'quiz' || (!newDay && name !== 'home' && name !== 'calendar')) return;
      const root = document.getElementById('app');
      const typed = Array.prototype.some.call(root.querySelectorAll('input, textarea, select'), (el) =>
        el.type === 'checkbox' || el.type === 'radio' ? el.checked !== el.defaultChecked
          : el.tagName === 'SELECT' ? Array.prototype.some.call(el.options, (o) => o.selected !== o.defaultSelected)
          : el.value !== el.defaultValue);
      if (typed) return;
      const y = window.scrollY;
      route();
      window.scrollTo(0, y);
    });
    // Inside the Android app (APK) every file is already on the phone, so no offline cache is needed — and an old cache
    // could keep showing old screens after a bug-fix update. Remove any cache there; the website keeps using it.
    const NATIVE = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
    if (NATIVE && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
      if (window.caches) caches.keys().then((ks) => ks.filter((k) => /^cna-v/.test(k)).forEach((k) => caches.delete(k))).catch(() => {}); // only the offline-page cache
    } else if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').catch((e) => console.warn('Offline mode unavailable', e));
    }
  });
})();
