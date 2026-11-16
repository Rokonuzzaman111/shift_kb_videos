"""Creator's own Svalbard voiceover → tightened, sharpened VO + word timings.

  python -I -X utf8 scripts/svalbard_uservo.py tighten   # work/svalbard/uservo/raw.mp3 → vo_tight.wav (+ timemap.json)
  python -I -X utf8 scripts/svalbard_uservo.py whisper   # word timestamps of vo_tight.wav → whisper.json

Rules (from the creator): only long pauses are shortened — speech itself is never cut, stretched or pitch-shifted.
Voice is made clearer/sharper with gentle EQ + light denoise + compression + loudness normalisation.
All files stay on E:.
"""
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
W = ROOT / "work" / "svalbard" / "uservo"
RAW = W / "raw.mp3"
CLEAN = W / "clean.wav"
TIGHT = W / "vo_tight.wav"
MAXGAP, KEEP, LEAD, TAIL = 0.55, 0.40, 0.25, 0.4  # s
SR = 48000

# MINIMAL clarity chain (creator: "only a little sharper, nothing else" — no denoise, no compressor):
# rumble cut + gentle presence/air lift, then LINEAR two-pass loudness gain (keeps the voice's own dynamics).
EQ = "highpass=f=70,equalizer=f=3200:t=q:w=1.4:g=2.5,highshelf=f=8000:g=1.5"


def run(args, **kw):
    return subprocess.run(args, capture_output=True, text=True, **kw)


def tighten():
    m = run(["ffmpeg", "-i", str(RAW), "-af", EQ + ",loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"])
    js = json.loads(m.stderr[m.stderr.rindex("{") : m.stderr.rindex("}") + 1])
    ln = (
        f"loudnorm=I=-16:TP=-1.5:LRA=11:linear=true:measured_I={js['input_i']}:measured_TP={js['input_tp']}"
        f":measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}"
    )
    r = run(["ffmpeg", "-y", "-v", "error", "-i", str(RAW), "-af", f"{EQ},{ln}", "-ar", str(SR), "-ac", "1", str(CLEAN)])
    if r.returncode:
        raise SystemExit(r.stderr)
    r = run(["ffmpeg", "-i", str(CLEAN), "-af", f"silencedetect=noise=-38dB:d={MAXGAP}", "-f", "null", "-"])
    starts = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", r.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", r.stderr)]
    total = float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(CLEAN)]).stdout)
    if len(ends) < len(starts):
        ends.append(total)
    pieces, cur, out = [], 0.0, 0.0  # (raw_a, raw_b, out_start)
    for s, e in zip(starts, ends):
        if s <= 0.05:
            cur = max(0.0, e - LEAD)
            continue
        if e >= total - 0.05:  # trailing silence
            pieces.append((cur, min(total, s + TAIL), out))
            out += min(total, s + TAIL) - cur
            cur = total
            break
        half = KEEP / 2
        pieces.append((cur, s + half, out))
        out += s + half - cur
        cur = e - half
    if total - cur > 0.05:
        pieces.append((cur, total, out))
        out += total - cur
    # cut with 12 ms fades at every join
    filt, labels = [], []
    for i, (a, b, _) in enumerate(pieces):
        d = b - a
        filt.append(f"[0:a]atrim={a:.4f}:{b:.4f},asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st={max(0, d - 0.012):.4f}:d=0.012[p{i}]")
        labels.append(f"[p{i}]")
    filt.append("".join(labels) + f"concat=n={len(pieces)}:v=0:a=1[o]")
    script = W / "tighten_filter.txt"
    script.write_text(";".join(filt), encoding="utf-8")
    r = run(["ffmpeg", "-y", "-v", "error", "-i", str(CLEAN), "-/filter_complex", str(script), "-map", "[o]", "-ar", str(SR), str(TIGHT)])
    if r.returncode:
        raise SystemExit(r.stderr)
    (W / "timemap.json").write_text(json.dumps(pieces), encoding="utf-8")
    print(f"raw {total:.2f}s → tight {out:.2f}s, {len(pieces)} pieces, {len(starts)} pauses shortened")


def whisper():
    import numpy as np
    from faster_whisper import WhisperModel

    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(TIGHT), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
    audio = np.frombuffer(raw, np.float32).copy()
    m = WhisperModel("E:/hf_cache/fw-large-v3", device="cpu", compute_type="int8", cpu_threads=4)
    win, hop = 25.0, 22.0
    total = len(audio) / 16000
    words, t0 = [], 0.0
    while t0 < total:
        a, b = int(t0 * 16000), int(min(total, t0 + win) * 16000)
        segs, _ = m.transcribe(audio[a:b], language="bn", beam_size=3, vad_filter=False, word_timestamps=True, condition_on_previous_text=False)
        lo = 0 if t0 == 0 else (win - hop) / 2
        hi = win if t0 + win >= total else win - (win - hop) / 2
        for s in segs:
            for w in s.words:
                mid = (w.start + w.end) / 2
                if lo <= mid < hi and w.word.strip():
                    words.append({"w": w.word.strip(), "s": round(t0 + w.start, 3), "e": round(t0 + w.end, 3)})
        print(f"{t0:6.1f}s  words {len(words)}", flush=True)
        t0 += hop
    (W / "whisper.json").write_text(json.dumps(words, ensure_ascii=False), encoding="utf-8")
    print("done", len(words))


if __name__ == "__main__":
    {"tighten": tighten, "whisper": whisper}[sys.argv[1]]()
