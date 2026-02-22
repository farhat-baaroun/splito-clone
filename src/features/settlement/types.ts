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

export interface SettlementResult {
  balances: BalanceEntry[]
  suggestions: SettleUpSuggestion[]
  totalExpense: number
}
