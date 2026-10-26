// Home's adhkar band: one dhikr at a time with its source, previous/next and dots, beside an arched window onto a
// mosque at dusk. The Arabic is always shown (RTL, Amiri); the translation when there is one for the language.
import type { Text } from '../i18n';
import { ADHKAR, reference, type Dhikr } from '../lib/adhkar';
import { esc } from '../screens/common';

export const BOOK = '<path d="M12 6.5C10 5 7 4.6 4 5v13c3-.4 6 0 8 1.5M12 6.5C14 5 17 4.6 20 5v13c-3-.4-6 0-8 1.5M12 6.5v13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>';

const SCENE = `<svg class="scene" viewBox="0 0 520 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a3560"/><stop offset=".45" stop-color="#8a5a6a"/><stop offset=".75" stop-color="#e3a463"/><stop offset="1" stop-color="#f3cf8f"/>
    </linearGradient>
    <linearGradient id="duskwater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c58a5c"/><stop offset="1" stop-color="#2a2f4f"/></linearGradient>
    <radialGradient id="lamp"><stop offset="0" stop-color="#ffd27a" stop-opacity=".9"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
    <clipPath id="window"><path d="M150 220 V95 C150 50 190 22 235 8 C280 22 320 50 320 95 V220 Z"/></clipPath>
  </defs>
  <rect width="520" height="220" class="room"/>
  <g clip-path="url(#window)">
    <rect x="140" y="0" width="190" height="220" fill="url(#dusk)"/>
    <circle cx="262" cy="150" r="16" fill="#ffe2a3" opacity=".9"/>
    <path d="M140 160 C180 130 210 150 240 140 C270 128 300 150 330 138 V220 H140 Z" fill="#3b3550" opacity=".85"/>
    <path d="M196 170 V150 H204 C204 128 222 120 226 108 C230 120 248 128 248 150 H256 V170 Z M188 170 V118 L191 110 L194 118 V170 Z M258 170 V122 L261 114 L264 122 V170 Z" fill="#1d1a2e"/>
    <rect x="140" y="170" width="190" height="50" fill="url(#duskwater)"/>
    <path d="M200 178 H250 M210 186 H240 M218 194 H232" stroke="#ffe2a3" stroke-width="1.2" opacity=".5"/>
  </g>
  <path class="frame" d="M150 220 V95 C150 50 190 22 235 8 C280 22 320 50 320 95 V220"/>
  <path class="frame thin" d="M138 220 V92 C138 44 182 12 235 -4 C288 12 332 44 332 92 V220"/>
  <g class="lantern" transform="translate(420 150)">
    <circle r="46" fill="url(#lamp)"/>
    <path d="M-2 -40 h4 v6 h-4z M-14 -34 h28 l-4 8 h-20z M-12 -26 h24 v34 h-24z M-14 8 h28 l-6 8 h-16z" class="lantern-body"/>
    <path d="M-7 -20 h14 v22 h-14z" fill="#ffd27a" opacity=".85"/>
  </g>
  <path class="carpet" d="M170 220 L196 200 H330 L356 220 Z"/>
</svg>`;

export function adhkarCard(t: Text, index: number, showTranslation: boolean) {
  const d: Dhikr = ADHKAR[index];
  const tr = t.lang !== 'ar' && showTranslation ? d.tr[t.lang] : undefined;
  const note = d.note?.[t.lang];
  const dots = ADHKAR.map((_, i) => `<span class="${i === index ? 'on' : ''}"></span>`).join('');
  return `<section class="adhkar-band" aria-roledescription="carousel" aria-label="${esc(t.h.adhkar)}">
    <div class="band-emblem"><svg viewBox="0 0 24 24" aria-hidden="true">${BOOK}</svg></div>
    <div class="band-body">
      <div class="band-label">${esc(t.h.adhkar)} · ${esc(d.kind === 'quran' ? t.h.quran : t.h.sunnah)}</div>
      <p class="dhikr-ar" lang="ar" dir="rtl">${esc(d.ar)}</p>
      ${tr ? `<p class="dhikr-tr">${esc(tr)}</p>` : ''}
      <div class="dhikr-ref">${esc(reference(d, t.lang, t.d))}${note ? ` · <span>${esc(note)}</span>` : ''}${d.count ? ` · ×${esc(t.d(d.count))}` : ''}</div>
      <div class="band-nav">
        <button class="round" data-dhikr="-1" aria-label="${esc(t.h.prev)}"><svg viewBox="0 0 24 24"><path d="M14.5 6.5 9 12l5.5 5.5"/></svg></button>
        <div class="dots" aria-hidden="true">${dots}</div>
        <button class="round" data-dhikr="1" aria-label="${esc(t.h.next)}"><svg viewBox="0 0 24 24"><path d="M9.5 6.5 15 12l-5.5 5.5"/></svg></button>
      </div>
    </div>
    ${SCENE}
  </section>`;
}
