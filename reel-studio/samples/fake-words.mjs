// makes a fake word-timestamp file from plain text, so the kit can be tested without a recording
import fs from 'node:fs';
const [inp, out] = process.argv.slice(2);
const text = fs.readFileSync(inp, 'utf8').replace(/\s+/g, ' ').trim();
let t = 300; const words = [];
for (const w of text.split(' ')) {
  const d = 170 + w.length * 28;
  words.push({text: w, startMs: Math.round(t), endMs: Math.round(t + d)});
  t += d + 55 + (/[.?!]$/.test(w) ? 380 : /[,:]$/.test(w) ? 170 : 0) + (/\.\.\.$/.test(w) ? 400 : 0);
}
fs.writeFileSync(out, JSON.stringify(words));
console.log(words.length, 'words,', (t / 1000).toFixed(1), 's');
