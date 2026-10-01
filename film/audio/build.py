#!/usr/bin/env python3
"""
MARTIN.G brand film: the soundtrack, synthesized from the film's own clock.

Everything here is original and generated (no samples, no stock music, no voices). The
picture's cue table (audio/cues-<version>.json, exported from src/config/timeline.ts) places
every sound, so picture and sound move together when the timing changes.

Output, per version, in film/public/audio/<version>/:
    music.wav        drums, bass, pads, plucks (the score)
    ambience.wav     drone, air, room
    impacts.wav      the signature hits and the final note
    transitions.wav  whooshes, sweeps, pass-bys, risers
    ui.wav           ticks, snaps, taps, confirmations, signals
    mix.wav          the master: stems summed, glued, limited to a -1 dBFS true-peak ceiling

    python3 audio/build.py [desktop|mobile ...]

Requires numpy and scipy. Deterministic: the same cues always give the same sound.
"""
import json
import sys
from pathlib import Path

import numpy as np
from scipy import signal

SR = 48000
ROOT = Path(__file__).resolve().parent.parent
RNG = np.random.default_rng(20261001)


# ---------------------------------------------------------------------------------------
# Primitives
# ---------------------------------------------------------------------------------------

def secs(n):
    return int(round(n * SR))


def t_axis(dur):
    return np.arange(secs(dur)) / SR


def noise(dur, seed=None):
    r = np.random.default_rng(seed) if seed is not None else RNG
    return r.standard_normal(secs(dur))


def env_exp(dur, decay, attack=0.002):
    t = t_axis(dur)
    a = np.minimum(1.0, t / max(attack, 1e-4))
    return a * np.exp(-t / max(decay, 1e-4))


def env_adsr(dur, a, d, s, r):
    t = t_axis(dur)
    e = np.ones_like(t) * s
    e[t < a] = t[t < a] / max(a, 1e-4)
    m = (t >= a) & (t < a + d)
    e[m] = 1 - (1 - s) * (t[m] - a) / max(d, 1e-4)
    rel = t > dur - r
    e[rel] *= np.clip((dur - t[rel]) / max(r, 1e-4), 0, 1)
    return e


def sine_sweep(dur, f0, f1, curve=4.0):
    """A sine whose frequency glides exponentially from f0 to f1."""
    t = t_axis(dur)
    k = np.exp(-t * curve)
    freq = f1 + (f0 - f1) * k
    phase = 2 * np.pi * np.cumsum(freq) / SR
    return np.sin(phase)


def saw(freq, dur, detune=0.0, seed=0):
    t = t_axis(dur)
    ph = (freq * (1 + detune) * t + np.random.default_rng(seed).random()) % 1.0
    return 2 * ph - 1


def lp(x, fc, order=2):
    fc = min(fc, SR * 0.45)
    return signal.sosfilt(signal.butter(order, fc, 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return signal.sosfilt(signal.butter(order, fc, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, min(hi, SR * 0.45)], 'band', fs=SR, output='sos'), x)


def sweep_filter(x, f0, f1, kind='low', steps=48):
    """A filter whose cutoff glides (in blocks, crossfaded) from f0 to f1."""
    out = np.zeros_like(x)
    n = len(x)
    edges = np.linspace(0, n, steps + 1).astype(int)
    for i in range(steps):
        a, b = edges[i], edges[i + 1]
        fc = f0 * (f1 / f0) ** (i / max(1, steps - 1))
        lo_ = max(0, a - 512)
        seg = x[lo_:b]
        y = lp(seg, fc) if kind == 'low' else (hp(seg, fc) if kind == 'high' else bp(seg, fc * 0.7, fc * 1.4))
        out[a:b] = y[a - lo_:]
    return out


def soft(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)


def pan_st(x, pan=0.0):
    """Equal-power pan of a mono buffer to stereo."""
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)])


def moving_pan(x, p0, p1):
    p = np.linspace(p0, p1, len(x))
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)])


def db(g):
    return 10 ** (g / 20)


