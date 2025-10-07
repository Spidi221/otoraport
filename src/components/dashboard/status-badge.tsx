/**
 * Status Badge Component - Color-coded property status indicator
 */

import { Badge } from '@/components/ui/badge'
import { CheckCircle, Circle, Clock } from 'lucide-react'

export type PropertyStatus = 'available' | 'sold' | 'reserved'

interface StatusBadgeProps {
  status: PropertyStatus
  className?: string
}

const statusConfig = {
  available: {
    label: 'Dostępne',
    variant: 'default' as const,
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200',
  },
  sold: {
    label: 'Sprzedane',
    variant: 'destructive' as const,
    icon: Circle,
    className: 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200',
  },
  reserved: {
    label: 'Zarezerwowane',
    variant: 'secondary' as const,
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.available
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={`${config.className} ${className || ''} flex items-center gap-1.5`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  )
}
