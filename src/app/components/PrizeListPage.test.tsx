// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createPointValue,
  createPrize,
  markBought,
  prizesOfKind,
  type Prize,
  type PrizeKind,
} from '../../core'
import { PrizeListPage } from './PrizeListPage'

/* The prizes and the wishlist. RWD ids refer to wiki/rewards.md. */

const AT = new Date(2026, 8, 17, 9, 0)

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const CHOCOLATE = createPrize('Chocolate', 20, 'prize', AT)
const COFFEE = createPrize('Coffee', 50, 'prize', AT)
const PHONE = createPrize('A new phone', 5000, 'wish', AT)
const TRIP = markBought(createPrize('A trip', 100, 'wish', AT), AT)

function setup({
  kind = 'prize' as PrizeKind,
  balance = 25,
  prizes = [CHOCOLATE, COFFEE, PHONE, TRIP] as readonly Prize[],
  pointValue = createPointValue(2.5),
  withOther = true,
} = {}) {
  const handlers = {
    onAdd: vi.fn(() => true),
    onRename: vi.fn(() => true),
    onReprice: vi.fn(),
    onDelete: vi.fn(),
    onRedeem: vi.fn(),
    onRedeemOther: vi.fn(),
  }
  render(
    <PrizeListPage
      kind={kind}
      prizes={prizesOfKind(prizes, kind)}
      balance={balance}
      pointValue={pointValue}
      now={AT}
      {...handlers}
      onRedeemOther={withOther ? handlers.onRedeemOther : undefined}
    />,
  )
  return { user: userEvent.setup(), ...handlers }
}

describe('the two lists (RWD-40)', () => {
  it('shows only its own kind', () => {
    setup({ kind: 'prize' })

    expect(screen.getByText('Chocolate')).toBeTruthy()
    expect(screen.queryByText('A new phone')).toBeNull()
  })

  it('says what each list is for', () => {
    setup({ kind: 'wish' })

    expect(screen.getByText(/The big ones, bought once/)).toBeTruthy()
  })

  it('offers the box for something on neither list on the prizes page alone (RWD-15)', () => {
    setup({ kind: 'wish', withOther: false })
    expect(screen.queryByLabelText('What for')).toBeNull()
    cleanup()

    setup({ kind: 'prize' })
    expect(screen.getByLabelText('What for')).toBeTruthy()
  })
})

describe('what a list shows (RWD-35, RWD-36)', () => {
  it('lists what can still be bought, cheapest first, with what each costs', () => {
    setup({ kind: 'prize' })

    const names = screen.getAllByRole('listitem').map((item) => item.textContent)
    expect(names[0]).toContain('Chocolate')
    expect(names[1]).toContain('Coffee')
  })

  it('says what there is to spend, and what it is worth in money (RWD-32)', () => {
    setup({ balance: 25 })

    expect(screen.getByText(/points to spend/).textContent).toContain('worth 62.50 UAH')
  })

  it('says how far off one out of reach is (RWD-37)', () => {
    setup({ kind: 'prize', balance: 25 })

    expect(screen.getByText('25 to go')).toBeTruthy()
  })

  it('says how to start when the list is empty', () => {
    setup({ kind: 'wish', prizes: [] })

    expect(screen.getByText(/Nothing wished for yet/)).toBeTruthy()
  })
})

