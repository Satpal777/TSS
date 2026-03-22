/**
 * build.js — TSS Build Script (powered by esbuild)
 *
 * Produces:
 *   dist/tss.js      — IIFE for CDN / <script> tag
 *   dist/tss.min.js  — Minified IIFE
 *   dist/tss.esm.js  — ES module
 */

import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const VERSION = pkg.version;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

const ENTRY = path.join(__dirname, 'index.js');
const BANNER = `/*!
 * tea-simple-smart-css (TSS) v${VERSION}
 * A lightweight utility-first CSS engine with auto light/dark mode
 * MIT License
 */`;

async function build() {
  console.log('Building TSS with esbuild...\n');
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    format: 'iife',
    globalName: 'TSS',
    outfile: path.join(DIST, 'tss.js'),
    banner: { js: BANNER },
    target: ['es2018'],
    define: { __TSS_VERSION__: JSON.stringify(VERSION) },
  });

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    format: 'iife',
    globalName: 'TSS',
    outfile: path.join(DIST, 'tss.min.js'),
    banner: { js: BANNER },
    minify: true,
    target: ['es2018'],
    define: { __TSS_VERSION__: JSON.stringify(VERSION) },
  });

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    format: 'esm',
    outfile: path.join(DIST, 'tss.esm.js'),
    banner: { js: BANNER },
    target: ['es2018'],
    define: { __TSS_VERSION__: JSON.stringify(VERSION) },
  });


  const dts = `// tea-simple-smart-css (TSS) v-${VERSION} — TypeScript declarations

        export interface ParseResult {
          selector: string;
          rules: Record<string, string>;
        }

        export interface TSSAPI {
          version:    string;
          refresh():  void;
          toggleDark(): boolean;
          parse(className: string): ParseResult | null;
        }

        // Named exports for direct import { toggleDark, parse } from '...';
        export declare const version: string;
        export declare function refresh(): void;
        export declare function toggleDark(): boolean;
        export declare function parse(className: string): ParseResult | null;

        // Default export for import TSS from '...';
        declare const TSS: TSSAPI;
        export default TSS;
`;

  fs.writeFileSync(path.join(DIST, 'index.d.ts'), dts, 'utf8');

  console.log('\nBuild complete!\n');
}

build().catch(err => {
  console.error('Build failed:', err.message);
  process.exit(1);
});
