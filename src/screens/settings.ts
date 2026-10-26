// Settings (Afnon's SettingsActivity, for a mouse and keyboard): location, calculation, adhan and reminders, the
// app's own behaviour, and display. Every change saves at once and reschedules the background engine.
import { LANG_NAMES } from '../i18n';
import { CITIES, COUNTRIES, REGIONS, cityById, type Region } from '../lib/cities';
import { importSound, playSound, stopSound } from '../lib/bridge';
import { hanafiForCountry, methodForCountry, placeLabel, searchPlaces, type PlaceRow } from '../lib/places';
import { METHODS, PRAYERS, SUNRISE } from '../lib/prayer';
import { cityLabel, withCity, type Lang } from '../lib/settings';
import { ADHAN_VOICES, soundOf } from '../lib/voices';
import { esc, tzMismatch, type Ctx } from './common';

/** The region and country being browsed, before a city is picked. */
let browse: { region: Region | 'custom'; country: string } | null = null;

const opt = (value: string | number, label: string, selected: boolean) =>
  `<option value="${esc(value)}"${selected ? ' selected' : ''}>${esc(label)}</option>`;

const field = (label: string, control: string, help = '') =>
  `<div class="field"><label>${esc(label)}${help ? `<span class="help">${esc(help)}</span>` : ''}</label>${control}</div>`;

const toggle = (key: string, on: boolean) =>
  `<label class="toggle"><input type="checkbox" data-k="${key}"${on ? ' checked' : ''}><span></span></label>`;

const select = (key: string, options: string) => `<select data-k="${key}">${options}</select>`;

function countryName(ctx: Ctx, key: string) {
  const c = COUNTRIES[key];
  if (ctx.t.lang === 'es') return new Intl.DisplayNames(['es'], { type: 'region' }).of(c.code) ?? c.en;
  return ctx.t.lang === 'ar' ? c.ar : ctx.t.lang === 'pt' ? c.pt : c.en;
}

function cityName(ctx: Ctx, id: string) {
  return cityLabel(cityById(id)!, ctx.t.lang);
}

function location(ctx: Ctx) {
  const { s, t } = ctx;
  const current = cityById(s.city);
  if (!browse) {
    browse = s.city === 'custom' || !current
      ? { region: 'custom', country: '' }
      : { region: COUNTRIES[current.country].region, country: current.country };
  }
  const regions = REGIONS.map((r) => opt(r, t.regions[r], browse!.region === r)).join('') + opt('custom', t.customPlace, browse.region === 'custom');
  let rows = `<div class="search"><input type="search" data-ui="search" placeholder="${esc(t.search)}" autocomplete="off">
    <div class="results" data-ui="results"></div></div>`;
  rows += field(t.region, `<select data-ui="region">${regions}</select>`);

  if (browse.region === 'custom') {
    const c = s.custom;
    rows += field(t.customName, `<input type="text" data-custom="name" value="${esc(c.name)}">`);
    rows += field(`${t.lat} / ${t.lng}`, `<div class="inline">
      <input type="number" step="0.0001" min="-90" max="90" data-custom="lat" value="${esc(c.lat)}">
      <input type="number" step="0.0001" min="-180" max="180" data-custom="lng" value="${esc(c.lng)}"></div>`);
    rows += field(t.tz, `<div class="inline"><input type="text" data-custom="tz" value="${esc(c.tz)}" dir="ltr">
      <button class="btn" data-act="custom">${esc(t.apply)}</button></div>`);
  } else {
    const countries = Object.keys(COUNTRIES).filter((k) => COUNTRIES[k].region === browse!.region);
    if (!countries.includes(browse.country)) browse.country = countries[0];
    rows += field(t.country, `<select data-ui="country">${countries.map((k) => opt(k, countryName(ctx, k), k === browse!.country)).join('')}</select>`);
    const cities = CITIES.filter((c) => c.country === browse!.country);
    const selected = cities.some((c) => c.id === s.city) ? s.city : '';
    rows += field(t.city, `<select data-ui="city">${selected ? '' : opt('', '—', true)}${cities.map((c) => opt(c.id, cityName(ctx, c.id), c.id === selected)).join('')}</select>`);
  }
  const warn = tzMismatch(ctx.place, new Date()) ? `<div class="warn">${esc(t.tzWarning(ctx.place.tz))}</div>` : '';
  return `<section class="card"><h2>${esc(t.sec.location)}</h2>${warn}${rows}</section>`;
}

