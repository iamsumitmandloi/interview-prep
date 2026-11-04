import React, {useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {createTikTokStyleCaptions} from '@remotion/captions';
import {C, F} from '../theme';
import {pop} from '../lib';
import {SPK} from './Speakers';

const isCode = (s: string) => /[a-z][A-Z]|\(\)|^@|\.dart|_/.test(s.trim());

export const Captions: React.FC<{words: any[]; y: number; big?: boolean}> = ({words, y, big}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const pages = useMemo(() => createTikTokStyleCaptions({
    captions: words.map((w, i) => ({text: (i ? ' ' : '') + w.text, startMs: w.startMs, endMs: w.endMs, timestampMs: w.startMs, confidence: 1})),
    combineTokensWithinMilliseconds: big ? 2200 : 1300,
  }).pages, [words, big]);
  const page = pages.find((p) => ms >= p.startMs && ms < p.startMs + p.durationMs + 120);
  if (!page) return null;
  const pf = Math.round((page.startMs / 1000) * fps);
  const a = pop(frame - pf, fps, 0, 14);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: y, display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
      transform: `translateY(${(1 - a) * 18}px)`, opacity: a}}>
      {page.tokens.map((t, i) => {
        const on = ms >= t.fromMs && ms < t.toMs + 60;
        const spk = SPK[words.find((w) => w.startMs === t.fromMs)?.speaker]?.color ?? C.blue;
        const code = isCode(t.text);
        return <span key={i} style={{fontFamily: code ? F.mono : F.sans, fontWeight: 700, fontSize: (code ? 60 : 68) * (big ? 1.35 : 1), lineHeight: 1.25,
          color: on ? (code ? C.yellow : spk) : code ? C.yellow : C.text, transform: `scale(${on ? 1.08 : 1})`, display: 'inline-block', margin: '0 14px',
          textShadow: `0 5px 0 ${C.bg}, 0 0 18px rgba(0,0,0,.8)`, WebkitTextStroke: `2px ${C.bg}`}}>{t.text.trim()}</span>;
      })}
    </div>
  );
};
