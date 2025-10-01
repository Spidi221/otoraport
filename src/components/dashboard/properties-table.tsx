'use client'

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { PropertyData, PaginatedResponse, isApiSuccess, PropertyStatus } from "@/types/api";
import { Search, X, Filter, ArrowUpDown, ArrowUp, ArrowDown, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { bulkOperationsService } from "@/lib/bulk-operations";

// SWR fetcher with error handling
const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Failed to fetch properties');
  }
  return response.json();
};

const getStatusBadge = (status: PropertyStatus) => {
  switch (status) {
    case 'available':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Dostępne</Badge>;
    case 'reserved':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Zarezerwowane</Badge>;
    case 'sold':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Sprzedane</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export function PropertiesTable() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20); // 20 items per page
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // SWR for data fetching with caching
  const { data, error: swrError, isLoading, mutate } = useSWR<PaginatedResponse<PropertyData>>(
    `/api/properties?page=${page}&limit=${limit}`,
    fetcher,
    {
      revalidateOnFocus: false, // Don't refetch on window focus
      revalidateOnReconnect: false, // Don't refetch on reconnect
      dedupingInterval: 60000, // Dedupe requests within 60 seconds
      keepPreviousData: true // Keep previous data while loading new page
    }
  );

  const properties = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 };
  const error = swrError ? 'Wystąpił błąd podczas pobierania danych' : (data && !isApiSuccess(data) ? data.error : null);

  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [bulkNewStatus, setBulkNewStatus] = useState<PropertyStatus>('available');
  const [isBulkOperating, setIsBulkOperating] = useState(false);

  // Log SWR data for debugging
  useEffect(() => {
    if (data) {
      console.log('🔍 PROPERTIES TABLE: SWR data:', data);
      console.log('✅ PROPERTIES TABLE: Loaded', properties.length, 'properties for page', page);
    }
  }, [data, properties.length, page]);

  // Clear selection when page changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page]);

  // Get unique project names for filter (memoized to prevent infinite re-renders)
  const uniqueProjects = React.useMemo(() =>
    Array.from(new Set(properties.map(p => p.project_name).filter(Boolean))),
    [properties]
  );

  // Sort handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-40" />;
    }
    return sortDirection === 'asc' ?
      <ArrowUp className="w-4 h-4 ml-1" /> :
      <ArrowDown className="w-4 h-4 ml-1" />;
  };

  // Search and filter with useMemo (not useEffect to avoid infinite loops)
  const filteredProperties = React.useMemo(() => {
    let filtered = [...properties];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((property) => {
        return (
          property.property_number?.toLowerCase().includes(query) ||
          property.property_type?.toLowerCase().includes(query) ||
          property.project_name?.toLowerCase().includes(query) ||
          property.area?.toString().includes(query) ||
          property.price_per_m2?.toString().includes(query) ||
          property.total_price?.toString().includes(query) ||
          property.status?.toLowerCase().includes(query)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((property) => property.status === statusFilter);
    }

    // Apply project filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter((property) => property.project_name === projectFilter);
    }

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aVal: any = a[sortColumn as keyof PropertyData];
        let bVal: any = b[sortColumn as keyof PropertyData];

        // Handle null/undefined
        if (aVal == null) aVal = '';
        if (bVal == null) bVal = '';

        // Compare
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [searchQuery, statusFilter, projectFilter, sortColumn, sortDirection, properties]);

  // Bulk operations handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProperties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProperties.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsBulkOperating(true);
    try {
      const response = await fetch('/api/properties/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ propertyIds: Array.from(selectedIds) })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Usunięto ${selectedIds.size} nieruchomości`);

        // Refresh data from server
        mutate();
        setSelectedIds(new Set());
        setShowDeleteDialog(false);
      } else {
        toast.error(result.error || 'Nie udało się usunąć nieruchomości');
      }
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Wystąpił błąd podczas usuwania nieruchomości');
    } finally {
      setIsBulkOperating(false);
    }
  };

  const handleBulkStatusChange = async () => {
    if (selectedIds.size === 0) return;

    setIsBulkOperating(true);
    try {
      const response = await fetch('/api/properties/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          propertyIds: Array.from(selectedIds),
          newStatus: bulkNewStatus
        })
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Zaktualizowano status ${selectedIds.size} nieruchomości`);

        // Refresh data from server
        mutate();
        setSelectedIds(new Set());
        setShowStatusDialog(false);
      } else {
        toast.error(result.error || 'Nie udało się zaktualizować statusu');
      }
    } catch (error) {
      console.error('Bulk status change error:', error);
      toast.error('Wystąpił błąd podczas aktualizacji statusu');
    } finally {
      setIsBulkOperating(false);
    }
  };

  const getStatusLabel = (status: PropertyStatus) => {
    switch (status) {
      case 'available': return 'Dostępne';
      case 'reserved': return 'Zarezerwowane';
      case 'sold': return 'Sprzedane';
      default: return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>Nieruchomości</CardTitle>
          </div>

          {/* Search and Filters Row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Szukaj nieruchomości..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie statusy</SelectItem>
                  <SelectItem value="available">Dostępne</SelectItem>
                  <SelectItem value="reserved">Zarezerwowane</SelectItem>
                  <SelectItem value="sold">Sprzedane</SelectItem>
                </SelectContent>
              </Select>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Projekt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie projekty</SelectItem>
                  {uniqueProjects.map((project) => (
                    <SelectItem key={project} value={project || ''}>
                      {project || 'Brak przypisania'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions Toolbar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg animate-in slide-in-from-top">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-900">
                  Wybrano {selectedIds.size} {selectedIds.size === 1 ? 'nieruchomość' : 'nieruchomości'}
                </span>
                <div className="h-4 w-px bg-blue-300" />
                <div className="flex items-center gap-2">
                  <Select
                    value={bulkNewStatus}
                    onValueChange={(value) => setBulkNewStatus(value as PropertyStatus)}
                  >
                    <SelectTrigger className="w-[180px] h-9 bg-white">
                      <SelectValue placeholder="Zmień status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Dostępne</SelectItem>
                      <SelectItem value="reserved">Zarezerwowane</SelectItem>
                      <SelectItem value="sold">Sprzedane</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setShowStatusDialog(true)}
                    disabled={isBulkOperating}
                  >
                    Zmień status
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isBulkOperating}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Usuń
                  </Button>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSelection}
                disabled={isBulkOperating}
              >
                Anuluj zaznaczenie
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 w-12">
                  <Checkbox
                    checked={filteredProperties.length > 0 && selectedIds.size === filteredProperties.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Zaznacz wszystkie"
                  />
                </th>
                <th className="pb-3 font-medium text-sm">
                  <button
                    onClick={() => handleSort('property_number')}
                    className="flex items-center hover:text-blue-600 transition-colors"
                  >
                    Nr lokalu
                    {getSortIcon('property_number')}
                  </button>
                </th>
                <th className="pb-3 font-medium text-sm">
                  <button
                    onClick={() => handleSort('property_type')}
                    className="flex items-center hover:text-blue-600 transition-colors"
                  >
                    Typ
                    {getSortIcon('property_type')}
                  </button>
                </th>
                <th className="pb-3 font-medium text-sm">
                  <button
                    onClick={() => handleSort('project_name')}
                    className="flex items-center hover:text-blue-600 transition-colors"
                  >
                    Projekt
                    {getSortIcon('project_name')}
                  </button>
                </th>
                <th className="pb-3 font-medium text-sm">
                  <button
                    onClick={() => handleSort('area')}
                    className="flex items-center hover:text-blue-600 transition-colors"
                  >
                    Powierzchnia
                    {getSortIcon('area')}
                  </button>
                </th>
                <th className="pb-3 font-medium text-sm">
                  <button
                    onClick={() => handleSort('price_per_m2')}
                    className="flex items-center hover:text-blue-600 transition-colors"
                  >
                    Cena/m²
                    {getSortIcon('price_per_m2')}
                  </button>
                </th>
                <th className="pb-3 font-medium text-sm">
                  <button
                    onClick={() => handleSort('total_price')}
                    className="flex items-center hover:text-blue-600 transition-colors"
                  >
                    Cena całkowita
                    {getSortIcon('total_price')}
                  </button>
                </th>
                <th className="pb-3 font-medium text-sm">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center hover:text-blue-600 transition-colors"
                  >
                    Status
                    {getSortIcon('status')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b">
                    <td className="py-3">
                      <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="py-3">
                      <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center">
                    <div className="text-red-600">
                      <p className="font-medium">Wystąpił błąd</p>
                      <p className="text-sm text-muted-foreground mt-1">{error}</p>
                      <button 
                        onClick={() => window.location.reload()} 
                        className="text-blue-600 hover:underline text-sm mt-2"
                      >
                        Spróbuj ponownie
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center">
                    <div className="text-gray-500">
                      {searchQuery ? (
                        <>
                          <p className="font-medium">Nie znaleziono wyników</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Spróbuj użyć innego zapytania wyszukiwania
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium">Brak nieruchomości</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Wgraj plik CSV lub XML z danymi nieruchomości, aby zobaczyć je tutaj.
                          </p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProperties.map((property) => {
                  const isSelected = selectedIds.has(property.id);
                  return (
                    <tr
                      key={property.id}
                      className={`border-b last:border-b-0 transition-colors ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="py-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(property.id)}
                          aria-label={`Zaznacz ${property.property_number}`}
                        />
                      </td>
                      <td className="py-3 font-mono text-sm">{property.property_number}</td>
                      <td className="py-3 text-sm">{property.property_type}</td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {property.project_name || 'Brak przypisania'}
                      </td>
                      <td className="py-3 text-sm">{property.area}m²</td>
                      <td className="py-3 text-sm">{property.price_per_m2.toLocaleString('pl-PL')} zł</td>
                      <td className="py-3 text-sm font-medium">{property.total_price.toLocaleString('pl-PL')} zł</td>
                      <td className="py-3">{getStatusBadge(property.status)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              'Ładowanie...'
            ) : error ? (
              'Błąd pobierania danych'
            ) : searchQuery ? (
              `Znaleziono ${filteredProperties.length} z ${properties.length} nieruchomości (strona ${pagination.page})`
            ) : properties.length === 0 ? (
              'Brak nieruchomości do wyświetlenia'
            ) : (
              `Pokazano ${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} z ${pagination.total} nieruchomości`
            )}
          </div>

          {/* Pagination buttons */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Poprzednia
              </Button>

              <div className="text-sm text-muted-foreground px-3">
                Strona {pagination.page} z {pagination.totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages || isLoading}
              >
                Następna
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Czy na pewno chcesz usunąć {selectedIds.size} {selectedIds.size === 1 ? 'nieruchomość' : 'nieruchomości'}?
            </DialogTitle>
            <DialogDescription>
              Ta operacja jest nieodwracalna. Wszystkie dane wybranych nieruchomości zostaną trwale usunięte z systemu.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isBulkOperating}
            >
              Anuluj
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isBulkOperating}
            >
              {isBulkOperating ? 'Usuwanie...' : 'Usuń'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Confirmation Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Zmień status {selectedIds.size} {selectedIds.size === 1 ? 'nieruchomości' : 'nieruchomości'}?
            </DialogTitle>
            <DialogDescription>
              Nowy status: <span className="font-semibold">{getStatusLabel(bulkNewStatus)}</span>
              <br />
              Ta operacja zaktualizuje status wszystkich wybranych nieruchomości.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
              disabled={isBulkOperating}
            >
              Anuluj
            </Button>
            <Button
              onClick={handleBulkStatusChange}
              disabled={isBulkOperating}
            >
              {isBulkOperating ? 'Aktualizowanie...' : 'Zmień status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}