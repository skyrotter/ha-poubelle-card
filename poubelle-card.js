/*!
 * poubelle-card — carte Lovelace animée pour les jours de collecte des poubelles
 * Animated Lovelace card for bin collection days
 * https://github.com/skyrotter/ha-poubelle-card — MIT License
 */
const PB_VERSION = '1.3.0';

const PB_IMG = {
  grise: { lid: 'data:image/webp;base64,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', body: 'data:image/webp;base64,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' },
  jaune: { lid: 'data:image/webp;base64,UklGRhYJAhABXRUJQVlA4WAoAAAAQAAAAvQAAGwAAQUxQSAYDAAABAQaNJClKzx6Df8H3OAoi+j8B/N/5MP653UC7aWsZnE1uSBc7wgXSMZ268JYYBNk2nb/4c4KImACaskr3Ctq2YVKNP9ix6CEQMQETQGfbtmOSdN3vW9/M2rZt27Zt/wArN+L9A3as0LZ3bLeqPjx3UNUafHFETACxqFwDM1OFG6ZfAGKwBBiZgUYAYTaUAhTscuTep2+Ze/aoyqKzqhxeNo8oV8FYD0ZqoNiEslv3utG4Qk0MmvIkgdd7yoQNWz988y4zmcKmC1UDZQhSQVNXZVnV7kplpegCvarsuW7WuBobEqurvNFOaNEWTkJCNhhhe91LgD0RiYC0UWeLV6/F4UlIILGufrQPwSQlGeNJCXdIKQIgCzuB5QauuHiXYpMZWx8USEzWTKUBT5UA9Rmk2b83LodmLZy/fGSjpt4oL/4/6E/JExImNShHoNPOK3/+ahET3Oymu4/ZiP5IrGcjMbjsNqlihoZnrfzvn79/XjUEFHhQkg+s/4bkDHsffv1Vm8F/7/28Yvttlw3t2fv9/POPTtQgyKx3I/pEEhNeOO/LH36ZPwRJFqofOvP44omGLe+/cO99ISAxfiQcSazvbUAYCwkY2r/7/68l/Xv9uAUsfQgndn8NiMgZIqSQFVmNMhtaO+jA2KzPPj/sj+VbPHFIVdTFvNWaJp8zoyLnzEAjsIzYMDvcYVyL0B6Lk6cFls66B9MibQ9QAmL7M0yaFo0+e9mZVouYZKQ9/u0yrU4L6l3bC03++HIj+ZJ32wrRXu2znGyf3NmKNmtdTN5uG4grebuxVgOXqHnjehyT4HXcZiI99vwu8x99pVPHVCjXV47kaDPmtjfz0NenMcVx+DOIVuvvlw5ds+rlubNmo8nI2z52LS3ZI/M3mlTyY48QracxHQd5eC8mnlIqt3BdtJ7BZtUeE1GmhsJKtCWt3AaQJTmArU7d6eLzaU/untaXG4ADzjn4zCNEi1azydlAbjbb6eizLthqO4gmJbUmoEJc9fwJB+0INJBEuy5IPPQINCRE+zZWUDgg6gUAALAZAJ0BKr4AHAA+YSiORSQioRgMBgBABgSzAGVVqsRaTHbGrw+J5R75v+59W+3d8ynnl9H/1G+8+/4Dzbs0Y2q/Kz7ik2s8uWWCPtD9R/0foBewf2X/b+o1ObVizT/L3m0bsA3bFr9q5I4AD+Hk9ObZbbY79brLI4Ibldep7ZUzZjyENc6Ih76MXMWmcVtMsRP42KpCOhfqP66eLgBIf/VqQqEQPmH7aruLGjC7bSHiDjMmhqjyLFPU84bExiqd7WCXLJ0kcDozKTm40dH+w/+rhlm+jsQA/v7QIg/2qmyJ4U9CiZ+KcAoA9waE1y3SriWDVsjOTwJ3y/WjEyyW6nhAfK6qyX2kBvOY29xceF/L+ep7AXxlb8b8R4xZ3ZUI/6gPwmKltLhx030/EZ1I2Ga+ddpXUhsozeXQwyeoKTza4zW4OcGg47nF0G6xKuDL5qF/klDhdZaZv2oBa3yU6W3B5/6RLD9vVlrz8Ksa3VHDCu6KHBksE5BTiC02seHo4Ma2Ba7/EU7gqNkokqPE3s3jg7UmXkBy/pSUihy+w9kpEfn17Gt+7ktc+/Q0uqkSUZG/eHM4rDT0xGcdpzyfzMb8/UkZqE1mQ8Xhb4FM9qkpNI+BbWhnxqjFrMksYUK0rmlc1Q6f5wqHRbICcMk2yHAXlxIYkzIzF6CUR8PNSL59e/FVJXBWBM9e0kgpN2eAJ6iTx+gz67PAEGM0jFJLaZxJ3Jp3HOzaXt22ZnuCL6C07Ssc3vvpCzG/5E6TUCGzNRkYOY7yROl6x6xuB336InL9oPWoJinj7L96TzPuPo6G3m8x9/ID/sUgvmWlPHhJOB6N72EieZQ8JwV/+gG92cx5El+P2YB9nK24rmAftgg2ZjAs56hXs3SjoeWiQofS/4MSF/4l4lXXr+qUa53pVP3Te6yfZMMEdK5TuPSwpGrq9ZgcfM4MOIZzN3iXaesUW1TftLcKAHKcymbt5DYAaqPBC7mmhnGkxrKgncpTZ06xC5RngYuAArANkHWUUuLNc18/imF551sh1o/+ExW48yDX/Q/ztfvNGt47rQNu65/kDRROINrdkGMxViBaqnXht4peGHRIrqrzjRLex2yuOb/eSHt0f/Bns+hhov+ld83xOwmzCXSFvPm1n/pKGVLsTR0XHOGnH15uDvm7642NbeCTE6H+m/FWmI6Ewtff6AG5Hz7P3jEXjXdsXoRtSphUKn/87Fne3EJWXmvBl3Obb2dM2Tu8QB5tsVTLId9QXG1BLZv0Cx//76+DWGcVwi7VQ2Hbp7+7MnX7TmS8GUFsBFjbzLYqkjcdLxe53GjUwH5juUZIMvmiQP/bEDScZYUz+DaOn9OV907mrAZFkIagv6XZhzvY1I95xuWIX5EnSTIKxhu+Z5kJZgSU1VovMr1L3N1AeqkJ2jqWoS6iCJp5cl4spp46bc4XWwgEu7kgHRbQlIQGL+z4JBCIsFd9FO/0j9d077cA/Ki+qgk2fKO0rju1+DIETp9xyAZtlmRBZQtb0Ru7qARhpzOtZqH9YvQVOFOC9chJtE9NpJyPpvqgxqyMIBraaQBCeuTgtOd5vojEp+frPESeAyldKPz1MT9Z6its0UENFBw4ftSnBnXNV+DpjH0rWI4T7nEYVZHB+h1tE+SEHvOpRtWSSu1+j8tB9D8iUpYSP0RfebB0sgYQI4p60JBxpar6MZ3pfQblF2AHpf9Y7jdOPSan/XeOQ0wIU36b1m4Fl5o5ToB+Q0WNSOJc9qxoYOrb9IyXZPAzleHZE2tr5lY1dExlc/ayPRoiQuH3iMRmKY5hkj86MUAKfkpGgX4xO2+LsyfN/0Ve5z6fxnhu/4u8JH/iVrHFk1/QErvpsjx2kD/Tr1prKIBCotnRC/8/7sMuOzskMt3bdipOlobyXV+8Bt8wbkd3K2qZJHR1AX+OFbSyn2WliwePAEdxMDv/7gv4YXybvXs386Znfq1oXIVJ/9Ub4Zm7RRuauZorPDLzBTX3WdHBrwxSG8dw/9sqkqfZAAAA', body: 'data:image/webp;base64,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' },
};

