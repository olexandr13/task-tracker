// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Repeat } from '../../core'
import { RewardPicker } from './RewardPicker'

/* Giving a task a reward, changing it and taking it away. RWD ids refer to wiki/rewards.md, UI ids to wiki/interface.md. */

afterEach(cleanup)

/** A picker whose reward is kept, and every change it asks for recorded. */
function Picker({ initial, repeat, onChange }: { initial: number | null; repeat: Repeat | null; onChange: (reward: number | null) => void }) {
  const [reward, setReward] = useState(initial)

  return (
    <RewardPicker
      reward={reward}
      repeat={repeat}
      onChange={(next) => {
        onChange(next)
        setReward(next)
      }}
    />
  )
}

function setup({ initial = null as number | null, repeat = { kind: 'daily' } as Repeat | null } = {}) {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<Picker initial={initial} repeat={repeat} onChange={onChange} />)
  return { user, onChange }
}

const trigger = () => screen.getByRole('button', { name: /^Reward:/ })
const panel = () => screen.queryByRole('dialog', { name: 'Reward' })
const box = () => screen.getByRole<HTMLInputElement>('spinbutton', { name: 'Points' })

describe('RewardPicker', () => {
  it('names the reward, and none when there is none (UI-12)', () => {
    setup({ initial: 5 })

    expect(trigger()).toHaveProperty('ariaLabel', 'Reward: 5 points')
  })

  it('starts a new reward at what the rule is worth, and gives nothing just for opening (RWD-2, RWD-5)', async () => {
    for (const [repeat, points] of [
      [{ kind: 'daily' }, '1'],
      [{ kind: 'weekly', weekdays: [1] }, '5'],
      [{ kind: 'monthly', day: 1 }, '25'],
      [null, '1'],
    ] as const) {
      const { user, onChange } = setup({ repeat })

      await user.click(trigger())

      expect(box().value).toBe(points)
      expect(onChange).not.toHaveBeenCalled()
      cleanup()
    }
  })

  it('gives the reward stepped or typed to, on Add or Enter, and closes (RWD-5)', async () => {
    const { user, onChange } = setup({ repeat: { kind: 'weekly', weekdays: [1] } })

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'More points' }))
    expect(onChange).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Add reward' }))

    expect(onChange).toHaveBeenLastCalledWith(6)
    expect(panel()).toBeNull()

    cleanup()
    const typed = setup()
    await typed.user.click(trigger())
    await typed.user.clear(box())
    await typed.user.type(box(), '12{Enter}')

    expect(typed.onChange).toHaveBeenLastCalledWith(12)
  })

  it('saves every step and every number typed once there is a reward (RWD-6)', async () => {
    const { user, onChange } = setup({ initial: 3 })

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'Fewer points' }))
    expect(onChange).toHaveBeenLastCalledWith(2)

    await user.clear(box())
    await user.type(box(), '40')

    expect(onChange).toHaveBeenLastCalledWith(40)
    expect(trigger()).toHaveProperty('ariaLabel', 'Reward: 40 points')
  })

  it('keeps no number that cannot be a reward, and puts the box back on leaving it (RWD-6)', async () => {
    const { user, onChange } = setup({ initial: 3 })

    await user.click(trigger())
    await user.clear(box())
    await user.type(box(), '0')
    await user.tab()

    expect(onChange).not.toHaveBeenCalled()
    expect(box().value).toBe('3')
  })

  it('does not step below one point', async () => {
    const { user } = setup({ initial: 1 })

    await user.click(trigger())

    expect(screen.getByRole('button', { name: 'Fewer points' })).toHaveProperty('disabled', true)
  })

  it('takes the reward away (RWD-6)', async () => {
    const { user, onChange } = setup({ initial: 3 })

    await user.click(trigger())
    await user.click(screen.getByRole('button', { name: 'Remove reward' }))

    expect(onChange).toHaveBeenLastCalledWith(null)
    expect(trigger()).toHaveProperty('ariaLabel', 'Reward: No reward')
  })

  it('closes on Escape without giving anything (UI-9, UI-10)', async () => {
    const { user, onChange } = setup()

    await user.click(trigger())
    await user.keyboard('{Escape}')

    expect(panel()).toBeNull()
    expect(onChange).not.toHaveBeenCalled()
  })
})
