// Admin panel service for system management and monitoring
import { supabaseAdmin } from './supabase'

export interface SystemStats {
  totalDevelopers: number
  activeDevelopers: number
  trialDevelopers: number
  paidDevelopers: number
  totalProjects: number
  totalProperties: number
  totalRevenue: number
  monthlyRevenue: number
  averagePropertiesPerDeveloper: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  lastUpdate: string
}

export interface DeveloperDetails {
  id: string
  email: string
  name: string
  company_name: string
  nip: string
  phone: string
  subscription_status: 'trial' | 'active' | 'cancelled' | 'expired'
  subscription_end_date: string | null
  ministry_approved: boolean
  ministry_email_sent: boolean
  total_projects: number
  total_properties: number
  last_activity: string | null
  total_paid: number
  created_at: string
}

export interface SystemLog {
  id: string
  level: 'info' | 'warning' | 'error'
  message: string
  details?: any
  user_id?: string
  ip_address?: string
  created_at: string
}

export interface ComplianceReport {
  total_developers: number
  compliant_developers: number
  non_compliant_developers: number
  issues: ComplianceIssue[]
  last_check: string
}

export interface ComplianceIssue {
  developer_id: string
  developer_name: string
  issue_type: 'missing_data' | 'invalid_format' | 'ministry_not_approved' | 'subscription_expired'
  description: string
  severity: 'low' | 'medium' | 'high'
  created_at: string
}

