'use client'

import { useState, useEffect } from 'react'
import { Trash2, RefreshCw, FileText, Calendar, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UploadedFile {
  id: string
  file_name: string
  file_size: number
  created_at: string
  processed: boolean
  processed_at?: string
  project?: {
    id: string
    name: string
  }
}

export function FileManagement() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch files on mount
  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/files/list')
      const data = await response.json()

      if (data.success) {
        setFiles(data.files || [])
      } else {
        console.error('Failed to fetch files:', data.error)
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (fileId: string) => {
    setFileToDelete(fileId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return

    try {
      setActionLoading(fileToDelete)
      const response = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: fileToDelete })
      })

      const data = await response.json()

      if (data.success) {
        // Remove file from list
        setFiles(files.filter(f => f.id !== fileToDelete))
        alert('✅ ' + data.message)
      } else {
        alert('❌ Błąd: ' + data.error)
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('❌ Nie udało się usunąć pliku')
    } finally {
      setActionLoading(null)
      setDeleteDialogOpen(false)
      setFileToDelete(null)
    }
  }

  const handleReprocess = async (fileId: string) => {
    if (!confirm('Czy na pewno chcesz ponownie przetworzyć ten plik? Obecne dane zostaną zastąpione.')) {
      return
    }

    try {
      setActionLoading(fileId)
      const response = await fetch('/api/files/reprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId })
      })

      const data = await response.json()

      if (data.success) {
        alert('✅ ' + data.message)
        // Refresh files list
        await fetchFiles()
      } else {
        alert('❌ Błąd: ' + data.error)
      }
    } catch (error) {
      console.error('Error reprocessing file:', error)
      alert('❌ Nie udało się ponownie przetworzyć pliku')
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Uploadowane Pliki</CardTitle>
          <CardDescription>Zarządzaj swoimi plikami CSV i XML</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Ładowanie plików...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (files.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Uploadowane Pliki</CardTitle>
          <CardDescription>Zarządzaj swoimi plikami CSV i XML</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nie masz jeszcze żadnych uploadowanych plików.</p>
            <p className="text-sm text-muted-foreground mt-2">Użyj przycisku "Dodaj Plik" powyżej, aby zacząć.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Uploadowane Pliki ({files.length})</CardTitle>
          <CardDescription>Zarządzaj swoimi plikami CSV i XML</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa Pliku</TableHead>
                  <TableHead>Projekt</TableHead>
                  <TableHead>Rozmiar</TableHead>
                  <TableHead>Data Uploadu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {file.file_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {file.project ? (
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {file.project.name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Brak projektu</span>
                      )}
                    </TableCell>
                    <TableCell>{formatFileSize(file.file_size)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(file.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {file.processed ? (
                        <Badge variant="default" className="bg-green-500">
                          Przetworzony
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Oczekuje
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReprocess(file.id)}
                          disabled={actionLoading === file.id}
                        >
                          {actionLoading === file.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Przetwórz ponownie
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(file.id)}
                          disabled={actionLoading === file.id}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Usuń
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć ten plik?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja jest nieodwracalna. Plik zostanie trwale usunięty wraz ze wszystkimi
              powiązanymi nieruchomościami z bazy danych.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Tak, usuń plik
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}