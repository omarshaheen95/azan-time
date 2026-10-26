// The night behind every screen: stars, tonight's moon at its real phase, and on Home a skyline of domes and minarets
// over still water. Drawn once (and again when the day or the screen changes), never in the seconds tick.
import { moonLitPath, moonPhase } from '../lib/sky';

/** A small deterministic random, so the stars keep their places between redraws. */
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function stars() {
  const rand = seeded(7);
  let out = '';
  for (let i = 0; i < 170; i++) {
    const x = rand() * 1600, y = rand() * 620, r = rand() < 0.08 ? 1.5 : rand() * 0.9 + 0.3;
    const twinkle = rand() < 0.12 ? ` class="tw" style="animation-delay:${(rand() * 6).toFixed(1)}s"` : '';
    out += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(2)}" opacity="${(0.35 + rand() * 0.6).toFixed(2)}"${twinkle}/>`;
  }
  return out;
}

/** A dome on a drum, centred at x on the ground line y, of width w. */
function mosque(x: number, y: number, w: number, minarets: number) {
  const h = w * 0.55, drum = w * 0.28;
  let p = `M${x - w / 2} ${y} V${y - drum} H${x - w * 0.36} `
    + `C${x - w * 0.36} ${y - drum - h * 0.9} ${x - w * 0.06} ${y - drum - h} ${x} ${y - drum - h * 1.25} `
    + `C${x + w * 0.06} ${y - drum - h} ${x + w * 0.36} ${y - drum - h * 0.9} ${x + w * 0.36} ${y - drum} `
    + `H${x + w / 2} V${y} Z `;
  // Small side domes.
  for (const s of [-1, 1]) {
    const cx = x + s * w * 0.62, sw = w * 0.36;
    p += `M${cx - sw / 2} ${y} V${y - sw * 0.35} Q${cx} ${y - sw * 1.05} ${cx + sw / 2} ${y - sw * 0.35} V${y} Z `;
  }
  for (let i = 0; i < minarets; i++) {
    const mx = x + (i % 2 ? 1 : -1) * w * (0.95 + Math.floor(i / 2) * 0.32), mh = w * (1.12 - Math.floor(i / 2) * 0.22), mw = w * 0.07;
    p += `M${mx - mw / 2} ${y} V${y - mh} L${mx} ${y - mh - mw * 3.2} L${mx + mw / 2} ${y - mh} V${y} Z `;
    p += `M${mx - mw} ${y - mh * 0.72} H${mx + mw} V${y - mh * 0.68} H${mx - mw} Z `;
  }
  return p;
}

/** Lit windows: a few warm dots across a building's face. */
function lights(x: number, y: number, w: number, seed: number) {
  const rand = seeded(seed);
  let out = '';
  for (let i = 0; i < 9; i++) {
    out += `<rect x="${(x - w / 2 + rand() * w).toFixed(1)}" y="${(y - rand() * w * 0.25 - 3).toFixed(1)}" width="1.6" height="2.4" rx=".6"/>`;
  }
  return out;
}

function skyline() {
  const ground = 600;
  const left = [mosque(150, ground, 104, 4), mosque(320, ground, 58, 2), mosque(40, ground, 48, 1)].join('');
  const right = [mosque(1440, ground, 92, 3), mosque(1290, ground, 52, 2), mosque(1560, ground, 46, 1)].join('');
  const hills = `M0 560 C200 470 360 520 520 500 C640 486 700 530 760 540 L760 600 L0 600 Z
    M840 540 C920 520 1000 470 1160 500 C1300 525 1420 460 1600 520 L1600 600 L840 600 Z`;
  const glints = [120, 170, 330, 1430, 1290, 1470].map((x, i) =>
    `<rect class="glint" x="${x - 30}" y="${612 + (i % 3) * 9}" width="${36 + (i % 2) * 24}" height="1.4" rx=".7"/>`).join('');
  return `<g class="hills"><path d="${hills}"/></g>
    <g class="town"><path d="${left}${right}"/></g>
    <g class="windows">${lights(150, ground, 104, 3)}${lights(320, ground, 58, 5)}${lights(1440, ground, 92, 9)}${lights(1290, ground, 52, 11)}</g>
    <rect class="water" x="0" y="${ground}" width="1600" height="80"/>
    <g class="reflection" transform="translate(0 ${ground * 2}) scale(1 -1)"><path d="${left}${right}"/></g>
    <g class="glints">${glints}</g>`;
}

/**
 * Home (`withSkyline`) gets the moon and the skyline, placed around its content; the other screens only the stars, so
 * nothing shows through their cards. `rtl`: the moon moves to the left, away from the clock, which then stands on the right.
 */
export function sky(now: Date, withSkyline: boolean, rtl = false) {
  const m = moonPhase(now);
  return `<svg class="sky-svg" viewBox="0 0 1600 680" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <radialGradient id="moonglow"><stop offset="0" stop-color="#f3e2b4" stop-opacity=".35"/><stop offset="1" stop-color="#f3e2b4" stop-opacity="0"/></radialGradient>
      <radialGradient id="moonlit" cx=".4" cy=".35"><stop offset="0" stop-color="#fbf1d6"/><stop offset=".7" stop-color="#e3cf9c"/><stop offset="1" stop-color="#b99f68"/></radialGradient>
      <clipPath id="litclip"><path d="${moonLitPath(m.phase, 0, 0, 54)}"/></clipPath>
      <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f2240"/><stop offset="1" stop-color="#070f1f"/></linearGradient>
      <linearGradient id="refl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".9"/></linearGradient>
    </defs>
    <g class="stars">${stars()}</g>
    ${withSkyline ? `<g class="moon" transform="translate(${rtl ? 270 : 1330} 150)">
      <circle r="120" fill="url(#moonglow)"/>
      <circle r="54" class="moon-dark"/>
      <path d="${moonLitPath(m.phase, 0, 0, 54)}" fill="url(#moonlit)"/>
      <g class="craters" clip-path="url(#litclip)" opacity="${(0.15 + m.illumination * 0.25).toFixed(2)}"><circle cx="-14" cy="-12" r="9"/><circle cx="12" cy="10" r="6"/><circle cx="-4" cy="20" r="4"/><circle cx="20" cy="-18" r="3.5"/></g>
    </g>` : ''}
    ${withSkyline ? skyline() : ''}
  </svg>`;
}

/** Which of eight phase names, for the moon's label. */
export const phaseIndex = (phase: number) => Math.round(phase * 8) % 8;
