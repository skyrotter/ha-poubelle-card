/* Renders the README preview images from the built card, one set per language:
 *   images/<lang>/preview.png, preview.gif, preview-full-color.png, preview-sacs.png
 * Usage: npm run build && npm run screenshots [-- en fr]
 * Needs Chrome/Chromium (set CHROME_PATH if it isn't found) and ffmpeg for the GIF. */
import { readFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const bundle = readFileSync(path.join(root, 'dist/poubelle-card.js'), 'utf8');
const chrome = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => existsSync(p));
if (!chrome) throw new Error('Chrome not found: set CHROME_PATH');
const langs = process.argv.slice(2).length ? process.argv.slice(2) : ['en', 'fr'];

// "now" for every scene: Thursday 5 Nov 2026, 08:00 (before the default 09:00 truck)
const NOW = '2026-11-05T08:00:00';
const BG = '#0d1324';
const tile = { compact: false, show_meter: true };
const scenes = {
  // four states: tonight (Fri pickup), pickup now (Thu), emptied (Thu, truck at 07:00), in 3 days (Sun)
  preview: { width: 880, height: 350, cols: 4, cards: lang => [
    { bin: 'grey', days: [4] }, { bin: 'yellow', days: [3] }, { bin: 'black', days: [3], hour: 7 }, { bin: 'green', days: [6] },
  ] },
  'preview-full-color': { width: 1072, height: 316, cols: lang => (lang === 'en' ? 6 : 5), cards: lang =>
    (lang === 'en' ? ['red', 'yellow', 'lime', 'burgundy', 'purple', 'blue'] : ['blue', 'green', 'brown', 'yellow', 'red'])
      .map(bin => ({ bin, days: [6], full_color: true, scale: 0.5, headroom: 30 })) },
  'preview-sacs': { width: 1072, height: 316, cols: 5, cards: () =>
    ['black', 'yellow', 'green', 'blue', 'brown'].map(bin => ({ bin, container: 'bag', days: [6], scale: 0.6, headroom: 0 })) },
};

const html = (w, h, cols) => `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;background:${BG};font-family:Roboto,"Noto Sans","Helvetica Neue",Arial,sans-serif;color:#e8eaf0}
  #g{box-sizing:border-box;width:${w}px;height:${h}px;padding:16px;display:grid;grid-template-columns:repeat(${cols},1fr);gap:16px;align-items:start}
  ha-card{display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px 14px 14px;border-radius:18px}
</style></head><body><div id="g"></div></body></html>`;

const browser = await puppeteer.launch({ executablePath: chrome, args: ['--no-sandbox', '--font-render-hinting=none'] });
try {
  for (const lang of langs) {
    const out = path.join(root, 'images', lang);
    mkdirSync(out, { recursive: true });
    for (const [name, sc] of Object.entries(scenes)) {
      const cols = typeof sc.cols === 'function' ? sc.cols(lang) : sc.cols;
      const page = await browser.newPage();
      await page.setViewport({ width: sc.width, height: sc.height, deviceScaleFactor: 1 });
      await page.setContent(html(sc.width, sc.height, cols));
      await page.evaluate(now => {
        const Real = Date, FIX = new Real(now).getTime();
        globalThis.Date = class extends Real { constructor(...a) { super(...(a.length ? a : [FIX])); } static now() { return FIX; } };
        customElements.define('ha-card', class extends HTMLElement {});
      }, NOW);
      await page.addScriptTag({ content: bundle, type: 'module' });
      await page.waitForFunction(() => customElements.get('poubelle-card'));
      await page.evaluate((cards, lang, base) => {
        const hass = { locale: { language: lang }, language: lang, states: {}, entities: {} };
        for (const c of cards) {
          const el = document.createElement('poubelle-card');
          el.setConfig({ type: 'custom:poubelle-card', ...base, ...c });
          el.hass = hass;
          document.getElementById('g').append(el);
        }
      }, sc.cards(lang), lang, tile);
      await new Promise(r => setTimeout(r, 1600)); // let the lid / fill transitions settle

      if (name === 'preview') {
        // GIF: pause every CSS animation and step them through 54 frames × 70 ms
        const frames = path.join(out, '.frames');
        rmSync(frames, { recursive: true, force: true }); mkdirSync(frames);
        const N = 54, STEP = 70;
        for (let i = 0; i < N; i++) {
          await page.evaluate(t => {
            for (const el of document.querySelectorAll('poubelle-card'))
              for (const a of el.shadowRoot.getAnimations()) { a.pause(); a.currentTime = t; }
          }, 400 + i * STEP);
          await page.screenshot({ path: path.join(frames, `f${String(i).padStart(3, '0')}.png`) });
        }
        await page.screenshot({ path: path.join(out, 'preview.png') });
        execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(1000 / STEP), '-i', path.join(frames, 'f%03d.png'),
          '-vf', 'split[a][b];[a]palettegen=max_colors=192:stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a',
          '-loop', '0', path.join(out, 'preview.gif')]);
        rmSync(frames, { recursive: true, force: true });
      } else {
        await page.screenshot({ path: path.join(out, `${name}.png`) });
      }
      await page.close();
      console.log(`images/${lang}/${name} ✓`);
    }
  }
} finally {
  await browser.close();
}
