'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Building2,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Shield,
  Settings,
  Activity
} from 'lucide-react'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { toast } from 'sonner'

interface SystemStats {
  totalDevelopers?: number;
  activeDevelopers?: number;
  totalProperties?: number;
  totalRevenue?: number;
  totalProjects?: number;
  monthlyRevenue?: number;
  systemHealth?: 'healthy' | 'warning' | 'critical';
  paidDevelopers?: number;
}

interface Developer {
  id: string;
  company_name?: string;
  name?: string;
  nip?: string;
  email?: string;
  subscription_status?: string;
  ministry_approved?: boolean;
  total_projects?: number;
  total_properties?: number;
}

interface LogEntry {
  id: string;
  timestamp?: string;
  action?: string;
  developer_id?: string;
  details?: string;
  level?: 'info' | 'warning' | 'error';
  message?: string;
  created_at?: string;
  user_id?: string;
  ip_address?: string;
}

interface ComplianceIssue {
  developer_name: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

interface ComplianceData {
  compliantDevelopers?: number;
  compliant_developers?: number;  // Snake case variant
  totalDevelopers?: number;
  total_developers?: number;  // Snake case variant
  non_compliant_developers?: number;
  pendingApprovals?: number;
  issues?: ComplianceIssue[];
}

interface RevenueData {
  total?: number;
  totalRevenue?: number;  // Camel case variant
  monthly?: number;
  growth?: number;
  paymentCount?: number;
}

interface AdminDashboardProps {
  adminEmail: string
}

export default function AdminDashboard({ adminEmail }: AdminDashboardProps) {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [developers, setDevelopers] = useState<Developer[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [compliance, setCompliance] = useState<ComplianceData | null>(null)
  const [revenue, setRevenue] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, developersRes, logsRes, complianceRes, revenueRes] = await Promise.all([
        fetch('/api/admin?action=stats'),
        fetch('/api/admin?action=developers&limit=10'),
        fetch('/api/admin?action=logs&limit=20'),
        fetch('/api/admin?action=compliance'),
        fetch('/api/admin?action=revenue&timeframe=30d')
      ])

      const [stats, devs, logsData, comp, rev] = await Promise.all([
        statsRes.json(),
        developersRes.json(),
        logsRes.json(),
        complianceRes.json(),
        revenueRes.json()
      ])

      setSystemStats(stats.data)
      setDevelopers(devs.data?.developers || [])
      setLogs(logsData.data || [])
      setCompliance(comp.data)
      setRevenue(rev.data)
    } catch {
      console.error('Error loading admin data')
    } finally {
      setLoading(false)
    }
  }

  const updateSubscription = async (developerId: string, status: string) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-subscription',
          developerId,
          status
        })
      })

      if (response.ok) {
        loadData()
      }
    } catch {
      console.error('Error updating subscription')
    }
  }

  const approveMinistry = async (developerId: string, approved: boolean) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve-ministry',
          developerId,
          approved
        })
      })

      if (response.ok) {
        loadData()
      }
    } catch {
      console.error('Error approving ministry')
    }
  }

  const performCleanup = async () => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'system-cleanup' })
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Cleanup completed: ${result.data.expiredTrials} trials expired, ${result.data.oldLogs} logs removed`)
        loadData()
      }
    } catch {
      console.error('Error performing cleanup')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'trial': return 'bg-blue-500'
      case 'expired': return 'bg-red-500'
      case 'cancelled': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'info': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Ładowanie danych administracyjnych...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel Administracyjny</h1>
              <p className="text-gray-600">Witaj, {adminEmail}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={performCleanup} variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Czyszczenie Systemu
              </Button>
              <Button onClick={loadData} variant="outline" size="sm">
                <Activity className="h-4 w-4 mr-2" />
                Odśwież
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Przegląd</TabsTrigger>
            <TabsTrigger value="developers">Deweloperzy</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="revenue">Przychody</TabsTrigger>
            <TabsTrigger value="logs">Logi</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Deweloperzy</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats?.totalDevelopers}</div>
                  <p className="text-xs text-muted-foreground">
                    {systemStats?.activeDevelopers} aktywnych
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Projekty</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats?.totalProjects}</div>
                  <p className="text-xs text-muted-foreground">
                    {systemStats?.totalProperties} nieruchomości
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Przychody</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats?.totalRevenue?.toFixed(0)} zł</div>
                  <p className="text-xs text-muted-foreground">
                    {systemStats?.monthlyRevenue?.toFixed(0)} zł w tym miesiącu
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status Systemu</CardTitle>
                  <Shield className={`h-4 w-4 ${
                    systemStats?.systemHealth === 'healthy' ? 'text-green-500' : 
                    systemStats?.systemHealth === 'warning' ? 'text-yellow-500' : 'text-red-500'
                  }`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{systemStats?.systemHealth}</div>
                  <p className="text-xs text-muted-foreground">
                    Ostatnia aktualizacja: {format(new Date(), 'HH:mm', { locale: pl })}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ostatni Deweloperzy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {developers.slice(0, 5).map((dev) => (
                      <div key={dev.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{dev.company_name || dev.name}</p>
                          <p className="text-sm text-gray-500">{dev.email}</p>
                        </div>
                        <Badge className={getStatusColor(dev.subscription_status || 'unknown')}>
                          {dev.subscription_status || 'unknown'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ostatnie Logi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {logs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-start gap-3">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getLogColor(log.level || 'info')}`}>
                          {log.level || 'info'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{log.message}</p>
                          <p className="text-xs text-gray-500">
                            {log.created_at ? format(new Date(log.created_at), 'dd.MM HH:mm', { locale: pl }) : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="developers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Zarządzanie Deweloperami</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Firma</th>
                        <th className="text-left p-2">Email</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Projekty</th>
                        <th className="text-left p-2">Ministerstwo</th>
                        <th className="text-left p-2">Akcje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {developers.map((dev) => (
                        <tr key={dev.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div>
                              <p className="font-medium">{dev.company_name || dev.name}</p>
                              <p className="text-xs text-gray-500">NIP: {dev.nip}</p>
                            </div>
                          </td>
                          <td className="p-2">{dev.email}</td>
                          <td className="p-2">
                            <Badge className={getStatusColor(dev.subscription_status || 'unknown')}>
                              {dev.subscription_status || 'unknown'}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {dev.total_projects} proj. / {dev.total_properties} nier.
                          </td>
                          <td className="p-2">
                            {dev.ministry_approved ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateSubscription(dev.id, 'active')}
                              >
                                Aktywuj
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approveMinistry(dev.id, !dev.ministry_approved)}
                              >
                                {dev.ministry_approved ? 'Odrzuć' : 'Zatwierdź'}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Zgodność</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {compliance?.compliant_developers}
                  </div>
                  <p className="text-sm text-gray-600">deweloperów zgodnych</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Problemy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {compliance?.non_compliant_developers}
                  </div>
                  <p className="text-sm text-gray-600">deweloperów z problemami</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">Łącznie</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {compliance?.total_developers}
                  </div>
                  <p className="text-sm text-gray-600">wszystkich deweloperów</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Problemy Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {compliance?.issues?.map((issue: ComplianceIssue, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <AlertTriangle className={`h-5 w-5 ${
                        issue.severity === 'high' ? 'text-red-500' :
                        issue.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium">{issue.developer_name}</p>
                        <p className="text-sm text-gray-600">{issue.description}</p>
                      </div>
                      <Badge variant="outline">
                        {issue.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Przychód (30d)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {revenue?.totalRevenue?.toFixed(0)} zł
                  </div>
                  <p className="text-sm text-gray-600">{revenue?.paymentCount} płatności</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Średnio na dzień
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {revenue?.totalRevenue ? (revenue.totalRevenue / 30).toFixed(0) : 0} zł
                  </div>
                  <p className="text-sm text-gray-600">ostatnie 30 dni</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Płacący klienci
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {systemStats?.paidDevelopers}
                  </div>
                  <p className="text-sm text-gray-600">aktywnych subskrypcji</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Wykres Przychodów</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Wykres przychodów będzie tutaj</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Logi Systemowe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getLogColor(log.level || 'info')}`}>
                        {log.level || 'info'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{log.message}</p>
                        {log.details && (
                          <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {log.created_at ? format(new Date(log.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: pl }) : ''}
                          {log.user_id && ` • Użytkownik: ${log.user_id}`}
                          {log.ip_address && ` • IP: ${log.ip_address}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}