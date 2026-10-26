// Home (Afnon's MainActivity, for a desktop window): the clock and dates, the next prayer and its countdown inside
// the mihrab arch, and the day's six times. Redrawn every second.
import { clock, clockLong, duration, gregorian, hijri } from '../lib/format';
import { DHUHR, MAGHRIB, SUNRISE, prayerDay, secondsUntil } from '../lib/prayer';
import { calcOf } from '../lib/settings';
import { updateState } from '../lib/updates';
import { esc, tzMismatch, type Ctx } from './common';

const ARCH = `<svg viewBox="0 0 340 300" aria-hidden="true">
  <path d="M20 296V140C20 70 90 30 170 4c80 26 150 66 150 136v156" fill="#12264A" stroke="#D8B46A" stroke-width="3"/>
  <path d="M44 296V146C44 88 104 54 170 32c66 22 126 56 126 114v150" fill="none" stroke="rgba(216,180,106,0.45)" stroke-width="1.5"/>
</svg>`;

export function home({ s, t, place }: Ctx, now: Date) {
  const day = prayerDay(now, calcOf(s));
  const names = [...t.prayers];
  if (day.friday) names[DHUHR] = t.jumuah;
  const left = secondsUntil(day.nextTime, now);

  const cells = day.times.map((time, i) => {
    const cls = ['cell', i === SUNRISE ? 'sunrise' : '', i === day.nextIndex ? 'next' : i === day.nowIndex ? 'now'
      : time < now && i !== SUNRISE ? 'past' : ''].join(' ');
    return `<div class="${cls}"><div class="n">${esc(names[i])}</div><div class="t">${esc(clock(t, s, place.tz, time))}</div></div>`;
  }).join('');

  const ramadan = day.ramadan
    ? `<div class="ramadan-line">${esc(t.iftar)} ${esc(clock(t, s, place.tz, day.times[MAGHRIB]))} · ${esc(t.suhoor)} ${esc(clock(t, s, place.tz, day.suhoorEnd))}</div>`
    : '';

  const u = updateState();
  const update = u.status === 'available'
    ? `<div class="warn update-banner"><span>${esc(t.u.available(u.version))}</span>
        <button class="btn" data-act="update-install">${esc(t.u.install)}</button></div>`
    : '';

  return `
    ${update}
    ${tzMismatch(place, now) ? `<div class="warn">${esc(t.tzWarning(place.tz))}</div>` : ''}
    <div class="home-top">
      <div class="clock">${esc(clockLong(t, s, place.tz, now))}</div>
      <div class="dates">
        <div class="place">${esc(place.name)}</div>
        <div>${esc(gregorian(t, place.tz, now))}</div>
        <div>${esc(hijri(t, day.hijri))}</div>
      </div>
    </div>
    <div class="arch-wrap">${ARCH}
      <div class="arch-in">
        <div class="label">${esc(t.next)}</div>
        <div class="name">${esc(names[day.nextIndex])}</div>
        <div class="count">${esc(duration(t, left))}</div>
        <div class="at">${esc(clock(t, s, place.tz, day.nextTime))}</div>
      </div>
    </div>
    ${ramadan}
    <div class="row6">${cells}</div>`;
}