def reverb_ir(dur, damp_hz=5000, seed=1, predelay=0.012):
    """A stereo room: decorrelated noise, exponentially decaying, darker as it decays."""
    n = secs(dur)
    t = np.arange(n) / SR
    decay = np.exp(-6.9 * t / dur)  # -60 dB at dur
    ir = []
    for ch in range(2):
        r = np.random.default_rng(seed + ch).standard_normal(n) * decay
        early = lp(r, damp_hz)
        late = lp(r, damp_hz * 0.35)
        mixw = np.clip(t / dur, 0, 1)
        ir.append(early * (1 - mixw) + late * mixw)
    ir = np.stack(ir)
    pre = np.zeros((2, secs(predelay)))
    ir = np.concatenate([pre, ir], axis=1)
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def convolve_st(x, ir):
    return np.stack([signal.fftconvolve(x[c], ir[c])[: x.shape[1]] for c in range(2)])


class Bus:
    """A stereo track the length of the film."""

    def __init__(self, dur):
        self.x = np.zeros((2, secs(dur) + SR * 4))

    def add(self, at, buf, gain=1.0):
        if buf.ndim == 1:
            buf = pan_st(buf)
        i = secs(at)
        if i < 0:
            buf = buf[:, -i:]
            i = 0
        j = min(self.x.shape[1], i + buf.shape[1])
        if j > i:
            self.x[:, i:j] += buf[:, : j - i] * gain


# ---------------------------------------------------------------------------------------
# Instruments
# ---------------------------------------------------------------------------------------

NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def hz(name):
    """'D2' -> 73.42 Hz."""
    pc = name[:-1]
    octv = int(name[-1])
    midi = 12 * (octv + 1) + NOTE[pc]
    return 440.0 * 2 ** ((midi - 69) / 12)


def kick(soft_=False):
    dur = 0.55
    body = sine_sweep(dur, 160 if not soft_ else 120, 46, curve=38) * env_exp(dur, 0.32 if not soft_ else 0.42, 0.001)
    click = hp(noise(0.012, 3), 2500) * env_exp(0.012, 0.003) * (0.35 if not soft_ else 0.12)
    out = soft(body * 1.4, 1.6)
    out[: len(click)] += click
    return out


def clap():
    dur = 0.35
    n = bp(noise(dur, 5), 1100, 5200)
    e = np.zeros(secs(dur))
    for k, d in enumerate([0.0, 0.011, 0.022]):
        i = secs(d)
        seg = env_exp(dur - d, 0.010 if k < 2 else 0.11)
        e[i:] += seg[: len(e) - i]
    body = np.sin(2 * np.pi * 190 * t_axis(dur)) * env_exp(dur, 0.03)
    metal = bp(np.sign(np.sin(2 * np.pi * 541 * t_axis(dur))) + np.sign(np.sin(2 * np.pi * 813 * t_axis(dur))), 2000, 7000) * env_exp(dur, 0.04) * 0.25
    return n * e * 0.7 + body * 0.35 + metal


def hat(open_=False, seed=7):
    dur = 0.25 if open_ else 0.06
    x = hp(noise(dur, seed), 7500, 4)
    return x * env_exp(dur, 0.09 if open_ else 0.014, 0.0005)


def tick_click(freq=3200, dur=0.03):
    t = t_axis(dur)
    return (np.sin(2 * np.pi * freq * t) * env_exp(dur, 0.006, 0.0003) + hp(noise(dur, 9), 4000) * env_exp(dur, 0.002) * 0.3)


def bass_note(freq, dur, cutoff, drive=1.6):
    x = saw(freq, dur, 0.0, 1) + saw(freq, dur, 0.004, 2) * 0.6
    x = lp(x, cutoff, 4) * env_adsr(dur, 0.004, 0.12, 0.55, 0.05)
    sub = np.sin(2 * np.pi * freq / 2 * t_axis(dur)) * env_adsr(dur, 0.004, 0.2, 0.7, 0.05)
    return soft(x * 0.6 + sub * 0.7, drive)


def pad_chord(freqs, dur, cutoff=1400, bright=0.0):
    st = np.zeros((2, secs(dur)))
    for i, fq in enumerate(freqs):
        for v, det in enumerate([-0.006, 0.0, 0.0065]):
            x = saw(fq, dur, det, seed=i * 3 + v)
            p = (-0.7 + 1.4 * ((i + v * 0.5) % len(freqs)) / max(1, len(freqs) - 1)) * 0.8
            st += pan_st(x, p) * 0.18
    for c in range(2):
        st[c] = lp(st[c], cutoff + bright * 1800, 2)
    e = env_adsr(dur, min(0.6, dur * 0.3), 0.3, 0.85, min(0.8, dur * 0.3))
    return st * e / len(freqs)