export class AdminService {
  /**
   * Get comprehensive system statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    // Get developer statistics
    const { data: developers } = await supabaseAdmin
      .from('developers')
      .select('subscription_status, created_at')

    const totalDevelopers = developers?.length || 0
    const activeDevelopers = developers?.filter(d => d.subscription_status === 'active').length || 0
    const trialDevelopers = developers?.filter(d => d.subscription_status === 'trial').length || 0
    const paidDevelopers = developers?.filter(d => ['active', 'cancelled'].includes(d.subscription_status)).length || 0

    // Get project and property counts
    const { count: totalProjects } = await supabaseAdmin
      .from('projects')
      .select('*', { count: 'exact', head: true })

    const { count: totalProperties } = await supabaseAdmin
      .from('properties')
      .select('*', { count: 'exact', head: true })

    // Get revenue data
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('amount, created_at')
      .eq('status', 'completed')

    const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    
    const currentMonth = new Date()
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const monthlyRevenue = payments?.filter(p => new Date(p.created_at) >= monthStart)
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    const averagePropertiesPerDeveloper = totalDevelopers > 0 ? totalProperties / totalDevelopers : 0

    // Determine system health
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy'
    
    if (totalDevelopers > 1000 && activeDevelopers / totalDevelopers < 0.3) {
      systemHealth = 'warning'
    }
    if (activeDevelopers / totalDevelopers < 0.1) {
      systemHealth = 'critical'
    }

    return {
      totalDevelopers,
      activeDevelopers,
      trialDevelopers,
      paidDevelopers,
      totalProjects: totalProjects || 0,
      totalProperties: totalProperties || 0,
      totalRevenue,
      monthlyRevenue,
      averagePropertiesPerDeveloper,
      systemHealth,
      lastUpdate: new Date().toISOString()
    }
  }

  /**
   * Get all developers with detailed information
   */
  async getAllDevelopers(page: number = 1, limit: number = 50): Promise<{
    developers: DeveloperDetails[]
    total: number
    pages: number
  }> {
    const offset = (page - 1) * limit

    const { data: developers, count } = await supabaseAdmin
      .from('developers')
      .select(`
        *,
        projects:projects(count),
        properties:projects(properties(count)),
        payments:payments(amount)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const developerDetails: DeveloperDetails[] = (developers || []).map(dev => {
      const projectCount = (dev as any).projects?.[0]?.count || 0
      const propertyCount = (dev as any).properties?.reduce((sum: number, p: any) => sum + (p.properties?.[0]?.count || 0), 0) || 0
      const totalPaid = (dev as any).payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0

      return {
        id: dev.id,
        email: dev.email,
        name: dev.name,
        company_name: dev.company_name,
        nip: dev.nip,
        phone: dev.phone,
        subscription_status: dev.subscription_status,
        subscription_end_date: dev.subscription_end_date,
        ministry_approved: dev.ministry_approved,
        ministry_email_sent: dev.ministry_email_sent,
        total_projects: projectCount,
        total_properties: propertyCount,
        last_activity: dev.updated_at,
        total_paid: totalPaid,
        created_at: dev.created_at
      }
    })

    return {
      developers: developerDetails,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit)
    }
  }

  /**
   * Get system logs for monitoring
   */
  async getSystemLogs(level?: 'info' | 'warning' | 'error', limit: number = 100): Promise<SystemLog[]> {
    let query = supabaseAdmin
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (level) {
      query = query.eq('level', level)
    }

    const { data: logs } = await query

    return logs?.map(log => ({
      id: log.id,
      level: log.level,
      message: log.message,
      details: log.details,
      user_id: log.user_id,
      ip_address: log.ip_address,
      created_at: log.created_at
    })) || []
  }

  /**
   * Log system event
   */
  async logSystemEvent(
    level: 'info' | 'warning' | 'error',
    message: string,
    details?: any,
    userId?: string,
    ipAddress?: string
  ) {
    await supabaseAdmin
      .from('system_logs')
      .insert({
        level,
        message,
        details,
        user_id: userId,
        ip_address: ipAddress
      })
  }

  /**
   * Get compliance report
   */
  async getComplianceReport(): Promise<ComplianceReport> {
    const { data: developers } = await supabaseAdmin
      .from('developers')
      .select(`
        *,
        projects:projects(
          properties:properties(*)
        )
      `)

    const totalDevelopers = developers?.length || 0
    let compliantDevelopers = 0
    const issues: ComplianceIssue[] = []

    for (const developer of developers || []) {
      let isCompliant = true
      const properties = (developer as any).projects?.flatMap((p: any) => p.properties || []) || []

      // Check ministry approval
      if (!developer.ministry_approved) {
        isCompliant = false
        issues.push({
          developer_id: developer.id,
          developer_name: developer.company_name || developer.name,
          issue_type: 'ministry_not_approved',
          description: 'Deweloper nie otrzymał zatwierdzenia od ministerstwa',
          severity: 'high',
          created_at: new Date().toISOString()
        })
      }

      // Check subscription status
      if (developer.subscription_status === 'expired') {
        isCompliant = false
        issues.push({
          developer_id: developer.id,
          developer_name: developer.company_name || developer.name,
          issue_type: 'subscription_expired',
          description: 'Subskrypcja dewelopera wygasła',
          severity: 'medium',
          created_at: new Date().toISOString()
        })
      }

      // Check for missing property data
      const missingDataProperties = properties.filter((p: any) => 
        !p.property_number || !p.price_per_m2 || !p.area
      )

      if (missingDataProperties.length > 0) {
        isCompliant = false
        issues.push({
          developer_id: developer.id,
          developer_name: developer.company_name || developer.name,
          issue_type: 'missing_data',
          description: `${missingDataProperties.length} nieruchomości ma niepełne dane`,
          severity: 'medium',
          created_at: new Date().toISOString()
        })
      }

      if (isCompliant) {
        compliantDevelopers++
      }
    }

    return {
      total_developers: totalDevelopers,
      compliant_developers: compliantDevelopers,
      non_compliant_developers: totalDevelopers - compliantDevelopers,
      issues: issues.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 }
        return severityOrder[b.severity] - severityOrder[a.severity]
      }),
      last_check: new Date().toISOString()
    }
  }

  /**
   * Update developer subscription
   */
  async updateDeveloperSubscription(
    developerId: string,
    status: 'trial' | 'active' | 'cancelled' | 'expired',
    endDate?: string
  ) {
    const { error } = await supabaseAdmin
      .from('developers')
      .update({
        subscription_status: status,
        subscription_end_date: endDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId)

    if (error) {
      throw new Error(`Failed to update subscription: ${error.message}`)
    }

    await this.logSystemEvent(
      'info',
      `Developer subscription updated`,
      { developerId, status, endDate },
      undefined,
      undefined
    )
  }

  /**
   * Approve developer for ministry
   */
  async approveDeveloperForMinistry(developerId: string, approved: boolean) {
    const { error } = await supabaseAdmin
      .from('developers')
      .update({
        ministry_approved: approved,
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId)

    if (error) {
      throw new Error(`Failed to update ministry approval: ${error.message}`)
    }

    await this.logSystemEvent(
      'info',
      `Developer ministry approval ${approved ? 'granted' : 'revoked'}`,
      { developerId, approved },
      undefined,
      undefined
    )
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(timeframe: '7d' | '30d' | '90d' | '12m' = '30d') {
    const now = new Date()
    const startDate = new Date()

    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '12m':
        startDate.setMonth(now.getMonth() - 12)
        break
    }

    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('amount, created_at, currency')
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    // Group by day/month depending on timeframe
    const groupedData: { [key: string]: number } = {}
    
    payments?.forEach(payment => {
      const date = new Date(payment.created_at)
      const key = timeframe === '12m' 
        ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        : date.toISOString().split('T')[0]
      
      groupedData[key] = (groupedData[key] || 0) + (payment.amount || 0)
    })

    return {
      totalRevenue: payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
      paymentCount: payments?.length || 0,
      dailyRevenue: Object.entries(groupedData).map(([date, amount]) => ({
        date,
        amount
      }))
    }
  }

  /**
   * Force system cleanup
   */
  async performSystemCleanup() {
    const results = {
      expiredTrials: 0,
      oldLogs: 0,
      orphanedFiles: 0
    }

    // Clean up expired trials
    const { count: expiredCount } = await supabaseAdmin
      .from('developers')
      .update({ subscription_status: 'expired' })
      .eq('subscription_status', 'trial')
      .lt('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()) // 14 days ago
      .select('*', { count: 'exact', head: true })

    results.expiredTrials = expiredCount || 0

    // Clean up old logs (older than 90 days)
    const { count: oldLogsCount } = await supabaseAdmin
      .from('system_logs')
      .delete()
      .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .select('*', { count: 'exact', head: true })

    results.oldLogs = oldLogsCount || 0

    await this.logSystemEvent('info', 'System cleanup performed', results)

    return results
  }
}

export const adminService = new AdminService()