/* Couleurs de poubelle : image de base + filtres CSS */
const PB_BINS = {
  grise:  { img: 'grise', color: '#9ea6b8', content: 'ordures' },
  noire:  { img: 'grise', color: '#7c8496', content: 'ordures',
            body: 'brightness(.42) contrast(1.15)', lid: 'brightness(.42) contrast(1.15)' },
  jaune:  { img: 'jaune', color: '#ffc107', content: 'recyclables' },
  verte:  { img: 'jaune', color: '#4caf50', content: 'verre', lid: 'hue-rotate(68deg) saturate(.85) brightness(.8)' },
  bleue:  { img: 'jaune', color: '#42a5f5', content: 'papier', lid: 'hue-rotate(165deg) saturate(1.1) brightness(.85)' },
  marron: { img: 'jaune', color: '#a1887f', content: 'biodechets', lid: 'hue-rotate(-14deg) saturate(.75) brightness(.5)' },
  rouge:  { img: 'jaune', color: '#ef5350', content: 'ordures', lid: 'hue-rotate(-40deg) saturate(1.4) brightness(.85)' },
  sac:    { img: 'sac', color: '#555555', content: 'ordures' },
};
const PB_ALIASES = { grey: 'grise', gray: 'grise', black: 'noire', yellow: 'jaune', green: 'verte',
  blue: 'bleue', brown: 'marron', red: 'rouge', gris: 'grise', noir: 'noire', vert: 'verte', bleu: 'bleue',
  bag: 'sac', bags: 'sac', sacs: 'sac' };

