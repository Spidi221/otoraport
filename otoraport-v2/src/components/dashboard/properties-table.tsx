'use client'

import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { PropertyData, PaginatedResponse, isApiSuccess, PropertyStatus } from "@/types/api";
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

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
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Log SWR data for debugging
  useEffect(() => {
    if (data) {
      console.log('🔍 PROPERTIES TABLE: SWR data:', data);
      console.log('✅ PROPERTIES TABLE: Loaded', properties.length, 'properties for page', page);
    }
  }, [data, properties.length, page]);

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

  // Search and sort with useMemo
  const filteredProperties = React.useMemo(() => {
    let filtered = [...properties];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((property) => {
        return (
          property.property_number?.toLowerCase().includes(query) ||
          property.area?.toString().includes(query) ||
          property.price_per_m2?.toString().includes(query) ||
          property.total_price?.toString().includes(query) ||
          property.status?.toLowerCase().includes(query)
        );
      });
    }

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        let aVal: string | number = a[sortColumn as keyof PropertyData] as string | number;
        let bVal: string | number = b[sortColumn as keyof PropertyData] as string | number;

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
  }, [searchQuery, sortColumn, sortDirection, properties]);

  // Delete handler for individual property
  const handleDelete = async (id: string, propertyNumber: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć mieszkanie ${propertyNumber}?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Usunięto mieszkanie ${propertyNumber}`);
        // Refresh data from server
        mutate();
      } else {
        toast.error(result.error || 'Nie udało się usunąć mieszkania');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Wystąpił błąd podczas usuwania mieszkania');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>Mieszkania ({pagination.total})</CardTitle>
          </div>

          {/* Search Box */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Szukaj mieszkań..."
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-sm">
                  <button
                    onClick={() => handleSort('property_number')}
                    className="flex items-center hover:text-blue-600 transition-colors"
                  >
                    Nr mieszkania
                    {getSortIcon('property_number')}
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
                    Cena końcowa
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
                <th className="pb-3 font-medium text-sm">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b">
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
                    <td className="py-3">
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
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
                  <td colSpan={6} className="py-8 text-center">
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
                          <p className="font-medium">Brak mieszkań</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Wgraj plik CSV lub Excel z danymi mieszkań, aby zobaczyć je tutaj.
                          </p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProperties.map((property) => {
                  const isDeleting = deletingId === property.id;
                  return (
                    <tr
                      key={property.id}
                      className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 font-mono text-sm">{property.property_number}</td>
                      <td className="py-3 text-sm">
                        {property.area !== null && property.area !== undefined && property.area > 0
                          ? `${property.area} m²`
                          : <span className="text-gray-400 italic">Brak danych</span>}
                      </td>
                      <td className="py-3 text-sm">{property.price_per_m2.toLocaleString('pl-PL')} zł</td>
                      <td className="py-3 text-sm font-medium">{property.total_price.toLocaleString('pl-PL')} zł</td>
                      <td className="py-3">{getStatusBadge(property.status)}</td>
                      <td className="py-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(property.id, property.property_number)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            'Usuwanie...'
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-1" />
                              Usuń
                            </>
                          )}
                        </Button>
                      </td>
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
              `Znaleziono ${filteredProperties.length} z ${properties.length} mieszkań (strona ${pagination.page})`
            ) : properties.length === 0 ? (
              'Brak mieszkań do wyświetlenia'
            ) : (
              `Pokazano ${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} z ${pagination.total} mieszkań`
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
    </Card>
  );
}