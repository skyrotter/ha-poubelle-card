/* Bundles src/ (card, editor and src/lang/*.json) into the single file HACS installs: dist/poubelle-card.js */
import { readFileSync } from 'node:fs';
import * as esbuild from 'esbuild';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));

const options = {
  entryPoints: ['src/poubelle-card.js'],
  outfile: 'dist/poubelle-card.js',
  bundle: true,
  format: 'esm',
  target: 'es2020',
  charset: 'utf8',
  legalComments: 'inline',
  define: { __VERSION__: JSON.stringify(version) },
  banner: { js: `/*! poubelle-card v${version} | https://github.com/Roving-Ronin/ha-garbage-card | MIT | built from src/ — edit there, not here */` },
  logLevel: 'info',
};

if (process.argv.includes('--watch')) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
