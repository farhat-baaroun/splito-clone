import type { SettleUpSuggestion } from './types'

/**
 * Greedy Minimum Cash Flow algorithm - O(n log n).
 * Returns optimal settle-up suggestions: who should pay whom how much.
 */
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
