// Home's centre: the next prayer inside a mihrab arch, ringed by the real progress from the last prayer time to the
// next (lib/sky.ts prayerInterval) and an orbit of the eight moon phases with tonight's lit. Redrawn every second in
// place (lib/morph.ts), so the arc's dashoffset eases between values and the slow orbit keeps turning.
import { moonLitPath } from '../lib/sky';
import { phaseIndex } from './sky';

const C = 220; // centre of the 440×440 drawing
const R_PROGRESS = 166;
const CIRC = 2 * Math.PI * R_PROGRESS;

const at = (deg: number, r: number) => {
  const a = (deg - 90) * Math.PI / 180; // 0° at the top, clockwise
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};

function phases(moon: number) {
  const current = phaseIndex(moon);
  let out = '';
  for (let k = 0; k < 8; k++) {
    // The upper arc, left to right: new moon at the left end, waning crescent at the right.
    const [x, y] = at(-78 + k * (156 / 7), 206);
    const on = k === current;
    out += `<g class="phase${on ? ' on' : ''}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
      <circle r="${on ? 11 : 8}" class="phase-dark"/>
      <path d="${moonLitPath(k / 8 + 0.0001, 0, 0, on ? 11 : 8)}" class="phase-lit"/></g>`;
  }
  return out;
}

export type DialData = {
  label: string; name: string; countdown: string; until: string; time: string;
  /** 0 to 1 from the last prayer time to the next. */
  progress: number;
  moon: number;
  aria: string;
};

export function dial(d: DialData) {
  const offset = (CIRC * (1 - d.progress)).toFixed(1);
  const [ex, ey] = at(d.progress * 360, R_PROGRESS);
  return `<div class="dial" role="group" aria-label="${d.aria}">
    <svg class="dial-svg" viewBox="0 0 440 440" aria-hidden="true">
      <defs>
        <linearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f6e2a8"/><stop offset=".55" stop-color="#d8b46a"/><stop offset="1" stop-color="#a8823f"/>
        </linearGradient>
        <radialGradient id="disc" cx=".5" cy=".42" r=".62">
          <stop offset="0" stop-color="#1b335c"/><stop offset=".7" stop-color="#0e1d38"/><stop offset="1" stop-color="#0a1529"/>
        </radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <path class="arch" d="M70 440 V200 C70 110 140 52 220 22 C300 52 370 110 370 200 V440"/>
      <line class="axis" x1="${C}" y1="2" x2="${C}" y2="${C - 150}"/>
      <path class="star4" d="M${C} -4 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3 Z" transform="translate(0 6)"/>
      <circle class="ring-orbit" cx="${C}" cy="${C}" r="206"/>
      <g class="orbit"><circle cx="${C}" cy="${C - 194}" r="2.4"/><circle cx="${C + 194}" cy="${C}" r="1.6"/><circle cx="${C}" cy="${C + 194}" r="2"/><circle cx="${C - 194}" cy="${C}" r="1.4"/></g>
      ${phases(d.moon)}
      <circle class="ring-dots" cx="${C}" cy="${C}" r="184"/>
      <circle class="track" cx="${C}" cy="${C}" r="${R_PROGRESS}"/>
      <circle class="progress" cx="${C}" cy="${C}" r="${R_PROGRESS}" stroke-dasharray="${CIRC.toFixed(1)}" stroke-dashoffset="${offset}"
        transform="rotate(-90 ${C} ${C})"/>
      <circle class="head-glow" cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="9" filter="url(#glow)"/>
      <circle class="head" cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="5"/>
      <circle class="disc" cx="${C}" cy="${C}" r="150"/>
      <circle class="disc-line" cx="${C}" cy="${C}" r="142"/>
    </svg>
    <div class="dial-text">
      <div class="dial-label">${d.label}</div>
      <div class="dial-name">${d.name}</div>
      <div class="dial-count">${d.countdown}</div>
      <div class="dial-until">${d.until}</div>
      <div class="dial-sep" aria-hidden="true"></div>
      <div class="dial-time">${d.time}</div>
    </div>
  </div>`;
}
