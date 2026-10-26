// About: what the app is, where it comes from, and the credit each recording's licence asks for.
import { currentVersion, updateState } from '../lib/updates';
import { VOICES } from '../lib/voices';
import { esc, type Ctx } from './common';

export function about({ t }: Ctx) {
  const name = (v: (typeof VOICES)[number]) => v[t.lang];
  const rows = VOICES.map((v) => `<tr><td>${esc(name(v))}</td><td>${esc(v.author)}</td>
    <td><a href="${esc(v.page)}" target="_blank" rel="noopener">${esc(v.license)}</a></td></tr>`).join('');
  return `<div class="about">
    <h1>${esc(t.appName)}</h1>
    <p>${esc(t.about)}</p>
    <p class="muted">${esc(t.basedOn)} · adhan-js (MIT) · GeoNames (CC BY 4.0) · Amiri, Alexandria, Marcellus (OFL)</p>
    ${updates(t)}
    <section class="card"><h2>${esc(t.credits)}</h2>
      <table class="credits"><tbody>${rows}</tbody></table>
    </section>
  </div>`;
}

/** The version, and checking for and installing an update (lib/updates.ts); the buttons are handled in main.ts. */
function updates(t: Ctx['t']) {
  const u = updateState();
  const line = u.status === 'checking' ? t.u.checking
    : u.status === 'current' ? t.u.current
    : u.status === 'available' ? t.u.available(u.version)
    : u.status === 'installing' ? t.u.installing
    : u.status === 'error' ? t.u.error : '';
  const button = u.status === 'available'
    ? `<button class="btn" data-act="update-install">${esc(t.u.install)}</button>`
    : `<button class="btn" data-act="update-check"${u.status === 'checking' || u.status === 'installing' ? ' disabled' : ''}>${esc(t.u.check)}</button>`;
  const version = currentVersion();
  return `<section class="card updates"><h2>${esc(t.u.section)}</h2>
    <div class="own"><div>${version ? esc(t.d(t.u.version(version))) : ''}${line ? ` <span class="muted">· ${esc(line)}</span>` : ''}</div>${button}</div>
  </section>`;
}
