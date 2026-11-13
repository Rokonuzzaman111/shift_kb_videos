"""Align the creator's own voiceover recording to the script, sentence by sentence.

Usage: python -I -X utf8 scripts/align_user_vo.py [--write]
Input:  public/vo/caffeine_user/raw.wav (one long take with pauses), script lines in scripts/tts_caffeine.py,
        Pradeep TTS word timings (public/vo/caffeine_pradeep/*.json or public/vo/caffeine/*.json) as a pacing reference.
Method: silence detection → speech segments; dynamic programming assigns each script sentence a run of
        consecutive segments so durations match the TTS pacing (one global speed factor) and sentence breaks
        land on pauses. Word timings inside a sentence are the TTS word timings stretched to the real sentence.
--write: cut each part to public/vo/caffeine/<key>.mp3 (+ .json word timings, + src/caffeine/vo-lengths.json),
         with pauses inside a part tightened to natural length, light denoise, EQ and loudness normalisation.
"""
import json
import math
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "public" / "vo" / "caffeine_user" / "raw.wav"
OUT = ROOT / "public" / "vo" / "caffeine"
REF = ROOT / "public" / "vo" / "caffeine_ref"  # Pradeep timings for the current script (copied before overwrite)
KEYS = ["hook", "adeno", "caff", "energy", "time", "crash", "memory", "tolerance", "tips"]


def lines():
    t = (ROOT / "scripts" / "tts_caffeine.py").read_text(encoding="utf-8")
    return dict(re.findall(r'    "(\w+)": "(.*?)",', t))


def silences():
    r = subprocess.run(["ffmpeg", "-i", str(RAW), "-af", "silencedetect=noise=-38dB:d=0.3", "-f", "null", "-"],
                       capture_output=True, text=True)
    s = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", r.stderr)]
    e = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", r.stderr)]
    return list(zip(s, e))


def segments(total):
    sil = silences()
    segs = []
    cur = 0.0
    for s, e in sil:
        if s - cur > 0.12:
            segs.append([cur, s])
        cur = e
    if total - cur > 0.12:
        segs.append([cur, total])
    return segs


def sentences(text):
    parts = [p.strip() for p in re.split(r"(?<=[।?])\s*", text) if p.strip()]
    return parts


def main():
    write = "--write" in sys.argv
    total = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(RAW)],
                                 capture_output=True, text=True).stdout)
    segs = segments(total)
    L = lines()
    sents = []  # (key, text, ref_words)
    for k in KEYS:
        words = json.loads((REF / f"{k}.json").read_text(encoding="utf-8"))
        wi = 0
        for s in sentences(L[k]):
            n = len(s.split())
            sents.append((k, s, words[wi: wi + n]))
            wi += n
        assert wi == len(words), f"{k}: token count {wi} vs {len(words)}"
    refdur = [w[-1]["endMs"] / 1000 - w[0]["startMs"] / 1000 for _, _, w in sents]
    user_speech = sum(e - s for s, e in segs)
    speed = user_speech / sum(refdur)

    S, G = len(sents), len(segs)
    INF = 1e18
    best = [[INF] * (G + 1) for _ in range(S + 1)]
    back = [[None] * (G + 1) for _ in range(S + 1)]
    best[0][0] = 0.0
    for i in range(S):
        for j in range(G + 1):
            if best[i][j] >= INF:
                continue
            for skip in (0, 1):  # allow dropping one short stray segment (breath, click) before a sentence
                j0 = j + skip
                if skip and (j0 > G or segs[j][1] - segs[j][0] > 0.6):
                    continue
                for n in range(1, 6):
                    j2 = j0 + n
                    if j2 > G:
                        break
                    a, b = segs[j0][0], segs[j2 - 1][1]
                    dur = sum(e - s for s, e in segs[j0:j2])
                    c = math.log(dur / (speed * refdur[i])) ** 2 * 4
                    for q in range(j0, j2 - 1):  # long pause inside a sentence is unlikely
                        gap = segs[q + 1][0] - segs[q][1]
                        c += max(0, gap - 0.9) * 3
                    if j0 > 0:  # sentence should start after a real pause
                        gap = segs[j0][0] - segs[j0 - 1][1]
                        c += max(0, 0.45 - gap) * 4
                    c += skip * 0.8
                    if best[i][j] + c < best[i + 1][j2]:
                        best[i + 1][j2] = best[i][j] + c
                        back[i + 1][j2] = (j, j0, j2)
    # allow trailing stray segments
    jend = min(range(G + 1), key=lambda j: best[S][j] + (G - j) * 1.5)
    assign = []
    j = jend
    for i in range(S, 0, -1):
        pj, j0, j2 = back[i][j]
        assign.append((j0, j2))
        j = pj
    assign.reverse()

    print(f"DP: segments={G} sentences={S} speed={speed:.2f} cost={best[S][jend]:.2f}")
    spans = manual_spans(segs, refdur)
    for (k, s, w), (a, b), rd in zip(sents, spans, refdur):
        print(f"{k:9s} {a:7.2f}-{b:7.2f} ({b - a:4.1f}s, ref {rd * speed:4.1f}s)  {s[:38]}")

    if write:
        build(sents, spans, segs)


