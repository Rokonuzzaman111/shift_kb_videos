"""Synthesize the Svalbard reel's music bed + a few scene SFX (no downloads).

  python -I -X utf8 scripts/make_audio_svalbard.py

Writes 48 kHz stereo 16-bit WAVs:
  public/svalbard/music/bed.wav     170 s arctic ambient bed: D-minor pad, wind, glassy chimes, soft pulse from 2 s
  public/svalbard/sfx/door.wav      heavy steel door: unlatch clunk + hydraulic hiss + slide rumble
  public/svalbard/sfx/wind.wav      6 s blizzard gust
  public/svalbard/sfx/frost.wav     icy shimmer/crackle swell (cold reveal)
Other SFX (whoosh, impact, riser, ui_pop, tick …) are reused from public/nvidia/sfx.
"""
import pathlib
import wave

import numpy as np
from scipy import signal

SR = 48000
ROOT = pathlib.Path(__file__).resolve().parent.parent
rng = np.random.default_rng(20261114)


def t_(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, o=2):
    b, a = signal.butter(o, f / (SR / 2), "low")
    return signal.lfilter(b, a, x)


def hp(x, f, o=2):
    b, a = signal.butter(o, f / (SR / 2), "high")
    return signal.lfilter(b, a, x)


def bp(x, f0, f1, o=2):
    b, a = signal.butter(o, [f0 / (SR / 2), f1 / (SR / 2)], "band")
    return signal.lfilter(b, a, x)


def pink(n):
    w = rng.standard_normal(n)
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b, a, w)


def reverb(x, dur=3.0, wet=0.35):
    n = int(dur * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (SR * dur / 6))
    ir = lp(ir, 5000)
    ir /= np.sqrt((ir**2).sum())
    out = np.stack([signal.fftconvolve(x[c], ir * (1 if c == 0 else -1) + 0, mode="full")[: x.shape[1]] for c in range(2)])
    return x * (1 - wet) + out * wet * 3


def save(path, x, peak_db=-1.0):
    x = np.asarray(x)
    if x.ndim == 1:
        x = np.stack([x, x])
    x = x - x.mean(axis=1, keepdims=True)
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x.T * 32767).astype(np.int16).tobytes())
    print(f"{path.relative_to(ROOT)}  {x.shape[1] / SR:.1f}s")


def mtof(m):
    return 440 * 2 ** ((m - 69) / 12)


def bed(d=170.0):
    t = t_(d)
    n = t.size
    out = np.zeros((2, n))
    # pad: chord changes every 8 s (Dm9 → Bbmaj7 → Fadd9 → C6/E), detuned saws, low-passed, slow swell
    chords = [[38, 50, 57, 64, 69], [34, 46, 53, 62, 69], [41, 53, 60, 67, 69], [40, 52, 55, 64, 67]]
    seg = 8.0
    for ci in range(int(d / seg) + 1):
        notes = chords[ci % 4]
        a0 = ci * seg
        st, en = int(max(0, a0 - 1.5) * SR), int(min(d, a0 + seg + 1.5) * SR)
        if st >= n:
            break
        tt = np.arange(en - st) / SR
        env = np.sin(np.pi * np.clip(tt / (seg + 3), 0, 1)) ** 1.2
        for k, m in enumerate(notes):
            for c, det in enumerate((-0.07, 0.07)):
                f = mtof(m + det)
                ph = rng.random()
                saw = 2 * ((f * tt + ph) % 1) - 1
                tri = 2 * np.abs(saw) - 1
                v = (0.35 * saw + 0.65 * tri) * env * (0.22 if k == 0 else 0.11)
                out[c, st:en] += v
    out = np.stack([lp(out[0], 1400), lp(out[1], 1400)])
    # sub drone D1
    out += 0.18 * np.sin(2 * np.pi * mtof(26) * t) * (0.7 + 0.3 * np.sin(2 * np.pi * t / 11))
    # wind: band noise with slow gusts, panned
    for c in range(2):
        g = 0.5 + 0.5 * np.sin(2 * np.pi * t / (9 + c * 2.3) + c) ** 2
        out[c] += bp(pink(n), 250, 1800) * 0.05 * g
    # glassy chimes: D-minor pentatonic, every ~2.4 s, random octave
    scale = [74, 77, 79, 81, 84, 86, 89]
    tc = 2.0
    while tc < d - 2:
        m = scale[rng.integers(len(scale))]
        L = int(3 * SR)
        st = int(tc * SR)
        tt = np.arange(min(L, n - st)) / SR
        f = mtof(m)
        v = (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 3)) * np.exp(-tt * 1.6) * 0.06
        pan = rng.random()
        out[0, st:st + tt.size] += v * (1 - pan)
        out[1, st:st + tt.size] += v * pan
        tc += 1.6 + rng.random() * 1.6
    # soft pulse (heartbeat-like low thump at 80 BPM) from 2 s, fades in over 6 s
    beat = 60 / 80
    tb = 2.0
    while tb < d - 1:
        st = int(tb * SR)
        tt = np.arange(int(0.35 * SR)) / SR
        f = 55 * np.exp(-tt * 6) + 42
        v = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9) * 0.22 * min(1, (tb - 2) / 6)
        e = min(n, st + v.size)
        out[:, st:e] += v[: e - st]
        tb += beat
    out = reverb(out, 3.5, 0.3)
    fade = np.minimum(1, t / 1.5) * np.minimum(1, (d - t) / 3)
    return out * fade


