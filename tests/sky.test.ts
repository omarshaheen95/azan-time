import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moonPhase, prayerInterval } from '../src/lib/sky.ts';
import { timesOnDate, type CalcInput } from '../src/lib/prayer.ts';

const c: CalcInput = { lat: -25.5097, lng: -54.6111, tz: 'America/Asuncion', method: 'MUSLIM_WORLD_LEAGUE', hanafi: false,
  highLat: 'auto', fajrAngle: 18, ishaAngle: 17, adjust: [0, 0, 0, 0, 0, 0], hijriOffset: 0 };
const day = timesOnDate(c, 2026, 9, 26);

test('between Dhuhr and Asr: from Dhuhr to Asr, progress is the elapsed share', () => {
  const mid = new Date((day[2].getTime() + day[3].getTime()) / 2);
  const i = prayerInterval(mid, c);
  assert.equal(i.fromIndex, 2);
  assert.equal(i.toIndex, 3);
  assert.ok(Math.abs(i.progress - 0.5) < 0.001);
});

test('before Fajr: from yesterday\'s Isha', () => {
  const early = new Date(day[0].getTime() - 3_600_000);
  const i = prayerInterval(early, c);
  assert.equal(i.fromIndex, 5);
  assert.equal(i.toIndex, 0);
  assert.equal(i.to.getTime(), day[0].getTime());
  assert.ok(i.from.getTime() < early.getTime() && i.progress > 0.8);
});

test('after Isha: to tomorrow\'s Fajr', () => {
  const late = new Date(day[5].getTime() + 60_000);
  const i = prayerInterval(late, c);
  assert.equal(i.fromIndex, 5);
  assert.equal(i.toIndex, 0);
  assert.equal(i.to.getTime(), timesOnDate(c, 2026, 9, 27)[0].getTime());
  assert.ok(i.progress < 0.01);
});

test('at a prayer time exactly, a new interval starts at 0', () => {
  const i = prayerInterval(day[3], c);
  assert.equal(i.fromIndex, 3);
  assert.equal(i.progress, 0);
});

test('moon phase: full in mid-month, new at the month\'s turn (within a day)', () => {
  // 26 Oct 2026 is 15 Jumada al-Ula (Umm al-Qura): mid-month, a full moon; two weeks on, the month turns.
  const full = moonPhase(new Date(Date.UTC(2026, 9, 26, 4, 12)));
  assert.ok(Math.abs(full.phase - 0.5) < 1 / 29.5, `full: ${full.phase}`);
  assert.ok(full.illumination > 0.97);
  const nw = moonPhase(new Date(Date.UTC(2026, 10, 9, 7, 2)));
  assert.ok(Math.min(nw.phase, 1 - nw.phase) < 1 / 29.5, `new: ${nw.phase}`);
});
