// The app's settings: one JSON file in AppData, read and written through the Rust side (load_settings /
// save_settings) so the background engine and the window share them. Defaults follow Afnon's Prefs.java.
import { cityById, guessCity, type City } from './cities';
import type { CalcInput, HighLat } from './prayer';

export type Lang = 'ar' | 'en' | 'es' | 'pt';

export type Settings = {
  lang: Lang;
  digits: 'auto' | 'eastern' | 'western';
  clock: 'system' | '12' | '24';

  /** A city id, or "custom" for `custom`. */
  city: string;
  custom: { name: string; lat: number; lng: number; tz: string };
  method: string;
  hanafi: boolean;
  highLat: HighLat;
  fajrAngle: number;
  ishaAngle: number;
  adjust: number[];
  hijriOffset: number;

  /** Minutes before each prayer for the reminder; 0 is off. */
  remind: number;
  remindVoice: boolean;
  /** «حان الآن موعد صلاة …» when a prayer's adhan is off. */
  announce: boolean;
  adhan: boolean;
  /** Each prayer's own adhan bell, in PRAYERS order; Sunrise has none. */
  bells: boolean[];
  voice: string;
  voiceFajr: string;
  volume: number;

  // Reminders beyond the five prayers (PLAN.md §8, phase 4).
  /** Morning adhkar, this many minutes after Fajr; evening adhkar after Asr. */
  morning: boolean;
  morningAfter: number;
  evening: boolean;
  eveningAfter: number;
  /** Surat Al-Kahf on Friday morning. */
  kahf: boolean;
  /** Duha time, 20 minutes after sunrise. */
  duha: boolean;
  /** The last third of the night begins. */
  night: boolean;
  /** Sunnah fasts the evening before (Monday, Thursday, the White Days, Arafah, Tasu'a and Ashura) and suhoor in Ramadan. */
  fasting: boolean;
  /** The iqama, minutes after each adhan (PRAYERS order; 0 is none), with the iqama recording or a plain toast. */
  iqama: boolean;
  iqamaMinutes: number[];
  iqamaSound: boolean;
  /** The user's own daily reminders: a time in the city's clock and the weekdays it repeats on (0 Sunday). */
  ownReminders: CustomReminder[];

  /** Translations under the adhkar (Home and Adhkar). */
  showTranslation: boolean;
  autostart: boolean;
  /** Look for a new version once a day (lib/updates.ts). */
  autoUpdate: boolean;
  /** In a presentation or a full-screen app: notification only, no sound. */
  quietInPresentation: boolean;
};

export type CustomReminder = { id: string; title: string; time: string; days: number[] };

export const DEFAULT_ADJUST = [0, 0, 0, 0, 0, 0];
export const DEFAULT_IQAMA = [20, 0, 15, 15, 5, 15];

export function defaults(): Settings {
  const city = guessCity();
  const lang = navigator.language;
  return {
    lang: lang.startsWith('ar') ? 'ar' : lang.startsWith('pt') ? 'pt' : lang.startsWith('es') ? 'es' : 'en',
    digits: 'auto',
    clock: 'system',
    city: city.id,
    custom: { name: '', lat: 0, lng: 0, tz: Intl.DateTimeFormat().resolvedOptions().timeZone },
    method: city.method,
    hanafi: city.hanafi,
    highLat: 'auto',
    fajrAngle: 18,
    ishaAngle: 17,
    adjust: [...DEFAULT_ADJUST],
    hijriOffset: 0,
    remind: 15,
    remindVoice: true,
    announce: true,
    adhan: true,
    bells: [true, false, true, true, true, true],
    voice: 'beautiful',
    voiceFajr: 'beautiful',
    volume: 80,
    morning: true,
    morningAfter: 20,
    evening: true,
    eveningAfter: 20,
    kahf: true,
    duha: false,
    night: false,
    fasting: true,
    iqama: false,
    iqamaMinutes: [...DEFAULT_IQAMA],
    iqamaSound: true,
    ownReminders: [],
    showTranslation: true,
    autostart: true,
    autoUpdate: true,
    quietInPresentation: false,
  };
}

/** Saved settings over the defaults, so a newer version's new keys get their default. */
export function merge(saved: Partial<Settings> | null): Settings {
  const s = { ...defaults(), ...(saved ?? {}) };
  if (!Array.isArray(s.adjust) || s.adjust.length !== 6) s.adjust = [...DEFAULT_ADJUST];
  if (!Array.isArray(s.bells) || s.bells.length !== 6) s.bells = defaults().bells;
  if (!Array.isArray(s.iqamaMinutes) || s.iqamaMinutes.length !== 6) s.iqamaMinutes = [...DEFAULT_IQAMA];
  if (!Array.isArray(s.ownReminders)) s.ownReminders = [];
  if (s.city !== 'custom' && !cityById(s.city)) s.city = guessCity().id;
  return s;
}

/**
 * Afnon's setCity: a new city also takes its usual method and Asr school, and its main mosque's minute adjustments
 * (none for most); all can be changed after.
 */
export function withCity(s: Settings, city: City): Settings {
  return { ...s, city: city.id, method: city.method, hanafi: city.hanafi, adjust: [...(city.adjust ?? DEFAULT_ADJUST)] };
}

/** A city's name in the interface language (the English one when there is no translation). */
export function cityLabel(c: City, lang: Lang) {
  return lang === 'ar' ? c.ar : lang === 'pt' ? c.pt ?? c.en : lang === 'es' ? c.es ?? c.en : c.en;
}

export type Place = { name: string; lat: number; lng: number; tz: string; city?: City };

export function placeOf(s: Settings, lang: Lang): Place {
  if (s.city === 'custom') return { ...s.custom };
  const c = cityById(s.city)!;
  return { name: cityLabel(c, lang), lat: c.lat, lng: c.lng, tz: c.tz, city: c };
}

export function calcOf(s: Settings): CalcInput {
  const p = placeOf(s, 'en');
  return {
    lat: p.lat, lng: p.lng, tz: p.tz, method: s.method, hanafi: s.hanafi, highLat: s.highLat,
    fajrAngle: s.fajrAngle, ishaAngle: s.ishaAngle, adjust: s.adjust, hijriOffset: s.hijriOffset,
  };
}