describe('redeeming (RWD-36, RWD-40)', () => {
  it('hands the whole prize back, so the screen knows which kind it was', async () => {
    const { user, onRedeem } = setup({ kind: 'prize', balance: 25 })

    await user.click(screen.getByRole('button', { name: 'Redeem Chocolate for 20 points' }))

    expect(onRedeem).toHaveBeenCalledExactlyOnceWith(CHOCOLATE)
  })

  it('will not spend points that have not been earned (RWD-16)', async () => {
    const { user, onRedeem } = setup({ kind: 'prize', balance: 19 })

    const redeem = screen.getByRole('button', { name: 'Redeem Chocolate for 20 points' })
    expect(redeem.hasAttribute('disabled')).toBe(true)

    await user.click(redeem)
    expect(onRedeem).not.toHaveBeenCalled()
  })

  it('spends points on something that is on neither list (RWD-15)', async () => {
    const { user, onRedeemOther } = setup({ kind: 'prize', balance: 25 })

    await user.type(screen.getByLabelText('Points to redeem'), '5')
    await user.type(screen.getByLabelText('What for'), 'A film{Enter}')

    expect(onRedeemOther).toHaveBeenCalledExactlyOnceWith(5, 'A film')
  })

  it('leaves a bought wish listed, marked as bought and with nothing to redeem (RWD-40)', () => {
    setup({ kind: 'wish', balance: 100000 })

    expect(screen.getByText('Bought today')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Redeem A trip/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Change the wish "A trip"' })).toBeNull()
    // It can still be taken off the list.
    expect(screen.getByRole('button', { name: 'Delete the wish "A trip"' })).toBeTruthy()
  })

  it('keeps a bought wish at the end, behind what is still to come (RWD-35)', () => {
    setup({ kind: 'wish' })

    const names = screen.getAllByRole('listitem').map((item) => item.textContent)
    expect(names[0]).toContain('A new phone')
    expect(names[1]).toContain('A trip')
  })
})

describe('keeping a list (RWD-33, RWD-34)', () => {
  it('adds one by name and price, to the list it belongs to', async () => {
    const { user, onAdd } = setup({ kind: 'wish' })

    await user.type(screen.getByLabelText('Name of the new wish'), 'A bicycle')
    await user.type(screen.getByLabelText('Points the new wish costs'), '2000')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(onAdd).toHaveBeenCalledExactlyOnceWith('A bicycle', 2000, 'wish')
  })

  it('will not add one without both a name and a price', async () => {
    const { user, onAdd } = setup()

    await user.type(screen.getByLabelText('Name of the new prize'), 'Coffee')
    expect(screen.getByRole('button', { name: 'Add' }).hasAttribute('disabled')).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Add' }))
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('says so when a name is taken already', async () => {
    const onAdd = vi.fn(() => false)
    render(
      <PrizeListPage
        kind="prize"
        prizes={prizesOfKind([CHOCOLATE], 'prize')}
        balance={25}
        pointValue={null}
        now={AT}
        onAdd={onAdd}
        onRename={vi.fn(() => true)}
        onReprice={vi.fn()}
        onDelete={vi.fn()}
        onRedeem={vi.fn()}
      />,
    )
    const user = userEvent.setup()

    await user.type(screen.getByLabelText('Name of the new prize'), 'Chocolate')
    await user.type(screen.getByLabelText('Points the new prize costs'), '20')
    await user.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByRole('alert').textContent).toContain('There is a prize called that already.')
  })

  it('renames and reprices one in place, on Enter', async () => {
    const { user, onRename, onReprice } = setup()

    await user.click(screen.getByRole('button', { name: 'Change the prize "Chocolate"' }))
    const name = screen.getByLabelText('Name of the prize "Chocolate"')
    await user.clear(name)
    await user.type(name, 'A bar of chocolate')
    const price = screen.getByLabelText('Points the prize "Chocolate" costs')
    await user.clear(price)
    await user.type(price, '25{Enter}')

    expect(onRename).toHaveBeenCalledWith(CHOCOLATE.id, 'A bar of chocolate')
    expect(onReprice).toHaveBeenCalledWith(CHOCOLATE.id, 25)
  })

  it('leaves one as it was when the change is given up on with Escape', async () => {
    const { user, onRename, onReprice } = setup()

    await user.click(screen.getByRole('button', { name: 'Change the prize "Chocolate"' }))
    await user.type(screen.getByLabelText('Name of the prize "Chocolate"'), ' bar{Escape}')

    expect(onRename).not.toHaveBeenCalled()
    expect(onReprice).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Change the prize "Chocolate"' })).toBeTruthy()
  })

  it('asks before taking one off, the history keeping what it was redeemed for (RWD-34)', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { user, onDelete } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete the prize "Chocolate"' }))

    expect(confirm.mock.calls[0][0]).toContain('stays in the history')
    expect(onDelete).toHaveBeenCalledWith(CHOCOLATE.id)
  })

  it('takes nothing off when the asking is turned down', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const { user, onDelete } = setup()

    await user.click(screen.getByRole('button', { name: 'Delete the prize "Chocolate"' }))

    expect(onDelete).not.toHaveBeenCalled()
  })
})
