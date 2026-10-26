// What every screen gets: the settings, their language and the place, plus small HTML helpers.
import type { Text } from '../i18n';
import { tzOffsetMinutes } from '../lib/cities';
import type { Place, Settings } from '../lib/settings';

export type Ctx = {
  s: Settings;
  t: Text;
  place: Place;
  /** Saves a change, rebuilds the schedule and redraws. */
  update: (patch: Partial<Settings>) => void;
};

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: string | number) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

/** The PC's zone differs from the city's right now (a laptop that travelled, or a city picked far away). */
export function tzMismatch(place: Place, now: Date) {
  const pc = -now.getTimezoneOffset();
  return pc !== tzOffsetMinutes(place.tz, now);
}

export const ICONS = {
  home: '<path d="M4 20V11l8-6 8 6v9h-5v-6H9v6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  today: '<rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 10h16M9 3v4M15 3v4" stroke="currentColor" stroke-width="1.6"/>',
  adhkar: '<path d="M12 6.5C10 5 7 4.6 4 5v13c3-.4 6 0 8 1.5M12 6.5C14 5 17 4.6 20 5v13c-3-.4-6 0-8 1.5M12 6.5v13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  settings: '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  about: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
  bellOff: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0M4 4l16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
  arch: '<path d="M14 60V30C14 18 22 10 32 4c10 6 18 14 18 26v30" fill="none" stroke="#D8B46A" stroke-width="2.6" stroke-linejoin="round"/><path d="M22 60V33c0-8 4-13 10-17 6 4 10 9 10 17v27" fill="none" stroke="#D8B46A" stroke-opacity=".45" stroke-width="1.4"/>',
};

export const svg = (body: string, box = '0 0 24 24') => `<svg viewBox="${box}" aria-hidden="true">${body}</svg>`;
