// The day's six times on a gold wave that rises to the next prayer, with a "now" mark placed by the real share of
// time between the prayers around it. Cards follow the reading direction; the wave, being an SVG, is mirrored by hand.

const ICONS = [
  // Fajr: crescent before dawn
  '<path d="M15.5 4.5a8 8 0 1 0 4 12.8A6.5 6.5 0 1 1 15.5 4.5z"/>',
  // Sunrise: half sun on the horizon
  '<path d="M3 17h18M7 17a5 5 0 0 1 10 0M12 7v2.5M5.6 10.6l1.6 1.6M18.4 10.6l-1.6 1.6M8 20h8"/>',
  // Dhuhr: the full sun
  '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/>',
  // Asr: the sun lower, shorter rays
  '<circle cx="12" cy="13" r="3.6"/><path d="M12 6.5v1.6M6.3 9l1.2 1.2M17.7 9l-1.2 1.2M4.5 15.5h2M17.5 15.5h2M4 19h16"/>',
  // Maghrib: the sun going down
  '<path d="M3 15h18M7.5 15a4.5 4.5 0 0 1 9 0M6 18.5h12M9 21.5h6"/>',
  // Isha: crescent and a star
  '<path d="M14 5a7 7 0 1 0 5 11.5A6 6 0 1 1 14 5z"/><path d="M19 3.5l.6 1.4 1.4.6-1.4.6-.6 1.4-.6-1.4-1.4-.6 1.4-.6z"/>',
];

export type TimelineData = {
  names: string[];
  times: string[];
  /** Index of the next prayer, of the current one (-1 for none), and which are past. */
  next: number;
  current: number;
  past: boolean[];
  /** Where now falls: the interval's start index (5 before Fajr = yesterday's Isha) and progress in it. */
  fromIndex: number;
  progress: number;
  beforeFajr: boolean;
  rtl: boolean;
  nowLabel: string;
  /** Per card: "in 2:31" or "1:05 ago", for its hover text. */
  hints: string[];
};

const W = 1200;
const cx = (i: number) => ((i + 0.5) / 6) * W;

/** A smooth curve through the points (Catmull-Rom, as cubic Béziers). */
function smooth(pts: [number, number][]) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

export function timeline(d: TimelineData) {
  const vis = (i: number) => (d.rtl ? 5 - i : i); // visual slot of prayer i
  const yOf = (i: number) => (i === d.next ? 22 : 52 + (Math.abs(i - d.next) === 1 ? -8 : 0));
  const pts: [number, number][] = [[0, 62]];
  for (let slot = 0; slot < 6; slot++) {
    const i = d.rtl ? 5 - slot : slot;
    pts.push([cx(slot), yOf(i)]);
  }
  pts.push([W, 62]);

  // Now: between the centres of the interval's ends (before Fajr, from the edge to Fajr; after Isha, Isha to the edge).
  let nowX: number;
  if (d.beforeFajr) nowX = cx(vis(0)) + (d.rtl ? 1 : -1) * (1 - d.progress) * (W / 12);
  else if (d.fromIndex === 5) nowX = cx(vis(5)) + (d.rtl ? -1 : 1) * d.progress * (W / 12);
  else nowX = cx(vis(d.fromIndex)) + (cx(vis(d.fromIndex + 1)) - cx(vis(d.fromIndex))) * d.progress;
  const nowPct = (nowX / W) * 100;
  // On the wave: the curve's height at that x, by linear interpolation between the points (close enough at this size).
  const nowY = (x: number) => {
    for (let k = 0; k < pts.length - 1; k++) {
      const [x0, y0] = pts[k], [x1, y1] = pts[k + 1];
      if (x >= x0 && x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
    }
    return 62;
  };

  // Nodes are HTML over the wave: the SVG stretches sideways (its height is fixed at 90px, so y is in pixels).
  const nodes = [0, 1, 2, 3, 4, 5].map((i) =>
    `<span class="node${i === d.next ? ' next' : ''}${d.past[i] ? ' past' : ''}" style="left:${((cx(vis(i)) / W) * 100).toFixed(2)}%;top:${yOf(i)}px"></span>`).join('');

  const cards = d.names.map((name, i) => {
    const cls = ['tl-card', i === d.next ? 'next' : '', i === d.current ? 'current' : '', d.past[i] && i !== d.current ? 'past' : '',
      i === 1 ? 'marker' : ''].filter(Boolean).join(' ');
    return `<button class="${cls}" data-go="today" title="${d.hints[i]}">
      <svg class="tl-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[i]}</svg>
      <span class="tl-name">${name}</span><span class="tl-time">${d.times[i]}</span>
    </button>`;
  }).join('');

  return `<section class="timeline">
    <svg class="tl-wave" viewBox="0 0 ${W} 90" preserveAspectRatio="none" aria-hidden="true">
      <path class="wave-glow" d="${smooth(pts)}"/><path class="wave" d="${smooth(pts)}"/>
    </svg>
    ${nodes}
    <div class="tl-now" style="left:${nowPct.toFixed(2)}%;top:${nowY(nowX).toFixed(1)}px" title="${d.nowLabel}"><span></span></div>
    <div class="tl-cards">${cards}</div>
  </section>`;
}
