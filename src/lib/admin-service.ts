// Admin panel service for system management and monitoring - Build-safe version
let supabaseAdmin: any = null

// Lazy load supabase to avoid build errors
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    try {
      const { supabaseAdmin: admin } = require('./supabase')
      supabaseAdmin = admin
    } catch (error) {
      console.warn('Supabase admin not available during build')
      return null
    }
  }
  return supabaseAdmin
}

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
  created_at: string
  last_login: string | null
}

export interface SystemLog {
  id: string
  level: 'info' | 'warning' | 'error'
  message: string
  details: any
  user_id: string | null
  ip_address: string | null
  created_at: string
}

export interface ComplianceReport {
  total_developers: number
  compliant_developers: number
  pending_approval: number
  missing_data: number
  overdue_reports: number
  compliance_rate: number
  last_ministry_sync: string | null
  issues: Array<{
    developer_id: string
    issue_type: string
    description: string
    severity: 'low' | 'medium' | 'high'
  }>
}

export interface RevenueAnalytics {
  timeframe: '7d' | '30d' | '90d' | '12m'
  total_revenue: number
  subscription_breakdown: {
    basic: number
    pro: number
    enterprise: number
  }
  growth_rate: number
  churn_rate: number
  mrr: number
  arpu: number
  ltv: number
}

export class AdminService {
  /**
   * Get default stats for build time
   */
  private getDefaultStats(): SystemStats {
    return {
      totalDevelopers: 0,
      activeDevelopers: 0,
      trialDevelopers: 0,
      paidDevelopers: 0,
      totalProjects: 0,
      totalProperties: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      averagePropertiesPerDeveloper: 0,
      systemHealth: 'healthy',
      lastUpdate: new Date().toISOString()
    }
  }

