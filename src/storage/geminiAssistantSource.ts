import { isRecord } from './plainData'
import { AssistantError, type AssistantFailure, type AssistantSource } from './assistantSource'

/**
 * Answers from Google's Gemini, asked straight from the browser on the
 * owner's own key (AI-2): the service answers with CORS headers for any
 * origin, so a static app with no server of its own can call it.
 *
 * The models are asked in turn (AI-8): Flash first, the better adviser, then
 * Flash-Lite when Flash is too busy or too slow — on the free tier Flash is
 * often turned away with a 503 for minutes at a time, or kept waiting, while
 * Flash-Lite answers in a second or two. Each follows the newest of its line
 * (`-latest`), so a model Google retires is not one the app is left asking.
 */
const MODELS = [
  { name: 'gemini-flash-latest', timeoutMs: 30_000 },
  { name: 'gemini-flash-lite-latest', timeoutMs: 60_000 },
] as const

/** Turned away for these, the next model is asked; a refused key would be refused by every one. */
const TRY_NEXT: readonly AssistantFailure[] = ['busy', 'slow']

function endpoint(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
}

interface GeminiFailure {
  readonly status: number
  readonly message: string
}

export const geminiAssistantSource: AssistantSource = {
  async ask(apiKey, instructions, messages) {
    const body = JSON.stringify({
      systemInstruction: { parts: [{ text: instructions }] },
      // Gemini's own names for the two sides, which are the ones kept.
      contents: messages.map(({ role, text }) => ({ role, parts: [{ text }] })),
    })

    let last: AssistantError | null = null
    for (const model of MODELS) {
      try {
        const answer = await request(model.name, model.timeoutMs, apiKey, body)
        if (isAnswer(answer)) return answer
        last = new AssistantError(failureOf(answer), answer.message)
      } catch (error) {
        if (!(error instanceof AssistantError)) throw error
        last = error
      }
      if (!TRY_NEXT.includes(last.failure)) throw last
    }
    throw last ?? new AssistantError('other', 'Gemini gave no answer.')
  },
}

function isAnswer(answer: string | GeminiFailure): answer is string {
  return typeof answer === 'string'
}

/** One request: the answer's text, or how the service turned it down. */
async function request(model: string, timeoutMs: number, apiKey: string, body: string): Promise<string | GeminiFailure> {
  let response: Response
  try {
    response = await fetch(endpoint(model), {
      method: 'POST',
      // In a header rather than the address, so it is not written into logs along the way.
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    // Waiting past the timeout is the service being slow, not the connection being down.
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new AssistantError('slow', `${model} gave no answer in ${String(timeoutMs / 1000)} seconds.`)
    }
    throw new AssistantError('offline', error instanceof Error ? error.message : 'Gemini could not be reached.')
  }

  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    return { status: response.status, message: `${model}: ${errorMessage(data) ?? `answered ${String(response.status)}.`}` }
  }

  const text = answerText(data)
  if (text === null) {
    throw new AssistantError('refused', blockReason(data) ?? 'Gemini gave no answer.')
  }
  return text
}

function failureOf({ status, message }: GeminiFailure): AssistantFailure {
  // A key that is wrong comes back as a 400 that says so; one without access, 403.
  if (status === 401 || status === 403 || (status === 400 && /api key/iu.test(message))) return 'key'
  if (status === 429 || status === 503) return 'busy'
  return 'other'
}

/** `{ error: { message } }`, as every refusal is worded. */
function errorMessage(data: unknown): string | null {
  if (!isRecord(data) || !isRecord(data.error)) return null
  return typeof data.error.message === 'string' ? data.error.message : null
}

/** The first candidate's text, its parts joined — or null when there is none. */
function answerText(data: unknown): string | null {
  if (!isRecord(data) || !Array.isArray(data.candidates)) return null
  const [first] = data.candidates as unknown[]
  if (!isRecord(first) || !isRecord(first.content) || !Array.isArray(first.content.parts)) return null

  const text = (first.content.parts as unknown[])
    // A thinking model may send its thoughts as parts of their own; only the answer is shown.
    .filter((part): part is { text: string } => isRecord(part) && typeof part.text === 'string' && part.thought !== true)
    .map((part) => part.text)
    .join('')
    .trim()
  return text === '' ? null : text
}

/** Why a prompt was blocked, when it was. */
function blockReason(data: unknown): string | null {
  if (!isRecord(data) || !isRecord(data.promptFeedback)) return null
  const reason = data.promptFeedback.blockReason
  return typeof reason === 'string' ? `Gemini would not answer (${reason}).` : null
}
