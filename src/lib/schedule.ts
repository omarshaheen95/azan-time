// The background engine's schedule: every reminder, adhan and spoken announcement for the next 30 days, with their
// words already in the user's language (Afnon's Reminders.java, turned into a list the Rust side checks on its own).
import type { Text } from '../i18n';
import { buildExtras } from './extras';
import { clock, inMinutes } from './format';
import { DHUHR, FAJR, PRAYERS, SUNRISE, days } from './prayer';
import { calcOf, placeOf, type Settings } from './settings';
import { soundOf } from './voices';

/** How long after a prayer time the adhan may still start (Afnon's Reminders.CALL_WINDOW_MS). */
export const CALL_WINDOW_MS = 120_000;
export const DAYS = 30;

const CLIP_NAMES = ['fajr', null, 'dhuhr', 'asr', 'maghrib', 'isha'];

export type ScheduleEvent = {
  /** remind, adhan, announce, or one of the extras (morning, kahf, iqama, own…: extras.ts). */
  key: string; kind: string; at: number; until: number;
  title: string; body: string; sound: string | null;
};

export type Schedule = {
  events: ScheduleEvent[];
  labels: { at: number; text: string }[];
  texts: { open: string; stop: string; dismiss: string; skip: string; pause: string; quit: string };
  volume: number;
  quietInPresentation: boolean;
  horizon: number;
  rtl: boolean;
};

/** A spoken line (tools/announce.py records them); Friday's Dhuhr is Jumu'ah, as in Afnon's Announce. */
function clip(t: Text, kind: 'before' | 'now', prayer: number, friday: boolean) {
  const name = friday && prayer === DHUHR ? 'jumuah' : CLIP_NAMES[prayer];
  return name ? `res:announce/${t.lang}/${kind}_${name}.mp3` : null;
}

export function buildSchedule(s: Settings, t: Text, now: Date): Schedule {
  const place = placeOf(s, t.lang);
  const events: ScheduleEvent[] = [];
  const labels: Schedule['labels'] = [];
  const list = days(calcOf(s), now, DAYS);

  for (const day of list) {
    for (const i of PRAYERS) {
      if (i === SUNRISE) continue;
      const at = day.times[i].getTime();
      const name = day.friday && i === DHUHR ? t.jumuah : t.prayers[i];
      const time = clock(t, s, place.tz, day.times[i]);
      labels.push({ at, text: t.trayNext(name, time) });

      if (s.remind > 0) {
        events.push({
          key: `remind:${i}:${at}`, kind: 'remind', at: at - s.remind * 60_000, until: at,
          title: t.remindTitle(name), body: t.remindBody(name, time, inMinutes(t, s.remind)),
          sound: s.remindVoice ? clip(t, 'before', i, day.friday) : null,
        });
      }
      if (s.adhan && s.bells[i]) {
        events.push({
          key: `adhan:${i}:${at}`, kind: 'adhan', at, until: at + CALL_WINDOW_MS,
          title: t.adhanTitle(name), body: t.adhanBody(time, place.name),
          sound: soundOf(i === FAJR ? s.voiceFajr : s.voice),
        });
      } else if (s.announce) {
        // No adhan for this prayer: just say that its time has begun.
        events.push({
          key: `announce:${i}:${at}`, kind: 'announce', at, until: at + CALL_WINDOW_MS,
          title: t.adhanTitle(name), body: t.adhanBody(time, place.name),
          sound: clip(t, 'now', i, day.friday),
        });
      }
    }
  }
  events.push(...buildExtras(s, t, list, place.tz));
  events.sort((a, b) => a.at - b.at);
  const last = list[list.length - 1];
  return {
    events,
    labels,
    texts: { open: t.trayOpen, stop: t.stopAdhan, dismiss: t.dismiss, skip: t.traySkip, pause: t.trayPause, quit: t.trayQuit },
    volume: s.volume / 100,
    quietInPresentation: s.quietInPresentation,
    horizon: last.times[5].getTime(),
    rtl: t.dir === 'rtl',
  };
}
