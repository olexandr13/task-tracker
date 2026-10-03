import type { ChestQuarter } from '../core'

/**
 * The noise a chest makes, made up on the spot rather than played from a file
 * (CHST-19).
 *
 * Every sound here is built from oscillators and filtered noise through the
 * Web Audio API: no files to download, nothing to license, and a reel that
 * ticks thirty times costs a loop rather than thirty recordings. The app has no
 * other sound, and this is the only place it has any.
 *
 * It is meant to sound like heavy things in a big room, not like a toy: every
 * impact is a low thump under a metal strike — a few partials that do not sit
 * on a scale, as a struck plate's do — with a burst of noise for the edge of it;
 * the reel runs over a drone whose filter opens as it slows; the card lands on
 * a boom, a swept chord and, for a big amount, bells. All of it goes through one
 * bus with a small room on it (a reverb made from decaying noise) and a
 * compressor at the end, so nothing clips however much is playing.
 *
 * The context is made on the **first opening** and not before: a browser will
 * not start one outside a gesture, and a page that asks on load gets a warning
 * in the console for its trouble. Everything is guarded, so a browser without
 * Web Audio — or a test environment, which has none — simply makes no noise.
 */

/** The context, and the two ways into it: straight out, and into the room. */
interface Rig {
  readonly at: AudioContext
  readonly dry: GainNode
  readonly wet: GainNode
}

let context: AudioContext | null = null
let output: AudioNode | null = null
let room: ConvolverNode | null = null
let hiss: AudioBuffer | null = null
let rig: Rig | null = null

/** The rig, made the first time something is played, or null where there is none to make. */
function audio(): Rig | null {
  if (rig !== null) return rig
  if (typeof AudioContext !== 'function') return null

  try {
    context ??= new AudioContext()
  } catch {
    return null
  }
  const at = context
  if (at.state === 'suspended') void at.resume()

  if (output === null || room === null) {
    const squeeze = at.createDynamicsCompressor()
    squeeze.threshold.value = -16
    squeeze.knee.value = 12
    squeeze.ratio.value = 4
    squeeze.attack.value = 0.003
    squeeze.release.value = 0.25
    squeeze.connect(at.destination)
    output = squeeze

    room = at.createConvolver()
    room.buffer = roomOf(at, 2.4)
    room.connect(squeeze)
  }

  const dry = at.createGain()
  dry.gain.value = 0.85
  dry.connect(output)
  const wet = at.createGain()
  wet.gain.value = 0.7
  wet.connect(room)

  rig = { at, dry, wet }
  return rig
}

/**
 * Cuts off everything the chest is playing or has lined up to play, at once:
 * the sound turned off in the middle of the show, or the chest leaving the
 * page. The two ways in are faded and unplugged; the next sound gets new ones.
 */
export function hushChest(): void {
  if (rig === null) return
  const { at, dry, wet } = rig
  rig = null
  for (const bus of [dry, wet]) bus.gain.setTargetAtTime(0, at.currentTime, 0.015)
  window.setTimeout(() => {
    dry.disconnect()
    wet.disconnect()
  }, 150)
}

/** A room to play in: two channels of noise dying away, which is all a reverb is. */
function roomOf(at: AudioContext, seconds: number): AudioBuffer {
  const frames = Math.floor(at.sampleRate * seconds)
  const buffer = at.createBuffer(2, frames, at.sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const samples = buffer.getChannelData(channel)
    for (let frame = 0; frame < frames; frame++) {
      samples[frame] = (Math.random() * 2 - 1) * Math.pow(1 - frame / frames, 3.4)
    }
  }
  return buffer
}

/** Two seconds of noise, made once and read from anywhere in it. */
function noiseOf(at: AudioContext): AudioBuffer {
  if (hiss !== null) return hiss
  const frames = at.sampleRate * 2
  hiss = at.createBuffer(1, frames, at.sampleRate)
  const samples = hiss.getChannelData(0)
  for (let frame = 0; frame < frames; frame++) samples[frame] = Math.random() * 2 - 1
  return hiss
}

