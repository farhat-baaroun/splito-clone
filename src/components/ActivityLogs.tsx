interface LogEntry {
  _id: string
  action: 'create' | 'update' | 'delete'
  previousValue?: unknown
  newValue?: unknown
  timestamp: number
}

interface ActivityLogsProps {
  logs: LogEntry[]
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

export default function ActivityLogs({ logs }: ActivityLogsProps) {
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
        {logs.map((log) => (
          <div
            key={log._id}
            className="py-2 px-3 bg-gray-50 rounded-lg text-sm"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">{formatAction(log.action)}</span>
              <span className="text-gray-500 text-xs">{formatTime(log.timestamp)}</span>
            </div>
            {log.newValue && typeof log.newValue === 'object' && 'title' in (log.newValue as object) && (
              <p className="text-gray-600 mt-1 truncate">
                {(log.newValue as { title?: string }).title}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
