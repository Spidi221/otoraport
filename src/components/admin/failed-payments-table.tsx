'use client';

import { useState } from 'react';
import { AlertCircle, RefreshCw, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FailedPayment {
  id: string;
  customerName: string;
  customerEmail: string;
  plan: string;
  amount: number;
  failureReason: string;
  attemptedDate: string;
  status: 'failed' | 'requires_payment_method' | 'requires_action';
}

interface FailedPaymentsTableProps {
  payments: FailedPayment[];
}

export function FailedPaymentsTable({ payments }: FailedPaymentsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === 'all' || payment.plan === planFilter;
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPayments.length / pageSize);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
      failed: { label: 'Nieudane', variant: 'destructive' },
      requires_payment_method: { label: 'Wymagana metoda płatności', variant: 'secondary' },
      requires_action: { label: 'Wymaga akcji', variant: 'default' },
    };

    const config = statusConfig[status] || { label: status, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const planColors: Record<string, string> = {
      Starter: 'bg-blue-100 text-blue-700 border-blue-200',
      Pro: 'bg-purple-100 text-purple-700 border-purple-200',
      Enterprise: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };

    return (
      <Badge variant="outline" className={planColors[plan] || ''}>
        {plan}
      </Badge>
    );
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Nieudane Płatności
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {filteredPayments.length} {filteredPayments.length === 1 ? 'płatność' : 'płatności'} wymagających uwagi
              </p>
            </div>
          </div>
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {payments.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Szukaj po nazwisku lub emailu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="border-gray-300">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie plany</SelectItem>
              <SelectItem value="Starter">Starter</SelectItem>
              <SelectItem value="Pro">Pro</SelectItem>
              <SelectItem value="Enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="border-gray-300">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie statusy</SelectItem>
              <SelectItem value="failed">Nieudane</SelectItem>
              <SelectItem value="requires_payment_method">Wymagana metoda</SelectItem>
              <SelectItem value="requires_action">Wymaga akcji</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {paginatedPayments.length > 0 ? (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-700">Klient</TableHead>
                  <TableHead className="font-semibold text-gray-700">Plan</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Kwota</TableHead>
                  <TableHead className="font-semibold text-gray-700">Powód niepowodzenia</TableHead>
                  <TableHead className="font-semibold text-gray-700">Data próby</TableHead>
                  <TableHead className="font-semibold text-gray-700">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPayments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{payment.customerName}</span>
                        <span className="text-sm text-gray-500">{payment.customerEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getPlanBadge(payment.plan)}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                        {payment.failureReason}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(payment.attemptedDate)}
                    </TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-3 w-3" />
                        Ponów próbę
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Brak nieudanych płatności
            </h3>
            <p className="text-gray-600">
              {searchQuery || planFilter !== 'all' || statusFilter !== 'all'
                ? 'Nie znaleziono płatności spełniających kryteria wyszukiwania'
                : 'Wszystkie płatności zostały przetworzone pomyślnie'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {paginatedPayments.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Pokaż</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">wyników</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Poprzednia
              </Button>
              <span className="text-sm text-gray-600">
                Strona {currentPage} z {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Następna
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
