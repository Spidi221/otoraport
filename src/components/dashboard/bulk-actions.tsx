/**
 * Bulk Actions Toolbar - Actions for multiple selected properties
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PropertyStatus } from './status-badge'
import { X, Loader2, CheckCircle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface BulkActionsProps {
  selectedIds: string[]
  onClearSelection: () => void
  onSuccess?: () => void
}

export function BulkActions({
  selectedIds,
  onClearSelection,
  onSuccess,
}: BulkActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<PropertyStatus>('available')

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) return

    setIsUpdating(true)

    try {
      const response = await fetch('/api/properties/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyIds: selectedIds,
          status: selectedStatus,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update properties')
      }

      const data = await response.json()

      if (data.success) {
        toast.success(
          `Zaktualizowano ${data.updatedCount} z ${data.requestedCount} mieszkań`
        )
        onClearSelection()
        onSuccess?.()
      } else {
        throw new Error(data.error || 'Update failed')
      }
    } catch (error) {
      console.error('❌ Bulk update error:', error)
      toast.error('Nie udało się zaktualizować statusów')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return

    setIsDeleting(true)

    try {
      const response = await fetch('/api/properties/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyIds: selectedIds,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete properties')
      }

      const data = await response.json()

      if (data.success) {
        toast.success(
          `Usunięto ${data.deletedCount} z ${data.requestedCount} mieszkań`
        )
        onClearSelection()
        onSuccess?.()
      } else {
        throw new Error(data.error || 'Delete failed')
      }
    } catch (error) {
      console.error('❌ Bulk delete error:', error)
      toast.error('Nie udało się usunąć mieszkań')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (selectedIds.length === 0) {
    return null
  }

  const isLoading = isUpdating || isDeleting

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Selection info */}
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Wybrano: {selectedIds.length}
            </span>
          </div>

          <div className="h-6 w-[1px] bg-border" />

          {/* Status selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-900">Zmień status na:</span>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as PropertyStatus)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[140px] h-8 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Dostępne</SelectItem>
                <SelectItem value="reserved">Zarezerwowane</SelectItem>
                <SelectItem value="sold">Sprzedane</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Apply button */}
          <Button
            size="sm"
            onClick={handleBulkUpdate}
            disabled={isLoading}
            className="h-8"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Aktualizacja...
              </>
            ) : (
              'Zastosuj'
            )}
          </Button>

          <div className="h-6 w-[1px] bg-border" />

          {/* Delete button */}
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
            className="h-8"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Usuwanie...
              </>
            ) : (
              <>
                <Trash2 className="w-3 h-3 mr-2" />
                Usuń zaznaczone ({selectedIds.length})
              </>
            )}
          </Button>

          {/* Clear selection */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            disabled={isLoading}
            className="h-8 ml-auto"
          >
            <X className="w-4 h-4 mr-1" />
            Wyczyść zaznaczenie
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć mieszkania?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja usunie <strong>{selectedIds.length} {selectedIds.length === 1 ? 'mieszkanie' : 'mieszkań'}</strong> z bazy danych.
              <br />
              <br />
              Tej akcji nie można cofnąć. Dane zostaną trwale usunięte z systemu oraz z publicznych endpointów ministerstwa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Anuluj
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Usuwanie...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Usuń {selectedIds.length} {selectedIds.length === 1 ? 'mieszkanie' : 'mieszkań'}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
