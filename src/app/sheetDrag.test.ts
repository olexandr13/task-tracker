import { describe, expect, it } from 'vitest'
import { closesSheet, SHEET_CLOSE_DISTANCE, SHEET_CLOSE_SPEED, SHEET_TAP_SLOP, sheetPull } from './sheetDrag'

describe('sheetPull', () => {
  it('follows a finger down', () => {
    expect(sheetPull(40)).toBe(40)
  })

  it('does not rise above where the sheet rests', () => {
    expect(sheetPull(-40)).toBe(0)
  })
})

describe('closesSheet', () => {
  const tall = 600

  it('settles back from a short, slow pull', () => {
    expect(closesSheet(SHEET_CLOSE_DISTANCE - 1, tall, 0)).toBe(false)
  })

  it('closes from a pull far enough down', () => {
    expect(closesSheet(SHEET_CLOSE_DISTANCE, tall, 0)).toBe(true)
  })

  it('closes a short sheet from a third of its height', () => {
    expect(closesSheet(60, 180, 0)).toBe(true)
    expect(closesSheet(59, 180, 0)).toBe(false)
  })

  it('asks for the whole distance of a sheet whose height is not known', () => {
    expect(closesSheet(SHEET_CLOSE_DISTANCE - 1, 0, 0)).toBe(false)
    expect(closesSheet(SHEET_CLOSE_DISTANCE, 0, 0)).toBe(true)
  })

  it('closes from a quick flick, however short', () => {
    expect(closesSheet(20, tall, SHEET_CLOSE_SPEED)).toBe(true)
  })

  it('never closes from a tap, however fast it lands', () => {
    expect(closesSheet(SHEET_TAP_SLOP - 1, tall, 5)).toBe(false)
  })
})
