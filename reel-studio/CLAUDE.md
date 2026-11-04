# flutter fellas reel studio

remotion kit that turns a talking-head take + word timestamps + a tiny json into a 1080x1920 reel
(motion graphics, kinetic text, captions, sfx). owner: sumit (flutter dev, @flutterfellas).

## token rules (important)
- components are built. per reel you ONLY write `reels/<id>.json` (~15-30 events). don't touch components unless asked.
- work from text: `captions/<id>.words.json` + `npm run props` timeline output. never read video files.
- check visuals with 2-4 stills (`npx remotion still ... --scale=0.5`), only when something's off.
- new graphic need? add a preset in `src/presets.ts` or a snippet in `src/snippets/index.ts` first; new components last.

## pipeline (mac)
1. raw take -> `public/raw/<id>.mov` (gitignored)
2. `bash scripts/transcribe.sh public/raw/<id>.mov <id>` -> `captions/<id>.words.json` (whisper-cli small.en)
3. write `reels/<id>.json` (see below)
4. `npm run props -- reels/<id>.json` -> prints cue timeline; fix any "cue not found"
5. `npm run render -- reels/<id>.json` (`--preview` = half res, fast). output in `out/`

## reel json
{ id, title, video: "raw/<id>.mov" | null, audio?: "voice/<id>.mp3" (voice-only reel, shows FF orb), words: "captions/<id>.words.json", credit?, events: [...] }
every event has `at` (a word/phrase the speaker says; matched in order) or `atMs`, optional `offset` (ms), `sfx` (name | "none").

stage graphics (one at a time; top 60%, face bottom 40%; `"full": true` = full screen + face bubble):
- card: `kind` Q | TWIST | RECALL | NEXT, `text` string or string[]; `code` in backticks, **bold** = yellow; `forMs` to auto-hide
- code: `snippet` (src/snippets), `highlight` [lines], `caption`; repeat `{"do":"code","highlight":[..]}` to move the highlight
- tree / objects: `preset` (src/presets.ts GRAPHS), `step`; later steps of the same graphic animate in place
- lifecycle: `preset` "stateful", `active` "initState" etc; repeat to advance
- image: `src` (public/ path, memes go in public/memes), `text`
- clear: back to full-face
overlays: pop (`text`, `style` slam|stretch|shatter, `color` theme name, `forMs`), zoom (`scale`, `forMs`)
sfx (public/sfx): whoosh pop ding boom shatter tick. defaults are automatic per event type.

## reel format (pilot: interview + twist)
[Q] card -> quick interview answer (~10s) -> [TWIST] follow-up -> explain with graphics -> [RECALL] -> [NEXT] cliffhanger.
one idea per reel. credit question sources (debasmitasarkar/flutter_interview_guide_2026) in `credit`.
never put personal/employer info (salary, notice period, internal code) in reels.

## look
navy bg #0A1022, flutter blue #54C5F8, cyan #2EE6D6, pink #FF4F8B (destroy/twist), yellow #FFD84D (highlight), green #4ADE80 (kept).
Space Grotesk (text), JetBrains Mono (code). all in src/theme.ts.

## mac notes
macbook air m1 16gb, fanless: render overnight, concurrency 3 (remotion.config.ts).

## ai voice (kokoro, local, free)
`pip install kokoro-onnx soundfile`; models (kokoro-v1.0.int8.onnx, voices-v1.0.bin) from github.com/thewh1teagle/kokoro-onnx/releases -> ~/development/kokoro
`python scripts/tts.py samples/001.txt public/voice/001.wav captions/001.words.json am_fenrir` (also writes word timings, no whisper needed)
use for scratch/test reels and faceless formats. never clone real people's voices without consent.