/** Where a voice goes and how much of it reaches the room. */
interface Place {
  /** Milliseconds from now. */
  start?: number
  /** How much of it goes into the room, 0 to 1. */
  send?: number
  /** Left to right, -1 to 1. */
  pan?: number
}

function route(r: Rig, node: AudioNode, { send = 0, pan = 0 }: Place): void {
  let last = node
  if (pan !== 0) {
    const panner = r.at.createStereoPanner()
    panner.pan.value = pan
    node.connect(panner)
    last = panner
  }
  last.connect(r.dry)
  if (send > 0) {
    const share = r.at.createGain()
    share.gain.value = send
    last.connect(share).connect(r.wet)
  }
}

/**
 * A level that rises to `gain` and dies away over `length` seconds — or, as a
 * swell, rises all the way to the end and is cut off there, the way air drawn
 * in towards a hit is.
 */
function envelope(r: Rig, when: number, length: number, gain: number, attack: number, swell = false): GainNode {
  const level = r.at.createGain()
  const peak = Math.max(0.0002, gain)
  level.gain.setValueAtTime(0.0001, when)
  if (swell) {
    level.gain.exponentialRampToValueAtTime(peak, when + Math.max(0.01, length - 0.03))
  } else {
    level.gain.exponentialRampToValueAtTime(peak, when + Math.min(attack, length / 2))
  }
  level.gain.exponentialRampToValueAtTime(0.0001, when + length)
  return level
}

interface Sweep {
  type?: BiquadFilterType
  from: number
  to?: number
  q?: number
}

function filterOf(r: Rig, when: number, length: number, { type = 'lowpass', from, to = from, q = 0.7 }: Sweep): BiquadFilterNode {
  const filter = r.at.createBiquadFilter()
  filter.type = type
  filter.Q.value = q
  filter.frequency.setValueAtTime(from, when)
  if (to !== from) filter.frequency.exponentialRampToValueAtTime(Math.max(1, to), when + length)
  return filter
}

/** A tone with an envelope, through a filter if it has one. */
function tone(
  r: Rig,
  {
    shape = 'sine',
    from,
    to = from,
    ms,
    gain = 0.2,
    attack = 0.004,
    detune = 0,
    filter,
    ...place
  }: Place & {
    shape?: OscillatorType
    from: number
    to?: number
    ms: number
    gain?: number
    attack?: number
    detune?: number
    filter?: Sweep
  },
): void {
  const when = r.at.currentTime + (place.start ?? 0) / 1000
  const length = ms / 1000

  const oscillator = r.at.createOscillator()
  oscillator.type = shape
  oscillator.detune.value = detune
  oscillator.frequency.setValueAtTime(from, when)
  if (to !== from) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), when + length)

  const level = envelope(r, when, length, gain, attack)
  if (filter === undefined) oscillator.connect(level)
  else oscillator.connect(filterOf(r, when, length, filter)).connect(level)
  route(r, level, place)

  oscillator.start(when)
  oscillator.stop(when + length + 0.05)
}

/** A burst of filtered noise: air, grit, the edge of a strike — or, as a swell, a rush rising into one. */
function noise(
  r: Rig,
  { ms, gain = 0.2, attack = 0.002, swell = false, filter, ...place }: Place & { ms: number; gain?: number; attack?: number; swell?: boolean; filter: Sweep },
): void {
  const when = r.at.currentTime + (place.start ?? 0) / 1000
  const length = ms / 1000

  const source = r.at.createBufferSource()
  source.buffer = noiseOf(r.at)
  const level = envelope(r, when, length, gain, attack, swell)
  source.connect(filterOf(r, when, length, filter)).connect(level)
  route(r, level, place)

  source.start(when, Math.random() * 1.5)
  source.stop(when + length + 0.05)
}

/** The partials of a struck metal plate, which do not sit on a scale — the whole of why it sounds like metal. */
const PLATE = [1, 2.76, 5.4, 8.93]

/** Metal struck: a clank, a latch, a dial coming to rest. */
function metal(r: Rig, { freq, ms, gain = 0.15, ...place }: Place & { freq: number; ms: number; gain?: number }): void {
  for (const [index, ratio] of PLATE.entries()) {
    tone(r, { from: freq * ratio, ms: ms / (1 + index * 0.7), gain: gain / (1 + index * 1.4), attack: 0.001, ...place })
  }
  noise(r, { ms: 40, gain: gain * 0.9, filter: { type: 'bandpass', from: freq * 5, q: 1.4 }, ...place })
}

