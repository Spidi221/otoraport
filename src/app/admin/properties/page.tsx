/**
 * Admin Properties Management Page
 * Task #64 - Build Admin Panel - Property Management
 *
 * Features:
 * - Cross-developer property search
 * - Advanced filters (developer, status, price, city)
 * - Bulk actions (approve, reject, delete)
 * - CSV export
 * - Pagination and sorting
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LoadingState } from '@/components/ui/loading';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Download, Check, X, Trash2, Search } from 'lucide-react';

interface Property {
  id: string;
  address: string;
  city: string | null;
  price: number;
  surface_area: number | null;
  rooms: number | null;
  status: string;
  developer_id: string;
  created_at: string;
  updated_at: string;
  developer: {
    id: string;
    company_name: string;
    email: string;
  };
}

interface PropertiesResponse {
  properties: Property[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  filters: any;
  filterOptions: {
    developers: Array<{ id: string; company_name: string; email: string }>;
    cities: string[];
  };
}

export default function AdminPropertiesPage() {
  const [data, setData] = useState<PropertiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [developerFilter, setDeveloperFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Bulk action states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | 'delete' | null;
  }>({ open: false, action: null });

  // Debounced search
  const [searchDebounced, setSearchDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Fetch properties
  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          search: searchDebounced,
          sortBy,
          sortOrder,
        });

        if (developerFilter && developerFilter !== 'all') {
          params.append('developer', developerFilter);
        }
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        if (cityFilter && cityFilter !== 'all') {
          params.append('city', cityFilter);
        }
        if (minPrice) {
          params.append('minPrice', minPrice);
        }
        if (maxPrice) {
          params.append('maxPrice', maxPrice);
        }

        const response = await fetch(`/api/admin/properties?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }

        const result = await response.json();
        setData(result);
        setSelectedIds(new Set()); // Clear selection on data refresh
      } catch (err) {
        console.error('❌ Error fetching properties:', err);
        setError('Failed to load properties');
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [page, searchDebounced, developerFilter, statusFilter, cityFilter, minPrice, maxPrice, sortBy, sortOrder]);

  // Toggle sort order
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  // Toggle all selection
  const toggleAllSelection = () => {
    if (!data) return;

    if (selectedIds.size === data.properties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.properties.map(p => p.id)));
    }
  };

  // Perform bulk action
  const performBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedIds.size === 0) return;

    setBulkActionLoading(true);

    try {
      const response = await fetch('/api/admin/properties/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          propertyIds: Array.from(selectedIds),
        }),
      });

      if (!response.ok) {
        throw new Error('Bulk action failed');
      }

      const result = await response.json();

      if (result.results.failed > 0) {
        alert(`Action completed with errors:\n${result.results.succeeded} succeeded, ${result.results.failed} failed`);
      } else {
        alert(`Successfully ${action}d ${result.results.succeeded} properties`);
      }

      // Refresh data
      setSelectedIds(new Set());
      setPage(1); // Reset to first page
      window.location.reload(); // Simple refresh for now
    } catch (err) {
      console.error('Bulk action error:', err);
      alert('Failed to perform bulk action');
    } finally {
      setBulkActionLoading(false);
      setConfirmDialog({ open: false, action: null });
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!data || data.properties.length === 0) return;

    const headers = ['Adres', 'Miasto', 'Cena', 'Powierzchnia', 'Pokoje', 'Status', 'Developer', 'Data utworzenia'];
    const rows = data.properties.map(p => [
      p.address,
      p.city || 'N/A',
      p.price.toLocaleString('pl-PL'),
      p.surface_area || 'N/A',
      p.rooms || 'N/A',
      p.status,
      p.developer.company_name,
      new Date(p.created_at).toLocaleDateString('pl-PL'),
    ]);

    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `properties_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Zarządzanie Nieruchomościami</h1>
          <p className="text-muted-foreground mt-1">
            Przeglądaj i zarządzaj wszystkimi nieruchomościami w systemie
          </p>
        </div>
        {data && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            {data.total} {data.total === 1 ? 'Nieruchomość' : 'Nieruchomości'}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">Szukaj</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Adres lub miasto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Developer Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Developer</label>
              <Select value={developerFilter} onValueChange={setDeveloperFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Wszyscy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszyscy</SelectItem>
                  {data?.filterOptions.developers.map((dev) => (
                    <SelectItem key={dev.id} value={dev.id}>
                      {dev.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Wszystkie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="dostępne">Dostępne</SelectItem>
                  <SelectItem value="zarezerwowane">Zarezerwowane</SelectItem>
                  <SelectItem value="sprzedane">Sprzedane</SelectItem>
                  <SelectItem value="wycofane">Wycofane</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* City Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Miasto</label>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Wszystkie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  {data?.filterOptions.cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Min Price */}
            <div>
              <label className="text-sm font-medium mb-2 block">Cena min (PLN)</label>
              <Input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min={0}
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="text-sm font-medium mb-2 block">Cena max (PLN)</label>
              <Input
                type="number"
                placeholder="Bez limitu"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min={0}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                Zaznaczono: {selectedIds.size} {selectedIds.size === 1 ? 'nieruchomość' : 'nieruchomości'}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDialog({ open: true, action: 'approve' })}
                  disabled={bulkActionLoading}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Zatwierdź
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDialog({ open: true, action: 'reject' })}
                  disabled={bulkActionLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Wycofaj
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmDialog({ open: true, action: 'delete' })}
                  disabled={bulkActionLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Usuń
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Nieruchomości</CardTitle>
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!data || data.properties.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Eksport CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8">
              <LoadingState message="Ładowanie nieruchomości..." />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : data && data.properties.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.size === data.properties.length}
                          onCheckedChange={toggleAllSelection}
                        />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('address')}
                      >
                        Adres {sortBy === 'address' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('city')}
                      >
                        Miasto {sortBy === 'city' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50 text-right"
                        onClick={() => handleSort('price')}
                      >
                        Cena {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead className="text-right">Powierzchnia</TableHead>
                      <TableHead className="text-right">Pokoje</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Developer</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('created_at')}
                      >
                        Utworzono {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.properties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(property.id)}
                            onCheckedChange={() => toggleSelection(property.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{property.address}</TableCell>
                        <TableCell>{property.city || 'N/A'}</TableCell>
                        <TableCell className="text-right">{formatPrice(property.price)}</TableCell>
                        <TableCell className="text-right">
                          {property.surface_area ? `${property.surface_area} m²` : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">{property.rooms || 'N/A'}</TableCell>
                        <TableCell>
                          <StatusBadge status={property.status} />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{property.developer.company_name}</div>
                            <div className="text-xs text-gray-500">{property.developer.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(property.created_at).toLocaleDateString('pl-PL', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Wyświetlanie {((page - 1) * 20) + 1} do {Math.min(page * 20, data.total)} z {data.total} nieruchomości
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Poprzednia
                  </Button>
                  <div className="text-sm">
                    Strona {page} z {data.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                  >
                    Następna
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Brak nieruchomości</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'approve' && 'Zatwierdź nieruchomości'}
              {confirmDialog.action === 'reject' && 'Wycofaj nieruchomości'}
              {confirmDialog.action === 'delete' && 'Usuń nieruchomości'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'approve' &&
                `Czy na pewno chcesz zatwierdzić ${selectedIds.size} ${selectedIds.size === 1 ? 'nieruchomość' : 'nieruchomości'}? Status zostanie zmieniony na "Dostępne".`
              }
              {confirmDialog.action === 'reject' &&
                `Czy na pewno chcesz wycofać ${selectedIds.size} ${selectedIds.size === 1 ? 'nieruchomość' : 'nieruchomości'}? Status zostanie zmieniony na "Wycofane".`
              }
              {confirmDialog.action === 'delete' &&
                `Czy na pewno chcesz usunąć ${selectedIds.size} ${selectedIds.size === 1 ? 'nieruchomość' : 'nieruchomości'}? Ta operacja jest nieodwracalna!`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDialog.action && performBulkAction(confirmDialog.action)}
              className={confirmDialog.action === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              Potwierdź
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
