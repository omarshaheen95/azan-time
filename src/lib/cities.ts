// Cities: Afnon's 136 (extracted from its Prefs.java into cities-afnon.json) plus Latin America and the Caribbean.
// Each city starts on the calculation method and Asr school its mosques use; Settings can still override both.
import afnon from './cities-afnon.json';

export type City = {
  id: string;
  ar: string;
  en: string;
  /** Portuguese and Spanish names, when they differ from the English one. */
  pt?: string;
  es?: string;
  country: string; // key into COUNTRIES
  lat: number;
  lng: number;
  method: string; // a key of METHODS in prayer.ts
  hanafi: boolean;
  tz: string; // IANA time zone, for the first-run guess and the "your PC is on another zone" warning
  /** Minutes its main mosque adds to each of the six times (precaution, ihtiyat), set with the city. */
  adjust?: number[];
};

export type Country = { ar: string; en: string; pt: string; region: Region; code: string };
export type Region = 'arab' | 'asia' | 'europe' | 'northAmerica' | 'latinAmerica' | 'africa' | 'oceania';
export const REGIONS: Region[] = ['latinAmerica', 'arab', 'asia', 'europe', 'northAmerica', 'africa', 'oceania'];

const C = (ar: string, en: string, pt: string, region: Region, code: string): Country => ({ ar, en, pt, region, code });

export const COUNTRIES: Record<string, Country> = {
  // Arab world
  'Egypt': C('مصر', 'Egypt', 'Egito', 'arab', 'EG'),
  'Saudi Arabia': C('السعودية', 'Saudi Arabia', 'Arábia Saudita', 'arab', 'SA'),
  'UAE': C('الإمارات', 'UAE', 'Emirados Árabes Unidos', 'arab', 'AE'),
  'Kuwait': C('الكويت', 'Kuwait', 'Kuwait', 'arab', 'KW'),
  'Qatar': C('قطر', 'Qatar', 'Catar', 'arab', 'QA'),
  'Jordan': C('الأردن', 'Jordan', 'Jordânia', 'arab', 'JO'),
  'Palestine': C('فلسطين', 'Palestine', 'Palestina', 'arab', 'PS'),
  'Lebanon': C('لبنان', 'Lebanon', 'Líbano', 'arab', 'LB'),
  'Syria': C('سوريا', 'Syria', 'Síria', 'arab', 'SY'),
  'Iraq': C('العراق', 'Iraq', 'Iraque', 'arab', 'IQ'),
  'Bahrain': C('البحرين', 'Bahrain', 'Bahrein', 'arab', 'BH'),
  'Oman': C('عُمان', 'Oman', 'Omã', 'arab', 'OM'),
  'Yemen': C('اليمن', 'Yemen', 'Iêmen', 'arab', 'YE'),
  // Asia
  'India': C('الهند', 'India', 'Índia', 'asia', 'IN'),
  'Pakistan': C('باكستان', 'Pakistan', 'Paquistão', 'asia', 'PK'),
  'Bangladesh': C('بنغلاديش', 'Bangladesh', 'Bangladesh', 'asia', 'BD'),
  'Sri Lanka': C('سريلانكا', 'Sri Lanka', 'Sri Lanka', 'asia', 'LK'),
  'Maldives': C('المالديف', 'Maldives', 'Maldivas', 'asia', 'MV'),
  'Indonesia': C('إندونيسيا', 'Indonesia', 'Indonésia', 'asia', 'ID'),
  'Malaysia': C('ماليزيا', 'Malaysia', 'Malásia', 'asia', 'MY'),
  'Singapore': C('سنغافورة', 'Singapore', 'Singapura', 'asia', 'SG'),
  'Brunei': C('بروناي', 'Brunei', 'Brunei', 'asia', 'BN'),
  'Thailand': C('تايلاند', 'Thailand', 'Tailândia', 'asia', 'TH'),
  'Japan': C('اليابان', 'Japan', 'Japão', 'asia', 'JP'),
  'South Korea': C('كوريا الجنوبية', 'South Korea', 'Coreia do Sul', 'asia', 'KR'),
  'Turkey': C('تركيا', 'Turkey', 'Turquia', 'asia', 'TR'),
  // Europe
  'United Kingdom': C('المملكة المتحدة', 'United Kingdom', 'Reino Unido', 'europe', 'GB'),
  'France': C('فرنسا', 'France', 'França', 'europe', 'FR'),
  'Germany': C('ألمانيا', 'Germany', 'Alemanha', 'europe', 'DE'),
  'Netherlands': C('هولندا', 'Netherlands', 'Países Baixos', 'europe', 'NL'),
  'Belgium': C('بلجيكا', 'Belgium', 'Bélgica', 'europe', 'BE'),
  'Austria': C('النمسا', 'Austria', 'Áustria', 'europe', 'AT'),
  'Switzerland': C('سويسرا', 'Switzerland', 'Suíça', 'europe', 'CH'),
  'Italy': C('إيطاليا', 'Italy', 'Itália', 'europe', 'IT'),
  'Spain': C('إسبانيا', 'Spain', 'Espanha', 'europe', 'ES'),
  'Bosnia and Herzegovina': C('البوسنة والهرسك', 'Bosnia and Herzegovina', 'Bósnia e Herzegovina', 'europe', 'BA'),
  // North America
  'United States': C('الولايات المتحدة', 'United States', 'Estados Unidos', 'northAmerica', 'US'),
  'Canada': C('كندا', 'Canada', 'Canadá', 'northAmerica', 'CA'),
  // Latin America and the Caribbean
  'Brazil': C('البرازيل', 'Brazil', 'Brasil', 'latinAmerica', 'BR'),
  'Argentina': C('الأرجنتين', 'Argentina', 'Argentina', 'latinAmerica', 'AR'),
  'Venezuela': C('فنزويلا', 'Venezuela', 'Venezuela', 'latinAmerica', 'VE'),
  'Colombia': C('كولومبيا', 'Colombia', 'Colômbia', 'latinAmerica', 'CO'),
  'Paraguay': C('باراغواي', 'Paraguay', 'Paraguai', 'latinAmerica', 'PY'),
  'Chile': C('تشيلي', 'Chile', 'Chile', 'latinAmerica', 'CL'),
  'Mexico': C('المكسيك', 'Mexico', 'México', 'latinAmerica', 'MX'),
  'Panama': C('بنما', 'Panama', 'Panamá', 'latinAmerica', 'PA'),
  'Peru': C('بيرو', 'Peru', 'Peru', 'latinAmerica', 'PE'),
  'Suriname': C('سورينام', 'Suriname', 'Suriname', 'latinAmerica', 'SR'),
  'Guyana': C('غيانا', 'Guyana', 'Guiana', 'latinAmerica', 'GY'),
  'Trinidad and Tobago': C('ترينيداد وتوباغو', 'Trinidad and Tobago', 'Trinidad e Tobago', 'latinAmerica', 'TT'),
  // Africa
  'Kenya': C('كينيا', 'Kenya', 'Quênia', 'africa', 'KE'),
  'Nigeria': C('نيجيريا', 'Nigeria', 'Nigéria', 'africa', 'NG'),
  'South Africa': C('جنوب أفريقيا', 'South Africa', 'África do Sul', 'africa', 'ZA'),
  // Oceania
  'Australia': C('أستراليا', 'Australia', 'Austrália', 'oceania', 'AU'),
  'New Zealand': C('نيوزيلندا', 'New Zealand', 'Nova Zelândia', 'oceania', 'NZ'),
};

