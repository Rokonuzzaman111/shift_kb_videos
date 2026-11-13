"""
Synthesize all audio for the NVIDIA explainer (no downloads).

  python -I -X utf8 scripts/make_audio_nvidia.py            # everything
  python -I -X utf8 scripts/make_audio_nvidia.py impact riser # only some SFX
  python -I -X utf8 scripts/make_audio_nvidia.py music        # only the beds

Writes 48 kHz / 16-bit / stereo WAVs:
  public/nvidia/sfx/<name>.wav       (every name in SFX_NAMES of src/nvidia/types.ts, peak -1 dBFS)
  public/nvidia/music/bed.wav        (450 s dark cinematic-tech bed, 96 BPM, D minor, ~-16 LUFS)
  public/nvidia/music/bed_tense.wav  (90 s seamless loop, same key/tempo, darker, heartbeat pulse, ~-17 LUFS)
and prints a QA table (duration, peak, RMS, LUFS (internal + ffmpeg ebur128), DC, click score).

Reuses the synthesis helpers of scripts/make_audio_caffeine.py.
"""
from __future__ import annotations

import os
import re
import subprocess
import sys

import numpy as np
from scipy import signal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_audio_caffeine as A  # noqa: E402

SR = A.SR
tt, env_ad, filt, filtz, pink, place, pan, reverb, finish_sfx, stereo, peq, sat, fade, pad_to, db = (
    A.tt, A.env_ad, A.filt, A.filtz, A.pink, A.place, A.pan, A.reverb, A.finish_sfx, A.stereo, A.peq, A.sat,
    A.fade, A.pad_to, A.db)
ROOT = A.ROOT
SFX_DIR = os.path.join(ROOT, "public", "nvidia", "sfx")
MUSIC_DIR = os.path.join(ROOT, "public", "nvidia", "music")
rng = np.random.default_rng(20261113)

IR_SMALL, IR_ROOM, IR_HALL = A.IR_SMALL, A.IR_ROOM, A.IR_HALL
IR_BIG = A.make_ir(3.2, pre=0.035, lp=4200, hp=150)


# ----------------------------------------------------------------------------- small helpers
def nz(n: int) -> np.ndarray:
    return rng.standard_normal(n)


def buf(dur: float) -> np.ndarray:
    return np.zeros((2, int(round(dur * SR))))


def sweep(dur: float, f0: float, f1: float, curve: float = 1.0, phase: float = 0.0) -> np.ndarray:
    """phase-continuous exponential sine sweep"""
    t = tt(dur)
    k = (t / dur) ** curve
    f = f0 * (f1 / f0) ** k
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def freq_osc(f: np.ndarray, kind: str = "sine", phase: float = 0.0) -> np.ndarray:
    ph = np.cumsum(f) / SR + phase
    if kind == "sine":
        return np.sin(2 * np.pi * ph)
    if kind == "saw":
        return 2 * (ph % 1.0) - 1
    if kind == "tri":
        return 2 * np.abs(2 * (ph % 1.0) - 1) - 1
    if kind == "sq":
        return np.sign(np.sin(2 * np.pi * ph))
    raise ValueError(kind)


def rev(x: np.ndarray, ir: np.ndarray, wet: float, n: int | None = None) -> np.ndarray:
    y = reverb(x, ir, wet)
    return y[:, : (n or y.shape[1])]


def sub_boom(dur: float, f0: float, f1: float, tau_p: float, tau_a: float, att: float = 0.002) -> np.ndarray:
    """sine with exponential pitch drop (kick / boom body)"""
    t = tt(dur)
    f = f1 + (f0 - f1) * np.exp(-t / tau_p)
    return freq_osc(f) * env_ad(t, att, tau_a)


def crack(dur: float, lo: float, hi: float, tau: float) -> np.ndarray:
    t = tt(dur)
    return filtz(nz(t.size), "bandpass", [lo, hi], 2) * env_ad(t, 0.0004, tau)


