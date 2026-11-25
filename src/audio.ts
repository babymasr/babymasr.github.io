export type Noise = 'white' | 'pink' | 'brown' | 'none';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseSrc: AudioBufferSourceNode | null = null;
let noiseGain: GainNode | null = null;
let lullGain: GainNode | null = null;
let lullTimer: number | null = null;
let wakeLock: { release: () => Promise<void> } | null = null;

function makeNoise(c: AudioContext, kind: Exclude<Noise, 'none'>): AudioBuffer {
    const len = c.sampleRate * 4;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === 'white') d[i] = w * 0.5;
        else if (kind === 'pink') {
            b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
            b2 = 0.969 * b2 + w * 0.153852; b3 = 0.8665 * b3 + w * 0.3104856;
            b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
            d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
            b6 = w * 0.115926;
        } else {
            last = (last + 0.02 * w) / 1.02;
            d[i] = last * 3.2;
        }
    }
    // smooth the loop seam
    const f = 2000;
    for (let i = 0; i < f; i++) {
        const t = i / f;
        d[i] = d[i] * t + d[len - f + i] * (1 - t) * 0;
    }
    return buf;
}

// C major pentatonic, slow music-box style loop. Notes: 0=C4 1=D4 2=E4 3=G4 4=A4 5=C5, -1 rest
const FREQ = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
const MELODY = [2, 3, 4, 3, 2, 0, 1, 2, 3, -1, 2, -1, 4, 3, 2, 3, 1, 0, 2, 1, 0, -1, -1, -1];
const BASS = [130.81, 98.0, 110.0, 98.0];

function note(c: AudioContext, out: AudioNode, freq: number, when: number, dur: number, vol: number, type: OscillatorType) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vol, when + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g);
    g.connect(out);
    o.start(when);
    o.stop(when + dur + 0.05);
}

function startLullaby(c: AudioContext, out: AudioNode) {
    const beat = 0.85;
    let idx = 0;
    let next = c.currentTime + 0.2;
    const tick = () => {
        while (next < c.currentTime + 1.5) {
            const n = MELODY[idx % MELODY.length];
            if (n >= 0) note(c, out, FREQ[n], next, 2.2, 0.18, 'sine');
            if (idx % 6 === 0) note(c, out, BASS[(idx / 6) % BASS.length], next, 3.4, 0.1, 'triangle');
            next += beat;
            idx++;
        }
    };
    tick();
    lullTimer = window.setInterval(tick, 500);
}

export async function startSound(opts: { noise: Noise; lullaby: boolean; volume: number }) {
    stopSound(true);
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    ctx = new AC();
    if (ctx.state === 'suspended') await Promise.race([ctx.resume(), new Promise(r => setTimeout(r, 800))]);
    master = ctx.createGain();
    master.gain.value = opts.volume;
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -12; lim.ratio.value = 12;
    master.connect(lim);
    lim.connect(ctx.destination);
    if (opts.noise !== 'none') {
        noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = makeNoise(ctx, opts.noise);
        noiseSrc.loop = true;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = opts.noise === 'white' ? 5500 : opts.noise === 'pink' ? 4000 : 900;
        noiseGain = ctx.createGain();
        noiseGain.gain.value = opts.lullaby ? 0.55 : 0.9;
        noiseSrc.connect(lp);
        lp.connect(noiseGain);
        noiseGain.connect(master);
        noiseSrc.start();
    }
    if (opts.lullaby) {
        lullGain = ctx.createGain();
        lullGain.gain.value = 1;
        lullGain.connect(master);
        startLullaby(ctx, lullGain);
    }
    try {
        const nav = navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } };
        if (nav.wakeLock) nav.wakeLock.request('screen').then(w => { wakeLock = w; }).catch(() => { wakeLock = null; });
    } catch {
        wakeLock = null;
    }
}

export function setVolume(v: number) {
    if (master && ctx) master.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
}

export function fadeOut(seconds: number) {
    if (master && ctx) master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + seconds);
}

export function stopSound(quiet = false) {
    if (lullTimer !== null) { clearInterval(lullTimer); lullTimer = null; }
    try { noiseSrc?.stop(); } catch { /* already stopped */ }
    noiseSrc = null; noiseGain = null; lullGain = null;
    if (ctx) { void ctx.close(); ctx = null; }
    master = null;
    if (wakeLock) { void wakeLock.release().catch(() => undefined); wakeLock = null; }
    void quiet;
}
