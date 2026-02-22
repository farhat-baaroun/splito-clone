import { useState, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { useNavigate } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { api } from '@convex/_generated/api'

interface CreateGroupFormProps {
  onClose: () => void
}

export default function CreateGroupForm({ onClose }: CreateGroupFormProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const createGroup = useMutation(api.groups.create)
  const navigate = useNavigate()

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')
      const trimmed = name.trim()
      if (!trimmed) {
        setError('Group name is required')
        return
      }
      try {
        const id = await createGroup({ name: trimmed })
        onClose()
        navigate({ to: '/groups/$groupId', params: { groupId: id } })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create group')
      }
    },
    [name, createGroup, onClose, navigate]
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">New Group</h2>
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
            <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-1">
              Group name
            </label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Friends, Roommates"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
          >
            Create Group
          </button>
        </form>
      </div>
    </div>
  )
}