/** Weight: a low sine falling in pitch, the body of every impact. */
function thump(r: Rig, { from = 120, to = 42, ms = 240, gain = 0.45, ...place }: Place & { from?: number; to?: number; ms?: number; gain?: number }): void {
  tone(r, { from, to, ms, gain, attack: 0.002, ...place })
}

/** A small mechanism catching: a tick of grit and a short ring. */
function click(r: Rig, { freq = 3000, gain = 0.07, ...place }: Place & { freq?: number; gain?: number }): void {
  noise(r, { ms: 14, gain, filter: { type: 'highpass', from: 2200 }, ...place })
  tone(r, { from: freq, to: freq * 0.9, ms: 50, gain: gain * 0.5, attack: 0.001, ...place })
  tone(r, { from: 190, to: 120, ms: 30, gain: gain * 0.8, attack: 0.001, ...place })
}

/** A bell, by frequency modulation: one oscillator wobbling another's pitch, the wobble dying as the ring does. */
function bell(r: Rig, { freq, ms = 1600, gain = 0.06, ...place }: Place & { freq: number; ms?: number; gain?: number }): void {
  const when = r.at.currentTime + (place.start ?? 0) / 1000
  const length = ms / 1000

  const carrier = r.at.createOscillator()
  carrier.frequency.value = freq
  const modulator = r.at.createOscillator()
  modulator.frequency.value = freq * 3.5
  const depth = r.at.createGain()
  depth.gain.setValueAtTime(freq * 2.4, when)
  depth.gain.exponentialRampToValueAtTime(freq * 0.04, when + length)
  modulator.connect(depth).connect(carrier.frequency)

  const level = envelope(r, when, length, gain, 0.002)
  carrier.connect(level)
  route(r, level, place)

  for (const oscillator of [carrier, modulator]) {
    oscillator.start(when)
    oscillator.stop(when + length + 0.05)
  }
}

/**
 * A chord of detuned saws through one lowpass whose cutoff swells and closes:
 * the warm, wide sound under the card coming out, and under the reel.
 */
function pad(
  r: Rig,
  {
    freqs,
    ms,
    gain = 0.05,
    attack = 0.05,
    cutoff,
    ...place
  }: Place & { freqs: readonly number[]; ms: number; gain?: number; attack?: number; cutoff: readonly [number, number, number] },
): void {
  const when = r.at.currentTime + (place.start ?? 0) / 1000
  const length = ms / 1000
  const [from, peak, end] = cutoff

  const filter = r.at.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = 0.9
  filter.frequency.setValueAtTime(from, when)
  filter.frequency.exponentialRampToValueAtTime(peak, when + Math.min(0.25, length / 3))
  filter.frequency.exponentialRampToValueAtTime(end, when + length)

  const level = envelope(r, when, length, gain, attack)
  filter.connect(level)
  route(r, level, place)

  for (const freq of freqs) {
    for (const detune of [-9, 9]) {
      const oscillator = r.at.createOscillator()
      oscillator.type = 'sawtooth'
      oscillator.frequency.value = freq
      oscillator.detune.value = detune
      oscillator.connect(filter)
      oscillator.start(when)
      oscillator.stop(when + length + 0.05)
    }
  }
}

/** The key going in and the dial turning: a heavy clunk, the ratchet of the dial, and the clank as it stops. */
export function playUnlock(): void {
  const r = audio()
  if (r === null) return

  thump(r, { from: 140, to: 50, ms: 200, gain: 0.45 })
  metal(r, { freq: 240, ms: 380, gain: 0.13, send: 0.15 })
  noise(r, { ms: 30, gain: 0.12, filter: { type: 'bandpass', from: 2600, q: 2 } })

  for (let notch = 0; notch < 6; notch++) {
    click(r, { start: 110 + notch * 44, freq: 2500 + notch * 110, gain: 0.045 + notch * 0.006 })
  }

  metal(r, { start: 430, freq: 330, ms: 480, gain: 0.13, send: 0.25 })
  thump(r, { start: 430, from: 110, to: 48, ms: 160, gain: 0.32 })
}

