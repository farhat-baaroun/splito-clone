import { useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/demo/convex')({
  component: ConvexDemoRedirect,
})

function ConvexDemoRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate({ to: '/' })
  }, [navigate])
  return null
}
