#!/usr/bin/env bash
# mac only. usage: bash scripts/transcribe.sh public/raw/001.mov 001
# -> captions/001.words.json
set -e
IN="$1"; ID="$2"
MODEL="${WHISPER_MODEL:-$HOME/development/whisper-models/ggml-small.en.bin}"
TMP="$(mktemp -d)"
ffmpeg -loglevel error -y -i "$IN" -ar 16000 -ac 1 "$TMP/a.wav"
whisper-cli -m "$MODEL" -f "$TMP/a.wav" -ojf -of "$TMP/t" -l en \
  --prompt "Flutter, Dart, StatefulWidget, StatelessWidget, setState, BuildContext, initState, didChangeDependencies, didUpdateWidget, createState, createElement, markNeedsBuild, RenderObject, InheritedWidget, Riverpod, Bloc, pubspec.yaml"
node "$(dirname "$0")/whisper-to-words.mjs" "$TMP/t.json" "captions/$ID.words.json"
rm -rf "$TMP"