def mtof(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


# ----------------------------------------------------------------------------- SFX
def sfx_whoosh():
    """camera move: airy band-noise pass, L->R"""
    x = A.whoosh(0.75, 260, 2100, 650, 0.55, 1.4, -0.7, 0.7)
    t = tt(x.shape[1] / SR)
    body = filtz(pink(t.size), "lowpass", 220, 2) * np.sin(np.pi * np.clip(t / 0.75, 0, 1)) ** 3 * 0.25
    x = x + stereo(body)
    return finish_sfx(x[:, : int(0.95 * SR)], lp=10000, fout=0.15)


def sfx_whoosh_big():
    """scene change: wide double-layer pass with sub swell and a soft landing thump"""
    dur = 1.5
    n = int(dur * SR)
    a = A.whoosh(1.2, 180, 1600, 420, 0.6, 1.6, -0.9, 0.9)
    b = A.whoosh(1.2, 500, 3800, 1200, 0.62, 1.1, 0.8, -0.8)
    out = buf(dur)
    place(out, a, 0.0, 1.0)
    place(out, b, 0.03, 0.45)
    t = tt(dur)
    sw = np.sin(np.pi / 2 * np.clip(t / 0.72, 0, 1)) ** 2 * np.exp(-np.maximum(t - 0.72, 0) / 0.18)
    sub = sweep(dur, 45, 70, 0.6) * sw * 0.55
    out += stereo(sub)
    thump = sub_boom(0.6, 110, 48, 0.05, 0.16) * 0.6
    place(out, stereo(thump), 0.72, 1.0)
    out = rev(out, IR_HALL, 0.28, n)
    return finish_sfx(out, lp=10000, fout=0.3)


def sfx_swoosh_up():
    """text/element flies up: rising band-noise + faint rising tone"""
    dur = 0.65
    n = int(dur * SR)
    t = tt(dur)
    centers = 450 * (5200 / 450) ** np.linspace(0, 1, 64) ** 1.3
    a = A.band_noise_sweep(n, centers, 1.2)
    e = np.sin(np.pi / 2 * np.clip(t / 0.5, 0, 1)) ** 2 * np.cos(np.pi / 2 * np.clip((t - 0.5) / 0.15, 0, 1)) ** 1.5
    tone = sweep(dur, 260, 1100, 1.4) * 0.12 * e
    st = pan(a * e + tone, np.linspace(-0.2, 0.25, n))
    st = rev(st, IR_SMALL, 0.2, int(0.8 * SR))
    return finish_sfx(st, lp=11000, fout=0.12)


def sfx_impact():
    """big number lands: click + punchy body + low thud + room"""
    dur = 1.4
    out = buf(dur)
    t = tt(dur)
    body = sub_boom(dur, 140, 48, 0.035, 0.28) * 0.9
    punch = filtz(nz(t.size), "lowpass", 1400, 2) * env_ad(t, 0.0008, 0.045) * 0.6
    snap = crack(dur, 1800, 6500, 0.012) * 0.35
    mid = np.sin(2 * np.pi * 180 * t) * env_ad(t, 0.001, 0.06) * 0.25
    y = sat(body + punch + mid, 1.6) + snap
    out += pan(y, 0.0)
    out = rev(out, IR_ROOM, 0.32, out.shape[1])
    return finish_sfx(out, lp=9000, fout=0.35)


def sfx_impact_deep():
    """dramatic reveal: cinematic boom with metallic low ring and long hall"""
    dur = 3.8
    out = buf(dur)
    t = tt(dur)
    sub = sub_boom(dur, 75, 30, 0.25, 1.3, att=0.003)
    mid = sat(sub_boom(dur, 160, 62, 0.06, 0.4) * 1.4, 2.2) * 0.45
    ring = sum(np.sin(2 * np.pi * f * t + p) * g for f, p, g in
               [(98, 0.0, 0.18), (151.3, 1.1, 0.12), (237.7, 2.0, 0.08), (331.0, 0.5, 0.05)]) * env_ad(t, 0.004, 1.1)
    cr = crack(dur, 300, 3500, 0.09) * 0.5 + crack(dur, 3000, 8000, 0.02) * 0.15
    y = sub * 1.0 + mid + ring + cr
    out += pan(y, 0.0)
    # slightly decorrelated air layer for width
    air = np.stack([filtz(nz(t.size), "bandpass", [200, 1200], 2), filtz(nz(t.size), "bandpass", [200, 1200], 2)])
    out += air * env_ad(t, 0.005, 0.35) * 0.18
    out = rev(out, IR_BIG, 0.45, out.shape[1])
    return finish_sfx(out, lp=8000, fout=0.9)


def _riser(dur: float, f_lo: float, f_hi: float, tone_lo: float, tone_hi: float) -> np.ndarray:
    n = int(dur * SR)
    t = tt(dur)
    u = t / dur
    grow = u ** 2.2
    centers = f_lo * (f_hi / f_lo) ** np.linspace(0, 1, 96) ** 1.5
    nb = A.band_noise_sweep(n, centers, 1.3)
    nb2 = A.band_noise_sweep(n, centers * 2.2, 0.9)
    f = tone_lo * (tone_hi / tone_lo) ** (u ** 1.6)
    tones = sum(freq_osc(f * d, "saw", ph) for d, ph in [(1.0, 0), (1.007, 0.3), (0.993, 0.6), (1.5, 0.1)]) / 4
    tones = filt(tones, "lowpass", 2600, 2)
    trem_rate = 3 + 18 * u ** 2
    trem = 0.75 + 0.25 * np.sin(2 * np.pi * np.cumsum(trem_rate) / SR)
    sub = sweep(dur, 40, 80, 1.0) * u ** 1.5 * 0.35
    y = (nb * 0.9 + nb2 * 0.35) * grow + tones * 0.45 * grow * trem
    st = np.stack([y + 0.15 * np.roll(nb2, 211) * grow, y - 0.15 * np.roll(nb2, 211) * grow]) + stereo(sub)
    st = rev(st, IR_ROOM, 0.25, n)
    return st


def sfx_riser():
    return finish_sfx(_riser(2.1, 250, 7000, 110, 440), lp=12000, fin=0.05, fout=0.02)


def sfx_riser_short():
    return finish_sfx(_riser(0.8, 500, 7000, 220, 660), lp=12000, fin=0.02, fout=0.015)


def sfx_hit_glitch():
    """digital glitch hit: low hit + sample-held/stuttered noise + square blips"""
    dur = 0.9
    out = buf(dur)
    t = tt(dur)
    hit = sat(sub_boom(dur, 120, 45, 0.03, 0.2) * 1.3, 1.8) * 0.8
    out += stereo(hit)
    pos = 0.0
    while pos < 0.42:
        seg = rng.uniform(0.018, 0.05)
        L = int(seg * SR)
        kind = rng.integers(0, 3)
        if kind == 0:  # sample-and-hold noise (bitcrush)
            hold = int(rng.integers(8, 40))
            raw = np.repeat(nz(L // hold + 1), hold)[:L]
            y = np.round(raw * 4) / 4 * 0.35
        elif kind == 1:  # square blip
            f = rng.choice([220, 330, 440, 660, 880, 1320])
            y = np.sign(np.sin(2 * np.pi * f * np.arange(L) / SR)) * 0.25
        else:  # gated hi noise
            y = filtz(nz(L), "highpass", 3000, 2) * 0.3
        y = fade(y, 0.001, 0.003) * (1 - pos / 0.5) ** 0.7
        place(out, pan(y, rng.uniform(-0.8, 0.8)), pos, 1.0)
        pos += seg + rng.uniform(0.0, 0.02)
    out[:, : int(0.45 * SR)] = filtz(out[:, : int(0.45 * SR)], "lowpass", 9000, 2)
    out = rev(out, IR_SMALL, 0.25, out.shape[1])
    return finish_sfx(out, lp=11000, fout=0.2)


def sfx_tick():
    """counter tick: tight, dry, woody-digital"""
    x = A.tick_unit(f_body=3000, f_res=1500, low=520, dur=0.09, bright=0.9)
    return finish_sfx(pan(x, 0.0), lp=12000, fin=0.0005, fout=0.02)


def sfx_ui_click():
    dur = 0.16
    t = tt(dur)
    a = np.sin(2 * np.pi * 1900 * t) * env_ad(t, 0.0003, 0.006) + np.sin(2 * np.pi * 3700 * t) * env_ad(t, 0.0002, 0.003) * 0.4
    a += crack(dur, 4000, 10000, 0.002) * 0.4
    b = np.zeros_like(t)
    i = int(0.028 * SR)
    b[i:] = (np.sin(2 * np.pi * 1300 * t[: t.size - i]) * env_ad(t[: t.size - i], 0.0003, 0.005)) * 0.45
    y = a + b + np.sin(2 * np.pi * 300 * t) * env_ad(t, 0.0005, 0.01) * 0.2
    out = rev(pan(y, 0.0), IR_SMALL, 0.08, t.size)
    return finish_sfx(out, lp=12000, fin=0.0004, fout=0.04)


def sfx_ui_pop():
    """keyword pop: quick bubbly upward blip with soft body"""
    dur = 0.4
    t = tt(dur)
    f = 380 * (980 / 380) ** np.clip(t / 0.045, 0, 1)
    y = freq_osc(f) * env_ad(t, 0.0015, 0.05)
    y += np.sin(2 * np.pi * 1960 * t) * env_ad(t, 0.001, 0.02) * 0.15
    y += crack(dur, 2000, 6000, 0.002) * 0.25
    y += sub_boom(dur, 180, 90, 0.02, 0.04) * 0.35
    out = rev(pan(y, 0.0), IR_SMALL, 0.22, t.size)
    return finish_sfx(out, lp=11000, fin=0.0006, fout=0.12)


def key_stroke(vel: float, heavy: bool = False) -> np.ndarray:
    dur = 0.12
    t = tt(dur)
    fk = rng.uniform(0.85, 1.15)
    click = filtz(nz(t.size), "bandpass", [2200 * fk, 5500 * fk], 2) * env_ad(t, 0.0003, 0.004)
    thock = filtz(nz(t.size), "bandpass", [550 * fk, 1300 * fk], 2) * env_ad(t, 0.0006, 0.014) * 0.7
    bottom = np.zeros_like(t)
    j = int(rng.uniform(0.008, 0.014) * SR)
    bottom[j:] = np.sin(2 * np.pi * (180 if heavy else 240) * fk * t[: t.size - j]) * env_ad(t[: t.size - j], 0.0005, 0.012) * 0.6
    up = np.zeros_like(t)
    k = int(rng.uniform(0.06, 0.09) * SR)
    up[k:] = filtz(nz(t.size - k), "bandpass", [2500, 6000], 2) * env_ad(t[: t.size - k], 0.0003, 0.003) * 0.25
    return (click + thock + bottom * (1.6 if heavy else 1.0) + up) * vel


def sfx_type():
    """keyboard burst ~1 s, ends with a heavier spacebar/enter"""
    dur = 1.25
    out = buf(dur)
    pos = 0.02
    while pos < 0.9:
        place(out, pan(key_stroke(rng.uniform(0.55, 1.0)), rng.uniform(-0.35, 0.35)), pos)
        pos += rng.uniform(0.055, 0.115) * (1.7 if rng.random() < 0.12 else 1.0)
    place(out, pan(key_stroke(1.1, heavy=True), 0.1), min(pos + 0.03, 1.0))
    out = rev(out, IR_SMALL, 0.15, out.shape[1])
    return finish_sfx(out, lp=11000, fout=0.1)


def coin(f0: float, dur: float = 0.8) -> np.ndarray:
    t = tt(dur)
    ratios = [1.0, 1.47, 2.09, 2.56, 3.21]
    y = sum(np.sin(2 * np.pi * f0 * r * t + rng.uniform(0, 6)) * env_ad(t, 0.0005, 0.35 / r ** 0.6) / (1 + i * 0.6)
            for i, r in enumerate(ratios))
    return y + crack(dur, 4000, 11000, 0.002) * 0.3


def sfx_cash():
    """tasteful money cue: soft mechanism click + three coin chimes + shimmer tail"""
    dur = 1.5
    out = buf(dur)
    mech = crack(0.1, 700, 3000, 0.01) * 0.5 + sub_boom(0.1, 260, 140, 0.01, 0.02) * 0.4
    place(out, pan(mech, -0.1), 0.0)
    for at, f, p in [(0.05, 2350, -0.4), (0.12, 2960, 0.35), (0.2, 3520, 0.0)]:
        place(out, pan(coin(f), p), at, 0.55)
    t = tt(dur)
    air = filtz(nz(t.size), "highpass", 7000, 2) * env_ad(t, 0.08, 0.25) * 0.05
    out += stereo(air)
    out = rev(out, IR_ROOM, 0.35, out.shape[1])
    return finish_sfx(out, lp=12000, fout=0.4)


def sfx_drop_down():
    """falling stock chart: descending detuned tone + downward noise band + low landing"""
    dur = 1.7
    n = int(dur * SR)
    t = tt(dur)
    u = np.clip(t / 1.3, 0, 1)
    f = 880 * (70 / 880) ** (u ** 0.8)
    f = f * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * t))
    tone = (freq_osc(f, "saw") + freq_osc(f * 1.008, "saw", 0.4)) * 0.5
    tone = filt(tone, "lowpass", 2200, 2) * 0.55 + freq_osc(f / 2) * 0.35
    e = env_ad(t, 0.02, 10) * np.cos(np.pi / 2 * np.clip((t - 1.15) / 0.5, 0, 1)) ** 2
    centers = 3500 * (180 / 3500) ** np.linspace(0, 1, 64)
    nb = A.band_noise_sweep(n, centers, 1.2) * np.sin(np.pi * np.clip(t / 1.3, 0, 1)) * 0.45
    out = pan(tone * e, np.linspace(0.3, -0.3, n)) + stereo(nb)
    land = sub_boom(0.6, 90, 40, 0.06, 0.2) * 0.8
    place(out, stereo(land), 1.25)
    out = rev(out, IR_ROOM, 0.3, n)
    return finish_sfx(out, lp=9000, fout=0.3)


def sfx_alarm_soft():
    """subtle warning: two soft rounded pulses with a low undertone"""
    dur = 1.4
    out = buf(dur)
    for at, g in [(0.0, 1.0), (0.42, 0.8)]:
        d = 0.36
        t = tt(d)
        e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
        y = (np.sin(2 * np.pi * 740 * t) + 0.18 * np.sin(2 * np.pi * 1480 * t) + 0.5 * np.sin(2 * np.pi * 370 * t)) * e
        y *= 1 + 0.25 * np.sin(2 * np.pi * 14 * t)
        y += np.sin(2 * np.pi * 92.5 * t) * e * 0.5
        place(out, pan(y, 0.0), at, g)
    out = filtz(out, "lowpass", 3000, 2)
    out = rev(out, IR_ROOM, 0.4, out.shape[1])
    return finish_sfx(out, lp=8000, fout=0.35)


def _hum(t: np.ndarray, base: np.ndarray) -> np.ndarray:
    return (freq_osc(base) + 0.6 * freq_osc(base * 2, phase=0.2) + 0.35 * freq_osc(base * 3, phase=0.5)
            + 0.15 * freq_osc(base * 5, phase=0.1))


def sfx_power_on():
    """GPU powering up: relay click, rising hum + sweep, whine, settle thunk"""
    dur = 2.0
    n = int(dur * SR)
    t = tt(dur)
    out = buf(dur)
    relay = crack(0.08, 1200, 5000, 0.006) * 0.6 + sub_boom(0.08, 300, 150, 0.01, 0.015) * 0.4
    place(out, pan(relay, -0.2), 0.0)
    u = np.clip(t / 1.2, 0, 1)
    base = 28 + (60 - 28) * u ** 0.7
    hum = _hum(t, base) * np.sin(np.pi / 2 * u) ** 2 * np.exp(-np.maximum(t - 1.3, 0) / 0.5)
    hum = filt(hum, "lowpass", 900, 2) * 0.45
    swp = sweep(dur, 90, 900, 1.3) * env_ad(t, 1.0, 0.18) * 0.22
    whine = sweep(dur, 3000, 7500, 1.0) * np.sin(np.pi / 2 * u) ** 3 * np.exp(-np.maximum(t - 1.2, 0) / 0.35) * 0.04
    centers = 200 * (4000 / 200) ** np.linspace(0, 1, 64)
    air = A.band_noise_sweep(n, centers, 1.2) * np.sin(np.pi / 2 * u) ** 2 * np.exp(-np.maximum(t - 1.2, 0) / 0.15) * 0.25
    out += stereo(hum + swp + whine) + pan(air, np.linspace(-0.4, 0.4, n))
    thunk = sub_boom(0.6, 130, 55, 0.03, 0.15) * 0.7 + crack(0.6, 2000, 7000, 0.006) * 0.15
    place(out, stereo(thunk), 1.2)
    out = rev(out, IR_ROOM, 0.3, n)
    return finish_sfx(out, lp=10000, fout=0.35)


def sfx_power_down():
    """GPU powering down: whine and hum fall in pitch and die out"""
    dur = 1.8
    n = int(dur * SR)
    t = tt(dur)
    u = np.clip(t / 1.4, 0, 1)
    base = 60 * (22 / 60) ** (u ** 1.3)
    e = np.cos(np.pi / 2 * u) ** 1.5
    hum = filt(_hum(t, base), "lowpass", 900, 2) * e * 0.5
    whine = freq_osc(6500 * (300 / 6500) ** u ** 0.8) * np.cos(np.pi / 2 * np.clip(t / 0.9, 0, 1)) ** 2 * 0.06
    tone = freq_osc(440 * (55 / 440) ** u ** 0.9, "saw")
    tone = filt(tone, "lowpass", 1500, 2) * e * 0.18
    click = crack(dur, 1200, 5000, 0.006) * 0.5
    y = hum + whine + tone + click
    out = rev(pan(y, 0.0), IR_ROOM, 0.3, n)
    return finish_sfx(out, lp=9000, fout=0.3)


def sfx_bass_drop():
    """sub hit: pitch-falling sub with a soft click and a little grit"""
    dur = 2.2
    t = tt(dur)
    s = sub_boom(dur, 95, 30, 0.35, 0.9, att=0.004)
    grit = sat(s * 2.5, 2.0) * 0.12
    y = s + filt(grit, "lowpass", 600, 2) + crack(dur, 1500, 5000, 0.004) * 0.18
    out = rev(pan(y, 0.0), IR_ROOM, 0.15, t.size)
    return finish_sfx(out, lp=6000, fout=0.6)


def sfx_shimmer():
    """positive reveal sparkle: D-major-ish glints that bloom, airy swell, hall"""
    dur = 2.4
    out = buf(dur)
    notes = [74, 78, 81, 83, 86, 88, 90, 93, 95, 98]  # D5 F#5 A5 B5 D6 E6 F#6 A6 B6 D7
    for i in range(24):
        at = 0.6 * (i / 24) ** 1.4 + rng.uniform(0, 0.03)
        f = mtof(rng.choice(notes))
        d = 0.9
        t = tt(d)
        y = (np.sin(2 * np.pi * f * t) + 0.2 * np.sin(2 * np.pi * 2 * f * t)) * env_ad(t, 0.002, rng.uniform(0.15, 0.4))
        place(out, pan(y, rng.uniform(-0.8, 0.8)), at, 0.22 * rng.uniform(0.5, 1.0))
    t = tt(dur)
    air = filtz(nz(t.size), "highpass", 6000, 2) * np.sin(np.pi * np.clip(t / 1.2, 0, 1)) ** 2 * 0.06
    out += np.stack([air, np.roll(air, 97)])
    pad = sum(np.sin(2 * np.pi * mtof(m) * t) for m in (62, 66, 69)) * env_ad(t, 0.15, 0.6) * 0.06
    out += stereo(pad)
    out = rev(out, IR_HALL, 0.55, out.shape[1])
    return finish_sfx(out, lp=13000, fin=0.003, fout=0.6)


def sfx_camera_shutter():
    dur = 0.45
    out = buf(dur)
    t = tt(0.1)
    m1 = filtz(nz(t.size), "bandpass", [1200, 6000], 2) * env_ad(t, 0.0003, 0.005) + np.sin(2 * np.pi * 3100 * t) * env_ad(t, 0.0003, 0.004) * 0.3
    m2 = filtz(nz(t.size), "bandpass", [800, 5000], 2) * env_ad(t, 0.0003, 0.008) + sub_boom(0.1, 220, 120, 0.01, 0.02) * 0.6
    whirr = filtz(nz(int(0.05 * SR)), "bandpass", [2000, 7000], 2) * np.hanning(int(0.05 * SR)) * 0.12
    place(out, pan(m1, -0.1), 0.0, 0.7)
    place(out, pan(whirr, 0.0), 0.012)
    place(out, pan(m2, 0.1), 0.065, 1.0)
    out = rev(out, IR_SMALL, 0.18, out.shape[1])
    return finish_sfx(out, lp=11000, fin=0.0004, fout=0.1)


def heart_beat() -> np.ndarray:
    d = 0.6
    t = tt(d)
    lub = sub_boom(d, 75, 42, 0.05, 0.09, att=0.006) + filtz(nz(t.size), "lowpass", 180, 2) * env_ad(t, 0.004, 0.05) * 0.4
    dub = sub_boom(d, 95, 50, 0.04, 0.07, att=0.005) + filtz(nz(t.size), "lowpass", 220, 2) * env_ad(t, 0.004, 0.04) * 0.3
    y = np.zeros(int(0.9 * SR))
    y[: t.size] += lub
    j = int(0.24 * SR)
    y[j: j + t.size] += dub * 0.7
    return y


def sfx_heartbeat():
    dur = 2.0
    out = buf(dur)
    for at, g in [(0.02, 1.0), (0.95, 0.95)]:
        place(out, stereo(sat(heart_beat() * 1.2, 1.3)), at, g)
    out = rev(out, IR_ROOM, 0.12, out.shape[1])
    return finish_sfx(out, lp=900, fout=0.3)


def stab(midi: list[int], dur: float, cutoff0: float, cutoff1: float, tau: float) -> np.ndarray:
    t = tt(dur)
    y = np.zeros(t.size)
    for m in midi:
        f = mtof(m)
        for d, ph in [(1.0, 0.0), (1.006, 0.4), (0.994, 0.7)]:
            y += freq_osc(np.full(t.size, f * d), "saw", ph)
    y /= 3 * len(midi)
    # time-varying lowpass via crossfade of two filtered copies (cheap, click-free)
    bright = filt(y, "lowpass", cutoff0, 2)
    dark = filt(y, "lowpass", cutoff1, 2)
    k = np.exp(-t / (tau * 0.5))
    return (bright * k + dark * (1 - k)) * env_ad(t, 0.004, tau)


def sfx_news_sting():
    """breaking-news sting: short swell, da-DUM hit with D minor stab, timpani-like boom, hall tail"""
    dur = 1.8
    out = buf(dur)
    sw = _riser(0.32, 800, 6000, 220, 440) * 0.35
    place(out, sw, 0.0)
    chord = [38, 50, 57, 62, 65]  # D2 D3 A3 D4 F4
    place(out, pan(stab(chord, 0.25, 2500, 600, 0.06), -0.15), 0.32, 0.55)
    s2 = stab(chord, 1.4, 3200, 500, 0.35)
    place(out, np.stack([s2, np.roll(s2, 160)]), 0.5, 0.9)
    boom = sat(sub_boom(1.3, 110, 46, 0.06, 0.35) * 1.3, 1.6) + crack(1.3, 2500, 8000, 0.01) * 0.25
    place(out, stereo(boom), 0.5, 0.9)
    pl = sum(np.sin(2 * np.pi * mtof(m) * tt(1.2)) for m in (86, 93)) * env_ad(tt(1.2), 0.002, 0.25) * 0.08
    place(out, pan(pl, 0.3), 0.5)
    out = rev(out, IR_HALL, 0.4, out.shape[1])
    return finish_sfx(out, lp=10000, fout=0.5)


def sfx_reverse_swell():
    """reverse cymbal + reversed low bloom, peaks exactly at the end (into a cut)"""
    dur = 1.2
    n = int(dur * SR)
    t = tt(dur)
    cym = filtz(nz(n), "highpass", 3500, 2) + sum(np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * 0.08
                                                  for f in (3215, 4170, 5333, 6812, 7740, 9120))
    cym = filtz(cym, "lowpass", 11000, 2) * np.exp(-t / 0.45)
    cym_st = rev(np.stack([cym, np.roll(cym, 53)]), IR_HALL, 0.35, n)
    bloom = sum(np.sin(2 * np.pi * mtof(m) * t) for m in (38, 50, 57)) * np.exp(-t / 0.4) * 0.3
    bloom_st = rev(stereo(bloom), IR_HALL, 0.5, n)
    y = (cym_st * 0.8 + bloom_st)[:, ::-1]
    y = y * (np.linspace(0, 1, n) ** 0.5)
    return finish_sfx(y, lp=12000, fin=0.05, fout=0.008)


def sfx_data_stream():
    """digital data flow: fast quantized blips, gated noise, low digital hum"""
    dur = 2.0
    out = buf(dur)
    t = tt(dur)
    scale = [mtof(m) for m in (74, 77, 79, 81, 84, 86, 89, 91, 93)]
    pos = 0.0
    while pos < dur - 0.05:
        L = rng.uniform(0.012, 0.03)
        tl = tt(L)
        f = rng.choice(scale)
        y = (np.sin(2 * np.pi * f * tl) + 0.3 * np.sign(np.sin(2 * np.pi * f * tl))) * env_ad(tl, 0.001, L * 0.4)
        place(out, pan(fade(y, 0.001, 0.003), rng.uniform(-0.9, 0.9)), pos, rng.uniform(0.08, 0.2))
        pos += rng.uniform(0.018, 0.045)
    gate = (np.sin(2 * np.pi * 16 * t) > 0.2).astype(float)
    gate = filtz(gate, "lowpass", 200, 2)
    hiss = filtz(nz(t.size), "bandpass", [4000, 9000], 2) * gate * 0.05
    hum = filt(np.sign(np.sin(2 * np.pi * 110 * t)), "lowpass", 600, 2) * 0.06
    out += np.stack([hiss + hum, np.roll(hiss, 131) + hum])
    e = np.sin(np.pi / 2 * np.clip(t / 0.3, 0, 1)) ** 2 * np.cos(np.pi / 2 * np.clip((t - 1.6) / 0.4, 0, 1)) ** 2
    out *= e
    out = rev(out, IR_SMALL, 0.2, out.shape[1])
    return finish_sfx(out, lp=11000, fin=0.01, fout=0.05)


SFX = {
    "whoosh": sfx_whoosh,
    "whoosh_big": sfx_whoosh_big,
    "swoosh_up": sfx_swoosh_up,
    "impact": sfx_impact,
    "impact_deep": sfx_impact_deep,
    "riser": sfx_riser,
    "riser_short": sfx_riser_short,
    "hit_glitch": sfx_hit_glitch,
    "tick": sfx_tick,
    "ui_click": sfx_ui_click,
    "ui_pop": sfx_ui_pop,
    "type": sfx_type,
    "cash": sfx_cash,
    "drop_down": sfx_drop_down,
    "alarm_soft": sfx_alarm_soft,
    "power_on": sfx_power_on,
    "power_down": sfx_power_down,
    "bass_drop": sfx_bass_drop,
    "shimmer": sfx_shimmer,
    "camera_shutter": sfx_camera_shutter,
    "heartbeat": sfx_heartbeat,
    "news_sting": sfx_news_sting,
    "reverse_swell": sfx_reverse_swell,
    "data_stream": sfx_data_stream,
}

# ----------------------------------------------------------------------------- MUSIC
BPM = 96.0
BEAT = 60.0 / BPM  # 0.625 s
BAR = 4 * BEAT  # 2.5 s
CHORD_BARS = 2  # one chord per 2 bars (5 s)
BED_LEN = 450.0
TENSE_LEN = 90.0
SECTION = 50.0  # 20 bars -> layers change every 50 s

# D minor. (pad voicing, bass root, arp tones)
PROG_A = [
    ([50, 53, 57, 60, 64], 38, [62, 65, 69, 72, 64]),  # Dm9
    ([46, 50, 53, 57, 60], 34, [58, 62, 65, 69, 60]),  # Bbmaj9
    ([43, 50, 55, 58, 62], 31, [55, 58, 62, 65, 69]),  # Gm9
    ([45, 52, 57, 62, 64], 33, [57, 62, 64, 69, 64]),  # Asus4
]
PROG_B = [
    ([50, 53, 57, 60, 64], 38, [62, 65, 69, 72, 64]),  # Dm9
    ([41, 48, 53, 57, 60], 29, [57, 60, 65, 69, 64]),  # Fmaj7
    ([48, 52, 55, 62, 64], 36, [60, 62, 64, 67, 71]),  # Cadd9
    ([46, 50, 53, 57, 64], 34, [58, 62, 65, 69, 64]),  # Bbmaj7#11
]
SECTION_PROG = [PROG_A, PROG_A, PROG_B, PROG_A, PROG_B, PROG_A, PROG_B, PROG_A, PROG_A]

# per-section layer levels (0..1), sections are 50 s each (9 sections = 450 s)
LAYERS = {
    "pad":      [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
    "bright":   [0.0, 0.3, 0.5, 0.15, 0.8, 0.5, 0.4, 0.9, 0.2],
    "sub":      [0.6, 0.8, 1.0, 0.7, 1.0, 0.8, 1.0, 1.0, 0.6],
    "pulse":    [0.0, 0.7, 0.9, 0.0, 1.0, 0.5, 1.0, 1.0, 0.0],
    "arp8":     [0.8, 0.6, 0.0, 0.9, 0.0, 0.7, 0.0, 0.0, 0.9],
    "arp16":    [0.0, 0.4, 0.9, 0.0, 1.0, 0.3, 0.9, 1.0, 0.0],
    "kick":     [0.0, 0.0, 0.8, 0.0, 1.0, 0.0, 0.9, 1.0, 0.0],
    "hat":      [0.0, 0.6, 0.8, 0.5, 1.0, 0.0, 0.8, 1.0, 0.0],
    "clap":     [0.0, 0.0, 0.0, 0.0, 0.8, 0.0, 0.5, 0.9, 0.0],
    "atmos":    [1.0, 0.7, 0.6, 1.0, 0.5, 1.0, 0.6, 0.5, 1.0],
}


def layer_curve(vals: list[float], N: int, ramp: float = 8.0) -> np.ndarray:
    """piecewise-constant per section with smooth (cosine) ramps of `ramp` s centred on each boundary"""
    t = np.arange(N) / SR
    out = np.full(N, vals[0], dtype=np.float64)
    for i in range(1, len(vals)):
        b = i * SECTION
        k = np.clip((t - (b - ramp / 2)) / ramp, 0, 1)
        k = 0.5 - 0.5 * np.cos(np.pi * k)
        out += (vals[i] - vals[i - 1]) * k
    return out


def saw_voice(f: float, dur: float, detunes=(1.0, 1.004, 0.996)) -> np.ndarray:
    n = int(dur * SR)
    ph0 = rng.uniform(0, 1, len(detunes))
    k = np.arange(n) / SR
    return sum(2 * ((f * d * k + p) % 1.0) - 1 for d, p in zip(detunes, ph0)) / len(detunes)


def chord_at(prog, bar_idx):
    return prog[(bar_idx // CHORD_BARS) % len(prog)]


def pluck(f: float, vel: float, tau: float = 0.2) -> np.ndarray:
    d = min(0.9, tau * 5)
    t = tt(d)
    y = np.sin(2 * np.pi * f * t) + 0.35 * (2 * np.abs(2 * ((f * t + 0.25) % 1.0) - 1) - 1) + 0.12 * np.sin(4 * np.pi * f * t)
    return y * env_ad(t, 0.004, tau) * vel


def soft_kick() -> np.ndarray:
    d = 0.5
    t = tt(d)
    return sub_boom(d, 120, 44, 0.03, 0.18, att=0.0015) + crack(d, 1000, 4000, 0.004) * 0.08


def hat(vel: float) -> np.ndarray:
    d = 0.08
    t = tt(d)
    return filtz(nz(t.size), "highpass", 8000, 2) * env_ad(t, 0.0005, 0.018) * vel


def clap() -> np.ndarray:
    d = 0.35
    t = tt(d)
    n = filtz(nz(t.size), "bandpass", [900, 3000], 2)
    e = sum(env_ad(np.maximum(t - o, 0), 0.0005, 0.006) * (t >= o) for o in (0, 0.009, 0.018)) + env_ad(t, 0.02, 0.07)
    return n * e * 0.6


def ping_pong(x: np.ndarray, delay: float, fb: float, n_rep: int = 6, lp: float = 2500) -> np.ndarray:
    """stereo ping-pong delay of a mono signal, darker each repeat"""
    out = np.zeros((2, x.size))
    d = int(delay * SR)
    y = x.copy()
    for r in range(1, n_rep + 1):
        y = filt(y, "lowpass", lp, 1)
        g = fb ** r
        ch = r % 2
        out[ch, r * d:] += g * y[: x.size - r * d]
    return out


def master(mix: np.ndarray, target: float, ceiling: float = 0.85) -> np.ndarray:
    mix = filt(mix, "highpass", 30, 4)
    mix = filt(mix, "lowpass", 12000, 2)
    mix = peq(mix, 280, -2.5, 0.8)   # pocket for male voice body
    mix = peq(mix, 2500, -3.5, 0.6)  # keep speech-intelligibility band clear
    mix = mix - mix.mean(axis=1, keepdims=True)
    for _ in range(3):
        L = A.lufs(mix)
        mix *= 10 ** ((target - L) / 20)
        pk = np.max(np.abs(mix))
        if pk > ceiling:
            mix = ceiling * np.tanh(mix / ceiling)
    return mix


def layer_at(name: str, time: float, ramp: float = 8.0) -> float:
    """scalar version of layer_curve (cheap per-note lookups)"""
    vals = LAYERS[name]
    v = vals[0]
    for i in range(1, len(vals)):
        k = min(1.0, max(0.0, (time - (i * SECTION - ramp / 2)) / ramp))
        v += (vals[i] - vals[i - 1]) * (0.5 - 0.5 * np.cos(np.pi * k))
    return float(v)


def make_bed() -> np.ndarray:
    """memory-conscious: layers are rendered one at a time and summed in place into `mix` / `send`"""
    N = int(BED_LEN * SR)
    nbars = int(np.ceil(BED_LEN / BAR))
    T = N + int(4 * SR)
    t = np.arange(T) / SR

    def cur(name: str) -> np.ndarray:
        return pad_to(layer_curve(LAYERS[name], N), T)

    def prog_for(time):
        return SECTION_PROG[min(int(time // SECTION), len(SECTION_PROG) - 1)]

    mix = np.zeros((2, T))
    send = np.zeros((2, T))

    # ---- pad (chords, slow attack/release, overlapping) + sustained sub root
    pad = np.zeros((2, T))
    sub = np.zeros(T)
    for b in range(0, nbars, CHORD_BARS):
        start = b * BAR
        voicing, root, _ = chord_at(prog_for(start), b)
        L = CHORD_BARS * BAR + 2.0
        te = tt(L)
        e = np.clip(te / 1.4, 0, 1)
        e = (0.5 - 0.5 * np.cos(np.pi * e)) * np.cos(np.pi / 2 * np.clip((te - CHORD_BARS * BAR) / 2.0, 0, 1)) ** 2
        for j, m in enumerate(voicing):
            v = saw_voice(mtof(m), L) * e * (0.9 if j else 1.0)
            place(pad, pan(v, (j / (len(voicing) - 1) - 0.5) * 0.9), start)
        sv = np.sin(2 * np.pi * mtof(root + 12 if root < 33 else root) * te) * e
        place(sub[None, :], sv[None, :], start)
    bright = cur("bright")
    g_pad = cur("pad") * (1 + 0.1 * np.sin(2 * np.pi * t / 17.0)) * 0.75
    for c in range(2):
        dark = filtz(filtz(pad[c], "lowpass", 650, 2), "highpass", 110, 2)
        br = filtz(filtz(pad[c], "lowpass", 1500, 2), "highpass", 140, 2)
        pm = (dark * (1 - 0.6 * bright) + br * 0.8 * bright) * g_pad
        mix[c] += pm
        send[c] += 0.5 * pm
    del pad, bright, g_pad, dark, br, pm

    # ---- kick + sidechain envelope
    kick = np.zeros(T)
    sc = np.ones(T)
    kunit = soft_kick()
    for b in range(nbars):
        for beat in (0, 2):
            at = b * BAR + beat * BEAT
            i = int(at * SR)
            g = layer_at("kick", at)
            if g > 0.01:
                place(kick[None, :], (kunit * g)[None, :], at)
                d = int(0.35 * SR)
                k = np.linspace(0, 1, d)
                sc[i:i + d] = np.minimum(sc[i:i + d], 1 - 0.45 * g * np.cos(np.pi / 2 * k) ** 2)
    mix += kick * 0.38
    send += kick * 0.05 / np.sqrt(2)
    del kick
    # ---- sub (sustained root, sidechained)
    sub = filt(sub, "lowpass", 140, 2) * cur("sub") * sc * 0.26
    mix += sub
    del sub

    # ---- pulse bass: 8th notes on the root
    pulse = np.zeros(T)
    for b in range(nbars):
        _, root, _ = chord_at(prog_for(b * BAR), b)
        f = mtof(root + 12)
        for s8 in range(8):
            at = b * BAR + s8 * BEAT / 2
            g = layer_at("pulse", at)
            if g < 0.01:
                continue
            d = 0.3
            te = tt(d)
            v = saw_voice(f, d, (1.0, 1.005)) * env_ad(te, 0.003, 0.09) * (1.0 if s8 % 2 == 0 else 0.7)
            place(pulse[None, :], (v * g)[None, :], at)
    mix += filt(filt(pulse, "lowpass", 420, 2), "highpass", 60, 1) * sc * 0.4
    del pulse, sc

    # ---- arpeggios (mono, then ping-pong delay)
    arp = np.zeros(T)
    pat8 = [0, 2, 1, 3, 0, 4, 2, 1]
    pat16 = [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 4, 2, 1, 3, 0, 2]
    for b in range(nbars):
        _, _, tones = chord_at(prog_for(b * BAR), b)
        for s16 in range(16):
            at = b * BAR + s16 * BEAT / 4
            if at * SR >= T:
                break
            g8, g16 = layer_at("arp8", at), layer_at("arp16", at)
            if s16 % 2 == 0 and g8 > 0.01:
                m = tones[pat8[(s16 // 2) % 8]]
                place(arp[None, :], pluck(mtof(m), 0.5 * g8 * (1.0 if s16 % 8 == 0 else 0.75), 0.28)[None, :], at)
            if g16 > 0.01:
                m = tones[pat16[s16]] + (12 if (b % 8 >= 6 and s16 % 4 == 2) else 0)
                acc = 1.0 if s16 % 4 == 0 else 0.6
                place(arp[None, :], pluck(mtof(m), 0.38 * g16 * acc, 0.14)[None, :], at)
    arp = filt(filt(arp, "lowpass", 2400, 2), "highpass", 180, 2)
    arp_st = pan(arp, 0.0) + ping_pong(arp, 0.75 * BEAT, 0.38, 5, 1800) * 0.7
    del arp
    mix += arp_st * 0.85
    send += arp_st * 0.8
    del arp_st

    # ---- hats / shaker & clap
    perc = np.zeros((2, T))
    for b in range(nbars):
        for s16 in range(16):
            at = b * BAR + s16 * BEAT / 4
            if at * SR >= T:
                break
            gh = layer_at("hat", at)
            if gh > 0.01:
                vel = (0.5 if s16 % 4 == 2 else 0.18) * gh * rng.uniform(0.8, 1.1)
                place(perc, pan(hat(vel), 0.3 if s16 % 2 else -0.15), at)
        at = b * BAR + 2 * BEAT
        gc = layer_at("clap", at)
        if gc > 0.01:
            place(perc, pan(clap() * gc * 0.35, 0.0), at)
    perc = filt(perc, "lowpass", 11000, 2)
    mix += perc * 0.5
    send += perc * 0.6
    del perc

    # ---- atmosphere: dark wind + very high air
    ga = cur("atmos")
    wind = filtz(pink(T), "bandpass", [120, 500], 2) * (0.7 + 0.3 * np.sin(2 * np.pi * t / 23.0))
    mix[0] += wind * 0.05 * ga
    mix[1] += np.roll(wind, 4801) * 0.05 * ga
    del wind
    air = filtz(pink(T), "bandpass", [6000, 11000], 2)
    mix[0] += air * 0.012 * ga
    mix[1] += np.roll(air, 977) * 0.012 * ga
    del air, ga, t

    # ---- space
    ir = A.make_ir(2.8, pre=0.03, lp=4000, hp=250)
    for c in range(2):
        mix[c] += 0.3 * signal.oaconvolve(send[c], ir[c])[:T]
    del send
    mix = mix[:, :N]
    mix = master(mix, -16.0)
    mix = fade(mix, 2.0, 0.0)
    fo = int(4.0 * SR)
    mix[:, N - fo:] *= np.cos(np.linspace(0, np.pi / 2, fo)) ** 2
    return mix


def make_tense() -> np.ndarray:
    """90 s seamless loop: low drone + heartbeat pulse + dissonant high cluster + distant booms"""
    N = int(TENSE_LEN * SR)
    T = N + int(6 * SR)
    t = np.arange(T) / SR
    loop_hz = lambda cycles: cycles / TENSE_LEN  # noqa: E731  (integer cycles per loop => seamless LFOs)
    qf = lambda m: round(mtof(m) * TENSE_LEN) / TENSE_LEN  # noqa: E731  (pitch snapped to whole cycles per loop)

    # drone: D1/D2 + A1 saws through a slowly moving lowpass (crossfade of two filtered copies)
    # continuous layers are built exactly N long and periodic (filtered over 3 tiled copies), never wrapped
    tn = t[:N]
    per = lambda x, kind, f: filtz(np.tile(x, 3), kind, f, 2)[N: 2 * N]  # noqa: E731
    dr = sum(np.sin(2 * np.pi * qf(m) * tn) * g for m, g in [(26, 0.0), (38, 0.6), (45, 0.25)])
    sawd = sum(2 * ((qf(m) * d * tn + p) % 1.0) - 1 for m in (38, 45) for d, p in [(1.0, 0.1), (1 + 1 / (qf(m) * TENSE_LEN), 0.6)]) / 4
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * loop_hz(5) * tn)
    drone = dr * 0.5 + per(sawd, "lowpass", 140) * (1 - lfo) + per(sawd, "lowpass", 380) * lfo * 0.8

    # upper cluster: Dm -> Bb/D -> Eb/D (phrygian tension), 4 bars each, 3x per loop
    chords = [[62, 65, 69], [62, 65, 70], [63, 67, 70]]
    cl = np.zeros((2, T))
    for i in range(int(TENSE_LEN / (4 * BAR))):
        start = i * 4 * BAR
        L = 4 * BAR + 3.0
        te = tt(L)
        e = (0.5 - 0.5 * np.cos(np.pi * np.clip(te / 3.0, 0, 1))) * np.cos(np.pi / 2 * np.clip((te - 4 * BAR) / 3.0, 0, 1)) ** 2
        for j, m in enumerate(chords[i % 3]):
            vib = 1 + 0.003 * np.sin(2 * np.pi * (4.5 + j * 0.3) * te)
            v = freq_osc(mtof(m) * vib) + 0.25 * freq_osc(mtof(m) * 2 * vib, phase=0.3)
            place(cl, pan(v * e, (j - 1) * 0.6), start)
    swell = 0.55 + 0.45 * np.sin(2 * np.pi * loop_hz(4) * t - np.pi / 2)
    cl = filtz(cl, "lowpass", 1600, 2) * swell * 0.13

    # heartbeat pulse every 2 beats (48 bpm)
    hb = np.zeros(T)
    unit = heart_beat()
    nb = int(TENSE_LEN / (2 * BEAT))
    for i in range(nb):
        place(hb[None, :], (unit * (1.0 if i % 2 == 0 else 0.85))[None, :], i * 2 * BEAT)
    hb = filt(sat(hb * 1.3, 1.4), "lowpass", 260, 2) * 0.5

    # quiet high clock tick on every beat (above the voice band)
    tick = np.zeros(T)
    for i in range(int(TENSE_LEN / BEAT)):
        place(tick[None, :], hat(0.25 if i % 4 == 0 else 0.15)[None, :], i * BEAT + 0.005)

    # distant boom every 8 bars
    boom = np.zeros((2, T))
    bu = sat(sub_boom(3.0, 70, 32, 0.2, 0.9) * 1.2, 1.4) + crack(3.0, 200, 1200, 0.15) * 0.2
    for i in range(int(TENSE_LEN / (8 * BAR)) + 1):
        at = i * 8 * BAR
        if at < TENSE_LEN:
            place(boom, stereo(bu), at, 0.25)
    boom = rev(boom, IR_BIG, 0.6, T)

    wind = filtz(np.tile(pink(N), 3), "bandpass", [80, 300], 2)[N: 2 * N] * 0.05  # periodic noise

    ir = A.make_ir(3.2, pre=0.035, lp=3500, hp=200)
    send = cl + pan(tick, 0.2) * 0.5
    room = np.stack([signal.oaconvolve(send[c], ir[c])[:T] for c in range(2)])
    ev = stereo(hb) + cl + pan(tick, 0.2) * 0.35 + boom + 0.5 * room
    # wrap the event tails into the start => seamless loop
    out = ev[:, :N].copy()
    out[:, : T - N] += ev[:, N:]
    out += stereo(drone * 0.22 + wind)
    # master two loop cycles (so IIR filters are in steady state) and keep the second
    return master(np.tile(out, (1, 2)), -17.0)[:, N:]


# ----------------------------------------------------------------------------- QA
def ffmpeg_lufs(path: str) -> tuple[float, float]:
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="replace")
    s = r.stderr
    I = re.findall(r"I:\s+(-?[\d.]+|-inf) LUFS", s)
    P = re.findall(r"Peak:\s+(-?[\d.]+|-inf) dBFS", s)
    f = lambda v: float("-inf") if v == "-inf" else float(v)  # noqa: E731
    return (f(I[-1]) if I else float("nan"), f(P[-1]) if P else float("nan"))


def click_score(x: np.ndarray) -> float:
    """max |2nd difference| of the >12 kHz band relative to its median local level, in dB (high = isolated click)"""
    m = x.mean(axis=0)
    h = filtz(m, "highpass", 12000, 4)
    d = np.abs(np.diff(h, 2))
    if d.size < 2000:
        return 0.0
    w = 480
    k = d[: d.size // w * w].reshape(-1, w).max(axis=1)
    return float(db(k.max()) - db(np.median(k) + 1e-9))


def qa(rows: list[tuple[str, str]]) -> None:
    print(f"{'file':<15}{'dur s':>8}{'peak':>7}{'rms':>7}{'LUFS':>7}{'ffLUFS':>8}{'TP':>7}{'DC':>9}{'>10k%':>7}{'cent':>6}{'edge':>8}{'clk':>6}")
    for name, p in rows:
        q = A.qa_file(p)
        I, TP = ffmpeg_lufs(p)
        print(f"{name:<15}{q['dur']:>8.3f}{q['peak']:>7.2f}{q['rms']:>7.1f}{q['lufs']:>7.1f}{I:>8.1f}{TP:>7.1f}"
              f"{q['dc']:>9.1e}{q['hf']:>7.2f}{q['cent']:>6.0f}{q['edge']:>8.4f}{click_score(q['x']):>6.1f}")
        if name.startswith("bed"):
            x = q["x"]
            seg = 30.0 if name == "bed" else 15.0
            parts = [f"{int(s)}s {db(np.sqrt(np.mean(x[:, int(s * SR): int((s + seg) * SR)] ** 2))):.1f}"
                     for s in np.arange(0, q["dur"] - 1, seg)]
            print(f"  {name} RMS/{int(seg)}s:", " | ".join(parts))
            m = x.mean(axis=0)
            P = np.abs(np.fft.rfft(m)) ** 2
            f = np.fft.rfftfreq(m.size, 1 / SR)
            tot = P.sum()
            bands = [(0, 40), (40, 120), (120, 400), (400, 1000), (1000, 4000), (4000, 10000), (10000, 24000)]
            print("  spectrum share:", ", ".join(f"{a}-{b} {100 * P[(f >= a) & (f < b)].sum() / tot:.1f}%" for a, b in bands))
            if name == "bed_tense":
                j = np.abs(x[:, -1] - x[:, 0]).max()
                print(f"  loop seam jump: {j:.4f}")


def main() -> None:
    only = sys.argv[1:]
    rows = []
    for name, fn in SFX.items():
        if only and name not in only:
            continue
        p = os.path.join(SFX_DIR, f"{name}.wav")
        A.write(p, fn())
        rows.append((name, p))
    beds = [(n, f) for n, f in [("bed", make_bed), ("bed_tense", make_tense)]
            if not only or "music" in only or n in only]
    if beds:
        for name, fn in beds:
            p = os.path.join(MUSIC_DIR, f"{name}.wav")
            A.write(p, fn())
            rows.append((name, p))
    qa(rows)


if __name__ == "__main__":
    main()
