'use client';

/**
 * Audit Logs Table Component
 *
 * Displays audit log entries in a sortable, filterable table with search and export functionality
 */

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { getActionDisplayName, formatAuditChanges, type AuditAction } from '@/lib/audit-logger';

interface AuditLog {
  id: string;
  user_id: string;
  developer_id: string | null;
  action: AuditAction;
  resource_type: string | null;
  resource_id: string | null;
  changes: any;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
  created_at: string;
  developer_info?: {
    company_name: string;
    email: string;
  } | null;
}

interface AuditLogsTableProps {
  apiEndpoint: string;
  showUserInfo?: boolean; // For admin view
}

export function AuditLogsTable({ apiEndpoint, showUserInfo = false }: AuditLogsTableProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const limit = 50;

  // Fetch logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) params.append('search', search);
      if (actionFilter) params.append('action', actionFilter);
      if (dateFrom) params.append('dateFrom', new Date(dateFrom).toISOString());
      if (dateTo) params.append('dateTo', new Date(dateTo).toISOString());

      const response = await fetch(`${apiEndpoint}?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      alert('Nie udało się pobrać dziennika aktywności');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, dateFrom, dateTo]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchLogs();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = showUserInfo
      ? ['Data', 'Użytkownik', 'Akcja', 'Zasób', 'IP', 'Zmiany']
      : ['Data', 'Akcja', 'Zasób', 'IP', 'Zmiany'];

    const rows = logs.map(log => {
      const row = [
        new Date(log.created_at).toLocaleString('pl-PL'),
        ...(showUserInfo ? [log.developer_info?.company_name || log.developer_info?.email || 'N/A'] : []),
        getActionDisplayName(log.action),
        log.resource_type || 'N/A',
        log.ip_address || 'N/A',
        formatAuditChanges(log.changes),
      ];
      return row.map(cell => `"${cell}"`).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Get unique action types from current logs for filter
  const actionTypes = Array.from(new Set(logs.map(log => log.action)));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Dziennik Aktywności</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Odśwież
            </Button>
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={logs.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Eksport CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Szukaj..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtruj po akcji" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Wszystkie akcje</SelectItem>
              {actionTypes.map(action => (
                <SelectItem key={action} value={action}>
                  {getActionDisplayName(action as AuditAction)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            placeholder="Data od"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />

          <Input
            type="date"
            placeholder="Data do"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data i czas</TableHead>
                {showUserInfo && <TableHead>Użytkownik</TableHead>}
                <TableHead>Akcja</TableHead>
                <TableHead>Typ zasobu</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Zmiany</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={showUserInfo ? 6 : 5} className="text-center py-8 text-gray-500">
                    Ładowanie...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showUserInfo ? 6 : 5} className="text-center py-8 text-gray-500">
                    Brak wpisów w dzienniku
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {new Date(log.created_at).toLocaleString('pl-PL', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    {showUserInfo && (
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {log.developer_info?.company_name || 'N/A'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {log.developer_info?.email || ''}
                          </span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="outline">
                        {getActionDisplayName(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {log.resource_type || 'N/A'}
                      </code>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-600">
                      {log.ip_address || 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-gray-600">
                      {formatAuditChanges(log.changes)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600">
              Wyświetlanie {(page - 1) * limit + 1}-{Math.min(page * limit, total)} z {total} wpisów
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
                Poprzednia
              </Button>
              <span className="text-sm">
                Strona {page} z {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Następna
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
