import React from 'react';
import {Composition} from 'remotion';
import {Reel} from './Reel';
import {W, H} from './theme';
import sample from '../samples/sample.props.json';

export const Root: React.FC = () => (
  <Composition id="Reel" component={Reel} width={W} height={H} fps={30} durationInFrames={300}
    defaultProps={sample as any}
    calculateMetadata={({props}: any) => ({durationInFrames: Math.max(30, Math.round(((props.durationMs ?? 10000) / 1000) * (props.fps ?? 30))), fps: props.fps ?? 30})} />
);
