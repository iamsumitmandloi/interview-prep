import React from 'react';
import {useCurrentFrame, useVideoConfig, interpolate, Img, staticFile} from 'remotion';
import {C, F} from '../theme';
import {LIFECYCLES} from '../presets';
import {pop, ease, clamp, useStep} from '../lib';

const KIND: Record<string, {label: string; color: string}> = {
  Q: {label: 'INTERVIEW Q', color: C.blue},
  TWIST: {label: 'PLOT TWIST', color: C.pink},
  RECALL: {label: '📌 RECALL · screenshot this', color: C.yellow},
  NEXT: {label: 'NEXT UP →', color: C.cyan},
};

export const Card: React.FC<{seg: any; box: {w: number; h: number}}> = ({seg}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const e = seg.steps[0];
  const k = KIND[e.kind] ?? KIND.Q;
  const a = pop(frame, fps, 0, e.kind === 'TWIST' ? 7 : 12);
  const shake = e.kind === 'TWIST' ? Math.sin(frame * 2.3) * interpolate(frame, [0, 14], [18, 0], clamp) : 0;
  const lines: string[] = Array.isArray(e.text) ? e.text : [e.text];
  const recall = e.kind === 'RECALL';
  const chars = e.kind === 'NEXT' ? Math.floor(interpolate(frame, [6, 6 + lines[0].length * 0.9], [0, lines[0].length], clamp)) : Infinity;
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 70px',
      transform: `translateX(${shake}px)`}}>
      <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 38, letterSpacing: 5, color: C.bg, background: k.color, padding: '12px 28px',
        borderRadius: 14, transform: `scale(${a}) rotate(${(1 - a) * -8}deg)`, marginBottom: 46}}>{k.label}</div>
      <div style={{width: '100%', ...(recall ? {border: `4px solid ${C.yellow}`, borderRadius: 30, padding: '44px 48px', background: 'rgba(255,216,77,.06)'} : {})}}>
        {lines.map((l, i) => {
          const b = ease(frame, 6 + i * 6, 16 + i * 6);
          return <div key={i} style={{fontFamily: F.sans, fontWeight: 700, fontSize: recall ? 58 : e.kind === 'Q' ? 84 : 72, lineHeight: 1.18,
            color: C.text, textAlign: recall ? 'left' : 'center', opacity: b, transform: `translateY(${(1 - b) * 40}px)`, marginBottom: recall ? 26 : 0}}>
            {recall && <span style={{color: C.yellow}}>→ </span>}{renderInline(i === 0 ? l.slice(0, chars) : l)}
          </div>;
        })}
      </div>
    </div>
  );
};

// `code` in backticks gets mono + blue
export const renderInline = (s: string) =>
  s.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((p, i) => p.startsWith('`') ? <span key={i} style={{fontFamily: F.mono, color: C.blue, fontSize: '0.9em'}}>{p.slice(1, -1)}</span>
    : p.startsWith('**') ? <span key={i} style={{color: C.yellow}}>{p.slice(2, -2)}</span> : p);

export const Lifecycle: React.FC<{seg: any; box: {w: number; h: number}}> = ({seg, box}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {step, since} = useStep(seg.steps, frame, fps, seg.startMs);
  const names = LIFECYCLES[seg.steps[0].preset ?? 'stateful'];
  const active = names.indexOf(step.active);
  const rowH = Math.min(118, (box.h - 120) / names.length);
  return (
    <div style={{position: 'absolute', inset: 0, padding: '60px 110px'}}>
      <div style={{position: 'absolute', left: 140, top: 60 + rowH / 2, width: 6, height: rowH * (names.length - 1), background: C.line}} />
      <div style={{position: 'absolute', left: 140, top: 60 + rowH / 2, width: 6, height: rowH * Math.max(0, active) * ease(since, 0, 10, 0.85, 1), background: C.blue}} />
      {names.map((n, i) => {
        const on = i === active, done = i < active;
        const a = pop(frame, fps, i * 2);
        return <div key={n} style={{position: 'absolute', left: 110, top: 60 + i * rowH, height: rowH, display: 'flex', alignItems: 'center', gap: 36, opacity: a}}>
          <div style={{width: 66, height: 66, borderRadius: 33, background: on ? C.blue : done ? C.navy : C.panel, border: `4px solid ${on || done ? C.blue : C.line}`,
            transform: `scale(${on ? 1 + 0.15 * pop(since, fps) : 1})`, boxShadow: on ? `0 0 40px ${C.blue}` : 'none'}} />
          <div style={{fontFamily: F.mono, fontSize: on ? 50 : 38, fontWeight: on ? 700 : 400, color: on ? C.text : done ? C.dim : C.line}}>{n.includes('(') || n.includes('.') || /^[A-Z]/.test(n) ? n : `${n}()`}</div>
        </div>;
      })}
    </div>
  );
};

export const ImageCard: React.FC<{seg: any}> = ({seg}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const e = seg.steps[0];
  const a = pop(frame, fps, 0, 9);
  return <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
    <Img src={staticFile(e.src)} style={{maxWidth: '86%', maxHeight: '78%', borderRadius: 24, transform: `scale(${a}) rotate(${(1 - a) * 10}deg)`}} />
    {e.text && <div style={{marginTop: 24, fontFamily: F.sans, fontWeight: 700, fontSize: 56, color: C.text}}>{e.text}</div>}
  </div>;
};
