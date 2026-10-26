// The adhkar shown on Home and in Adhkar. Every text is checked against its source and must stay exact:
// - Quran: the whole verse, as in the Tanzil "quran-simple" text (fetched from api.alquran.cloud, 26 Oct 2026), with
//   Pickthall's 1930 English translation (public domain). No Spanish or Portuguese translation of the Quran is
//   shown: none in the public domain was found, and an unreviewed one must not stand in for it.
// - Sunnah: the dhikr's words as they appear in the hadith on sunnah.com (Sahih al-Bukhari, checked the same day),
//   with the hadith number. Spelling is today's (لَا، إِلَّا، وَهُوَ، شَيْءٍ for the print's لاَ، إِلاَّ، وَهْوَ، شَىْءٍ); the words are
//   the source's. The translations of these short phrases are the project's own.
import type { Lang } from './settings';

export type Dhikr = {
  id: string;
  kind: 'quran' | 'sunnah';
  ar: string;
  /** Translations; missing ones are not shown. */
  tr: Partial<Record<Exclude<Lang, 'ar'>, string>>;
  /** What the source says about it, per language (Sunnah only). */
  note?: Partial<Record<Lang, string>>;
  /** Quran: [surah, ayah]; Sunnah: the collection's hadith number. */
  ref: { surah: number; ayah: number } | { bukhari: number };
  /** Times to repeat, where the source gives a number. */
  count?: number;
};

export const ADHKAR: Dhikr[] = [
  {
    id: 'q62-10', kind: 'quran',
    ar: 'فَإِذَا قُضِيَتِ الصَّلَاةُ فَانْتَشِرُوا فِي الْأَرْضِ وَابْتَغُوا مِنْ فَضْلِ اللَّهِ وَاذْكُرُوا اللَّهَ كَثِيرًا لَعَلَّكُمْ تُفْلِحُونَ',
    tr: { en: "And when the prayer is ended, then disperse in the land and seek of Allah's bounty, and remember Allah much, that ye may be successful." },
    ref: { surah: 62, ayah: 10 },
  },
  {
    id: 'b6406', kind: 'sunnah',
    ar: 'سُبْحَانَ اللَّهِ الْعَظِيمِ، سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    tr: {
      en: 'Glory be to Allah, the Magnificent; glory be to Allah, and praise be to Him.',
      es: 'Gloria a Allah, el Magnífico; gloria a Allah, y a Él la alabanza.',
      pt: 'Glorificado seja Allah, o Magnífico; glorificado seja Allah, e a Ele o louvor.',
    },
    note: {
      ar: 'كلمتان خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن',
      en: 'Two phrases light on the tongue, heavy in the Balance, beloved to the Most Merciful',
      es: 'Dos frases ligeras en la lengua, pesadas en la Balanza, amadas por el Compasivo',
      pt: 'Duas frases leves na língua, pesadas na Balança, amadas pelo Misericordioso',
    },
    ref: { bukhari: 6406 },
  },
  {
    id: 'q13-28', kind: 'quran',
    ar: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُمْ بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    tr: { en: 'Who have believed and whose hearts have rest in the remembrance of Allah. Verily in the remembrance of Allah do hearts find rest!' },
    ref: { surah: 13, ayah: 28 },
  },
  {
    id: 'b6403', kind: 'sunnah',
    ar: 'لَا إِلَهَ إِلَّا اللَّهُ، وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    tr: {
      en: 'There is no god but Allah alone, with no partner; His is the dominion and His is the praise, and He is able to do all things.',
      es: 'No hay dios sino Allah, Único, sin asociado; Suyo es el reino y Suya la alabanza, y Él tiene poder sobre todas las cosas.',
      pt: 'Não há deus senão Allah, Único, sem associado; Dele é o reino e Dele o louvor, e Ele tem poder sobre todas as coisas.',
    },
    note: { ar: 'مئة مرة في اليوم', en: 'A hundred times a day', es: 'Cien veces al día', pt: 'Cem vezes ao dia' },
    ref: { bukhari: 6403 },
    count: 100,
  },
  {
    id: 'q2-152', kind: 'quran',
    ar: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
    tr: { en: 'Therefore remember Me, I will remember you. Give thanks to Me, and reject not Me.' },
    ref: { surah: 2, ayah: 152 },
  },
  {
    id: 'b6384', kind: 'sunnah',
    ar: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
    tr: {
      en: 'There is no might nor power except with Allah.',
      es: 'No hay fuerza ni poder sino en Allah.',
      pt: 'Não há força nem poder senão em Allah.',
    },
    note: { ar: 'كنز من كنوز الجنة', en: 'A treasure of the treasures of Paradise', es: 'Un tesoro de los tesoros del Paraíso', pt: 'Um tesouro dos tesouros do Paraíso' },
    ref: { bukhari: 6384 },
  },
  {
    id: 'q33-41', kind: 'quran',
    ar: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا',
    tr: { en: 'O ye who believe! Remember Allah with much remembrance.' },
    ref: { surah: 33, ayah: 41 },
  },
  {
    id: 'b6307', kind: 'sunnah',
    ar: 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ',
    tr: {
      en: 'I seek the forgiveness of Allah and turn to Him in repentance.',
      es: 'Pido perdón a Allah y me vuelvo a Él arrepentido.',
      pt: 'Peço perdão a Allah e volto-me a Ele arrependido.',
    },
    note: {
      ar: 'كان النبي ﷺ يقولها في اليوم أكثر من سبعين مرة',
      en: 'The Prophet ﷺ said it more than seventy times a day',
      es: 'El Profeta ﷺ lo decía más de setenta veces al día',
      pt: 'O Profeta ﷺ o dizia mais de setenta vezes ao dia',
    },
    ref: { bukhari: 6307 },
  },
];

/** Surah names for the reference line, by number. */
const SURAHS: Record<number, { ar: string; en: string }> = {
  2: { ar: 'البقرة', en: 'Al-Baqarah' },
  13: { ar: 'الرعد', en: "Ar-Ra'd" },
  33: { ar: 'الأحزاب', en: 'Al-Ahzab' },
  62: { ar: 'الجمعة', en: "Al-Jumu'ah" },
};

/** "Al-Jumu'ah 62:10" / "الجمعة ٦٢:١٠" / "Sahih al-Bukhari 6406" / "صحيح البخاري ٦٤٠٦". */
export function reference(d: Dhikr, lang: Lang, digits: (s: string | number) => string) {
  if ('surah' in d.ref) {
    const s = SURAHS[d.ref.surah];
    return `${lang === 'ar' ? s.ar : s.en} ${digits(`${d.ref.surah}:${d.ref.ayah}`)}`;
  }
  return lang === 'ar' ? `صحيح البخاري ${digits(d.ref.bukhari)}` : `Sahih al-Bukhari ${digits(d.ref.bukhari)}`;
}

/** The dhikr shown first today: changes daily, the same all day. */
export function dhikrOfTheDay(now: Date) {
  const day = Math.floor((now.getTime() - now.getTimezoneOffset() * 60_000) / 86_400_000);
  return ((day % ADHKAR.length) + ADHKAR.length) % ADHKAR.length;
}
