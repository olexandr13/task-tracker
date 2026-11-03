import { describe, expect, it } from 'vitest'
import { MAX_ASSISTANT_MESSAGES, type AssistantMessage } from '../core'
import { DEFAULT_ASSISTANT_DEVICE } from './assistantDeviceRepository'
import { ASSISTANT_DEVICE_SCHEMA_VERSION, readAssistantDevice, toStoredAssistantDevice } from './assistantDeviceSchema'

/* What the assistant keeps on this device (STORE-69 in wiki/storage.md, AI-2, AI-11 in wiki/assistant.md). */

const AT = '2026-11-03T10:00:00.000Z'
const CONVERSATION: AssistantMessage[] = [
  { role: 'user', text: 'Tonight?', at: AT },
  { role: 'model', text: '- Walk', at: AT },
]

describe('readAssistantDevice', () => {
  it('reads back what was saved', () => {
    const device = { apiKey: 'key-1234', messages: CONVERSATION }
    expect(readAssistantDevice(toStoredAssistantDevice(device))).toEqual(device)
  })

  it('saves nothing for a device with no key and no conversation', () => {
    expect(toStoredAssistantDevice(DEFAULT_ASSISTANT_DEVICE)).toBeNull()
  })

  it('keeps the conversation after the key is removed', () => {
    expect(readAssistantDevice(toStoredAssistantDevice({ apiKey: null, messages: CONVERSATION }))).toEqual({
      apiKey: null,
      messages: CONVERSATION,
    })
  })

  it('upgrades a version 1 answer into the turn it was, keeping the key', () => {
    expect(readAssistantDevice({ version: 1, apiKey: 'k', answer: { question: '', text: '- Walk', askedAt: AT } })).toEqual({
      apiKey: 'k',
      messages: [
        { role: 'user', text: 'What should I do next?', at: AT },
        { role: 'model', text: '- Walk', at: AT },
      ],
    })
    expect(readAssistantDevice({ version: 1, apiKey: 'k', answer: null })).toEqual({ apiKey: 'k', messages: [] })
  })

  it('does not trust a version it does not know, or a key that is not one', () => {
    expect(readAssistantDevice({ version: ASSISTANT_DEVICE_SCHEMA_VERSION + 1, apiKey: 'k', messages: [] })).toBeNull()
    expect(readAssistantDevice({ version: ASSISTANT_DEVICE_SCHEMA_VERSION, apiKey: 42, messages: [] })).toBeNull()
    expect(readAssistantDevice({ version: ASSISTANT_DEVICE_SCHEMA_VERSION, apiKey: '  ', messages: [] })).toBeNull()
    expect(readAssistantDevice('key')).toBeNull()
  })

  it('lets go of a conversation it cannot read, keeping the key', () => {
    const broken = [...CONVERSATION, { role: 'system', text: 'x', at: AT }]
    expect(readAssistantDevice({ version: ASSISTANT_DEVICE_SCHEMA_VERSION, apiKey: 'k', messages: broken })).toEqual({
      apiKey: 'k',
      messages: [],
    })
  })

  it('reads no more turns than are kept', () => {
    const long = Array.from({ length: MAX_ASSISTANT_MESSAGES + 4 }, (_, at) => ({ role: 'user', text: String(at), at: AT }))
    expect(readAssistantDevice({ version: ASSISTANT_DEVICE_SCHEMA_VERSION, apiKey: 'k', messages: long })?.messages).toHaveLength(
      MAX_ASSISTANT_MESSAGES,
    )
  })
})
