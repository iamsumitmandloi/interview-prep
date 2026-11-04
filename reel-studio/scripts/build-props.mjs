// reels/<id>.json + word timestamps  ->  out/props/<id>.json (render-ready)
// resolves every "at" cue word to a timestamp and prints the timeline so you
// can sanity-check sync from text, without opening a video.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const reelPath = path.resolve(process.argv[2] || '');
if (!fs.existsSync(reelPath)) {
  console.error('usage: npm run props -- reels/001-stateful-vs-stateless.json');
  process.exit(1);
}
const reel = JSON.parse(fs.readFileSync(reelPath, 'utf8'));
const words = JSON.parse(fs.readFileSync(path.resolve(ROOT, reel.words), 'utf8'));
const fps = reel.fps || 30;

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9#@]/g, '');
const W = words.map((w) => norm(w.text));

let cursor = 0;
function findPhrase(phrase) {
  const parts = phrase.split(/\s+/).map(norm).filter(Boolean);
  const scan = (from) => {
    for (let i = from; i <= W.length - parts.length; i++) {
      if (parts.every((p, j) => W[i + j] === p || (j === parts.length - 1 && W[i + j].startsWith(p)))) return i;
    }
    return -1;
  };
  let i = scan(cursor);
  if (i === -1) {
    i = scan(0);
    if (i !== -1) console.warn(`  ! "${phrase}" only found BEFORE previous cue (out of order)`);
  }
  return i;
}

const STAGE = new Set(['card', 'code', 'tree', 'objects', 'lifecycle', 'image', 'clear']);
const STEPPED = new Set(['code', 'tree', 'objects', 'lifecycle']);
const DEFAULT_SFX = {
  card: (e) => ({Q: 'whoosh', TWIST: 'boom', RECALL: 'ding', NEXT: 'whoosh'})[e.kind] || 'whoosh',
  code: () => 'whoosh', tree: () => 'whoosh', objects: () => 'whoosh', lifecycle: () => 'whoosh',
  image: () => 'pop', pop: () => 'pop', zoom: () => null, clear: () => null,
};

const resolved = [];
let ok = true;
for (const e of reel.events) {
  let ms;
  if (typeof e.atMs === 'number') ms = e.atMs;
  else {
    const i = findPhrase(e.at);
    if (i === -1) { console.error(`  x cue not found: "${e.at}"`); ok = false; continue; }
    cursor = i + 1;
    ms = words[i].startMs;
  }
  ms = Math.max(0, ms + (e.offset || 0));
  resolved.push({...e, ms});
}
if (!ok) process.exit(1);
resolved.sort((a, b) => a.ms - b.ms);

// duration: video length if we have one, else last word + 1.5s
let durationMs = (words.at(-1)?.endMs || 5000) + 1500;
const media = reel.video || reel.audio;
if (media) {
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0',
      path.resolve(ROOT, 'public', media)]).toString();
    durationMs = Math.round(parseFloat(out) * 1000) + (reel.video ? 0 : 1200);
  } catch { console.warn('  ! ffprobe failed, using transcript length'); }
}
if (reel.durationMs) durationMs = reel.durationMs;

// stage segments: consecutive steps of the same graphic stay mounted and animate between steps
const segments = [];
const overlays = [];
const sfx = [];
for (const e of resolved) {
  const s = e.sfx === 'none' ? null : e.sfx || DEFAULT_SFX[e.do]?.(e);
  if (STAGE.has(e.do)) {
    const cur = segments.at(-1);
    const same = cur && STEPPED.has(e.do) && cur.do === e.do && !e.new &&
      (e.do !== 'code' || !e.snippet || e.snippet === cur.steps[0].snippet);
    if (same) {
      cur.steps.push(e);
      if (s && !e.sfx) sfx.push({ms: e.ms, name: 'tick'}); else if (s) sfx.push({ms: e.ms, name: s});
    } else {
      if (cur && cur.endMs == null) cur.endMs = e.ms;
      if (e.do !== 'clear') {
        segments.push({do: e.do, startMs: e.ms, endMs: e.until ? null : null, full: !!e.full, steps: [e]});
        if (s) sfx.push({ms: e.ms, name: s});
      }
    }
  } else {
    overlays.push(e);
    if (s) sfx.push({ms: e.ms, name: s});
  }
}
for (const seg of segments) if (seg.endMs == null) seg.endMs = durationMs;
for (const seg of segments) if (seg.steps[0].forMs) seg.endMs = Math.min(seg.endMs, seg.startMs + seg.steps[0].forMs);

const props = {id: reel.id, title: reel.title, fps, durationMs, video: reel.video || null, audio: reel.audio || null,
  credit: reel.credit || null, words, segments, overlays, sfx};
fs.mkdirSync(path.join(ROOT, 'out/props'), {recursive: true});
const outPath = path.join(ROOT, 'out/props', `${path.basename(reelPath, '.json')}.json`);
fs.writeFileSync(outPath, JSON.stringify(props));

const t = (ms) => (ms / 1000).toFixed(2).padStart(6) + 's';
console.log(`\n${reel.id}  ${t(durationMs)}  ${words.length} words`);
for (const e of resolved) console.log(`${t(e.ms)}  ${(e.do + (e.kind ? ':' + e.kind : '') + (e.step ? ':' + e.step : '')).padEnd(18)} ← "${e.at ?? e.atMs}"`);
console.log(`\n→ ${path.relative(process.cwd(), outPath)}`);
