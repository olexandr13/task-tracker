import { useEffect, useRef } from 'react'
import type { ChestTier } from '../../core'
import { CHEST_THROWN } from '../chestTiming'
import { CHEST_TONES } from '../chestTones'

/** What comes out of the lid, and how much of it, by how rich the opening was. */
const AMOUNTS: Record<ChestTier, { readonly coins: number; readonly sparks: number; readonly gems: number }> = {
  pinch: { coins: 14, sparks: 22, gems: 0 },
  handful: { coins: 26, sparks: 34, gems: 0 },
  haul: { coins: 44, sparks: 46, gems: 10 },
  jackpot: { coins: 84, sparks: 70, gems: 24 },
}

interface Particle {
  readonly kind: 'coin' | 'spark' | 'gem'
  x: number
  y: number
  vx: number
  vy: number
  /** How far round a coin has turned: its face is as wide as the cosine of it. */
  turn: number
  /** How fast it turns, which a landing takes most of out of it. */
  turning: number
  readonly tilt: number
  readonly size: number
  age: number
  readonly lifespan: number
  bounces: number
  readonly hue: number
}

/** Where the light comes from, as a share of the canvas: the mouth of the chest. */
const MOUTH = { x: 0.5, y: 0.53 }

/** Where the coins land: the floor the chest stands on. */
const FLOOR = 0.83

/** A number between two. */
function between(low: number, high: number): number {
  return low + Math.random() * (high - low)
}

/**
 * Everything thrown out of the lid as it goes (CHST-14), drawn on a canvas so
 * that it can be thrown properly: **coins** that tumble as they fly, fall under
 * gravity and bounce once on the floor before they fade; **sparks** that burst
 * outwards in every direction and drift up as they die; and, for a haul or
 * better, **gems** in the tier's own colour. Each kind is drawn added to what is
 * under it rather than over it, so where they cross they brighten, as light does.
 *
 * Played once each time `play` changes, and gone when the last of it has landed.
 * A canvas that cannot be drawn on — a test environment has none — throws
 * nothing, and the opening goes on without it.
 */
