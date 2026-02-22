interface BalancesSummaryProps {
  totalExpense: number
  balances: Array<{ memberId: string; balance: number; name?: string }>
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function BalancesSummary({ totalExpense, balances }: BalancesSummaryProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Balances</h3>
      <p className="text-2xl font-bold text-emerald-600 mb-4">
        {formatCurrency(totalExpense)}
        <span className="text-sm font-normal text-gray-500 ml-2">total</span>
      </p>
      {balances.length === 0 ? (
        <p className="text-sm text-gray-500">All settled up</p>
      ) : (
        <div className="space-y-2">
          {balances.map((b) => (
            <div
              key={b.memberId}
              className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg"
            >
              <span className="text-gray-900">{b.name ?? 'Unknown'}</span>
              <span
                className={
                  b.balance > 0 ? 'text-red-600 font-medium' : 'text-emerald-600 font-medium'
                }
              >
                {b.balance > 0 ? 'owes' : 'gets'} {formatCurrency(Math.abs(b.balance))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
