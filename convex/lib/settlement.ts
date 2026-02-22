/**
 * Settlement logic - reusable pure functions.
 * Used by convex/settlement.ts query.
 */

export interface PaymentInput {
  amount: number
  paidBy: string
  paidFor: string[]
}

export interface BalanceEntry {
  memberId: string
  balance: number
  name?: string
}

export interface SettleUpSuggestion {
  from: string
  to: string
  amount: number
  fromName?: string
  toName?: string
}

export function computeBalances(
  payments: PaymentInput[],
  memberIds: string[]
): Map<string, number> {
  const balances = new Map<string, number>()
  for (const id of memberIds) {
    balances.set(id, 0)
  }

  for (const payment of payments) {
    const { amount, paidBy, paidFor } = payment
    if (paidFor.length === 0) continue
    const share = amount / paidFor.length

    balances.set(paidBy, (balances.get(paidBy) ?? 0) - amount)
    for (const memberId of paidFor) {
      balances.set(memberId, (balances.get(memberId) ?? 0) + share)
    }
  }

  return balances
}

export function balancesToEntries(
  balances: Map<string, number>,
  nameMap?: Map<string, string>
): BalanceEntry[] {
  const entries: BalanceEntry[] = []
  for (const [memberId, balance] of balances) {
    if (Math.abs(balance) < 0.01) continue
    entries.push({
      memberId,
      balance,
      name: nameMap?.get(memberId),
    })
  }
  return entries.sort((a, b) => b.balance - a.balance)
}

export function greedyMinCashFlow(
  balances: Map<string, number>,
  nameMap?: Map<string, string>
): SettleUpSuggestion[] {
  const debtors: { id: string; amount: number }[] = []
  const creditors: { id: string; amount: number }[] = []

  for (const [id, balance] of balances) {
    if (balance > 0.01) {
      debtors.push({ id, amount: balance })
    } else if (balance < -0.01) {
      creditors.push({ id, amount: -balance })
    }
  }

  debtors.sort((a, b) => b.amount - a.amount)
  creditors.sort((a, b) => b.amount - a.amount)

  const suggestions: SettleUpSuggestion[] = []
  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i]
    const creditor = creditors[j]
    const amount = Math.min(debtor.amount, creditor.amount)

    if (amount < 0.01) {
      if (debtor.amount < creditor.amount) i++
      else j++
      continue
    }

    suggestions.push({
      from: debtor.id,
      to: creditor.id,
      amount: Math.round(amount * 100) / 100,
      fromName: nameMap?.get(debtor.id),
      toName: nameMap?.get(creditor.id),
    })

    debtor.amount -= amount
    creditor.amount -= amount
    if (debtor.amount < 0.01) i++
    if (creditor.amount < 0.01) j++
  }

  return suggestions
}
