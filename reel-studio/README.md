# reel studio

```bash
npm i
npm run dev                                                 # studio preview (sample reel, placeholder face)
npm run render -- reels/001-stateful-vs-stateless.json --preview
```
full docs for humans + claude: [CLAUDE.md](CLAUDE.md). sample output: `samples/001-preview.mp4`.
needs: node 20+, ffmpeg, whisper-cpp (`brew install node ffmpeg whisper-cpp`), model at `~/development/whisper-models/ggml-small.en.bin`.