/* ---- contenu qui dépasse quand c'est plein ---- */
const PB_CONTENT = {
  ordures: `<svg viewBox="0 0 130 70" width="100%" height="100%" aria-hidden="true">
 <ellipse cx="34" cy="48" rx="30" ry="24" fill="#3a3f4b"/><path d="M28 24 l6 -12 l6 12z" fill="#3a3f4b"/><path d="M22 36 q10 -8 24 0" stroke="#6b7385" stroke-width="3" fill="none"/>
 <ellipse cx="88" cy="44" rx="32" ry="27" fill="#454b59"/><path d="M82 17 l7 -13 l7 13z" fill="#454b59"/><path d="M72 32 q15 -9 30 0" stroke="#727b8f" stroke-width="3" fill="none"/>
 <ellipse cx="60" cy="58" rx="24" ry="15" fill="#525a6b"/><path d="M40 20 q4 -14 12 -4" stroke="#e8c547" stroke-width="4" fill="none" stroke-linecap="round"/>
 <circle cx="112" cy="28" r="5" fill="#6b4f2c"/></svg>`,
  recyclables: `<svg viewBox="0 0 130 70" width="100%" height="100%" aria-hidden="true">
 <rect x="6" y="20" width="44" height="46" rx="3" fill="#b98a53" transform="rotate(-8 28 43)"/><path d="M8 26 l40 -6" stroke="#8d6538" stroke-width="3" transform="rotate(-8 28 43)"/>
 <rect x="54" y="8" width="16" height="56" rx="7" fill="#5aa9e6" opacity=".9"/><rect x="58" y="2" width="8" height="8" rx="2" fill="#2a6fb0"/><rect x="54" y="30" width="16" height="10" fill="#e6f2ff" opacity=".8"/>
 <rect x="78" y="24" width="18" height="40" rx="4" fill="#d9dde3" transform="rotate(12 87 44)"/><rect x="78" y="34" width="18" height="12" fill="#e53935" transform="rotate(12 87 44)"/>
 <rect x="98" y="16" width="28" height="48" rx="2" fill="#f1ede4" transform="rotate(10 112 40)"/><path d="M103 26h18M103 32h18M103 38h12" stroke="#9b978d" stroke-width="2" transform="rotate(10 112 40)"/></svg>`,
  verre: `<svg viewBox="0 0 130 70" width="100%" height="100%" aria-hidden="true">
 <rect x="14" y="14" width="18" height="52" rx="7" fill="#2e7d32" opacity=".9" transform="rotate(-10 23 40)"/><rect x="19" y="4" width="8" height="12" rx="2" fill="#1b5e20" transform="rotate(-10 23 40)"/>
 <rect x="44" y="22" width="22" height="44" rx="8" fill="#a5d6a7" opacity=".8"/><rect x="50" y="12" width="10" height="12" rx="2" fill="#81c784"/>
 <rect x="76" y="10" width="17" height="56" rx="7" fill="#6d4c41" opacity=".9" transform="rotate(8 84 38)"/><rect x="80" y="0" width="8" height="12" rx="2" fill="#4e342e" transform="rotate(8 84 38)"/>
 <rect x="100" y="28" width="22" height="38" rx="5" fill="#e0f2f1" opacity=".75"/><rect x="102" y="22" width="18" height="8" rx="2" fill="#b0bec5"/></svg>`,
  papier: `<svg viewBox="0 0 130 70" width="100%" height="100%" aria-hidden="true">
 <rect x="8" y="22" width="46" height="44" rx="3" fill="#c49a62" transform="rotate(-10 31 44)"/><path d="M10 28 l42 -6" stroke="#8d6538" stroke-width="3" transform="rotate(-10 31 44)"/>
 <rect x="50" y="12" width="34" height="50" rx="2" fill="#f5f2ea" transform="rotate(6 67 37)"/><path d="M56 22h22M56 29h22M56 36h22M56 43h14" stroke="#9b978d" stroke-width="2" transform="rotate(6 67 37)"/>
 <rect x="86" y="18" width="36" height="46" rx="2" fill="#dfe7f2" transform="rotate(14 104 41)"/><rect x="90" y="24" width="28" height="12" fill="#90a4ae" transform="rotate(14 104 41)"/></svg>`,
  biodechets: `<svg viewBox="0 0 130 70" width="100%" height="100%" aria-hidden="true">
 <ellipse cx="30" cy="50" rx="26" ry="20" fill="#6d8b3a"/><path d="M18 34 q12 -22 26 -4" fill="#8bc34a"/>
 <ellipse cx="72" cy="46" rx="24" ry="22" fill="#7a5a3a"/><circle cx="64" cy="36" r="9" fill="#e53935"/><path d="M64 27 q3 -6 7 -5" stroke="#4e342e" stroke-width="2.5" fill="none"/>
 <path d="M90 60 q10 -40 34 -46 q-6 30 -34 46z" fill="#9ccc65"/><path d="M92 58 q14 -22 30 -40" stroke="#558b2f" stroke-width="2" fill="none"/>
 <circle cx="44" cy="22" r="6" fill="#ffb74d"/></svg>`,
};

const PB_FX_FLY = `<span class="fly f1"></span><span class="fly f2"></span><span class="fly f3"></span>`;
const PB_FX_STINK = [1, 2, 3].map(i => `<span class="stink s${i}"><svg viewBox="0 0 14 40"><path d="M7 38 C0 30 14 24 7 16 C0 8 14 4 7 0" stroke="rgba(160,200,120,.75)" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg></span>`).join('');
const PB_FX_SPARK = [1, 2, 3].map(i => `<svg class="spark sp${i}" viewBox="0 0 20 20"><path d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8Z" fill="#b8f5bb"/></svg>`).join('');

/* ---- traductions ---- */
const PB_I18N = {
  fr: {
    days: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
    bin: { grise: 'Poubelle grise', noire: 'Poubelle noire', jaune: 'Poubelle jaune', verte: 'Poubelle verte',
           bleue: 'Poubelle bleue', marron: 'Poubelle marron', rouge: 'Poubelle rouge', sac: 'Sac poubelle' },
    emptied: 'Vidée', emptied_txt: "Vidée aujourd'hui ✅",
    today: 'Collecte', today_txt: "Collecte aujourd'hui 🚛",
    eve: 'Ce soir', eve_txt: 'À sortir ce soir ! 🌙',
    in_days: n => `Dans ${n} j`, next_day: d => `Collecte ${d}`, next_date: d => `Collecte le ${d}`,
    fill: 'Remplissage', unknown: 'Date inconnue', shifted: 'décalée (jour férié)',
  },
  en: {
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    bin: { grise: 'Grey bin', noire: 'Black bin', jaune: 'Yellow bin', verte: 'Green bin',
           bleue: 'Blue bin', marron: 'Brown bin', rouge: 'Red bin', sac: 'Trash bag' },
    emptied: 'Emptied', emptied_txt: 'Emptied today ✅',
    today: 'Pickup', today_txt: 'Pickup today 🚛',
    eve: 'Tonight', eve_txt: 'Put it out tonight! 🌙',
    in_days: n => `In ${n} d`, next_day: d => `Pickup on ${d}`, next_date: d => `Pickup on ${d}`,
    fill: 'Fill level', unknown: 'Unknown date', shifted: 'moved (public holiday)',
  },
};

