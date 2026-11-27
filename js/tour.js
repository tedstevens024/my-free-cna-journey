/* Guided app tour: walks through the real screens, spotlights each part and explains it.
 * Start with CNA.tour.start('full') or a topic ('calendar', 'planner', 'lessons', 'tests', 'skills', 'backup').
 * Replayable any time from More → App tour & help (#/help). */
(function () {
  'use strict';
  const CNA = window.CNA;
  const V = (CNA.views = CNA.views || {});

  const card = (sel) => () => { const el = document.querySelector(sel); return el && (el.closest('.card') || el); };

  // Each step: route to open, element to spotlight (selector or function; optional), icon, title,
  // text (what this section is) and how (what you can do here and how to use it).
  const STEPS = {
    welcome: { icon: '👋', title: 'Welcome to your app!',
      text: 'This tour walks you through every part of the app: what each screen is for, what you can do there, and how to use it.',
      how: ['Tap Next to go forward and Back to go back', 'The dots at the bottom show how far along you are', 'Tap Close tour any time — you can watch it again from More → App tour & help', 'You can also replay just one part (for example, only shifts) from that same screen'] },
    home: { route: '#/home', sel: '.card.hero', icon: '🏠', title: 'Home: your daily starting point',
      text: 'Home is the first screen you see. The green card greets you by name and shows how much you have studied this week compared with your weekly study goal.',
      how: ['The bar fills up as you finish study sessions this week', 'Tap your picture or initials to open My profile and change your name or photo', 'Your weekly goal can be changed in More → Settings'] },
    homeStats: { route: '#/home', sel: '#app .grid2', icon: '📊', title: 'Today at a glance',
      text: 'Two quick numbers so you always know where you stand.',
      how: ['Left: how much free study time you still have today (after your shifts and rest time)', 'Right: how much of the course you have finished, and how many lessons are done out of the total'] },
    nextSession: { route: '#/home', sel: card('#doneNext'), icon: '⏰', title: 'Your next study session',
      text: 'The app plans short study sessions for you in your free time, never during a shift. This card shows the next one and which lesson it is for.',
      how: ['Start now — opens that lesson so you can study it', 'Mark done — tap when you finish; it counts toward this week\'s goal', 'Skip — if you can\'t do it now; the plan rebuilds itself', 'Missed one? It automatically moves to your next free time — nothing to fix by hand'] },
    tabs: { route: '#/home', sel: '#tabs', icon: '🧭', title: 'Moving around the app',
      text: 'These 5 buttons stay at the bottom of every main screen. The highlighted one shows where you are.',
      how: ['Home — today, your next session and progress', 'Calendar — your shifts, appointments and study plan', 'Learn — all the lessons', 'Tests — quizzes and the Oklahoma practice exam', 'More — skills, abbreviations, notes, backup, settings and help', 'The round ‹ button at the top of a screen takes you back'] },
    calAdd: { route: '#/calendar', sel: '#cal-add', icon: '🗓️', title: 'Calendar: add your schedule',
      text: 'The Calendar is where you tell the app when you work and when you are busy. The study plan is built around it, so start here.',
      how: ['＋ Work shift — add a day, evening or night shift', '＋ Appointment — doctor visits, school pickup and so on', '＋ Free time — extra time you could study (outside your usual hours)', '＋ Busy time — any time you do NOT want study planned', 'Everything you add moves the study sessions out of the way automatically'] },
    evEditor: { route: '#/event/new/shift', sel: '#app .card', icon: '✏️', title: 'Adding a shift, step by step',
      text: 'This form opens when you tap ＋ Work shift (or any other ＋ button). Fill it in and tap Save.',
      how: ['Type — shift, appointment, busy time or free time', 'Name — optional, for example "Night shift"', 'Date, Starts and Ends — a night shift like 7:00 PM to 7:00 AM is understood to end the next morning', 'Repeat → Weekly — pick the days (for example Mon, Wed, Fri) and how many weeks', 'Repeat → Rotation — for schedules like 4 days on, 3 days off', 'A warning appears if it overlaps something you already added'] },
    calDay: { route: '#/calendar', sel: '.daycard', icon: '📅', title: 'Your days',
      text: 'Each card is one day. It lists your shifts and the study sessions the app planned in your free time, in time order.',
      how: ['Tap a shift or appointment to change its time or delete it', 'Repeating shifts can be deleted one at a time or "this and all later repeats"', 'Tap Start on a study session to begin it', '＋ Add puts something on that exact day', '"No study this day" keeps a day completely free of study', '‹ Prev and Next › move between weeks'] },
    calRules: { route: '#/calendar', sel: '#app .grid2', icon: '😴', title: 'How the plan protects your rest',
      text: 'These numbers show your free time this week and how much study is planned. The planner follows some rules so studying fits your life.',
      how: ['No studying during a shift', 'No studying in the rest time before and after a shift (getting ready, commuting, sleeping after nights)', 'Only during the hours you said you could study', 'Change rest time and study hours in More → Settings'] },
    learn: { route: '#/learn', sel: '#app .card .list', icon: '📖', title: 'Learn: all your lessons',
      text: 'Every lesson is written for the Oklahoma nurse aide exam and grouped into units, like chapters in a book. The units follow the same topic order as Oklahoma\'s official nurse aide Course Standards, so they line up with your CNA class. ⭐ marks what you learn in your first 16 hours.',
      how: ['Tap a unit to see its lessons, then tap a lesson to open it', 'A ✓ shows lessons you have finished', 'Your quick-check score is shown next to each lesson', 'Going in order works best, but you can open any lesson any time'] },
    lessonSources: { route: '#/lesson/role-1', sel: '.card.sources', icon: '🔎', title: 'Where each lesson comes from',
      text: 'Every lesson starts with buttons to the official government documents it is based on — mostly Oklahoma\'s own nurse aide documents.',
      how: ['Tap any source button to open that official page or PDF', 'Use them whenever you want to double-check something', 'Below the sources is the lesson itself: short sections with bullet points'] },
    lessonKeys: { route: '#/lesson/role-1', sel: '.keypoints', icon: '✅', title: 'Key points',
      text: 'The most important facts from the lesson, the ones most likely to be on the test.',
      how: ['"✓ 3 official sources agree" means three official documents say the same thing', 'Tap the badge to see exactly which sources and open them', '"Study tip" badges are test-taking advice, not medical facts', 'Read these again right before your exam'] },
    lessonCheck: { route: '#/lesson/role-1', sel: '#check', icon: '📝', title: 'Check yourself and finish',
      text: 'A few questions at the end of every lesson show whether it stuck.',
      how: ['Tap an answer — green means right, red means wrong, and the explanation appears', 'Questions you miss are saved to "Review missed questions" in Tests', 'Write your own notes in the box below — they are saved in More → My Notes', 'Tap "Mark lesson complete" when you are done (you can undo it)'] },
    tests: { route: '#/tests', sel: '#app .card .list', icon: '🎯', title: 'Tests: practice until it sticks',
      text: 'The Testing Center has different kinds of practice. Questions come with explanations and official sources.',
      how: ['Quick quiz — 10 random questions with instant answers', 'Review missed questions — your wrong answers come back until you get each one right twice', 'True or false and Scenario questions — practice one question type', 'Practice by topic — further down, pick one unit to practice', 'Your average score is shown at the top'] },
    exam: { route: '#/tests', sel: () => [...document.querySelectorAll('#app .item')].find((x) => /practice exam/i.test(x.textContent)), icon: '🎓', title: 'The Oklahoma practice exam',
      text: 'A full practice version of the real Oklahoma written test: 70 questions, 2 hours, and you need 70% to pass. Questions are spread across the test areas the same way the real test is.',
      how: ['No answers are shown until you finish — just like the real test', 'Use ‹ Previous to go back and change answers', 'A timer counts down and submits automatically at 0', 'If you close the app in the middle, open Tests and tap Resume', 'Results show your score for each test area and which lessons to study next'] },
    more: { route: '#/more', sel: '#app .card .list', icon: '☰', title: 'More: everything else',
      text: 'The More tab holds your tools and settings.',
      how: ['Your profile card at the top — tap it to change your name or picture', 'Skills Library — hands-on skills for the skills test', 'Oklahoma Requirements — official rules for getting certified', 'Abbreviations, the Oklahoma Glossary, My Notes, Backup & Restore, Settings, and this App tour & help'] },
    skills: { route: '#/skills', sel: '#app .card .list', icon: '🧤', title: 'Skills Library',
      text: 'Step-by-step guides for the hands-on skills test, grouped by topic. Each skill shows the matching Oklahoma procedure.',
      how: ['Tap a skill to open its steps, tips and common mistakes', 'Check off each step as you practice it', '"I practiced this today" keeps track of your practice', '"Practice questions" opens a quiz on that topic'] },
    state: { route: '#/more', sel: 'a[href="#/state"]', icon: '🗺️', title: 'Oklahoma Requirements',
      text: 'The official Oklahoma rules for becoming a certified nurse aide, checked against official state sources.',
      how: ['Training, testing and registry rules, each with its official source', 'A link to Oklahoma\'s free official study guide and practice scenarios', 'Where to find approved training programs and test sites'] },
    abbr: { route: '#/more', sel: 'a[href="#/abbreviations"]', icon: '🔤', title: 'Abbreviations',
      text: 'The official abbreviation list from Oklahoma\'s nurse aide study guide — the ones you need to know for the test.',
      how: ['Type in the Search box to find an abbreviation or a word', 'Turn on "Hide meanings" to quiz yourself, then tap a row to check', '"✓ 3 sources" means other official curricula agree'] },
    glossary: { route: '#/more', sel: 'a[href="#/glossary"]', icon: '📚', title: 'Oklahoma Glossary',
      text: 'The official meanings of 239 nurse aide words, word-for-word from Oklahoma\'s Course Standards.',
      how: ['Type in the Search box to find a word, like "aspiration"', 'Turn on "Hide meanings" to quiz yourself, then tap a word to check', 'Tap the page link to open that page of the official Oklahoma document'] },
    notes: { route: '#/more', sel: 'a[href="#/notes"]', icon: '📝', title: 'My Notes',
      text: 'All your notes in one place, including the ones you wrote inside lessons.',
      how: ['Type a note and tap Save note', 'Delete notes you no longer need', 'Never write real patient information in notes'] },
    backup: { route: '#/more', sel: 'a[href="#/backup"]', icon: '💾', title: 'Backup & Restore',
      text: 'Everything you do is stored only on this phone — nothing goes to the internet. A backup file keeps it safe if your phone is lost or replaced.',
      how: ['Download backup file — saves one small file with all your progress', 'Share backup — send it to yourself by email or messages', 'Restore — on a new phone, choose that file to get everything back', 'A reminder shows on More if you haven\'t backed up in a week'] },
    backupScreen: { route: '#/backup', sel: '#exp', icon: '⬇️', title: 'Making a backup',
      text: 'Tap "Download backup file" to save one file with your profile, shifts, progress, scores and notes.',
      how: ['Keep it somewhere safe, like your email or cloud storage', 'Do it every week or two', 'On a new phone, the Welcome screen has a link to restore it'] },
    settings: { route: '#/settings', sel: '#app .card', icon: '⚙️', title: 'Settings',
      text: 'Make the study plan fit your life. Changes take effect right away and the plan is rebuilt.',
      how: ['Weekly study goal and session length (10, 15, 30 or 45 minutes)', 'Most sessions per day and break between them', 'Rest before and after a shift', 'Hours I could study — pick the days and times', 'Text size — Normal, Large or Extra large', 'Tap Save settings at the bottom'] },
    help: { route: '#/more', sel: 'a[href="#/help"]', icon: '❓', title: 'Help any time',
      text: 'Forgot how something works? Come back here.',
      how: ['Start the full tour again', 'Or replay just one part: shifts, study sessions, lessons, tests, skills, help chat or backup', 'Quick answers to common questions', 'Or just tap the 💬 help chat and ask'] },
    chat: { route: '#/home', sel: '.chat-fab', icon: '💬', title: 'Help chat: ask me anything',
      text: 'This round 💬 button is on every main screen. Tap it to open the help chat; tap it again (or ✕) to close it.',
      how: ['Type a question in your own words, or tap one of the suggested questions',
        'Ask how to use the app — like "how do I add a night shift?" — and tap the button in the answer to go there',
        'Ask about your CNA lessons — like "what is a normal pulse?" or "what does NPO mean?" — the answer shows the lesson and its official sources',
        'If your lessons don\'t cover it, it answers from official sources saved on your phone (they work with no internet): Oklahoma\'s Course Standards, federal nursing-home rules, U.S. government health pages (National Institute on Aging, OSHA safe lifting, AHRQ falls, 988 crisis line) and MedlinePlus, and says which one',
        'It works with no internet. It never guesses — if it can\'t find something, it tells you',
        'For a real resident or an emergency, always get the nurse'] },
    aiHelper: { route: '#/settings', sel: 'a[href="#/aihelp"]', icon: '🌐', title: 'Online AI helper (optional)',
      text: 'Turn this on for smarter chat answers in plain words whenever the phone has internet. It is off until you turn it on.',
      how: ['Open it from Settings → Online AI helper',
        'Get a free key at aistudio.google.com/apikey (Google account), paste it, check "Use online AI" and tap Test & save',
        'The key is remembered on this phone — you only enter it once',
        'It answers only from your lessons first, then MedlinePlus, and shows where the answer came from',
        'Privacy: chat questions go to Google while it is on — never type resident names or health details',
        'No signal? The chat simply uses its offline answers'] },
    healthLib: { route: '#/aihelp', sel: () => { const e = document.getElementById('mlp-status'); return e && e.closest('.card'); }, icon: '📚', title: 'Health library updates',
      text: 'The chat\'s MedlinePlus health library keeps itself up to date.',
      how: ['Every time you open the app with internet, it checks for new MedlinePlus information',
        'If there is new information, an "Updating your health library" screen appears and downloads it before you continue',
        'This card shows the date of the library on your phone',
        'Tap "Check for updates now" any time to check by hand'] },
    done: { icon: '🎉', title: 'You\'re all set!',
      text: 'The best first step: add your work shifts on the Calendar. The app will plan your study time around them.',
      how: ['Add your shifts', 'Do your first study session from Home', 'Take a quick quiz in Tests', 'Stuck? Tap the 💬 help chat and ask', 'Back up every week or two'] },
  };

  const TOURS = {
    full: { title: 'Full app tour', icon: '🧭', about: 'Every screen and button, step by step (about 6 minutes)', steps: ['welcome', 'home', 'homeStats', 'nextSession', 'tabs', 'chat', 'calAdd', 'evEditor', 'calDay', 'calRules', 'learn', 'lessonSources', 'lessonKeys', 'lessonCheck', 'tests', 'exam', 'more', 'skills', 'state', 'abbr', 'notes', 'backup', 'settings', 'aiHelper', 'healthLib', 'help', 'done'] },
    calendar: { title: 'Adding work shifts', icon: '🗓️', about: 'Day, night and rotating shifts, editing and deleting', steps: ['calAdd', 'evEditor', 'calDay', 'calRules'] },
    planner: { title: 'How study sessions work', icon: '⏰', about: 'Start, mark done, skip — and missed sessions', steps: ['home', 'nextSession', 'calDay', 'calRules', 'settings'] },
    lessons: { title: 'Taking a lesson', icon: '📖', about: 'Sources, key points, the quick check and notes', steps: ['learn', 'lessonSources', 'lessonKeys', 'lessonCheck'] },
    tests: { title: 'Practice tests & the exam', icon: '🎯', about: 'Quizzes, missed questions, 70-question exam', steps: ['tests', 'exam'] },
    skills: { title: 'Skills, words & notes', icon: '🧤', about: 'Skill checklists, abbreviations, the Oklahoma glossary and your notes', steps: ['more', 'skills', 'abbr', 'glossary', 'notes'] },
    chat: { title: 'Help chat & online AI', icon: '💬', about: 'Ask questions, the optional online AI, and health library updates', steps: ['chat', 'aiHelper', 'healthLib'] },
    backup: { title: 'Backing up your data', icon: '💾', about: 'Keep your progress safe and move to a new phone', steps: ['backup', 'backupScreen'] },
  };

  let ui = null, list = [], idx = 0, tourKey = null, returnTo = null;

  function build() {
    ui = document.createElement('div');
    ui.className = 'tour';
    ui.innerHTML = '<div class="tour-block"></div><div class="tour-hole" hidden></div>' +
      '<div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tour-t" aria-describedby="tour-x">' +
      '<div class="tour-top"><span class="tour-ico" aria-hidden="true"></span><span class="tour-count small"></span><button class="ghost tour-close" type="button">Close tour</button></div>' +
      '<div class="tour-body"><h2 id="tour-t"></h2><p id="tour-x"></p><div class="tour-how"></div></div><div class="tour-dots" aria-hidden="true"></div>' +
      '<div class="btnrow"><button class="secondary tour-prev" type="button">‹ Back</button><button class="tour-next" type="button">Next ›</button></div></div>';
    document.body.appendChild(ui);
    ui.querySelector('.tour-close').addEventListener('click', () => end(false));
    ui.querySelector('.tour-prev').addEventListener('click', () => go(idx - 1));
    ui.querySelector('.tour-next').addEventListener('click', () => (idx >= list.length - 1 ? end(true) : go(idx + 1)));
    window.addEventListener('resize', place);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('keydown', onKey);
  }
  let raf = 0;
  function onScroll() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; place(); }); }
  function onKey(e) {
    if (!ui) return;
    if (e.key === 'Escape') end(false);
    else if (e.key === 'ArrowRight') ui.querySelector('.tour-next').click();
    else if (e.key === 'ArrowLeft' && idx > 0) go(idx - 1);
  }

  function target() {
    const s = STEPS[list[idx]];
    if (!s.sel) return null;
    try { return typeof s.sel === 'function' ? s.sel() : document.querySelector(s.sel); } catch (e) { return null; }
  }

  function place() {
    if (!ui) return;
    const el = target(), hole = ui.querySelector('.tour-hole'), cardEl = ui.querySelector('.tour-card');
    if (!el || !el.getClientRects().length) {
      hole.hidden = true; ui.classList.add('no-target'); cardEl.style.top = ''; cardEl.style.bottom = ''; return;
    }
    ui.classList.remove('no-target');
    // The Android app draws under the status bar and the Back/Home bar: keep the card and spotlight between them.
    const sat = parseFloat(getComputedStyle(document.body, '::before').height) || 0;
    const sab = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom')) || 0;
    const r = el.getBoundingClientRect(), pad = 6, vh = window.innerHeight - sab, gap = 12;
    const ch = cardEl.offsetHeight + gap * 2;
    let top = Math.max(sat + 4, r.top - pad), bottom = Math.min(vh - 4, r.bottom + pad);
    // Put the card on whichever side has room; if neither does, trim the spotlight to what fits.
    let cardAtTop;
    if (vh - bottom >= ch) cardAtTop = false;
    else if (top - sat >= ch) cardAtTop = true;
    else if (top - sat > vh - bottom) { cardAtTop = true; top = Math.min(Math.max(top, sat + ch), bottom - 40); }
    else { cardAtTop = false; bottom = Math.max(top + 40, Math.min(bottom, vh - ch)); }
    hole.hidden = false;
    hole.style.top = top + 'px';
    hole.style.left = Math.max(4, r.left - pad) + 'px';
    hole.style.width = Math.min(window.innerWidth - 8, r.width + pad * 2) + 'px';
    hole.style.height = Math.max(40, bottom - top) + 'px';
    if (cardAtTop) { cardEl.style.top = (sat + gap) + 'px'; cardEl.style.bottom = 'auto'; }
    else { cardEl.style.top = 'auto'; cardEl.style.bottom = 'calc(' + gap + 'px + var(--sab))'; }
  }

  function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

  let busy = 0;
  async function go(i) {
    if (i < 0 || i >= list.length) return;
    const token = ++busy;            // a newer tap cancels an older, still-loading step
    idx = i;
    const s = STEPS[list[idx]];
    const cardEl = ui.querySelector('.tour-card');
    ui.querySelector('.tour-next').disabled = true;
    cardEl.classList.remove('in');
    if (s.route && location.hash !== s.route) { CNA.app._navDir = 'tab'; location.replace(s.route); await wait(420); } // replace: no extra history entries
    if (token !== busy || !ui) return;
    // Fill in the card first, so its height is known before positioning.
    const name = CNA.app.firstName ? CNA.app.firstName() : '';
    ui.querySelector('.tour-ico').textContent = s.icon || '💡';
    ui.querySelector('#tour-t').textContent = (list[idx] === 'done' && name) ? 'You' + String.fromCharCode(39) + 're all set, ' + name + '!' : s.title;
    ui.querySelector('#tour-x').textContent = s.text;
    ui.querySelector('.tour-how').innerHTML = (s.how && s.how.length) ? '<b class="small">What you can do here</b><ul>' + s.how.map((h) => '<li>' + CNA.app.esc(h) + '</li>').join('') + '</ul>' : '';
    ui.querySelector('.tour-body').scrollTop = 0;
    ui.querySelector('.tour-count').textContent = 'Step ' + (idx + 1) + ' of ' + list.length;
    ui.querySelector('.tour-dots').innerHTML = list.map((_, j) => '<i class="' + (j === idx ? 'on' : j < idx ? 'past' : '') + '"></i>').join('');
    ui.querySelector('.tour-prev').disabled = idx === 0;
    ui.querySelector('.tour-next').textContent = idx >= list.length - 1 ? (tourKey === 'full' ? 'Start using the app' : 'Done') : 'Next ›';
    const el = target();
    // Give the text more room when the highlighted part is small.
    const body = ui.querySelector('.tour-body'), vh0 = window.innerHeight;
    const th = el ? Math.min(el.getBoundingClientRect().height, vh0 * 0.45) : 0;
    body.style.maxHeight = Math.max(170, Math.min(vh0 * 0.5, vh0 - th - 230)) + 'px';
    if (el) {
      // Scroll so the part being explained sits in the space the card leaves free.
      // Stay clear of the sticky title bar (which sits below the phone's status bar) and the Back/Home bar.
      const head = document.querySelector('header.top'), hb = head ? Math.max(0, head.getBoundingClientRect().bottom) : 64;
      const sab = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom')) || 0;
      const ch = cardEl.offsetHeight + 24, r = el.getBoundingClientRect(), vh = window.innerHeight - sab;
      const fitsBelowCard = r.top >= ch + hb && r.bottom <= vh - 8;     // card can go on top
      const fitsAboveCard = r.top >= hb && r.bottom <= vh - ch;          // card can go at the bottom
      if (!fitsBelowCard && !fitsAboveCard) { window.scrollTo({ top: Math.max(0, window.scrollY + r.top - hb - 8), behavior: 'smooth' }); await wait(420); }
      if (token !== busy || !ui) return;
    }
    place();
    void cardEl.offsetWidth; cardEl.classList.add('in');
    ui.querySelector('.tour-next').disabled = false;
    ui.querySelector('.tour-next').focus({ preventScroll: true });
  }

  function start(key) {
    const t = TOURS[key] || TOURS.full;
    if (!CNA.app.state.settings.onboarded) return;
    tourKey = TOURS[key] ? key : 'full';
    returnTo = location.hash || '#/home';
    list = t.steps.slice(); idx = 0;
    if (!ui) build();
    document.documentElement.classList.add('touring');
    go(0);
  }

  function end(finished) {
    if (!ui) return;
    window.removeEventListener('resize', place);
    window.removeEventListener('scroll', onScroll);
    document.removeEventListener('keydown', onKey);
    ui.remove(); ui = null;
    document.documentElement.classList.remove('touring');
    const st = CNA.app.state;
    if (tourKey === 'full') { st.settings.tourDone = true; CNA.app.save(); }
    if (finished && tourKey === 'full') { CNA.app.go('#/calendar'); CNA.app.toast('Tip: start by adding your work shifts.'); }
    else if (returnTo && tourKey !== 'full') CNA.app.go(returnTo === '#/help' ? '#/help' : returnTo);
  }

  CNA.tour = { start, end, TOURS, active: () => !!ui };

  // ---------- Help screen: replay the tour or one part of it, plus quick answers ----------
  V.help = function (root) {
    const app = CNA.app, esc = app.esc;
    const faq = [
      ['How do I add a night shift?', 'Calendar → Work shift. Set the start (for example 7:00 PM) and end (7:00 AM). The app knows it ends the next morning.'],
      ['How do I add a rotating schedule?', 'Calendar → Work shift → Repeat → "Rotation", then choose days on and days off (for example 4 on, 3 off).'],
      ['What happens if I miss a study session?', 'It moves to your next free time automatically. You can also tap Skip on Home.'],
      ['How do I stop study sessions on a certain day?', 'Calendar → tap "No study this day" under that day.'],
      ['How do I make the text bigger?', 'More → Settings → Text size → Extra large.'],
      ['Where does the information come from?', 'Official government sources only — mainly Oklahoma\'s own nurse aide documents. Every lesson has buttons to open them.'],
      ['How do I keep my data safe?', 'More → Backup & Restore → Download backup file. Do it every week or two.'],
      ['How do I ask a question?', 'Tap the round 💬 button at the bottom right of any main screen and type your question. It answers from your lessons (and official health sources saved on your phone for other topics), even with no internet.'],
      ['How do I make the chat smarter?', 'More → Settings → Online AI helper. Paste a free Google AI Studio key once, turn it on and tap Test & save. It is remembered on this phone.'],
      ['I closed the app during the practice exam!', 'Open Tests — tap Resume on the "Unfinished" card. The timer keeps running while the app is closed.'],
    ];
    root.innerHTML = app.header('App tour & help', '#/more') +
      '<div class="card hero"><div style="font-size:1.15em;font-weight:800">🧭 New here, or need a refresher?</div><p style="margin:6px 0 12px">Take the guided tour — it walks you through every screen.</p>' +
      '<button class="secondary block" id="tour-full">Start the full tour</button></div>' +
      '<h2>Just one part</h2><div class="card"><ul class="list">' +
      Object.keys(TOURS).filter((k) => k !== 'full').map((k) => '<li><button class="item" data-tour="' + k + '"><span class="ico" aria-hidden="true">' + TOURS[k].icon + '</span><span class="grow"><span class="title">' + esc(TOURS[k].title) + '</span><br><span class="sub">' + esc(TOURS[k].about) + '</span></span><span class="chev" aria-hidden="true">›</span></button></li>').join('') +
      '</ul></div>' +
      '<h2>Quick answers</h2><div class="card">' + faq.map((f) => '<details class="faq"><summary>' + esc(f[0]) + '</summary><p class="small">' + esc(f[1]) + '</p></details>').join('') + '</div>';
    app.$('#tour-full', root).addEventListener('click', () => start('full'));
    app.$$('[data-tour]', root).forEach((b) => b.addEventListener('click', () => start(b.dataset.tour)));
  };
})();
