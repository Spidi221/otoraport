'use client';

import { useState } from 'react';
import { CreditCard, MoreVertical, Search, Filter, ArrowUpDown } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SubscriptionActionsModal } from './subscription-actions-modal';

interface Subscription {
  id: string;
  customerName: string;
  customerEmail: string;
  company?: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  status: 'active' | 'trialing' | 'past_due';
  mrr: number;
  nextBillingDate: string;
}

interface SubscriptionsTableProps {
  subscriptions: Subscription[];
}

type ActionType = 'upgrade-pro' | 'upgrade-enterprise' | 'downgrade-starter' | 'cancel' | null;

export function SubscriptionsTable({ subscriptions }: SubscriptionsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'revenue' | 'customer'>('date');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);

  const filteredSubscriptions = subscriptions
    .filter((sub) => {
      const matchesSearch =
        sub.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.company?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlan = planFilter === 'all' || sub.plan === planFilter;
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;

      return matchesSearch && matchesPlan && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.mrr - a.mrr;
        case 'customer':
          return a.customerName.localeCompare(b.customerName);
        case 'date':
        default:
          return new Date(a.nextBillingDate).getTime() - new Date(b.nextBillingDate).getTime();
      }
    });

  const totalPages = Math.ceil(filteredSubscriptions.length / pageSize);
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; className: string }
    > = {
      active: { label: 'Aktywna', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      trialing: { label: 'Okres próbny', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      past_due: { label: 'Po terminie', className: 'bg-red-100 text-red-700 border-red-200' },
    };

    const config = statusConfig[status] || { label: status, className: '' };
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const planColors: Record<string, string> = {
      Starter: 'bg-blue-50 text-blue-700 border-blue-300',
      Pro: 'bg-purple-50 text-purple-700 border-purple-300',
      Enterprise: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    };

    return (
      <Badge variant="outline" className={`font-semibold ${planColors[plan] || ''}`}>
        {plan}
      </Badge>
    );
  };

  const handleAction = (subscription: Subscription, action: ActionType) => {
    setSelectedSubscription(subscription);
    setActionType(action);
  };

  const closeModal = () => {
    setSelectedSubscription(null);
    setActionType(null);
  };

  return (
    <>
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Aktywne Subskrypcje
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredSubscriptions.length} {filteredSubscriptions.length === 1 ? 'subskrypcja' : 'subskrypcji'}
                </p>
              </div>
            </div>
            <Badge className="text-lg px-4 py-2 bg-blue-600">
              {subscriptions.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Szukaj po nazwie, emailu lub firmie..."
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
                <SelectItem value="active">Aktywne</SelectItem>
                <SelectItem value="trialing">Okres próbny</SelectItem>
                <SelectItem value="past_due">Po terminie</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="border-gray-300">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Data rozliczenia</SelectItem>
                <SelectItem value="revenue">Przychód</SelectItem>
                <SelectItem value="customer">Klient (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {paginatedSubscriptions.length > 0 ? (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Klient</TableHead>
                    <TableHead className="font-semibold text-gray-700">Plan</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">MRR</TableHead>
                    <TableHead className="font-semibold text-gray-700">Następne rozliczenie</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{subscription.customerName}</span>
                          <span className="text-sm text-gray-500">{subscription.customerEmail}</span>
                          {subscription.company && (
                            <span className="text-xs text-gray-400 mt-0.5">{subscription.company}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(subscription.plan)}</TableCell>
                      <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-gray-900">
                        {formatCurrency(subscription.mrr)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(subscription.nextBillingDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Zarządzaj subskrypcją</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {subscription.plan !== 'Pro' && subscription.plan !== 'Enterprise' && (
                              <DropdownMenuItem
                                onClick={() => handleAction(subscription, 'upgrade-pro')}
                                className="text-purple-600"
                              >
                                Upgrade do Pro
                              </DropdownMenuItem>
                            )}
                            {subscription.plan !== 'Enterprise' && (
                              <DropdownMenuItem
                                onClick={() => handleAction(subscription, 'upgrade-enterprise')}
                                className="text-emerald-600"
                              >
                                Upgrade do Enterprise
                              </DropdownMenuItem>
                            )}
                            {subscription.plan !== 'Starter' && (
                              <DropdownMenuItem
                                onClick={() => handleAction(subscription, 'downgrade-starter')}
                                className="text-blue-600"
                              >
                                Downgrade do Starter
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleAction(subscription, 'cancel')}
                              className="text-red-600"
                            >
                              Anuluj subskrypcję
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Brak subskrypcji
              </h3>
              <p className="text-gray-600">
                {searchQuery || planFilter !== 'all' || statusFilter !== 'all'
                  ? 'Nie znaleziono subskrypcji spełniających kryteria wyszukiwania'
                  : 'Nie ma jeszcze żadnych aktywnych subskrypcji'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {paginatedSubscriptions.length > 0 && totalPages > 1 && (
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

      {selectedSubscription && actionType && (
        <SubscriptionActionsModal
          subscription={selectedSubscription}
          actionType={actionType}
          onClose={closeModal}
          onConfirm={() => {
            // Handle action confirmation
            console.log('Action confirmed:', actionType, selectedSubscription);
            closeModal();
          }}
        />
      )}
    </>
  );
}
