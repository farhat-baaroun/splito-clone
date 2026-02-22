import { memo } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Doc, Id } from '@convex/_generated/dataModel'
import MemberAvatar from './MemberAvatar'

interface PaymentRowProps {
  payment: Doc<'payments'>
  memberName: string
  memberImageStorageId?: Id<'_storage'> | null
  paidForNames: string[]
  formatCurrency: (amount: number) => string
  isEditable: boolean
  onEdit: () => void
  onDelete: () => void
}

function PaymentRowComponent({
  payment,
  memberName,
  memberImageStorageId,
  paidForNames,
  formatCurrency,
  isEditable,
  onEdit,
  onDelete,
}: PaymentRowProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
      <MemberAvatar
        name={memberName}
        memberId={payment.paidBy}
        size="md"
        imageStorageId={memberImageStorageId}
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900">{payment.title}</p>
        <p className="text-sm text-gray-500">
          {memberName} paid • split between {paidForNames.filter(Boolean).join(', ')}
        </p>
        {payment.tags && payment.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {payment.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="text-lg font-bold text-emerald-600 shrink-0">
        {formatCurrency(payment.amount)}
      </span>
      {isEditable && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            aria-label="Edit"
          >
            <Pencil size={18} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </div>
  )
}

export default memo(PaymentRowComponent)
