import { MAX_ASSISTANT_MESSAGES, type AssistantMessage } from '../core'
import type { AssistantDevice } from './assistantDeviceRepository'
import { isRecord } from './plainData'

/**
 * The saved shape of what the assistant keeps on this device (STORE-69). Its
 * own version, apart from everything else's. Bump this whenever the shape
 * below changes, and upgrade on reading.
 *
 * - 1: the key, and the last answer with the question it was given to.
 * - 2: the key, and the conversation (AI-11).
 */
export const ASSISTANT_DEVICE_SCHEMA_VERSION = 2

export interface StoredAssistantDevice {
  version: number
  apiKey: string | null
  messages: readonly AssistantMessage[]
}

/** What to save: nothing at all for a device with no key and no conversation, as it starts. */
export function toStoredAssistantDevice(device: AssistantDevice): StoredAssistantDevice | null {
  if (device.apiKey === null && device.messages.length === 0) return null
  return { version: ASSISTANT_DEVICE_SCHEMA_VERSION, apiKey: device.apiKey, messages: device.messages }
}

/**
 * What was saved, in today's shape, or null when it cannot be trusted — an
 * unknown version, or a key of the wrong shape. A conversation that cannot be
 * read is let go of on its own: the key beside it is still good. A version 1
 * answer becomes a conversation of one question and its answer.
 */
export function readAssistantDevice(data: unknown): AssistantDevice | null {
  if (!isRecord(data) || (data.version !== ASSISTANT_DEVICE_SCHEMA_VERSION && data.version !== 1)) return null

  const { apiKey } = data
  if (apiKey !== null && (typeof apiKey !== 'string' || apiKey.trim() === '')) return null
  const messages = data.version === 1 ? fromAnswer(data.answer) : readMessages(data.messages)
  return { apiKey, messages }
}

function readMessages(data: unknown): AssistantMessage[] {
  if (!Array.isArray(data)) return []
  const messages: AssistantMessage[] = []
  for (const item of data as unknown[]) {
    if (!isRecord(item)) return []
    const { role, text, at } = item
    if ((role !== 'user' && role !== 'model') || typeof text !== 'string' || typeof at !== 'string') return []
    messages.push({ role, text, at })
  }
  return messages.slice(-MAX_ASSISTANT_MESSAGES)
}

/** Version 1's last answer, as the turn it was: an empty question was asking what to do next. */
function fromAnswer(data: unknown): AssistantMessage[] {
  if (!isRecord(data)) return []
  const { question, text, askedAt } = data
  if (typeof question !== 'string' || typeof text !== 'string' || typeof askedAt !== 'string') return []
  return [
    { role: 'user', text: question === '' ? 'What should I do next?' : question, at: askedAt },
    { role: 'model', text, at: askedAt },
  ]
}
