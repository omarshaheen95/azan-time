// The real sky behind Home's decoration: how far the day has moved from one prayer to the next (the dial's arc), and
// the moon's phase tonight. Nothing on the dial is decorative-only progress.
import { FAJR, ISHA, SUNRISE, timesOnDate, ymdIn, type CalcInput } from './prayer';

/**
 * The interval the moment is in, from the last prayer time (Sunrise counts as a marker) to the next, and how far
 * along it is (0 to 1). Before Fajr the interval starts at yesterday's Isha; after Isha it ends at tomorrow's Fajr.
 */
export function prayerInterval(now: Date, c: CalcInput) {
  const { y, m, d } = ymdIn(c.tz, now);
  const today = timesOnDate(c, y, m, d);
  const t = now.getTime();
  let from: Date, to: Date, fromIndex: number, toIndex: number;
  const beforeFajr = t < today[FAJR].getTime();
  if (beforeFajr) {
    from = timesOnDate(c, y, m, d - 1)[ISHA]; fromIndex = ISHA;
    to = today[FAJR]; toIndex = FAJR;
  } else if (t >= today[ISHA].getTime()) {
    from = today[ISHA]; fromIndex = ISHA;
    to = timesOnDate(c, y, m, d + 1)[FAJR]; toIndex = FAJR;
  } else {
    let i = FAJR;
    while (i < ISHA && today[i + 1].getTime() <= t) i++;
    from = today[i]; fromIndex = i;
    to = today[i + 1]; toIndex = i + 1;
  }
  const span = to.getTime() - from.getTime();
  const progress = span > 0 ? Math.min(1, Math.max(0, (t - from.getTime()) / span)) : 0;
  return { from, to, fromIndex, toIndex, progress, beforeFajr, afterSunrise: fromIndex === SUNRISE };
}

const SYNODIC = 29.530588853; // days
/** A new moon (6 Jan 2000 18:14 UTC), the epoch of the mean lunation. */
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);

/**
 * The moon's age as a fraction of the lunation (0 new, 0.5 full) and its lit fraction, from the mean synodic month.
 * Within about a day of the true phase: enough to draw tonight's moon, not to sight the crescent.
 */
export function moonPhase(at: Date) {
  const age = ((((at.getTime() - NEW_MOON) / 86_400_000) % SYNODIC) + SYNODIC) % SYNODIC;
  const phase = age / SYNODIC;
  return { phase, age, illumination: (1 - Math.cos(2 * Math.PI * phase)) / 2, waxing: phase < 0.5 };
}

/**
 * The lit part of a moon of radius r centred at (cx, cy), as an SVG path: the bright limb (a half circle) closed by
 * the terminator (a half ellipse). Waxing lights the right side (as seen from the north), waning the left.
 */
export function moonLitPath(phase: number, cx: number, cy: number, r: number) {
  const lit = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const waxing = phase < 0.5;
  const rx = Math.abs(1 - 2 * lit) * r; // the terminator's half-width
  const top = `${cx} ${cy - r}`, bottom = `${cx} ${cy + r}`;
  // Limb: the lit side's half circle, top to bottom.
  const limbSweep = waxing ? 1 : 0;
  // Terminator back up: bulging toward the lit side when gibbous, away from it when crescent.
  const gibbous = lit > 0.5;
  const termSweep = waxing === gibbous ? 1 : 0;
  return `M ${top} A ${r} ${r} 0 0 ${limbSweep} ${bottom} A ${rx} ${r} 0 0 ${termSweep} ${top} Z`;
}
