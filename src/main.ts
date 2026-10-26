// The window: navigation, the screens, and keeping the background engine's schedule in step with the settings.
import './styles/app.css';
import { makeText } from './i18n';
import { loadSettings, onNeedSchedule, saveSettings, setSchedule, showToast, syncAutostart } from './lib/bridge';
import { buildSchedule } from './lib/schedule';
import { morph } from './lib/morph';
import { merge, placeOf, type Settings } from './lib/settings';
import { checkForUpdate, installUpdate, loadVersion, onUpdateState, scheduleChecks } from './lib/updates';
import { about } from './screens/about';
import { ICONS, esc, svg, type Ctx } from './screens/common';
import { home } from './screens/home';
import { bindSettings, resetBrowse, settings } from './screens/settings';
import { bindToday, today } from './screens/today';

type Screen = 'home' | 'today' | 'settings' | 'about';

let s: Settings;
let screen: Screen = 'home';
const nav = document.getElementById('nav')!;
const main = document.getElementById('main')!;

function ctx(): Ctx {
  const t = makeText(s.lang, s.digits);
  return { s, t, place: placeOf(s, s.lang), update };
}

async function reschedule() {
  await setSchedule(buildSchedule(s, makeText(s.lang, s.digits), new Date()));
}

let savedTimer = 0;
function showSaved(text: string) {
  let el = document.querySelector<HTMLDivElement>('.toast-saved');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast-saved';
    document.body.append(el);
  }
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(savedTimer);
  savedTimer = window.setTimeout(() => el!.classList.remove('show'), 1400);
}

function update(patch: Partial<Settings>) {
  const langChanged = patch.lang && patch.lang !== s.lang;
  s = { ...s, ...patch };
  if (langChanged || patch.city) resetBrowse();
  void saveSettings(s);
  void reschedule();
  if ('autostart' in patch) void syncAutostart(s.autostart);
  draw(true);
  showSaved(makeText(s.lang, s.digits).saved);
}

function drawNav() {
  const { t } = ctx();
  document.documentElement.lang = s.lang;
  document.documentElement.dir = t.dir;
  document.title = t.appName;
  const items: Screen[] = ['home', 'today', 'settings', 'about'];
  nav.innerHTML = `<div class="brand">${svg(ICONS.arch, '0 0 64 64')}<b>${esc(t.appName)}</b></div>`
    + items.map((k) => `<button class="nav-item${k === screen ? ' on' : ''}" data-go="${k}">${svg(ICONS[k])}${esc(t.nav[k])}</button>`).join('')
    + `<div class="nav-foot">${esc(placeOf(s, s.lang).name)}</div>`;
  nav.querySelectorAll<HTMLButtonElement>('[data-go]').forEach((b) => {
    b.onclick = () => {
      screen = b.dataset.go as Screen;
      draw(true);
    };
  });
}

/** Home and Today redraw every second; Settings and About only when something changes (`full`). */
function draw(full = false) {
  if (full) drawNav();
  const c = ctx();
  const now = new Date();
  if (screen === 'home' || screen === 'today') {
    const html = screen === 'home' ? home(c, now) : today(c, now);
    if (full) main.innerHTML = html;
    else morph(main, html);
  } else if (full) {
    const scroll = main.scrollTop;
    if (screen === 'settings') {
      main.innerHTML = settings(c);
      bindSettings(main, c, () => draw(true));
    } else main.innerHTML = about(c);
    main.scrollTop = scroll;
  }
}

async function start() {
  s = merge(await loadSettings());
  await saveSettings(s);
  bindToday(main, ctx);
  // Update buttons (About, and Home's banner): delegated, as both screens redraw.
  main.addEventListener('click', (e) => {
    const act = (e.target as Element).closest<HTMLElement>('[data-act^="update-"]')?.dataset.act;
    if (act === 'update-check') void checkForUpdate();
    else if (act === 'update-install') void installUpdate();
  });
  onUpdateState(() => draw(screen === 'about'));
  await loadVersion();
  draw(true);
  await reschedule();
  await onNeedSchedule(() => void reschedule());
  void syncAutostart(s.autostart);
  scheduleChecks(() => s.autoUpdate, (version) => {
    const t = makeText(s.lang, s.digits);
    void showToast(t.u.toastTitle(version), t.u.toastBody);
  });
  // Seconds tick for the countdowns; a new day also gets a fresh schedule (the engine asks too, as a fallback).
  let day = new Date().toDateString();
  setInterval(() => {
    if (!document.hidden) draw();
    const d = new Date().toDateString();
    if (d !== day) {
      day = d;
      void reschedule();
    }
  }, 1000);
}

void start();
