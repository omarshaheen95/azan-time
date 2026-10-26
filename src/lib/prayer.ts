// Afnon's PrayerDay.java (via its site's prayer.ts), on adhan-js. Additions: the city's own time zone for the day and
// the Hijri date, the high-latitude rule, per-prayer minute adjustments and a custom method (PLAN.md §5).
import {
  CalculationMethod, CalculationParameters, Coordinates, HighLatitudeRule, Madhab, PrayerTimes, Qibla,
} from 'adhan';

export const FAJR = 0, SUNRISE = 1, DHUHR = 2, ASR = 3, MAGHRIB = 4, ISHA = 5;
export const PRAYERS = [FAJR, SUNRISE, DHUHR, ASR, MAGHRIB, ISHA] as const;
const RAMADAN = 8; // 0-based month

export const METHODS: Record<string, () => CalculationParameters> = {
  MUSLIM_WORLD_LEAGUE: CalculationMethod.MuslimWorldLeague,
  EGYPTIAN: CalculationMethod.Egyptian,
  UMM_AL_QURA: CalculationMethod.UmmAlQura,
  KARACHI: CalculationMethod.Karachi,
  NORTH_AMERICA: CalculationMethod.NorthAmerica,
  MOON_SIGHTING_COMMITTEE: CalculationMethod.MoonsightingCommittee,
  DUBAI: CalculationMethod.Dubai,
  KUWAIT: CalculationMethod.Kuwait,
  QATAR: CalculationMethod.Qatar,
  SINGAPORE: CalculationMethod.Singapore,
  TURKEY: CalculationMethod.Turkey,
  TEHRAN: CalculationMethod.Tehran,
  CUSTOM: () => CalculationMethod.Other(),
};

export type HighLat = 'auto' | 'middle' | 'seventh' | 'twilight';

export type CalcInput = {
  lat: number;
  lng: number;
  tz: string;
  method: string;
  hanafi: boolean;
  highLat: HighLat;
  /** CUSTOM only. */
  fajrAngle: number;
  ishaAngle: number;
  /** Minutes added to each of the six times, in PRAYERS order. */
  adjust: number[];
  hijriOffset: number;
};

/** y/m/d of a moment in a time zone. */
export function ymdIn(tz: string, at: Date) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' })
    .formatToParts(at);
  const g = (t: string) => +parts.find((p) => p.type === t)!.value;
  return { y: g('year'), m: g('month') - 1, d: g('day') };
}

/** Minutes east of UTC that a time zone is at the given moment. */
export function tzOffsetMinutes(tz: string, at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(at);
  const g = (t: string) => +parts.find((p) => p.type === t)!.value;
  const asUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'));
  return Math.round((asUtc - Math.floor(at.getTime() / 60000) * 60000) / 60000);
}

/** Day of the week (0 Sunday) of a moment in a time zone. */
function weekdayIn(tz: string, at: Date) {
  const w = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(at);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(w);
}

export function params(c: CalcInput, coordinates: Coordinates): CalculationParameters {
  const p = (METHODS[c.method] ?? METHODS.MUSLIM_WORLD_LEAGUE)();
  if (c.method === 'CUSTOM') {
    p.fajrAngle = c.fajrAngle;
    p.ishaAngle = c.ishaAngle;
  }
  p.madhab = c.hanafi ? Madhab.Hanafi : Madhab.Shafi;
  p.highLatitudeRule = c.highLat === 'middle' ? HighLatitudeRule.MiddleOfTheNight
    : c.highLat === 'seventh' ? HighLatitudeRule.SeventhOfTheNight
    : c.highLat === 'twilight' ? HighLatitudeRule.TwilightAngle
    : recommendedHighLat(coordinates);
  const [fajr, sunrise, dhuhr, asr, maghrib, isha] = c.adjust;
  p.adjustments = { fajr, sunrise, dhuhr, asr, maghrib, isha };
  return p;
}

/**
 * adhan-js's HighLatitudeRule.recommended() tests `latitude > 48`, so the far south (Ushuaia, Punta Arenas) got the
 * middle-of-the-night rule and Isha met Fajr at midnight in December. Same rule, by distance from the equator.
 */
