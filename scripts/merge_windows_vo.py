"""Put Windows-voice token timings onto the Bangla caption tokens and encode mp3s.

Usage: python -I -X utf8 scripts/merge_windows_vo.py
Reads public/vo/caffeine/<key>.wav + <key>.win.json and the Bangla tokens from
public/vo/caffeine_pradeep/<key>.json (backup of the original VO). Writes <key>.mp3, <key>.json
and src/caffeine/vo-lengths.json, so captions stay Bangla and every shot beat still lands on its word.
"""
import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
VO = ROOT / "public" / "vo" / "caffeine"
BN = ROOT / "public" / "vo" / "caffeine_pradeep"
KEYS = ["hook", "adeno", "caff", "energy", "time", "crash", "memory", "tolerance", "tips"]


def duration(p: pathlib.Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                       capture_output=True, text=True)
    return float(r.stdout.strip())


lengths = {}
for k in KEYS:
    bn = json.loads((BN / f"{k}.json").read_text(encoding="utf-8"))
    starts = json.loads((VO / f"{k}.win.json").read_text(encoding="ascii"))
    assert len(bn) == len(starts), f"{k}: {len(bn)} Bangla tokens vs {len(starts)} timings"
    # fill any missing start by interpolating between neighbours
    for i, s in enumerate(starts):
        if s < 0:
            prev = starts[i - 1] if i else 0
            nxt = next((x for x in starts[i + 1:] if x >= 0), prev + 400)
            starts[i] = (prev + nxt) / 2
    wav = VO / f"{k}.wav"
    total = duration(wav) * 1000
    words = []
    for i, w in enumerate(bn):
        start = starts[i]
        end = starts[i + 1] - 40 if i + 1 < len(starts) else min(total - 150, start + 700)
        words.append({"text": w["text"], "startMs": round(start, 1), "endMs": round(max(end, start + 120), 1)})
    (VO / f"{k}.json").write_text(json.dumps(words, ensure_ascii=False, indent=1), encoding="utf-8")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-ac", "1", "-ar", "24000", "-b:a", "64k", str(VO / f"{k}.mp3")],
                   check=True)
    lengths[k] = round(words[-1]["endMs"] / 1000 + 0.35, 2)

(ROOT / "src" / "caffeine" / "vo-lengths.json").write_text(json.dumps(lengths, indent=1), encoding="utf-8")
print(lengths, "total", round(sum(lengths.values()), 2))
