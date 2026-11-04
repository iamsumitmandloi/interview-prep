import React from 'react';
import {useCurrentFrame, useVideoConfig, interpolate, random} from 'remotion';
import {C, F} from '../theme';
import {GRAPHS, GNode} from '../presets';
import {msToF, pop, ease, clamp} from '../lib';

type NState = {label: string; sub?: string; tag?: string; old?: {label: string; sub?: string; tag?: string};
  destroyedAt?: number; reusedAt?: number; updatedAt?: number};

const Box: React.FC<{n: {label: string; sub?: string; tag?: string}; color: string; w: number; h: number; big?: boolean; glow?: number}> =
  ({n, color, w, h, big, glow = 0}) => (
  <div style={{width: w, height: h, borderRadius: big ? 30 : 20, background: C.panel, border: `3px solid ${color}`,
    boxShadow: `0 0 ${10 + glow * 50}px ${color}${glow ? '' : '55'}`, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: big ? 10 : 4, fontFamily: F.mono}}>
    <div style={{color: C.text, fontWeight: 700, fontSize: big ? 58 : 29}}>{n.label}</div>
    {n.sub && <div style={{color, fontSize: big ? 38 : 23}}>{n.sub}</div>}
    {n.tag && <div style={{color: C.dim, fontSize: big ? 34 : 20, fontFamily: F.sans}}>{n.tag}</div>}
  </div>
);

