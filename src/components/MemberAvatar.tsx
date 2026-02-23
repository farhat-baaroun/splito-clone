import { memo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

function hashToHue(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash % 360)
}

interface MemberAvatarProps {
  name: string
  memberId: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  imageStorageId?: Id<'_storage'> | null
  className?: string
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

function MemberAvatarComponent({
  name,
  memberId,
  size = 'md',
  imageStorageId,
  className = '',
}: MemberAvatarProps) {
  const imageUrl = useQuery(
    api.files.getUrl,
    imageStorageId ? { storageId: imageStorageId } : 'skip'
  )
  const letter = name.charAt(0).toUpperCase() || '?'
  const hue = hashToHue(memberId)
  const bgColor = `hsl(${hue}, 65%, 45%)`
  const sizeClass = sizeClasses[size]

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`rounded-full object-cover ${sizeClass} ${className}`}
      />
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white shrink-0 ${sizeClass} ${className}`}
      style={{ backgroundColor: bgColor }}
      title={name}
    >
      {letter}
    </div>
  )
}

export default memo(MemberAvatarComponent)