  /**
   * Get comprehensive system statistics
   */
  async getSystemStats(): Promise<SystemStats> {
    const admin = getSupabaseAdmin()
    if (!admin) {
      return this.getDefaultStats()
    }
    
    try {
      // Get developer statistics
      const { data: developers } = await admin
        .from('developers')
        .select('subscription_status, created_at')

      const totalDevelopers = developers?.length || 0
      const activeDevelopers = developers?.filter(d => d.subscription_status === 'active').length || 0
      const trialDevelopers = developers?.filter(d => d.subscription_status === 'trial').length || 0
      const paidDevelopers = developers?.filter(d => ['active', 'cancelled'].includes(d.subscription_status)).length || 0

      // Get project and property counts
      const { count: totalProjects } = await admin
        .from('projects')
        .select('*', { count: 'exact', head: true })

      const { count: totalProperties } = await admin
        .from('properties')
        .select('*', { count: 'exact', head: true })

      // Get revenue data
      const { data: payments } = await admin
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
      
      if (totalDevelopers > 5000 && activeDevelopers / totalDevelopers < 0.1) {
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
    } catch (error) {
      console.error('Failed to get system stats:', error)
      return this.getDefaultStats()
    }
  }

  /**
   * Get paginated list of all developers with details
   */
  async getAllDevelopers(page: number = 1, limit: number = 50): Promise<DeveloperDetails[]> {
    const admin = getSupabaseAdmin()
    if (!admin) {
      return []
    }

    try {
      const offset = (page - 1) * limit
      
      const { data: developers } = await admin
        .from('developers')
        .select(`
          id, email, name, company_name, nip, phone, 
          subscription_status, subscription_end_date,
          ministry_approved, ministry_email_sent,
          created_at
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

      if (!developers) return []

      // Get project and property counts for each developer
      const enrichedDevelopers = await Promise.all(
        developers.map(async (dev) => {
          const [projectsCount, propertiesCount] = await Promise.all([
            admin.from('projects').select('*', { count: 'exact', head: true }).eq('developer_id', dev.id),
            admin.from('properties').select('*', { count: 'exact', head: true }).eq('developer_id', dev.id)
          ])

          return {
            ...dev,
            total_projects: projectsCount.count || 0,
            total_properties: propertiesCount.count || 0,
            last_login: null // TODO: Add login tracking
          }
        })
      )

      return enrichedDevelopers
    } catch (error) {
      console.error('Failed to get developers:', error)
      return []
    }
  }

  /**
   * Get system logs with optional filtering
   */
  async getSystemLogs(level?: 'info' | 'warning' | 'error', limit: number = 100): Promise<SystemLog[]> {
    const admin = getSupabaseAdmin()
    if (!admin) {
      return []
    }

    try {
      let query = admin
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (level) {
        query = query.eq('level', level)
      }

      const { data: logs } = await query

      return logs || []
    } catch (error) {
      console.error('Failed to get system logs:', error)
      return []
    }
  }

  /**
   * Get compliance report for ministry requirements
   */
  async getComplianceReport(): Promise<ComplianceReport> {
    const admin = getSupabaseAdmin()
    if (!admin) {
      return {
        total_developers: 0,
        compliant_developers: 0,
        pending_approval: 0,
        missing_data: 0,
        overdue_reports: 0,
        compliance_rate: 0,
        last_ministry_sync: null,
        issues: []
      }
    }

    try {
      const { data: developers } = await admin
        .from('developers')
        .select('id, ministry_approved, ministry_email_sent, subscription_status')

      const total_developers = developers?.length || 0
      const compliant_developers = developers?.filter(d => d.ministry_approved).length || 0
      const pending_approval = developers?.filter(d => !d.ministry_approved && d.ministry_email_sent).length || 0
      const missing_data = developers?.filter(d => !d.ministry_email_sent).length || 0

      // TODO: Calculate overdue reports based on last file generation
      const overdue_reports = 0

      const compliance_rate = total_developers > 0 ? (compliant_developers / total_developers) * 100 : 100

      return {
        total_developers,
        compliant_developers,
        pending_approval,
        missing_data,
        overdue_reports,
        compliance_rate,
        last_ministry_sync: null, // TODO: Track ministry API sync
        issues: [] // TODO: Generate compliance issues
      }
    } catch (error) {
      console.error('Failed to get compliance report:', error)
      return {
        total_developers: 0,
        compliant_developers: 0,
        pending_approval: 0,
        missing_data: 0,
        overdue_reports: 0,
        compliance_rate: 0,
        last_ministry_sync: null,
        issues: []
      }
    }
  }

  /**
   * Get revenue analytics for specified timeframe
   */
  async getRevenueAnalytics(timeframe: '7d' | '30d' | '90d' | '12m' = '30d'): Promise<RevenueAnalytics> {
    const admin = getSupabaseAdmin()
    if (!admin) {
      return {
        timeframe,
        total_revenue: 0,
        subscription_breakdown: { basic: 0, pro: 0, enterprise: 0 },
        growth_rate: 0,
        churn_rate: 0,
        mrr: 0,
        arpu: 0,
        ltv: 0
      }
    }

    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      
      switch (timeframe) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7)
          break
        case '30d':
          startDate.setDate(startDate.getDate() - 30)
          break
        case '90d':
          startDate.setDate(startDate.getDate() - 90)
          break
        case '12m':
          startDate.setFullYear(startDate.getFullYear() - 1)
          break
      }

      // Get payment data
      const { data: payments } = await admin
        .from('payments')
        .select('amount, plan_type, created_at')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())

      const total_revenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0

      // Subscription breakdown
      const subscription_breakdown = {
        basic: payments?.filter(p => p.plan_type === 'basic').reduce((sum, p) => sum + p.amount, 0) || 0,
        pro: payments?.filter(p => p.plan_type === 'pro').reduce((sum, p) => sum + p.amount, 0) || 0,
        enterprise: payments?.filter(p => p.plan_type === 'enterprise').reduce((sum, p) => sum + p.amount, 0) || 0
      }

      // TODO: Calculate more sophisticated metrics
      const growth_rate = 0
      const churn_rate = 0
      const mrr = 0
      const arpu = 0
      const ltv = 0

      return {
        timeframe,
        total_revenue,
        subscription_breakdown,
        growth_rate,
        churn_rate,
        mrr,
        arpu,
        ltv
      }
    } catch (error) {
      console.error('Failed to get revenue analytics:', error)
      return {
        timeframe,
        total_revenue: 0,
        subscription_breakdown: { basic: 0, pro: 0, enterprise: 0 },
        growth_rate: 0,
        churn_rate: 0,
        mrr: 0,
        arpu: 0,
        ltv: 0
      }
    }
  }

  /**
   * Update developer subscription status
   */
  async updateDeveloperSubscription(
    developerId: string, 
    status: string, 
    endDate?: string
  ): Promise<void> {
    const admin = getSupabaseAdmin()
    if (!admin) {
      throw new Error('Admin service not available')
    }

    const updates: any = { subscription_status: status }
    if (endDate) {
      updates.subscription_end_date = endDate
    }

    const { error } = await admin
      .from('developers')
      .update(updates)
      .eq('id', developerId)

    if (error) {
      throw new Error(`Failed to update developer subscription: ${error.message}`)
    }
  }

  /**
   * Approve/reject developer for ministry compliance
   */
  async approveDeveloperForMinistry(developerId: string, approved: boolean): Promise<void> {
    const admin = getSupabaseAdmin()
    if (!admin) {
      throw new Error('Admin service not available')
    }

    const { error } = await admin
      .from('developers')
      .update({ 
        ministry_approved: approved,
        ministry_email_sent: true
      })
      .eq('id', developerId)

    if (error) {
      throw new Error(`Failed to update ministry approval: ${error.message}`)
    }
  }

  /**
   * Perform system cleanup (remove old logs, files, etc.)
   */
  async performSystemCleanup(): Promise<{ cleaned_logs: number; cleaned_files: number }> {
    const admin = getSupabaseAdmin()
    if (!admin) {
      return { cleaned_logs: 0, cleaned_files: 0 }
    }

    try {
      // Clean logs older than 90 days
      const cleanupDate = new Date()
      cleanupDate.setDate(cleanupDate.getDate() - 90)

      const { count: cleaned_logs } = await admin
        .from('system_logs')
        .delete({ count: 'exact' })
        .lt('created_at', cleanupDate.toISOString())

      // TODO: Clean up old generated files
      const cleaned_files = 0

      return {
        cleaned_logs: cleaned_logs || 0,
        cleaned_files
      }
    } catch (error) {
      console.error('System cleanup failed:', error)
      return { cleaned_logs: 0, cleaned_files: 0 }
    }
  }

  /**
   * Log system events for monitoring and debugging
   */
  async logSystemEvent(
    level: 'info' | 'warning' | 'error',
    message: string,
    details?: any,
    userId?: string
  ): Promise<void> {
    const admin = getSupabaseAdmin()
    if (!admin) {
      // Fallback to console logging during build
      console.log(`[${level.toUpperCase()}] ${message}`, details)
      return
    }

    try {
      await admin
        .from('system_logs')
        .insert({
          level,
          message,
          details: details || null,
          user_id: userId || null,
          ip_address: null // TODO: Get from request context
        })
    } catch (error) {
      console.error('Failed to log system event:', error)
    }
  }
}

// Export singleton instance
export const adminService = new AdminService()