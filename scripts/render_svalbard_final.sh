#!/usr/bin/env bash
# Final 1080x1920 render of the Svalbard v2 reel on a low-RAM laptop.
# Resumable: finished chunks are kept and skipped. Each part: muted video in 120-frame chunks (fresh browser each),
# audio rendered once, muxed; then the 5 parts are joined into out/svalbard/svalbard_final_1080p.mp4.
# Usage: bash scripts/render_svalbard_final.sh
set -u
cd "$(dirname "$0")/.."
B=work/svalbard/bundle_final
OUT=out/svalbard/final
CH=120
mkdir -p "$OUT"
if [ ! -f "$B/index.html" ]; then
  npx remotion bundle src/svalbard_v2.tsx --out-dir="$B" --log=error 2>&1 | grep -iv "npm notice"
fi
: > "$OUT/parts.txt"
for n in 1 2 3 4 5; do
  C="SvalbardV2Part$n"
  D="$OUT/p$n"
  mkdir -p "$D"
  TOTAL=$(npx remotion compositions "$B" 2>/dev/null | grep "^$C " | awk '{print $4}')
  echo "== $C: $TOTAL frames"
  : > "$D/list.txt"
  i=0
  for ((s = 0; s < TOTAL; s += CH)); do
    e=$((s + CH - 1)); [ $e -ge $TOTAL ] && e=$((TOTAL - 1))
    f=$(printf "v_%03d.mp4" $i)
    for try in 1 2 3; do
      [ -s "$D/$f" ] && break
      npx remotion render "$B" "$C" "$D/$f" --frames=$s-$e --muted --crf=17 --jpeg-quality=92 --gl=angle --concurrency=1 --log=error 2>&1 | grep -i "error" | grep -v "^\s*at " | head -3
    done
    if [ -s "$D/$f" ]; then echo "  chunk $i ($s-$e) ok"; else echo "  chunk $i ($s-$e) FAILED"; exit 1; fi
    echo "file '$f'" >> "$D/list.txt"
    i=$((i + 1))
  done
  if [ ! -s "$D/audio.wav" ]; then
    npx remotion render "$B" "$C" "$D/audio.wav" --codec=wav --concurrency=1 --log=error 2>&1 | grep -i error | head -3
  fi
  ffmpeg -v error -y -f concat -safe 0 -i "$D/list.txt" -i "$D/audio.wav" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest "$OUT/part$n.mp4" || exit 1
  echo "file 'part$n.mp4'" >> "$OUT/parts.txt"
  echo "  part$n.mp4 done"
done
ffmpeg -v error -y -f concat -safe 0 -i "$OUT/parts.txt" -c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p -c:a aac -b:a 256k -movflags +faststart out/svalbard/svalbard_final_1080p.mp4 || exit 1
ffprobe -v error -show_entries format=duration:stream=width,height -of csv=p=0 out/svalbard/svalbard_final_1080p.mp4
echo "FINAL DONE"