export function ChestBurst({ tier, play }: { tier: ChestTier | null; play: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (play === 0 || tier === null) return
    const element = canvas.current
    if (element === null) return
    const context = element.getContext('2d')
    if (context === null) return

    const box = element.getBoundingClientRect()
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    element.width = Math.round(box.width * ratio)
    element.height = Math.round(box.height * ratio)
    context.scale(ratio, ratio)

    const width = box.width
    const height = box.height
    // Everything is measured against the canvas, so a phone's chest throws as
    // far, relative to itself, as a wide screen's does.
    const unit = Math.min(width, height) / 100
    const origin = { x: width * MOUTH.x, y: height * MOUTH.y }
    const floor = height * FLOOR
    const tone = CHEST_TONES[tier]
    const amounts = AMOUNTS[tier]

    const particles: Particle[] = []

    for (let index = 0; index < amounts.coins; index++) {
      const angle = -Math.PI / 2 + between(-0.5, 0.5)
      const speed = between(2.0, 3.1) * unit
      particles.push({
        kind: 'coin',
        x: origin.x + between(-14, 14) * unit * 0.3,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        turn: between(0, Math.PI),
        turning: between(0.16, 0.34) * (Math.random() < 0.5 ? -1 : 1),
        tilt: between(-0.5, 0.5),
        size: between(2.1, 3.2) * unit,
        age: -between(0, CHEST_THROWN.coin.wait),
        lifespan: between(...CHEST_THROWN.coin.life),
        bounces: 0,
        hue: 0,
      })
    }

    for (let index = 0; index < amounts.sparks; index++) {
      const angle = between(0, Math.PI * 2)
      const speed = between(0.8, 3.4) * unit
      particles.push({
        kind: 'spark',
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - unit * 0.6,
        turn: between(0, Math.PI * 2),
        turning: between(0.2, 0.5),
        tilt: 0,
        size: between(0.7, 1.7) * unit,
        age: -between(0, CHEST_THROWN.spark.wait),
        lifespan: between(...CHEST_THROWN.spark.life),
        bounces: 0,
        hue: between(0, 360),
      })
    }

    for (let index = 0; index < amounts.gems; index++) {
      const angle = -Math.PI / 2 + between(-0.9, 0.9)
      const speed = between(1.8, 2.8) * unit
      particles.push({
        kind: 'gem',
        x: origin.x,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        turn: between(0, Math.PI),
        turning: between(0.05, 0.14) * (Math.random() < 0.5 ? -1 : 1),
        tilt: 0,
        size: between(1.6, 2.6) * unit,
        age: -between(4, CHEST_THROWN.gem.wait),
        lifespan: between(...CHEST_THROWN.gem.life),
        bounces: 0,
        hue: between(0, 360),
      })
    }

    // Strong enough that an arc reads as thrown rather than floated.
    const gravity = 0.11 * unit

    function step(particle: Particle, frames: number): void {
      particle.age += frames
      if (particle.age < 0) return
      particle.turn += particle.turning * frames

      if (particle.kind === 'spark') {
        // Sparks are light rather than metal: they slow in the air and drift up.
        const drag = Math.pow(0.93, frames)
        particle.vx *= drag
        particle.vy = particle.vy * drag - 0.012 * unit * frames
      } else {
        particle.vx *= Math.pow(0.985, frames)
        particle.vy += gravity * frames
      }

      particle.x += particle.vx * frames
      particle.y += particle.vy * frames

      if (particle.kind !== 'spark' && particle.y > floor && particle.vy > 0) {
        particle.y = floor
        particle.bounces += 1
        particle.vy *= particle.bounces === 1 ? -0.36 : 0
        particle.vx *= 0.55
        particle.turning *= 0.45
      }
    }

    /** How much of a particle is left to see: whole, then fading over its last quarter. */
    function presence(particle: Particle): number {
      if (particle.age < 0) return 0
      const left = particle.lifespan - particle.age
      return Math.max(0, Math.min(1, left / (particle.lifespan * 0.28), particle.age / 4))
    }

    function drawCoin(particle: Particle, alpha: number): void {
      if (context === null) return
      const face = Math.max(0.14, Math.abs(Math.cos(particle.turn)))
      const r = particle.size
      const w = r * face

      context.save()
      context.globalAlpha = alpha
      context.translate(particle.x, particle.y)
      context.rotate(particle.tilt)

      // The rim, seen edge-on as the coin turns.
      context.fillStyle = '#7a4d05'
      context.beginPath()
      context.ellipse(r * 0.08, 0, w, r, 0, 0, Math.PI * 2)
      context.fill()

      const gold = context.createLinearGradient(-w, -r, w, r)
      gold.addColorStop(0, '#fff7cf')
      gold.addColorStop(0.35, '#ffd34d')
      gold.addColorStop(0.7, '#d99a13')
      gold.addColorStop(1, '#9c6406')
      context.fillStyle = gold
      context.beginPath()
      context.ellipse(0, 0, w, r, 0, 0, Math.PI * 2)
      context.fill()

      if (face > 0.35) {
        context.strokeStyle = 'rgba(140, 86, 4, 0.55)'
        context.lineWidth = Math.max(0.6, r * 0.12)
        context.beginPath()
        context.ellipse(0, 0, w * 0.66, r * 0.66, 0, 0, Math.PI * 2)
        context.stroke()
      }

      // A catch of light, brightest when the coin faces straight out.
      context.globalAlpha = alpha * (0.35 + face * 0.55)
      context.fillStyle = '#ffffff'
      context.beginPath()
      context.ellipse(-w * 0.32, -r * 0.38, w * 0.26, r * 0.16, -0.5, 0, Math.PI * 2)
      context.fill()
      context.restore()
    }

    function drawSpark(particle: Particle, alpha: number): void {
      if (context === null) return
      const twinkle = 0.55 + 0.45 * Math.sin(particle.turn * 3)
      const r = particle.size * twinkle
      const colour = tier === 'jackpot' ? `hsl(${String(Math.round(particle.hue))} 95% 72%)` : tone.light

      context.save()
      context.globalAlpha = alpha
      context.translate(particle.x, particle.y)
      context.rotate(particle.turn * 0.2)

      const glow = context.createRadialGradient(0, 0, 0, 0, 0, r * 3.2)
      glow.addColorStop(0, colour)
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      context.fillStyle = glow
      context.beginPath()
      context.arc(0, 0, r * 3.2, 0, Math.PI * 2)
      context.fill()

      // A four-pointed star: two thin diamonds across each other.
      context.fillStyle = '#ffffff'
      for (const turn of [0, Math.PI / 2]) {
        context.rotate(turn)
        context.beginPath()
        context.moveTo(0, -r * 2.2)
        context.lineTo(r * 0.32, 0)
        context.lineTo(0, r * 2.2)
        context.lineTo(-r * 0.32, 0)
        context.closePath()
        context.fill()
      }
      context.restore()
    }

    function drawGem(particle: Particle, alpha: number): void {
      if (context === null) return
      const r = particle.size
      const facing = 0.45 + 0.55 * Math.abs(Math.cos(particle.turn))
      const colour = tier === 'jackpot' ? `hsl(${String(Math.round(particle.hue))} 90% 66%)` : tone.deep

      context.save()
      context.globalAlpha = alpha
      context.translate(particle.x, particle.y)
      context.scale(facing, 1)

      context.fillStyle = colour
      context.beginPath()
      context.moveTo(0, -r * 1.25)
      context.lineTo(r, -r * 0.2)
      context.lineTo(0, r * 1.25)
      context.lineTo(-r, -r * 0.2)
      context.closePath()
      context.fill()

      context.fillStyle = 'rgba(255, 255, 255, 0.7)'
      context.beginPath()
      context.moveTo(0, -r * 1.25)
      context.lineTo(r, -r * 0.2)
      context.lineTo(0, -r * 0.05)
      context.closePath()
      context.fill()
      context.restore()
    }

    let frame = 0
    let last = performance.now()

    function tick(now: number): void {
      if (context === null) return
      // Measured in sixtieths of a second, so a fast screen throws no faster.
      const frames = Math.min(3, (now - last) / (1000 / 60))
      last = now

      context.clearRect(0, 0, width, height)
      let alive = 0

      for (const particle of particles) {
        step(particle, frames)
        const alpha = presence(particle)
        if (particle.age < particle.lifespan) alive += 1
        if (alpha <= 0) continue

        if (particle.kind === 'coin') {
          context.globalCompositeOperation = 'source-over'
          drawCoin(particle, alpha)
        } else {
          context.globalCompositeOperation = 'lighter'
          if (particle.kind === 'spark') drawSpark(particle, alpha)
          else drawGem(particle, alpha)
        }
      }

      context.globalCompositeOperation = 'source-over'
      if (alive > 0) frame = requestAnimationFrame(tick)
      else context.clearRect(0, 0, width, height)
    }

    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      context.clearRect(0, 0, width, height)
    }
  }, [play, tier])

  return (
    <canvas ref={canvas} aria-hidden="true" data-chest-burst="" className="pointer-events-none absolute inset-0 size-full" />
  )
}