const PB_DAY_NAMES = { lundi: 0, mardi: 1, mercredi: 2, jeudi: 3, vendredi: 4, samedi: 5, dimanche: 6,
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6,
  lun: 0, mar: 1, mer: 2, jeu: 3, ven: 4, sam: 5, dim: 6, mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };

const pbDay = d => (typeof d === 'string' && isNaN(d)) ? PB_DAY_NAMES[d.trim().toLowerCase()] : Number(d);
const pbMidnight = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
/* numéro de semaine ISO 8601 (celui des calendriers français) */
const pbIsoWeek = d => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y0) / 86400000 + 1) / 7); };
/* weeks: paires/even → 0, impaires/odd → 1, sinon toutes les semaines */
/* jours fériés français (métropole ; + Vendredi saint et 26/12 en Alsace-Moselle) */
const pbEaster = y => { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
  f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
  i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
  mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return new Date(y, mo - 1, da); };
const pbKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const PB_HOL_CACHE = {};
const pbHolidays = (y, alsace) => {
  const ck = y + (alsace ? 'a' : ''); if (PB_HOL_CACHE[ck]) return PB_HOL_CACHE[ck];
  const e = pbEaster(y), off = n => { const d = new Date(e); d.setDate(d.getDate() + n); return pbKey(d); };
  const set = new Set([`${y}-01-01`, off(1), `${y}-05-01`, `${y}-05-08`, off(39), off(50), `${y}-07-14`, `${y}-08-15`, `${y}-11-01`, `${y}-11-11`, `${y}-12-25`]);
  if (alsace) { set.add(off(-2)); set.add(`${y}-12-26`); }
  return (PB_HOL_CACHE[ck] = set);
};
const pbWeeks = w => { const v = String(w ?? '').toLowerCase();
  return ['paire', 'paires', 'even', 'pair'].includes(v) ? 0 : ['impaire', 'impaires', 'odd', 'impair'].includes(v) ? 1 : null; };

class PoubelleCard extends HTMLElement {
  static getStubConfig() { return { bin: 'jaune', days: [1], hour: 9 }; }

  /* éditeur visuel (HA 2024.11+) */
  static getConfigForm() {
    const binOpts = Object.keys(PB_BINS).map(b => ({ value: b, label: b }));
    const dayOpts = PB_I18N.fr.days.map((d, i) => ({ value: String(i), label: d }));
    return {
      schema: [
        { name: 'bin', required: true, selector: { select: { mode: 'dropdown', options: binOpts } } },
        { name: 'name', selector: { text: {} } },
        { name: 'color', selector: { text: {} } },
        { name: 'entity', selector: { entity: { domain: ['sensor', 'calendar', 'input_datetime'] } } },
        { name: 'days', selector: { select: { multiple: true, options: dayOpts } } },
        { name: 'weeks', selector: { select: { mode: 'dropdown', options: [
          { value: 'toutes', label: 'Toutes les semaines / Every week' },
          { value: 'paires', label: 'Semaines paires / Even weeks' },
          { value: 'impaires', label: 'Semaines impaires / Odd weeks' }] } } },
        { name: 'holidays', selector: { select: { mode: 'dropdown', options: [
          { value: 'aucun', label: 'Jours fériés ignorés / Ignore holidays' },
          { value: 'report', label: 'Reportée au lendemain / Moved to next day' },
          { value: 'decalage', label: 'Décalage d\'un jour jusqu\'à la fin de la semaine / Rest of week +1 day' },
          { value: 'annule', label: 'Annulée / Cancelled' }] } } },
        { name: 'region', selector: { select: { mode: 'dropdown', options: [
          { value: 'metropole', label: 'France métropolitaine' }, { value: 'alsace-moselle', label: 'Alsace-Moselle' }] } } },
        { type: 'grid', name: '', schema: [
          { name: 'hour', selector: { number: { min: 0, max: 23.5, step: 0.5, mode: 'box' } } },
          { name: 'interval', selector: { number: { min: 1, max: 60, mode: 'box' } } },
          { name: 'scale', selector: { number: { min: 0.3, max: 1.2, step: 0.01, mode: 'slider' } } },
          { name: 'headroom', selector: { number: { min: 0, max: 70, mode: 'box' } } },
        ] },
        { type: 'grid', name: '', schema: [
          { name: 'compact', selector: { boolean: {} } },
          { name: 'show_meter', selector: { boolean: {} } },
          { name: 'show_status', selector: { boolean: {} } },
          { name: 'theme_background', selector: { boolean: {} } },
        ] },
        { name: 'language', selector: { select: { mode: 'dropdown', options: [
          { value: 'auto', label: 'auto' }, { value: 'fr', label: 'Français' }, { value: 'en', label: 'English' }] } } },
      ],
      computeLabel: s => ({
        bin: 'Couleur / Bin', name: 'Nom / Name', color: 'Couleur hex (#\u2026) / Hex color', entity: 'Entité (optionnel) / Entity (optional)',
        days: 'Jours de collecte / Pickup days', weeks: 'Semaines / Weeks', holidays: 'Jours fériés / Public holidays', region: 'Calendrier des fériés / Holiday calendar', hour: 'Heure de passage / Pickup hour',
        interval: 'Jours entre 2 collectes / Days between pickups', scale: 'Taille / Size',
        headroom: 'Marge haute / Headroom', compact: 'Compact', show_meter: 'Jauge / Meter',
        show_status: 'Texte de statut / Status text', theme_background: 'Fond du thème HA / HA theme background',
        language: 'Langue / Language',
      }[s.name]),
    };
  }

