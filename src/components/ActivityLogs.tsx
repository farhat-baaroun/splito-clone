import { memo } from 'react'
import { RotateCcw } from 'lucide-react'
import type { Id } from '@convex/_generated/dataModel'

interface LogEntry {
  _id: Id<'paymentLogs'>
  action: 'create' | 'update' | 'delete'
  previousValue?: unknown
  newValue?: unknown
  timestamp: number
}

interface ActivityLogsProps {
  logs: LogEntry[]
  isEditable?: boolean
  onUndo?: (logId: Id<'paymentLogs'>) => void
  formatCurrency?: (amount: number) => string
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAction(action: string) {
  return action.charAt(0).toUpperCase() + action.slice(1)
}

function ActivityLogsComponent({
  logs,
  isEditable = false,
  onUndo,
}: ActivityLogsProps) {
  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Activity</h3>
        <p className="text-sm text-gray-500">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Activity</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {logs.map((log) => {
          const canUndo =
            isEditable &&
            onUndo &&
            (log.action === 'update' || log.action === 'delete') &&
            log.previousValue
          const val = (log.newValue ?? log.previousValue) as { title?: string; amount?: number }
          return (
            <div
              key={log._id}
              className="py-2 px-3 bg-gray-50 rounded-lg text-sm flex justify-between items-start gap-2"
            >
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{formatAction(log.action)}</span>
                  <span className="text-gray-500 text-xs shrink-0">{formatTime(log.timestamp)}</span>
                </div>
                {val?.title && <p className="text-gray-600 mt-1 truncate">{val.title}</p>}
                {val?.amount != null && (
                  <p className="text-emerald-600 font-medium mt-0.5">{val.amount.toFixed(2)}</p>
                )}
              </div>
              {canUndo && (
                <button
                  onClick={() => onUndo(log._id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg shrink-0"
                >
                  <RotateCcw size={12} />
                  Undo
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default memo(ActivityLogsComponent)
