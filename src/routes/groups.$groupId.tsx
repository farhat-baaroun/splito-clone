import { createFileRoute, Outlet, useParams } from '@tanstack/react-router'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import ImageUpload from '@/components/ImageUpload'

export const Route = createFileRoute('/groups/$groupId')({
  component: GroupLayout,
})

function GroupLayout() {
  const { groupId } = useParams({ from: '/groups/$groupId' })
  const groupIdTyped = groupId as Id<'groups'>
  const group = useQuery(api.groups.get, { id: groupIdTyped })
  const updateImage = useMutation(api.groups.updateImage)

  if (group === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (group === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-gray-600 mb-4">Group not found</p>
        <Link
          to="/"
          className="text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Back to home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            to="/"
            className="p-2 -m-2 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </Link>
          <ImageUpload
            storageId={group.imageStorageId}
            onUploaded={(storageId) => updateImage({ id: groupIdTyped, imageStorageId: storageId })}
            size="sm"
            shape="circle"
          />
          <h1 className="text-lg font-semibold text-gray-900 truncate flex-1">
            {group.name}
          </h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-4">
        <Outlet />
      </main>
    </div>
  )
}
