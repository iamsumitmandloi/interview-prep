// whisper-cli -ojf output  ->  [{text, startMs, endMs}]  (one entry per spoken word)
// tokens without a leading space are glued onto the previous word ("set"+"State" -> "setState")
import fs from 'node:fs';
const [inp, out] = process.argv.slice(2);
if (!inp || !out) { console.error('usage: node scripts/whisper-to-words.mjs take.json captions/001.words.json'); process.exit(1); }
const j = JSON.parse(fs.readFileSync(inp, 'utf8'));
const words = [];
for (const seg of j.transcription) {
  const toks = seg.tokens?.length ? seg.tokens : [{text: seg.text, offsets: seg.offsets}];
  for (const t of toks) {
    if (!t.text || /^\s*\[_/.test(t.text) || /^\s*\[(BLANK|MUSIC)/i.test(t.text)) continue;
    const startsWord = /^\s/.test(t.text) || words.length === 0;
    const txt = t.text.trim();
    if (!txt) continue;
    if (!startsWord || /^[.,!?;:'")\]]/.test(txt)) {
      const w = words.at(-1); w.text += txt; w.endMs = t.offsets.to;
    } else words.push({text: txt, startMs: t.offsets.from, endMs: t.offsets.to});
  }
}
fs.writeFileSync(out, JSON.stringify(words, null, 0).replace(/\},\{/g, '},\n{'));
console.log(`${words.length} words -> ${out}`);
