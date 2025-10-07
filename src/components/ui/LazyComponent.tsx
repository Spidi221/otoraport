'use client'

import { useState, useEffect, useRef, ReactNode } from 'react'

interface LazyComponentProps {
  children: ReactNode
  threshold?: number
  fallback?: ReactNode
  rootMargin?: string
}

export function LazyComponent({ 
  children, 
  threshold = 0.1, 
  fallback = null, 
  rootMargin = '50px' 
}: LazyComponentProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasBeenVisible) {
          setIsVisible(true)
          setHasBeenVisible(true)
          observer.unobserve(entry.target)
        }
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [threshold, rootMargin, hasBeenVisible])

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  )
}