/** Time zones of Afnon's cities: the country's, with per-city exceptions for countries that span several. */
const COUNTRY_TZ: Record<string, string> = {
  'Egypt': 'Africa/Cairo', 'Saudi Arabia': 'Asia/Riyadh', 'UAE': 'Asia/Dubai', 'Kuwait': 'Asia/Kuwait',
  'Qatar': 'Asia/Qatar', 'Jordan': 'Asia/Amman', 'Palestine': 'Asia/Hebron', 'Lebanon': 'Asia/Beirut',
  'Syria': 'Asia/Damascus', 'Iraq': 'Asia/Baghdad', 'Bahrain': 'Asia/Bahrain', 'Oman': 'Asia/Muscat',
  'Yemen': 'Asia/Aden', 'India': 'Asia/Kolkata', 'Pakistan': 'Asia/Karachi', 'Bangladesh': 'Asia/Dhaka',
  'Sri Lanka': 'Asia/Colombo', 'Maldives': 'Indian/Maldives', 'Indonesia': 'Asia/Jakarta',
  'Malaysia': 'Asia/Kuala_Lumpur', 'Singapore': 'Asia/Singapore', 'Brunei': 'Asia/Brunei',
  'Thailand': 'Asia/Bangkok', 'Japan': 'Asia/Tokyo', 'South Korea': 'Asia/Seoul', 'Turkey': 'Europe/Istanbul',
  'United Kingdom': 'Europe/London', 'France': 'Europe/Paris', 'Germany': 'Europe/Berlin',
  'Netherlands': 'Europe/Amsterdam', 'Belgium': 'Europe/Brussels', 'Austria': 'Europe/Vienna',
  'Switzerland': 'Europe/Zurich', 'Italy': 'Europe/Rome', 'Spain': 'Europe/Madrid',
  'Bosnia and Herzegovina': 'Europe/Sarajevo', 'United States': 'America/New_York', 'Canada': 'America/Toronto',
  'Kenya': 'Africa/Nairobi', 'Nigeria': 'Africa/Lagos', 'South Africa': 'Africa/Johannesburg',
  'Australia': 'Australia/Sydney', 'New Zealand': 'Pacific/Auckland',
};
const CITY_TZ: Record<string, string> = {
  gaza: 'Asia/Gaza', jabalia: 'Asia/Gaza', deiralbalah: 'Asia/Gaza', khanyunis: 'Asia/Gaza', rafah: 'Asia/Gaza',
  chicago: 'America/Chicago', dallas: 'America/Chicago', houston: 'America/Chicago',
  losangeles: 'America/Los_Angeles', melbourne: 'Australia/Melbourne',
};

