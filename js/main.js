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

  /* ================= SCENE 6: companion home ================= */
  const RESPONSES = {
    work: [
      "Deep breath. The inbox is not the boss of you — technically *I* am, per Article 3. New plan: one small thing at a time, then a hug. 🌊",
      "Work update from the eucalyptus tree: none of it will matter in 100 years, but your nap tonight will. Prioritise accordingly. 😌",
      "I have reviewed your workload and I am officially confiscating 20% of it. It's fluff now. Legally fluff.",
      "You know what koalas do under pressure? We sleep 20 hours a day. I'm not saying copy me exactly… but maybe 8? 💤",
      "Drowning is only allowed in blankets. Come here, one squeeze, then we conquer exactly ONE task. Deal?"
    ],
    tired: [
      "Excellent news: I am a certified pillow. Sixteen years of training. Assume the position. 🥱",
      "Exhaustion detected. Prescription: tea, blanket, me, and absolutely zero productivity for one hour. Doctor Koala has spoken.",
      "You've been running on 1% battery and still shining. Imagine you at full charge. Terrifying. Beautiful. Now REST.",
      "Fun fact: eucalyptus leaves are basically nature's espresso for me, and I STILL nap 20 hours. Rest is a skill. I'll teach you.",
      "Close the laptop. Close your eyes. I'll keep watch. Nothing gets past these ears — they're enormous. 🐨"
    ],
    rough: [
      "Rough days are just plot development, and you're obviously the main character. I'm the loyal sidekick. It's a great show. 🌧️→🌤️",
      "Per Article 3 of our contract, I hereby assume full emotional liability for today. Hand it over. All of it.",
      "Come here. You don't have to explain anything. I have soft ears and zero judgement — mostly because I can't talk.",
      "Today was heavy. You carried it anyway. That's not weakness, that's you being quietly ridiculous levels of strong.",
      "Rating today: 2/10. Rating you for surviving it: 10/10, would climb. Tomorrow we try again — together."
    ],
    hi: [
      "HI!! You came to see me!! This is the best thing that has happened since I discovered I have a belly to pat. 👋",
      "Hello, keeper of my heart and haver of excellent taste in koalas. How are we today?",
      "*waves with both stubby arms* This is my maximum wave. You deserve nothing less.",
      "Just saying hi?? To ME?? I will be riding this high for the rest of the week.",
      "Hi hi hi! Quick reminder while you're here: you're doing better than you think you are. Okay carry on. 🌿"
    ]
  };

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
    "You + blanket + me = the safest place on Earth. That's just maths."
  ];

  const SECRET_REPLIES = [
    "I heard all of it. It's in the fluff vault now. Sealed forever. 🤫",
    "Mm. Mmhm. *nods slowly* …I understand completely. Also you're safe with me.",
    "Secret received and swallowed. Koalas are legally unsubpoenable. Probably.",
    "Thank you for telling me. Whatever it is — you're still my favourite human. It's not close.",
    "*hugs the secret* *hugs you* Both are safe now.",
    "Noted with all four paws. And hey — carrying that alone was heavy. You don't have to anymore."
  ];

  let lastIdx = { work: -1, tired: -1, rough: -1, hi: -1, compliment: -1, secret: -1 };
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
    speak(`*${name} is here, blinking at you lovingly*`);
    showScene('scene-home');
    koalas['scene-home'].wave();
  }

  document.querySelectorAll('.btn-mood').forEach(btn => {
    btn.addEventListener('click', () => {
      const mood = btn.dataset.mood;
      speak(pick(RESPONSES[mood], mood));
      const k = koalas['scene-home'];
      if (mood === 'hi') { k.wave(); k.bounce(); }
      else if (mood === 'rough') { k.nod(); }
      else { k.nod(); setTimeout(() => k.wiggle(), 1400); }
    });
  });

  $('#btn-compliment').addEventListener('click', () => {
    speak(pick(COMPLIMENTS, 'compliment'));
    koalas['scene-home'].wiggle();
  });

  /* --- emergency hug --- */
  const hugOverlay = $('#hug-overlay');
  $('#btn-hug').addEventListener('click', () => {
    hugOverlay.hidden = false;
    const k = koalas['hug'];
    k.squeeze();
    burstConfetti(60);
    const again = setInterval(() => k.squeeze(), 1600);
    setTimeout(close, 3400);
    hugOverlay.addEventListener('click', close, { once: true });
    function close() {
      clearInterval(again);
      hugOverlay.hidden = true;
      speak('Hug delivered. Unlimited refills — no expiry date. 🫂');
    }
  });

  /* --- tell me anything --- */
  let nodTimer = null;
  $('#secret-input').addEventListener('input', () => {
    // the koala visibly listens while she types (throttled so it doesn't spasm)
    if (nodTimer) return;
    koalas['scene-home'].nod();
    nodTimer = setTimeout(() => { nodTimer = null; }, 1500);
  });

  $('#secret-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#secret-input');
    if (!input.value.trim()) {
      speak("You can tell me anything. Even '…'. Especially '…'.");
      return;
    }
    input.value = ''; // nothing is stored, nothing is sent — straight into the fluff vault
    speak(pick(SECRET_REPLIES, 'secret'));
    koalas['scene-home'].squeeze();
  });

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
