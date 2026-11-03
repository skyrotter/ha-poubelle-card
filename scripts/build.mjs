/* Bundles src/ (card, editor and src/lang/*.json) into the single file HACS installs: dist/poubelle-card.js */
import { readFileSync } from 'node:fs';
import * as esbuild from 'esbuild';

// The version lives in src/poubelle-card.js (PB_VERSION), set from the release tag by .github/workflows/release.yml
const version = readFileSync(new URL('../src/poubelle-card.js', import.meta.url), 'utf8').match(/^const PB_VERSION = '([^']*)';/m)?.[1];
if (!version) throw new Error("PB_VERSION not found in src/poubelle-card.js");

const options = {
  entryPoints: ['src/poubelle-card.js'],
  outfile: 'dist/poubelle-card.js',
  bundle: true,
  format: 'esm',
  target: 'es2020',
  charset: 'utf8',
  legalComments: 'inline',
  banner: { js: `/*! poubelle-card v${version} | https://github.com/skyrotter/ha-poubelle-card | MIT | built from src/ — edit there, not here */` },
  logLevel: 'info',
};

if (process.argv.includes('--watch')) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
