"""Word timeline for the tightened VO from the SCRIPT text (the creator read scripts/nvidia_script.md).

Usage: python -I -X utf8 scripts/nvidia_align.py
In:  public/nvidia/vo/vo.wav (tightened), scripts/nvidia_script.md (🎙️ lines), src/nvidia/vo-words.json (whisper
     words already mapped to the tight timeline — used as anchors where they match the script)
Out: src/nvidia/vo-words.json (script words with timings)
Method: speech intervals from silencedetect; script words spread over speech time by letter weight; then a
piecewise-linear warp so script words that match a confident whisper word land exactly on it.
"""
import json
import pathlib
import re
import subprocess
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parent.parent
VO = ROOT / "public" / "nvidia" / "vo" / "vo.wav"
WJ = ROOT / "src" / "nvidia" / "vo-words.json"
WHISPER_BACKUP = ROOT / "work" / "nvidia" / "whisper-words.json"

if not WHISPER_BACKUP.exists():
    WHISPER_BACKUP.write_text(WJ.read_text(encoding="utf-8"), encoding="utf-8")
whisper = json.loads(WHISPER_BACKUP.read_text(encoding="utf-8"))

md = (ROOT / "scripts" / "nvidia_script.md").read_text(encoding="utf-8")
text = " ".join(l for l in re.findall(r"🎙️ (.+)", md) if not l.startswith("="))
text = text.replace("**", "")
words = [w for w in text.split() if w.strip()]

r = subprocess.run(["ffmpeg", "-i", str(VO), "-af", "silencedetect=noise=-40dB:d=0.12", "-f", "null", "-"],
                   capture_output=True, text=True)
ss = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", r.stderr)]
se = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", r.stderr)]
total = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(VO)],
                             capture_output=True, text=True).stdout)
speech, cur = [], 0.0
for s, e in zip(ss, se + [total] * (len(ss) - len(se))):
    if s - cur > 0.05:
        speech.append([cur, s])
    cur = e
if total - cur > 0.05:
    speech.append([cur, total])


def weight(w):
    base = sum(1 for c in w if unicodedata.category(c)[0] == "L")  # letters (vowel signs are Mn → skipped)
    return max(1.5, base) + (1.2 if re.search(r"[,।?!]$", w) else 0)


# speech time axis: map "speech seconds" (silence removed) ↔ real seconds
cum = [0.0]
for a, b in speech:
    cum.append(cum[-1] + (b - a))
S = cum[-1]


def real(u):  # speech-seconds → real seconds
    for i, (a, b) in enumerate(speech):
        if u <= cum[i + 1]:
            return a + (u - cum[i])
    return speech[-1][1]


def spch(t):  # real → speech-seconds
    for i, (a, b) in enumerate(speech):
        if t < a:
            return cum[i]
        if t <= b:
            return cum[i] + (t - a)
    return S


W = [weight(w) for w in words]
tw = sum(W)
pos, acc = [], 0.0
for w in W:
    pos.append((acc / tw * S, (acc + w * 0.92) / tw * S))
    acc += w


# anchors: script word ↔ whisper word with the same normalised text, in order, near the expected place
def norm(s):
    s = re.sub(r"[,।?!\.\"“”‘’'\-]", "", s)
    return "".join(c for c in s if unicodedata.category(c)[0] == "L")


anchors = [(0.0, 0.0)]
j = 0
for i, w in enumerate(words):
    n = norm(w)
    if len(n) < 3:
        continue
    exp = pos[i][0]
    for k in range(j, len(whisper)):
        ws = spch(whisper[k]["startMs"] / 1000)
        if ws > exp + 12:
            break
        if norm(whisper[k]["text"]) == n and abs(ws - exp) < 12:
            x0, y0 = anchors[-1]
            slope = (ws - y0) / max(1e-6, exp - x0)
            if len(n) >= 4 and exp > x0 + 0.3 and 0.6 < slope < 1.7:
                anchors.append((exp, ws))
            j = k + 1
            break
anchors.append((S, S))


def warp(u):
    for (x0, y0), (x1, y1) in zip(anchors, anchors[1:]):
        if u <= x1:
            return y0 + (u - x0) / max(1e-6, x1 - x0) * (y1 - y0)
    return u


out = []
for w, (a, b) in zip(words, pos):
    s, e = real(warp(a)), real(warp(b))
    out.append({"text": w, "startMs": round(s * 1000), "endMs": round(max(e, s + 0.08) * 1000)})
WJ.write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding="utf-8")
print(f"words={len(words)} speech={S:.1f}s total={total:.1f}s anchors={len(anchors) - 2}")
