import type { AssistantMessage } from '../core'

/**
 * What the assistant keeps on this device (STORE-69): the key it is asked
 * with, and the conversation so far (AI-11).
 *
 * Both belong to the device rather than the account. The key is the owner's
 * own, for a service outside the app, and is never synced, backed up or
 * written into the app (AI-2): each device is given it by hand. The
 * conversation is kept beside it so the page opens where it was left, and
 * costs nothing to lose.
 */
export interface AssistantDevice {
  /** The Gemini API key, or null until one is given. */
  readonly apiKey: string | null
  /** The conversation, oldest first; empty for a new one. */
  readonly messages: readonly AssistantMessage[]
}

/** Nothing given, nothing asked: how every device starts. */
export const DEFAULT_ASSISTANT_DEVICE: AssistantDevice = { apiKey: null, messages: [] }

export interface AssistantDeviceRepository {
  load(): AssistantDevice
  save(device: AssistantDevice): void
  /** Calls `listener` when another window on this device saves it (STORE-61); returns how to stop. */
  subscribe(listener: () => void): () => void
}
