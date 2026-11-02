/* Pure scheduling logic (no DOM, no hass) so it can be unit-tested with node --test. */
import { parseDay, parseMonth, normWeeks, normHolidays } from './normalize.js';

export const DAY_MS = 86400000;
export const midnight = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + (Number(n) || 0)); return x; };
export const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/* whole days between two dates, safe across DST changes */
export const daysBetween = (a, b) => Math.round((midnight(b) - midnight(a)) / DAY_MS);
/* 0 = Monday … 6 = Sunday */
export const weekdayIdx = d => (d.getDay() + 6) % 7;
export const mondayOf = d => addDays(midnight(d), -weekdayIdx(d));
/* ISO 8601 week number (used by weeks: even / odd) */
export const isoWeek = d => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - y0) / DAY_MS + 1) / 7);
};
/* "2026-11-04" → local midnight (never UTC); anything else → Date or null */
export const parseDate = v => {
  if (v == null || v === '') return null;
  if (v instanceof Date) return isNaN(v) ? null : midnight(v);
  const s = String(v).trim();
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : new Date(s);
  return isNaN(d) ? null : midnight(d);
};

/* Turns a (normalised) card config into the rule used by computeFixed. */
export function buildRule(c) {
  const mday = c.month_day != null && c.month_day !== ''
    ? [].concat(c.month_day).map(Number).filter(x => x >= 1 && x <= 31) : [];
  const startDate = parseDate(c.start_date);
  let days = [].concat(c.days ?? []).map(parseDay).filter(d => d >= 0 && d <= 6);
  if (!days.length && startDate && !mday.length) days = [weekdayIdx(startDate)];
  const months = [].concat(c.months ?? []).map(parseMonth).filter(m => m >= 1 && m <= 12);
  const monthWeeks = (Array.isArray(c.month_week) ? c.month_week : String(c.month_week ?? '').split(/[\s,;]+/))
    .map(x => String(x).trim().toLowerCase())
    .map(x => (['last', 'dernier', 'derniere', 'dernière', '-1'].includes(x) ? -1 : (Number(x) >= 1 && Number(x) <= 5 ? Number(x) : 0)))
    .filter(Boolean);
  const w = normWeeks(c.weeks);
  return {
    days, mday, months, monthWeeks, startDate,
    every: Math.max(1, Math.round(Number(c.every) || 1)),
    weeks: w === 'even' ? 0 : w === 'odd' ? 1 : null,
    holidays: normHolidays(c.holidays) || 'none',
    hour: Number(c.hour ?? 9),
  };
}

/* Is a collection planned on day d (before any holiday adjustment)? */
export function planned(rule, d) {
  if (rule.months.length && !rule.months.includes(d.getMonth() + 1)) return false;
  if (rule.mday.length) {
    const lastDom = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return rule.mday.some(x => d.getDate() === Math.min(x, lastDom));
  }
  if (!rule.days.includes(weekdayIdx(d))) return false;
  if (rule.monthWeeks.length) {
    const isLast = addDays(d, 7).getMonth() !== d.getMonth();
    return rule.monthWeeks.some(w => (w === -1 ? isLast : Math.ceil(d.getDate() / 7) === w));
  }
  if (rule.startDate) {
    // whole weeks between the anchor's week and d's week (Monday-based), every N weeks
    const wk = Math.round(daysBetween(mondayOf(rule.startDate), mondayOf(d)) / 7);
    return ((wk % rule.every) + rule.every) % rule.every === 0;
  }
  return rule.weeks === null || isoWeek(d) % 2 === rule.weeks;
}

/* Actual date of a collection planned on d, or null if cancelled.
   ctx.isHoliday(d) → bool; ctx.isWorkday(d) → bool, or null when no Workday calendar is available. */
export function effective(rule, d, ctx) {
  const hol = x => !!ctx.isHoliday(x);
  switch (rule.holidays) {
    case 'next_day':
      return hol(d) ? addDays(d, 1) : d;
    case 'next_work_day': {
      if (!hol(d)) return d;
      for (let x = addDays(d, 1), i = 0; i < 14; i++, x = addDays(x, 1)) {
        const wd = ctx.isWorkday(x);
        // without a Workday calendar: skip holidays and Sundays (pre-2.0 behaviour)
        if (wd === null ? (!hol(x) && x.getDay() !== 0) : (wd && !hol(x))) return x;
      }
      return addDays(d, 1);
    }
    case 'shift_week': {
      let x = d;
      for (let i = 0; i < 5 && hol(x); i++) x = addDays(x, 7);
      return x;
    }
    case 'shift_rest_of_week': {
      // a holiday earlier in the same week (or on the day) pushes this collection back one day
      for (let x = mondayOf(d); x <= d; x = addDays(x, 1)) if (x.getDay() !== 0 && hol(x)) return addDays(d, 1);
      return d;
    }
    case 'cancel':
      return hol(d) ? null : d;
    default:
      return d;
  }
}

/* Collections around today: [{ k: days from today, moved: bool }], sorted, de-duplicated. */
export function collections(rule, now, ctx, range) {
  const today = midnight(now);
  const K = range ?? (rule.months.length ? 370 : 75);
  const seen = new Map();
  for (let k = -K; k <= K; k++) {
    const d = addDays(today, k);
    if (!planned(rule, d)) continue;
    const e = effective(rule, d, ctx);
    if (!e) continue;
    const ek = daysBetween(today, e), moved = dayKey(e) !== dayKey(d);
    // a moved collection landing on a regular one counts once, as regular
    const prev = seen.get(ek);
    seen.set(ek, { k: ek, moved: prev ? prev.moved && moved : moved });
  }
  return [...seen.values()].sort((a, b) => a.k - b.k);
}

/* Card state from a fixed schedule: { state: ''|'eve'|'today'|'emptied'|'unknown', n, fill, moved } */
export function computeFixed(rule, now, ctx) {
  const h = now.getHours() + now.getMinutes() / 60, H = rule.hour;
  const list = collections(rule, now, ctx);
  const next = list.find(x => x.k > 0 || (x.k === 0 && h < H));
  const last = [...list].reverse().find(x => x.k < 0 || (x.k === 0 && h >= H));
  if (!next || !last) return { state: 'unknown', n: null, fill: 0 };
  const n = next.k, l = -last.k, moved = next.moved;
  const fill = (l + n) ? l / (l + n) : 0;
  if (l === 0) return { state: 'emptied', n, fill: 0 };
  if (n === 0) return { state: 'today', n, fill: 1, moved };
  return { state: n === 1 ? 'eve' : '', n, fill, moved };
}

/* Expands calendar.get_events events into a Set of local "YYYY-MM-DD" keys (all-day end is exclusive). */
export function eventDays(events) {
  const set = new Set();
  for (const ev of events || []) {
    const s = String(ev.start?.date || ev.start?.dateTime || ev.start || '');
    const e = String(ev.end?.date || ev.end?.dateTime || ev.end || '');
    const allDay = /^\d{4}-\d{2}-\d{2}$/.test(s);
    const a = parseDate(s);
    if (!a) continue;
    let b = parseDate(e);
    if (!b || b <= a) b = addDays(a, 1);
    else if (!allDay && (new Date(e) - b) > 0) b = addDays(b, 1); // timed event ending mid-day covers that day
    for (let x = a, i = 0; x < b && i < 400; x = addDays(x, 1), i++) set.add(dayKey(x));
  }
  return set;
}
