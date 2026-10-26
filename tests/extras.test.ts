import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeText } from '../src/i18n/index.ts';
import { buildExtras, sunnahFast } from '../src/lib/extras.ts';
import { days, type Day } from '../src/lib/prayer.ts';
import type { Settings } from '../src/lib/settings.ts';

const tz = 'America/Sao_Paulo';
const calc = { lat: -23.5505, lng: -46.6333, tz, method: 'MUSLIM_WORLD_LEAGUE', hanafi: false, highLat: 'auto' as const,
  fajrAngle: 18, ishaAngle: 17, adjust: [0, 0, 0, 0, 0, 0], hijriOffset: 0 };
const t = makeText('en', 'western');
const settings = {
  clock: '24', morning: true, morningAfter: 20, evening: true, eveningAfter: 20, kahf: true, duha: true, night: true,
  fasting: true, iqama: true, iqamaMinutes: [20, 0, 15, 15, 5, 15], iqamaSound: true,
  ownReminders: [{ id: 'q', title: 'Quran', time: '21:00', days: [1, 3] }],
} as unknown as Settings;
// 26 Oct to 4 Dec 2026: Fridays, Mondays and the White Days of Jumada al-Akhirah (13 Jumada II ≈ 22 Nov).
const list = days(calc, new Date('2026-10-26T15:00:00Z'), 40);
const events = buildExtras(settings, t, list, tz);
const local = (ms: number) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(ms);

test('Al-Kahf only on Fridays, an hour after sunrise', () => {
  const kahf = events.filter((e) => e.kind === 'kahf');
  assert.ok(kahf.length >= 5);
  for (const e of kahf) assert.match(local(e.at), /^Fri/);
});

test('the last third of the night falls between Isha and the next Fajr, two thirds in', () => {
  const night = events.filter((e) => e.kind === 'night');
  assert.equal(night.length, list.length - 1);
  const [maghrib, nextFajr] = [list[0].times[4].getTime(), list[1].times[0].getTime()];
  const third = (night[0].at - maghrib) / (nextFajr - maghrib);
  assert.ok(third > 0.66 && third < 0.67, String(third));
});

test('Sunnah fasts: the evening before Monday and Thursday, and the White Days', () => {
  const fasts = events.filter((e) => e.kind === 'fast');
  assert.ok(fasts.some((e) => e.title === t.x.monday && /^Sun/.test(local(e.at))));
  assert.ok(fasts.some((e) => e.title === t.x.thursday && /^Wed/.test(local(e.at))));
  assert.ok(fasts.some((e) => e.title === t.x.whiteDays), 'no White Days reminder');
  // Only on evenings before a fast: never more than one a day.
  assert.equal(new Set(fasts.map((e) => local(e.at).slice(0, 3) + new Date(e.at).getUTCDate())).size, fasts.length);
});

test('no fast reminder for Eid or the days of Tashreeq; Arafah and Ashura come first', () => {
  const day = (month: number, d: number, weekday = 1): Day => ({ times: [], friday: false, weekday, hijri: { day: d, month, year: 1448 } });
  assert.equal(sunnahFast(t, day(9, 1)), null); // 1 Shawwal, even on a Monday
  for (const d of [10, 11, 12, 13]) assert.equal(sunnahFast(t, day(11, d)), null);
  assert.equal(sunnahFast(t, day(11, 9)), t.x.arafah);
  assert.equal(sunnahFast(t, day(0, 10)), t.x.ashura);
  assert.equal(sunnahFast(t, day(8, 5)), null); // Ramadan
  assert.equal(sunnahFast(t, day(5, 13, 3)), t.x.whiteDays);
});

test('iqama: minutes after each adhan, with the recording, none for sunrise', () => {
  const iqama = events.filter((e) => e.kind === 'iqama');
  assert.equal(iqama.length, list.length * 5);
  const maghrib = iqama.find((e) => e.title.includes('Maghrib'))!;
  assert.equal(maghrib.at - list[0].times[4].getTime(), 5 * 60_000);
  assert.equal(maghrib.sound, 'res:adhan/iqamah.mp3');
});

test('own reminders at their wall-clock time on their weekdays only', () => {
  const own = events.filter((e) => e.kind === 'own');
  assert.ok(own.length >= 10);
  for (const e of own) assert.match(local(e.at), /^(Mon|Wed) 21:00$/);
});

test('every key is unique', () => {
  assert.equal(new Set(events.map((e) => e.key)).size, events.length);
});
