// The window: the night sky, the navigation rail, the screens, and keeping the background engine's schedule in step
// with the settings.
import './styles/app.css';
import { makeText } from './i18n';
import { ADHKAR, dhikrOfTheDay } from './lib/adhkar';
import { loadSettings, onNeedSchedule, saveSettings, setSchedule, showToast, syncAutostart } from './lib/bridge';
import { buildSchedule } from './lib/schedule';
import { morph } from './lib/morph';
import { merge, placeOf, type Settings } from './lib/settings';
import { checkForUpdate, installUpdate, loadVersion, onUpdateState, scheduleChecks } from './lib/updates';
import { about } from './screens/about';
import { adhkar, bindAdhkar } from './screens/adhkar';
import { ICONS, esc, svg, type Ctx } from './screens/common';
import { home } from './screens/home';
import { bindSettings, resetBrowse, settings } from './screens/settings';
import { bindToday, today } from './screens/today';
import { sky } from './ui/sky';

type Screen = 'home' | 'today' | 'adhkar' | 'settings' | 'about';
const SCREENS: Screen[] = ['home', 'today', 'adhkar', 'settings', 'about'];

let s: Settings;
let screen: Screen = 'home';
/** Home's adhkar band: today's dhikr first, then the user's previous/next or a turn every 40 s. */
let dhikr = dhikrOfTheDay(new Date());
let bandHover = false;
const skyEl = document.getElementById('sky')!;
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
    el.setAttribute('role', 'status');
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

function go(next: Screen) {
  if (next === screen) return;
  screen = next;
  main.scrollTop = 0;
  draw(true);
}

function drawNav() {
  const { t } = ctx();
  document.documentElement.lang = s.lang;
  document.documentElement.dir = t.dir;
  document.title = t.appName;
  nav.innerHTML = `<div class="rail">
    <svg class="rail-arch" viewBox="0 0 140 70" preserveAspectRatio="none" aria-hidden="true"><path d="M1 70 V44 C1 26 40 10 70 1 C100 10 139 26 139 44 V70"/></svg>
    <div class="brand">${svg(ICONS.arch, '0 0 64 64')}<b>${esc(t.appName)}</b></div>
    <div class="rail-items">${SCREENS.map((k) => `<button class="nav-item${k === screen ? ' on' : ''}" data-go="${k}"${k === screen ? ' aria-current="page"' : ''}>
      <span class="nav-ico">${svg(ICONS[k])}</span><span class="nav-label">${esc(t.nav[k])}</span></button>`).join('')}</div>
    <div class="rail-foot" aria-hidden="true"></div>
  </div>`;
}

/** The sky behind every screen; Home adds the skyline. Drawn on full redraws only (the stars never move). */
function drawSky() {
  skyEl.innerHTML = sky(new Date(), screen === 'home', s.lang === 'ar');
  document.body.dataset.screen = screen;
}

/** Home and Today redraw every second, in place; the others when something changes (`full`). */
function draw(full = false) {
  if (full) {
    drawNav();
    drawSky();
  }
  const c = ctx();
  const now = new Date();
  if (screen === 'home' || screen === 'today' || screen === 'adhkar') {
    const html = screen === 'home' ? home(c, now, dhikr) : screen === 'today' ? today(c, now) : adhkar(c);
    if (full) main.innerHTML = html;
    else if (screen !== 'adhkar') morph(main, html);
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
  bindAdhkar(main, () => morph(main, adhkar(ctx())));
  // Delegated, as the screens redraw: navigation (rail, Home's place and timeline), the adhkar band, updates.
  document.addEventListener('click', (e) => {
    const el = e.target as Element;
    const to = el.closest<HTMLElement>('[data-go]')?.dataset.go as Screen | undefined;
    if (to && SCREENS.includes(to)) return go(to);
    const step = el.closest<HTMLElement>('[data-dhikr]')?.dataset.dhikr;
    if (step) {
      dhikr = (dhikr + Number(step) + ADHKAR.length) % ADHKAR.length;
      return draw();
    }
    const act = el.closest<HTMLElement>('[data-act^="update-"]')?.dataset.act;
    if (act === 'update-check') void checkForUpdate();
    else if (act === 'update-install') void installUpdate();
  });
  main.addEventListener('mouseover', (e) => { bandHover = !!(e.target as Element).closest('.adhkar-band'); });
  main.addEventListener('mouseleave', () => { bandHover = false; });
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
  // Seconds tick for the countdowns; a new day also gets a fresh schedule and sky (the engine asks too, as a fallback).
  let day = new Date().toDateString();
  let ticks = 0;
  setInterval(() => {
    ticks++;
    if (screen === 'home' && !bandHover && ticks % 40 === 0) dhikr = (dhikr + 1) % ADHKAR.length;
    if (!document.hidden) draw();
    const d = new Date().toDateString();
    if (d !== day) {
      day = d;
      dhikr = dhikrOfTheDay(new Date());
      void reschedule();
      drawSky();
    }
  }, 1000);
}

void start();