function calculation({ s, t }: Ctx) {
  let rows = field(t.method, select('method', Object.keys(METHODS).map((m) => opt(m, t.methods[m], s.method === m)).join('')));
  if (s.method === 'CUSTOM') {
    rows += field(`${t.fajrAngle} / ${t.ishaAngle}`, `<div class="inline">
      <input type="number" step="0.5" min="10" max="22" data-k="fajrAngle" value="${esc(s.fajrAngle)}">
      <input type="number" step="0.5" min="10" max="22" data-k="ishaAngle" value="${esc(s.ishaAngle)}"></div>`);
  }
  rows += field(t.asr, select('hanafi', opt('0', t.shafi, !s.hanafi) + opt('1', t.hanafi, s.hanafi)));
  rows += field(t.highLat, select('highLat', ['auto', 'middle', 'seventh', 'twilight'].map((h) => opt(h, t.highLats[h], s.highLat === h)).join('')));
  rows += `<div class="field adjust-field"><label>${esc(t.adjust)}</label><div class="adjust">${PRAYERS.map((i) => `
    <div><label>${esc(t.prayers[i])}</label><input type="number" min="-30" max="30" step="1" data-adjust="${i}" value="${esc(s.adjust[i])}"></div>`).join('')}
  </div></div>`;
  rows += field(t.hijriOffset, select('hijriOffset', [-2, -1, 0, 1, 2].map((n) => opt(n, t.d(n > 0 ? `+${n}` : n), s.hijriOffset === n)).join('')));
  return `<section class="card"><h2>${esc(t.sec.calc)}</h2>${rows}</section>`;
}

function voiceOptions(ctx: Ctx, current: string) {
  const { t } = ctx;
  const name = (v: (typeof ADHAN_VOICES)[number]) => v[t.lang];
  let out = ADHAN_VOICES.map((v) => opt(v.id, name(v), v.id === current)).join('');
  if (current.startsWith('custom:')) out += opt(current, current.slice(7).split(/[\\/]/).pop()!, true);
  return out + opt('add', t.addOwn, false);
}

function alerts(ctx: Ctx) {
  const { s, t } = ctx;
  const voiceRow = (key: 'voice' | 'voiceFajr', label: string) => field(label, `<div class="inline">
    <select data-voice="${key}">${voiceOptions(ctx, s[key])}</select>
    <button class="btn" data-play="${key}">${esc(t.test)}</button></div>`);
  let rows = field(t.adhan, toggle('adhan', s.adhan));
  rows += voiceRow('voice', t.voice);
  rows += voiceRow('voiceFajr', t.voiceFajr);
  rows += field(t.volume, `<div class="inline"><input type="range" min="0" max="100" step="5" data-k="volume" value="${esc(s.volume)}">
    <button class="btn" data-act="stop">${esc(t.stop)}</button></div>`);
  rows += field(t.remind, select('remind', [0, 5, 10, 15, 20, 30].map((n) => opt(n, n ? t.d(t.minShort(n)) : t.off, s.remind === n)).join('')));
  rows += field(t.remindVoice, toggle('remindVoice', s.remindVoice));
  rows += field(t.announce, toggle('announce', s.announce));
  return `<section class="card"><h2>${esc(t.sec.alerts)}</h2>${rows}</section>`;
}

