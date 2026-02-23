import { memo, useCallback, useMemo } from 'react'

interface Suggestion {
  from: string
  to: string
  amount: number
  fromName?: string
  toName?: string
}

function markKey(from: string, to: string, amount: number) {
  return `${from}|${to}|${amount.toFixed(2)}`
}

interface SettleUpVisualizationProps {
  suggestions: Suggestion[]
  formatCurrency: (amount: number) => string
  markedKeys?: string[]
  onToggleMarked: (suggestion: Suggestion) => void
}

function SettleUpVisualizationComponent({
  suggestions,
  formatCurrency,
  markedKeys = [],
  onToggleMarked,
}: SettleUpVisualizationProps) {
  const markedSet = useMemo(() => new Set(markedKeys), [markedKeys])

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">5aliss le3bad yezi bla le3eb mta3ak </h3>
        <p className="text-sm text-gray-500">No payments needed</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3">5aliss le3bad yezi bla le3eb mta3ak </h3>
      <p className="text-sm text-gray-500 mb-4">Suggested payments to simplify debts:</p>
      <div className="space-y-3">
        {suggestions.map((s, i) => {
          const key = markKey(s.from, s.to, s.amount)
          const isMarked = markedSet.has(key)
          return (
          <div
            key={i}
            className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm cursor-pointer transition-colors ${
              isMarked ? 'bg-emerald-50 line-through text-gray-500' : 'bg-gray-50'
            }`}
            onClick={() => onToggleMarked(s)}
          >
            <input
              type="checkbox"
              checked={isMarked}
              onChange={() => onToggleMarked(s)}
              onClick={(e) => e.stopPropagation()}
              className="rounded border-gray-300"
            />
            <span className="font-medium text-gray-900">{s.fromName ?? s.from}</span>
            <span className="text-gray-500">→</span>
            <span className="font-medium text-gray-900">{s.toName ?? s.to}</span>
            <span className="ml-auto font-semibold text-emerald-600">
              {formatCurrency(s.amount)}
            </span>
          </div>
          )
        })}
      </div>
    </div>
  )
}

export default memo(SettleUpVisualizationComponent)
