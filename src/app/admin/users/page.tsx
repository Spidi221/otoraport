/**
 * Admin Users Management Page
 * Task #57.3 - Build User Management Interface
 *
 * Features:
 * - Table showing all users
 * - Search bar (email/company)
 * - Filter dropdown (subscription plan)
 * - Pagination controls
 * - Sort headers
 * - User count badge
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadingState } from '@/components/ui/loading'

interface User {
  id: string
  email: string
  company_name: string
  subscription_plan: string | null
  subscription_status: string | null
  properties_count: number
  projects_count: number
  created_at: string
  is_admin: boolean
  last_login_at: string | null
}

interface UsersResponse {
  users: User[]
  total: number
  page: number
  limit: number
  totalPages: number
  filters: {
    search: string
    plan: string
    sortBy: string
    sortOrder: string
  }
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  // Debounced search
  const [searchDebounced, setSearchDebounced] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounced(search)
      setPage(1) // Reset to first page on search
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
          search: searchDebounced,
          plan: planFilter,
          sortBy,
          sortOrder
        })

        const response = await fetch(`/api/admin/users?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        console.error('❌ Error fetching users:', err)
        setError('Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [page, searchDebounced, planFilter, sortBy, sortOrder])

  // Toggle sort order
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get status badge variant
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500">Active</Badge>
      case 'trialing':
        return <Badge variant="default" className="bg-blue-500">Trial</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>
      default:
        return <Badge variant="secondary">Inactive</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all registered users and their subscriptions
          </p>
        </div>
        {data && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            {data.total} {data.total === 1 ? 'User' : 'Users'}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Search by Email or Company
              </label>
              <Input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Plan Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Subscription Plan
              </label>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8">
              <LoadingState message="Loading users..." />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : data && data.users.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('email')}
                      >
                        Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('company_name')}
                      >
                        Company {sortBy === 'company_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Properties</TableHead>
                      <TableHead className="text-right">Projects</TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('created_at')}
                      >
                        Created {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableHead>
                      <TableHead>Admin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.email}
                        </TableCell>
                        <TableCell>{user.company_name}</TableCell>
                        <TableCell>
                          {user.subscription_plan ? (
                            <Badge variant="outline" className="capitalize">
                              {user.subscription_plan}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user.subscription_status)}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.properties_count}
                        </TableCell>
                        <TableCell className="text-right">
                          {user.projects_count}
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          {user.is_admin && (
                            <Badge variant="default" className="bg-purple-500">
                              Admin
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, data.total)} of {data.total} users
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {page} of {data.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
