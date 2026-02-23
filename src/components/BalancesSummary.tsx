import { memo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface BalanceEntry {
  memberId: string
  balance: number
  name?: string
}

interface ExpensesPerMember {
  memberId: string
  name?: string
  totalPaid: number
  totalOwed: number
  netBalance: number
}

interface BalancesSummaryProps {
  totalExpense: number
  balances: BalanceEntry[]
  expensesPerMember?: ExpensesPerMember[]
  formatCurrency: (amount: number) => string
}

function BalancesSummaryComponent({
  totalExpense,
  balances,
  expensesPerMember = [],
  formatCurrency,
}: BalancesSummaryProps) {
  const [expandedMember, setExpandedMember] = useState<string | null>(null)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3">el cash mayoufech</h3>
      <p className="text-2xl font-bold text-emerald-600 mb-4">
        {formatCurrency(totalExpense)}
        <span className="text-sm font-normal text-gray-500 ml-2">total</span>
      </p>
      {balances.length === 0 ? (
        <p className="text-sm text-gray-500">All settled up</p>
      ) : (
        <div className="space-y-2">
          {balances.map((b) => {
            const expenses = expensesPerMember.find((e) => e.memberId === b.memberId)
            const hasDetails = expenses && (expenses.totalPaid > 0 || expenses.totalOwed > 0)
            const isExpanded = expandedMember === b.memberId

            return (
              <div key={b.memberId} className="bg-gray-50 rounded-lg overflow-hidden">
                <div
                  className={`flex justify-between items-center py-2 px-3 ${hasDetails ? 'cursor-pointer' : ''}`}
                  onClick={() =>
                    hasDetails &&
                    setExpandedMember(isExpanded ? null : b.memberId)
                  }
                >
                  <div className="flex items-center gap-2">
                    {hasDetails &&
                      (isExpanded ? (
                        <ChevronDown size={16} className="text-gray-500" />
                      ) : (
                        <ChevronRight size={16} className="text-gray-500" />
                      ))}
                    <span className="text-gray-900">{b.name ?? 'Unknown'}</span>
                  </div>
                  <span
                    className={
                      b.balance > 0 ? 'text-red-600 font-medium' : 'text-emerald-600 font-medium'
                    }
                  >
                    {b.balance > 0 ? 'owes' : 'gets'} {formatCurrency(Math.abs(b.balance))}
                  </span>
                </div>
                {hasDetails && isExpanded && expenses && (
                  <div className="px-3 pb-3 pt-0 border-t border-gray-200 mt-1 pt-2 space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Paid</span>
                      <span>{formatCurrency(expenses.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owed share</span>
                      <span>{formatCurrency(expenses.totalOwed)}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default memo(BalancesSummaryComponent)
