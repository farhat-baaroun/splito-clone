import { useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Camera } from 'lucide-react'
import { api } from '@convex/_generated/api'
import type { Id } from '@convex/_generated/dataModel'

interface ImageUploadProps {
  storageId?: Id<'_storage'> | null
  onUploaded: (storageId: Id<'_storage'>) => void
  size?: 'sm' | 'md' | 'lg'
  shape?: 'circle' | 'square'
  className?: string
  readOnly?: boolean
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-28 h-28',
}

export default function ImageUpload({
  storageId,
  onUploaded,
  size = 'md',
  shape = 'circle',
  className = '',
  readOnly = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const generateUploadUrl = useMutation(api.files.generateUploadUrl)
  const imageUrl = useQuery(
    api.files.getUrl,
    storageId ? { storageId } : 'skip'
  )

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const url = await generateUploadUrl()
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      const { storageId: id } = await res.json()
      if (id) onUploaded(id)
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-xl'
  const sizeClass = sizeClasses[size]

  return (
    <div
      className={`relative ${sizeClass} ${shapeClass} overflow-hidden bg-gray-100 ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className={`w-full h-full object-cover ${shapeClass}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <Camera size={size === 'sm' ? 20 : size === 'md' ? 28 : 36} />
        </div>
      )}
      {!readOnly && (
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity disabled:opacity-50"
      >
        {uploading ? (
          <span className="text-white text-xs">Uploading...</span>
        ) : (
          <Camera size={24} className="text-white" />
        )}
      </button>
      )}
    </div>
  )
}