def pluck(freq, dur=0.45):
    t = t_axis(dur)
    x = np.zeros_like(t)
    for h, a in [(1, 1.0), (2, 0.45), (3, 0.22), (4, 0.12), (6, 0.05)]:
        x += a * np.sin(2 * np.pi * freq * h * t) * np.exp(-t * (6 + h * 4))
    return x * np.minimum(1, t / 0.002)


def bell(freq, dur, decay):
    """FM bell: the tonal part of the signature."""
    t = t_axis(dur)
    mod = np.sin(2 * np.pi * freq * 1.414 * t) * 2.2 * np.exp(-t / (decay * 0.35))
    return np.sin(2 * np.pi * freq * t + mod) * env_exp(dur, decay, 0.001)


# ---------------------------------------------------------------------------------------
# Sound effects (one function per kind in src/config/timeline.ts)
# ---------------------------------------------------------------------------------------

def fx_pulse(e):
    dur = 1.2
    x = np.zeros(secs(dur))
    sub = sine_sweep(dur, 95, 38, 14) * env_exp(dur, 0.45, 0.001) * 0.9
    ping = np.sin(2 * np.pi * 3520 * t_axis(dur)) * env_exp(dur, 0.035, 0.0003) * 0.35
    click = hp(noise(0.004, 11), 3000) * 0.8
    x += soft(sub, 1.2) + ping
    x[: len(click)] += click
    return pan_st(x), 'impacts'


def fx_passby(e):
    dur = 0.7
    n = noise(dur, int(e['at'] * 100))
    x = sweep_filter(n, 300, 2600, 'band', 24)
    x = x * np.sin(np.pi * np.clip(t_axis(dur) / dur, 0, 1)) ** 2
    x = x[::-1] if int(e['at'] * 10) % 2 else x
    p = e.get('pan', 0)
    return moving_pan(x * 0.9, p, -p * 0.6), 'transitions'


def fx_tick(e):
    f = 2600 * 2 ** (e.get('pitch', 0) / 12)
    return pan_st(tick_click(f), e.get('pan', 0)), 'ui'


def fx_snap(e):
    dur = 0.12
    f = 170 * 2 ** (e.get('pitch', 0) / 12)
    body = np.sin(2 * np.pi * f * t_axis(dur)) * env_exp(dur, 0.025, 0.0005)
    crack = hp(noise(dur, 13), 2500) * env_exp(dur, 0.004, 0.0002)
    return pan_st(body * 0.8 + crack * 0.7, e.get('pan', 0)), 'ui'


def fx_lock(e):
    dur = 0.6
    p = e.get('pitch', 0)
    body = sine_sweep(dur, 110, 52, 30) * env_exp(dur, 0.16, 0.001)
    crack = hp(noise(dur, 17), 3000) * env_exp(dur, 0.005, 0.0002)
    t = t_axis(dur)
    ring = sum(np.sin(2 * np.pi * fr * 2 ** (p / 12) * t) * a for fr, a in [(587, 0.5), (1319, 0.3), (2093, 0.18)]) * env_exp(dur, 0.12)
    return pan_st(soft(body * 1.2, 1.3) + crack * 0.6 + ring * 0.25, e.get('pan', 0)), 'impacts'


def fx_riser(e):
    dur = e.get('dur', 0.8)
    n = noise(dur, int(e['at'] * 77))
    x = sweep_filter(n, 400, 9000, 'band', 32)
    t = t_axis(dur)
    x *= (t / dur) ** 2.6
    # reversed air: the swell stops dead on the hit
    st = np.stack([x, np.roll(x, 37)])
    return st * 0.9, 'transitions'