export const Graph: React.FC<{seg: any; box: {w: number; h: number}}> = ({seg, box}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const preset = GRAPHS[seg.steps[0].preset];
  if (!preset) return <div style={{color: C.pink, fontSize: 40}}>unknown preset {seg.steps[0].preset}</div>;
  const cards = preset.layout === 'cards';

  // replay ops up to now
  const st: Record<string, NState> = {};
  for (const n of preset.nodes) st[n.id] = {label: n.label, sub: n.sub, tag: n.tag};
  let focus: string[] = [], pin: string[] = [], note = '', noteAt = 0;
  seg.steps.forEach((s: any) => {
    const at = msToF(s.ms - seg.startMs, fps);
    if (at > frame) return;
    const ops = preset.steps[s.step] ?? {};
    for (const [id, v] of Object.entries(ops.destroy ?? {})) { st[id].old = {...st[id]}; Object.assign(st[id], v); st[id].destroyedAt = at; }
    for (const id of ops.reuse ?? []) st[id].reusedAt = at;
    for (const [id, v] of Object.entries(ops.update ?? {})) { Object.assign(st[id], v); st[id].updatedAt = at; }
    focus = ops.focus ?? []; pin = ops.pin ?? [];
    if (ops.note) { note = ops.note; noteAt = at; }
  });

  const colN = preset.columns?.length ?? 1;
  const nw = cards ? 820 : Math.min(318, (box.w - 40) / colN - 20), nh = cards ? 270 : 150;
  const colW = (box.w - 40) / colN;
  const rows = Math.max(...preset.nodes.map((n) => n.row)) + 1;
  const gap = cards ? 380 : Math.min(330, (box.h - 420) / rows);
  const top = cards ? (box.h - (rows - 1) * gap - nh) / 2 - 40 : 170;
  const pos = (n: GNode) => ({x: cards ? (box.w - nw) / 2 : 20 + n.col * colW + (colW - nw) / 2, y: top + n.row * gap});
  const colColor = (n: GNode) => (C as any)[preset.columns?.[n.col]?.color ?? (n.row === 0 ? 'blue' : 'cyan')];

  return (
    <div style={{position: 'absolute', inset: 0}}>
      {preset.columns?.map((c, i) => {
        const a = pop(frame, fps, i * 3);
        return <div key={c.title} style={{position: 'absolute', left: 20 + i * colW, width: colW, top: 50, textAlign: 'center', opacity: a,
          transform: `translateY(${(1 - a) * -30}px)`, fontFamily: F.sans, fontWeight: 700, fontSize: 34, letterSpacing: 4, color: (C as any)[c.color]}}>{c.title}</div>;
      })}
      <svg width={box.w} height={box.h} style={{position: 'absolute', inset: 0}}>
        {preset.links?.map(([a, b], i) => {
          const A = preset.nodes.find((n) => n.id === a)!, B = preset.nodes.find((n) => n.id === b)!;
          const pa = pos(A), pb = pos(B);
          const same = A.col === B.col;
          const [x1, y1, x2, y2] = same ? [pa.x + nw / 2, pa.y + nh, pb.x + nw / 2, pb.y] : [pa.x + nw, pa.y + nh / 2, pb.x, pb.y + nh / 2];
          const len = Math.hypot(x2 - x1, y2 - y1);
          const d = ease(frame, 10 + i * 2, 24 + i * 2);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={same ? C.line : C.dim} strokeWidth={4}
            strokeDasharray={same ? `${len}` : '10 10'} strokeDashoffset={same ? len * (1 - d) : 0} opacity={same ? 1 : d * 0.6} />;
        })}
      </svg>
      {preset.nodes.map((n, i) => {
        const s = st[n.id];
        const p = pos(n);
        const color = colColor(n);
        const appear = pop(frame, fps, 4 + i * 3);
        const dim = focus.length && !focus.includes(n.id) ? 0.25 : 1;
        const glow = pin.includes(n.id) ? 0.6 + 0.4 * Math.sin(frame / 5) : 0;
        const d = s.destroyedAt != null ? frame - s.destroyedAt : -1;
        const reuse = s.reusedAt != null ? frame - s.reusedAt : -1;
        const upd = s.updatedAt != null ? frame - s.updatedAt : -1;
        const pieces = [];
        if (d >= 0 && d < 22 && s.old) {
          for (let k = 0; k < 9; k++) {
            const gx = k % 3, gy = Math.floor(k / 3);
            const ang = random(`${n.id}${k}`) * Math.PI * 2;
            const dist = interpolate(d, [0, 20], [0, 160 + random(`d${n.id}${k}`) * 160], clamp);
            pieces.push(<div key={k} style={{position: 'absolute', left: 0, top: 0, clipPath: `inset(${gy * 33.3}% ${(2 - gx) * 33.3}% ${(2 - gy) * 33.3}% ${gx * 33.3}%)`,
              transform: `translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist + d * d * 0.6}px) rotate(${(random(`r${n.id}${k}`) - 0.5) * d * 30}deg)`,
              opacity: interpolate(d, [8, 21], [1, 0], clamp)}}>
              <Box n={s.old} color={C.pink} w={nw} h={nh} big={cards} />
            </div>);
          }
        }
        const dropIn = d >= 0 ? pop(d, fps, 8, 10) : 1;
        const showOld = d >= 0 && d < 1 && s.old;
        const flash = upd >= 0 ? interpolate(upd, [0, 4, 16], [0, 1, 0], clamp) : 0;
        return (
          <div key={n.id} style={{position: 'absolute', left: p.x, top: p.y, opacity: appear * dim, transform: `scale(${0.7 + 0.3 * appear})`}}>
            {pieces}
            {!(d >= 0 && d < 8) && (
              <div style={{transform: `translateY(${(1 - dropIn) * -120}px)`, opacity: dropIn, filter: flash ? `brightness(${1 + flash})` : undefined}}>
                <Box n={showOld ? s.old! : s} color={color} w={nw} h={nh} big={cards} glow={glow} />
              </div>
            )}
            {d >= 8 && d < 50 && <Tag text="NEW" color={C.pink} t={d - 8} fps={fps} />}
            {reuse >= 0 && (
              <>
                <div style={{position: 'absolute', inset: -10, borderRadius: cards ? 38 : 28, border: `5px solid ${C.green}`,
                  opacity: interpolate(reuse, [0, 6, 40, 60], [0, 1, 1, 0.5], clamp), transform: `scale(${1 + 0.06 * Math.sin(reuse / 3) * Math.max(0, 1 - reuse / 30)})`}} />
                {reuse < 60 && <Tag text={cards ? 'KEPT ✓' : 'REUSED'} color={C.green} t={reuse} fps={fps} />}
              </>
            )}
          </div>
        );
      })}
      {note && (
        <div style={{position: 'absolute', left: 50, right: cards ? 50 : 380, bottom: cards ? 60 : 30, textAlign: cards ? 'center' : 'left', fontFamily: F.sans, fontWeight: 700,
          fontSize: 50, color: C.yellow, opacity: ease(frame, noteAt + 10, noteAt + 20), transform: `translateY(${(1 - ease(frame, noteAt + 10, noteAt + 20)) * 30}px)`}}>
          {note}
        </div>
      )}
    </div>
  );
};

const Tag: React.FC<{text: string; color: string; t: number; fps: number}> = ({text, color, t, fps}) => {
  const a = pop(t, fps, 0, 9);
  return <div style={{position: 'absolute', right: -14, top: -22, background: color, color: C.bg, fontFamily: F.sans, fontWeight: 700,
    fontSize: 20, padding: '4px 12px', borderRadius: 10, transform: `scale(${a}) rotate(6deg)`}}>{text}</div>;
};