type AfnonCity = { id: string; ar: string; en: string; countryEn: string; lat: number; lng: number; method: string; hanafi: boolean };

const fromAfnon: City[] = (afnon as AfnonCity[]).map((c) => ({
  id: c.id, ar: c.ar, en: c.en, country: c.countryEn, lat: c.lat, lng: c.lng, method: c.method, hanafi: c.hanafi,
  tz: CITY_TZ[c.id] ?? COUNTRY_TZ[c.countryEn],
}));

/**
 * Latin America and the Caribbean. No federation publishes one method for the region and prayer-time sites differ
 * (MWL or Karachi), so every city starts on Muslim World League; Suriname, Guyana and Trinidad, whose Muslims are
 * mostly of South Asian descent, start on Hanafi Asr. To verify with FAMBRAS (Brazil), CIRA (Argentina) and ASJA
 * (Trinidad) before release; per-prayer minute adjustments cover a mosque's own table meanwhile (PLAN.md §5.2).
 */
const MWL = 'MUSLIM_WORLD_LEAGUE';
const L = (id: string, ar: string, en: string, country: string, lat: number, lng: number, tz: string,
  hanafi = false, pt?: string, es?: string, method = MWL): City => ({ id, ar, en, pt, es, country, lat, lng, method, hanafi, tz });
/**
 * Argentina: CIRA's Buenos Aires table (13 Oct 2026: Fajr 04:47, Isha 20:33) is 18° for both, Karachi's angles; with
 * MWL's 17° Isha came 5 minutes early. Brazil: the Instituto Islâmico Brasileiro publishes MWL, and its São Paulo
 * table matched ours to the minute (26 Oct 2026). PLAN.md §12.
 */
const KAR = 'KARACHI';

