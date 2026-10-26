// Search for any place (GeoNames, built by tools/geonames.py) and the method and Asr school a place starts on, by
// its country: the same choices as the curated cities (cities.ts), for everywhere else.

/** [name, country code, region, lat, lng, tz, population], most populous first. */
export type PlaceRow = [string, string, string, number, number, string, number];

let rows: PlaceRow[] | null = null;
let keys: string[] = [];

/** Lower case without accents, so "sao paulo" finds São Paulo and "bogota" Bogotá. */
export const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Loaded on the first search only: 2.7 MB the window doesn't need otherwise. */
export async function loadPlaces() {
  if (!rows) {
    rows = (await import('./places.json')).default as PlaceRow[];
    keys = rows.map((r) => fold(r[0]));
  }
  return rows;
}

/** Up to `limit` places whose name starts with the query, then those containing it; bigger places first. */
export async function searchPlaces(query: string, limit = 8): Promise<PlaceRow[]> {
  const q = fold(query);
  if (q.length < 2) return [];
  const all = await loadPlaces();
  const starts: PlaceRow[] = [], contains: PlaceRow[] = [];
  for (let i = 0; i < all.length && starts.length < limit; i++) {
    const k = keys[i];
    if (k.startsWith(q)) starts.push(all[i]);
    else if (contains.length < limit && k.includes(q)) contains.push(all[i]);
  }
  return [...starts, ...contains].slice(0, limit);
}

/** Countries whose mosques mostly use a method other than Muslim World League (the default). */
const METHOD_BY_COUNTRY: Record<string, string> = {
  EG: 'EGYPTIAN', SD: 'EGYPTIAN', LY: 'EGYPTIAN',
  SA: 'UMM_AL_QURA', AE: 'DUBAI', KW: 'KUWAIT', QA: 'QATAR',
  US: 'NORTH_AMERICA', CA: 'NORTH_AMERICA',
  PK: 'KARACHI', IN: 'KARACHI', BD: 'KARACHI', AF: 'KARACHI', LK: 'KARACHI',
  // Argentina: CIRA's Buenos Aires table is 18°/18° (PLAN.md §12).
  AR: 'KARACHI',
  ID: 'SINGAPORE', SG: 'SINGAPORE', BN: 'SINGAPORE', TH: 'SINGAPORE',
  MY: 'MOON_SIGHTING_COMMITTEE',
  IR: 'TEHRAN',
};

/** Hanafi Asr: South Asia and the Caribbean communities of South Asian descent (ASJA in Trinidad is Hanafi). */
const HANAFI = new Set(['PK', 'IN', 'BD', 'AF', 'SR', 'GY', 'TT']);

export const methodForCountry = (code: string) => METHOD_BY_COUNTRY[code] ?? 'MUSLIM_WORLD_LEAGUE';
export const hanafiForCountry = (code: string) => HANAFI.has(code);

/** "Córdoba, Córdoba · Argentina" in the interface language. */
export function placeLabel(r: PlaceRow, lang: string) {
  let country = r[1];
  try {
    country = new Intl.DisplayNames([lang], { type: 'region' }).of(r[1]) ?? r[1];
  } catch {
    // An unknown code: show it as it is.
  }
  return `${r[0]}${r[2] && r[2] !== r[0] ? `, ${r[2]}` : ''} · ${country}`;
}
