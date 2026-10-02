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
from scipy.io import wavfile

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


def fx_bloom(e):
    """Something beginning: a sub swell and air, the brand chord far away. No transient."""
    dur = e.get('dur', 3.5) + 2.0
    t = t_axis(dur)
    env = np.clip(t / 1.4, 0, 1) ** 2 * np.exp(-np.clip(t - 1.6, 0, None) / 1.6)
    sub = (np.sin(2 * np.pi * hz('D1') * t) * 0.8 + np.sin(2 * np.pi * hz('D2') * t) * 0.3) * env
    chord = pad_chord([hz(n) for n in ['D3', 'A3', 'E4', 'F#4']], dur, 520) * env
    air = np.stack([lp(hp(noise(dur, 61), 300), 2400), lp(hp(noise(dur, 62), 300), 2400)]) * 0.05 * env
    return pan_st(soft(sub, 1.1)) + chord * 1.6 + air, 'ambience'


def fx_trace(e):
    """A soft tone that follows the line of light across the stereo field."""
    dur = e.get('dur', 4.0)
    t = t_axis(dur)
    x = saw(hz('A3'), dur, 0.0, 3) + saw(hz('A3'), dur, 0.005, 4) * 0.7 + saw(hz('D4'), dur, -0.004, 5) * 0.4
    x = sweep_filter(x, 260, 1500, 'low', 40)
    env = np.clip(t / 0.8, 0, 1) * np.clip((dur - t) / 0.9, 0, 1)
    return moving_pan(x * env * 0.5, -0.6, 0.6), 'ambience'


def fx_tick(e):
    f = 2600 * 2 ** (e.get('pitch', 0) / 12)
    return pan_st(tick_click(f), e.get('pan', 0)), 'ui'


def fx_snap(e):
    dur = 0.12
    f = 170 * 2 ** (e.get('pitch', 0) / 12)
    body = np.sin(2 * np.pi * f * t_axis(dur)) * env_exp(dur, 0.025, 0.0005)
    crack = hp(noise(dur, 13), 2500) * env_exp(dur, 0.004, 0.0002)
    return pan_st(body * 0.8 + crack * 0.5, e.get('pan', 0)), 'ui'


def fx_lock(e):
    dur = 0.5
    body = sine_sweep(dur, 110, 52, 30) * env_exp(dur, 0.15, 0.001)
    crack = hp(noise(dur, 17), 3000) * env_exp(dur, 0.004, 0.0002)
    return pan_st(soft(body * 1.2, 1.3) + crack * 0.35, e.get('pan', 0)), 'impacts'


def fx_riser(e):
    dur = e.get('dur', 0.8)
    n = noise(dur, int(e['at'] * 77))
    x = sweep_filter(n, 400, 7000, 'band', 32)
    t = t_axis(dur)
    x *= (t / dur) ** 2.6
    return np.stack([x, np.roll(x, 37)]) * 0.8, 'transitions'


def fx_impact(e):
    dur = 2.0
    sub = sine_sweep(dur, 85, 46, 12) * env_exp(dur, 0.65, 0.001)
    thump = lp(noise(dur, 31), 200) * env_exp(dur, 0.05, 0.001) * 1.4
    crack = hp(noise(dur, 33), 2200) * env_exp(dur, 0.008, 0.0003) * 0.25
    return pan_st(soft(sub * 1.2, 1.3) + thump + crack), 'impacts'


def fx_air(e):
    """Low, quiet air under a camera move: felt more than heard."""
    dur = e.get('dur', 1.5)
    t = t_axis(dur)
    shape = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.6
    L = sweep_filter(noise(dur, int(e['at'] * 31)), 160, 900, 'low', 24) * shape
    R = sweep_filter(noise(dur, int(e['at'] * 31) + 1), 160, 900, 'low', 24) * shape
    return np.stack([L, R]) * 0.9, 'transitions'


def fx_tap(e):
    dur = 0.15
    thud = np.sin(2 * np.pi * 120 * t_axis(dur)) * env_exp(dur, 0.03)
    tap = bp(noise(dur, 43), 900, 4000) * env_exp(dur, 0.006)
    return pan_st(thud * 0.6 + tap * 0.6), 'ui'


def fx_signal(e):
    dur = 0.35
    t = t_axis(dur)
    buzz = np.sign(np.sin(2 * np.pi * 118 * t)) * (np.sin(2 * np.pi * 31 * t) > 0) * env_exp(dur, 0.12)
    return pan_st(lp(buzz, 1800) * 0.3, e.get('pan', 0)), 'ui'


def fx_sweep(e):
    dur = e.get('dur', 1.0)
    n = noise(dur, int(e['at'] * 59))
    x = sweep_filter(n, 90, 1200, 'low', 32)
    t = t_axis(dur)
    shape = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.2
    rumble = np.sin(2 * np.pi * 42 * t) * shape * 0.5
    return np.stack([x * shape + rumble, np.roll(x, 71) * shape + rumble]), 'transitions'