  setConfig(c) {
    if (!c || !c.bin) throw new Error('poubelle-card : indique « bin » (grise, noire, jaune, verte, bleue, marron, rouge, sac)');
    let bin = String(c.bin).toLowerCase();
    bin = PB_ALIASES[bin] || bin;
    if (bin === 'grise' && c.tint === 'noire') bin = 'noire'; // compatibilité v0
    if (!PB_BINS[bin]) throw new Error(`poubelle-card : bin « ${c.bin} » inconnue`);
    const days = (c.days ?? (c.entity ? [] : null));
    if (!c.entity && (!Array.isArray(days) || !days.length))
      throw new Error('poubelle-card : indique « days » (ex. [1, 4]) ou « entity »');
    this._bin = bin;
    this._isSac = (bin === 'sac');
    this._c = Object.assign({ hour: 9, interval: 7, scale: 0.62, headroom: 70, language: 'auto' }, c);
    this._days = (days || []).map(pbDay).filter(d => d >= 0 && d <= 6);
    this._build();
  }

  set hass(h) {
    const old = this._hass;
    this._hass = h;
    const e = this._c && this._c.entity;
    if (!old || (e && old.states[e] !== h.states[e]) || (old.locale?.language !== h.locale?.language)) this._render();
  }

  getCardSize() { return 4; }
  getGridOptions() { return { columns: 6, rows: 'auto', min_columns: 3 }; }
  connectedCallback() { clearInterval(this._t); this._t = setInterval(() => this._render(), 60000); this._render(); }
  disconnectedCallback() { clearInterval(this._t); }

  _t_() {
    let l = this._c.language;
    if (!l || l === 'auto') l = (this._hass?.locale?.language || this._hass?.language || navigator.language || 'fr');
    return PB_I18N[String(l).slice(0, 2)] || PB_I18N.en;
  }

