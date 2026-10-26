// Updates from the project's GitHub releases (tauri-plugin-updater; the endpoint and public key are in
// tauri.conf.json, and every update is signed with the matching private key). Checking is the app's one contact with
// the internet besides the user's own choices, so it can be turned off. Installing restarts the app, so it is always
// the user's click, never automatic: a restart must not land on an adhan.
import { inTauri } from './bridge';

export type UpdateState =
  | { status: 'idle' | 'checking' | 'current' | 'error' | 'installing' }
  | { status: 'available'; version: string };

let state: UpdateState = { status: 'idle' };
let pending: import('@tauri-apps/plugin-updater').Update | null = null;
const listeners = new Set<() => void>();

export const updateState = () => state;
export const onUpdateState = (fn: () => void) => listeners.add(fn);

function set(next: UpdateState) {
  state = next;
  listeners.forEach((fn) => fn());
}

/** An installed build only: a development run has no release to compare with. */
const canUpdate = () => inTauri && !import.meta.env.DEV;

let version = '';
/** The running version, read once at start (loadVersion). */
export const currentVersion = () => version;

export async function loadVersion() {
  if (!inTauri) return;
  const { getVersion } = await import('@tauri-apps/api/app');
  version = await getVersion();
}

export async function checkForUpdate(): Promise<UpdateState> {
  if (!canUpdate()) return state;
  set({ status: 'checking' });
  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    pending = await check();
    set(pending ? { status: 'available', version: pending.version } : { status: 'current' });
  } catch (e) {
    console.warn('update check', e);
    set({ status: 'error' });
  }
  return state;
}

export async function installUpdate() {
  if (!pending) return;
  set({ status: 'installing' });
  try {
    await pending.downloadAndInstall();
    // Windows: the installer closes the app and starts the new one itself; elsewhere, restart.
    const { relaunch } = await import('@tauri-apps/plugin-process');
    await relaunch();
  } catch (e) {
    console.warn('update install', e);
    set({ status: 'error' });
  }
}

const DAY = 86_400_000;

/** A minute after start, then once a day, while `enabled()` says so. */
export function scheduleChecks(enabled: () => boolean, found: (version: string) => void) {
  if (!canUpdate()) return;
  const run = async () => {
    if (!enabled()) return;
    const before = state.status;
    const after = await checkForUpdate();
    if (after.status === 'available' && before !== 'available') found(after.version);
  };
  setTimeout(run, 60_000);
  setInterval(run, DAY);
}
