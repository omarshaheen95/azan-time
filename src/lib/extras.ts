// Reminders beyond the five prayers (PLAN.md §8, phase 4): adhkar, Al-Kahf on Friday, Duha, the last third of the
// night, Sunnah fasts and suhoor, the iqama, and the user's own. Each is a schedule event like the prayers' reminders,
// so the background engine needs nothing new to show them.
import type { Text } from '../i18n';
import { clock } from './format';
import { DHUHR, FAJR, PRAYERS, SUNRISE, tzOffsetMinutes, ymdIn, type Day } from './prayer';
import type { ScheduleEvent } from './schedule';
import type { Settings } from './settings';

const MIN = 60_000;
const MUHARRAM = 0, RAMADAN = 8, SHAWWAL = 9, DHU_AL_HIJJAH = 11; // 0-based Hijri months

const wholeMinute = (ms: number) => Math.floor(ms / MIN) * MIN;

/**
 * Tomorrow's Sunnah fast, if any, in order of weight. None in Ramadan (all of it is fasted), on Eid al-Fitr, or on
 * Eid al-Adha and the days of Tashreeq (10 to 13 Dhu al-Hijjah), when fasting is forbidden; so no White Days in
 * Dhu al-Hijjah either, whose 13th is a day of Tashreeq.
 */
export function sunnahFast(t: Text, tomorrow: Day): string | null {
  const { day, month } = tomorrow.hijri;
  if (month === RAMADAN) return null;
  if (month === SHAWWAL && day === 1) return null;
  if (month === DHU_AL_HIJJAH && day >= 10 && day <= 13) return null;
  if (month === DHU_AL_HIJJAH && day === 9) return t.x.arafah;
  if (month === MUHARRAM && day === 10) return t.x.ashura;
  if (month === MUHARRAM && day === 9) return t.x.tasua;
  if (day === 13 && month !== DHU_AL_HIJJAH) return t.x.whiteDays;
  if (tomorrow.weekday === 1) return t.x.monday;
  if (tomorrow.weekday === 4) return t.x.thursday;
  return null;
}

/** "HH:MM" on a day's calendar date in the city's clock, as a moment. */
function wallTime(day: Day, hhmm: string, tz: string) {
  const { y, m, d } = ymdIn(tz, day.times[DHUHR]);
  const [h, min] = hhmm.split(':').map(Number);
  const guess = Date.UTC(y, m, d, h, min);
  return guess - tzOffsetMinutes(tz, new Date(guess)) * MIN;
}

export function buildExtras(s: Settings, t: Text, list: Day[], tz: string): ScheduleEvent[] {
  const out: ScheduleEvent[] = [];
  const add = (kind: string, at: number, until: number, title: string, body: string, sound: string | null = null, id = '') =>
    out.push({ key: `${kind}:${id}${at}`, kind, at, until, title, body, sound });

  list.forEach((day, i) => {
    const [fajr, sunrise, dhuhr, asr, maghrib, isha] = day.times.map((d) => d.getTime());
    const next = list[i + 1];

    if (s.morning) add('morning', fajr + s.morningAfter * MIN, sunrise, t.x.morning, t.x.morningBody);
    if (s.evening) add('evening', asr + s.eveningAfter * MIN, maghrib, t.x.evening, t.x.eveningBody);
    // Friday morning, an hour after sunrise; still shown until Maghrib if the PC comes on later.
    if (s.kahf && day.friday) add('kahf', sunrise + 60 * MIN, maghrib, t.x.kahf, t.x.kahfBody);
    if (s.duha) add('duha', sunrise + 20 * MIN, dhuhr - 10 * MIN, t.x.duha, t.x.duhaBody);
    if (s.night && next) {
      // The night runs from Maghrib to the next Fajr; its last third begins two thirds in.
      const nextFajr = next.times[FAJR].getTime();
      add('night', wholeMinute(nextFajr - (nextFajr - maghrib) / 3), nextFajr, t.x.night, t.x.nightBody);
    }
    if (s.fasting) {
      if (day.hijri.month === RAMADAN) {
        add('suhoor', fajr - 30 * MIN, fajr, t.x.suhoor, t.x.suhoorBody(clock(t, s, tz, day.times[FAJR])));
      }
      const fast = next && sunnahFast(t, next);
      // The evening before, half an hour after Isha: time to plan suhoor and make the intention.
      if (fast) add('fast', isha + 30 * MIN, next.times[FAJR].getTime(), fast, t.x.fastBody);
    }
    if (s.iqama) {
      for (const p of PRAYERS) {
        const after = s.iqamaMinutes[p];
        if (p === SUNRISE || !(after > 0)) continue;
        const name = day.friday && p === DHUHR ? t.jumuah : t.prayers[p];
        const at = day.times[p].getTime() + after * MIN;
        add('iqama', at, at + 5 * MIN, t.x.iqama(name), t.x.iqamaBody, s.iqamaSound ? 'res:adhan/iqamah.mp3' : null, `${p}:`);
      }
    }
    for (const r of s.ownReminders) {
      if (!r.days.includes(day.weekday) || !/^\d{1,2}:\d{2}$/.test(r.time)) continue;
      const at = wallTime(day, r.time, tz);
      add('own', at, at + 30 * MIN, r.title, clock(t, s, tz, new Date(at)), null, `${r.id}:`);
    }
  });
  return out;
}
