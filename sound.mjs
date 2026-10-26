// Trench City: sound for a capture. A rain + city bed, a slow minor pad, and one quiet sound per real event.
// usage: node sound.mjs events.json out.wav      (events.json = { dur, events: [{ t, kind, sol, collapse }] } from the page)
import fs from 'node:fs'

const { dur: DUR, events } = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const SR = 44100, N = Math.round(SR * DUR), TAU = Math.PI * 2
const L = new Float32Array(N), R = new Float32Array(N), VL = new Float32Array(N), VR = new Float32Array(N)
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12)
let seed = 9137
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1
const seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)))
function add(i, v, pan = 0, send = 0) {
  i |= 0; if (i < 0 || i >= N) return
  const a = ((pan + 1) * Math.PI) / 4, l = v * Math.cos(a) * 1.414, r = v * Math.sin(a) * 1.414
  L[i] += l; R[i] += r; if (send) { VL[i] += l * send; VR[i] += r * send }
}
function pluck(t0, m, amp = 0.1, dec = 3, pan = 0, send = 0.6) {
  const f = mtof(m); let y = 0
  for (let k = 0; k < Math.min(3, 7 / dec) * SR; k++) {
    const tt = k / SR, ph = tt * f
    const v = Math.sin(ph * TAU) * 0.75 + Math.sin(ph * 2 * TAU) * 0.12 * Math.exp(-tt * 9) + Math.sin(ph * 3.01 * TAU) * 0.05 * Math.exp(-tt * 14)
    y += 0.3 * (v - y)
    add(t0 * SR + k, y * Math.exp(-tt * dec) * Math.min(1, tt * 300) * amp, pan, send)
  }
}
function pad(t0, t1, notes, amp, att = 2, rel = 3) {
  notes.forEach((m, ni) => {
    let p1 = 0, p2 = 0, y = 0; const f = mtof(m)
    for (let i = Math.max(0, (t0 * SR) | 0); i < Math.min(N, (t1 + rel) * SR); i++) {
      const t = i / SR, env = Math.min(1, (t - t0) / att) * (t > t1 ? Math.max(0, 1 - (t - t1) / rel) : 1)
      p1 += f / SR; p2 += (f * 1.004) / SR
      y += 0.018 * (((p1 % 1) * 2 - 1) + ((p2 % 1) * 2 - 1) - y)
      add(i, y * env * amp, ni % 2 ? 0.5 : -0.5, 0.6)
    }
  })
}
function thud(t0, amp = 0.4) { let ph = 0; for (let k = 0; k < 0.9 * SR; k++) { const tt = k / SR; ph += (TAU * (44 + 50 * Math.exp(-tt * 14))) / SR; add(t0 * SR + k, Math.sin(ph) * Math.exp(-tt * 4.5) * amp, 0, 0.25) } }
function powerDown(t0, amp = 0.09) { let ph = 0, y = 0; for (let k = 0; k < 1.6 * SR; k++) { const tt = k / SR, f = 60 + 260 * Math.exp(-tt * 2.4); ph += (TAU * f) / SR; const v = Math.sin(ph) + 0.3 * Math.sin(ph * 2); y += 0.2 * (v - y); add(t0 * SR + k, y * Math.exp(-tt * 1.6) * Math.min(1, tt * 40) * amp, 0.15, 0.4) } }
function rumble(t0, dur, amp = 0.2, pan = 0) { let b = 0, y = 0; for (let k = 0; k < dur * SR; k++) { const p = k / (dur * SR), e = Math.sin(Math.min(1, p * 3) * Math.PI / 2) * (1 - p) ** 1.5; b = 0.995 * b + 0.05 * noise(); y += 0.05 * (b - y); add(t0 * SR + k, y * e * amp * 6, pan, 0.3) } }
function swell(t0, notes, amp) { notes.forEach((m, i) => { const f = mtof(m); let ph = 0; for (let k = 0; k < 2.6 * SR; k++) { const tt = k / SR, e = Math.min(1, tt / 0.35) * Math.exp(-Math.max(0, tt - 0.35) * 1.6); ph += TAU * f * (1 + 0.002 * Math.sin(tt * 5 + i)) / SR; add(t0 * SR + k, Math.sin(ph) * e * amp, i % 2 ? .35 : -.35, 0.7) } }) }

