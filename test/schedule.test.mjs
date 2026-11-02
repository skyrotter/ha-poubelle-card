import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRule, planned, effective, computeFixed, collections, eventDays, dayKey, addDays } from '../src/schedule.js';
import { normalizeConfig } from '../src/normalize.js';

const D = s => new Date(s + 'T00:00:00');
const at = (s, h = 12) => { const d = D(s); d.setHours(h); return d; };
const holidays = (...days) => ({ isHoliday: d => days.includes(dayKey(d)), isWorkday: () => null });
const noHol = holidays();
// Workday calendar: Mon–Fri except the listed holidays
const workdays = (...hol) => d => d.getDay() !== 0 && d.getDay() !== 6 && !hol.includes(dayKey(d));

test('weekly days', () => {
  const r = buildRule({ days: ['tuesday'] });
  assert.equal(planned(r, D('2026-11-03')), true);   // Tue
  assert.equal(planned(r, D('2026-11-04')), false);
});

test('French day names and numbers still parse', () => {
  assert.deepEqual(buildRule({ days: ['mardi', 4] }).days, [1, 4]);
  assert.deepEqual(buildRule({ months: ['mai', 'October', 12] }).months, [5, 10, 12]);
});

test('start_date anchor: fortnightly, forwards and backwards', () => {
  const r = buildRule({ start_date: '2026-11-04', every: 2 }); // Wednesday
  assert.deepEqual(r.days, [2]);                     // weekday taken from start_date
  for (const [d, exp] of [['2026-11-04', true], ['2026-11-11', false], ['2026-11-18', true],
    ['2026-10-21', true], ['2026-10-28', false], ['2027-01-13', true]]) assert.equal(planned(r, D(d)), exp, d);
});

test('start_date anchor with explicit days and every 4', () => {
  const r = buildRule({ start_date: '2026-11-02', every: 4, days: [0, 3] }); // Mon + Thu of every 4th week
  assert.equal(planned(r, D('2026-11-05')), true);
  assert.equal(planned(r, D('2026-11-12')), false);
  assert.equal(planned(r, D('2026-11-30')), true);
});

test('start_date wins over weeks even/odd', () => {
  const r = buildRule({ start_date: '2026-11-04', every: 2, weeks: 'odd' });
  assert.equal(planned(r, D('2026-11-04')), true);   // ISO week 45 (odd) — but would also pass…
  assert.equal(planned(r, D('2026-11-11')), false);  // …week 46: odd-rule says no, anchor says no
  assert.equal(planned(r, D('2026-11-18')), true);   // week 47 odd, anchor yes
  const r2 = buildRule({ start_date: '2026-11-11', every: 2, weeks: 'odd' }); // anchor in an even week
  assert.equal(planned(r2, D('2026-11-11')), true);
});

test('next_day: calendar next day, even a Saturday', () => {
  const r = buildRule({ days: [4], holidays: 'next_day' });
  assert.equal(dayKey(effective(r, D('2026-12-25'), holidays('2026-12-25'))), '2026-12-26');
});

test('next_work_day uses the Workday calendar', () => {
  const r = buildRule({ days: [4], holidays: 'next_work_day' });
  // Fri 25 Dec holiday, Sat/Sun off, Mon 28 Dec (Boxing Day observed) off → Tue 29 Dec
  const ctx = { isHoliday: d => ['2026-12-25', '2026-12-28'].includes(dayKey(d)), isWorkday: workdays('2026-12-25', '2026-12-28') };
  assert.equal(dayKey(effective(r, D('2026-12-25'), ctx)), '2026-12-29');
});

test('next_work_day without a Workday calendar skips holidays and Sundays', () => {
  const r = buildRule({ days: [5], holidays: 'next_work_day' });
  assert.equal(dayKey(effective(r, D('2026-12-26'), holidays('2026-12-26'))), '2026-12-28'); // Sat → (Sun skipped) Mon
});

