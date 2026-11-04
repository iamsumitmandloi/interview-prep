import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {C} from '../theme';

// mascot for voice-only reels. mouth follows word timestamps, blinks, bobs while talking.
export const Panda: React.FC<{words: any[]}> = ({words}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = (f / fps) * 1000;
  const w = words.find((x) => ms >= x.startMs && ms < x.endMs);
  const talking = !!w;
  const mouth = w ? 0.25 + 0.75 * Math.abs(Math.sin(((ms - w.startMs) / Math.max(80, w.endMs - w.startMs)) * Math.PI * Math.max(1, Math.round(w.text.length / 4)))) : 0;
  const blinkT = f % 105;
  const eye = blinkT < 4 ? Math.abs(blinkT - 2) / 2 : 1;
  const bob = talking ? Math.sin(f / 3.2) * 6 : Math.sin(f / 14) * 3;
  const tilt = talking ? Math.sin(f / 9) * 3 : 0;
  const look = Math.sin(f / 40) * 4;
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 45%, #13224a, ${C.bg} 75%)`, justifyContent: 'center', alignItems: 'center'}}>
      <svg viewBox="0 0 400 420" style={{height: '78%', maxWidth: '92%', transform: `translateY(${bob}px) rotate(${tilt}deg)`, overflow: 'visible'}}>
        {/* body + laptop */}
        <ellipse cx="200" cy="395" rx="150" ry="70" fill="#f4f6fb" />
        <ellipse cx="80" cy="370" rx="40" ry="34" fill="#151820" />
        <ellipse cx="320" cy="370" rx="40" ry="34" fill="#151820" />
        <rect x="120" y="345" width="160" height="70" rx="10" fill="#1e2a4a" stroke={C.blue} strokeWidth="4" />
        <path d="M185 372 l14 -14 l14 14 l-14 14 z" fill={C.blue} />
        {/* ears */}
        <circle cx="88" cy="78" r="52" fill="#151820" />
        <circle cx="312" cy="78" r="52" fill="#151820" />
        <circle cx="88" cy="78" r="24" fill="#2a2f3d" />
        <circle cx="312" cy="78" r="24" fill="#2a2f3d" />
        {/* head */}
        <ellipse cx="200" cy="185" rx="165" ry="150" fill="#f4f6fb" />
        {/* eye patches */}
        <ellipse cx="135" cy="175" rx="46" ry="56" transform="rotate(-25 135 175)" fill="#151820" />
        <ellipse cx="265" cy="175" rx="46" ry="56" transform="rotate(25 265 175)" fill="#151820" />
        {/* eyes */}
        {[140, 260].map((x) => (
          <g key={x} transform={`translate(${x + look} 172) scale(1 ${eye})`}>
            <circle r="20" fill="#fff" />
            <circle r="12" cx="2" fill={C.navy} />
            <circle r="5" cx="-4" cy="-6" fill="#fff" />
          </g>
        ))}
        {/* glasses (dev panda) */}
        <g fill="none" stroke={C.blue} strokeWidth="6">
          <circle cx="140" cy="172" r="40" /><circle cx="260" cy="172" r="40" /><path d="M180 168 q20 -12 40 0" />
        </g>
        {/* cheeks */}
        <ellipse cx="105" cy="245" rx="20" ry="11" fill={C.pink} opacity="0.35" />
        <ellipse cx="295" cy="245" rx="20" ry="11" fill={C.pink} opacity="0.35" />
        {/* nose + mouth */}
        <ellipse cx="200" cy="232" rx="20" ry="13" fill="#151820" />
        <path d="M200 245 v10" stroke="#151820" strokeWidth="5" strokeLinecap="round" />
        {mouth > 0.05
          ? <g><ellipse cx="200" cy={262 + mouth * 9} rx={20 + mouth * 6} ry={4 + mouth * 20} fill="#3a1220" />
              <ellipse cx="200" cy={270 + mouth * 15} rx={10 + mouth * 4} ry={2 + mouth * 7} fill={C.pink} /></g>
          : <path d="M178 258 q11 12 22 0 q11 12 22 0" fill="none" stroke="#151820" strokeWidth="5" strokeLinecap="round" />}
      </svg>
    </AbsoluteFill>
  );
};
