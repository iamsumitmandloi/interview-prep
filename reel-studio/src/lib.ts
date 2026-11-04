import {spring, interpolate, Easing} from 'remotion';
export const msToF = (ms: number, fps: number) => Math.round((ms / 1000) * fps);
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const pop = (frame: number, fps: number, delay = 0, damping = 12) =>
  spring({frame: frame - delay, fps, config: {damping, stiffness: 180, mass: 0.6}});
export const ease = (frame: number, from: number, to: number, a = 0, b = 1) =>
  interpolate(frame, [from, to], [a, b], {...clamp, easing: Easing.out(Easing.cubic)});

// which step of a stepped graphic is active at this local frame
export function useStep(steps: any[], frame: number, fps: number, segStartMs: number) {
  let i = 0;
  for (let k = 0; k < steps.length; k++) if (msToF(steps[k].ms - segStartMs, fps) <= frame) i = k;
  const since = frame - msToF(steps[i].ms - segStartMs, fps);
  return {i, step: steps[i], since};
}

// tiny dart highlighter: good enough for reels, zero deps
const KW = new Set('abstract as assert async await break case catch class const continue covariant default deferred do dynamic else enum export extends extension external factory false final finally for get if implements import in is late library mixin new null on operator part required rethrow return set show static super switch sync this throw true try typedef var void while with yield'.split(' '));
export type Tok = {t: string; c: string};
export function highlightDart(line: string, C: any): Tok[] {
  const out: Tok[] = [];
  const re = /(\/\/.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|(@\w+)|(\b\d+\b)|(\b[A-Za-z_]\w*\b)|(\s+)|(.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const [s, com, str, ann, num, id, ws] = m;
    if (com) out.push({t: s, c: C.dim});
    else if (str) out.push({t: s, c: C.green});
    else if (ann) out.push({t: s, c: C.yellow});
    else if (num) out.push({t: s, c: C.pink});
    else if (id) out.push({t: s, c: KW.has(s) ? C.pink : /^_?[A-Z]/.test(s) ? C.blue : /^\w+$/.test(s) && line[m.index + s.length] === '(' ? C.cyan : C.text});
    else if (ws) out.push({t: s, c: C.text});
    else out.push({t: s, c: C.dim});
  }
  return out;
}
