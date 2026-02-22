import type { BalanceEntry } from './types'
import type { PaymentInput } from './types'

/**
 * Compute net balance per member from payments.
 * Positive balance = owes money (debtor)
 * Negative balance = is owed money (creditor)
 */
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

/**
 * Convert balance map to array, filtering out zero balances for display.
 */
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
