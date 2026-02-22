import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Plus, Users, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import SandboxCard from '@/components/SandboxCard'
import CreateSandboxForm from '@/components/CreateSandboxForm'
import ImageUpload from '@/components/ImageUpload'
import type { Id } from '@convex/_generated/dataModel'

export const Route = createFileRoute('/groups/$groupId/')({
  component: GroupDashboard,
})

function GroupDashboard() {
  const { groupId } = Route.useParams()
  const [showCreateSandbox, setShowCreateSandbox] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const sandboxes = useQuery(api.sandboxes.listByGroupWithSummary, {
    groupId: groupId as Id<'groups'>,
  })
  const members = useQuery(api.members.listByGroup, {
    groupId: groupId as Id<'groups'>,
  })
  const addMember = useMutation(api.members.add)
  const removeMember = useMutation(api.members.remove)
  const updateMemberImage = useMutation(api.members.updateImage)

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newMemberName.trim()
    if (!name) return
    try {
      await addMember({ groupId: groupId as Id<'groups'>, name })
      setNewMemberName('')
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <button
          onClick={() => setShowMembers(!showMembers)}
          className="w-full flex items-center justify-between text-left"
        >
          <span className="flex items-center gap-2 font-medium text-gray-900">
            <Users size={18} />
            Members ({members?.length ?? 0})
          </span>
          {showMembers ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        {showMembers && (
          <div className="mt-4 space-y-3">
            <form onSubmit={handleAddMember} className="flex gap-2">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Add member name"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
              >
                Add
              </button>
            </form>
            <ul className="space-y-1">
              {members?.map((m) => (
                <li
                  key={m._id}
                  className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <ImageUpload
                    storageId={m.imageStorageId}
                    onUploaded={(id) => updateMemberImage({ id: m._id, imageStorageId: id })}
                    size="sm"
                    shape="circle"
                  />
                  <span className="text-gray-900 flex-1">{m.name}</span>
                  <button
                    onClick={() => removeMember({ id: m._id })}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label={`Remove ${m.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="sticky top-14 z-10 -mx-4 px-4 py-3 bg-gray-50 border-b border-gray-200 -mt-4 mb-2">
        <button
          onClick={() => setShowCreateSandbox(true)}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors"
        >
          <Plus size={20} />
          New Trip / Sandbox
        </button>
      </div>

      <div className="space-y-3">
        {sandboxes === undefined ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : sandboxes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-600 mb-4">No trips yet</p>
            <p className="text-sm text-gray-500 mb-6">
              Create your first trip or event to start tracking expenses.
            </p>
            <button
              onClick={() => setShowCreateSandbox(true)}
              className="inline-flex items-center gap-2 py-2 px-4 bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200 transition-colors"
            >
              <Plus size={18} />
              New Trip
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sandboxes.map((sb) => (
              <SandboxCard
                key={sb._id}
                sandboxId={sb._id}
                groupId={sb.groupId}
                name={sb.name}
                status={sb.status}
                totalExpense={sb.totalExpense}
                memberCount={sb.memberCount}
                lastActivity={sb.lastActivity}
                currency={sb.currency}
                imageStorageId={sb.imageStorageId}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateSandbox && (
        <CreateSandboxForm
          groupId={groupId as Id<'groups'>}
          onClose={() => setShowCreateSandbox(false)}
        />
      )}
    </div>
  )
}
