/* koala.js — builds and animates the SVG twin of the real soft toy.
   Usage: const k = Koala.create(slotElement); k.wave(); k.bounce(); k.squeeze(); k.nod(); k.sad();
   All koala instances blink on their own and their pupils follow the pointer. */
(function () {
  'use strict';

  const SVG = `
<svg class="koala" viewBox="0 0 360 410" role="img" aria-label="A grey cartoon koala with a white belly and big amber eyes">
  <defs>
    <radialGradient id="kFur" cx="50%" cy="40%" r="75%">
      <stop offset="0%" stop-color="#AEB9C2"/>
      <stop offset="100%" stop-color="#8E9CA8"/>
    </radialGradient>
    <radialGradient id="kBelly" cx="50%" cy="35%" r="80%">
      <stop offset="0%" stop-color="#FFFDF8"/>
      <stop offset="100%" stop-color="#EFE9DE"/>
    </radialGradient>
  </defs>

  <!-- ears (behind head) -->
  <g class="k-ear k-ear-left">
    <ellipse cx="62" cy="92" rx="54" ry="50" fill="url(#kFur)"/>
    <ellipse cx="66" cy="96" rx="32" ry="28" fill="#F7F3EB"/>
  </g>
  <g class="k-ear k-ear-right">
    <ellipse cx="298" cy="92" rx="54" ry="50" fill="url(#kFur)"/>
    <ellipse cx="294" cy="96" rx="32" ry="28" fill="#F7F3EB"/>
  </g>

  <!-- body -->
  <g class="k-body">
    <ellipse cx="180" cy="305" rx="104" ry="96" fill="url(#kFur)"/>
    <ellipse cx="180" cy="315" rx="68" ry="74" fill="url(#kBelly)"/>

    <!-- feet -->
    <g class="k-foot">
      <ellipse cx="120" cy="378" rx="42" ry="27" fill="url(#kFur)"/>
      <ellipse cx="118" cy="380" rx="26" ry="16" fill="#F7F3EB"/>
    </g>
    <g class="k-foot">
      <ellipse cx="240" cy="378" rx="42" ry="27" fill="url(#kFur)"/>
      <ellipse cx="242" cy="380" rx="26" ry="16" fill="#F7F3EB"/>
    </g>

    <!-- arms -->
    <g class="k-arm k-arm-left">
      <ellipse cx="84" cy="288" rx="30" ry="52" fill="url(#kFur)" transform="rotate(18 84 288)"/>
    </g>
    <g class="k-arm k-arm-right">
      <ellipse cx="276" cy="288" rx="30" ry="52" fill="url(#kFur)" transform="rotate(-18 276 288)"/>
    </g>
  </g>

  <!-- head -->
  <g class="k-head">
    <circle cx="180" cy="150" r="104" fill="url(#kFur)"/>
    <!-- muzzle -->
    <ellipse cx="180" cy="192" rx="54" ry="46" fill="url(#kBelly)"/>

    <!-- eyes -->
    <g class="k-eye">
      <circle cx="130" cy="148" r="25" fill="#7A4E2B" stroke="#2B221C" stroke-width="5"/>
      <g class="k-pupil">
        <circle cx="130" cy="150" r="10" fill="#1E1712"/>
        <circle cx="124" cy="142" r="6" fill="#FFFFFF"/>
        <circle cx="137" cy="155" r="2.6" fill="#FFFFFF"/>
      </g>
      <ellipse class="k-lid" cx="130" cy="148" rx="28" ry="28" fill="#9DAAB5"/>
      <path d="M104 128 l-9 -8 M112 119 l-6 -10 M124 114 l-3 -11" stroke="#2B221C" stroke-width="3.4" stroke-linecap="round" fill="none"/>
    </g>
    <g class="k-eye">
      <circle cx="230" cy="148" r="25" fill="#7A4E2B" stroke="#2B221C" stroke-width="5"/>
      <g class="k-pupil">
        <circle cx="230" cy="150" r="10" fill="#1E1712"/>
        <circle cx="224" cy="142" r="6" fill="#FFFFFF"/>
        <circle cx="237" cy="155" r="2.6" fill="#FFFFFF"/>
      </g>
      <ellipse class="k-lid" cx="230" cy="148" rx="28" ry="28" fill="#9DAAB5"/>
      <path d="M256 128 l9 -8 M248 119 l6 -10 M236 114 l3 -11" stroke="#2B221C" stroke-width="3.4" stroke-linecap="round" fill="none"/>
    </g>

    <!-- nose -->
    <path class="k-nose" d="M180 152 c22 0 30 14 30 32 c0 18 -13 28 -30 28 c-17 0 -30 -10 -30 -28 c0 -18 8 -32 30 -32 z" fill="#4E4540"/>
    <ellipse cx="170" cy="168" rx="8" ry="5" fill="#6B615B" opacity="0.7"/>

    <!-- mouth -->
    <g class="k-mouth" stroke="#3A4149" stroke-width="3.6" stroke-linecap="round" fill="none">
      <path d="M180 212 v8"/>
      <path class="k-smile" d="M163 222 q17 14 34 0"/>
    </g>
  </g>
</svg>`;

  const instances = [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let uid = 0;

  function createKoala(slot) {
    // gradient ids must be unique per instance: url(#...) always resolves to the
    // first id in the document, and gradients inside hidden scenes don't paint
    const id = ++uid;
    slot.innerHTML = SVG.replace(/kFur/g, 'kFur' + id).replace(/kBelly/g, 'kBelly' + id);
    const svg = slot.querySelector('svg');

    const koala = {
      svg,
      pupils: svg.querySelectorAll('.k-pupil'),
      lids: svg.querySelectorAll('.k-lid'),

      /* momentarily add an animation class, removing it when the animation ends */
      _play(cls, target) {
        const el = target || svg;
        el.classList.remove(cls);
        void el.getBoundingClientRect(); // restart the animation if re-triggered
        el.classList.add(cls);
        el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
      },

      wave()    { this._play('k-anim-wave', svg.querySelector('.k-arm-right')); },
      bounce()  { this._play('k-anim-bounce'); },
      squeeze() { this._play('k-anim-squeeze'); },
      nod()     { this._play('k-anim-nod', svg.querySelector('.k-head')); },
      wiggle()  { this._play('k-anim-wiggle'); },

      sad(on) {
        svg.classList.toggle('k-mood-sad', !!on);
      },

      blink() {
        this.lids.forEach(l => l.classList.add('k-blinking'));
        setTimeout(() => this.lids.forEach(l => l.classList.remove('k-blinking')), 160);
      },

      lookAt(clientX, clientY) {
        const r = svg.getBoundingClientRect();
        if (!r.width) return;
        const dx = (clientX - (r.left + r.width / 2)) / r.width;
        const dy = (clientY - (r.top + r.height * 0.37)) / r.height;
        const mx = Math.max(-1, Math.min(1, dx)) * 7;
        const my = Math.max(-1, Math.min(1, dy)) * 5;
        this.pupils.forEach(p => { p.style.transform = `translate(${mx}px, ${my}px)`; });
      }
    };

    // independent, slightly irregular blinking
    (function blinkLoop() {
      setTimeout(() => { koala.blink(); blinkLoop(); }, 2600 + Math.random() * 3400);
    })();

    instances.push(koala);
    return koala;
  }

  if (!reduceMotion) {
    document.addEventListener('pointermove', e => {
      instances.forEach(k => k.lookAt(e.clientX, e.clientY));
    }, { passive: true });
  }

  window.Koala = { create: createKoala, all: instances };
})();
