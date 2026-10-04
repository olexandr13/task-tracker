import { useEffect, useRef } from 'react'
import type { CaseQuarter } from '../../core'
import { CASE_THROWN } from '../caseTiming'
import { CASE_TONES } from '../caseTones'

/** What comes off the card, and how much of it, by which quarter of the jackpot it came to. */
const AMOUNTS: Record<CaseQuarter, { readonly sparks: number; readonly embers: number; readonly shards: number }> = {
  1: { sparks: 18, embers: 14, shards: 0 },
  2: { sparks: 28, embers: 22, shards: 0 },
  3: { sparks: 40, embers: 30, shards: 16 },
  4: { sparks: 72, embers: 56, shards: 40 },
}

interface Particle {
  readonly kind: 'spark' | 'ember' | 'shard'
  x: number
  y: number
  vx: number
  vy: number
  /** How far round a shard has turned, and how fast it turns; an ember's flicker. */
  turn: number
  readonly turning: number
  readonly size: number
  age: number
  readonly lifespan: number
  readonly hue: number
}

/** Where everything comes from, as a share of the canvas: the card, in the middle of the cabinet. */
const ORIGIN = { x: 0.5, y: 0.5 }

/** A number between two. */
function between(low: number, high: number): number {
  return low + Math.random() * (high - low)
}

/**
 * Everything thrown off the card as it comes out of the screen (CHST-14),
 * drawn on a canvas so that it can be thrown properly: **sparks** that streak
 * out every way and are gone in half a second, as off a grinder; **embers** that
 * drift up and flicker, as off anything burning in a world like this one; and,
 * for the upper half of the jackpot, **shards** in the card's own colour that
 * tumble and fall.
 * Each is drawn added to what is under it rather than over it, so where they
 * cross they brighten, as light does.
 *
 * Played once each time `play` changes, and gone when the last of it has died.
 * A canvas that cannot be drawn on — a test environment has none — throws
 * nothing, and the opening goes on without it.
 */
