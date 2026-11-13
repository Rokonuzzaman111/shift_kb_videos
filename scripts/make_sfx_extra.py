"""Extra caffeine-reel SFX so every moment has its own sound (no repeats across the reel).

Usage: python -I -X utf8 scripts/make_sfx_extra.py
Reuses the synthesis helpers from scripts/make_audio_caffeine.py. Writes public/sfx/caffeine/<name>.wav.
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_audio_caffeine as A  # noqa: E402

SR = A.SR
tt, env_ad, place, pan, reverb, finish_sfx, filt = A.tt, A.env_ad, A.place, A.pan, A.reverb, A.finish_sfx, A.filt
rng = np.random.default_rng(777)


def buf(dur):
    return np.zeros((2, int(dur * SR)))


def sine_sweep(dur, f0, f1, curve=1.0):
    t = tt(dur)
    k = (t / dur) ** curve
    f = f0 * (f1 / f0) ** k
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def nz(n):
    return rng.standard_normal(n)


def sfx_dive():
    """Soft underwater-like push into the brain: filtered noise swell + low bubble swirl."""
    dur = 1.0
    out = buf(dur)
    t = tt(dur)
    n = nz(len(t))
    swell = np.sin(np.pi * np.clip(t / 0.8, 0, 1)) ** 2
    lo = filt(n, "lowpass", 900, 2) * swell
    body = sine_sweep(dur, 220, 70, 0.7) * 0.35 * swell
    y = lo * 0.6 + body
    place(out, pan(y, np.linspace(0.3, -0.3, len(y))), 0, 1)
    out = reverb(out, A.IR_ROOM, 0.35)[:, : out.shape[1]]
    return finish_sfx(out, lp=5000, fout=0.2)


def sfx_zoom_in():
    """Short focus-pull 'whirr' for pushing in on a molecule."""
    dur = 0.55
    out = buf(dur)
    t = tt(dur)
    y = sine_sweep(dur, 400, 1400, 1.6) * env_ad(t, 0.12, 0.25) * 0.3
    y += filt(nz(len(t)), "bandpass", [1500, 4000], 2) * env_ad(t, 0.2, 0.15) * 0.25
    place(out, pan(y, 0.0), 0, 1)
    out = reverb(out, A.IR_SMALL, 0.2)[:, : out.shape[1]]
    return finish_sfx(out, fout=0.08)


def sfx_dock_amber():
    """Warm, rounded seating thunk with a gentle amber hum (adenosine docks)."""
    dur = 1.1
    out = buf(dur)
    t = tt(dur)
    thunk = np.sin(2 * np.pi * 160 * t) * env_ad(t, 0.002, 0.07) * 0.8
    knock = filt(nz(len(t)), "lowpass", 1200, 2) * env_ad(t, 0.001, 0.02) * 0.5
    hum = (np.sin(2 * np.pi * 330 * t) + 0.5 * np.sin(2 * np.pi * 495 * t)) * env_ad(t, 0.05, 0.4) * 0.18
    place(out, pan(thunk + knock + hum, -0.1), 0, 1)
    out = reverb(out, A.IR_ROOM, 0.3)[:, : out.shape[1]]
    return finish_sfx(out, lp=7000, fout=0.3)


def sfx_bubble_rise():
    """Tiny fizzy bubbles rising out of the tea (caffeine leaving the cup)."""
    dur = 1.4
    out = buf(dur)
    at = 0.0
    while at < 1.1:
        d = 0.05 + 0.04 * rng.random()
        f0 = 900 + 900 * rng.random() + at * 500
        y = sine_sweep(d, f0, f0 * 1.8, 1.0) * env_ad(tt(d), 0.004, 0.02)
        place(out, pan(y, rng.uniform(-0.6, 0.6)), at, 0.25 + 0.2 * rng.random())
        at += 0.03 + 0.07 * rng.random()
    out = reverb(out, A.IR_SMALL, 0.25)[:, : out.shape[1]]
    return finish_sfx(out, lp=8000, fout=0.2)


def sfx_bounce_deny():
    """Rubbery 'bonk' when adenosine bounces off a blocked receptor."""
    dur = 0.6
    out = buf(dur)
    t = tt(dur)
    y = sine_sweep(dur, 520, 210, 0.5) * env_ad(t, 0.002, 0.12) * 0.7
    y += np.sin(2 * np.pi * 95 * t) * env_ad(t, 0.002, 0.05) * 0.4
    place(out, pan(y, 0.15), 0, 1)
    out = reverb(out, A.IR_SMALL, 0.2)[:, : out.shape[1]]
    return finish_sfx(out, fout=0.15)


def sfx_power_down():
    """Battery that fails: descending electric tone that sputters out."""
    dur = 1.1
    out = buf(dur)
    t = tt(dur)
    tone = sine_sweep(dur, 640, 90, 0.8)
    tone += 0.3 * np.sign(tone) * np.abs(tone) ** 0.5
    stut = 0.6 + 0.4 * (np.sin(2 * np.pi * (14 + 10 * t) * t) > -0.2)
    y = filt(tone, "lowpass", 2500, 2) * stut * env_ad(t, 0.005, 0.5) * 0.45
    place(out, pan(y, 0.0), 0, 1)
    out = reverb(out, A.IR_ROOM, 0.2)[:, : out.shape[1]]
    return finish_sfx(out, lp=6000, fout=0.25)


def sfx_timer_wind():
    """Kitchen-timer twist: a quick ratchet of small clicks."""
    dur = 0.7
    out = buf(dur)
    for k in range(9):
        at = 0.02 + k * 0.045
        u = A.tick_unit(f_body=3200, f_res=1800 + k * 40, low=600, dur=0.05, bright=0.8)
        place(out, pan(u, -0.2 + k * 0.05), at, 0.35)
    out = reverb(out, A.IR_SMALL, 0.15)[:, : out.shape[1]]
    return finish_sfx(out, fout=0.1)


def sfx_liquid_drop():
    """Soft draining 'gloop' as the caffeine level falls."""
    dur = 0.9
    out = buf(dur)
    for k, at in enumerate([0.0, 0.18, 0.4]):
        d = 0.16
        y = sine_sweep(d, 300 + k * 60, 900 + k * 80, 2.0) * env_ad(tt(d), 0.005, 0.06)
        place(out, pan(y, -0.1 + k * 0.1), at, 0.5 - k * 0.1)
    out = reverb(out, A.IR_SMALL, 0.3)[:, : out.shape[1]]
    return finish_sfx(out, lp=6000, fout=0.2)


def sfx_release_pluck():
    """Caffeine molecules lifting off: a short run of soft plucks going up."""
    dur = 1.2
    out = buf(dur)
    for k in range(6):
        f = 600 * 2 ** (k * 3 / 12)
        d = 0.25
        t = tt(d)
        y = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * env_ad(t, 0.002, 0.07)
        place(out, pan(y, -0.4 + k * 0.16), k * 0.12, 0.3)
    out = reverb(out, A.IR_ROOM, 0.25)[:, : out.shape[1]]
    return finish_sfx(out, lp=9000, fout=0.2)


def sfx_chime_store():
    """Calm shimmering cluster: memories settling in during sleep."""
    dur = 2.2
    out = buf(dur)
    notes = [880.0, 1108.7, 1318.5, 1760.0]
    for k, f in enumerate(notes):
        d = 1.6
        t = tt(d)
        y = np.sin(2 * np.pi * f * t + 0.6 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.2)) * env_ad(t, 0.01, 0.7)
        place(out, pan(y, -0.5 + k * 0.33), k * 0.09, 0.22)
    out = reverb(out, A.IR_HALL, 0.45)[:, : out.shape[1]]
    return finish_sfx(out, lp=9000, fout=0.5)


def sfx_rewind():
    """Tape rewind squiggle for the 'what if you stay awake' flip."""
    dur = 0.6
    out = buf(dur)
    t = tt(dur)
    f = 900 + 700 * np.sin(2 * np.pi * 9 * t) * (t / dur) + 1200 * (t / dur)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(t, 0.03, 0.25) * 0.25
    y += filt(nz(len(t)), "bandpass", [2000, 5000], 2) * env_ad(t, 0.05, 0.2) * 0.15
    place(out, pan(y, np.linspace(0.5, -0.5, len(y))), 0, 1)
    return finish_sfx(out, fout=0.08)


def sfx_heartbeat_ache():
    """Two dull throbs for the headache."""
    dur = 1.4
    out = buf(dur)
    for at, g in [(0.0, 0.9), (0.28, 0.6), (0.8, 0.8), (1.08, 0.5)]:
        d = 0.3
        t = tt(d)
        y = np.sin(2 * np.pi * 55 * t) * env_ad(t, 0.006, 0.08)
        y = A.sat(y, 2.0)
        place(out, pan(y, 0.0), at, g * 0.8)
    out = reverb(out, A.IR_SMALL, 0.15)[:, : out.shape[1]]
    return finish_sfx(out, lp=2500, fout=0.2)


def bell_tone(f1, f2):
    dur = 1.6
    out = buf(dur)
    for f, at, g, p in [(f1, 0.0, 0.7, -0.1), (f2, 0.07, 0.5, 0.15)]:
        t = tt(dur - at)
        idx = 1.0 * np.exp(-t / 0.05) + 0.1
        y = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t)) * env_ad(t, 0.003, 0.5)
        y += 0.2 * np.sin(2 * np.pi * f * 2 * t) * env_ad(t, 0.002, 0.2)
        place(out, pan(y, p), at, g)
    out = reverb(out, A.IR_HALL, 0.26)[:, : out.shape[1]]
    return finish_sfx(out, lp=9000, fout=0.3)


def sfx_ding_2():
    return bell_tone(1174.7, 1760.0)  # D6 + A6


def sfx_ding_3():
    return bell_tone(1318.5, 1975.5)  # E6 + B6


def sfx_clock_wind():
    """Mechanical winding as the clock hands run backwards: ratchet that slows to a stop."""
    dur = 1.0
    out = buf(dur)
    at = 0.0
    gap = 0.03
    while at < 0.8:
        u = A.tick_unit(f_body=2400, f_res=900, low=350, dur=0.06, bright=0.6)
        place(out, pan(u, 0.1), at, 0.3)
        at += gap
        gap *= 1.12
    out = reverb(out, A.IR_SMALL, 0.2)[:, : out.shape[1]]
    return finish_sfx(out, fout=0.15)


def sfx_drowsy():
    """Getting sleepy: a warm hum that slowly pitches down and muffles, like hearing fade."""
    dur = 2.0
    out = buf(dur)
    t = tt(dur)
    f = 220 * (0.55 ** (t / dur))
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR)
    y = filt(y, "lowpass", 900, 2) * env_ad(t, 0.4, 0.9) * 0.35
    air = filt(nz(len(t)), "lowpass", 600, 2) * env_ad(t, 0.6, 0.8) * 0.12
    place(out, pan(y + air, 0.0), 0, 1)
    out = reverb(out, A.IR_HALL, 0.35)[:, : out.shape[1]]
    return finish_sfx(out, lp=3000, fout=0.6)


EXTRA = {
    "dive": sfx_dive,
    "zoom_in": sfx_zoom_in,
    "dock_amber": sfx_dock_amber,
    "bubble_rise": sfx_bubble_rise,
    "bounce_deny": sfx_bounce_deny,
    "power_down": sfx_power_down,
    "timer_wind": sfx_timer_wind,
    "liquid_drop": sfx_liquid_drop,
    "release_pluck": sfx_release_pluck,
    "chime_store": sfx_chime_store,
    "rewind": sfx_rewind,
    "heartbeat_ache": sfx_heartbeat_ache,
    "ding_2": sfx_ding_2,
    "ding_3": sfx_ding_3,
    "clock_wind": sfx_clock_wind,
    "drowsy": sfx_drowsy,
}

if __name__ == "__main__":
    for name, fn in EXTRA.items():
        x = fn()
        path = os.path.join(A.SFX_DIR, f"{name}.wav")
        A.write(path, x)
        q = A.qa_file(path)
        print(f"{name:15s} {q}")
