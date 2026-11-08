/* Translations live in src/lang/<code>.json and are bundled into the card at build time.
 * To add a language: copy en.json to <code>.json (HA language code, e.g. de, pt-BR), translate the values,
 * and add it to LANGS below. Missing keys fall back to English. Day and month names come from Intl. */
import en from './lang/en.json';
import fr from './lang/fr.json';
import sr from './lang/sr.json';
import srLatn from './lang/sr-Latn.json';
import it from './lang/it.json';

export const LANGS = { en, fr, it, sr, 'sr-Latn': srLatn };
export const DEFAULT_LANG = 'en';

/* The HA user's language (profile setting), falling back to the browser. */
export function haLanguage(hass) {
  const h = hass || document.querySelector('home-assistant')?.hass;
  return h?.locale?.language || h?.language || navigator.language || DEFAULT_LANG;
}

/* Maps a language code to one we ship: exact → case/separator-insensitive → base language → English. */
export function resolveLang(code) {
  if (!code) return DEFAULT_LANG;
  const c = String(code).replace('_', '-');
  if (LANGS[c]) return c;
  const lc = c.toLowerCase();
  const hit = Object.keys(LANGS).find(k => k.toLowerCase() === lc);
  if (hit) return hit;
  const base = lc.split('-')[0];
  return LANGS[base] ? base : DEFAULT_LANG;
}

/* Language for a card: the card's `language` option, or the HA user's language when "auto". */
export function cardLanguage(pref, hass) {
  const raw = !pref || pref === 'auto' ? haLanguage(hass) : pref;
  const lang = resolveLang(raw);
  // dates use the full HA locale (e.g. en-AU → "4 Nov") when it shares the base language
  const dateLocale = String(raw).split(/[-_]/)[0].toLowerCase() === lang.split('-')[0].toLowerCase() ? String(raw).replace('_', '-') : lang;
  return { lang, dateLocale };
}

const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? vars[k] : m));

/* t('fr', 'card.in_days', { n: 3 }) → "Dans 3 j" */
export function t(lang, path, vars) {
  const v = get(LANGS[lang], path) ?? get(LANGS[DEFAULT_LANG], path);
  if (v == null) return path;
  return typeof v === 'string' ? fill(v, vars) : v;
}

const safeLocale = l => { try { new Intl.DateTimeFormat(l); return l; } catch { return DEFAULT_LANG; } };

/* 0 = Monday … 6 = Sunday (1 Jan 2024 was a Monday) */
export const weekdayName = (locale, idx, style = 'long') =>
  new Intl.DateTimeFormat(safeLocale(locale), { weekday: style }).format(new Date(2024, 0, 1 + idx));
export const monthName = (locale, m, style = 'long') =>
  new Intl.DateTimeFormat(safeLocale(locale), { month: style }).format(new Date(2024, m - 1, 1));
export const shortDate = (locale, d) =>
  d.toLocaleDateString(safeLocale(locale), { day: 'numeric', month: 'short' });
