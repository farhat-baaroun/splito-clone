import { useState, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { useNavigate } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

interface CreateSandboxFormProps {
  groupId: Id<'groups'>
  members: Array<{ _id: Id<'members'>; name: string }>
  onClose: () => void
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'MAD', 'AED', 'SAR']

export default function CreateSandboxForm({ groupId, members, onClose }: CreateSandboxFormProps) {
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(
    () => new Set(members.map((m) => m._id))
  )
  const [error, setError] = useState('')
  const createSandbox = useMutation(api.sandboxes.create)
  const navigate = useNavigate()

  const toggleMember = useCallback((id: string) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')
      const trimmed = name.trim()
      if (!trimmed) {
        setError('Trip name is required')
        return
      }
      const memberIds = Array.from(selectedMemberIds) as Id<'members'>[]
      if (memberIds.length === 0) {
        setError('Select at least one member')
        return
      }
      try {
        const sandboxId = await createSandbox({ groupId, name: trimmed, currency, memberIds })
        onClose()
        navigate({
          to: '/groups/$groupId/sandbox/$sandboxId',
          params: { groupId, sandboxId },
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create trip')
      }
    },
    [name, currency, selectedMemberIds, groupId, createSandbox, onClose, navigate]
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">New Trip / Sandbox</h2>
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
            <label htmlFor="sandbox-name" className="block text-sm font-medium text-gray-700 mb-1">
              Trip or event name
            </label>
            <input
              id="sandbox-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dubai Trip, Paris Weekend"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="sandbox-currency" className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              id="sandbox-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Members in this trip</label>
            <p className="text-xs text-gray-500 mb-2">Toggle off members who are not part of this trip</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {members.map((m) => (
                <button
                  key={m._id}
                  type="button"
                  onClick={() => toggleMember(m._id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedMemberIds.has(m._id)
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
          >
            Create
          </button>
        </form>
      </div>
    </div>
  )
}