  _build() {
    const c = this._c, s = Number(c.scale), hr = Number(c.headroom ?? 70), B = PB_BINS[this._bin];
    const color = c.color || B.color;
    const content = PB_CONTENT[c.content] || PB_CONTENT[B.content];
    const bodyF = c.body_filter || B.body || '', lidF = c.lid_filter || B.lid || '';
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>
    :host{display:block}
    ha-card{background:var(--poubelle-card-background,linear-gradient(170deg,rgba(30,36,56,.75),rgba(20,24,38,.7)));backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--poubelle-card-border-color,rgba(255,255,255,.08));border-radius:var(--ha-card-border-radius,22px);padding:12px 12px 14px;display:grid;gap:8px;justify-items:center;overflow:hidden;transition:box-shadow .6s,border-color .6s;animation:fadeUp .6s ease both;color:var(--poubelle-card-text-color,#eef1f8)}
    ${c.theme_background ? 'ha-card{background:var(--ha-card-background,var(--card-background-color));border:var(--ha-card-border-width,1px) solid var(--ha-card-border-color,var(--divider-color));color:var(--primary-text-color)}' : ''}
    ha-card.clickable{cursor:pointer}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
    .card.veille{border-color:rgba(255,90,78,.55);box-shadow:0 0 0 1px rgba(255,90,78,.25),0 10px 34px rgba(255,90,78,.18)}
    .card.videe{border-color:rgba(76,175,80,.5);box-shadow:0 10px 34px rgba(76,175,80,.16)}
    .head{width:100%;display:flex;justify-content:space-between;align-items:center;gap:6px}
    .name{font-weight:700;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .pill{font-weight:600;font-size:11px;padding:4px 8px;border-radius:999px;background:rgba(127,127,127,.14);color:var(--poubelle-card-secondary-color,#9aa3b8);white-space:nowrap}
    .pill.veille{background:rgba(255,90,78,.18);color:#ffb3ad}.pill.jour{background:rgba(111,168,255,.18);color:#bcd4ff}.pill.videe{background:rgba(76,175,80,.18);color:#a8e0aa}
    .scaler{width:${150 * s}px;height:${(253 + hr) * s}px;position:relative}
    .stage-wrap{position:absolute;left:0;top:${-(70 - hr) * s}px;transform:scale(${s});transform-origin:0 0;width:150px;height:${253 + 70}px}
    /* ---- la poubelle ---- */
    .stage{position:relative;width:150px;height:253px;margin-top:70px}
    .bin{position:absolute;inset:0;transform-origin:50% 100%}
    .body{position:absolute;left:0;bottom:0;width:150px;z-index:2;filter:${bodyF} drop-shadow(0 14px 16px rgba(0,0,0,.45))}
    .trash{position:absolute;left:12px;right:12px;top:-44px;height:80px;z-index:1;transition:transform 1.1s cubic-bezier(.3,1.4,.5,1)}
    .lid{position:absolute;left:0;top:${B.img === 'jaune' ? 3 : 0}px;width:150px;z-index:3;transform-origin:92% 100%;transition:transform 1.1s cubic-bezier(.3,1.4,.5,1);${lidF ? `filter:${lidF};` : ''}}
    .shadow{position:absolute;left:10px;right:10px;bottom:-8px;height:14px;border-radius:50%;background:rgba(0,0,0,.45);filter:blur(6px);z-index:0}
    /* ---- mode sac ---- */
    .sac-svg{position:absolute;inset:0;width:150px;height:253px;z-index:2;overflow:visible}
    .sac-body-wrap{transform-origin:75px 248px;transition:transform 1.1s cubic-bezier(.3,1.4,.5,1)}
    .sac-knot{transition:opacity .4s}
    .card.plein .sac-body-wrap{animation:wobble 2.6s ease-in-out infinite}
    .card.veille .bin{animation:shake 1.8s ease-in-out infinite}
    .card.jour .bin{animation:hop 1.1s ease-in-out infinite}
    .card.plein .trash{animation:wobble 2.6s ease-in-out infinite}
    @keyframes shake{0%,55%,100%{transform:rotate(0)}60%{transform:rotate(-4deg)}66%{transform:rotate(3.5deg)}72%{transform:rotate(-3deg)}78%{transform:rotate(2deg)}84%{transform:rotate(-1deg)}}
    @keyframes hop{0%,100%{transform:translateY(0)}45%{transform:translateY(-8px)}}
    @keyframes wobble{0%,100%{rotate:0deg}50%{rotate:-1.5deg}}
    /* mouches + odeurs quand c'est plein */
    .fx{position:absolute;inset:-95px -20px auto -20px;height:110px;z-index:4;pointer-events:none;opacity:0;transition:opacity .6s}
    .card.plein .fx{opacity:1}
    .fly{position:absolute;width:5px;height:5px;border-radius:50%;background:#0b0b0b;box-shadow:0 0 0 1px rgba(255,255,255,.25)}
    .fly::before,.fly::after{content:"";position:absolute;top:-3px;width:5px;height:4px;border-radius:50%;background:rgba(220,235,255,.55)}
    .fly::before{left:-3px}.fly::after{right:-3px}
    .f1{animation:orbit1 3.2s linear infinite}.f2{animation:orbit2 2.6s linear infinite}.f3{animation:orbit1 4.1s linear infinite reverse}
    @keyframes orbit1{0%{transform:translate(40px,60px)}25%{transform:translate(110px,30px)}50%{transform:translate(160px,70px)}75%{transform:translate(90px,95px)}100%{transform:translate(40px,60px)}}
    @keyframes orbit2{0%{transform:translate(150px,40px)}33%{transform:translate(70px,20px)}66%{transform:translate(120px,90px)}100%{transform:translate(150px,40px)}}
    .stink{position:absolute;bottom:18px;width:14px;height:40px;opacity:0;animation:rise 2.8s ease-in infinite}
    .stink svg{width:100%;height:100%}
    .s1{left:60px}.s2{left:100px;animation-delay:1s}.s3{left:135px;animation-delay:1.8s}
    @keyframes rise{0%{transform:translateY(20px);opacity:0}30%{opacity:.8}100%{transform:translateY(-30px);opacity:0}}
    /* étincelles quand c'est vidé */
    .spark{position:absolute;z-index:4;width:14px;height:14px;opacity:0;pointer-events:none}
    .card.videe .spark{animation:twinkle 2.4s ease-in-out infinite}
    .sp1{left:6px;top:40px}.sp2{right:8px;top:70px;animation-delay:.8s!important}.sp3{left:40px;top:4px;animation-delay:1.5s!important}
    @keyframes twinkle{0%,100%{opacity:0;transform:scale(.4) rotate(0)}40%{opacity:1;transform:scale(1) rotate(45deg)}}
    .status{font-size:13px;font-weight:600;text-align:center;min-height:1.3em}
    .meter{width:100%;display:grid;gap:4px}
    .meter-top{display:flex;justify-content:space-between;color:var(--poubelle-card-secondary-color,#9aa3b8);font-size:11px;font-variant-numeric:tabular-nums}
    .bar{height:6px;border-radius:99px;background:rgba(127,127,127,.14);overflow:hidden}
    .bar i{display:block;height:100%;border-radius:99px;transition:width 1.1s ease;background:${color}}
    ${c.show_meter === false ? '.meter{display:none}' : ''}
    ${c.show_status === false ? '.status{display:none}' : ''}
    ${c.compact ? 'ha-card{padding:8px 10px 10px;gap:4px}.status{font-size:12px}' : ''}
    @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
    </style>
    <ha-card class="card${c.entity ? ' clickable' : ''}"><div class="head"><span class="name"></span><span class="pill"></span></div>
     <div class="scaler"><div class="stage-wrap"><div class="stage">
      <div class="fx">${PB_FX_FLY}${PB_FX_STINK}</div>${PB_FX_SPARK}<div class="shadow"></div>
      <div class="bin">${this._isSac ? `<svg class="sac-svg" viewBox="0 0 150 253" xmlns="http://www.w3.org/2000/svg">
       <g class="sac-body-wrap"><path d="M30 248 C28 253 122 253 120 248 L128 130 Q130 95 75 88 Q20 95 22 130 Z" fill="${color}" stroke="rgba(0,0,0,.2)" stroke-width="1"/>
       <path d="M55 130 Q54 180 56 245" stroke="rgba(255,255,255,.04)" stroke-width="2" fill="none"/><path d="M95 130 Q96 185 94 245" stroke="rgba(255,255,255,.04)" stroke-width="2" fill="none"/>
       <path d="M40 160 Q60 154 80 160 Q100 166 115 158" stroke="rgba(255,255,255,.05)" stroke-width="1.5" fill="none"/><path d="M38 195 Q58 188 78 195 Q98 202 118 193" stroke="rgba(255,255,255,.05)" stroke-width="1.5" fill="none"/><path d="M42 225 Q62 219 82 226 Q100 232 116 224" stroke="rgba(255,255,255,.04)" stroke-width="1.5" fill="none"/>
       <ellipse cx="52" cy="175" rx="12" ry="35" fill="rgba(255,255,255,.06)" transform="rotate(-6 52 175)"/><ellipse cx="98" cy="190" rx="8" ry="25" fill="rgba(255,255,255,.03)" transform="rotate(5 98 190)"/>
       <path d="M48 93 Q55 86 63 89 L87 89 Q95 86 102 93" fill="${color}"/><path d="M48 93 Q55 86 63 89 L87 89 Q95 86 102 93" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="1"/>
       <g class="sac-knot" opacity="0"><ellipse cx="75" cy="80" rx="14" ry="6" fill="${color}"/><ellipse cx="75" cy="80" rx="14" ry="6" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="0.5"/><path d="M62 78 Q48 55 58 52 Q64 50 66 58 L68 75" stroke="#e8503a" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".9"/><path d="M62 78 Q48 55 58 52 Q64 50 66 58 L68 75" stroke="#ff7b6a" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".4"/><path d="M88 78 Q102 55 92 52 Q86 50 84 58 L82 75" stroke="#e8503a" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".9"/><path d="M88 78 Q102 55 92 52 Q86 50 84 58 L82 75" stroke="#ff7b6a" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".4"/><ellipse cx="75" cy="76" rx="8" ry="5" fill="#d4443a"/><ellipse cx="75" cy="75" rx="5" ry="3" fill="#e8605a" opacity=".6"/></g>
       </g></svg>`
      : `<div class="trash">${content}</div>
       <img class="body" src="${PB_IMG[B.img].body}" alt=""><img class="lid" src="${PB_IMG[B.img].lid}" alt="">`}</div>
     </div></div></div>
     <div class="status"></div>
     <div class="meter"><div class="meter-top"><span class="ml"></span><span class="pct"></span></div><div class="bar"><i></i></div></div>
    </ha-card>`;
    this.shadowRoot.querySelector('ha-card').addEventListener('click', () => {
      if (!this._c.entity) return;
      this.dispatchEvent(new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId: this._c.entity } }));
    });
    this._render();
  }

  /* Date de la prochaine collecte lue depuis une entité (null si inconnue) */
  _entityDate() {
    const st = this._hass?.states?.[this._c.entity];
    if (!st) return null;
    const a = st.attributes || {}, s = st.state;
    const today = pbMidnight(new Date());
    const fromDays = n => { const d = new Date(today); d.setDate(d.getDate() + Number(n)); return d; };
    if (a.daysTo !== undefined && !isNaN(a.daysTo)) return fromDays(a.daysTo);          // Waste Collection Schedule
    if (st.entity_id.startsWith('calendar.')) return a.start_time ? new Date(String(a.start_time).replace(' ', 'T')) : null;
    if (st.entity_id.startsWith('input_datetime.') && a.year) return new Date(a.year, a.month - 1, a.day);
    if (s === 'unknown' || s === 'unavailable' || s === '' || s == null) return null;
    if (!isNaN(s)) return fromDays(s);                                                   // nombre de jours
    const lower = String(s).toLowerCase();
    if (['today', "aujourd'hui", 'aujourdhui'].includes(lower)) return today;
    if (['tomorrow', 'demain'].includes(lower)) return fromDays(1);
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? s + 'T00:00:00' : s);            // date / timestamp
    return isNaN(d) ? null : d;
  }

  /* Calcule l'état : { state, n, fill } */
  _compute() {
    const c = this._c, now = new Date(), wd = (now.getDay() + 6) % 7;
    const h = now.getHours() + now.getMinutes() / 60, H = Number(c.hour);
    if (c.entity) {
      const d = this._entityDate();
      if (!d) return { state: 'inconnu', n: null, fill: 0 };
      const n = Math.round((pbMidnight(d) - pbMidnight(now)) / 86400000);
      const I = Math.max(1, Number(c.interval) || 7);
      if (n < 0) return { state: 'inconnu', n: null, fill: 0 };
      if (n === 0) return h < H ? { state: 'jour', n, fill: 1 } : { state: 'videe', n, fill: 0 };
      if (n >= I) return { state: 'videe', n, fill: 0 };
      return { state: n === 1 ? 'veille' : '', n, fill: Math.min(1, Math.max(0, 1 - n / I)), date: d };
    }
    // jours fixes (+ semaines paires / impaires, + jours fériés) : prochaine et dernière collecte
    const W = pbWeeks(c.weeks), today = pbMidnight(now);
    const at = k => { const d = new Date(today); d.setDate(d.getDate() + k); return d; };
    const plan = d => this._days.includes((d.getDay() + 6) % 7) && (W === null || pbIsoWeek(d) % 2 === W);
    const mode = String(c.holidays || 'aucun').toLowerCase(), alsace = /alsace|moselle/i.test(String(c.region || ''));
    const extra = new Set((c.holiday_dates || []).map(String));
    const hol = d => pbHolidays(d.getFullYear(), alsace).has(pbKey(d)) || extra.has(pbKey(d));
    // date réelle d'une collecte prévue le jour d (null = annulée)
    const eff = d => {
      if (['report', 'reportee', 'reportée', 'next_day', 'shift'].includes(mode)) {
        const x = new Date(d); let guard = 0; while ((hol(x) || x.getDay() === 0) && guard++ < 7) x.setDate(x.getDate() + 1); return x;
      }
      if (['decalage', 'décalage', 'week', 'semaine'].includes(mode)) {
        const mon = new Date(d); mon.setDate(mon.getDate() - ((d.getDay() + 6) % 7));
        for (const x = new Date(mon); x <= d; x.setDate(x.getDate() + 1)) if (x.getDay() !== 0 && hol(x)) { const y = new Date(d); y.setDate(y.getDate() + 1); return y; }
        return d;
      }
      if (['annule', 'annulée', 'annulee', 'skip', 'cancel'].includes(mode)) return hol(d) ? null : d;
      return d;
    };
    const list = [];
    for (let k = -35; k <= 35; k++) { const d = at(k); if (!plan(d)) continue; const e = eff(d); if (!e) continue;
      list.push({ k: Math.round((pbMidnight(e) - today) / 86400000), moved: pbKey(e) !== pbKey(d) }); }
    const next = list.filter(x => x.k > 0 || (x.k === 0 && h < H)).sort((a, b) => a.k - b.k)[0];
    const last = list.filter(x => x.k < 0 || (x.k === 0 && h >= H)).sort((a, b) => b.k - a.k)[0];
    if (!next || !last) return { state: 'inconnu', n: null, fill: 0 };
    const n = next.k, l = -last.k, moved = next.moved;
    const fill = (l + n) ? l / (l + n) : 0;
    if (l === 0) return { state: 'videe', n, fill: 0 };
    if (n === 0) return { state: 'jour', n, fill: 1, moved };
    return { state: n === 1 ? 'veille' : '', n, fill, moved };
  }

  _render() {
    const r = this.shadowRoot; if (!r || !this._c) return;
    const q = x => r.querySelector(x), T = this._t_(), now = new Date(), wd = (now.getDay() + 6) % 7;
    const { state, n, fill, moved } = this._compute();
    let pill, text;
    if (state === 'inconnu') { pill = '—'; text = T.unknown; }
    else if (state === 'videe') { pill = T.emptied; text = T.emptied_txt; }
    else if (state === 'jour') { pill = T.today; text = T.today_txt; }
    else if (state === 'veille') { pill = T.eve; text = T.eve_txt; }
    else {
      pill = T.in_days(n);
      if (n < 7) text = T.next_day(T.days[(wd + n) % 7]);
      else { const d = new Date(now); d.setDate(d.getDate() + n);
        text = T.next_date(d.toLocaleDateString(this._hass?.locale?.language || undefined, { day: 'numeric', month: 'short' })); }
    }
    const cls = state === 'inconnu' ? '' : state;
    q('ha-card').className = 'card ' + cls + (fill >= 0.6 && state !== 'videe' ? ' plein' : '') + (this._c.entity ? ' clickable' : '');
    q('.name').textContent = this._c.name || T.bin[this._bin];
    const p = q('.pill'); p.className = 'pill ' + cls; p.textContent = pill;
    q('.status').textContent = moved && state !== 'videe' ? `${text} · ${T.shifted}` : text;
    q('.ml').textContent = T.fill;
    const f = state === 'videe' ? 0 : (state === 'jour' ? 1 : fill), pct = Math.round(f * 100);
    q('.pct').textContent = pct + ' %'; q('.bar i').style.width = pct + '%';
    if (this._isSac) {
      const sy = 0.3 + f * 0.7, sx = 0.85 + f * 0.15;
      const bw = q('.sac-body-wrap'); if (bw) bw.style.transform = `scaleY(${sy}) scaleX(${sx})`;
      const kn = q('.sac-knot'); if (kn) kn.style.opacity = (state === 'veille' || state === 'jour') ? '1' : '0';
    } else {
      const peek = f * 72;
      q('.trash').style.transform = `translateY(${86 - peek}px)`;
      q('.lid').style.transform = f > 0.25 ? `translateY(${-peek * 0.85}px) rotate(${-f * 26}deg)` : 'none';
    }
  }
}

if (!customElements.get('poubelle-card')) customElements.define('poubelle-card', PoubelleCard);
window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === 'poubelle-card'))
  window.customCards.push({ type: 'poubelle-card', name: 'Poubelle Card', preview: true,
    description: 'Poubelle ou sac animé qui se remplit et se vide selon le jour de collecte / Animated bin or bag for collection days',
    documentationURL: 'https://github.com/skyrotter/ha-poubelle-card' });
console.info(`%c POUBELLE-CARD %c v${PB_VERSION} `, 'background:#ffc107;color:#000;font-weight:700', 'background:#333;color:#fff');
