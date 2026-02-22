interface Suggestion {
  from: string
  to: string
  amount: number
  fromName?: string
  toName?: string
}

interface SettleUpVisualizationProps {
  suggestions: Suggestion[]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function SettleUpVisualization({ suggestions }: SettleUpVisualizationProps) {
  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Settle up</h3>
        <p className="text-sm text-gray-500">No payments needed</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Settle up</h3>
      <p className="text-sm text-gray-500 mb-4">Suggested payments to simplify debts:</p>
      <div className="space-y-3">
        {suggestions.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg text-sm"
          >
            <span className="font-medium text-gray-900">{s.fromName ?? s.from}</span>
            <span className="text-gray-500">→</span>
            <span className="font-medium text-gray-900">{s.toName ?? s.to}</span>
            <span className="ml-auto font-semibold text-emerald-600">
              {formatCurrency(s.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