function reminders({ s, t }: Ctx) {
  const x = t.x;
  const minutes = (key: 'morningAfter' | 'eveningAfter', unit: string) => `<select data-k="${key}">${[10, 15, 20, 30, 45, 60]
    .map((n) => opt(n, `${t.d(n)} ${unit}`, s[key] === n)).join('')}</select>`;
  const withToggle = (control: string, key: string, on: boolean) => `<div class="inline">${control}${toggle(key, on)}</div>`;
  let rows = field(x.morning, withToggle(minutes('morningAfter', x.afterFajr), 'morning', s.morning));
  rows += field(x.evening, withToggle(minutes('eveningAfter', x.afterAsr), 'evening', s.evening));
  rows += field(x.kahfRow, toggle('kahf', s.kahf));
  rows += field(x.duhaRow, toggle('duha', s.duha));
  rows += field(x.nightRow, toggle('night', s.night));
  rows += field(x.fastingRow, toggle('fasting', s.fasting));
  rows += field(x.iqamaRow, toggle('iqama', s.iqama));
  if (s.iqama) {
    rows += `<div class="field adjust-field"><label>${esc(x.iqamaMinutes)}</label><div class="adjust five">${PRAYERS.filter((i) => i !== SUNRISE).map((i) => `
      <div><label>${esc(t.prayers[i])}</label><input type="number" min="0" max="90" step="1" data-iqama="${i}" value="${esc(s.iqamaMinutes[i])}"></div>`).join('')}
    </div></div>`;
    rows += field(x.iqamaSound, toggle('iqamaSound', s.iqamaSound));
  }
  const days = (selected: number[], name: string) => `<div class="weekdays">${x.weekdays.map((w, i) => `<label class="chip">
    <input type="checkbox" name="${name}" value="${i}"${selected.includes(i) ? ' checked' : ''}><span>${esc(w)}</span></label>`).join('')}</div>`;
  const list = s.ownReminders.map((r) => `<div class="own">
    <div><b>${esc(r.title)}</b> <span class="muted">${esc(t.d(r.time))} · ${esc(r.days.map((d) => x.weekdays[d]).join(' '))}</span></div>
    <button class="btn" data-own-remove="${esc(r.id)}">${esc(x.remove)}</button></div>`).join('');
  rows += `<div class="field adjust-field"><label>${esc(x.own)}</label>${list}
    <div class="own-new">
      <input type="text" data-own="title" placeholder="${esc(x.ownTitle)}" maxlength="60">
      <input type="time" data-own="time" value="21:00">
      ${days([0, 1, 2, 3, 4, 5, 6], 'own-days')}
      <button class="btn" data-act="own-add">${esc(x.add)}</button>
    </div></div>`;
  return `<section class="card"><h2>${esc(x.section)}</h2>${rows}</section>`;
}

function app({ s, t }: Ctx) {
  const rows = field(t.autostart, toggle('autostart', s.autostart))
    + field(t.quietInPresentation, toggle('quietInPresentation', s.quietInPresentation))
    + field(t.u.auto, toggle('autoUpdate', s.autoUpdate));
  return `<section class="card"><h2>${esc(t.sec.app)}</h2>${rows}</section>`;
}

function display({ s, t }: Ctx) {
  let rows = field(t.lang, select('lang', (Object.keys(LANG_NAMES) as Lang[]).map((l) => opt(l, LANG_NAMES[l], s.lang === l)).join('')));
  rows += field(t.digits, select('digits', opt('auto', t.digitsAuto, s.digits === 'auto') + opt('eastern', t.digitsEastern, s.digits === 'eastern')
    + opt('western', t.digitsWestern, s.digits === 'western')));
  rows += field(t.clock, select('clock', opt('system', t.clockSystem, s.clock === 'system') + opt('12', t.clock12, s.clock === '12')
    + opt('24', t.clock24, s.clock === '24')));
  rows += field(t.h.showTranslation, toggle('showTranslation', s.showTranslation));
  return `<section class="card"><h2>${esc(t.sec.display)}</h2>${rows}</section>`;
}

export function settings(ctx: Ctx) {
  return `<h1>${esc(ctx.t.nav.settings)}</h1>
    <div class="sections">${location(ctx)}${calculation(ctx)}${alerts(ctx)}${reminders(ctx)}${app(ctx)}${display(ctx)}</div>`;
}

const NUMERIC = new Set(['volume', 'remind', 'hijriOffset', 'fajrAngle', 'ishaAngle', 'morningAfter', 'eveningAfter']);

