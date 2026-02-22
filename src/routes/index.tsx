import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Users, Share2 } from 'lucide-react'
import CreateGroupForm from '@/components/CreateGroupForm'

export const Route = createFileRoute('/')({ component: Landing })

function Landing() {
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Splayto</h1>
          <p className="text-gray-600">Split expenses with friends. No sign-up required.</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setShowCreateGroup(true)}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 transition-colors"
          >
            <Plus size={24} />
            Create a Group
          </button>

          <div className="flex items-center gap-4 py-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-2">
              Have a share link? Open it to view and edit the group.
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Share2 size={14} />
              Share <code className="bg-gray-100 px-1 rounded">/groups/...</code> with anyone
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 text-gray-500">
          <Users size={40} className="text-emerald-200" />
          <p className="text-sm text-center max-w-xs">
            Create a group, add members, then create trips or events to track expenses.
          </p>
        </div>
      </div>

      {showCreateGroup && (
        <CreateGroupForm onClose={() => setShowCreateGroup(false)} />
      )}
    </div>
  )
}
