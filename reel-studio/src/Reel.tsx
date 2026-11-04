import React from 'react';
import {AbsoluteFill, Sequence, OffthreadVideo, Audio, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate} from 'remotion';
import {C, F, W, H} from './theme';
import {msToF, clamp} from './lib';
import {CodeSnippet} from './components/CodeSnippet';
import {Graph} from './components/Graph';
import {Card, Lifecycle, ImageCard} from './components/Cards';
import {Pop} from './components/Overlays';
import {Captions} from './components/Captions';

// face rect per layout mode
type Rect = {x: number; y: number; w: number; h: number; r: number};
const STAGE_H = Math.round(H * 0.6);
const RECT: Record<string, Rect> = {
  face: {x: 0, y: 0, w: W, h: H, r: 0},
  split: {x: 0, y: STAGE_H, w: W, h: H - STAGE_H, r: 0},
  pip: {x: W - 350, y: H - 600, w: 300, h: 300, r: 150},
};
const lerp = (a: Rect, b: Rect, t: number): Rect => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: a.w + (b.w - a.w) * t, h: a.h + (b.h - a.h) * t, r: a.r + (b.r - a.r) * t});

const STAGE: Record<string, React.FC<any>> = {card: Card, code: CodeSnippet, tree: Graph, objects: Graph, lifecycle: Lifecycle, image: ImageCard};

export const Reel: React.FC<any> = (p) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const segs = (p.segments ?? []).map((s: any) => ({...s, from: msToF(s.startMs, fps), to: msToF(s.endMs, fps)}));

  // layout timeline
  const modeAt = (f: number) => { const s = segs.find((s: any) => f >= s.from && f < s.to); return s ? (s.full ? 'pip' : 'split') : 'face'; };
  let changeF = 0;
  for (let f = frame; f > 0; f--) if (modeAt(f - 1) !== modeAt(f)) { changeF = f; break; }
  const mode = modeAt(frame), prev = changeF > 0 ? modeAt(changeF - 1) : mode;
  const t = spring({frame: frame - changeF, fps, config: {damping: 16, stiffness: 140}});
  const r = lerp(RECT[prev], RECT[mode], t);

  // punch-in zooms
  let zoom = 1;
  for (const z of (p.overlays ?? []).filter((o: any) => o.do === 'zoom')) {
    const zf = msToF(z.ms, fps), len = msToF(z.forMs ?? 1400, fps);
    zoom *= interpolate(frame, [zf, zf + 4, zf + len - 6, zf + len], [1, z.scale ?? 1.22, z.scale ?? 1.22, 1], clamp);
  }

  const capY = mode === 'face' ? 1330 : mode === 'split' ? H - 330 : H - 260;
  const popY = mode === 'face' ? 560 : STAGE_H - 170;

  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 25%, ${C.bg2}, ${C.bg} 70%)`}}>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(${C.line} 2px, transparent 2px)`, backgroundSize: '44px 44px', opacity: 0.35}} />

      {/* face */}
      <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: r.r, overflow: 'hidden',
        border: mode === 'pip' || prev === 'pip' ? `${6 * (mode === 'pip' ? t : 1 - t)}px solid ${C.blue}` : 'none', boxShadow: mode === 'pip' ? '0 20px 60px rgba(0,0,0,.5)' : 'none'}}>
        <div style={{width: '100%', height: '100%', transform: `scale(${zoom})`, transformOrigin: '50% 35%'}}>
          {p.video ? <OffthreadVideo src={staticFile(p.video)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 30%'}} />
            : p.audio ? <VoiceOrb /> : <FacePlaceholder />}
        </div>
      </div>
      {mode === 'split' && <div style={{position: 'absolute', left: 0, right: 0, top: r.y - 3, height: 6, background: `linear-gradient(90deg, ${C.blue}, ${C.cyan})`, opacity: t}} />}

      {/* stage */}
      {segs.map((s: any, i: number) => {
        const Comp = STAGE[s.do];
        if (!Comp) return null;
        const box = s.full ? {w: W, h: H - 420} : {w: W, h: STAGE_H};
        return <Sequence key={i} from={s.from} durationInFrames={Math.max(1, s.to - s.from)} layout="none">
          <StageFade len={s.to - s.from}><div style={{position: 'absolute', left: 0, top: s.full ? 120 : 40, width: box.w, height: box.h - 40}}>
            <Comp seg={s} box={{w: box.w, h: box.h - 40}} />
          </div></StageFade>
        </Sequence>;
      })}

      {/* kinetic words */}
      {(p.overlays ?? []).filter((o: any) => o.do === 'pop').map((o: any, i: number) =>
        <Sequence key={i} from={msToF(o.ms, fps)} durationInFrames={msToF(o.forMs ?? 1100, fps)} layout="none"><Pop e={o} y={popY} /></Sequence>)}

      <Captions words={p.words ?? []} y={capY} />

      {/* chrome: progress + handle */}
      <div style={{position: 'absolute', left: 0, top: 0, height: 8, width: `${(frame / durationInFrames) * 100}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.cyan})`}} />
      <div style={{position: 'absolute', right: 34, top: 30, fontFamily: F.sans, fontWeight: 700, fontSize: 28, color: C.text, opacity: 0.55}}>@flutterfellas</div>
      {p.credit && frame < fps * 4 && <div style={{position: 'absolute', left: 34, top: 34, fontFamily: F.sans, fontSize: 24, color: C.dim,
        opacity: interpolate(frame, [fps * 3, fps * 4], [1, 0], clamp)}}>{p.credit}</div>}

      {p.audio && <Audio src={staticFile(p.audio)} />}
      {(p.sfx ?? []).map((s: any, i: number) => <Sequence key={`s${i}`} from={msToF(s.ms, fps)} durationInFrames={fps * 2} layout="none">
        <Audio src={staticFile(`sfx/${s.name}.mp3`)} volume={s.volume ?? 0.45} /></Sequence>)}
    </AbsoluteFill>
  );
};

