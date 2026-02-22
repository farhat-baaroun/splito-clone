import { Link } from '@tanstack/react-router'
import { Check, Archive, MapPin } from 'lucide-react'
import type { Id } from '@convex/_generated/dataModel'

interface SandboxCardProps {
  sandboxId: Id<'sandboxes'>
  groupId: Id<'groups'>
  name: string
  status: 'active' | 'settled' | 'archived'
  totalExpense: number
  memberCount: number
  lastActivity: number
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatRelativeTime(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'Just now'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`
  if (diff < 604800_000) return `${Math.floor(diff / 86400_000)}d ago`
  return new Date(ts).toLocaleDateString()
}

export default function SandboxCard({
  sandboxId,
  groupId,
  name,
  status,
  totalExpense,
  memberCount,
  lastActivity,
}: SandboxCardProps) {
  const statusConfig = {
    active: { label: 'Active', icon: MapPin, className: 'bg-emerald-100 text-emerald-800' },
    settled: { label: 'Settled', icon: Check, className: 'bg-blue-100 text-blue-800' },
    archived: { label: 'Archived', icon: Archive, className: 'bg-gray-100 text-gray-600' },
  }
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Link
      to="/groups/$groupId/sandbox/$sandboxId"
      params={{ groupId, sandboxId }}
      className="block p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {formatCurrency(totalExpense)} • {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </p>
          <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(lastActivity)}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium shrink-0 ${config.className}`}
        >
          <Icon size={12} />
          {config.label}
        </span>
      </div>
    </Link>
  )
}
