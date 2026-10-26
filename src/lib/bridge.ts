// The window's calls into the native side. In a plain browser (`npm run dev` without Tauri, for working on the
// screens) settings fall back to localStorage and the engine calls do nothing.
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { Schedule } from './schedule';
import type { Settings } from './settings';

export const inTauri = '__TAURI_INTERNALS__' in window;

export async function loadSettings(): Promise<Partial<Settings> | null> {
  if (inTauri) return invoke<Partial<Settings> | null>('load_settings');
  try {
    return JSON.parse(localStorage.getItem('settings') ?? 'null');
  } catch {
    return null;
  }
}

export async function saveSettings(settings: Settings) {
  if (inTauri) return invoke('save_settings', { settings });
  try {
    localStorage.setItem('settings', JSON.stringify(settings));
  } catch {
    // Private window: settings last until reload.
  }
}

export async function setSchedule(schedule: Schedule) {
  if (inTauri) await invoke('set_schedule', { schedule });
}

export async function playSound(sound: string, volume: number) {
  if (inTauri) await invoke('play_sound', { sound, volume });
}

export async function showToast(title: string, body: string) {
  if (inTauri) await invoke('show_toast', { title, body });
}

export async function stopSound() {
  if (inTauri) await invoke('stop_sound');
}

/** Picks an audio file and copies it into the app's folder; its path, or null when cancelled. */
export async function importSound(): Promise<string | null> {
  if (!inTauri) return null;
  const { open } = await import('@tauri-apps/plugin-dialog');
  const picked = await open({ multiple: false, filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac'] }] });
  if (typeof picked !== 'string') return null;
  return invoke<string>('import_sound', { path: picked });
}

export async function onNeedSchedule(fn: () => void) {
  if (inTauri) await listen('need-schedule', fn);
}

/** Start with Windows: only from an installed build, so a development run never registers itself. */
export async function syncAutostart(on: boolean) {
  if (!inTauri || import.meta.env.DEV) return;
  const a = await import('@tauri-apps/plugin-autostart');
  if (on !== (await a.isEnabled())) await (on ? a.enable() : a.disable());
}
