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

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold, rootMargin, hasBeenVisible])

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  )
}