test('legacy values keep their meaning', () => {
  assert.equal(normalizeConfig({ holidays: 'report' }).holidays, 'next_work_day');
  assert.equal(normalizeConfig({ holidays: 'shift' }).holidays, 'next_work_day');
  assert.equal(normalizeConfig({ holidays: 'decalage' }).holidays, 'shift_rest_of_week');
  assert.equal(normalizeConfig({ holidays: 'annule' }).holidays, 'cancel');
  assert.equal(normalizeConfig({ holidays: 'next_day' }).holidays, 'next_day'); // changed meaning in 2.0
  assert.deepEqual(normalizeConfig({ bin: 'grise', tint: 'noire', container: 'sac', weeks: 'paires', region: 'metropole' }),
    { bin: 'black', container: 'bag', weeks: 'even' });
  assert.deepEqual(normalizeConfig({ bin: 'jaune', container: 'bac', weeks: 'toutes', holidays: 'aucun' }), { bin: 'yellow' });
});

test('shift_week: holiday pickup moves a week, again if that is also a holiday', () => {
  const r = buildRule({ start_date: '2026-12-25', every: 1, holidays: 'shift_week' });
  assert.equal(dayKey(effective(r, D('2026-12-25'), holidays('2026-12-25'))), '2027-01-01');
  assert.equal(dayKey(effective(r, D('2026-12-25'), holidays('2026-12-25', '2027-01-01'))), '2027-01-08');
});

test('shift_week merges with the regular pickup it lands on', () => {
  const r = buildRule({ days: [4], holidays: 'shift_week' });
  const list = collections(r, at('2026-12-20'), holidays('2026-12-25'), 20);
  const ks = list.map(x => dayKey(addDays(D('2026-12-20'), x.k)));
  assert.ok(!ks.includes('2026-12-25'));
  assert.equal(ks.filter(k => k === '2027-01-01').length, 1);
  assert.equal(list.find(x => dayKey(addDays(D('2026-12-20'), x.k)) === '2027-01-01').moved, false);
});

test('shift_rest_of_week (old décalage)', () => {
  const r = buildRule({ days: [3], holidays: 'shift_rest_of_week' });
  assert.equal(dayKey(effective(r, D('2026-12-24'), holidays('2026-12-22'))), '2026-12-25');
  assert.equal(dayKey(effective(r, D('2026-12-24'), holidays('2026-12-28'))), '2026-12-24');
});

test('cancel', () => {
  const r = buildRule({ days: [4], holidays: 'cancel' });
  assert.equal(effective(r, D('2026-12-25'), holidays('2026-12-25')), null);
});

test('computeFixed states around a pickup', () => {
  const r = buildRule({ days: [2], hour: 7 }); // Wednesdays, truck at 07:00
  assert.equal(computeFixed(r, at('2026-11-03', 20), noHol).state, 'eve');
  assert.equal(computeFixed(r, at('2026-11-04', 6), noHol).state, 'today');
  assert.equal(computeFixed(r, at('2026-11-04', 8), noHol).state, 'emptied');
  const mid = computeFixed(r, at('2026-11-01'), noHol);
  assert.equal(mid.n, 3); assert.ok(Math.abs(mid.fill - 4 / 7) < 1e-9);
});

test('computeFixed reports a moved pickup', () => {
  const r = buildRule({ days: [4], holidays: 'next_day' });
  const s = computeFixed(r, at('2026-12-23'), holidays('2026-12-25'));
  assert.equal(s.n, 3); assert.equal(s.moved, true);
});

test('eventDays: all-day end is exclusive, multi-day expands, timed events count', () => {
  const s = eventDays([
    { start: { date: '2026-12-25' }, end: { date: '2026-12-26' } },
    { start: { date: '2027-01-01' }, end: { date: '2027-01-03' } },
    { start: { dateTime: '2026-11-03T09:00:00' }, end: { dateTime: '2026-11-03T10:00:00' } },
  ]);
  assert.deepEqual([...s].sort(), ['2026-11-03', '2026-12-25', '2027-01-01', '2027-01-02']);
});
