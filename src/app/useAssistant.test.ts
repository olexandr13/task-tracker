// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AssistantData, AssistantMessage } from '../core'
import { DEFAULT_ASSISTANT_DEVICE, type AssistantDevice, type AssistantDeviceRepository } from '../storage/assistantDeviceRepository'
import { AssistantError, type AssistantSource } from '../storage/assistantSource'
import { useAssistant } from './useAssistant'

/* Asking the assistant (AI-1, AI-2, AI-8, AI-11 in wiki/assistant.md; STORE-69 in wiki/storage.md). */

afterEach(cleanup)

const NOW = new Date(2026, 10, 3, 10, 0)
const DATA: AssistantData = { tasks: [], lists: [], goals: [], journal: [], activities: [], notes: [], rests: null }
const BEFORE: AssistantMessage[] = [
  { role: 'user', text: 'What next?', at: '2026-11-03T08:00:00.000Z' },
  { role: 'model', text: '- Walk', at: '2026-11-03T08:00:01.000Z' },
]

function repository(saved: AssistantDevice = DEFAULT_ASSISTANT_DEVICE) {
  const save = vi.fn<(device: AssistantDevice) => void>()
  const device: AssistantDeviceRepository = { load: () => saved, save, subscribe: () => () => {} }
  return { device, save }
}

function source(ask: AssistantSource['ask']) {
  return { ask: vi.fn(ask) }
}

describe('useAssistant', () => {
  it('asks nothing without a key, nor a blank question (AI-3)', async () => {
    const gemini = source(() => Promise.resolve('- Walk'))
    const keyless = renderHook(() => useAssistant(gemini, repository().device))
    await act(async () => { expect(await keyless.result.current.ask(DATA, 'Hi', NOW)).toBe(false) })
    const keyed = renderHook(() => useAssistant(gemini, repository({ apiKey: 'k', messages: [] }).device))
    await act(async () => { expect(await keyed.result.current.ask(DATA, '   ', NOW)).toBe(false) })

    expect(gemini.ask).not.toHaveBeenCalled()
  })

  it('sends the conversation with the new question, the data in the instructions, and keeps the answer (AI-4, AI-11)', async () => {
    const gemini = source(() => Promise.resolve('* Because it is short'))
    const { device, save } = repository({ apiKey: 'key-1', messages: BEFORE })
    const { result } = renderHook(() => useAssistant(gemini, device))

    await act(async () => { expect(await result.current.ask(DATA, ' Why? ', NOW)).toBe(true) })

    const [apiKey, instructions, sent] = gemini.ask.mock.calls[0] ?? []
    expect(apiKey).toBe('key-1')
    expect(instructions).toContain('Now: Tuesday 2026-11-03, 10:00.')
    expect(sent?.map((message) => message.text)).toEqual(['What next?', '- Walk', 'Why?'])
    expect(result.current.messages.map((message) => message.text)).toEqual(['What next?', '- Walk', 'Why?', '- Because it is short'])
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ apiKey: 'key-1' }))
  })

  it('shows the question as pending until its answer is in, and asks once for a second press', async () => {
    let answer: (text: string) => void = () => {}
    const gemini = source(() => new Promise((resolve) => { answer = resolve }))
    const { result } = renderHook(() => useAssistant(gemini, repository({ apiKey: 'k', messages: [] }).device))

    let first: Promise<boolean> = Promise.resolve(false)
    act(() => { first = result.current.ask(DATA, 'Plan my day', NOW) })
    expect(result.current.pending).toBe('Plan my day')
    expect(result.current.messages).toEqual([])
    await act(async () => { expect(await result.current.ask(DATA, 'Again', NOW)).toBe(false) })
    await act(async () => {
      answer('- Walk')
      await first
    })

    expect(gemini.ask).toHaveBeenCalledTimes(1)
    expect(result.current.pending).toBeNull()
    expect(result.current.messages).toHaveLength(2)
  })

  it('says why no answer came, leaving the conversation as it was (AI-8)', async () => {
    const gemini = source(() => Promise.reject(new AssistantError('key', 'API key not valid.')))
    const { result } = renderHook(() => useAssistant(gemini, repository({ apiKey: 'bad', messages: BEFORE }).device))

    await act(async () => { expect(await result.current.ask(DATA, 'Why?', NOW)).toBe(false) })

    expect(result.current.problem).toEqual({ failure: 'key', detail: 'API key not valid.' })
    expect(result.current.messages).toEqual(BEFORE)
  })

  it('starts a new chat, dropping an answer to the old one that comes after (AI-11)', async () => {
    let answer: (text: string) => void = () => {}
    const gemini = source(() => new Promise((resolve) => { answer = resolve }))
    const { result } = renderHook(() => useAssistant(gemini, repository({ apiKey: 'k', messages: BEFORE }).device))

    let first: Promise<boolean> = Promise.resolve(false)
    act(() => { first = result.current.ask(DATA, 'Why?', NOW) })
    act(() => { result.current.clear() })
    expect(result.current.messages).toEqual([])
    expect(result.current.pending).toBeNull()
    await act(async () => {
      answer('- Late')
      await first
    })

    expect(result.current.messages).toEqual([])
  })

  it('gives and takes away the key, a blank one being none (AI-2)', () => {
    const { device, save } = repository()
    const { result } = renderHook(() => useAssistant(source(() => Promise.resolve('')), device))

    act(() => { result.current.setKey('  key-1 ') })
    expect(result.current.apiKey).toBe('key-1')
    act(() => { result.current.setKey('   ') })
    expect(result.current.apiKey).toBeNull()
    expect(save).toHaveBeenLastCalledWith({ apiKey: null, messages: [] })
  })
})