def door():
    d = 2.6
    t = t_(d)
    x = np.zeros(t.size)
    # unlatch clunk
    c = np.exp(-t / 0.05) * np.sin(2 * np.pi * (90 * np.exp(-t * 8) + 60) * t)
    x += c * 1.0
    x += bp(rng.standard_normal(t.size), 800, 4000) * np.exp(-t / 0.015) * 0.6
    # hydraulic hiss
    h = hp(pink(t.size), 2500) * np.clip((t - 0.15) / 0.2, 0, 1) * np.exp(-np.maximum(0, t - 0.4) / 0.6) * 0.5
    # slide rumble
    r = lp(rng.standard_normal(t.size), 180) * np.sin(np.pi * np.clip((t - 0.2) / 1.8, 0, 1)) * 2.5
    end = np.exp(-np.maximum(0, t - 2.0) / 0.08) * (t > 2.0) * np.sin(2 * np.pi * 70 * t) * 0.8
    x = x + h + r + end
    st = np.stack([x, np.roll(x, 120)])
    return reverb(st, 2.2, 0.35)


def wind():
    d = 6.0
    t = t_(d)
    g = np.sin(np.pi * t / d) ** 1.5 * (0.7 + 0.3 * np.sin(2 * np.pi * t * 0.7))
    out = np.stack([bp(pink(t.size), 300 + 200 * c, 2400) * g for c in range(2)])
    whistle = np.sin(2 * np.pi * np.cumsum(900 + 250 * np.sin(2 * np.pi * t * 0.3)) / SR) * g * 0.04
    return out + whistle


def frost():
    d = 2.4
    t = t_(d)
    sw = np.clip(t / 1.4, 0, 1) ** 2 * np.exp(-np.maximum(0, t - 1.4) / 0.4)
    sh = hp(rng.standard_normal(t.size), 6000) * sw * 0.4
    cr = np.zeros(t.size)
    for _ in range(140):
        s = int(rng.random() * 1.6 * SR)
        L = 300
        if s + L < t.size:
            cr[s:s + L] += rng.standard_normal(L) * np.exp(-np.arange(L) / 40) * rng.random() * sw[s]
    tone = sum(np.sin(2 * np.pi * mtof(m) * t) for m in (86, 93, 98)) * sw * 0.08
    x = sh + hp(cr, 3000) * 0.8 + tone
    return reverb(np.stack([x, np.roll(x, 300)]), 2.5, 0.4)


def hum(d=8.0):
    """vault interior: low mains hum + cooling-fan air, seamless loop (whole cycles of every partial)"""
    t = t_(d)
    x = sum(a * np.sin(2 * np.pi * f * t + ph) for f, a, ph in ((50, 0.5, 0), (100, 0.35, 1.1), (150, 0.12, 0.4), (200, 0.06, 2.0)))
    x = x * (1 + 0.08 * np.sin(2 * np.pi * t * 0.25))
    air = bp(pink(t.size + SR), 120, 1800)[SR:] * 0.9
    fade = int(0.5 * SR)  # crossfade the noise tail into its head so the loop has no seam
    air[:fade] = air[:fade] * np.linspace(0, 1, fade) + air[-fade:] * np.linspace(1, 0, fade)
    air[-fade:] = air[:fade][::-1] * 0 + air[-fade:]
    return np.stack([x + air, x + np.roll(air, 900)])


def kick():
    """beat layer: short soft low kick for shot cuts"""
    t = t_(0.6)
    f = 48 + 70 * np.exp(-t * 28)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    x += lp(rng.standard_normal(t.size), 900) * np.exp(-t / 0.008) * 0.25
    return lp(x, 2000)


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        for n in sys.argv[1:]:
            save(ROOT / f"public/svalbard/sfx/{n}.wav", globals()[n](), -6 if n == "hum" else -1)
        raise SystemExit
    save(ROOT / "public/svalbard/music/bed.wav", bed(), -3)
    save(ROOT / "public/svalbard/sfx/door.wav", door())
    save(ROOT / "public/svalbard/sfx/wind.wav", wind())
    save(ROOT / "public/svalbard/sfx/frost.wav", frost())