/** The latches going, one each side, and the seal giving with a long hiss. */
export function playLatches(): void {
  const r = audio()
  if (r === null) return

  metal(r, { freq: 520, ms: 320, gain: 0.12, pan: -0.6, send: 0.2 })
  click(r, { freq: 2800, gain: 0.07, pan: -0.6 })
  metal(r, { start: 50, freq: 490, ms: 320, gain: 0.12, pan: 0.6, send: 0.2 })
  click(r, { start: 50, freq: 2600, gain: 0.07, pan: 0.6 })

  thump(r, { start: 40, from: 85, to: 38, ms: 320, gain: 0.3 })
  noise(r, { start: 40, ms: 950, gain: 0.11, attack: 0.012, filter: { type: 'bandpass', from: 7200, to: 1600, q: 0.8 }, send: 0.35 })
}

/**
 * The screen coming on, as an old set does: the deep thump of the tube, the
 * buzz of the coil, a crackle of static, and the thin whine that stays.
 */
export function playPowerOn(): void {
  const r = audio()
  if (r === null) return

  thump(r, { from: 64, to: 32, ms: 760, gain: 0.45, send: 0.2 })
  tone(r, { shape: 'sawtooth', from: 60, ms: 460, gain: 0.07, filter: { from: 1100, to: 110 } })
  for (let crack = 0; crack < 8; crack++) {
    noise(r, { start: Math.random() * 280, ms: 6 + Math.random() * 12, gain: 0.04 + Math.random() * 0.05, filter: { type: 'highpass', from: 3200 } })
  }
  tone(r, { start: 60, from: 7600, to: 7820, ms: 1100, gain: 0.006 })
}

/**
 * What the reel runs over, for as long as it runs: a low drone whose filter
 * opens as the reel slows, pulsing faster towards the end, and a rush of air
 * rising under the last of it — the room holding its breath. It stops dead as
 * the reel does.
 */
export function playSpinBed(ms: number): void {
  const r = audio()
  if (r === null) return

  const when = r.at.currentTime
  const length = ms / 1000

  const filter = r.at.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = 3
  filter.frequency.setValueAtTime(160, when)
  filter.frequency.exponentialRampToValueAtTime(1400, when + length)

  const level = r.at.createGain()
  level.gain.setValueAtTime(0.0001, when)
  level.gain.exponentialRampToValueAtTime(0.05, when + 0.5)
  level.gain.setValueAtTime(0.05, when + length - 0.12)
  level.gain.exponentialRampToValueAtTime(0.0001, when + length)

  // The pulse: the drone nodding, slow at first and quicker as the reel crawls.
  // A gain of its own after the level, so it only ever scales what is there.
  const nodding = r.at.createGain()
  nodding.gain.value = 1
  const pulse = r.at.createOscillator()
  pulse.frequency.setValueAtTime(1.6, when)
  pulse.frequency.exponentialRampToValueAtTime(6.5, when + length)
  const depth = r.at.createGain()
  depth.gain.value = 0.4
  pulse.connect(depth).connect(nodding.gain)

  filter.connect(level).connect(nodding)
  route(r, nodding, { send: 0.3 })

  const drones = [
    { freq: 55, detune: -7 },
    { freq: 55, detune: 7 },
    { freq: 82.4, detune: 0 },
  ]
  const oscillators = drones.map(({ freq, detune }) => {
    const oscillator = r.at.createOscillator()
    oscillator.type = 'sawtooth'
    oscillator.frequency.value = freq
    oscillator.detune.value = detune
    oscillator.connect(filter)
    return oscillator
  })
  for (const oscillator of [...oscillators, pulse]) {
    oscillator.start(when)
    oscillator.stop(when + length + 0.05)
  }

  tone(r, { from: 55, ms, gain: 0.06, attack: 0.5 })
  noise(r, { start: ms - 1700, ms: 1700, gain: 0.05, swell: true, filter: { type: 'bandpass', from: 500, to: 5200, q: 1.2 }, send: 0.4 })
}

