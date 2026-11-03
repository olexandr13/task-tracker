import { useCallback, useRef, useState } from 'react'
import {
  answerAssistant,
  askAssistant,
  assistantInstructions,
  normalizeAssistantQuestion,
  type AssistantData,
} from '../core'
import type { AssistantDeviceRepository } from '../storage/assistantDeviceRepository'
import { AssistantError, type AssistantFailure, type AssistantSource } from '../storage/assistantSource'
import { useDeviceSetting } from './useDeviceSetting'

/** Why the last question brought nothing back, and what the service said. */
export interface AssistantProblem {
  readonly failure: AssistantFailure
  readonly detail: string
}

/**
 * The assistant (AI-1): the key and the conversation kept on this device
 * (STORE-69), and asking.
 *
 * A question joins the conversation only once its answer is in (AI-11):
 * until then it is `pending`, shown but not kept, so one that brings nothing
 * back leaves the conversation as it was and can be asked again. One
 * question at a time: another asked while one is out is let go of, so a
 * double tap costs one request. A new chat lets go of a question still out:
 * its answer belongs to the old conversation, and is dropped when it comes.
 */
export function useAssistant(source: AssistantSource, repository: AssistantDeviceRepository) {
  const [device, setDevice] = useDeviceSetting(repository)
  const [pending, setPending] = useState<string | null>(null)
  const [problem, setProblem] = useState<AssistantProblem | null>(null)
  const out = useRef(false)
  // Moves on with every new chat, so an answer to the one before is recognised.
  const chat = useRef(0)

  /** Asks `question`; resolves to whether an answer came. */
  const ask = useCallback(
    async (data: AssistantData, question: string, now: Date = new Date()): Promise<boolean> => {
      const { apiKey } = device
      const asked = normalizeAssistantQuestion(question)
      if (apiKey === null || asked === '' || out.current) return false

      out.current = true
      const asking = chat.current
      setPending(asked)
      setProblem(null)
      try {
        const answer = await source.ask(apiKey, assistantInstructions(data, now), askAssistant(device.messages, asked, now))
        if (asking === chat.current) {
          setDevice((latest) => ({ ...latest, messages: answerAssistant(askAssistant(latest.messages, asked, now), answer) }))
        }
        return true
      } catch (error) {
        if (asking === chat.current) {
          setProblem(
            error instanceof AssistantError
              ? { failure: error.failure, detail: error.message }
              : { failure: 'other', detail: error instanceof Error ? error.message : String(error) },
          )
        }
        return false
      } finally {
        // A new chat started meanwhile has let go of this question already.
        if (asking === chat.current) {
          out.current = false
          setPending(null)
        }
      }
    },
    [device, source, setDevice],
  )

  /** Starts a new chat (AI-11): the conversation, and any answer still on its way, let go of. */
  const clear = useCallback(() => {
    chat.current += 1
    out.current = false
    setPending(null)
    setDevice((latest) => ({ ...latest, messages: [] }))
    setProblem(null)
  }, [setDevice])

  /** Gives the device a key, or takes it away with `null` (AI-2). */
  const setKey = useCallback(
    (apiKey: string | null) => {
      const trimmed = apiKey?.trim() ?? ''
      setDevice((latest) => ({ ...latest, apiKey: trimmed === '' ? null : trimmed }))
      setProblem(null)
    },
    [setDevice],
  )

  return { apiKey: device.apiKey, messages: device.messages, pending, problem, ask, clear, setKey }
}
