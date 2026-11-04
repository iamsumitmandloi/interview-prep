#!/usr/bin/env bash
# synthesises the sfx pack with ffmpeg: zero licences, zero downloads.
# swap any file in public/sfx for a pixabay/mixkit one later, keep the name.
set -e
cd "$(dirname "$0")/../public/sfx"
F="ffmpeg -y -loglevel error"
# whoosh: pink-noise sweep through a moving bandpass
$F -f lavfi -i "anoisesrc=d=0.45:c=pink:a=0.9" -af "bandpass=f=1200:w=900,afade=t=in:d=0.18,afade=t=out:st=0.2:d=0.25,volume=2" whoosh.mp3
# pop: tiny pitched blip
$F -f lavfi -i "sine=f=880:d=0.09" -af "afade=t=out:st=0.02:d=0.07,volume=0.8" pop.mp3
# ding: two harmonics with long tail
$F -f lavfi -i "sine=f=1318:d=0.9" -f lavfi -i "sine=f=2637:d=0.9" -filter_complex "amix=inputs=2,afade=t=out:st=0.05:d=0.85,volume=1.4" ding.mp3
# boom: sub drop (vine-boom-ish slam)
$F -f lavfi -i "sine=f=55:d=0.7" -f lavfi -i "anoisesrc=d=0.12:c=brown:a=0.8" -filter_complex "amix=inputs=2,afade=t=out:st=0.08:d=0.6,volume=3" boom.mp3
# shatter: bright noise crackle
$F -f lavfi -i "anoisesrc=d=0.5:c=white:a=0.7" -af "highpass=f=2500,tremolo=f=38:d=0.9,afade=t=out:st=0.05:d=0.45" shatter.mp3
# tick: click for step changes
$F -f lavfi -i "sine=f=2200:d=0.03" -af "afade=t=out:st=0.005:d=0.025,volume=0.6" tick.mp3
ls -lh
