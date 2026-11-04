import React from 'react';
import {useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {C, F} from '../theme';
import {SNIPPETS} from '../snippets';
import {highlightDart, useStep, pop, ease, clamp} from '../lib';

// steps: [{snippet, highlight:[lines 1-based], caption?}]  later steps only change highlight/caption
export const CodeSnippet: React.FC<{seg: any; box: {w: number; h: number}}> = ({seg, box}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {step, since} = useStep(seg.steps, frame, fps, seg.startMs);
  const snip = SNIPPETS[seg.steps[0].snippet] ?? {file: '??', code: `// unknown snippet "${seg.steps[0].snippet}"`};
  const lines = snip.code.split('\n');
  const maxLen = Math.max(...lines.map((l) => l.length));
  const fs = Math.min(36, (box.w - 190) / (0.6 * maxLen), (box.h - 260) / (lines.length * 1.55));
  const lh = fs * 1.55;
  const hl: number[] = step.highlight ?? [];
  const enter = pop(frame, fps);
  return (
    <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transform: `translateY(${(1 - enter) * 80}px) scale(${0.92 + 0.08 * enter})`, opacity: enter}}>
      <div style={{width: box.w - 80, background: C.panel, borderRadius: 28, border: `2px solid ${C.line}`, overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(0,0,0,.45)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '18px 26px', background: C.bg2, borderBottom: `2px solid ${C.line}`}}>
          {[C.pink, C.yellow, C.green].map((c) => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />)}
          <div style={{marginLeft: 14, fontFamily: F.mono, fontSize: 24, color: C.dim}}>{snip.file}</div>
        </div>
        <div style={{padding: '22px 0', fontFamily: F.mono, fontSize: fs, lineHeight: `${lh}px`, position: 'relative'}}>
          {lines.map((ln, i) => {
            const on = hl.includes(i + 1);
            const appear = ease(frame, i * 1.2, i * 1.2 + 8);
            const sweep = on ? ease(since, 0, 10) : 0;
            const dimmed = hl.length > 0 && !on;
            return (
              <div key={i} style={{position: 'relative', display: 'flex', paddingLeft: 24, opacity: appear * (dimmed ? 0.38 : 1),
                transform: `translateX(${(1 - appear) * -30}px)`, whiteSpace: 'pre'}}>
                <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${sweep * 100}%`, background: 'rgba(255,216,77,.13)',
                  borderLeft: on ? `6px solid ${C.yellow}` : 'none'}} />
                <span style={{width: fs * 2.2, color: C.line, textAlign: 'right', marginRight: fs, position: 'relative'}}>{i + 1}</span>
                <span style={{position: 'relative'}}>
                  {highlightDart(ln, C).map((t, k) => <span key={k} style={{color: t.c, fontWeight: on ? 700 : 400}}>{t.t}</span>)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {step.caption && (
        <div style={{marginTop: 30, fontFamily: F.sans, fontWeight: 700, fontSize: 44, color: C.yellow, textAlign: 'center', padding: '0 60px',
          opacity: interpolate(since, [0, 8], [0, 1], clamp), transform: `translateY(${interpolate(since, [0, 8], [20, 0], clamp)}px)`}}>
          {step.caption}
        </div>
      )}
    </div>
  );
};
