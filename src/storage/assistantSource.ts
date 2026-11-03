import type { AssistantMessage } from '../core'

/**
 * Where the assistant's answers come from (AI-1).
 *
 * An interface for the same reason `QuoteSource` is one: every call site talks
 * to this and never to `fetch` directly, so moving to another model or another
 * service is a new file here rather than a change in the UI.
 */
export interface AssistantSource {
  /**
   * The model's next turn in `messages`, which end on the owner's question,
   * told what it is for and what it knows by `instructions` and asked with
   * `apiKey`. Rejects with an `AssistantError` saying why it could not be had.
   */
  ask(apiKey: string, instructions: string, messages: readonly Pick<AssistantMessage, 'role' | 'text'>[]): Promise<string>
}

/**
 * Why no answer came (AI-8): the key refused, the service too busy or out of
 * quota, no answer in time, nothing reachable, or an answer it would not or
 * could not give.
 */
export type AssistantFailure = 'key' | 'busy' | 'slow' | 'offline' | 'refused' | 'other'

export class AssistantError extends Error {
  readonly failure: AssistantFailure

  constructor(failure: AssistantFailure, message: string) {
    super(message)
    this.name = 'AssistantError'
    this.failure = failure
  }
}
