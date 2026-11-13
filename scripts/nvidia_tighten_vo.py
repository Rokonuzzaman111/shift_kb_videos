"""Cut long reading pauses out of the creator's VO and build the global word timeline.

Usage: python -I -X utf8 scripts/nvidia_tighten_vo.py <whisper_json>
In:  public/vo/nvidia/vo.wav (cleaned take), whisper word timestamps (raw take time)
Out: public/nvidia/vo/vo.wav (tightened), src/nvidia/vo-words.json (final-timeline ms), work/nvidia/timemap.json
Rule: every silence longer than MAXGAP is shortened to KEEP (sentence breaks stay natural); voice itself is never
time-stretched or pitch-shifted — only silence is removed, with 15 ms fades at each cut.
"""
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "vo" / "nvidia" / "vo.wav"
DST = ROOT / "public" / "nvidia" / "vo" / "vo.wav"
MAXGAP, KEEP, LEAD = 0.55, 0.42, 0.5  # s; LEAD = silence kept before first word

r = subprocess.run(["ffmpeg", "-i", str(SRC), "-af", "silencedetect=noise=-40dB:d=%.2f" % MAXGAP, "-f", "null", "-"],
                   capture_output=True, text=True)
starts = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", r.stderr)]
ends = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", r.stderr)]
total = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(SRC)],
                             capture_output=True, text=True).stdout)
if len(ends) < len(starts):
    ends.append(total)

# keep-pieces of the raw take: [a, b] → placed at out time
pieces, cur, out = [], 0.0, 0.0
for i, (s, e) in enumerate(zip(starts, ends)):
    if s <= 0.01:  # leading silence
        cur = max(0.0, e - LEAD)
        continue
    keep_half = KEEP / 2
    a, b = cur, s + keep_half
    pieces.append((a, b, out))
    out += b - a
    cur = e - keep_half
if total - cur > 0.05:
    pieces.append((cur, total, out))
    out += total - cur


def tmap(t):
    for a, b, o in pieces:
        if t <= b:
            return o + max(0.0, t - a)
    a, b, o = pieces[-1]
    return o + (b - a)


import numpy as np
from scipy.io import wavfile
sr, x = wavfile.read(str(SRC))
x = x.astype(np.float32)
fn = int(0.015 * sr)
ramp = np.linspace(0, 1, fn, dtype=np.float32)
chunks = []
for a, b, o in pieces:
    c = x[int(round(a * sr)):int(round(b * sr))].copy()
    if len(c) > 2 * fn:
        c[:fn] *= ramp
        c[-fn:] *= ramp[::-1]
    chunks.append(c)
DST.parent.mkdir(parents=True, exist_ok=True)
(ROOT / "work" / "nvidia").mkdir(parents=True, exist_ok=True)
y = np.concatenate(chunks)
wavfile.write(str(DST), sr, np.clip(y, -32768, 32767).astype(np.int16) if x.dtype != np.float32 or np.abs(y).max() > 2 else y)

segs = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
words = []
for s in segs:
    for w in s["words"]:
        t = w["w"].strip()
        if not t:
            continue
        words.append({"text": t, "startMs": round(tmap(w["s"]) * 1000), "endMs": round(tmap(w["e"]) * 1000)})
(ROOT / "src" / "nvidia" / "vo-words.json").write_text(json.dumps(words, ensure_ascii=False, indent=0), encoding="utf-8")
(ROOT / "work" / "nvidia" / "timemap.json").write_text(json.dumps(pieces), encoding="utf-8")
print(f"raw {total:.1f}s -> tight {out:.1f}s, pieces={len(pieces)}, words={len(words)}")
