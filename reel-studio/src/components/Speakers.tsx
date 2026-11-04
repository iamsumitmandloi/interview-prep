import React from 'react';
import {useCurrentFrame, useVideoConfig, random} from 'remotion';
import {C, F} from '../theme';

export const SPK: Record<string, {name: string; color: string}> = {A: {name: 'HOST', color: C.cyan}, B: {name: 'DEV', color: C.blue}};

// faceless podcast bar: who's talking + a live waveform
export const Speakers: React.FC<{words: any[]; y: number}> = ({words, y}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = (f / fps) * 1000;
  const cur = words.find((w) => ms >= w.startMs - 150 && ms < w.endMs + 250);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, display: 'flex', justifyContent: 'center', gap: 40}}>
      {Object.entries(SPK).map(([k, s]) => {
        const on = cur?.speaker === k;
        return (
          <div key={k} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '16px 30px', borderRadius: 60,
            border: `3px solid ${on ? s.color : C.line}`, background: on ? `${s.color}1f` : 'transparent', opacity: on ? 1 : 0.45,
            transform: `scale(${on ? 1.06 : 0.94})`, boxShadow: on ? `0 0 40px ${s.color}55` : 'none'}}>
            <div style={{fontFamily: F.sans, fontWeight: 700, fontSize: 34, letterSpacing: 4, color: on ? s.color : C.dim}}>{s.name}</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 6, height: 46}}>
              {Array.from({length: 7}).map((_, i) => {
                const h = on ? 10 + 36 * Math.abs(Math.sin(f / 2.3 + i * 1.3) * random(`b${i}${Math.floor(f / 3)}`)) : 8;
                return <div key={i} style={{width: 7, height: h, borderRadius: 4, background: on ? s.color : C.line}} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
