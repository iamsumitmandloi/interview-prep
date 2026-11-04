// npm run render -- reels/001-stateful-vs-stateless.json [--preview]
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const reel = process.argv[2];
const preview = process.argv.includes('--preview');
execFileSync('node', ['scripts/build-props.mjs', reel], {stdio: 'inherit'});
const name = path.basename(reel, '.json');
const props = `out/props/${name}.json`;
const args = ['remotion', 'render', 'src/index.ts', 'Reel', `out/${name}${preview ? '.preview' : ''}.mp4`, `--props=${props}`];
if (preview) args.push('--scale=0.5');
if (process.env.CHROME) args.push(`--browser-executable=${process.env.CHROME}`);
execFileSync('npx', args, {stdio: 'inherit'});
