// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useLetterShortcut } from './useLetterShortcut'

/* Lone-letter shortcuts. UI ids refer to wiki/interface.md. */

afterEach(cleanup)

describe('useLetterShortcut', () => {
  it('calls onPress when the letter is pressed while enabled (UI-55)', () => {
    const onPress = vi.fn()
    renderHook(() => { useLetterShortcut('n', true, onPress) })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n' }))

    expect(onPress).toHaveBeenCalledOnce()
  })

  it('calls onPress for H while enabled (UI-56)', () => {
    const onPress = vi.fn()
    renderHook(() => { useLetterShortcut('h', true, onPress) })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }))

    expect(onPress).toHaveBeenCalledOnce()
  })

  it('calls onPress for R while enabled (UI-57)', () => {
    const onPress = vi.fn()
    renderHook(() => { useLetterShortcut('r', true, onPress) })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }))

    expect(onPress).toHaveBeenCalledOnce()
  })

  it('does nothing while disabled', () => {
    const onPress = vi.fn()
    renderHook(() => { useLetterShortcut('h', false, onPress) })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'h' }))

    expect(onPress).not.toHaveBeenCalled()
  })
})