const StageFade: React.FC<{len: number; children: React.ReactNode}> = ({len, children}) => {
  const f = useCurrentFrame();
  return <div style={{position: 'absolute', inset: 0, opacity: interpolate(f, [len - 6, len], [1, 0], clamp)}}>{children}</div>;
};

const FacePlaceholder = () => (
  <AbsoluteFill style={{background: `linear-gradient(160deg, #23304f, #0d1530)`, justifyContent: 'center', alignItems: 'center'}}>
    <div style={{width: 340, height: 340, borderRadius: 170, background: '#34446e', marginTop: -120}} />
    <div style={{width: 640, height: 400, borderRadius: '320px 320px 0 0', background: '#34446e', position: 'absolute', bottom: 0}} />
    <div style={{position: 'absolute', top: 60, fontFamily: F.sans, fontSize: 30, color: C.dim, letterSpacing: 6}}>YOUR FACE HERE</div>
  </AbsoluteFill>
);

// voice-only reels: brand orb instead of a face
const VoiceOrb = () => {
  const f = useCurrentFrame();
  const pulse = 1 + 0.05 * Math.sin(f / 4) + 0.03 * Math.sin(f / 1.7);
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, #13224a, ${C.bg} 75%)`, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{width: 300, height: 300, borderRadius: 150, transform: `scale(${pulse})`, background: `conic-gradient(from ${f * 3}deg, ${C.blue}, ${C.cyan}, ${C.navy}, ${C.blue})`,
        boxShadow: `0 0 120px ${C.blue}88`, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <div style={{width: 250, height: 250, borderRadius: 125, background: C.bg, display: 'flex', justifyContent: 'center', alignItems: 'center',
          fontFamily: F.sans, fontWeight: 700, fontSize: 92, color: C.blue, letterSpacing: -4}}>FF</div>
      </div>
    </AbsoluteFill>
  );
};
