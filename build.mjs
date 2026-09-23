#!/usr/bin/env node
/* 紙芝居 build — content/<name>.js から1枚のHTMLを作る
   使い方: node build.mjs content/example.js [-o dist/example.html]
   content 内の "@@path@@" は、そのファイルを data URI にして埋め込む。 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';

const MIME = { png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', webp:'image/webp',
  svg:'image/svg+xml', gif:'image/gif', mp4:'video/mp4', webm:'video/webm' };

const args = process.argv.slice(2);
const src = args[0];
if(!src){ console.error('使い方: node build.mjs content/<name>.js [-o dist/<name>.html]'); process.exit(1); }
const oi = args.indexOf('-o');
const out = oi > -1 ? args[oi+1] : `dist/${basename(src).replace(/\.js$/, '')}.html`;

const root = dirname(new URL(import.meta.url).pathname);
const read = p => readFileSync(resolve(root, p), 'utf8');

let content = read(src);

/* 追加CSS: content と同名の .extra.css があれば足す */
const extraPath = src.replace(/\.js$/, '.extra.css');
const extra = existsSync(resolve(root, extraPath)) ? '\n/* --- content 固有 --- */\n' + read(extraPath) : '';

/* アセットを data URI に */
let embedded = 0;
content = content.replace(/["'`]@@([^@]+)@@["'`]/g, (_, p) => {
  let buf;
  try { buf = readFileSync(resolve(root, p)); }
  catch { console.error(`⚠️  アセットが見つかりません: ${p}`); process.exit(1); }
  const ext = p.split('.').pop().toLowerCase();
  embedded++;
  return `"data:${MIME[ext] || 'application/octet-stream'};base64,${buf.toString('base64')}"`;
});

const title = (content.match(/title\s*:\s*['"`](.+?)['"`]/) || [,'紙芝居'])[1];

const html = read('src/shell.html')
  .replace('__TITLE__', title)
  .replace('__CSS__', () => read('src/kamishibai.css') + extra)
  .replace('__ENGINE__', () => read('src/kamishibai.js'))
  .replace('__CONTENT__', () => content);

mkdirSync(dirname(resolve(root, out)), { recursive: true });
writeFileSync(resolve(root, out), html);
console.log(`✅ ${out}  (${(html.length/1024).toFixed(0)} KB / アセット ${embedded} 件を埋め込み)`);
