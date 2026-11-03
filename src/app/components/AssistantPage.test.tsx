// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'
import { ASSISTANT_SUGGESTIONS } from '../assistantLabels'
import { AssistantPage } from './AssistantPage'

/* The assistant's page (AI-1, AI-3, AI-6, AI-8, AI-10, AI-11 in wiki/assistant.md). */

afterEach(cleanup)

const NOW = new Date(2026, 10, 3, 10, 0)

function renderPage(props: Partial<ComponentProps<typeof AssistantPage>> = {}, answered = true) {
  const onAsk = vi.fn((_question: string) => Promise.resolve(answered))
  const onNewChat = vi.fn()
  const onOpenSettings = vi.fn()
  render(
    <AssistantPage
      hasKey
      messages={[]}
      pending={null}
      problem={null}
      now={NOW}
      onAsk={onAsk}
      onNewChat={onNewChat}
      onOpenSettings={onOpenSettings}
      {...props}
    />,
  )
  return { user: userEvent.setup(), onAsk, onNewChat, onOpenSettings }
}

describe('AssistantPage', () => {
  it('sends what was typed by Enter, Shift+Enter starting a new line, and empties the box', async () => {
    const { user, onAsk } = renderPage()
    const box = screen.getByRole('textbox', { name: 'Your question' })

    await user.type(box, 'What is a good book?{Shift>}{Enter}{/Shift}Short please{Enter}')

    expect(onAsk.mock.calls).toEqual([['What is a good book?\nShort please']])
    expect(box).toHaveProperty('value', '')
  })

  it('sends nothing for an empty box', async () => {
    const { user, onAsk } = renderPage()
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(onAsk).not.toHaveBeenCalled()
  })

  it('puts the question back in the box when no answer came (AI-8)', async () => {
    const { user } = renderPage({}, false)
    const box = screen.getByRole('textbox', { name: 'Your question' })

    await user.type(box, 'Plan my week{Enter}')

    expect(box).toHaveProperty('value', 'Plan my week')
  })

  it('asks a suggestion as it reads when pressed (AI-10)', async () => {
    const { user, onAsk } = renderPage()

    expect(within(screen.getByRole('list', { name: 'Suggestions' })).getAllByRole('button').map((chip) => chip.textContent)).toEqual([
      ...ASSISTANT_SUGGESTIONS,
    ])
    await user.click(screen.getByRole('button', { name: 'Analyze yesterday' }))

    expect(onAsk.mock.calls).toEqual([['Analyze yesterday']])
  })

  it('shows the conversation, the answers with their lists and bold, and the question on its way (AI-6, AI-11)', () => {
    renderPage({
      messages: [
        { role: 'user', text: 'Tonight?', at: NOW.toISOString() },
        { role: 'model', text: '**Start small**\n- Walk\n- Read', at: NOW.toISOString() },
      ],
      pending: 'Why?',
    })

    const conversation = screen.getByRole('list', { name: 'Conversation' })
    expect(conversation.textContent).toContain('You: Tonight?')
    expect(screen.getByText('Start small').tagName).toBe('STRONG')
    expect(within(conversation).getByText('Walk').tagName).toBe('LI')
    expect(conversation.textContent).toContain('You: Why?')
    expect(conversation.textContent).toContain('Thinking…')
    expect(screen.getByRole('button', { name: 'Thinking…' })).toHaveProperty('disabled', true)
  })

  it('starts a new chat, offered only once there is one', async () => {
    const empty = renderPage()
    expect(screen.queryByRole('button', { name: 'New chat' })).toBeNull()
    cleanup()

    const { user, onNewChat } = renderPage({ messages: [{ role: 'user', text: 'Hi', at: NOW.toISOString() }] })
    await user.click(screen.getByRole('button', { name: 'New chat' }))

    expect(empty.onNewChat).not.toHaveBeenCalled()
    expect(onNewChat).toHaveBeenCalledOnce()
  })

  it('says where to give a key while the device has none, with no box or suggestions (AI-3)', async () => {
    const { user, onOpenSettings } = renderPage({ hasKey: false })

    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('list', { name: 'Suggestions' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Open Settings' }))

    expect(onOpenSettings).toHaveBeenCalledOnce()
  })

  it('says why no answer came, and what the service said (AI-8)', () => {
    renderPage({ problem: { failure: 'busy', detail: 'High demand.' } })

    expect(screen.getByRole('alert').textContent).toBe(
      'Gemini is busy or your free quota is used up. Try again in a minute.High demand.',
    )
  })
})