def signature(scale=1.0, deep=False):
    dur = 4.0
    t = t_axis(dur)
    f0, f1 = (70, 36.7) if deep else (92, 45)
    sub = sine_sweep(dur, f0, f1, 9) * env_exp(dur, 0.55 if deep else 1.0, 0.001)
    thump = lp(noise(dur, 21), 180) * env_exp(dur, 0.07, 0.001) * (0.0 if deep else 2.2)
    crack = hp(noise(dur, 23), 1800) * env_exp(dur, 0.012, 0.0003) * (0.0 if deep else 0.5)
    base = 1 if deep else 2
    tones = [(hz(f'D{4 + base - 1}'), 0.32), (hz(f'A{4 + base - 1}'), 0.24), (hz(f'E{5 + base - 1}'), 0.14)]
    ting = sum(bell(fq, dur, 0.75 if deep else 1.6) * a for fq, a in tones)
    mono = soft(sub * 1.3, 1.4) * 1.0 + thump + crack
    st = pan_st(mono)
    st += np.stack([ting, np.roll(ting, 29)]) * (0.55 if deep else 0.6)
    return st * scale


def fx_impactA(e):
    return signature(), 'impacts'


def fx_final(e):
    return signature(deep=True), 'impacts'


def fx_impactB(e):
    dur = 2.0
    sub = sine_sweep(dur, 85, 50, 12) * env_exp(dur, 0.6, 0.001)
    thump = lp(noise(dur, 31), 220) * env_exp(dur, 0.05, 0.001) * 1.6
    crack = hp(noise(dur, 33), 2200) * env_exp(dur, 0.01, 0.0003) * 0.45
    metal = bell(hz('D6'), dur, 0.35) * 0.12
    return pan_st(soft(sub * 1.2, 1.3) + thump + crack + metal), 'impacts'


def fx_whoosh(e):
    dur = e.get('dur', 0.6)
    n = noise(dur, int(e['at'] * 41))
    up = sweep_filter(n, 250, 5000, 'band', 32)
    t = t_axis(dur)
    shape = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    x = up * shape
    return np.stack([x, np.roll(x, 53)]) * 0.8, 'transitions'


def fx_sweep(e):
    dur = e.get('dur', 1.0)
    n = noise(dur, int(e['at'] * 59))
    x = sweep_filter(n, 90, 1400, 'low', 32)
    t = t_axis(dur)
    shape = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.2
    rumble = np.sin(2 * np.pi * 42 * t) * shape * 0.5
    st = np.stack([x * shape + rumble, np.roll(x, 71) * shape + rumble])
    return st * 1.1, 'transitions'


def fx_confirm(e):
    dur = 0.5
    a = bell(hz('A5'), dur, 0.18) * 0.6
    b = bell(hz('D6'), dur, 0.25) * 0.6
    x = np.zeros(secs(dur))
    x += a
    i = secs(0.07)
    x[i:] += b[: len(x) - i]
    return pan_st(x * 0.7, e.get('pan', 0)), 'ui'


def fx_tap(e):
    dur = 0.15
    thud = np.sin(2 * np.pi * 120 * t_axis(dur)) * env_exp(dur, 0.03)
    tap = bp(noise(dur, 43), 900, 4000) * env_exp(dur, 0.006)
    return pan_st(thud * 0.6 + tap * 0.8), 'ui'


def fx_signal(e):
    dur = 0.35
    t = t_axis(dur)
    buzz = np.sign(np.sin(2 * np.pi * 118 * t)) * (np.sin(2 * np.pi * 31 * t) > 0) * env_exp(dur, 0.12)
    chirp = sine_sweep(dur, 5200, 7600, 8) * env_exp(dur, 0.06) * 0.4
    return pan_st(lp(buzz, 2400) * 0.35 + chirp, e.get('pan', 0)), 'ui'


def fx_ping(e):
    dur = 1.2
    return pan_st(bell(hz('B5'), dur, 0.5) * 0.6, e.get('pan', 0)), 'ui'


FX = {
    'pulse': fx_pulse,
    'passby': fx_passby,
    'tick': fx_tick,
    'snap': fx_snap,
    'lock': fx_lock,
    'riser': fx_riser,
    'impactA': fx_impactA,
    'impactB': fx_impactB,
    'whoosh': fx_whoosh,
    'confirm': fx_confirm,
    'tap': fx_tap,
    'signal': fx_signal,
    'ping': fx_ping,
    'sweep': fx_sweep,
    'final': fx_final,
}


# ---------------------------------------------------------------------------------------
# The score
# ---------------------------------------------------------------------------------------

