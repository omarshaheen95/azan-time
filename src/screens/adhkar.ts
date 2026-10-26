// Adhkar: every dhikr with its source, translation when there is one, and a counter for those said a number of times
// (the counter lives for the session only). The texts and their checking are in lib/adhkar.ts.
import { ADHKAR, reference } from '../lib/adhkar';
import { BOOK } from '../ui/adhkarCard';
import { esc, type Ctx } from './common';

const counts = new Map<string, number>();

export function adhkar({ s, t }: Ctx) {
  const cards = ADHKAR.map((d) => {
    const tr = t.lang !== 'ar' && s.showTranslation ? d.tr[t.lang] : undefined;
    const note = d.note?.[t.lang];
    const n = counts.get(d.id) ?? 0;
    const target = d.count ?? 33;
    const done = n >= target;
    return `<article class="dhikr-card ${d.kind}">
      <div class="dhikr-kind">${esc(d.kind === 'quran' ? t.h.quran : t.h.sunnah)}</div>
      <p class="dhikr-ar" lang="ar" dir="rtl">${esc(d.ar)}</p>
      ${tr ? `<p class="dhikr-tr">${esc(tr)}</p>` : ''}
      <div class="dhikr-ref">${esc(reference(d, t.lang, t.d))}${note ? ` · <span>${esc(note)}</span>` : ''}</div>
      <div class="counter${done ? ' done' : ''}">
        <button class="count-btn" data-count="${esc(d.id)}" aria-label="${esc(t.h.count)}">
          <span class="count-n">${esc(t.d(n))}</span><span class="count-of">/ ${esc(t.d(target))}</span>
        </button>
        ${n ? `<button class="btn ghost" data-reset="${esc(d.id)}">${esc(t.h.reset)}</button>` : ''}
      </div>
    </article>`;
  }).join('');
  return `<div class="page-head"><span class="page-ico"><svg viewBox="0 0 24 24" aria-hidden="true">${BOOK}</svg></span>
    <h1>${esc(t.nav.adhkar)}</h1></div>
    <div class="dhikr-grid">${cards}</div>`;
}

/** Counter clicks, delegated once from the screen's root; `redraw` shows the new count. */
export function bindAdhkar(root: HTMLElement, redraw: () => void) {
  root.addEventListener('click', (e) => {
    const el = e.target as Element;
    const inc = el.closest<HTMLElement>('[data-count]')?.dataset.count;
    const reset = el.closest<HTMLElement>('[data-reset]')?.dataset.reset;
    if (inc) counts.set(inc, (counts.get(inc) ?? 0) + 1);
    else if (reset) counts.delete(reset);
    else return;
    redraw();
  });
}