def brand_chord(dur, deep=False):
    """The MG signature: one voiced chord over a sub, warm, no bell, no alarm."""
    t = t_axis(dur)
    notes = ['D2', 'A2', 'D3', 'F#3'] if deep else ['D3', 'A3', 'E4', 'F#4', 'A4']
    pad = pad_chord([hz(n) for n in notes], dur, 900 if deep else 2200, 0.0 if deep else 0.4)
    env = np.clip(t / 0.06, 0, 1) * np.exp(-t / (0.6 if deep else 1.8))
    sub = sine_sweep(dur, 74 if deep else 90, hz('D1'), 10) * env_exp(dur, 0.5 if deep else 1.1, 0.002)
    return pad * env * 2.4 + pan_st(soft(sub * 1.2, 1.2))


def fx_chord(e):
    return brand_chord(4.0), 'impacts'


def fx_final(e):
    return brand_chord(2.0, deep=True), 'impacts'


FX = {
    'bloom': fx_bloom,
    'trace': fx_trace,
    'tick': fx_tick,
    'snap': fx_snap,
    'lock': fx_lock,
    'riser': fx_riser,
    'impact': fx_impact,
    'air': fx_air,
    'tap': fx_tap,
    'signal': fx_signal,
    'sweep': fx_sweep,
    'chord': fx_chord,
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
    """The score follows the story: curiosity, immersion, rhythm, confidence, climax, silence."""
    if t < c['structure']:
        return 'intro'
    if t < c['web']:
        return 'rise'
    if t < c['proof']:
        return 'caps'
    if t < c['clutter']:
        return 'proof'
    if t < c['collapse']:
        return 'clutter'
    if t < c['process']:
        return 'calm'
    if t < c['live']:
        return 'craft'
    if t < c['silence']:
        return 'world'
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

    # --- Ambience: a low drone and air under the whole film, rising out of nothing -------
    d_dur = c['silence']
    t = t_axis(d_dur)
    drone = (np.sin(2 * np.pi * hz('D1') * t) * 0.5 + np.sin(2 * np.pi * hz('D2') * t + 0.3) * 0.25 + np.sin(2 * np.pi * hz('A2') * t) * 0.08)
    drone *= 0.65 + 0.35 * np.sin(2 * np.pi * 0.11 * t)
    drone = hp(drone, 32)
    air = lp(hp(noise(d_dur, 51), 700), 5000) * 0.07
    air_r = lp(hp(noise(d_dur, 52), 700), 5000) * 0.07
    shape = np.interp(t, [0, 1.6, c['structure'], c['web'], d_dur - 0.3, d_dur], [0.0, 0.9, 1.0, 0.45, 0.4, 0.0])
    amb.add(0, np.stack([(drone * 0.4 + air) * shape, (drone * 0.4 + air_r) * shape]), db(-17))

    # --- Drums, bass, pads, plucks on the grid ------------------------------------------
    K, Ks, CL, HC, HO = kick(), kick(True), clap(), hat(), hat(True)
    sub_pulse = lp(kick(True), 140)
    n_beats = int(dur / beat) + 1
    prog_caps = ['Dm9', 'Bbmaj7', 'Gm9', 'A7sus']
    for b in range(n_beats):
        tb = b * beat
        sec = section_of(tb, c)
        bar_i = int(tb // bar)
        q = b % 4
        # a breath before the wall's words and before the page goes live
        if c['realWork'] - beat <= tb < c['realWork'] or c['live'] - beat <= tb < c['live']:
            continue
        if sec == 'intro':
            # a soft sub pulse, like something waking: every two beats, from the first trace
            if tb >= c['trace'] + 0.5 and q % 2 == 0:
                music.add(tb, sub_pulse, db(-17 + 4 * min(1, (tb - c['trace']) / 4)))
        elif sec == 'rise':
            music.add(tb, Ks, db(-12 + 4 * (tb - c['structure']) / max(0.1, c['web'] - c['structure'])))
            for s16 in range(4):
                music.add(tb + s16 * beat / 4, pan_st(HC, -0.3 if s16 % 2 else 0.3), db(-32 + (5 if s16 == 2 else 0)))
        elif sec == 'caps':
            music.add(tb, K, db(-7))
            music.add(tb + beat / 2, pan_st(HO, 0.25), db(-25))
            if q == 3:
                music.add(tb, pan_st(CL, 0.05), db(-17))
        elif sec == 'proof':
            music.add(tb, K, db(-5))
            if q in (1, 3):
                music.add(tb, pan_st(CL, 0.05), db(-13))
            music.add(tb + beat / 2, pan_st(HO, 0.25), db(-23))
            for s16 in (1, 3):
                music.add(tb + s16 * beat / 4, pan_st(HC, -0.35), db(-29))
        elif sec == 'clutter':
            # restless: busier, thinner, without the kick's confidence
            if q in (0, 2):
                music.add(tb, Ks, db(-14))
            for s16 in range(4):
                music.add(tb + s16 * beat / 4, pan_st(tick_click(4200 + 600 * ((b + s16) % 3), 0.02), [-0.7, 0.5, -0.2, 0.7][s16]), db(-27))
        elif sec == 'calm':
            # the drums stop: the work is simpler now; a soft pulse returns with the people
            if tb >= c['people'] and q % 2 == 0:
                music.add(tb, sub_pulse, db(-12))
        elif sec == 'craft':
            music.add(tb, K if q in (0, 2) else Ks, db(-6 if q in (0, 2) else -11))
            if q == 3:
                music.add(tb, pan_st(CL, 0.0), db(-14))
            music.add(tb + beat / 2, pan_st(HC, 0.3), db(-25))
        elif sec == 'world':
            music.add(tb, K, db(-4))
            if q in (1, 3):
                music.add(tb, pan_st(CL, 0.05), db(-11))
            for s16 in range(4):
                music.add(tb + s16 * beat / 4, pan_st(HC if s16 != 2 else HO, 0.35 if s16 % 2 else -0.35), db(-24 + (4 if s16 == 2 else 0)))
        # harmony
        prog = None
        if sec == 'rise':
            prog = 'Dm9'
        elif sec in ('caps', 'proof'):
            prog = prog_caps[(bar_i // 2) % 4] if sec == 'proof' else prog_caps[bar_i % 4]
        elif sec == 'clutter':
            prog = 'Dcold'
        elif sec == 'calm':
            prog = ['Fmaj9', 'Bbmaj9', 'Dm9', 'Cadd9'][bar_i % 4]
        elif sec in ('craft', 'world'):
            prog = prog_caps[bar_i % 4]
        if prog and sec != 'calm':
            root = hz(CH[prog][0][0])
            pattern = [1, 1, 2, 1, 1, 1.5, 1, 2] if sec != 'clutter' else [1, 0, 1, 0, 1, 0, 1.06, 0]
            subdiv = 4 if sec == 'world' else 2
            for k in range(subdiv):
                mult = pattern[(q * subdiv + k) % len(pattern)] if subdiv == 2 else [1, 1, 2, 1][k]
                if mult == 0:
                    continue
                if sec == 'rise':
                    if tb < c['structHe']:
                        continue
                    pt = (tb - c['structHe']) / max(0.1, c['web'] - c['structHe'])
                    cutoff = 180 + 800 * pt ** 1.4
                else:
                    cutoff = {'caps': 900, 'proof': 1100, 'clutter': 380, 'craft': 1200, 'world': 1600}[sec]
                ln = beat / subdiv * 0.92
                music.add(tb + k * beat / subdiv, pan_st(bass_note(root * mult, ln, cutoff)), db(-13 if sec != 'world' else -12))
        if q == 0 and prog:
            chord = [hz(n) for n in CH[prog][1]]
            bright = {'rise': 0.0, 'caps': 0.15, 'proof': 0.2, 'clutter': 0.0, 'calm': 0.35, 'craft': 0.3, 'world': 0.6}[sec]
            cutoff = {'rise': 600, 'caps': 1200, 'proof': 1300, 'clutter': 650, 'calm': 1500, 'craft': 1500, 'world': 1900}[sec]
            music.add(tb, pad_chord(chord, bar + 0.4, cutoff, bright), db(2 if sec == 'calm' else -15 if sec != 'rise' else -18))
        if sec == 'calm' and prog and q == 0:
            # one long, warm bass note per bar under the calm
            music.add(tb, pan_st(bass_note(hz(CH[prog][0][0]), bar * 0.95, 420, 1.2)), db(-9))
        if sec == 'calm' and prog and tb >= c['collapse'] + beat - 0.01:
            chord = [hz(n) * 2 for n in CH[prog][1]]
            for s16 in range(4):
                nidx = (b * 4 + s16) * 3 % len(chord)
                music.add(tb + s16 * beat / 4, pan_st(pluck(chord[nidx]), -0.5 + (s16 % 4) / 3), db(-18))
        if sec == 'world' and prog and b % 2 == 1:
            chord = [hz(n) * 2 for n in CH[prog][1]]
            for s16 in range(4):
                music.add(tb + s16 * beat / 4, pan_st(pluck(chord[(b + s16) % len(chord)], 0.3), 0.6 - (s16 % 4) * 0.4), db(-25))

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
        buses[bus].add(e['at'], buf, db(e.get('gain', 0)))

    # --- The voice signature (optional): a recorded human take, never a synthetic one -------
    # Drop a take at audio/voice/signature.wav: "MARTIN.G." (short pause) "Make it real."
    # Its first word lands on the wordmark; the music dips a few dB beneath it, never out.
    voice_duck = None
    vpath = ROOT / 'audio' / 'voice' / 'signature.wav'
    if vpath.exists():
        vsr, raw = wavfile.read(vpath)
        vx = raw.astype(np.float64)
        if raw.dtype.kind in 'iu':
            vx /= float(np.iinfo(raw.dtype).max)
        vx = vx.mean(axis=1) if vx.ndim == 2 else vx
        if vsr != SR:
            vx = signal.resample_poly(vx, SR, vsr)
        vx = hp(vx, 75, 2)
        # trim leading silence so the first word sits on its cue
        on = np.argmax(np.abs(vx) > 0.02 * np.max(np.abs(vx)))
        vx = vx[max(0, on - secs(0.03)):]
        vx = vx / max(1e-9, np.max(np.abs(vx))) * db(-6)
        start = c['wordmark'] + 0.08
        buses['voice'] = Bus(dur)
        buses['voice'].add(start, pan_st(vx), 1.0)
        env = signal.sosfilt(signal.butter(1, 4, 'low', fs=SR, output='sos'), np.abs(vx))
        env = env / max(1e-9, env.max())
        voice_duck = np.ones(buses['music'].x.shape[1])
        i0 = secs(start)
        seg = 1 - 0.45 * np.clip(env * 3, 0, 1)  # about -5 dB under the voice
        j = min(len(voice_duck), i0 + len(seg))
        voice_duck[i0:j] = seg[: j - i0]
        print(f'voice: {vpath.relative_to(ROOT)} at {start:.2f}s ({len(vx) / SR:.2f}s)')

    # --- Silence: everything but the impacts' own tails is pulled out ------------------
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

    for k in ['music', 'ambience', 'ui', 'transitions']:
        carve(buses[k], c['silence'], c['symbol'])
    carve(buses['music'], c['symbol'], dur + 4)

    # --- Section dynamics: restraint first, the strongest pulse at the peak --------------
    tt = np.arange(buses['music'].x.shape[1]) / SR
    curve_t = [0, c['structure'], c['web'], c['proof'], c['clutter'], c['collapse'], c['process'], c['live'], c['silence'], dur + 4]
    curve_g = [-6, -6, -3, -1.5, -4, -2, -2, 0, 0.5, 0.5]
    buses['music'].x *= db(np.interp(tt, curve_t, curve_g))

    # --- Rooms --------------------------------------------------------------------------
    small = reverb_ir(1.4, 6000, 3)
    large = reverb_ir(3.4, 4200, 5, 0.02)
    sends = {'music': (small, 0.16), 'ambience': (large, 0.25), 'impacts': (large, 0.32), 'transitions': (small, 0.18), 'ui': (small, 0.22)}
    if 'voice' in buses:
        sends['voice'] = (small, 0.06)  # close-mic: barely any room
    for k, (ir, amt) in sends.items():
        wet = convolve_st(buses[k].x, ir)
        buses[k].x = buses[k].x + wet * amt

    # --- Ducking: the score makes room for every impact ----------------------------------
    duck = np.ones(buses['music'].x.shape[1])
    for e in data['sfx']:
        if e['kind'] in ('impact', 'final', 'chord', 'lock'):
            i = secs(e['at'])
            n = secs(0.6)
            depth = 0.45 if e['kind'] in ('impact', 'final', 'chord') else 0.7
            curve = 1 - (1 - depth) * np.exp(-np.arange(n) / secs(0.18))
            j = min(len(duck), i + n)
            duck[i:j] = np.minimum(duck[i:j], curve[: j - i])
    buses['music'].x *= duck
    buses['ambience'].x *= 0.5 + 0.5 * duck
    if voice_duck is not None:
        for k in ('music', 'ambience', 'impacts'):
            buses[k].x *= voice_duck

    # --- Stems, levels, master -----------------------------------------------------------
    total = secs(dur)
    stems = {k: b.x[:, :total] for k, b in buses.items()}
    level = {'music': db(-3.0), 'ambience': db(-2.0), 'impacts': db(-1.0), 'transitions': db(-6.0), 'ui': db(-2.0), 'voice': db(0.0)}
    for k in stems:
        stems[k] = stems[k] * level[k]
    mix = sum(stems.values())

    # high-pass the rumble no speaker can play; a gentle low shelf of glue
    for ch in range(2):
        mix[ch] = hp(mix[ch], 24, 2)
    mix = master(mix)
    # the last note and its room decay to nothing before the file ends (no cut-off tail)
    fade = np.ones(total)
    n_f = secs(1.1)
    fade[-n_f:] = np.linspace(1, 0, n_f) ** 2
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