CH = {
    'Dm9': (['D2'], ['D3', 'F3', 'A3', 'C4', 'E4']),
    'Bbmaj7': (['A#1'], ['D3', 'F3', 'A3', 'A#3', 'E4']),
    'Gm9': (['G1'], ['D3', 'F3', 'A#3', 'A3', 'G4']),
    'A7sus': (['A1'], ['D3', 'E3', 'G3', 'A3', 'E4']),
    'Dcold': (['D2'], ['D3', 'E3', 'F3', 'A3']),
    'Fmaj9': (['F2'], ['E3', 'A3', 'C4', 'G4']),
    'Bbmaj9': (['A#1'], ['D3', 'F3', 'A3', 'C4']),
    'Cadd9': (['C2'], ['E3', 'G3', 'D4', 'G4']),
}


def section_of(t, c):
    if t < c['groove']:
        return 'intro'
    if t < c['macro']:
        return 'pulse'
    if t < c['systemA']:
        return 'groove'
    if t < c['design']:
        return 'cold'
    if t < c['process']:
        return 'warm'
    if t < c['silence']:
        return 'drive'
    if t < c['symbol']:
        return 'silence'
    return 'coda'


def build(version):
    cue_file = ROOT / 'audio' / f'cues-{version}.json'
    data = json.loads(cue_file.read_text())
    c = data['cues']
    dur = data['duration']
    beat = 60 / data['bpm']
    bar = beat * 4

    buses = {k: Bus(dur) for k in ['music', 'ambience', 'impacts', 'transitions', 'ui']}
    music, amb = buses['music'], buses['ambience']

    # --- Ambience: a low drone and air, from the first frame to the signature ----------
    d_dur = c['silence']
    t = t_axis(d_dur)
    drone = (np.sin(2 * np.pi * hz('D1') * t) * 0.5 + np.sin(2 * np.pi * hz('D2') * t + 0.3) * 0.25 + np.sin(2 * np.pi * hz('A2') * t) * 0.08)
    drone *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t)
    air = lp(hp(noise(d_dur, 51), 900), 6000) * 0.08
    air_r = lp(hp(noise(d_dur, 52), 900), 6000) * 0.08
    shimmer = (np.sin(2 * np.pi * hz('A5') * t) + 0.6 * np.sin(2 * np.pi * hz('D6') * t * 1.0007)) * 0.03 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.37 * t))
    # the intro breathes up into the impact; after it, the drone sits lower under the score
    shape = np.interp(t, [0, c['pulse'] + 0.05, c['hush'] - 0.05, c['hush'], c['impact'], c['impact'] + 0.6, d_dur - 0.4, d_dur], [0.0, 0.55, 1.0, 0.0, 0.0, 0.45, 0.35, 0.0])
    drone = hp(drone, 32)
    amb.add(0, np.stack([(drone * 0.4 + air + shimmer) * shape, (drone * 0.4 + air_r + np.roll(shimmer, 40)) * shape]), db(-17))

    # --- Drums, bass, pads, plucks on the grid ------------------------------------------
    K, Ks, CL, HC, HO = kick(), kick(True), clap(), hat(), hat(True)
    n_beats = int(dur / beat) + 1
    for b in range(n_beats):
        tb = b * beat
        sec = section_of(tb, c)
        bar_i = int(tb // bar)
        q = b % 4
        # a breath before the wall's words and before the launch: drums drop for one beat
        if c['realWork'] - beat <= tb < c['realWork'] or c['launch'] - beat <= tb < c['launch']:
            continue
        if sec == 'pulse':
            music.add(tb, Ks, db(-9 + 3 * min(1, (tb - c['groove']) / 4)))
            for s16 in range(4):
                music.add(tb + s16 * beat / 4, pan_st(HC, -0.3 if s16 % 2 else 0.3), db(-30 + (6 if s16 == 2 else 0)))
        elif sec == 'groove':
            music.add(tb, K, db(-5))
            if q in (1, 3):
                music.add(tb, pan_st(CL, 0.05), db(-12))
            music.add(tb + beat / 2, pan_st(HO, 0.25), db(-22))
            for s16 in (1, 3):
                music.add(tb + s16 * beat / 4, pan_st(HC, -0.35), db(-28))
        elif sec == 'cold':
            if q in (0, 2):
                music.add(tb, K, db(-7))
            music.add(tb + beat * 0.75, pan_st(tick_click(5200, 0.02), 0.6 if q % 2 else -0.6), db(-24))
            if q == 3:
                music.add(tb + beat / 2, pan_st(CL, -0.1), db(-17))
        elif sec == 'warm':
            if q in (0, 2):
                music.add(tb, Ks, db(-10))
            music.add(tb + beat / 2, pan_st(HC, 0.3), db(-25))
            if q == 3:
                music.add(tb, pan_st(clap() * 0.6, 0.0), db(-20))
        elif sec == 'drive':
            music.add(tb, K, db(-4))
            if q in (1, 3):
                music.add(tb, pan_st(CL, 0.05), db(-10))
            for s16 in range(4):
                music.add(tb + s16 * beat / 4, pan_st(HC if s16 != 2 else HO, 0.35 if s16 % 2 else -0.35), db(-24 + (4 if s16 == 2 else 0)))
        # bass: eighths
        prog = None
        if sec in ('pulse', 'groove'):
            prog = ['Dm9', 'Bbmaj7', 'Gm9', 'A7sus'][(bar_i // 2) % 4] if sec == 'groove' else 'Dm9'
        elif sec == 'cold':
            prog = 'Dcold'
        elif sec == 'warm':
            prog = ['Fmaj9', 'Bbmaj9', 'Dm9', 'Cadd9'][bar_i % 4]
        elif sec == 'drive':
            prog = ['Dm9', 'Bbmaj7', 'Gm9', 'A7sus'][bar_i % 4]
        if prog:
            root = hz(CH[prog][0][0])
            pattern = [1, 1, 2, 1, 1, 1.5, 1, 2] if sec != 'cold' else [1, 0, 1, 0, 1, 0, 1.06, 0]
            subdiv = 2 if sec != 'drive' else 4
            for k in range(subdiv):
                mult = pattern[(q * subdiv + k) % len(pattern)] if subdiv == 2 else [1, 1, 2, 1][k]
                if mult == 0:
                    continue
                if sec == 'pulse':
                    prog_t = (tb - c['groove']) / max(0.1, c['macro'] - c['groove'])
                    cutoff = 160 + 900 * prog_t ** 1.5
                    if tb < c['problem']:
                        continue
                else:
                    cutoff = {'groove': 1100, 'cold': 380, 'warm': 700, 'drive': 1600}[sec]
                ln = beat / subdiv * 0.92
                music.add(tb + k * beat / subdiv, pan_st(bass_note(root * mult, ln, cutoff)), db(-13 if sec != 'drive' else -12))
        # pads: on each bar's downbeat
        if q == 0 and prog and sec in ('groove', 'cold', 'warm', 'drive', 'pulse'):
            chord = [hz(n) for n in CH[prog][1]]
            ln = bar if sec != 'groove' else bar
            bright = {'pulse': 0.0, 'groove': 0.2, 'cold': -0.2, 'warm': 0.35, 'drive': 0.6}[sec]
            cutoff = {'pulse': 600, 'groove': 1300, 'cold': 700, 'warm': 1500, 'drive': 1900}[sec]
            if sec == 'pulse' and tb < c['lock'] - 0.01:
                cutoff = 500
            music.add(tb, pad_chord(chord, ln + 0.4, cutoff, max(0.0, bright)), db(-15 if sec != 'pulse' else -19))
        # plucks: the warm world's sixteenths
        if sec == 'warm' and prog:
            chord = [hz(n) * 2 for n in CH[prog][1]]
            for s16 in range(4):
                nidx = (b * 4 + s16) * 3 % len(chord)
                music.add(tb + s16 * beat / 4, pan_st(pluck(chord[nidx]), -0.5 + (s16 % 4) / 3), db(-23))
        if sec == 'drive' and prog and b % 2 == 1:
            chord = [hz(n) * 2 for n in CH[prog][1]]
            for s16 in range(4):
                music.add(tb + s16 * beat / 4, pan_st(pluck(chord[(b + s16) % len(chord)], 0.3), 0.6 - (s16 % 4) * 0.4), db(-25))

    # the lock of PROBLEM -> PRODUCT: a bright chord stab
    music.add(c['lock'], pad_chord([hz(n) for n in ['D4', 'F4', 'A4', 'C5', 'E5']], 0.7, 3200, 0.6), db(-14))

    # --- Coda: one sustained fifth after the symbol, decaying into the final note -------
    coda_dur = dur - c['symbol']
    tc = t_axis(coda_dur)
    fifth = (np.sin(2 * np.pi * hz('D3') * tc) * 0.5 + np.sin(2 * np.pi * hz('A3') * tc) * 0.35 + np.sin(2 * np.pi * hz('D4') * tc) * 0.2)
    fifth = lp(fifth + 0.15 * saw(hz('D3'), coda_dur, 0.003, 9), 900)
    fe = np.interp(tc, [0, 0.4, c['black'] - c['symbol'], c['black'] - c['symbol'] + 0.05, coda_dur], [0, 1, 0.7, 0.0, 0.0])
    amb.add(c['symbol'], np.stack([fifth * fe, np.roll(fifth, 60) * fe]), db(-22))

    # --- Sound effects --------------------------------------------------------------------
    for e in data['sfx']:
        buf, bus = FX[e['kind']](e)
        if e['kind'] == 'riser':
            at = e['at']
        else:
            at = e['at']
        g = db(e.get('gain', 0))
        if e['kind'] in ('riser', 'whoosh', 'sweep') and 'dur' in e:
            pass
        buses[bus].add(at, buf, g)

    # --- Silences: everything but the impacts' own tails is pulled out ----------------
    def carve(bus, a, b, fade=0.012):
        i0, i1 = secs(a), secs(b)
        f = secs(fade)
        g = np.ones(bus.x.shape[1])
        n = len(g)
        i0, i1 = min(i0, n), min(i1, n)
        g[i0:i1] = 0
        g[max(0, i0 - f):i0] = np.linspace(1, 0, min(f, i0))
        k = min(f, n - i1)
        g[i1:i1 + k] = np.linspace(0, 1, f)[:k]
        bus.x *= g

    for k in ['music', 'ambience', 'ui']:
        carve(buses[k], c['hush'], c['impact'])
        carve(buses[k], c['silence'], c['symbol'])
    # after the final note only its own tail remains
    carve(buses['music'], c['symbol'], dur + 4)
    carve(buses['transitions'], c['silence'], c['symbol'])

    # --- Section dynamics: restraint first, the strongest pulse at the peak --------------
    tt = np.arange(buses['music'].x.shape[1]) / SR
    curve_t = [0, c['groove'], c['lock'] - 0.05, c['lock'], c['macro'], c['systemA'], c['systemA'] + 0.5, c['design'], c['process'], c['launch'], c['silence'], dur + 4]
    curve_g = [-9, -9, -5, -2.5, -2, -1.5, -3.5, -2, -1.5, 0, 0.5, 0.5]
    buses['music'].x *= db(np.interp(tt, curve_t, curve_g))

    # --- Rooms --------------------------------------------------------------------------
    small = reverb_ir(1.4, 6000, 3)
    large = reverb_ir(3.4, 4200, 5, 0.02)
    sends = {'music': (small, 0.16), 'ambience': (large, 0.25), 'impacts': (large, 0.32), 'transitions': (small, 0.18), 'ui': (small, 0.22)}
    for k, (ir, amt) in sends.items():
        wet = convolve_st(buses[k].x, ir)
        buses[k].x = buses[k].x + wet * amt

    # --- Ducking: the score makes room for every impact ----------------------------------
    duck = np.ones(buses['music'].x.shape[1])
    for e in data['sfx']:
        if e['kind'] in ('impactA', 'impactB', 'final', 'lock', 'pulse'):
            i = secs(e['at'])
            n = secs(0.6)
            depth = 0.45 if e['kind'] in ('impactA', 'impactB', 'final') else 0.7
            curve = 1 - (1 - depth) * np.exp(-np.arange(n) / secs(0.18))
            j = min(len(duck), i + n)
            duck[i:j] = np.minimum(duck[i:j], curve[: j - i])
    buses['music'].x *= duck
    buses['ambience'].x *= 0.5 + 0.5 * duck

    # --- Stems, levels, master -----------------------------------------------------------
    total = secs(dur)
    stems = {k: b.x[:, :total] for k, b in buses.items()}
    level = {'music': db(-3.0), 'ambience': db(-2.0), 'impacts': db(-1.0), 'transitions': db(-6.0), 'ui': db(-2.0)}
    for k in stems:
        stems[k] = stems[k] * level[k]
    mix = sum(stems.values())

    # high-pass the rumble no speaker can play; a gentle low shelf of glue
    for ch in range(2):
        mix[ch] = hp(mix[ch], 24, 2)
    mix = master(mix)
    fade = np.ones(total)
    fade[-secs(0.08):] = np.linspace(1, 0, secs(0.08))
    mix *= fade

    out = ROOT / 'public' / 'audio' / version
    out.mkdir(parents=True, exist_ok=True)
    norm = 1.0 / max(1e-9, np.max(np.abs(mix)))  # stems share the master's gain staging
    pre_gain = master.last_gain
    for k, x in stems.items():
        write_wav(out / f'{k}.wav', np.clip(x * pre_gain, -1, 1))
    write_wav(out / 'mix.wav', mix)
    peak = 20 * np.log10(np.max(np.abs(mix)) + 1e-12)
    print(f'audio: {version}: {dur:.1f}s, sample peak {peak:.2f} dBFS -> {out.relative_to(ROOT)}')
    return norm


def lufs(x):
    """Integrated loudness (ITU-R BS.1770-4: K-weighting, 400 ms blocks, gating)."""
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    y = signal.lfilter(b2, a2, signal.lfilter(b1, a1, x, axis=1), axis=1)
    blk, hop = secs(0.4), secs(0.1)
    ms = np.array([np.mean(y[:, i:i + blk] ** 2, axis=1).sum() for i in range(0, y.shape[1] - blk, hop)])
    lk = -0.691 + 10 * np.log10(ms + 1e-12)
    g = ms[lk > -70]
    rel = -0.691 + 10 * np.log10(np.mean(g) + 1e-12) - 10
    g2 = ms[(lk > -70) & (lk > rel)]
    return -0.691 + 10 * np.log10(np.mean(g2) + 1e-12)


def master(x, target_peak_db=-1.2, loud_gain_db=None):
    """Glue compression, then a look-ahead limiter on a 4x oversampled peak detector."""
    # bus compressor (RMS, slow)
    mono = np.mean(np.abs(x), axis=0)
    rms = np.sqrt(signal.sosfilt(signal.butter(1, 6, 'low', fs=SR, output='sos'), mono ** 2) + 1e-12)
    thr = db(-18)
    ratio = 1.5
    over = np.maximum(1.0, rms / thr)
    g = over ** (1 / ratio - 1)
    x = x * g
    # loudness: -14 LUFS integrated (BS.1770), the limiter only catches what is left over
    gain = db(-14.0 - lufs(x))
    x = x * gain
    master.last_gain = gain
    # limiter
    ceiling = db(target_peak_db)
    up = signal.resample_poly(x, 4, 1, axis=1)
    peak = np.max(np.abs(up), axis=0).reshape(-1, 4).max(axis=1) if up.shape[1] % 4 == 0 else np.max(np.abs(x), axis=0)
    peak = peak[: x.shape[1]]
    look = secs(0.003)
    need = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    # look-ahead: the gain reaches its target before the peak
    need = np.minimum.reduce([np.roll(need, -k) for k in range(0, look, 8)])
    rel = np.exp(-1 / secs(0.08))
    gr = np.empty_like(need)
    cur = 1.0
    for i in range(len(need)):
        cur = need[i] if need[i] < cur else need[i] + (cur - need[i]) * rel
        gr[i] = cur
    x = x * gr
    # final safety on oversampled peaks
    up = signal.resample_poly(x, 4, 1, axis=1)
    tp = np.max(np.abs(up))
    if tp > ceiling:
        x *= ceiling / tp
    return x


master.last_gain = 1.0


def write_wav(path, x):
    """24-bit PCM, stereo, 48 kHz."""
    x = np.clip(x, -1, 1)
    ints = np.round(x.T * (2 ** 23 - 1)).astype('<i4')
    b = ints.reshape(-1, 1).view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    n = len(b)
    hdr = b'RIFF' + (36 + n).to_bytes(4, 'little') + b'WAVEfmt ' + (16).to_bytes(4, 'little')
    hdr += (1).to_bytes(2, 'little') + (2).to_bytes(2, 'little') + SR.to_bytes(4, 'little')
    hdr += (SR * 6).to_bytes(4, 'little') + (6).to_bytes(2, 'little') + (24).to_bytes(2, 'little')
    hdr += b'data' + n.to_bytes(4, 'little')
    path.write_bytes(hdr + b)


if __name__ == '__main__':
    for v in sys.argv[1:] or ['desktop', 'mobile']:
        build(v)