export function bindSettings(root: HTMLElement, ctx: Ctx, redraw: () => void) {
  const { s, update } = ctx;

  root.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-k]').forEach((el) => {
    el.addEventListener('change', () => {
      const k = el.dataset.k!;
      let v: unknown = el instanceof HTMLInputElement && el.type === 'checkbox' ? el.checked : el.value;
      if (NUMERIC.has(k)) v = Number(v);
      if (k === 'hanafi') v = v === '1';
      update({ [k]: v });
    });
  });

  root.querySelectorAll<HTMLInputElement>('[data-adjust]').forEach((el) => {
    el.addEventListener('change', () => {
      const adjust = [...s.adjust];
      adjust[+el.dataset.adjust!] = Math.max(-30, Math.min(30, Math.round(Number(el.value) || 0)));
      update({ adjust });
    });
  });

  // City search: results are drawn under the box only, so typing keeps its focus.
  const box = root.querySelector<HTMLInputElement>('[data-ui="search"]');
  const results = root.querySelector<HTMLDivElement>('[data-ui="results"]');
  let found: PlaceRow[] = [];
  let timer = 0;
  box?.addEventListener('input', () => {
    clearTimeout(timer);
    timer = window.setTimeout(async () => {
      const q = box.value;
      found = await searchPlaces(q);
      if (box.value !== q || !results) return;
      results.innerHTML = q.trim().length < 2 ? ''
        : found.length ? found.map((r, i) => `<button class="result" data-pick="${i}">${esc(placeLabel(r, ctx.t.lang))}</button>`).join('')
        : `<div class="muted">${esc(ctx.t.noResults)}</div>`;
    }, 120);
  });
  results?.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-pick]');
    if (!b) return;
    const [name, code, , lat, lng, tz] = found[+b.dataset.pick!];
    browse = { region: 'custom', country: '' };
    update({ city: 'custom', custom: { name, lat, lng, tz }, method: methodForCountry(code), hanafi: hanafiForCountry(code) });
  });

  root.querySelector<HTMLSelectElement>('[data-ui="region"]')?.addEventListener('change', (e) => {
    browse = { region: (e.target as HTMLSelectElement).value as Region | 'custom', country: '' };
    redraw();
  });
  root.querySelector<HTMLSelectElement>('[data-ui="country"]')?.addEventListener('change', (e) => {
    browse = { region: browse!.region, country: (e.target as HTMLSelectElement).value };
    redraw();
  });
  root.querySelector<HTMLSelectElement>('[data-ui="city"]')?.addEventListener('change', (e) => {
    const city = cityById((e.target as HTMLSelectElement).value);
    if (city) update(withCity(s, city));
  });
  root.querySelector('[data-act="custom"]')?.addEventListener('click', () => {
    const val = (k: string) => root.querySelector<HTMLInputElement>(`[data-custom="${k}"]`)!.value.trim();
    const lat = Number(val('lat')), lng = Number(val('lng'));
    let tz = val('tz');
    try {
      new Intl.DateTimeFormat('en', { timeZone: tz });
    } catch {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
    update({ city: 'custom', custom: { name: val('name') || `${lat.toFixed(3)}, ${lng.toFixed(3)}`, lat, lng, tz } });
  });

  root.querySelectorAll<HTMLInputElement>('[data-iqama]').forEach((el) => {
    el.addEventListener('change', () => {
      const iqamaMinutes = [...s.iqamaMinutes];
      iqamaMinutes[+el.dataset.iqama!] = Math.max(0, Math.min(90, Math.round(Number(el.value) || 0)));
      update({ iqamaMinutes });
    });
  });
  root.querySelectorAll<HTMLButtonElement>('[data-own-remove]').forEach((b) => {
    b.onclick = () => update({ ownReminders: s.ownReminders.filter((r) => r.id !== b.dataset.ownRemove) });
  });
  root.querySelector('[data-act="own-add"]')?.addEventListener('click', () => {
    const title = root.querySelector<HTMLInputElement>('[data-own="title"]')!.value.trim();
    const time = root.querySelector<HTMLInputElement>('[data-own="time"]')!.value;
    const days = [...root.querySelectorAll<HTMLInputElement>('input[name="own-days"]:checked')].map((c) => +c.value);
    if (!title || !/^\d{2}:\d{2}$/.test(time) || !days.length) return;
    update({ ownReminders: [...s.ownReminders, { id: Date.now().toString(36), title, time, days }] });
  });

  root.querySelectorAll<HTMLSelectElement>('[data-voice]').forEach((el) => {
    el.addEventListener('change', async () => {
      const key = el.dataset.voice as 'voice' | 'voiceFajr';
      if (el.value !== 'add') return update({ [key]: el.value });
      const path = await importSound();
      if (path) update({ [key]: `custom:${path}` });
      else redraw();
    });
  });
  root.querySelectorAll<HTMLButtonElement>('[data-play]').forEach((b) => {
    b.onclick = () => void playSound(soundOf(s[b.dataset.play as 'voice' | 'voiceFajr']), s.volume / 100);
  });
  root.querySelector('[data-act="stop"]')?.addEventListener('click', () => void stopSound());
}

/** A new language or city resets what is being browsed to the saved city. */
export function resetBrowse() {
  browse = null;
}
