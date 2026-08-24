/* main.js — the adoption journey: scenes, fleeing No button, confetti,
   naming ceremony, certificate, and the permanent companion home. */
(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const store = {
    get adopted() { return localStorage.getItem('khushi.koala.adopted') === 'yes'; },
    set adopted(v) { localStorage.setItem('khushi.koala.adopted', v ? 'yes' : ''); },
    get name() { return localStorage.getItem('khushi.koala.name') || ''; },
    set name(v) { localStorage.setItem('khushi.koala.name', v); }
  };

  /* ---------- scene manager ---------- */
  const scenes = document.querySelectorAll('.scene');
  function showScene(id) {
    scenes.forEach(s => { s.hidden = (s.id !== id); });
    window.scrollTo(0, 0);
  }

  /* ---------- koalas: one per slot ---------- */
  const koalas = {};
  document.querySelectorAll('[data-koala]').forEach(slot => {
    const scene = slot.closest('.scene');
    const key = slot.dataset.koala || (scene && scene.id);
    koalas[key] = Koala.create(slot);
  });

  /* ---------- confetti (hand-rolled, no library) ---------- */
  const canvas = $('#confetti');
  const ctx = canvas.getContext('2d');
  let pieces = [];
  let confettiRunning = false;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function burstConfetti(count) {
    const colors = ['#5E8C6A', '#E8896B', '#F2C14E', '#8E9CA8', '#B0413E', '#7FAF8C'];
    for (let i = 0; i < (count || 120); i++) {
      pieces.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.5,
        y: canvas.height * 0.35,
        vx: (Math.random() - 0.5) * 11,
        vy: -Math.random() * 11 - 3,
        size: 5 + Math.random() * 7,
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.3
      });
    }
    if (!confettiRunning) { confettiRunning = true; requestAnimationFrame(tickConfetti); }
  }

  function tickConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.vy += 0.28; p.x += p.vx; p.y += p.vy; p.rot += p.vrot;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    pieces = pieces.filter(p => p.y < canvas.height + 30);
    if (pieces.length) { requestAnimationFrame(tickConfetti); }
    else { confettiRunning = false; ctx.clearRect(0, 0, canvas.width, canvas.height); }
  }

  /* ---------- photo fallback (photo not added yet? hide the frames) ---------- */
  document.querySelectorAll('.photo-frame img').forEach(img => {
    img.addEventListener('error', () => img.closest('.photo-frame').classList.add('missing'));
  });

  /* ================= SCENE 1 → 2: open the parcel ================= */
  $('#parcel').addEventListener('click', () => {
    const parcel = $('#parcel');
    if (parcel.classList.contains('opening')) return;
    parcel.classList.add('opening');
    setTimeout(() => {
      showScene('scene-reveal');
      koalas['scene-reveal'].wave();
      runTypewriter();
    }, 620);
  });

  /* ================= SCENE 2: typewriter intro ================= */
  const REVEAL_TEXT =
    "G'day. I am a koala. 🐨 You must be Khushi.\n\n" +
    "I have travelled 14,239 km to find you. Mostly by napping, to be honest.\n\n" +
    "Word reached the eucalyptus trees that you've been tired, overworked, and dangerously under-hugged lately. Unacceptable.\n\n" +
    "So I am here to formally apply for the position of BEST FRIEND. Permanent contract. Unpaid. Salary payable entirely in hugs.\n\n" +
    "Your name literally means happiness, Khushi. Which means I have exactly one job — and I intend to be extremely good at it.";

  function runTypewriter() {
    const el = $('#reveal-text');
    const btn = $('#reveal-next');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let i = 0;
    el.textContent = '';
    el.classList.remove('done');
    btn.classList.remove('shown');
    el.style.whiteSpace = 'pre-line';

    function finish() {
      el.textContent = REVEAL_TEXT;
      el.classList.add('done');
      btn.classList.add('shown');
      koalas['scene-reveal'].bounce();
    }
    if (reduceMotion) { finish(); return; }

    (function type() {
      if (i >= REVEAL_TEXT.length) { finish(); return; }
      el.textContent += REVEAL_TEXT[i++];
      const ch = REVEAL_TEXT[i - 1];
      setTimeout(type, ch === '\n' ? 220 : (ch === '.' || ch === '!' ? 160 : 24));
    })();

    // let an impatient reader skip to the end
    el.parentElement.addEventListener('click', () => { i = REVEAL_TEXT.length; }, { once: true });
  }

  $('#reveal-next').addEventListener('click', () => {
    showScene('scene-offer');
    koalas['scene-offer'].wiggle();
  });

  /* ================= SCENE 3: the un-refusable offer ================= */
  const noBtn = $('#btn-no');
  const yesBtn = $('#btn-yes');
  const arena = $('#offer-arena');
  const taunt = $('#no-taunt');
  let noAttempts = 0;
  let lastFlee = 0;

  const NO_LINES = [
    'wait — are you sure?',
    'I am VERY soft. Reconsider.',
    "I'm hypoallergenic… ish.",
    'I nap professionally. That skill transfers.',
    'I already told my mum about you.',
    'my lawyer says this button does nothing anyway.',
    'the paperwork is literally already stamped.',
    "okay fine. FINE. I'll press it for you…"
  ];

  // a mouse can be dodged on hover; a finger cannot, so touch gets its own path
  // (?touch=1 forces the touch path, so it can be checked on a desktop browser)
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !new URLSearchParams(location.search).has('touch');
  // each tap is deliberate effort, so touch reaches the surrender sooner
  const MAX_ATTEMPTS = canHover ? NO_LINES.length : 5;

  /* Choose where the button lands: never under the finger that just tapped it,
     never overlapping YES (an accidental adoption is a different joke), and
     always fully inside the arena so it can't escape off-screen. */
  function pickSafeSpot(avoidClientX, avoidClientY) {
    const a = arena.getBoundingClientRect();
    const y = yesBtn.getBoundingClientRect();
    const bw = noBtn.offsetWidth;
    const bh = noBtn.offsetHeight;
    const maxX = Math.max(0, a.width - bw);
    const maxY = Math.max(0, a.height - bh);

    const pad = 16;
    const yx1 = y.left - a.left - pad, yx2 = y.right - a.left + pad;
    const yy1 = y.top - a.top - pad,   yy2 = y.bottom - a.top + pad;

    const avoidX = avoidClientX == null ? maxX / 2 : avoidClientX - a.left;
    const avoidY = avoidClientY == null ? maxY / 2 : avoidClientY - a.top;

    const here = { x: parseFloat(noBtn.style.left) || 0, y: parseFloat(noBtn.style.top) || 0 };
    const COLS = 5, ROWS = 4;
    const spots = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = maxX * (c / (COLS - 1));
        const yy = maxY * (r / (ROWS - 1));
        if (x + bw > yx1 && x < yx2 && yy + bh > yy1 && yy < yy2) continue; // sits on YES
        if (Math.abs(x - here.x) < 12 && Math.abs(yy - here.y) < 12) continue; // where it already is
        spots.push({ x: x, y: yy, d: Math.hypot(x + bw / 2 - avoidX, yy + bh / 2 - avoidY) });
      }
    }
    if (!spots.length) return { x: Math.random() * maxX, y: Math.random() * maxY };

    // pick at random from the far half, so it always escapes but never
    // ping-pongs between the same two corners
    spots.sort((p, q) => q.d - p.d);
    const far = spots.slice(0, Math.max(3, Math.ceil(spots.length / 2)));
    return far[(Math.random() * far.length) | 0];
  }

  function fleeNo(clientX, clientY) {
    if (noBtn.dataset.surrendered) return;
    // one tap can raise several events (pointerdown, touchstart, click)
    const now = Date.now();
    if (now - lastFlee < 250) return;
    lastFlee = now;
    noAttempts++;

    // scene direction: the koala looks sadder with every refusal attempt
    koalas['scene-offer'].sad(true);
    setTimeout(() => koalas['scene-offer'].sad(false), 900);

    // walk the whole taunt arc regardless of how many attempts it takes
    const step = MAX_ATTEMPTS > 1 ? (noAttempts - 1) / (MAX_ATTEMPTS - 1) : 1;
    taunt.textContent = NO_LINES[Math.min(NO_LINES.length - 1, Math.round(step * (NO_LINES.length - 1)))];
    yesBtn.classList.add('mega');

    if (noAttempts >= MAX_ATTEMPTS) {
      // the No button gives up and defects to the koala's side
      noBtn.textContent = 'YES (the button surrendered) 🏳️';
      noBtn.classList.remove('btn-no', 'fleeing', 'hop');
      noBtn.classList.add('btn-yes');
      noBtn.removeAttribute('style');
      noBtn.dataset.surrendered = 'yes';
      taunt.textContent = "okay fine. FINE. I'll press it for you…";
      return;
    }

    noBtn.classList.add('fleeing');
    noBtn.style.setProperty('--s', Math.max(0.45, 1 - noAttempts * 0.11));
    const spot = pickSafeSpot(clientX, clientY);
    noBtn.style.left = spot.x + 'px';
    noBtn.style.top = spot.y + 'px';

    noBtn.classList.remove('hop');
    void noBtn.offsetWidth; // restart the hop if it is still mid-animation
    noBtn.classList.add('hop');
  }

  if (canHover) {
    // desktop: dodge the cursor before it ever arrives
    noBtn.addEventListener('pointerenter', (e) => fleeNo(e.clientX, e.clientY));
  } else {
    // touch: leap away as the finger lands, and swallow the tap so no click follows
    noBtn.addEventListener('pointerdown', (e) => {
      if (noBtn.dataset.surrendered) return;
      e.preventDefault();
      fleeNo(e.clientX, e.clientY);
    });
    noBtn.addEventListener('touchstart', (e) => {
      if (noBtn.dataset.surrendered) return;
      e.preventDefault(); // fallback for browsers without pointer events
      const t = e.touches[0];
      fleeNo(t ? t.clientX : null, t ? t.clientY : null);
    }, { passive: false });
  }

  noBtn.addEventListener('click', (e) => {
    if (noBtn.dataset.surrendered) { acceptAdoption(); return; }
    e.preventDefault();
    if (canHover) fleeNo(e.clientX, e.clientY); // a very fast mouse can still land one
  });

  // keep the fugitive inside the arena if the screen rotates or resizes
  window.addEventListener('resize', () => {
    if (!noBtn.classList.contains('fleeing')) return;
    const maxX = Math.max(0, arena.clientWidth - noBtn.offsetWidth);
    const maxY = Math.max(0, arena.clientHeight - noBtn.offsetHeight);
    noBtn.style.left = Math.min(parseFloat(noBtn.style.left) || 0, maxX) + 'px';
    noBtn.style.top = Math.min(parseFloat(noBtn.style.top) || 0, maxY) + 'px';
  });

  yesBtn.addEventListener('click', acceptAdoption);

  function acceptAdoption() {
    burstConfetti(160);
    koalas['scene-offer'].bounce();
    setTimeout(() => {
      showScene('scene-naming');
      koalas['scene-naming'].wave();
    }, 900);
  }

  /* ================= SCENE 4: naming ceremony ================= */
  $('#naming-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#koala-name-input');
    const feedback = $('#naming-feedback');
    const name = input.value.trim();

    if (!name) {
      feedback.textContent = 'Even koalas need names. I checked the rules. 📜';
      koalas['scene-naming'].sad(true);
      setTimeout(() => koalas['scene-naming'].sad(false), 1200);
      return;
    }
    if (name.length > 20) {
      feedback.textContent = "I'll never learn to spell that — I have a very small brain. Something shorter? 🥺";
      return;
    }

    store.name = name;
    store.adopted = true;
    burstConfetti(200);
    koalas['scene-naming'].bounce();
    feedback.textContent = `${name}… ${name}! Yes. I have never loved anything more. 🥹`;

    setTimeout(() => {
      fillCertificate();
      showScene('scene-certificate');
      koalas['scene-certificate'].bounce();
      burstConfetti(120);
    }, 1800);
  });

  /* ================= SCENE 5: certificate ================= */
  function fillCertificate() {
    $('#cert-koala-name').textContent = store.name || '…';
    $('#cert-koala-sign').textContent = store.name ? `🐾 ${store.name}` : '🐾';
    $('#cert-date').textContent =
      'Sealed and eternally binding since ' +
      new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) +
      ' • Bureau ref. no. KHUSHI-01 🐨';
  }

  $('#btn-print').addEventListener('click', () => window.print());
  $('#btn-to-home').addEventListener('click', enterHome);

  /* ================= SCENE 6: the leaf-catching game ================= */
  const COMPLIMENTS = [
    "Official koala assessment: 10/10, would climb. 🐾",
    "You have the emotional range of a sunrise and the work ethic of an entire ant colony. Rest is still mandatory though.",
    "Scientists could study your smile as a renewable energy source.",
    "You're the kind of person koalas cross oceans for. Source: me. I did that.",
    "Your hugs have been rated 'structurally perfect' by the Bureau of Koala Affairs.",
    "If kindness were a sport, you'd be banned for being suspiciously good at it.",
    "You make ordinary days feel like the good kind of weekend.",
    "Eucalyptus is my second favourite thing now. You can guess the first.",
    "You survived 100% of your worst days so far. Statistically, you're unstoppable.",
    "Your laugh should be a protected natural resource. 🌿",
    "You're not 'too much'. You're exactly enough, plus bonus content.",
    "Even my little stitched-on smile gets bigger when you're around.",
    "The bravest thing I've seen is you showing up again and again. And I once saw a bird steal a whole sandwich.",
    "You radiate 'main character finally getting their cozy episode' energy.",
    "Certified: softest heart in the hemisphere. (I'm the softest overall, but it's close.)",
    "Whatever you touch gets 40% more wonderful. I've measured. I had a clipboard.",
    "You're proof that the best people are the ones who don't even realise it.",
    "Your name means happiness, and honestly? Accurate labelling. Refreshing.",
    "The world is measurably better with you in it. This is peer-reviewed. The peer was me.",
    "You + blanket + me = the safest place on Earth. That's just maths.",
    "You've handled every 'impossible' week so far. At this point, impossible should be scared of YOU.",
    "Reminder from your koala: rest is productive too, and nobody has earned it harder than you.",
    "Whatever tomorrow throws at you, it has to get through me first. I'm small but extremely committed.",
    "I've watched you keep going when it was hard. That's not luck — that's you being quietly extraordinary.",
    "Big meeting? Long day? Take me along in your head. I'll be cheering from the eucalyptus. 📣",
    "You're allowed to be tired. You're NOT allowed to forget how amazing you are. That's my department now.",
    "Life upgrade complete: you now come with a built-in koala. Rough days have lost their advantage.",
    "When it all feels heavy, squeeze me. I convert stress into fluff. It's science. Fluff-based science.",
    "You keep showing up for everyone. I'm the one who shows up for YOU. Forever. It's in the certificate.",
    "One day you'll see yourself the way I see you. Until then, I'll just keep telling you: magnificent.",
    "Doubt is loud, but I'm softer AND more persistent. You can do this. I'd bet all my leaves on you.",
    "You didn't just adopt a koala. You hired a full-time believer-in-you. I take my job very seriously."
  ];

  // a caught heart always says something about how lovely she is
  const HEART_LINES = [
    "A heart! Fitting — you caught mine ages ago. Also: you're beautiful. That's just a fact I keep noticing. 💛",
    "Official heart delivery for Khushi: you are beautiful. Inside, outside, and at 2am on a bad day.",
    "This heart says you're gorgeous. I fact-checked it. Twice.",
    "Every heart you catch is one I already gave you. There are… a lot. 💛",
    "Beauty report: still you. It's always you.",
    "You caught a heart! It was mine. Keep it — I have a lifetime supply where you're concerned."
  ];

  const STAR_LINES = [
    "A star! For the most stellar human in any hemisphere. ⭐",
    "You caught a star — understandable, like attracts like.",
    "Stars are just the sky's way of applauding you. I taught them that. ⭐",
    "Careful with that star. It's been dreaming of meeting you. Same, honestly."
  ];

  // missing a leaf is exactly when the koala proves it isn't going anywhere
  const MISS_LINES = [
    "Missed one? The leaf fell. I didn't. I never will. 🐨",
    "You don't have to catch everything, Khushi. Whatever drops — I've got you.",
    "Some leaves get away. Best friends don't. Exhibit A: me.",
    "No score can change this: wherever you are is where I'll be.",
    "Psst. Even on the days you drop everything, you're still my favourite. Especially then."
  ];

  // every 25 leaves, the promise gets bigger
  const MILESTONE_LINES = [
    "25 leaves! Look at us. Rain, deadlines, rough days — I'm in ALL of them with you. Permanently. 💛",
    "Our tree is getting enormous, and so is my promise: you will never do a hard day alone again.",
    "At this point the tree is basically a landmark. So is this fact: you + me. Always. Non-negotiable.",
    "Every leaf we've caught is a day I plan to spend with you. We're going to need a bigger tree. 🌳"
  ];

  const DANCE_LINES = [
    "initiating the forbidden koala shuffle… 🕺",
    "these moves are why I'm not allowed back in Australia.",
    "DJ, drop the eucalyptus beat! 🪩",
    "warning: professional fluff at work. do not attempt at home.",
    "this one's called 'deadline? WHAT deadline?'",
    "I learned this from a kangaroo. She was a terrible teacher."
  ];

  let lastIdx = { compliment: -1, heart: -1, star: -1, miss: -1, milestone: -1, dance: -1 };
  function pick(list, key) {
    let i;
    do { i = (Math.random() * list.length) | 0; } while (list.length > 1 && i === lastIdx[key]);
    lastIdx[key] = i;
    return list[i];
  }

  function speak(text) {
    const el = $('#home-speech');
    el.style.opacity = 0;
    setTimeout(() => { el.textContent = text; el.style.opacity = 1; }, 180);
  }

  function enterHome() {
    const name = store.name || 'your koala';
    $('#home-greeting').textContent = `Khushi & ${name} — best friends, officially. 💛`;
    speak(`Let's grow our friendship tree! Slide me around and catch the leaves — I'll handle the complimenting. 🍃`);
    showScene('scene-home');
    koalas['player'].wave();
    startGame();
  }

  /* --- the game: catch leaves, receive love. losing is not implemented. --- */
  const gameArena = $('#game-arena');
  const playerSlot = $('#player-slot');
  const scoreEl = $('#game-score');
  const hintEl = $('#game-hint');
  const homeScene = $('#scene-home');

  const game = { on: false, score: 0, missed: 0, drops: [], x: 0.5, tx: 0.5, lastT: 0, nextSpawn: 0 };

  function steer(clientX) {
    const r = gameArena.getBoundingClientRect();
    if (!r.width) return;
    game.tx = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    hintEl.classList.add('off');
  }
  gameArena.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    gameArena.setPointerCapture(e.pointerId);
    steer(e.clientX);
  });
  gameArena.addEventListener('pointermove', (e) => steer(e.clientX));
  document.addEventListener('keydown', (e) => {
    if (homeScene.hidden) return;
    if (e.key === 'ArrowLeft') { game.tx = Math.max(0, game.tx - 0.1); hintEl.classList.add('off'); }
    if (e.key === 'ArrowRight') { game.tx = Math.min(1, game.tx + 0.1); hintEl.classList.add('off'); }
  });

  function spawnDrop() {
    const roll = Math.random();
    const type = roll < 0.13 ? 'heart' : roll < 0.2 ? 'star' : 'leaf';
    const el = document.createElement('span');
    el.className = 'drop';
    el.innerHTML = '<span>' + (type === 'heart' ? '💛' : type === 'star' ? '⭐' : '🍃') + '</span>';
    gameArena.appendChild(el);
    game.drops.push({
      el: el, type: type,
      x: 18 + Math.random() * Math.max(40, gameArena.clientWidth - 68),
      y: -36,
      speed: 0.055 + Math.random() * 0.03 + Math.min(0.04, game.score * 0.0005),
      sway: 8 + Math.random() * 16,
      phase: Math.random() * 6.28
    });
  }

  function removeDrop(d, caught) {
    game.drops.splice(game.drops.indexOf(d), 1);
    if (caught) {
      d.el.firstChild.classList.add('caught');
      setTimeout(() => d.el.remove(), 480);
    } else {
      d.el.remove();
    }
  }

  function updateScore() {
    const n = game.score;
    scoreEl.textContent = `🍃 ${n} caught — ` + (
      n === 0 ? 'let’s grow our friendship tree' :
      n < 10 ? 'our friendship tree is sprouting' :
      n < 25 ? 'our friendship tree is growing tall' :
      n < 50 ? 'our tree is magnificent. like you.' :
      'this is a whole forest of us now');
  }

  function onCatch(d) {
    removeDrop(d, true);
    game.score++;
    updateScore();
    const k = koalas['player'];
    if (d.type === 'heart') { speak(pick(HEART_LINES, 'heart')); k.squeeze(); }
    else if (d.type === 'star') { burstConfetti(50); speak(pick(STAR_LINES, 'star')); k.bounce(); }
    else if (game.score % 25 === 0) { burstConfetti(150); speak(pick(MILESTONE_LINES, 'milestone')); k.bounce(); }
    else if (game.score % 5 === 0) { speak(pick(COMPLIMENTS, 'compliment')); k.wiggle(); }
  }

  function onMiss(d) {
    removeDrop(d, false);
    game.missed++;
    if (game.missed % 6 === 0) { speak(pick(MISS_LINES, 'miss')); koalas['player'].nod(); }
  }

  function gameTick(now) {
    if (!game.on) return;
    if (homeScene.hidden) {
      // she left for the story replay: stop cleanly, keep the score for later
      game.on = false;
      game.drops.forEach(d => d.el.remove());
      game.drops.length = 0;
      return;
    }
    const dt = Math.min(48, now - game.lastT || 16);
    game.lastT = now;

    // the koala glides toward the finger/cursor
    game.x += (game.tx - game.x) * Math.min(1, dt * 0.014);
    const aw = gameArena.clientWidth;
    const kw = playerSlot.offsetWidth;
    const kx = game.x * Math.max(0, aw - kw);
    playerSlot.style.left = kx + 'px';

    if (now >= game.nextSpawn) {
      spawnDrop();
      game.nextSpawn = now + Math.max(800, 1350 - game.score * 5);
    }

    const ah = gameArena.clientHeight;
    const catchY = ah - playerSlot.offsetHeight * 0.85;
    for (const d of game.drops.slice()) {
      d.y += d.speed * dt;
      const dx = d.x + Math.sin(d.y / 46 + d.phase) * d.sway;
      d.el.style.transform = `translate(${dx}px, ${d.y}px)`;
      if (d.y >= catchY && Math.abs(dx + 16 - (kx + kw / 2)) < kw * 0.58) { onCatch(d); }
      else if (d.y >= ah - 8) { onMiss(d); }
    }
    requestAnimationFrame(gameTick);
  }

  function startGame() {
    if (game.on) return;
    game.on = true;
    game.lastT = performance.now();
    game.nextSpawn = performance.now() + 900;
    updateScore();
    requestAnimationFrame(gameTick);
  }

  /* --- emergency hug: arms open, koala comes close, arms wrap, screen squeezes --- */
  const hugOverlay = $('#hug-overlay');
  const hugText = $('#hug-text');
  let hugTimers = [];

  function spawnHugHearts(count) {
    const emojis = ['💛', '💚', '🤍', '💛'];
    for (let i = 0; i < count; i++) {
      const h = document.createElement('span');
      h.className = 'hug-heart';
      h.textContent = emojis[(Math.random() * emojis.length) | 0];
      h.style.left = 4 + Math.random() * 92 + '%';
      h.style.fontSize = 22 + Math.random() * 22 + 'px';
      h.style.animationDuration = 3 + Math.random() * 2.5 + 's';
      h.style.animationDelay = Math.random() * 2.2 + 's';
      hugOverlay.appendChild(h);
      setTimeout(() => h.remove(), 8000);
    }
  }

  $('#btn-hug').addEventListener('click', () => {
    hugOverlay.hidden = false;
    hugOverlay.classList.remove('hugging');
    void hugOverlay.offsetWidth; // restart the choreography on every hug
    hugOverlay.classList.add('hugging');
    hugText.textContent = 'come here, Khushi… 🤗';
    spawnHugHearts(12);

    hugTimers.forEach(clearTimeout);
    hugTimers = [
      setTimeout(() => { hugText.textContent = '*S Q U E E Z E* 💛'; }, 2500),
      setTimeout(() => {
        hugText.innerHTML = 'HUG DELIVERED 🫂<br><small>unlimited refills. no expiry date.</small>';
        burstConfetti(70);
      }, 3800),
      setTimeout(closeHug, 6200)
    ];
    hugOverlay.addEventListener('click', closeHug, { once: true });
  });

  function closeHug() {
    if (hugOverlay.hidden) return;
    hugTimers.forEach(clearTimeout);
    hugOverlay.classList.remove('hugging');
    hugOverlay.hidden = true;
    speak('Hug stored in your bones. Redeem the real one from me anytime. 💛');
  }

  /* --- koala dance: disco lights, music notes, the forbidden shuffle --- */
  const danceOverlay = $('#dance-overlay');
  const danceText = $('#dance-text');
  let danceTimers = [];
  let noteTimer = null;

  function spawnNote() {
    const n = document.createElement('span');
    n.className = 'dance-note';
    n.textContent = ['🎵', '🎶', '♪', '♫'][(Math.random() * 4) | 0];
    n.style.left = 6 + Math.random() * 88 + '%';
    n.style.animationDuration = 1.8 + Math.random() * 1.4 + 's';
    danceOverlay.appendChild(n);
    setTimeout(() => n.remove(), 3400);
  }

  $('#btn-dance').addEventListener('click', () => {
    danceOverlay.hidden = false;
    koalas['dance'].svg.classList.add('k-dancing');
    danceText.textContent = pick(DANCE_LINES, 'dance');
    noteTimer = setInterval(spawnNote, 280);

    danceTimers.forEach(clearTimeout);
    danceTimers = [
      setTimeout(() => { danceText.textContent = pick(DANCE_LINES, 'dance'); }, 3000),
      setTimeout(() => { danceText.textContent = pick(DANCE_LINES, 'dance'); }, 6000),
      setTimeout(closeDance, 8500)
    ];
    danceOverlay.addEventListener('click', closeDance, { once: true });
  });

  function closeDance() {
    if (danceOverlay.hidden) return;
    danceTimers.forEach(clearTimeout);
    clearInterval(noteTimer);
    koalas['dance'].svg.classList.remove('k-dancing');
    danceOverlay.hidden = true;
    speak("*pant pant* I only dance like that for you. What happens in the eucalyptus stays in the eucalyptus. 🕺");
  }

  /* --- replay the story --- */
  $('#btn-restart').addEventListener('click', () => {
    speak('Replaying our origin story… I still say yes, for the record.');
    setTimeout(() => {
      showScene('scene-delivery');
      $('#parcel').classList.remove('opening');
    }, 900);
  });

  /* ================= boot ================= */
  // preview hook: ?peek=reveal|offer|naming|certificate|home (&name=…) jumps to a scene
  const params = new URLSearchParams(location.search);
  const peek = params.get('peek');
  if (peek) {
    if (params.get('name')) store.name = params.get('name');
    fillCertificate();
    if (peek === 'home') { enterHome(); }
    else {
      showScene('scene-' + peek);
      if (peek === 'reveal') runTypewriter();
    }
  } else if (store.adopted && store.name) {
    fillCertificate(); // so the certificate is ready if she replays
    enterHome();
  } else {
    showScene('scene-delivery');
  }
})();
