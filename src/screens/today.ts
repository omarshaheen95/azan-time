// Today's prayers (Afnon's PrayerDayActivity): each time with its countdown and its adhan bell, and the Qibla.
import { buildExtras } from '../lib/extras';
import { clock, duration } from '../lib/format';
import { DHUHR, SUNRISE, days, prayerDay, secondsUntil, ymdIn } from '../lib/prayer';
import { calcOf } from '../lib/settings';
import { ICONS, esc, svg, type Ctx } from './common';

function compass(bearing: number, t: Ctx['t']) {
  const ticks = ['N', 'E', 'S', 'W'].map((_, i) => {
    const a = (i * 90 - 90) * Math.PI / 180;
    return `<line x1="${110 + Math.cos(a) * 92}" y1="${110 + Math.sin(a) * 92}" x2="${110 + Math.cos(a) * 102}" y2="${110 + Math.sin(a) * 102}" stroke="rgba(239,231,214,0.5)" stroke-width="2"/>`;
  }).join('');
  const north = t.lang === 'ar' ? 'ش' : 'N';
  return `<svg viewBox="0 0 220 220" aria-hidden="true">
    <circle cx="110" cy="110" r="104" fill="none" stroke="rgba(239,231,214,0.25)" stroke-width="1.5"/>
    <circle cx="110" cy="110" r="70" fill="none" stroke="rgba(239,231,214,0.1)" stroke-width="1"/>
    ${ticks}
    <text x="110" y="34" text-anchor="middle" fill="#9FB0CC" font-size="14">${north}</text>
    <g transform="rotate(${bearing} 110 110)">
      <path d="M110 22 L120 110 L110 102 L100 110 Z" fill="#D8B46A"/>
      <rect x="102" y="14" width="16" height="14" rx="2" fill="#0C1B33" stroke="#D8B46A" stroke-width="2"/>
    </g>
    <circle cx="110" cy="110" r="5" fill="#EFE7D6"/>
  </svg>`;
}

export function today(ctx: Ctx, now: Date) {
  const { s, t, place } = ctx;
  const day = prayerDay(now, calcOf(s));
  const names = [...t.prayers];
  if (day.friday) names[DHUHR] = t.jumuah;

  const rows = day.times.map((time, i) => {
    const past = time <= now;
    const on = s.adhan && s.bells[i];
    const bell = `<button class="bell ${on ? '' : 'off'}" data-bell="${i}" ${i === SUNRISE ? 'disabled' : ''}
      title="${esc(on ? t.bellOn : t.bellOff)}" aria-pressed="${on}">${svg(on ? ICONS.bell : ICONS.bellOff)}</button>`;
    const cls = ['prow', i === day.nextIndex ? 'next' : past ? 'past' : ''].join(' ');
    return `<div class="${cls}">
      <div class="n">${esc(names[i])}</div>
      <div class="t">${esc(clock(t, s, place.tz, time))}</div>
      <div class="left">${past ? esc(t.passed) : esc(t.inTime(duration(t, secondsUntil(time, now))))}</div>
      ${bell}
    </div>`;
  }).join('');

  // Today's reminders beyond the prayers (the iqama aside: it follows every adhan), in the order they come.
  const calc = calcOf(s);
  const today = ymdIn(place.tz, now);
  const isToday = (ms: number) => { const d = ymdIn(place.tz, new Date(ms)); return d.d === today.d && d.m === today.m; };
  // Tonight belongs to today too: the list runs on to tomorrow's Fajr (the last third of the night is after midnight).
  const two = days(calc, now, 2);
  const tomorrowFajr = two[1].times[0].getTime();
  const extras = buildExtras(s, t, two, place.tz)
    .filter((e) => e.kind !== 'iqama' && (isToday(e.at) || (e.at > now.getTime() && e.at <= tomorrowFajr)))
    .sort((a, b) => a.at - b.at);
  const extraRows = extras.length
    ? extras.map((e) => `<li class="${e.at <= now.getTime() ? 'past' : ''}"><span>${esc(e.title)}</span>
        <span class="t">${esc(clock(t, s, place.tz, new Date(e.at)))}</span></li>`).join('')
    : `<li class="muted">${esc(t.x.none)}</li>`;

  const deg = Math.round(day.qibla);
  return `
    <h1>${esc(t.nav.today)}</h1>
    <div class="today">
      <div class="plist">${rows}</div>
      <div class="qibla-card">
        <h2>${esc(t.qibla)}</h2>
        ${compass(day.qibla, t)}
        <div class="deg">${esc(t.d(deg))}°</div>
        <div class="muted">${esc(t.qiblaFrom(t.d(deg), t.octants[Math.round(((deg % 360) + 360) % 360 / 45) % 8]))}</div>
        <h2 class="extras-title">${esc(t.x.today)}</h2>
        <ul class="extras">${extraRows}</ul>
      </div>
    </div>`;
}

/**
 * Bell clicks: a prayer's own adhan on or off (Afnon's per-prayer bell). Turning one on also turns the adhan on.
 * Delegated from the screen's root once, since Today redraws in place every second.
 */
export function bindToday(root: HTMLElement, ctx: () => Ctx) {
  root.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-bell]');
    if (!b) return;
    const { s, update } = ctx();
    const i = +b.dataset.bell!;
    const bells = [...s.bells];
    const on = !(s.adhan && bells[i]);
    bells[i] = on;
    update(on ? { bells, adhan: true } : { bells });
  });
}
