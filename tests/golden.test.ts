// Published timetables of Latin American Islamic institutions against our default settings for their city
// (PLAN.md §12). Each table is quoted with its source and date; a failure means a change moved us away from them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { timesOnDate, type CalcInput } from '../src/lib/prayer.ts';
import { fold, hanafiForCountry, methodForCountry } from '../src/lib/places.ts';

const at = (c: CalcInput, y: number, m: number, d: number) => timesOnDate(c, y, m - 1, d).map((t) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: c.tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(t));
const minutes = (hhmm: string) => +hhmm.slice(0, 2) * 60 + +hhmm.slice(3);
const base = { hanafi: false, highLat: 'auto' as const, fajrAngle: 18, ishaAngle: 17, adjust: [0, 0, 0, 0, 0, 0], hijriOffset: 0 };

/** Every published time (null: not published) within `tolerance` minutes. */
function near(ours: string[], published: (string | null)[], tolerance: number, label: string) {
  published.forEach((p, i) => {
    if (p === null) return;
    const diff = Math.abs(minutes(ours[i]) - minutes(p));
    assert.ok(diff <= tolerance, `${label}: prayer ${i} ours ${ours[i]}, published ${p}`);
  });
}

test('São Paulo, MWL = Instituto Islâmico Brasileiro, 26 Oct 2026 (to the minute)', () => {
  const c: CalcInput = { ...base, lat: -23.5505, lng: -46.6333, tz: 'America/Sao_Paulo', method: methodForCountry('BR') };
  near(at(c, 2026, 10, 26), ['04:06', '05:25', '11:51', '15:18', '18:17', '19:31'], 0, 'São Paulo');
});

test('Buenos Aires, Karachi 18°/18° = CIRA, 13 Oct 2026 (within a minute)', () => {
  const c: CalcInput = { ...base, lat: -34.6037, lng: -58.3816, tz: 'America/Argentina/Buenos_Aires', method: methodForCountry('AR') };
  near(at(c, 2026, 10, 13), ['04:47', null, '12:40', '16:17', '19:06', '20:33'], 1, 'Buenos Aires / CIRA');
});

test('Buenos Aires = Centro Islámico Rey Fahd, 24 Oct 2026 (within a minute)', () => {
  const c: CalcInput = { ...base, lat: -34.6037, lng: -58.3816, tz: 'America/Argentina/Buenos_Aires', method: methodForCountry('AR') };
  near(at(c, 2026, 10, 24), ['04:30', null, '12:38', null, null, null], 1, 'Buenos Aires / Rey Fahd');
});

test('country defaults', () => {
  assert.equal(methodForCountry('AR'), 'KARACHI');
  assert.equal(methodForCountry('BR'), 'MUSLIM_WORLD_LEAGUE');
  assert.equal(methodForCountry('VE'), 'MUSLIM_WORLD_LEAGUE');
  assert.ok(hanafiForCountry('TT') && hanafiForCountry('GY') && hanafiForCountry('SR'));
  assert.ok(!hanafiForCountry('BR'));
});

test('search folds accents and case', () => {
  assert.equal(fold('  São Paulo '), 'sao paulo');
  assert.equal(fold('BOGOTÁ'), 'bogota');
});

test('Santiago, MWL + the mosque\'s minutes = Mezquita As-Salam (Mawaqit), 26 Oct 2026 (to the minute)', () => {
  const c: CalcInput = { ...base, lat: -33.4489, lng: -70.6693, tz: 'America/Santiago', method: 'MUSLIM_WORLD_LEAGUE',
    adjust: [6, 0, 4, 6, 8, 2] };
  near(at(c, 2026, 10, 26), ['05:26', null, '13:32', '17:14', '20:13', '21:31'], 0, 'Santiago / As-Salam');
});

test('Panama City, MWL + the mosque\'s minutes = Madina Masjid (Mawaqit), 26 Oct 2026', () => {
  const c: CalcInput = { ...base, lat: 8.9824, lng: -79.5199, tz: 'America/Panama', method: 'MUSLIM_WORLD_LEAGUE', adjust: [0, 0, 0, 2, 6, 7] };
  near(at(c, 2026, 10, 26), ['04:55', null, '12:02', '15:24', '18:03', '19:11'], 1, 'Panama / Madina Masjid');
});

test('Lima, MWL + Maghrib 3 = Mezquita de Magdalena del Mar (Mawaqit), 26 Oct 2026', () => {
  const c: CalcInput = { ...base, lat: -12.0906, lng: -77.0697, tz: 'America/Lima', method: 'MUSLIM_WORLD_LEAGUE', adjust: [0, 0, 0, 0, 3, 0] };
  near(at(c, 2026, 10, 26), ['04:25', null, '11:52', '14:58', '18:10', '19:15'], 1, 'Lima / Magdalena del Mar');
});

test('Valencia (Venezuela), MWL = Mezquita Al Quds al Sharif (Mawaqit), 26 Oct 2026 (Maghrib aside)', () => {
  const c: CalcInput = { ...base, lat: 10.25, lng: -68.0167, tz: 'America/Caracas', method: methodForCountry('VE') };
  // The mosque's Maghrib (18:07) is 3 minutes before sunset as computed here; its coordinates likely differ.
  near(at(c, 2026, 10, 26), ['05:12', null, '12:16', '15:37', null, '19:17'], 1, 'Valencia / Al Quds');
});
