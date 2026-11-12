"""
Synthesize all audio for the caffeine reel (no downloads).

  python -I -X utf8 scripts/make_audio_caffeine.py

Writes 48 kHz / 16-bit / stereo WAVs:
  public/sfx/caffeine/<name>.wav   (12 SFX, peak -1 dBFS)
  public/music/caffeine_bed.wav    (~110 s lo-fi study bed, ~-16 LUFS)
and prints a QA table (duration, peak, RMS, DC, HF share, LUFS).
"""
from __future__ import annotations

import os
import sys

import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX_DIR = os.path.join(ROOT, "public", "sfx", "caffeine")
MUSIC_DIR = os.path.join(ROOT, "public", "music")
rng = np.random.default_rng(20261111)


# ----------------------------------------------------------------------------- helpers
def tt(dur: float) -> np.ndarray:
    return np.arange(int(round(dur * SR))) / SR


def db(x: float) -> float:
    return 20 * np.log10(max(x, 1e-12))


def sos(kind: str, f, order: int = 2):
    return signal.butter(order, f, btype=kind, fs=SR, output="sos")


def filt(x: np.ndarray, kind: str, f, order: int = 2) -> np.ndarray:
    return signal.sosfilt(sos(kind, f, order), x, axis=-1)


def filtz(x: np.ndarray, kind: str, f, order: int = 2) -> np.ndarray:
    """zero-phase filter (for noise shaping where phase does not matter)"""
    return signal.sosfiltfilt(sos(kind, f, order), x, axis=-1)


def noise(n: int, ch: int = 1) -> np.ndarray:
    return rng.standard_normal((ch, n)) if ch > 1 else rng.standard_normal(n)


def pink(n: int) -> np.ndarray:
    w = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    f[0] = f[1]
    p = np.fft.irfft(w / np.sqrt(f), n)
    return p / (np.std(p) + 1e-12)


def env_ad(t: np.ndarray, a: float, tau: float) -> np.ndarray:
    """smooth attack (raised cosine) + exponential decay"""
    att = np.where(t < a, 0.5 - 0.5 * np.cos(np.pi * np.clip(t / max(a, 1e-6), 0, 1)), 1.0)
    return att * np.exp(-np.maximum(t - a, 0) / tau)


def fade(x: np.ndarray, fin: float = 0.002, fout: float = 0.02) -> np.ndarray:
    x = x.copy()
    n = x.shape[-1]
    i, o = int(fin * SR), int(fout * SR)
    if i > 0:
        x[..., :i] *= np.sin(np.linspace(0, np.pi / 2, i)) ** 2
    if o > 0:
        x[..., n - o:] *= np.cos(np.linspace(0, np.pi / 2, o)) ** 2
    return x


def pad_to(x: np.ndarray, n: int) -> np.ndarray:
    if x.shape[-1] >= n:
        return x[..., :n]
    w = [(0, 0)] * (x.ndim - 1) + [(0, n - x.shape[-1])]
    return np.pad(x, w)


def place(buf: np.ndarray, x: np.ndarray, at: float, gain: float = 1.0) -> None:
    i = int(round(at * SR))
    if i >= buf.shape[-1]:
        return
    n = min(x.shape[-1], buf.shape[-1] - i)
    buf[..., i:i + n] += gain * x[..., :n]


def pan(x: np.ndarray, p: float | np.ndarray) -> np.ndarray:
    """mono -> stereo, equal-power, p in [-1, 1]"""
    a = (np.asarray(p) + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)])


def stereo(x: np.ndarray) -> np.ndarray:
    return x if x.ndim == 2 else np.stack([x, x])


def make_ir(rt60: float, pre: float = 0.012, lp: float = 6000, hp: float = 250, length: float | None = None,
            density_ms: float = 0.0) -> np.ndarray:
    """synthetic stereo room IR: decorrelated decaying noise, darker with time"""
    L = length or rt60 * 1.1
    t = tt(L)
    n = rng.standard_normal((2, t.size))
    dec = np.exp(-6.91 * t / rt60)
    early = filtz(n, "lowpass", lp, 2)
    late = filtz(n, "lowpass", lp * 0.35, 2)
    mix = np.clip(t / (L * 0.6), 0, 1)
    ir = (early * (1 - mix) + late * mix) * dec
    ir = filtz(ir, "highpass", hp, 2)
    ir[:, :int(0.004 * SR)] *= np.linspace(0, 1, int(0.004 * SR)) ** 2
    ir = np.pad(ir, ((0, 0), (int(pre * SR), 0)))
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def reverb(x: np.ndarray, ir: np.ndarray, wet: float) -> np.ndarray:
    x = stereo(x)
    y = np.stack([signal.oaconvolve(x[c], ir[c])[: x.shape[1] + ir.shape[1]] for c in range(2)])
    dry = pad_to(x, y.shape[1])
    return dry + wet * y


