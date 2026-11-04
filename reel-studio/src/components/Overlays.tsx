import React from 'react';
import {useCurrentFrame, useVideoConfig, interpolate, random} from 'remotion';
import {C, F} from '../theme';
import {pop, clamp} from '../lib';

// kinetic word: style slam | stretch | shatter
export const Pop: React.FC<{e: any; y: number}> = ({e, y}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const style = e.style ?? 'slam';
  const color = (C as any)[e.color ?? 'yellow'] ?? e.color;
  const out = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], clamp);
  const a = pop(frame, fps, 0, 8);
  const text: string = e.text;
  const base: React.CSSProperties = {fontFamily: e.mono ? F.mono : F.sans, fontWeight: 700, fontSize: e.size ?? 120, color,
    textShadow: `0 8px 0 ${C.bg}, 0 0 40px ${color}88`, WebkitTextStroke: `3px ${C.bg}`, whiteSpace: 'nowrap'};
  let inner: React.ReactNode;
  if (style === 'stretch') {
    const sx = interpolate(frame, [0, 5, 10, 14], [0.1, 1.35, 0.92, 1], clamp);
    inner = <div style={{...base, transform: `scale(${sx}, ${2 - sx})`}}>{text}</div>;
  } else if (style === 'shatter') {
    const breakAt = durationInFrames - 14;
    inner = <div style={{...base, display: 'flex'}}>{text.split('').map((ch, i) => {
      const t = Math.max(0, frame - breakAt);
      const ang = (random(`a${i}${text}`) - 0.5) * 2;
      return <span key={i} style={{display: 'inline-block', transform: `translate(${ang * t * 22}px, ${t * t * 1.4 - t * 10}px) rotate(${ang * t * 25}deg)`,
        opacity: interpolate(t, [6, 13], [1, 0], clamp), whiteSpace: 'pre'}}>{ch}</span>;
    })}</div>;
  } else {
    inner = <div style={{...base, transform: `scale(${interpolate(a, [0, 1], [2.4, 1])}) rotate(${(1 - a) * -12 + (e.tilt ?? -3)}deg)`, opacity: Math.min(1, a * 2)}}>{text}</div>;
  }
  return <div style={{position: 'absolute', left: 0, right: 0, top: e.y ?? y, display: 'flex', justifyContent: 'center', opacity: style === 'shatter' ? 1 : out}}>{inner}</div>;
};