/** One card crossing the marker: a flapper catching — grit, a short ring and a knock. */
export function playReelTick(): void {
  const r = audio()
  if (r === null) return
  click(r, { freq: 3100 + Math.random() * 200, gain: 0.06 })
}

/**
 * The reel coming to rest — a heavy catch — and then, through the beat before
 * the card comes out, a swell of air drawn in towards it.
 */
export function playLanded(beforeReveal: number): void {
  const r = audio()
  if (r === null) return

  thump(r, { from: 100, to: 44, ms: 260, gain: 0.42 })
  metal(r, { freq: 180, ms: 520, gain: 0.12, send: 0.3 })
  noise(r, { start: 40, ms: Math.max(60, beforeReveal - 40), gain: 0.09, swell: true, filter: { type: 'highpass', from: 600, to: 3200 }, send: 0.2 })
}

/** The chord under the card, on A, filling out quarter by quarter. */
const CHORDS: Record<ChestQuarter, readonly number[]> = {
  1: [1, 1.5, 2],
  2: [1, 1.5, 2, 3],
  3: [1, 1.25, 1.5, 2, 3],
  4: [1, 1.25, 1.5, 1.875, 2, 2.5, 3],
}

/** The bells over it, from the second quarter up, rising. */
const BELLS: Record<ChestQuarter, readonly number[]> = {
  1: [],
  2: [2, 3],
  3: [2, 2.5, 3, 4],
  4: [2, 2.5, 3, 3.75, 4, 5, 6, 8],
}

/**
 * The card coming out: a boom with a rush of air through it and a strike of
 * metal, a swept chord taller and longer for a higher quarter of the jackpot,
 * bells rising from the second quarter up, and for the top quarter a second hit
 * and a long shimmer.
 */
export function playReveal(quarter: ChestQuarter): void {
  const r = audio()
  if (r === null) return
  const rank = quarter - 1

  thump(r, { from: 92, to: 28, ms: 900 + rank * 250, gain: 0.55, send: 0.2 })
  noise(r, { ms: 750, gain: 0.2, filter: { type: 'lowpass', from: 9000, to: 260, q: 0.5 }, send: 0.6 })
  metal(r, { freq: 140, ms: 1000, gain: 0.1, send: 0.5 })

  pad(r, {
    freqs: CHORDS[quarter].map((step) => 110 * step),
    ms: 2200 + rank * 700,
    gain: 0.045 + rank * 0.01,
    cutoff: [260, 1600 + rank * 900, 320],
    send: 0.55,
  })

  for (const [index, step] of BELLS[quarter].entries()) {
    bell(r, { start: 140 + index * 75, freq: 220 * step, gain: 0.05, pan: index % 2 === 0 ? -0.35 : 0.35, send: 0.5 })
  }

  if (quarter === 4) {
    thump(r, { start: 340, from: 80, to: 30, ms: 900, gain: 0.45, send: 0.3 })
    noise(r, { start: 200, ms: 2600, gain: 0.04, attack: 0.6, filter: { type: 'bandpass', from: 6000, to: 9000, q: 2 }, send: 0.8 })
  }
}

/** One step of the counting: a counter's wheel clicking over, a shade higher each time, settling with a catch. */
export function playTick(through: number): void {
  const r = audio()
  if (r === null) return
  click(r, { freq: 2000 + through * 1100, gain: 0.04 })
  if (through === 1) metal(r, { freq: 620, ms: 260, gain: 0.05, send: 0.3 })
}

/** A press that got nothing: the lock refusing, twice, with a dull buzz, and going nowhere. */
export function playRefusal(): void {
  const r = audio()
  if (r === null) return

  thump(r, { from: 110, to: 60, ms: 160, gain: 0.32 })
  metal(r, { freq: 160, ms: 220, gain: 0.09 })
  thump(r, { start: 130, from: 100, to: 55, ms: 160, gain: 0.26 })
  metal(r, { start: 130, freq: 150, ms: 220, gain: 0.07 })
  tone(r, { shape: 'sawtooth', from: 73, ms: 280, gain: 0.06, filter: { from: 320 } })
}