const latinAmerica: City[] = [
  L('saopaulo', 'ساو باولو', 'São Paulo', 'Brazil', -23.5505, -46.6333, 'America/Sao_Paulo'),
  L('fozdoiguacu', 'فوز دو إيغواسو', 'Foz do Iguaçu', 'Brazil', -25.5163, -54.5854, 'America/Sao_Paulo'),
  L('curitiba', 'كوريتيبا', 'Curitiba', 'Brazil', -25.4284, -49.2733, 'America/Sao_Paulo'),
  L('riodejaneiro', 'ريو دي جانيرو', 'Rio de Janeiro', 'Brazil', -22.9068, -43.1729, 'America/Sao_Paulo'),
  L('brasilia', 'برازيليا', 'Brasília', 'Brazil', -15.7939, -47.8828, 'America/Sao_Paulo'),
  L('portoalegre', 'بورتو أليغري', 'Porto Alegre', 'Brazil', -30.0346, -51.2177, 'America/Sao_Paulo'),
  L('buenosaires', 'بوينس آيرس', 'Buenos Aires', 'Argentina', -34.6037, -58.3816, 'America/Argentina/Buenos_Aires', false, undefined, undefined, KAR),
  L('cordoba', 'قرطبة', 'Córdoba', 'Argentina', -31.4201, -64.1888, 'America/Argentina/Cordoba', false, undefined, undefined, KAR),
  L('rosario', 'روساريو', 'Rosario', 'Argentina', -32.9442, -60.6505, 'America/Argentina/Cordoba', false, undefined, undefined, KAR),
  L('tucuman', 'توكومان', 'San Miguel de Tucumán', 'Argentina', -26.8083, -65.2176, 'America/Argentina/Tucuman', false, undefined, undefined, KAR),
  L('mendoza', 'مندوزا', 'Mendoza', 'Argentina', -32.8895, -68.8458, 'America/Argentina/Mendoza', false, undefined, undefined, KAR),
  L('ushuaia', 'أوشوايا', 'Ushuaia', 'Argentina', -54.8019, -68.3030, 'America/Argentina/Ushuaia', false, undefined, undefined, KAR),
  L('caracas', 'كاراكاس', 'Caracas', 'Venezuela', 10.4806, -66.9036, 'America/Caracas'),
  L('porlamar', 'بورلامار (جزيرة مارغريتا)', 'Porlamar (Margarita Island)', 'Venezuela', 10.9577, -63.8697, 'America/Caracas',
    false, 'Porlamar (Ilha Margarita)', 'Porlamar (Isla de Margarita)'),
  L('valencia_ve', 'فالنسيا', 'Valencia', 'Venezuela', 10.1620, -68.0077, 'America/Caracas'),
  L('maracaibo', 'ماراكايبو', 'Maracaibo', 'Venezuela', 10.6427, -71.6125, 'America/Caracas'),
  L('bogota', 'بوغوتا', 'Bogotá', 'Colombia', 4.7110, -74.0721, 'America/Bogota'),
  L('maicao', 'مايكاو', 'Maicao', 'Colombia', 11.3778, -72.2389, 'America/Bogota'),
  L('barranquilla', 'بارانكيا', 'Barranquilla', 'Colombia', 10.9685, -74.7813, 'America/Bogota'),
  L('ciudaddeleste', 'سيوداد ديل إستي', 'Ciudad del Este', 'Paraguay', -25.5097, -54.6111, 'America/Asuncion'),
  L('asuncion', 'أسونسيون', 'Asunción', 'Paraguay', -25.2637, -57.5759, 'America/Asuncion'),
  // Mezquita As-Salam (Centro Islámico de Chile) on Mawaqit, 26 Oct 2026: MWL angles plus precaution minutes,
  // Fajr 05:26, Dhuhr 13:32, Asr 17:14, Maghrib 20:13, Isha 21:31 (MWL alone: 05:20 13:28 17:08 20:05 21:29).
  { ...L('santiago', 'سانتياغو', 'Santiago', 'Chile', -33.4489, -70.6693, 'America/Santiago'), adjust: [6, 0, 4, 6, 8, 2] },
  L('iquique', 'إكيكي', 'Iquique', 'Chile', -20.2307, -70.1357, 'America/Santiago'),
  L('puntaarenas', 'بونتا أريناس', 'Punta Arenas', 'Chile', -53.1638, -70.9171, 'America/Punta_Arenas'),
  L('mexicocity', 'مكسيكو سيتي', 'Mexico City', 'Mexico', 19.4326, -99.1332, 'America/Mexico_City', false, 'Cidade do México', 'Ciudad de México'),
  L('guadalajara', 'غوادالاخارا', 'Guadalajara', 'Mexico', 20.6597, -103.3496, 'America/Mexico_City'),
  L('monterrey', 'مونتيري', 'Monterrey', 'Mexico', 25.6866, -100.3161, 'America/Monterrey'),
  L('tijuana', 'تيخوانا', 'Tijuana', 'Mexico', 32.5149, -117.0382, 'America/Tijuana'),
  // Madina Masjid on Mawaqit, 26 Oct 2026: Fajr 04:55, Dhuhr 12:02, Asr 15:24, Maghrib 18:03, Isha 19:11 (MWL plus minutes).
  { ...L('panamacity', 'مدينة بنما', 'Panama City', 'Panama', 8.9824, -79.5199, 'America/Panama', false, 'Cidade do Panamá', 'Ciudad de Panamá'),
    adjust: [0, 0, 0, 2, 6, 7] },
  L('colon', 'كولون', 'Colón', 'Panama', 9.3592, -79.9014, 'America/Panama'),
  // Mezquita de Magdalena del Mar on Mawaqit, 26 Oct 2026: Fajr 04:25, Dhuhr 11:52, Asr 14:58, Maghrib 18:10, Isha 19:15.
  { ...L('lima', 'ليما', 'Lima', 'Peru', -12.0464, -77.0428, 'America/Lima'), adjust: [0, 0, 0, 0, 3, 0] },
  L('paramaribo', 'باراماريبو', 'Paramaribo', 'Suriname', 5.8520, -55.2038, 'America/Paramaribo', true),
  L('georgetown', 'جورجتاون', 'Georgetown', 'Guyana', 6.8013, -58.1551, 'America/Guyana', true),
  L('portofspain', 'بورت أوف سبين', 'Port of Spain', 'Trinidad and Tobago', 10.6549, -61.5019, 'America/Port_of_Spain', true),
  L('sanfernando_tt', 'سان فرناندو', 'San Fernando', 'Trinidad and Tobago', 10.2797, -61.4594, 'America/Port_of_Spain', true),
];

export const CITIES: City[] = [...latinAmerica, ...fromAfnon];

export const cityById = (id: string | null | undefined) => CITIES.find((c) => c.id === id);

/** First run: a city on this PC's time zone, preferring Latin America (the app's audience), else São Paulo. */
export function guessCity(tz: string = Intl.DateTimeFormat().resolvedOptions().timeZone): City {
  return CITIES.find((c) => c.tz === tz) ?? CITIES[0];
}

export { tzOffsetMinutes } from './prayer';
