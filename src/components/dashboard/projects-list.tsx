'use client'

import React, { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Trash2, FileText, Calendar, Home, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'

// SWR fetcher
const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) {
    throw new Error('Failed to fetch projects')
  }
  return response.json()
}

interface Project {
  id: string
  name: string
  slug: string
  description: string | null
  status: 'active' | 'inactive' | 'archived'
  created_at: string
  updated_at: string
  properties_count: number
}

export function ProjectsList() {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Fetch projects list
  const { data, error: swrError, isLoading, mutate } = useSWR<{ projects: Project[] }>(
    '/api/projects',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  const projects = data?.projects || []
  const error = swrError ? 'Wystąpił błąd podczas pobierania projektów' : null

  // Delete project handler
  const handleDelete = async (projectId: string, projectName: string, propertiesCount: number) => {
    if (!confirm(
      `Czy na pewno chcesz usunąć projekt "${projectName}"?\n\n` +
      `⚠️ UWAGA: To usunie również ${propertiesCount} mieszkań z tego projektu!\n\n` +
      `Ta operacja jest nieodwracalna.`
    )) {
      return
    }

    setDeletingId(projectId)
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message || `Projekt "${projectName}" został usunięty`)
        mutate() // Refresh projects list
      } else {
        toast.error(result.error || 'Nie udało się usunąć projektu')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Wystąpił błąd podczas usuwania projektu')
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wgrane pliki</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wgrane pliki</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 text-sm">
            <p className="font-medium">Wystąpił błąd</p>
            <p className="text-muted-foreground mt-1">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wgrane pliki</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="font-medium">Brak wgranych plików</p>
            <p className="text-sm text-muted-foreground mt-1">
              Wgraj plik CSV lub Excel aby zobaczyć je tutaj
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Wgrane pliki ({projects.length})</CardTitle>
          <p className="text-sm text-muted-foreground">
            Kliknij projekt aby zobaczyć szczegóły
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {projects.map((project) => {
            const isDeleting = deletingId === project.id
            const isExpanded = expandedId === project.id
            const createdAgo = formatDistanceToNow(new Date(project.created_at), {
              addSuffix: true,
              locale: pl
            })

            return (
              <div
                key={project.id}
                className="border rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                {/* Project Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        <span>{project.properties_count} mieszkań</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{createdAgo}</span>
                      </div>
                    </div>

                    {project.description && (
                      <p className="text-sm text-gray-600 mt-2">{project.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isExpanded ? null : project.id)}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Zwiń
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Rozwiń
                        </>
                      )}
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(project.id, project.name, project.properties_count)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>Usuwanie...</>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Usuń
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Status:</span>{' '}
                        <span className="text-muted-foreground">
                          {project.status === 'active' ? 'Aktywny' :
                           project.status === 'inactive' ? 'Nieaktywny' : 'Archiwalny'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Slug:</span>{' '}
                        <span className="text-muted-foreground font-mono text-xs">{project.slug}</span>
                      </div>
                      <div>
                        <span className="font-medium">Utworzony:</span>{' '}
                        <span className="text-muted-foreground">
                          {new Date(project.created_at).toLocaleDateString('pl-PL')}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Ostatnia aktualizacja:</span>{' '}
                        <span className="text-muted-foreground">
                          {new Date(project.updated_at).toLocaleDateString('pl-PL')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
