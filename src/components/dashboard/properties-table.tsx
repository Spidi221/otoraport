'use client'

import { useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { PropertyData, PaginatedResponse, isApiSuccess, PropertyStatus } from "@/types/api";
import { Search, X } from "lucide-react";

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
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/properties', {
          credentials: 'include'
        });
        const result: PaginatedResponse<PropertyData> = await response.json();

        console.log('🔍 PROPERTIES TABLE: API response:', result)
        console.log('🔍 PROPERTIES TABLE: success:', result.success)
        console.log('🔍 PROPERTIES TABLE: data:', result.data)
        console.log('🔍 PROPERTIES TABLE: data length:', result.data?.length)
        console.log('🔍 PROPERTIES TABLE: pagination:', result.pagination)
        console.log('🔍 PROPERTIES TABLE: isApiSuccess check:', isApiSuccess(result))

        if (isApiSuccess(result)) {
          console.log('✅ PROPERTIES TABLE: Setting properties:', result.data.length, 'items')
          setProperties(result.data);
          setFilteredProperties(result.data);
          setPagination(result.pagination);
        } else {
          console.error('❌ PROPERTIES TABLE: API failed, error:', result.error)
          setError(result.error || 'Nie udało się pobrać danych nieruchomości');
        }
      } catch (err) {
        console.error('💥 PROPERTIES TABLE: Error fetching properties:', err);
        setError('Wystąpił błąd podczas pobierania danych');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Search filtering effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProperties(properties);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = properties.filter((property) => {
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

    setFilteredProperties(filtered);
  }, [searchQuery, properties]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Nieruchomości</CardTitle>
          <div className="relative w-full max-w-sm">
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 font-medium text-sm">Nr lokalu</th>
                <th className="pb-3 font-medium text-sm">Typ</th>
                <th className="pb-3 font-medium text-sm">Projekt</th>
                <th className="pb-3 font-medium text-sm">Powierzchnia</th>
                <th className="pb-3 font-medium text-sm">Cena/m²</th>
                <th className="pb-3 font-medium text-sm">Cena całkowita</th>
                <th className="pb-3 font-medium text-sm">Status</th>
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
                  <td colSpan={7} className="py-8 text-center">
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
                  <td colSpan={7} className="py-8 text-center">
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
                filteredProperties.map((property) => (
                  <tr key={property.id} className="border-b last:border-b-0">
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
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination and search results */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              'Ładowanie...'
            ) : error ? (
              'Błąd pobierania danych'
            ) : searchQuery ? (
              `Znaleziono ${filteredProperties.length} z ${properties.length} nieruchomości`
            ) : properties.length === 0 ? (
              'Brak nieruchomości do wyświetlenia'
            ) : (
              `Pokazano ${Math.min(pagination.limit, properties.length)} z ${pagination.total} nieruchomości`
            )}
          </div>
          {!searchQuery && pagination.total > pagination.limit && (
            <div className="text-sm text-muted-foreground">
              Strona {pagination.page} z {Math.ceil(pagination.total / pagination.limit)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}