# Sentence → segments, verified by hand: every pause >= 2 s in the take is a sentence break.
# ("split", seg_from, seg_to) = two sentences spoken in one breath: cut at the quietest point.
MAP = [
    [0], [1], [2],                                   # hook
    [3], [4, 5], [6], [7], [8],                      # adeno
    ("split", 9, 9), None, [10], [11], [12],         # caff (S1+S2 in one breath)
    ("split", 13, 14), None,                         # energy (both sentences in one breath)
    [15], [16, 17], [18],                            # time
    [19, 20], [21], [22, 23], [24], [25, 26],        # crash
    [27], [28, 29], [30],                            # memory
    [31], [32, 33], [34],                            # tolerance
    [35], [36], [37], [38],                          # tips
]


def quietest(a, b):
    """Time of the lowest 30 ms energy between a and b (s) in the raw take."""
    import numpy as np
    from scipy.io import wavfile
    sr, x = wavfile.read(str(RAW))
    x = x.astype(np.float64)
    i0, i1 = int(a * sr), int(b * sr)
    win = int(0.03 * sr)
    e = np.convolve(x[i0:i1] ** 2, np.ones(win) / win, mode="same")
    return (i0 + int(np.argmin(e[win:-win]) + win)) / sr


def manual_spans(segs, refdur):
    spans = []
    i = 0
    while i < len(MAP):
        m = MAP[i]
        if isinstance(m, tuple):
            _, s0, s1 = m
            a, b = segs[s0][0], segs[s1][1]
            k = refdur[i] / (refdur[i] + refdur[i + 1])
            guess = a + (b - a) * k
            cut = quietest(max(a + 0.3, guess - 0.45), min(b - 0.3, guess + 0.45))
            spans += [(a, cut), (cut, b)]
            i += 2
        else:
            spans.append((segs[m[0]][0], segs[m[-1]][1]))
            i += 1
    return spans


def build(sents, assign, segs):  # assign = per-sentence (start, end) in the raw take
    """Cut each part: keep each sentence's segments, tighten pauses (inside a sentence ≤0.25 s, between sentences 0.45 s)."""
    tmp = ROOT / "public" / "vo" / "caffeine_user" / "parts"
    tmp.mkdir(parents=True, exist_ok=True)
    clean = ROOT / "public" / "vo" / "caffeine_user" / "clean.wav"
    # light cleanup on the whole take: high-pass, gentle denoise, presence EQ, de-ess-ish, compression
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(RAW), "-af",
                    # no denoise (it dulled the phone recording); cut mud, lift presence and air for a crisp voice
                    "highpass=f=100,equalizer=f=250:t=q:w=1.2:g=-3,equalizer=f=3500:t=q:w=1.4:g=4,"
                    "highshelf=f=6000:g=3,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=90:makeup=2",
                    "-ar", "48000", "-ac", "1", str(clean)], check=True)
    lengths = {}
    for key in KEYS:
        pieces = []  # (src_start, src_end, out_start)
        words_out = []
        t_out = 0.0
        idx = [i for i, (k, _, _) in enumerate(sents) if k == key]
        for n, i in enumerate(idx):
            sa, sb = assign[i]
            if n > 0:
                t_out += 0.45
            sent_start_out = t_out
            inner = [(max(a, sa), min(b, sb)) for a, b in segs if b > sa and a < sb]
            for q, (a, b) in enumerate(inner):
                a = max(0.0, a - (0.06 if a > sa else 0.0))
                b = b + (0.08 if b < sb else 0.0)
                if q > 0:
                    t_out += 0.25
                pieces.append((a, b, t_out))
                t_out += b - a
            sent_end_out = t_out
            # stretch the reference word timings onto the real sentence span
            ref = sents[i][2]
            r0, r1 = ref[0]["startMs"], ref[-1]["endMs"]
            span = (sent_end_out - sent_start_out) * 1000 - 120
            for wd in ref:
                s = sent_start_out * 1000 + 60 + (wd["startMs"] - r0) / (r1 - r0) * span
                e = sent_start_out * 1000 + 60 + (wd["endMs"] - r0) / (r1 - r0) * span
                words_out.append({"text": wd["text"], "startMs": round(s, 1), "endMs": round(e, 1)})
        # assemble with short crossfades via filter_complex (each piece trimmed, padded to its slot)
        filt = []
        for n, (a, b, at) in enumerate(pieces):
            filt.append(f"[0:a]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.02,afade=t=out:st={b - a - 0.04:.3f}:d=0.04,"
                        f"adelay={int(at * 1000)}|{int(at * 1000)}[p{n}]")
        mix = "".join(f"[p{n}]" for n in range(len(pieces)))
        filt.append(f"{mix}amix=inputs={len(pieces)}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=7[out]")
        dst = OUT / f"{key}.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(clean), "-filter_complex", ";".join(filt),
                        "-map", "[out]", "-ar", "48000", "-ac", "1", "-b:a", "192k", str(dst)], check=True)
        (OUT / f"{key}.json").write_text(json.dumps(words_out, ensure_ascii=False, indent=1), encoding="utf-8")
        lengths[key] = round(t_out + 0.2, 2)
        print(key, "->", lengths[key], "s")
    (ROOT / "src" / "caffeine" / "vo-lengths.json").write_text(json.dumps(lengths, indent=1), encoding="utf-8")
    print("total", round(sum(lengths.values()), 2))


if __name__ == "__main__":
    main()
