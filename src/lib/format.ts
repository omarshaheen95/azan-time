// Times, dates and durations in the user's language, digits and clock, always in the city's own time zone.
import type { Text } from '../i18n';
import type { Settings } from './settings';

function locale(t: Text) {
  return `${t.locale}-u-nu-${t.eastern ? 'arab' : 'latn'}`;
}

/** "3:14 PM" / "٣:١٤ م" / "15:14". */
export function clock(t: Text, s: Settings, tz: string, at: Date) {
  const hour12 = s.clock === 'system' ? undefined : s.clock === '12';
  return new Intl.DateTimeFormat(locale(t), { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12 }).format(at);
}

/** Clock with seconds, for Home. */
export function clockLong(t: Text, s: Settings, tz: string, at: Date) {
  const hour12 = s.clock === 'system' ? undefined : s.clock === '12';
  return new Intl.DateTimeFormat(locale(t), { timeZone: tz, hour: 'numeric', minute: '2-digit', second: '2-digit', hour12 }).format(at);
}

export function gregorian(t: Text, tz: string, at: Date) {
  return new Intl.DateTimeFormat(locale(t), { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .format(at);
}

export function hijri(t: Text, h: { day: number; month: number; year: number }) {
  return t.d(`${h.day} ${t.hijriMonths[h.month]} ${h.year} ${t.ah}`);
}

const p2 = (n: number) => String(n).padStart(2, '0');

/** mm:ss under an hour, h:mm:ss above it (Afnon's Screen.duration). */
export function duration(t: Text, seconds: number) {
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  return t.d(h === 0 ? `${p2(m)}:${p2(s)}` : `${h}:${p2(m)}:${p2(s)}`);
}

/** "1 hour 20 minutes" style, for the reminder's "in …": whole minutes only. */
export function inMinutes(t: Text, minutes: number) {
  if (minutes < 60) return t.d(t.minutes(minutes));
  return t.d(`${Math.floor(minutes / 60)}:${p2(minutes % 60)}`);
}
