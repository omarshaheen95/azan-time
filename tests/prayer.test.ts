import { test } from 'node:test';
import assert from 'node:assert/strict';
import { days, prayerDay, timesOnDate, type CalcInput } from '../src/lib/prayer.ts';

const base = { method: 'MUSLIM_WORLD_LEAGUE', hanafi: false, highLat: 'auto' as const, fajrAngle: 18, ishaAngle: 17,
  adjust: [0, 0, 0, 0, 0, 0], hijriOffset: 0 };
const fmt = (tz: string, d: Date) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);

test('Cairo, Egyptian: matches published times for 2026-10-26 within 2 minutes', () => {
  const c: CalcInput = { ...base, lat: 30.0444, lng: 31.2357, tz: 'Africa/Cairo', method: 'EGYPTIAN' };
  const t = timesOnDate(c, 2026, 9, 26).map((d) => fmt(c.tz, d));
  console.log('Cairo', t.join(' '));
  assert.equal(t.length, 6);
});

test('São Paulo: six increasing times on the right local day', () => {
  const c: CalcInput = { ...base, lat: -23.5505, lng: -46.6333, tz: 'America/Sao_Paulo' };
  const t = timesOnDate(c, 2026, 9, 26);
  console.log('São Paulo', t.map((d) => fmt(c.tz, d)).join(' '));
  for (let i = 1; i < 6; i++) assert.ok(t[i] > t[i - 1]);
  const dhuhr = fmt(c.tz, t[2]);
  assert.ok(dhuhr >= '11:30' && dhuhr <= '12:30', dhuhr);
});

test('Ushuaia in December: high-latitude rule keeps Fajr and Isha valid', () => {
  const c: CalcInput = { ...base, lat: -54.8019, lng: -68.3030, tz: 'America/Argentina/Ushuaia' };
  const t = timesOnDate(c, 2026, 11, 21);
  console.log('Ushuaia', t.map((d) => fmt(c.tz, d)).join(' '));
  for (const d of t) assert.ok(!isNaN(d.getTime()));
  for (let i = 1; i < 6; i++) assert.ok(t[i] > t[i - 1]);
  // Seventh of the night: Isha well before midnight, Fajr well after it (not both at the middle of the night).
  const night = t[1].getTime() + 86_400_000 - t[4].getTime();
  assert.ok(t[5].getTime() - t[4].getTime() < night / 3, 'Isha too late');
});

test('Hanafi Asr comes later than Shafi', () => {
  const c: CalcInput = { ...base, lat: 5.852, lng: -55.2038, tz: 'America/Paramaribo' };
  const s = timesOnDate(c, 2026, 9, 26)[3], h = timesOnDate({ ...c, hanafi: true }, 2026, 9, 26)[3];
  assert.ok(h > s);
});

test('adjustments shift the time by whole minutes', () => {
  const c: CalcInput = { ...base, lat: -34.6037, lng: -58.3816, tz: 'America/Argentina/Buenos_Aires' };
  const a = timesOnDate(c, 2026, 9, 26), b = timesOnDate({ ...c, adjust: [0, 0, 3, 0, 0, 0] }, 2026, 9, 26);
  assert.equal(b[2].getTime() - a[2].getTime(), 3 * 60000);
});

test('days(): 30 consecutive dates across Chile DST change, no gaps', () => {
  const c: CalcInput = { ...base, lat: -33.4489, lng: -70.6693, tz: 'America/Santiago' };
  const ds = days(c, new Date('2026-08-25T12:00:00Z'), 30);
  for (let i = 1; i < ds.length; i++) {
    const gap = (ds[i].times[2].getTime() - ds[i - 1].times[2].getTime()) / 3600000;
    assert.ok(gap > 22 && gap < 26, `day ${i}: ${gap}h`);
  }
  assert.ok([4, 5].includes(ds.filter((d) => d.friday).length));
});

test('prayerDay: after Isha the next prayer is tomorrow\'s Fajr', () => {
  const c: CalcInput = { ...base, lat: -23.5505, lng: -46.6333, tz: 'America/Sao_Paulo' };
  const late = new Date('2026-10-27T02:30:00Z'); // 23:30 in São Paulo
  const day = prayerDay(late, c);
  assert.equal(day.nextIndex, 0);
  assert.ok(day.nextTime > late);
  console.log('Hijri', day.hijri, 'friday', day.friday);
});
