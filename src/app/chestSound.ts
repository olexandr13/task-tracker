import type { ChestTier } from '../core'

/**
 * The noise a chest makes, made up on the spot rather than played from a file
 * (CHST-19).
 *
 * Every sound here is a few oscillators and a burst of noise through the Web
 * Audio API: no files to download, nothing to license, and a lock that rattles
 * harder each time costs a number rather than a second recording. The app has no
 * other sound, and this is the only place it has any.
 *
 * The context is made on the **first opening** and not before: a browser will
 * not start one outside a gesture, and a page that asks on load gets a warning
 * in the console for its trouble. Everything is guarded, so a browser without
 * Web Audio — or a test environment, which has none — simply makes no noise.
 */

let context: AudioContext | null = null

/** The context, made the first time something is played, or null where there is none to make. */
function audio(): AudioContext | null {
  if (context !== null) return context
  if (typeof AudioContext !== 'function') return null

  try {
    context = new AudioContext()
  } catch {
    return null
  }
  return context
}

/** A tone with an envelope: the whole of how everything below is built. */
function tone(
  at: AudioContext,
  { shape = 'sine', from, to = from, start = 0, ms, gain = 0.2 }: {
    shape?: OscillatorType
    from: number
    to?: number
    start?: number
    ms: number
    gain?: number
  },
): void {
  const when = at.currentTime + start / 1000
  const length = ms / 1000

  const oscillator = at.createOscillator()
  oscillator.type = shape
  oscillator.frequency.setValueAtTime(from, when)
  if (to !== from) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), when + length)

  const level = at.createGain()
  level.gain.setValueAtTime(0, when)
  level.gain.linearRampToValueAtTime(gain, when + Math.min(0.012, length / 3))
  level.gain.exponentialRampToValueAtTime(0.0001, when + length)

  oscillator.connect(level).connect(at.destination)
  oscillator.start(when)
  oscillator.stop(when + length + 0.02)
}

/** A burst of filtered noise: wood, metal, a lid. */
function rattle(at: AudioContext, { start = 0, ms, gain = 0.2, colour = 900 }: { start?: number; ms: number; gain?: number; colour?: number }): void {
  const when = at.currentTime + start / 1000
  const length = ms / 1000
  const frames = Math.max(1, Math.floor(at.sampleRate * length))

  const buffer = at.createBuffer(1, frames, at.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let frame = 0; frame < frames; frame++) {
    samples[frame] = (Math.random() * 2 - 1) * (1 - frame / frames)
  }

  const source = at.createBufferSource()
  source.buffer = buffer

  const band = at.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = colour
  band.Q.value = 1.2

  const level = at.createGain()
  level.gain.setValueAtTime(gain, when)
  level.gain.exponentialRampToValueAtTime(0.0001, when + length)

  source.connect(band).connect(level).connect(at.destination)
  source.start(when)
}

/** The key turning: one short metallic click. */
export function playKey(): void {
  const at = audio()
  if (at === null) return
  rattle(at, { ms: 70, gain: 0.25, colour: 2600 })
  tone(at, { shape: 'square', from: 520, to: 300, ms: 70, gain: 0.08 })
}

/** One rattle of the lock, louder and lower the further in it is (1, 2, 3). */
export function playRattle(which: number): void {
  const at = audio()
  if (at === null) return
  rattle(at, { ms: 140 + which * 40, gain: 0.08 + which * 0.05, colour: 1100 - which * 220 })
  tone(at, { shape: 'triangle', from: 150 - which * 20, to: 90, ms: 120, gain: 0.05 + which * 0.03 })
}

/** The held beat: a hum that rises while the chest goes almost still. */
export function playHeld(ms: number): void {
  const at = audio()
  if (at === null) return
  tone(at, { shape: 'sawtooth', from: 110, to: 320, ms, gain: 0.05 })
}

/** How many coins ring out after the lid, by how rich the opening was. */
const COINS: Record<ChestTier, number> = { pinch: 5, handful: 9, haul: 14, jackpot: 24 }

/**
 * The lid: a rush of air, a bright chord taller for a richer tier, and the
 * coins coming down after it — each a short high ring at a pitch of its own,
 * spread over the second the canvas throws them for.
 */
export function playBurst(tier: ChestTier): void {
  const at = audio()
  if (at === null) return

  rattle(at, { ms: 320, gain: 0.26, colour: 2400 })
  tone(at, { shape: 'sine', from: 90, to: 46, ms: 380, gain: 0.32 })

  // A major chord, with the fifth and the octaves above it added as the tier climbs.
  const root = 392
  const steps: Record<ChestTier, readonly number[]> = {
    pinch: [1, 1.25],
    handful: [1, 1.25, 1.5],
    haul: [1, 1.25, 1.5, 2],
    jackpot: [1, 1.25, 1.5, 2, 2.5, 3],
  }
  for (const [index, step] of steps[tier].entries()) {
    tone(at, { shape: 'triangle', from: root * step, start: index * 45, ms: 700, gain: 0.1 })
  }

  for (let coin = 0; coin < COINS[tier]; coin++) {
    const pitch = 2200 + Math.random() * 1800
    tone(at, { shape: 'sine', from: pitch, to: pitch * 0.98, start: 140 + coin * (900 / COINS[tier]) + Math.random() * 40, ms: 120, gain: 0.035 })
  }
}

/** One tick of the counting, climbing as the number does. */
export function playTick(through: number): void {
  const at = audio()
  if (at === null) return
  tone(at, { shape: 'square', from: 660 + through * 520, ms: 50, gain: 0.05 })
}

/** A press that got nothing: the lock refusing, twice, and going nowhere. */
export function playRefusal(): void {
  const at = audio()
  if (at === null) return
  rattle(at, { ms: 90, gain: 0.16, colour: 420 })
  rattle(at, { start: 120, ms: 90, gain: 0.12, colour: 380 })
}