export function recommendedHighLat(coordinates: Coordinates) {
  return Math.abs(coordinates.latitude) > 48 ? HighLatitudeRule.SeventhOfTheNight : HighLatitudeRule.MiddleOfTheNight;
}

const minute = (d: Date) => new Date(Math.floor(d.getTime() / 60000) * 60000);

/**
 * The six times of the city's calendar day containing `day`, each on its whole minute. adhan-js reads the date's
 * local y/m/d, so the city's own date is passed as a local date (the PC may be on another zone); the times it returns
 * are absolute moments.
 */
export function timesOn(c: CalcInput, day: Date): Date[] {
  const { y, m, d } = ymdIn(c.tz, day);
  return timesOnDate(c, y, m, d);
}

/** The six times of a calendar date (0-based month; overflowing days roll over, as in `new Date`). */
export function timesOnDate(c: CalcInput, y: number, m: number, d: number): Date[] {
  const where = new Coordinates(c.lat, c.lng);
  const t = new PrayerTimes(where, new Date(y, m, d), params(c, where));
  return [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha].map(minute);
}

/** Umm al-Qura Hijri date in the city's zone, shifted by the offset: 0-based month. */
export function hijriOf(at: Date, tz: string, offsetDays = 0) {
  const shifted = new Date(at.getTime() + offsetDays * 86_400_000);
  const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
    timeZone: tz, day: 'numeric', month: 'numeric', year: 'numeric',
  }).formatToParts(shifted);
  const g = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? '0', 10);
  return { day: g('day'), month: g('month') - 1, year: g('year') };
}

export type PrayerDay = ReturnType<typeof prayerDay>;

/** One moment's view of the prayer day (Afnon's PrayerDay): the six times, the current prayer and the next. */
export function prayerDay(now: Date, c: CalcInput) {
  const times = timesOn(c, now);
  let latest = -1;
  times.forEach((t, i) => { if (t <= now) latest = i; });
  const nowIndex = latest === SUNRISE ? -1 : latest;
  let next = times.findIndex((t, i) => i !== SUNRISE && t > now);
  const today = ymdIn(c.tz, now);
  const tomorrowFajr = timesOnDate(c, today.y, today.m, today.d + 1)[FAJR];
  // After Isha the Fajr slot holds tomorrow's Fajr: it is the next prayer.
  if (next === -1) { next = FAJR; times[FAJR] = tomorrowFajr; }
  const hijri = hijriOf(now, c.tz, c.hijriOffset);
  return {
    times, nowIndex, nextIndex: next, nextTime: times[next],
    suhoorEnd: times[FAJR] > now ? times[FAJR] : tomorrowFajr,
    friday: weekdayIn(c.tz, now) === 5,
    ramadan: hijri.month === RAMADAN,
    hijri,
    qibla: Qibla(new Coordinates(c.lat, c.lng)) as number, // degrees clockwise from true north
  };
}

export const secondsUntil = (when: Date, now: Date) => Math.max(0, Math.floor((when.getTime() - now.getTime() + 999) / 1000));

/**
 * The city's calendar days from the one containing `from`, each with its six times, weekday and Hijri date, for
 * the background scheduler. Stepped by date, not by 24 hours, so a daylight-saving change never skips a day.
 */
export function days(c: CalcInput, from: Date, count: number): Day[] {
  const { y, m, d } = ymdIn(c.tz, from);
  const out: Day[] = [];
  for (let i = 0; i < count; i++) {
    const times = timesOnDate(c, y, m, d + i);
    const weekday = new Date(y, m, d + i).getDay();
    // Midday stands for the whole civil date in the Hijri calendar too.
    out.push({ times, friday: weekday === 5, weekday, hijri: hijriOf(times[DHUHR], c.tz, c.hijriOffset) });
  }
  return out;
}

export type Day = {
  times: Date[];
  friday: boolean;
  /** 0 Sunday … 6 Saturday. */
  weekday: number;
  hijri: { day: number; month: number; year: number };
};
