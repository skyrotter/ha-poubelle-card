import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const dir = new URL('../src/lang/', import.meta.url);
const load = f => JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
const vars = s => (String(s).match(/\{\w+\}/g) || []).sort().join();

const en = load('en.json'), enKeys = keys(en);
const files = readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'en.json');

for (const f of files) test(`${f} has the same keys and placeholders as en.json`, () => {
  const l = load(f), lk = keys(l);
  assert.deepEqual(enKeys.filter(k => !lk.includes(k)), [], 'missing keys');
  assert.deepEqual(lk.filter(k => !enKeys.includes(k)), [], 'unknown keys');
  const get = (o, k) => k.split('.').reduce((x, y) => x[y], o);
  for (const k of enKeys) assert.equal(vars(get(l, k)), vars(get(en, k)), `placeholders in ${k}`);
});

test('every language file is registered in localize.js', () => {
  const src = readFileSync(new URL('../src/localize.js', import.meta.url), 'utf8');
  for (const f of files) assert.ok(src.includes(`./lang/${f}`), f);
});
