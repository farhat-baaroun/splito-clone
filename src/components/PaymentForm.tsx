import { useState, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { X } from 'lucide-react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import MemberAvatar from './MemberAvatar'

const PRESET_TAGS = ['Food', 'Diesel', 'Transport', 'Accommodation', 'Entertainment', 'Other']

interface PaymentFormProps {
  sandboxId: Id<'sandboxes'>
  groupId: Id<'groups'>
  members: Array<{ _id: Id<'members'>; name: string; imageStorageId?: Id<'_storage'> | null }>
  onClose: () => void
  editPayment?: {
    id: Id<'payments'>
    title: string
    amount: number
    paidBy: Id<'members'>
    paidFor: Id<'members'>[]
    tags?: string[]
  }
}

export default function PaymentForm({
  sandboxId,
  groupId,
  members,
  onClose,
  editPayment,
}: PaymentFormProps) {
  const [title, setTitle] = useState(editPayment?.title ?? '')
  const [amount, setAmount] = useState(editPayment?.amount?.toString() ?? '')
  const [paidBy, setPaidBy] = useState<Id<'members'> | ''>(editPayment?.paidBy ?? '')
  const [paidFor, setPaidFor] = useState<Set<string>>(
    new Set(editPayment?.paidFor?.map(String) ?? [])
  )
  const [tags, setTags] = useState<Set<string>>(
    new Set(editPayment?.tags ?? [])
  )
  const [error, setError] = useState('')
  const createPayment = useMutation(api.payments.create)
  const updatePayment = useMutation(api.payments.update)

  const togglePaidFor = useCallback((id: string) => {
    setPaidFor((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleTag = useCallback((tag: string) => {
    setTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')
      const trimmedTitle = title.trim()
      const amountNum = parseFloat(amount)
      if (!trimmedTitle) {
        setError('Title is required')
        return
      }
      if (isNaN(amountNum) || amountNum <= 0) {
        setError('Enter a valid amount')
        return
      }
      if (!paidBy) {
        setError('Select who paid')
        return
      }
      const paidForIds = Array.from(paidFor).filter(Boolean) as Id<'members'>[]
      if (paidForIds.length === 0) {
        setError('Select at least one person this expense is for')
        return
      }
      const tagsArray = Array.from(tags).filter(Boolean)
      try {
        if (editPayment) {
          await updatePayment({
            id: editPayment.id,
            title: trimmedTitle,
            amount: amountNum,
            paidBy,
            paidFor: paidForIds,
            tags: tagsArray.length > 0 ? tagsArray : undefined,
          })
        } else {
          await createPayment({
            sandboxId,
            groupId,
            title: trimmedTitle,
            amount: amountNum,
            paidBy,
            paidFor: paidForIds,
            tags: tagsArray.length > 0 ? tagsArray : undefined,
          })
        }
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save')
      }
    },
    [title, amount, paidBy, paidFor, tags, editPayment, sandboxId, groupId, createPayment, updatePayment, onClose]
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editPayment ? 'Edit payment' : 'Add payment'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -m-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dinner, Groceries"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Paid by</label>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  key={m._id}
                  type="button"
                  onClick={() => setPaidBy(paidBy === m._id ? '' : m._id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-colors ${
                    paidBy === m._id
                      ? 'border-emerald-600 bg-emerald-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <MemberAvatar name={m.name} memberId={m._id} size="sm" imageStorageId={m.imageStorageId} />
                  <span className="font-medium">{m.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Split between</label>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  key={m._id}
                  type="button"
                  onClick={() => togglePaidFor(String(m._id))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    paidFor.has(String(m._id))
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (optional)</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    tags.has(tag)
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
          >
            {editPayment ? 'Save' : 'Add payment'}
          </button>
        </form>
      </div>
    </div>
  )
}
