// Home: the clock and dates, the celestial dial with the next prayer, the day's timeline and the adhkar band, over
// the night sky (ui/sky.ts, drawn by main.ts behind the screen). Redrawn every second in place; all of it comes from
// the prayer calculation (lib/prayer.ts, lib/sky.ts), nothing is fixed.
import { clock, clockParts, duration, gregorian, hijri, inMinutes } from '../lib/format';
import { DHUHR, SUNRISE, prayerDay, secondsUntil } from '../lib/prayer';
import { calcOf } from '../lib/settings';
import { moonPhase, prayerInterval } from '../lib/sky';
import { updateState } from '../lib/updates';
import { adhkarCard } from '../ui/adhkarCard';
import { dial } from '../ui/dial';
import { phaseIndex } from '../ui/sky';
import { timeline } from '../ui/timeline';
import { esc, tzMismatch, type Ctx } from './common';

const PIN = '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>';
const CHEVRON = '<path d="M7 10l5 5 5-5"/>';

export function home({ s, t, place }: Ctx, now: Date, dhikr: number) {
  const calc = calcOf(s);
  const day = prayerDay(now, calc);
  const interval = prayerInterval(now, calc);
  const names = [...t.prayers];
  if (day.friday) names[DHUHR] = t.jumuah;
  const left = secondsUntil(day.nextTime, now);
  const moon = moonPhase(now);
  const c = clockParts(t, s, place.tz, now);

  const u = updateState();
  const notices = [
    u.status === 'available'
      ? `<div class="notice update-banner"><span>${esc(t.u.available(u.version))}</span>
          <button class="btn" data-act="update-install">${esc(t.u.install)}</button></div>` : '',
    tzMismatch(place, now) ? `<div class="notice">${esc(t.tzWarning(place.tz))}</div>` : '',
  ].join('');

  const hints = day.times.map((time) => {
    const mins = Math.round(Math.abs(time.getTime() - now.getTime()) / 60_000);
    return time > now ? t.h.inTime(inMinutes(t, mins)) : t.h.ago(inMinutes(t, mins));
  });

  const dialHtml = dial({
    label: esc(t.next), name: esc(names[day.nextIndex]), countdown: esc(duration(t, left)), until: esc(t.h.until),
    time: esc(clock(t, s, place.tz, day.nextTime)), progress: interval.progress, moon: moon.phase,
    aria: esc(`${t.next}: ${names[day.nextIndex]} ${clock(t, s, place.tz, day.nextTime)}`),
  });

  const timelineHtml = timeline({
    names: names.map((n) => esc(n)),
    times: day.times.map((time) => esc(clock(t, s, place.tz, time))),
    next: day.nextIndex, current: day.nowIndex,
    past: day.times.map((time, i) => time <= now && i !== day.nextIndex),
    fromIndex: interval.fromIndex, progress: interval.progress,
    beforeFajr: interval.beforeFajr,
    rtl: t.dir === 'rtl', nowLabel: esc(t.h.now), hints: hints.map((h) => esc(h)),
  });

  return `${notices}
    <div class="hero">
      <div class="hero-info">
        <button class="place" data-go="settings" title="${esc(t.h.changePlace)}">
          <svg viewBox="0 0 24 24" aria-hidden="true">${PIN}</svg><span>${esc(place.name)}</span>
          <svg class="chev" viewBox="0 0 24 24" aria-hidden="true">${CHEVRON}</svg>
        </button>
        <div class="big-clock"><span class="digits">${esc(c.main)}</span>${c.period ? `<span class="period">${esc(c.period)}</span>` : ''}</div>
        <div class="greg">${esc(gregorian(t, place.tz, now))}</div>
        <div class="rule" aria-hidden="true"></div>
        <div class="hijri">${esc(hijri(t, day.hijri))}</div>
        ${day.ramadan ? `<div class="ramadan">${esc(t.iftar)} ${esc(clock(t, s, place.tz, day.times[4]))} · ${esc(t.suhoor)} ${esc(clock(t, s, place.tz, day.suhoorEnd))}</div>` : ''}
      </div>
      ${dialHtml}
      <div class="hero-side">
        <div class="tagline">${t.h.tagline.map((l) => `<span>${esc(l)}</span>`).join('')}</div>
        <div class="tag-orn" aria-hidden="true"><i></i><b></b><i></i></div>
        <div class="moon-label">${esc(t.h.phases[phaseIndex(moon.phase)])} · ${esc(t.h.lit(t.d(Math.round(moon.illumination * 100))))}</div>
      </div>
    </div>
    ${timelineHtml}
    ${adhkarCard(t, dhikr, s.showTranslation)}`;
}

/** Sunrise has no adhan: it is a marker on the timeline, like in Afnon. */
export const isMarker = (i: number) => i === SUNRISE;
