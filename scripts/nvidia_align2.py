"""Phrase-level forced alignment of the script to the tightened VO (better sync than nvidia_align.py).

Usage: python -I -X utf8 scripts/nvidia_align2.py
Script phrases (split at , । ? !) are matched to runs of consecutive speech chunks (silencedetect) by dynamic
programming: phrase durations must follow one global speaking rate and phrase breaks must fall on pauses.
Words inside a phrase are spread over its real span by letter weight. Writes src/nvidia/vo-words.json and prints
each phrase with its start time so it can be checked by ear.
"""
import json
import math
import pathlib
import re
import subprocess
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parent.parent
VO = ROOT / "public" / "nvidia" / "vo" / "vo.wav"
OUT = ROOT / "src" / "nvidia" / "vo-words.json"
LAST_WORD = "লিখুন।"  # the recording ends here (later script lines were not recorded)

md = (ROOT / "scripts" / "nvidia_script.md").read_text(encoding="utf-8")
text = " ".join(l for l in re.findall(r"🎙️ (.+)", md) if not l.startswith("=")).replace("**", "")
words = text.split()
words = words[: words.index(LAST_WORD) + 1]

# phrases = runs of words ending in punctuation
phrases, cur = [], []
for w in words:
    cur.append(w)
    if re.search(r"[,।?!:]$", w):
        phrases.append(cur)
        cur = []
if cur:
    phrases.append(cur)


def weight(w):
    return max(1.5, sum(1 for c in w if unicodedata.category(c)[0] == "L"))


PW = [sum(weight(w) for w in p) for p in phrases]

r = subprocess.run(["ffmpeg", "-i", str(VO), "-af", "silencedetect=noise=-38dB:d=0.10", "-f", "null", "-"], capture_output=True, text=True)
ss = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", r.stderr)]
se = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", r.stderr)]
total = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(VO)], capture_output=True, text=True).stdout)
chunks, c0 = [], 0.0
for s, e in zip(ss, se + [total] * (len(ss) - len(se))):
    if s - c0 > 0.04:
        chunks.append((c0, s))
    c0 = e
if total - c0 > 0.04:
    chunks.append((c0, total))

speech = sum(b - a for a, b in chunks)
rate = speech / sum(PW)
P, C = len(phrases), len(chunks)
INF = 1e18
best = [[INF] * (C + 1) for _ in range(P + 1)]
back = [[None] * (C + 1) for _ in range(P + 1)]
best[0][0] = 0.0
for i in range(P):
    exp = PW[i] * rate
    for j in range(C + 1):
        if best[i][j] >= INF:
            continue
        for skip in (0, 1, 2):  # drop tiny noise chunks
            j0 = j + skip
            if j0 > C:
                break
            if skip and any(chunks[q][1] - chunks[q][0] > 0.18 for q in range(j, j0)):
                break
            for n in range(1, 12):
                j2 = j0 + n
                if j2 > C:
                    break
                dur = sum(b - a for a, b in chunks[j0:j2])
                cost = 3.0 * math.log(dur / exp) ** 2 + skip * 0.6
                gap_before = chunks[j0][0] - chunks[j0 - 1][1] if j0 > 0 else 1.0
                cost += max(0.0, 0.22 - gap_before) * 6  # phrase should start after a pause
                inner = max((chunks[q + 1][0] - chunks[q][1] for q in range(j0, j2 - 1)), default=0)
                cost += max(0.0, inner - 0.6) * 3  # long pause inside a phrase is unlikely
                if best[i][j] + cost < best[i + 1][j2]:
                    best[i + 1][j2] = best[i][j] + cost
                    back[i + 1][j2] = (j, j0)
jend = min(range(C + 1), key=lambda j: best[P][j] + (C - j) * 2.0)
spans = []
j = jend
for i in range(P, 0, -1):
    pj, j0 = back[i][j]
    spans.append((j0, j))
    j = pj
spans.reverse()

out = []
for ph, (j0, j2) in zip(phrases, spans):
    segs = chunks[j0:j2]
    dur = sum(b - a for a, b in segs)
    ws = [weight(w) for w in ph]
    tot = sum(ws)

    def real(u):  # u in [0, dur] speech-time inside the phrase → real seconds
        acc = 0.0
        for a, b in segs:
            if u <= acc + (b - a):
                return a + (u - acc)
            acc += b - a
        return segs[-1][1]

    acc = 0.0
    for w, wt in zip(ph, ws):
        s = real(acc / tot * dur)
        e = real((acc + wt) / tot * dur)
        out.append({"text": w, "startMs": round(s * 1000), "endMs": round(max(e, s + 0.06) * 1000)})
        acc += wt
    print(f"{segs[0][0]:7.2f}-{segs[-1][1]:7.2f}  {' '.join(ph)}")
OUT.write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding="utf-8")
print(f"phrases={P} chunks={C} rate={rate:.3f}s/letter words={len(out)} cost={best[P][jend]:.1f}")
