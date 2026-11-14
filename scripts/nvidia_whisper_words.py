"""Word timestamps of the tightened VO via faster-whisper, in 25 s windows (no VAD, so nothing is skipped).

Usage: python -I -X utf8 scripts/nvidia_whisper_words.py
Model: E:/hf_cache/fw-large-v3 (local, E: drive). Output: work/nvidia/whisper_win.json [{w, s, e}] in VO seconds.
"""
import json
import pathlib
import subprocess

import numpy as np
from faster_whisper import WhisperModel

ROOT = pathlib.Path(__file__).resolve().parent.parent
VO = ROOT / "public" / "nvidia" / "vo" / "vo.wav"
OUT = ROOT / "work" / "nvidia" / "whisper_win.json"
WIN, HOP = 25.0, 22.0  # 3 s overlap; words in the overlap are taken from the window whose centre is closer

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(VO), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
audio = np.frombuffer(raw, np.float32).copy()
total = len(audio) / 16000
m = WhisperModel("E:/hf_cache/fw-large-v3", device="cpu", compute_type="int8", cpu_threads=4)
words = []
t0 = 0.0
while t0 < total:
    a, b = int(t0 * 16000), int(min(total, t0 + WIN) * 16000)
    segs, _ = m.transcribe(audio[a:b], language="bn", beam_size=2, vad_filter=False, word_timestamps=True, condition_on_previous_text=False)
    lo = 0 if t0 == 0 else (WIN - HOP) / 2
    hi = WIN if t0 + WIN >= total else WIN - (WIN - HOP) / 2
    for s in segs:
        for w in s.words:
            mid = (w.start + w.end) / 2
            if lo <= mid < hi and w.word.strip():
                words.append({"w": w.word.strip(), "s": round(t0 + w.start, 3), "e": round(t0 + w.end, 3)})
    print(f"{t0:6.1f}s  words so far {len(words)}", flush=True)
    t0 += HOP
OUT.write_text(json.dumps(words, ensure_ascii=False), encoding="utf-8")
print("done", len(words))
