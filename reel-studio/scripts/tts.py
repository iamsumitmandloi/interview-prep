# script text -> voice.wav + word timestamps, with kokoro (apache-2.0, fully local)
# usage: python scripts/tts.py samples/001.txt public/voice/001.wav captions/001.words.json [voice] [speed]
# models: kokoro-v1.0.int8.onnx + voices-v1.0.bin from github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0)
# word timings: each phrase is synthesized separately (exact phrase timing), words inside a phrase are spread by length.
import sys, re, os, json
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

txt, wav_out, words_out = sys.argv[1:4]
voice = sys.argv[4] if len(sys.argv) > 4 else 'am_michael'
speed = float(sys.argv[5]) if len(sys.argv) > 5 else 0.95
M = os.environ.get('KOKORO_DIR', os.path.expanduser('~/development/kokoro'))
k = Kokoro(f'{M}/kokoro-v1.0.int8.onnx', f'{M}/voices-v1.0.bin')

text = re.sub(r'\s+', ' ', open(txt).read()).strip()
# phrases end at . ? ! : , (keep punctuation with the phrase)
# whole sentences keep natural intonation (splitting at commas made it sound robotic)
phrases = [p.strip() for p in re.findall(r'.+?(?:\.\.\.(?=\s+[a-z])|[.?!](?=\s|$)|$)', text) if p.strip()]
PAUSE = {'.': 0.45, '?': 0.6, '!': 0.45}

# speak code-ish tokens nicely
def speakable(p):
    p = p.replace('@immutable', 'at immutable')
    for a, b in [('StatefulWidget', 'stateful widget'), ('StatelessWidget', 'stateless widget'), ('setState', 'set state'), ('UI', 'U.I.')]:
        p = p.replace(a, b)
    p = re.sub(r'\bui\b', 'U.I.', p)
    return p

audio, words, t, sr = [], [], 0.0, 24000
for p in phrases:
    samples, sr = k.create(speakable(p), voice=voice, speed=speed, lang='en-us')
    # trim leading/trailing silence so timings are tight
    nz = np.where(np.abs(samples) > 0.01)[0]
    if len(nz): samples = samples[max(0, nz[0] - 600): nz[-1] + 1200]
    dur = len(samples) / sr
    ws = p.split(' ')
    # commas inside a sentence = small breath, so give the word before it more time
    weights = [len(w) + 2 + (6 if w.endswith(',') else 9 if w.endswith('...') else 0) for w in ws]
    total = sum(weights); cur = t
    for w, wt in zip(ws, weights):
        d = dur * wt / total
        words.append({'text': w, 'startMs': round(cur * 1000), 'endMs': round((cur + d) * 1000)})
        cur += d
    gap = PAUSE.get(p[-1], 0.06)
    audio += [samples, np.zeros(int(gap * sr), dtype=samples.dtype)]
    t += dur + gap

os.makedirs(os.path.dirname(wav_out), exist_ok=True)
sf.write(wav_out, np.concatenate(audio), sr)
json.dump(words, open(words_out, 'w'))
print(f'{len(words)} words, {t:.1f}s, voice={voice} -> {wav_out}')
