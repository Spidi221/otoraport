/**
 * Status Select Component - Dropdown for changing property status
 */

'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PropertyStatus } from './status-badge'
import { Loader2 } from 'lucide-react'

interface StatusSelectProps {
  currentStatus: PropertyStatus
  propertyId: string
  onStatusChange?: (status: PropertyStatus) => void
  disabled?: boolean
}

export function StatusSelect({
  currentStatus,
  propertyId,
  onStatusChange,
  disabled = false,
}: StatusSelectProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus || isUpdating) return

    setIsUpdating(true)

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const data = await response.json()
      console.log('✅ Status updated:', data)

      onStatusChange?.(newStatus as PropertyStatus)
    } catch (error) {
      console.error('❌ Error updating status:', error)
      // TODO: Show toast notification
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={disabled || isUpdating}
    >
      <SelectTrigger className="w-[140px] h-8">
        {isUpdating ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-xs">Aktualizacja...</span>
          </div>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="available">Dostępne</SelectItem>
        <SelectItem value="reserved">Zarezerwowane</SelectItem>
        <SelectItem value="sold">Sprzedane</SelectItem>
      </SelectContent>
    </Select>
  )
}