// 1. bed: rain (two decorrelated noise layers, darker in the lows), drops, and a far-off city rumble
{
  let a = 0, b = 0, h1 = 0, h2 = 0, br = 0, cy = 0
  for (let i = 0; i < N; i++) {
    const n1 = noise(), n2 = noise()
    a += 0.22 * (n1 - a); b += 0.22 * (n2 - b)
    const hp1 = n1 - h1, hp2 = n2 - h2; h1 = n1; h2 = n2
    br = 0.998 * br + 0.02 * noise(); cy += 0.004 * (br - cy)
    L[i] += a * 0.05 + hp1 * 0.012 + cy * 0.9
    R[i] += b * 0.05 + hp2 * 0.012 + cy * 0.9
  }
  for (let k = 0; k < DUR * 26; k++) {            // single drops on near surfaces
    const t0 = Math.abs(noise()) * DUR, f = 2200 + Math.abs(noise()) * 3500, pan = noise() * 0.9, amp = 0.006 + Math.abs(noise()) * 0.012
    for (let j = 0; j < 0.01 * SR; j++) { const tt = j / SR; add(t0 * SR + j, Math.sin(tt * TAU * f) * Math.exp(-tt * 600) * amp, pan) }
  }
}
// 2. a slow minor pad under everything (D minor: Dm9, Bbmaj7, Gm9, Am7), very quiet
const CH = [[50, 57, 60, 64, 65], [46, 53, 57, 62, 65], [43, 50, 53, 57, 62], [45, 52, 55, 60, 64]]
for (let i = 0, t = -2; t < DUR; i++, t += 9) pad(t, t + 9, CH[i % 4], 0.012, 3, 4)
const PENT = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84]
// 3. one sound per event, quiet and tuned to the pad
let lastSwell = -9, lastPluck = -9
for (const e of events) {
  const r = Math.abs(Math.sin(e.t * 917.3))
  if (e.kind === 'launch') pluck(e.t, PENT[5 + Math.floor(r * 5)], 0.035 + Math.min(0.03, e.sol * 0.004), 3.5, (r - 0.5) * 1.2, 0.8)
  if (e.kind === 'buy') pluck(e.t, PENT[Math.floor(r * 6)], 0.018 + Math.min(0.02, e.sol * 0.01), 4.5, (r - 0.5), 0.6)
  if (e.kind === 'whale' && e.t - lastSwell < 1.5) { if (e.t - lastPluck > .25) { pluck(e.t, PENT[Math.floor(r * 6)], 0.03, 4, (r - .5), .6); lastPluck = e.t } continue }
  if (e.kind === 'whale') { lastSwell = e.t; swell(e.t, [62, 69, 74], 0.02 + Math.min(0.025, e.sol * 0.003)); pluck(e.t + 0.04, 81, 0.05, 2.5, 0.2, 0.8) }
  if (e.kind === 'dev') { thud(e.t, 0.32); powerDown(e.t + 0.05, 0.08); if (e.collapse) rumble(e.t + 2.6, 6, 0.22) }
  if (e.kind === 'grad') { swell(e.t, [62, 69, 74, 77, 81], 0.03);[86, 89, 93].forEach((m, i) => pluck(e.t + 0.3 + i * 0.12, m, 0.04, 3, (i - 1) * 0.4, 0.9)) }
}
// 4. reverb (a wide room), master, fades
const taps = [[0.043, 0.5], [0.071, 0.43], [0.113, 0.37], [0.167, 0.31], [0.239, 0.26], [0.331, 0.21], [0.45, 0.16], [0.61, 0.12], [0.83, 0.08], [1.1, 0.05]]
let dl = 0, dr = 0
for (let i = 0; i < N; i++) {
  let l = 0, r = 0
  for (const [d, g] of taps) { const j = i - Math.floor(d * SR); if (j >= 0) { l += VR[j] * g; r += VL[j] * g } }
  dl += 0.3 * (l - dl); dr += 0.3 * (r - dr); L[i] += dl * 0.8; R[i] += dr * 0.8
}
let peak = 0
for (let i = 0; i < N; i++) { const t = i / SR, f = seg(t, 0, 1.2) * (1 - seg(t, DUR - 1.5, DUR)); L[i] = Math.tanh(L[i] * 1.2) * f; R[i] = Math.tanh(R[i] * 1.2) * f; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])) }
const g = 0.8 / peak, buf = Buffer.alloc(44 + N * 4)
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40)
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] * g * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * g * 32767), 46 + i * 4) }
fs.writeFileSync(process.argv[3] || 'sound.wav', buf)
console.log('wrote', process.argv[3], 'events', events.length, 'peak', peak.toFixed(2))
