// Bundled recordings (src-tauri/resources/adhan), all from Wikimedia Commons under free licences. Generated from
// their Commons metadata; the credits are shown in About and in THIRD_PARTY.md (PLAN.md §6).
export type Voice = { id: string; ar: string; en: string; es: string; pt: string; author: string; license: string; page: string };

export const VOICES: Voice[] = [
  {"id": "beautiful", "ar": "أذان جميل", "en": "Beautiful adhan", "es": "Azán hermoso", "pt": "Azan bonito", "author": "Adam-synagda", "license": "CC0", "page": "https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg"},
  {"id": "madinah", "ar": "المسجد النبوي", "en": "The Prophet's Mosque, Madinah", "es": "Mezquita del Profeta, Medina", "pt": "Mesquita do Profeta, Medina", "author": "ejaz215", "license": "CC BY 3.0", "page": "https://commons.wikimedia.org/wiki/File:33937_ejaz215_call-to-prayer-from-the-prophet-s-mo.ogg"},
  {"id": "hassan2", "ar": "مسجد الحسن الثاني", "en": "Hassan II Mosque", "es": "Mezquita Hassan II", "pt": "Mesquita Hassan II", "author": "Fraguando", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Llamada_a_oraci%C3%B3n_Mezquita_Hassan_II.wav"},
  {"id": "azan", "ar": "أذان", "en": "Adhan", "es": "Azán", "pt": "Azan", "author": "Andrewler", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Azan.ogg"},
  {"id": "worship", "ar": "أذان (تسجيل ٢)", "en": "Adhan (recording 2)", "es": "Azán (grabación 2)", "pt": "Azan (gravação 2)", "author": "Mahfoudou", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Islamic_call_to_worship.oga"},
  {"id": "aaqib", "ar": "عاقب عزيز", "en": "Aaqib Azeez", "es": "Aaqib Azeez", "pt": "Aaqib Azeez", "author": "Atcovi", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:The_Adhan_-_Muslim_Call_to_Prayer_-_Aaqib_Azeez.mp3"},
  {"id": "ramadan", "ar": "أذان رمضان", "en": "Ramadan adhan", "es": "Azán de Ramadán", "pt": "Azan do Ramadã", "author": "daSupremo", "license": "CC BY-SA 4.0", "page": "https://commons.wikimedia.org/wiki/File:Athan_during_Ramadan_2.wav"},
  {"id": "short", "ar": "أذان قصير", "en": "Short adhan", "es": "Azán corto", "pt": "Azan curto", "author": "Aishatu98", "license": "CC0", "page": "https://commons.wikimedia.org/wiki/File:Adhan.ogg"},
  {"id": "iqamah", "ar": "الإقامة", "en": "Iqamah", "es": "Iqama", "pt": "Iqamah", "author": "Aishatu98", "license": "CC0", "page": "https://commons.wikimedia.org/wiki/File:Iqamah.ogg"},
];

/** Adhan voices offered in Settings: every recording but the iqamah. */
export const ADHAN_VOICES = VOICES.filter((v) => v.id !== 'iqamah');

export const soundOf = (id: string) => (id.startsWith('custom:') ? id.slice(7) : `res:adhan/${id}.mp3`);
