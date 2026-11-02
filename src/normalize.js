/* Config values are English (canonical). French and older English spellings stay accepted
 * as aliases forever, so existing dashboards keep working. */

const table = groups => {
  const out = {};
  for (const [canon, aliases] of Object.entries(groups)) for (const a of [canon, ...aliases]) out[a] = canon;
  return out;
};

export const BIN_ALIASES = table({
  grey: ['gray', 'grise', 'gris'],
  black: ['noire', 'noir'],
  yellow: ['jaune'],
  green: ['verte', 'vert'],
  blue: ['bleue', 'bleu'],
  brown: ['marron', 'brune', 'brun'],
  red: ['rouge'],
});
export const BINS = ['grey', 'black', 'yellow', 'green', 'blue', 'brown', 'red'];

export const CONTAINER_ALIASES = table({
  wheelie_bin: ['bac', 'bin', 'wheelie', 'conteneur'],
  bag: ['bags', 'sac', 'sacs'],
  bulky: ['bulky_waste', 'encombrants', 'encombrant'],
});
export const CONTAINERS = ['wheelie_bin', 'bag', 'bulky'];

export const WEEKS_ALIASES = table({
  all: ['every', 'toutes', 'toute', 'tous'],
  even: ['paires', 'paire', 'pair'],
  odd: ['impaires', 'impaire', 'impair'],
});
export const WEEKS = ['all', 'even', 'odd'];

/* next_day changed meaning in 2.0: it now means the next calendar day.
   The old "next working day" behaviour is next_work_day (French report / shift keep mapping to it). */
export const HOLIDAY_ALIASES = table({
  none: ['aucun', 'ignore', 'off'],
  next_day: [],
  next_work_day: ['report', 'reportee', 'reportée', 'shift', 'next_workday', 'next_working_day'],
  shift_week: ['skip_week', 'next_week'],
  shift_rest_of_week: ['decalage', 'décalage', 'week', 'semaine'],
  cancel: ['annule', 'annulée', 'annulee', 'skip'],
});
export const HOLIDAY_MODES = ['none', 'next_day', 'next_work_day', 'shift_week', 'shift_rest_of_week', 'cancel'];
export const HOLIDAY_NEEDS_WORKDAY = new Set(['next_work_day']);

export const DAY_NAMES = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
  mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6,
  lundi: 0, mardi: 1, mercredi: 2, jeudi: 3, vendredi: 4, samedi: 5, dimanche: 6,
  lun: 0, mar: 1, mer: 2, jeu: 3, ven: 4, sam: 5, dim: 6,
};
export const MONTH_NAMES = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
  janvier: 1, fevrier: 2, février: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, aout: 8, août: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12, décembre: 12,
  fev: 2, fév: 2, avr: 4, juil: 7, déc: 12,
};

const lower = v => String(v ?? '').trim().toLowerCase();
const isName = v => typeof v === 'string' && v.trim() !== '' && isNaN(v);
export const parseDay = d => (isName(d) ? DAY_NAMES[lower(d)] : Number(d));
export const parseMonth = m => (isName(m) ? MONTH_NAMES[lower(m)] : Number(m));

export const normBin = v => BIN_ALIASES[lower(v)];
export const normContainer = v => (v == null || v === '' ? undefined : CONTAINER_ALIASES[lower(v)]);
export const normWeeks = v => (v == null || v === '' ? undefined : WEEKS_ALIASES[lower(v)]);
export const normHolidays = v => (v == null || v === '' ? undefined : HOLIDAY_ALIASES[lower(v)]);

/* Returns a copy of the config with canonical English values (unknown values are left as written,
   so setConfig can report them). Used by both the card and the visual editor. */
export function normalizeConfig(c) {
  const out = { ...c };
  if (out.bin != null) {
    let b = normBin(out.bin) ?? out.bin;
    if (b === 'grey' && ['noire', 'black'].includes(lower(out.tint))) b = 'black'; // v0 compatibility
    out.bin = b;
  }
  delete out.tint;
  for (const [k, fn] of [['container', normContainer], ['weeks', normWeeks], ['holidays', normHolidays]]) {
    if (out[k] == null || out[k] === '') continue;
    const v = fn(out[k]);
    if (v) out[k] = v;
  }
  if (out.container === 'wheelie_bin') delete out.container; // default
  if (out.weeks === 'all') delete out.weeks;                 // default
  if (out.holidays === 'none') delete out.holidays;          // default
  if ('region' in out) delete out.region;                    // French holiday regions: replaced by the Holiday integration
  return out;
}
