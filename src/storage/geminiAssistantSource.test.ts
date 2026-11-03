import { afterEach, describe, expect, it, vi } from 'vitest'
import { AssistantError } from './assistantSource'
import { geminiAssistantSource } from './geminiAssistantSource'

/* Asking Gemini (AI-2, AI-8 in wiki/assistant.md). */

afterEach(() => {
  vi.unstubAllGlobals()
})

function reply(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

const HI = [{ role: 'user', text: 'hi' }] as const

const ANSWER = { candidates: [{ content: { parts: [{ text: 'Thinking', thought: true }, { text: '- Walk\n' }, { text: '- Read' }] } }] }

async function failure(promise: Promise<unknown>): Promise<AssistantError> {
  try {
    await promise
  } catch (error) {
    if (error instanceof AssistantError) return error
    throw error
  }
  throw new Error('It answered.')
}

describe('geminiAssistantSource', () => {
  it('sends the key in a header, the instructions apart, and the conversation turn by turn (AI-11)', async () => {
    const fetch = vi.fn().mockResolvedValue(reply(200, ANSWER))
    vi.stubGlobal('fetch', fetch)

    const conversation = [
      { role: 'user', text: 'What next?' },
      { role: 'model', text: '- Walk' },
      { role: 'user', text: 'Why?' },
    ] as const
    expect(await geminiAssistantSource.ask('key-1', 'Be brief.', conversation)).toBe('- Walk\n- Read')

    const [url, init] = fetch.mock.calls[0] as [string, RequestInit]
    expect(url).not.toContain('key-1')
    expect(init.headers).toMatchObject({ 'X-goog-api-key': 'key-1' })
    expect(JSON.parse(init.body as string)).toEqual({
      systemInstruction: { parts: [{ text: 'Be brief.' }] },
      contents: [
        { role: 'user', parts: [{ text: 'What next?' }] },
        { role: 'model', parts: [{ text: '- Walk' }] },
        { role: 'user', parts: [{ text: 'Why?' }] },
      ],
    })
  })

  it('says the key was refused, asking no other model', async () => {
    const fetch = vi.fn().mockResolvedValue(reply(400, { error: { message: 'API key not valid. Please pass a valid API key.' } }))
    vi.stubGlobal('fetch', fetch)

    const error = await failure(geminiAssistantSource.ask('bad', '', HI))

    expect(fetch).toHaveBeenCalledOnce()
    expect(error.failure).toBe('key')
    expect(error.message).toBe('gemini-flash-latest: API key not valid. Please pass a valid API key.')
  })

  it('asks Flash first, and Flash-Lite when Flash is busy', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(reply(503, { error: { message: 'High demand.' } })).mockResolvedValueOnce(reply(200, ANSWER))
    vi.stubGlobal('fetch', fetch)

    expect(await geminiAssistantSource.ask('k', '', HI)).toBe('- Walk\n- Read')
    expect(fetch.mock.calls.map(([url]) => String(url).replace(/^.*models\//u, ''))).toEqual([
      'gemini-flash-latest:generateContent',
      'gemini-flash-lite-latest:generateContent',
    ])
  })

  it('asks Flash-Lite when Flash is too slow', async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('signal timed out', 'TimeoutError'))
      .mockResolvedValueOnce(reply(200, ANSWER))
    vi.stubGlobal('fetch', fetch)

    expect(await geminiAssistantSource.ask('k', '', HI)).toBe('- Walk\n- Read')
  })

  it('says it is busy when every model is, a used-up quota being the same', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(reply(503, {})).mockResolvedValueOnce(reply(429, { error: { message: 'Quota exceeded' } })),
    )

    const error = await failure(geminiAssistantSource.ask('k', '', HI))

    expect(error.failure).toBe('busy')
    expect(error.message).toBe('gemini-flash-lite-latest: Quota exceeded')
  })

  it('says it was too slow when no model answered in time, rather than blaming the connection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('signal timed out', 'TimeoutError')))
    expect((await failure(geminiAssistantSource.ask('k', '', HI))).failure).toBe('slow')
  })

  it('says it could not be reached when nothing came back', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    expect((await failure(geminiAssistantSource.ask('k', '', HI))).failure).toBe('offline')
  })

  it('says why an answer was withheld', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(reply(200, { promptFeedback: { blockReason: 'SAFETY' } })))

    const error = await failure(geminiAssistantSource.ask('k', '', HI))

    expect(error.failure).toBe('refused')
    expect(error.message).toContain('SAFETY')
  })
})