def peq(x: np.ndarray, f0: float, gain_db: float, q: float) -> np.ndarray:
    """RBJ peaking EQ"""
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f0 / SR
    al = np.sin(w) / (2 * q)
    bb = [1 + al * A, -2 * np.cos(w), 1 - al * A]
    aa = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    return signal.lfilter(bb, aa, x, axis=-1)


def sat(x: np.ndarray, drive: float = 1.5) -> np.ndarray:
    return np.tanh(drive * x) / np.tanh(drive)


def band_noise_sweep(n: int, centers: np.ndarray, bw_oct: float, seed_noise: np.ndarray | None = None) -> np.ndarray:
    """time-varying band-pass on noise via STFT masking (smooth, click-free)"""
    x = seed_noise if seed_noise is not None else pink(n)
    nper = 1024
    f, ts, Z = signal.stft(x, fs=SR, nperseg=nper, noverlap=nper * 3 // 4, boundary="even")
    c = np.interp(ts, np.linspace(0, n / SR, centers.size), centers)
    lf = np.log2(np.maximum(f, 20))[:, None]
    mask = np.exp(-0.5 * ((lf - np.log2(c)[None, :]) / (bw_oct / 2.355)) ** 2)
    _, y = signal.istft(Z * mask, fs=SR, nperseg=nper, noverlap=nper * 3 // 4, boundary=True)
    return pad_to(y, n)


def finish_sfx(x: np.ndarray, lp: float = 11000, fin: float = 0.0015, fout: float = 0.03) -> np.ndarray:
    x = stereo(x)
    x = filtz(x, "highpass", 35, 2)
    x = filtz(x, "lowpass", lp, 4)
    x = x - x.mean(axis=1, keepdims=True)
    x = fade(x, fin, fout)
    return x / np.max(np.abs(x)) * 10 ** (-1 / 20)


def write(path: str, x: np.ndarray) -> None:
    x = stereo(x)
    dither = (rng.random(x.shape) - rng.random(x.shape)) / 32768.0
    y = np.clip(np.round((x + dither) * 32767), -32768, 32767).astype(np.int16)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    wavfile.write(path, SR, y.T)


# ----------------------------------------------------------------------------- SFX
IR_SMALL = make_ir(0.45, pre=0.008, lp=7000, hp=300)
IR_ROOM = make_ir(0.9, pre=0.015, lp=6000, hp=250)
IR_HALL = make_ir(1.8, pre=0.025, lp=5000, hp=200)


def whoosh(dur: float, f0: float, fpk: float, f1: float, peak_at: float, bw: float, pan_from: float, pan_to: float):
    n = int(dur * SR)
    t = tt(dur)
    k = np.linspace(0, 1, 64)
    centers = np.where(k < peak_at, f0 * (fpk / f0) ** (k / peak_at), fpk * (f1 / fpk) ** ((k - peak_at) / (1 - peak_at)))
    a = band_noise_sweep(n, centers, bw)
    b = band_noise_sweep(n, centers * 1.9, bw * 0.8)  # airy upper layer
    u = t / dur
    # asymmetric bell: slow-ish swell, faster release
    e = np.where(u < peak_at, np.sin(np.pi / 2 * np.clip(u / peak_at, 0, 1)) ** 2.2,
                 np.cos(np.pi / 2 * np.clip((u - peak_at) / (1 - peak_at), 0, 1)) ** 1.6)
    m = (a + 0.35 * b) * e
    p = np.interp(u, [0, 1], [pan_from, pan_to])
    st = pan(m, p)
    # tiny doppler-ish low body
    body = filtz(pink(n), "lowpass", 260, 2) * e ** 1.5 * 0.25
    st += stereo(body)
    return reverb(st, IR_SMALL, 0.18)


def sfx_whoosh_soft():
    return finish_sfx(whoosh(0.6, 320, 1900, 900, 0.55, 1.6, -0.6, 0.6)[:, : int(0.8 * SR)], lp=9000, fout=0.12)


def sfx_whoosh_fast():
    x = whoosh(0.35, 500, 3200, 1400, 0.42, 1.3, -0.5, 0.7)
    return finish_sfx(pad_to(x, int(0.35 * SR) + int(0.05 * SR)), lp=10000, fout=0.04)


def sfx_pop():
    t = tt(0.32)
    f = 380 + 520 * np.exp(-t / 0.018)  # quick downward bend = "bubble" pop
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * env_ad(t, 0.0015, 0.045)
    body += 0.18 * np.sin(2 * ph) * env_ad(t, 0.001, 0.025)
    click = filtz(noise(t.size), "bandpass", [1500, 4500], 2) * env_ad(t, 0.0003, 0.004) * 0.25
    x = sat(body + click, 1.3)
    return finish_sfx(reverb(x, IR_SMALL, 0.12)[:, : int(0.4 * SR)], lp=8000, fout=0.1)


def tick_unit(f_body: float = 2600, f_res: float = 1150, low: float = 420, dur: float = 0.12, bright: float = 1.0):
    t = tt(dur)
    n = noise(t.size)
    click = filtz(n, "bandpass", [f_body * 0.7, f_body * 1.4], 2) * env_ad(t, 0.0002, 0.0018) * bright
    res = np.sin(2 * np.pi * f_res * t + 0.3) * env_ad(t, 0.0003, 0.011) * 0.45
    res += np.sin(2 * np.pi * f_res * 2.71 * t) * env_ad(t, 0.0003, 0.005) * 0.15
    thk = np.sin(2 * np.pi * low * t) * env_ad(t, 0.0006, 0.009) * 0.35
    return click + res + thk


def sfx_tick():
    x = tick_unit()
    return finish_sfx(reverb(x, IR_SMALL, 0.1)[:, : int(0.22 * SR)], lp=9000, fout=0.05)


def sfx_tick_fast():
    total = 2.0
    out = np.zeros((2, int(total * SR)))
    # accelerating ticks: interval shrinks geometrically from 0.20 s to 0.045 s, then a clean stop
    times, t, i = [], 0.03, 0
    while t < 1.70:
        times.append(t)
        p = t / 1.70
        t += 0.20 * (0.045 / 0.20) ** (p ** 0.8)
    for i, at in enumerate(times):
        p = at / 1.7
        tock = i % 2 == 1
        u = tick_unit(f_body=2300 if tock else 2700, f_res=980 if tock else 1180, low=380 if tock else 440,
                      bright=0.9 + 0.2 * rng.random())
        g = 0.55 + 0.35 * p
        place(out, pan(u, -0.12 if tock else 0.12), at, g)
    # final "settle" stop: lower, firmer tick + tiny metallic ring
    stop_at = times[-1] + 0.11
    t2 = tt(0.25)
    stop = tick_unit(2000, 820, 300, 0.25, 1.2) * 1.15
    stop += np.sin(2 * np.pi * 3150 * t2) * env_ad(t2, 0.001, 0.06) * 0.06
    place(out, stereo(stop), stop_at, 1.0)
    out = reverb(out, IR_SMALL, 0.12)[:, : out.shape[1]]
    return finish_sfx(out, lp=9500, fout=0.08)


def sfx_click_lock():
    dur = 0.9
    t = tt(dur)
    out = np.zeros((2, t.size))
    # 1) magnetic "approach" micro-tick, 2) solid snap with low thock
    pre = filtz(noise(int(0.01 * SR)), "bandpass", [3000, 6000], 2) * env_ad(tt(0.01), 0.0002, 0.0015) * 0.25
    place(out, stereo(pre), 0.0)
    ts = tt(0.3)
    snap = filtz(noise(ts.size), "bandpass", [1800, 5200], 2) * env_ad(ts, 0.0002, 0.0025) * 1.0
    thock = np.sin(2 * np.pi * (170 + 90 * np.exp(-ts / 0.01)) * ts) * env_ad(ts, 0.0005, 0.035) * 0.9
    wood = np.sin(2 * np.pi * 760 * ts) * env_ad(ts, 0.0003, 0.012) * 0.35
    place(out, stereo(sat(snap + thock + wood, 1.6)), 0.022)
    # sparkle tail: soft inharmonic glints, rising, panned
    sp = np.zeros((2, t.size))
    for k, (f, d, p) in enumerate([(2637, 0.03, -0.4), (3520, 0.07, 0.3), (4699, 0.11, -0.1), (5274, 0.15, 0.45)]):
        tg = tt(dur - 0.05 - d)
        g = np.sin(2 * np.pi * f * tg) + 0.25 * np.sin(2 * np.pi * f * 2.03 * tg)
        g *= env_ad(tg, 0.004, 0.16) * (0.16 - 0.025 * k)
        place(sp, pan(g, p), 0.05 + d)
    out += reverb(sp, IR_ROOM, 0.35)[:, : t.size]
    out = reverb(out, IR_SMALL, 0.1)[:, : t.size]
    return finish_sfx(out, lp=10000, fout=0.15)


def sfx_clink():
    dur = 1.3
    t = tt(dur)
    out = np.zeros((2, t.size))

    def strike(f0, ratios, amps, taus, at, gain, p):
        tg = tt(dur - at)
        y = np.zeros(tg.size)
        for r, a, tau in zip(ratios, amps, taus):
            f = f0 * r
            if f > 9500:
                continue
            beat = 1 + 0.04 * np.sin(2 * np.pi * (1.5 + r) * tg)  # slight beating like a real cup
            y += a * np.sin(2 * np.pi * f * tg + rng.random() * 6.28) * np.exp(-tg / tau) * beat
        y *= np.minimum(tg / 0.0006, 1)
        y += filtz(noise(tg.size), "bandpass", [2500, 7000], 2) * env_ad(tg, 0.0002, 0.002) * 0.5
        place(out, pan(y, p), at, gain)

    # porcelain/glass tea cup (inharmonic, cylindrical-shell-like modes)
    strike(1870, [1, 2.37, 2.41, 4.18, 6.12], [1, 0.55, 0.4, 0.25, 0.1], [0.42, 0.22, 0.2, 0.1, 0.05], 0.0, 1.0, -0.1)
    # spoon tap a moment later (metal, higher, shorter)
    strike(3090, [1, 1.53, 2.76], [0.6, 0.3, 0.15], [0.09, 0.05, 0.03], 0.085, 0.45, 0.25)
    # tiny second cup ring from the bounce
    strike(1870, [1, 2.37, 4.18], [1, 0.4, 0.15], [0.3, 0.15, 0.06], 0.13, 0.22, -0.05)
    out = reverb(out, IR_ROOM, 0.22)[:, : t.size]
    return finish_sfx(out, lp=9500, fout=0.2)


def sfx_thud_low():
    dur = 1.8
    t = tt(dur)
    f = 44 + 46 * np.exp(-t / 0.06)
    ph = 2 * np.pi * np.cumsum(f) / SR
    boom = np.sin(ph) * env_ad(t, 0.006, 0.38)
    boom = sat(boom * 1.4, 1.8)  # harmonics so phones can hear it
    body = filtz(pink(t.size), "lowpass", 220, 2) * env_ad(t, 0.004, 0.09) * 0.5
    air = filtz(pink(t.size), "bandpass", [600, 2500], 2) * env_ad(t, 0.002, 0.03) * 0.08
    x = boom + body + air
    x = filt(x, "lowpass", 2500, 2)
    out = reverb(x, IR_HALL, 0.25)[:, : t.size]
    return finish_sfx(out, lp=6000, fin=0.003, fout=0.3)


def sfx_ding():
    dur = 1.7
    out = np.zeros((2, int(dur * SR)))

    def bell(f, at, gain, p):
        tg = tt(dur - at)
        # soft FM tine: warm attack, near-harmonic partials, gentle shimmer
        idx = 1.2 * np.exp(-tg / 0.05) + 0.1
        y = np.sin(2 * np.pi * f * tg + idx * np.sin(2 * np.pi * f * tg)) * env_ad(tg, 0.003, 0.55)
        y += 0.22 * np.sin(2 * np.pi * f * 2.0 * tg) * env_ad(tg, 0.002, 0.25)
        y += 0.06 * np.sin(2 * np.pi * f * 3.01 * tg) * env_ad(tg, 0.002, 0.1)
        y *= 1 + 0.03 * np.sin(2 * np.pi * 5 * tg)
        place(out, pan(y, p), at, gain)

    bell(1046.5, 0.0, 0.8, -0.15)  # C6
    bell(1568.0, 0.075, 0.6, 0.2)  # G6 (open fifth = "correct!")
    out = reverb(out, IR_HALL, 0.28)[:, : out.shape[1]]
    return finish_sfx(out, lp=9000, fout=0.3)


def sfx_paper():
    dur = 0.75
    n = int(dur * SR)
    t = tt(dur)
    out = np.zeros((2, n))
    # flutter: many tiny crinkle bursts with an irregular rate envelope
    at = 0.02
    while at < 0.6:
        u = at / 0.6
        L = int(SR * (0.006 + 0.012 * rng.random()))
        tb = tt(L / SR)
        lo = 900 + 1800 * rng.random()
        b = filtz(noise(L), "bandpass", [lo, lo * 2.6], 2) * env_ad(tb, 0.0008, 0.004 + 0.004 * rng.random())
        g = np.sin(np.pi * u) ** 0.7 * (0.5 + 0.5 * rng.random())
        place(out, pan(b, rng.uniform(-0.4, 0.4)), at, g)
        at += 0.012 + 0.03 * rng.random()
    swish = band_noise_sweep(n, np.array([700, 2200, 1200]), 2.0) * np.sin(np.pi * np.clip(t / 0.65, 0, 1)) ** 1.5 * 0.3
    out += stereo(swish)
    out = reverb(out, IR_SMALL, 0.15)[:, :n]
    return finish_sfx(out, lp=9000, fout=0.08)


def sfx_riser():
    dur, tail = 1.5, 0.25
    n = int((dur + tail) * SR)
    t = tt(dur + tail)
    u = np.clip(t / dur, 0, 1)
    k = np.linspace(0, 1, 64)
    nz = band_noise_sweep(n, 300 * (5200 / 300) ** (k ** 1.3), 1.4)
    e = u ** 2.2 * np.where(t > dur, np.exp(-(t - dur) / 0.03), 1)
    x = pan(nz * e, 0) * 0.7
    # rising soft tone pair (detuned, airy) for musicality
    for det, p in ((-6, -0.5), (6, 0.5)):
        f = 220 * (880 / 220) ** (u ** 1.6) * 2 ** (det / 1200)
        ph = 2 * np.pi * np.cumsum(f) / SR
        tone = (np.sin(ph) + 0.3 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)) * e * 0.22
        x += pan(tone, p)
    x = reverb(x, IR_ROOM, 0.3)[:, :n]
    return finish_sfx(x, lp=9500, fin=0.05, fout=0.15)


def sfx_lamp_click():
    dur = 0.3
    n = int(dur * SR)
    out = np.zeros((2, n))

    def clk(at, gain, f_lo, f_hi, body_f):
        tb = tt(0.08)
        c = filtz(noise(tb.size), "bandpass", [f_lo, f_hi], 2) * env_ad(tb, 0.0002, 0.0016)
        c += np.sin(2 * np.pi * body_f * tb) * env_ad(tb, 0.0004, 0.008) * 0.5
        c += np.sin(2 * np.pi * body_f * 3.3 * tb) * env_ad(tb, 0.0003, 0.004) * 0.2
        place(out, stereo(c), at, gain)

    clk(0.0, 0.45, 1200, 3500, 310)  # finger presses switch
    clk(0.018, 1.0, 1800, 5000, 520)  # mechanism snaps
    out = reverb(out, IR_SMALL, 0.12)[:, :n]
    return finish_sfx(out, lp=9000, fout=0.06)


SFX = {
    "whoosh_soft": sfx_whoosh_soft,
    "whoosh_fast": sfx_whoosh_fast,
    "pop": sfx_pop,
    "click_lock": sfx_click_lock,
    "clink": sfx_clink,
    "tick": sfx_tick,
    "tick_fast": sfx_tick_fast,
    "thud_low": sfx_thud_low,
    "ding": sfx_ding,
    "paper": sfx_paper,
    "riser": sfx_riser,
    "lamp_click": sfx_lamp_click,
}


# ----------------------------------------------------------------------------- music
BPM = 75.0
BEAT = 60.0 / BPM  # 0.8 s
BAR = 4 * BEAT  # 3.2 s
MUSIC_LEN = 110.0


def mtof(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


# D major: Dmaj9 | Bm9 | Gmaj9(6) | A7sus4  (rhodes voicings, no root; bass carries roots)
CHORDS = [
    ("Dmaj9", [54, 57, 61, 64], 38),
    ("Bm9", [50, 54, 57, 61], 35),
    ("Gmaj9", [54, 57, 59, 62], 31),
    ("A7sus4", [52, 55, 57, 62], 33),
]
# B-section voicings: same harmony, lifted top voice for a gentle colour change
CHORDS_B = [
    ("Dmaj9", [57, 61, 64, 66], 38),
    ("Bm11", [54, 57, 61, 64], 35),
    ("Gmaj9", [57, 59, 62, 66], 31),
    ("A13sus", [55, 57, 62, 66], 33),
]


def rhodes_note(f: float, dur: float, vel: float) -> np.ndarray:
    rel = 0.25
    t = tt(dur + rel)
    out = np.zeros(t.size)
    tau = 1.6 * (220 / f) ** 0.35
    for det in (-3.5, 3.5):
        ff = f * 2 ** (det / 1200)
        idx = (0.9 + 1.4 * vel) * np.exp(-t / 0.18) + 0.25
        car = np.sin(2 * np.pi * ff * t + idx * np.sin(2 * np.pi * ff * t))
        out += car
    out *= 0.5
    # tine "bark" transient (kept below 10 kHz)
    fb = min(f * 7.0, 6500)
    out += 0.12 * vel * np.sin(2 * np.pi * fb * t) * np.exp(-t / 0.012)
    e = env_ad(t, 0.004, tau)
    e *= np.where(t > dur, np.exp(-(t - dur) / 0.07), 1)
    out = sat(out * e * (0.4 + 0.6 * vel), 1.3)
    return out


def pad_voice(f: float, dur: float) -> np.ndarray:
    t = tt(dur)
    y = np.zeros(t.size)
    for det in (-7, 0, 7):
        ff = f * 2 ** (det / 1200)
        ph = (ff * t + rng.random()) % 1.0
        dt = ff / SR
        saw = 2 * ph - 1
        # polyBLEP
        m1 = ph < dt
        x = ph[m1] / dt
        saw[m1] -= x + x - x * x - 1
        m2 = ph > 1 - dt
        x = (ph[m2] - 1) / dt
        saw[m2] -= x * x + x + x + 1
        y += saw
    return y / 3


def soft_kick() -> np.ndarray:
    t = tt(0.45)
    f = 48 + 60 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    k = np.sin(ph) * env_ad(t, 0.002, 0.16)
    k += filtz(noise(t.size), "bandpass", [800, 2500], 2) * env_ad(t, 0.0003, 0.003) * 0.05
    return sat(k * 1.2, 1.5)


def brush_snare(vel: float) -> np.ndarray:
    t = tt(0.4)
    n = filtz(pink(t.size), "bandpass", [1200, 6500], 2)
    # brush slap has a soft smeared attack
    e = env_ad(t, 0.006, 0.09)
    body = np.sin(2 * np.pi * 190 * t) * env_ad(t, 0.002, 0.04) * 0.25
    return (n * e * 0.6 + body) * vel


def shaker(vel: float) -> np.ndarray:
    t = tt(0.12)
    n = filtz(noise(t.size), "bandpass", [4000, 8500], 2)
    return n * env_ad(t, 0.012, 0.025) * vel


def make_music() -> np.ndarray:
    N = int(MUSIC_LEN * SR)
    keys = np.zeros((2, N))
    padb = np.zeros((2, N))
    bass = np.zeros(N)
    drums = np.zeros((2, N))
    swish = np.zeros(N)

    INTRO = 1
    END_BAR = 32  # final ringing chord at bar 32 = 102.4 s
    swing = 0.06 * BEAT

    for bar in range(END_BAR + 1):
        t0 = bar * BAR
        sec_b = bar >= 17 and bar < END_BAR
        name, voic, root = (CHORDS_B if sec_b else CHORDS)[bar % 4]
        final = bar == END_BAR
        if final:
            name, voic, root = "Dmaj9", [54, 57, 61, 64, 69], 38

        # ---- rhodes comping (sparse, rhythmic, no melody)
        if final:
            hits = [(0.0, 0.85, 6.5)]
        elif bar < INTRO:
            hits = [(0.0, 0.7, 3.0)]
        elif sec_b:
            hits = [(0.0, 0.8, 1.4), (1.5 * BEAT + swing, 0.45, 1.0), (3.0 * BEAT, 0.55, 0.8)]
        else:
            hits = [(0.0, 0.8, 1.9), (2.5 * BEAT + swing, 0.5, 1.2)]
        for (o, vel, L) in hits:
            for j, m in enumerate(voic):
                strum = j * (0.012 + 0.006 * rng.random())
                v = vel * (0.85 + 0.15 * rng.random()) * (1.0 if j else 0.9)
                note = rhodes_note(mtof(m), L, v)
                place(keys, pan(note, -0.35 + 0.7 * j / max(len(voic) - 1, 1)), t0 + o + strum, 0.30)
        # B section: soft two-note broken-chord pickup at the end of every 2nd bar (chord tones, not a tune)
        if sec_b and bar % 2 == 1:
            for k, m in enumerate([voic[-1] + 12, voic[-2] + 12]):
                place(keys, pan(rhodes_note(mtof(m), 0.5, 0.35), 0.4 - 0.5 * k), t0 + 3.5 * BEAT + swing + k * 0.5 * BEAT, 0.13)

        # ---- pad (slow attack, overlapping chords)
        pdur = BAR + 1.4 if not final else 7.0
        tp = tt(pdur)
        pe = np.minimum(tp / 0.9, 1) ** 2 * np.where(tp > pdur - 1.4, np.cos(np.pi / 2 * (tp - (pdur - 1.4)) / 1.4) ** 2, 1)
        for j, m in enumerate(voic[:3] + [voic[-1] + 12]):
            v = pad_voice(mtof(m), pdur) * pe
            place(padb, pan(v, (-0.6, 0.6, -0.2, 0.3)[j % 4]), t0 - 0.3 if bar else t0, 0.07)

        # ---- bass (round sine + soft 2nd harmonic)
        if bar >= INTRO:
            bnotes = [(0.0, 1.9 if not final else 5.0)] if not sec_b else [(0.0, 1.5), (2.5 * BEAT + swing, 0.9)]
            if final:
                bnotes = [(0.0, 5.0)]
            for (o, L) in bnotes:
                tb = tt(L + 0.15)
                f = mtof(root)
                b = np.sin(2 * np.pi * f * tb) + 0.25 * np.sin(4 * np.pi * f * tb) + 0.08 * np.sin(6 * np.pi * f * tb)
                be = env_ad(tb, 0.012, 1.4) * np.where(tb > L, np.exp(-(tb - L) / 0.05), 1)
                place(bass, b * be, t0 + o, 0.10)

        # ---- drums: soft kick, brushes, light shaker in B
        if INTRO <= bar < END_BAR:
            place(drums, stereo(soft_kick()), t0, 0.26)
            place(drums, stereo(soft_kick()), t0 + 2.5 * BEAT + swing, 0.17)
            if bar % 4 == 3:
                place(drums, stereo(soft_kick()), t0 + 3.5 * BEAT + swing, 0.11)
            for b_ in (1, 3):
                place(drums, pan(brush_snare(0.9 + 0.1 * rng.random()), 0.1), t0 + b_ * BEAT + 0.01, 0.22)
            # brush sweep: swell every beat
            for b_ in range(4):
                i0 = int((t0 + b_ * BEAT) * SR)
                L = int(BEAT * SR)
                u = np.linspace(0, 1, L)
                if i0 + L <= N:
                    swish[i0:i0 + L] += np.sin(np.pi * u) ** 2 * (0.6 if b_ % 2 else 1.0)
            if sec_b or bar >= 9:
                lvl = 0.07 if sec_b else 0.04
                for e8 in range(8):
                    o = e8 * 0.5 * BEAT + (swing if e8 % 2 else 0)
                    place(drums, pan(shaker(0.6 + 0.4 * (e8 % 2 == 0)), 0.35), t0 + o, lvl)
        if bar == END_BAR:
            place(drums, stereo(soft_kick()), t0, 0.2)

    swish_n = filtz(pink(N), "bandpass", [2500, 7500], 2) * swish * 0.018
    drums += pan(swish_n, -0.2)

    # ---- tremolo / autopan on keys (classic Rhodes stereo vibrato)
    t = tt(MUSIC_LEN)
    lfo = np.sin(2 * np.pi * (BPM / 60) * 1.5 * t / 1)  # ~1.875 Hz, tempo-related
    keys[0] *= 1 - 0.18 * (0.5 + 0.5 * lfo)
    keys[1] *= 1 - 0.18 * (0.5 - 0.5 * lfo)
    keys = filt(keys, "lowpass", 5200, 2)
    keys = filt(keys, "highpass", 140, 1)

    padb = filtz(padb, "lowpass", 1400, 2)
    padb = filtz(padb, "highpass", 120, 2)
    # slow filter-ish movement on pad via amplitude breathing
    padb *= 1 + 0.12 * np.sin(2 * np.pi * 0.07 * t)

    bass = filt(bass, "lowpass", 400, 2)

    # ---- vinyl crackle + hiss
    crackle = np.zeros(N)
    nclicks = int(MUSIC_LEN * 9)
    pos = rng.integers(0, N - 200, nclicks)
    amps = rng.pareto(3.0, nclicks) * 0.15
    for p_, a_ in zip(pos, amps):
        L = rng.integers(8, 60)
        crackle[p_:p_ + L] += a_ * rng.standard_normal(L) * np.exp(-np.arange(L) / (L / 4))
    crackle = filtz(crackle, "bandpass", [700, 6000], 2)
    hiss = filtz(pink(N), "bandpass", [1500, 7000], 2)
    vinyl = np.stack([crackle, np.roll(crackle, 37)]) * 0.05 + stereo(hiss) * 0.0025

    # ---- mix + room
    music_ir = make_ir(2.4, pre=0.03, lp=4500, hp=300)
    room = np.stack([signal.oaconvolve(keys[c] * 0.6 + padb[c] * 0.5 + drums[c] * 0.15, music_ir[c])[:N] for c in range(2)])
    mix = keys + padb + drums + stereo(bass) + 0.28 * room + vinyl

    # master: HPF 40 Hz (no mud), gentle warm tilt, glue saturation
    mix = filt(mix, "highpass", 40, 4)
    mix = filt(mix, "lowpass", 11000, 2)
    # leave a pocket for the male voice (fundamental/body ~150-350 Hz), add a touch of air
    mix = peq(mix, 260, -3.0, 0.8)
    mix = peq(mix, 3500, 2.0, 0.7)
    mix = mix - mix.mean(axis=1, keepdims=True)

    # level to ~ -16 LUFS, then soft-limit peaks
    for _ in range(3):
        L = lufs(mix)
        mix *= 10 ** ((-16.0 - L) / 20)
        pk = np.max(np.abs(mix))
        if pk > 0.89:
            mix = 0.89 * np.tanh(mix / 0.89)
    # intro fade-in (0.4 s) and ending fade (last 3.5 s)
    mix = fade(mix, 0.4, 0.0)
    fo = int(3.5 * SR)
    mix[:, N - fo:] *= np.cos(np.linspace(0, np.pi / 2, fo)) ** 2
    return mix


# ----------------------------------------------------------------------------- loudness / QA
_K1 = ([1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585])
_K2 = ([1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621])


def lufs(x: np.ndarray) -> float:
    x = stereo(x)
    y = signal.lfilter(*_K2, signal.lfilter(*_K1, x, axis=1), axis=1)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    if y.shape[1] < blk:
        return -0.691 + 10 * np.log10(np.sum(np.mean(y ** 2, axis=1)) + 1e-12)
    idx = np.arange(0, y.shape[1] - blk + 1, hop)
    cs = np.concatenate([np.zeros((2, 1)), np.cumsum(y ** 2, axis=1)], axis=1)
    ms = (cs[:, idx + blk] - cs[:, idx]) / blk
    z = np.sum(ms, axis=0)
    l = -0.691 + 10 * np.log10(z + 1e-12)
    z = z[l > -70]
    rel = -0.691 + 10 * np.log10(np.mean(z)) - 10
    l2 = -0.691 + 10 * np.log10(z + 1e-12)
    return float(-0.691 + 10 * np.log10(np.mean(z[l2 > rel])))


def hf_share(x: np.ndarray, cut: float = 10000) -> float:
    m = stereo(x).mean(axis=0)
    P = np.abs(np.fft.rfft(m)) ** 2
    f = np.fft.rfftfreq(m.size, 1 / SR)
    return float(P[f > cut].sum() / (P.sum() + 1e-20))


def centroid(x: np.ndarray) -> float:
    m = stereo(x).mean(axis=0)
    P = np.abs(np.fft.rfft(m)) ** 2
    f = np.fft.rfftfreq(m.size, 1 / SR)
    return float((P * f).sum() / (P.sum() + 1e-20))


def qa_file(path: str) -> dict:
    sr, d = wavfile.read(path)
    x = d.astype(np.float64).T / 32768.0
    return {
        "sr": sr,
        "ch": x.shape[0],
        "dur": x.shape[1] / sr,
        "peak": db(np.max(np.abs(x))),
        "rms": db(np.sqrt(np.mean(x ** 2))),
        "dc": float(np.max(np.abs(x.mean(axis=1)))),
        "nan": bool(np.isnan(x).any()),
        "hf": hf_share(x) * 100,
        "cent": centroid(x),
        "lufs": lufs(x),
        "edge": float(max(np.abs(x[:, :1]).max(), np.abs(x[:, -1:]).max())),
        "x": x,
    }


def main() -> None:
    only = sys.argv[1:]
    rows = []
    for name, fn in SFX.items():
        if only and name not in only:
            continue
        p = os.path.join(SFX_DIR, f"{name}.wav")
        write(p, fn())
        rows.append((name, p))
    if not only or "music" in only:
        p = os.path.join(MUSIC_DIR, "caffeine_bed.wav")
        write(p, make_music())
        rows.append(("caffeine_bed", p))

    print(f"{'file':<14}{'sr':>6}{'ch':>3}{'dur s':>8}{'peak dB':>9}{'rms dB':>8}{'LUFS':>7}{'DC':>9}{'>10k %':>8}{'cent Hz':>9}{'edge':>8} nan")
    for name, p in rows:
        q = qa_file(p)
        print(f"{name:<14}{q['sr']:>6}{q['ch']:>3}{q['dur']:>8.3f}{q['peak']:>9.2f}{q['rms']:>8.1f}{q['lufs']:>7.1f}"
              f"{q['dc']:>9.1e}{q['hf']:>8.3f}{q['cent']:>9.0f}{q['edge']:>8.4f} {q['nan']}")
        if name == "caffeine_bed":
            x = q["x"]
            seg = 8.0
            parts = []
            for s in np.arange(0, q["dur"], seg):
                c = x[:, int(s * SR): int(min(s + seg, q["dur"]) * SR)]
                parts.append(f"{int(s):>3}s {db(np.sqrt(np.mean(c ** 2))):6.1f}")
            print("music RMS per 8 s:", " | ".join(parts))
            m = x.mean(axis=0)
            P = np.abs(np.fft.rfft(m)) ** 2
            f = np.fft.rfftfreq(m.size, 1 / SR)
            tot = P.sum()
            bands = [(0, 40), (40, 120), (120, 400), (400, 2000), (2000, 6000), (6000, 10000), (10000, 24000)]
            print("music spectrum share:", ", ".join(f"{a}-{b}Hz {100 * P[(f >= a) & (f < b)].sum() / tot:.1f}%" for a, b in bands))


if __name__ == "__main__":
    main()