export function CaseBurst({ quarter, play }: { quarter: CaseQuarter | null; play: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (play === 0 || quarter === null) return
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
    // Everything is measured against the canvas, so a phone's card throws as
    // far, relative to itself, as a wide screen's does.
    const unit = Math.min(width, height) / 100
    const origin = { x: width * ORIGIN.x, y: height * ORIGIN.y }
    const tone = CASE_TONES[quarter]
    const amounts = AMOUNTS[quarter]
    const rainbow = quarter === 4

    const particles: Particle[] = []

    for (let index = 0; index < amounts.sparks; index++) {
      const angle = between(0, Math.PI * 2)
      const speed = between(2.6, 5.4) * unit
      particles.push({
        kind: 'spark',
        x: origin.x + Math.cos(angle) * 6 * unit,
        y: origin.y + Math.sin(angle) * 8 * unit,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        turn: 0,
        turning: 0,
        size: between(0.25, 0.5) * unit,
        age: -between(0, CASE_THROWN.spark.wait),
        lifespan: between(...CASE_THROWN.spark.life),
        hue: between(0, 360),
      })
    }

    for (let index = 0; index < amounts.embers; index++) {
      particles.push({
        kind: 'ember',
        x: origin.x + between(-26, 26) * unit,
        y: origin.y + between(-10, 24) * unit,
        vx: between(-0.25, 0.25) * unit,
        vy: -between(0.25, 0.7) * unit,
        turn: between(0, Math.PI * 2),
        turning: between(0.12, 0.3),
        size: between(0.35, 0.9) * unit,
        age: -between(0, CASE_THROWN.ember.wait),
        lifespan: between(...CASE_THROWN.ember.life),
        hue: between(0, 360),
      })
    }

    for (let index = 0; index < amounts.shards; index++) {
      const angle = -Math.PI / 2 + between(-1.3, 1.3)
      const speed = between(1.8, 3.4) * unit
      particles.push({
        kind: 'shard',
        x: origin.x + between(-8, 8) * unit,
        y: origin.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        turn: between(0, Math.PI),
        turning: between(0.08, 0.22) * (Math.random() < 0.5 ? -1 : 1),
        size: between(1.1, 2.1) * unit,
        age: -between(2, CASE_THROWN.shard.wait),
        lifespan: between(...CASE_THROWN.shard.life),
        hue: between(0, 360),
      })
    }

    const gravity = 0.09 * unit

    function step(particle: Particle, frames: number): void {
      particle.age += frames
      if (particle.age < 0) return
      particle.turn += particle.turning * frames

      if (particle.kind === 'spark') {
        // Off a grinder: fast, slowing hard, dropping a little as it goes.
        const drag = Math.pow(0.9, frames)
        particle.vx *= drag
        particle.vy = particle.vy * drag + 0.04 * unit * frames
      } else if (particle.kind === 'ember') {
        // Heat carries it up, wandering as it goes.
        particle.vx += Math.sin(particle.turn) * 0.012 * unit * frames
        particle.vy -= 0.004 * unit * frames
      } else {
        particle.vx *= Math.pow(0.985, frames)
        particle.vy += gravity * frames
      }

      particle.x += particle.vx * frames
      particle.y += particle.vy * frames
    }

    /** How much of a particle is left to see: whole, then fading over its last third. */
    function presence(particle: Particle): number {
      if (particle.age < 0) return 0
      const left = particle.lifespan - particle.age
      return Math.max(0, Math.min(1, left / (particle.lifespan * 0.34), particle.age / 3))
    }

    function colourOf(particle: Particle, lightness: number): string {
      return rainbow ? `hsl(${String(Math.round(particle.hue))} 95% ${String(lightness)}%)` : tone.light
    }

    function drawSpark(particle: Particle, alpha: number): void {
      if (context === null) return
      // A streak along the way it is going, longer the faster it goes.
      const tail = 3.2
      context.globalAlpha = alpha
      context.strokeStyle = particle.age < 8 ? '#fff' : colourOf(particle, 74)
      context.lineWidth = particle.size
      context.lineCap = 'round'
      context.beginPath()
      context.moveTo(particle.x, particle.y)
      context.lineTo(particle.x - particle.vx * tail, particle.y - particle.vy * tail)
      context.stroke()
    }

    function drawEmber(particle: Particle, alpha: number): void {
      if (context === null) return
      const flicker = 0.55 + 0.45 * Math.sin(particle.turn * 4)
      const r = particle.size * (0.8 + flicker * 0.4)
      const glow = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, r * 4)
      glow.addColorStop(0, rainbow ? colourOf(particle, 70) : '#ffd08a')
      glow.addColorStop(0.4, rainbow ? colourOf(particle, 55) : tone.light)
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
      context.globalAlpha = alpha * flicker
      context.fillStyle = glow
      context.beginPath()
      context.arc(particle.x, particle.y, r * 4, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = '#fff7e6'
      context.beginPath()
      context.arc(particle.x, particle.y, r * 0.6, 0, Math.PI * 2)
      context.fill()
    }

    function drawShard(particle: Particle, alpha: number): void {
      if (context === null) return
      const r = particle.size
      const facing = 0.25 + 0.75 * Math.abs(Math.cos(particle.turn))

      context.save()
      context.globalAlpha = alpha
      context.translate(particle.x, particle.y)
      context.rotate(particle.turn * 0.6)
      context.scale(facing, 1)

      context.fillStyle = rainbow ? colourOf(particle, 62) : tone.deep
      context.beginPath()
      context.moveTo(0, -r * 1.3)
      context.lineTo(r * 0.9, -r * 0.1)
      context.lineTo(r * 0.2, r * 1.2)
      context.lineTo(-r * 0.8, r * 0.3)
      context.closePath()
      context.fill()

      context.fillStyle = rainbow ? colourOf(particle, 85) : tone.light
      context.beginPath()
      context.moveTo(0, -r * 1.3)
      context.lineTo(r * 0.9, -r * 0.1)
      context.lineTo(0, 0)
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
      context.globalCompositeOperation = 'lighter'
      let alive = 0

      for (const particle of particles) {
        step(particle, frames)
        const alpha = presence(particle)
        if (particle.age < particle.lifespan) alive += 1
        if (alpha <= 0) continue

        if (particle.kind === 'spark') drawSpark(particle, alpha)
        else if (particle.kind === 'ember') drawEmber(particle, alpha)
        else drawShard(particle, alpha)
      }

      context.globalAlpha = 1
      context.globalCompositeOperation = 'source-over'
      if (alive > 0) frame = requestAnimationFrame(tick)
      else context.clearRect(0, 0, width, height)
    }

    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      context.clearRect(0, 0, width, height)
    }
  }, [play, quarter])

  return (
    <canvas ref={canvas} aria-hidden="true" data-case-burst="" className="pointer-events-none absolute inset-0 z-[4] size-full" />
  )
}
