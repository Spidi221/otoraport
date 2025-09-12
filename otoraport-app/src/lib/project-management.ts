// Advanced project management system for multi-investment developers
import { supabaseAdmin } from './supabase'
import { generateXMLForMinistry, generateMarkdownForMinistry } from './generators'

export interface ProjectDetails {
  id: string
  name: string
  location: string
  address: string | null
  status: 'planning' | 'construction' | 'marketing' | 'completed'
  totalUnits: number
  soldUnits: number
  availableUnits: number
  reservedUnits: number
  averagePricePerM2: number
  totalValue: number
  startDate: string | null
  expectedCompletionDate: string | null
  actualCompletionDate: string | null
  developerId: string
  created_at: string
}

export interface ProjectMetrics {
  salesVelocity: number // units sold per month
  priceAppreciation: number // % price change over time
  occupancyRate: number // % of units sold/reserved
  marketPosition: 'underpriced' | 'competitive' | 'premium'
  recommendedActions: string[]
}

export interface PortfolioSummary {
  totalProjects: number
  totalUnits: number
  totalValue: number
  portfolioSalesRate: number
  averagePricePerM2: number
  activeProjects: number
  completedProjects: number
  projectsByStatus: {
    planning: number
    construction: number
    marketing: number
    completed: number
  }
}

export class ProjectManagementService {
  /**
   * Get all projects for a developer with detailed metrics
   */
  async getDeveloperProjects(developerId: string): Promise<ProjectDetails[]> {
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        properties(*)
      `)
      .eq('developer_id', developerId)
      .order('created_at', { ascending: false })

    if (!projects || projects.length === 0) {
      return []
    }

    return projects.map(project => {
      const properties = (project as any).properties || []
      const soldProperties = properties.filter((p: any) => p.status === 'sold')
      const availableProperties = properties.filter((p: any) => p.status === 'available')
      const reservedProperties = properties.filter((p: any) => p.status === 'reserved')

      const prices = properties
        .map((p: any) => p.price_per_m2)
        .filter(Boolean)
      
      const averagePricePerM2 = prices.length > 0 
        ? prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length 
        : 0

      const totalValue = properties.reduce((sum: number, p: any) => {
        return sum + (p.final_price || p.total_price || 0)
      }, 0)

      return {
        id: project.id,
        name: project.name,
        location: project.location,
        address: project.address,
        status: project.status || 'planning',
        totalUnits: properties.length,
        soldUnits: soldProperties.length,
        availableUnits: availableProperties.length,
        reservedUnits: reservedProperties.length,
        averagePricePerM2,
        totalValue,
        startDate: project.start_date,
        expectedCompletionDate: project.expected_completion_date,
        actualCompletionDate: project.actual_completion_date,
        developerId: project.developer_id,
        created_at: project.created_at
      }
    })
  }

  /**
   * Get project metrics and recommendations
   */
  async getProjectMetrics(projectId: string): Promise<ProjectMetrics> {
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        properties(*)
      `)
      .eq('id', projectId)
      .single()

    if (!project) {
      throw new Error('Project not found')
    }

    const properties = (project as any).properties || []
    const soldProperties = properties.filter((p: any) => p.status === 'sold')
    const totalUnits = properties.length

    // Calculate sales velocity (simplified - would use actual sales dates)
    const monthsSinceStart = 6 // Mock - would calculate from actual start date
    const salesVelocity = monthsSinceStart > 0 ? soldProperties.length / monthsSinceStart : 0

    // Calculate price appreciation (mock data - would compare with historical prices)
    const priceAppreciation = Math.random() * 15 - 7.5 // -7.5% to +7.5%

    // Calculate occupancy rate
    const occupancyRate = totalUnits > 0 ? ((soldProperties.length + properties.filter((p: any) => p.status === 'reserved').length) / totalUnits) * 100 : 0

    // Determine market position (simplified)
    const averagePrice = properties.reduce((sum: number, p: any) => sum + (p.price_per_m2 || 0), 0) / properties.length
    const marketPosition: 'underpriced' | 'competitive' | 'premium' = 
      averagePrice < 9000 ? 'underpriced' :
      averagePrice > 13000 ? 'premium' : 'competitive'

    // Generate recommendations
    const recommendedActions: string[] = []
    
    if (salesVelocity < 2) {
      recommendedActions.push('📢 Zwiększ aktywność marketingową - niska sprzedaż')
    }
    if (occupancyRate < 30) {
      recommendedActions.push('💰 Rozważ korektę cen w dół')
    }
    if (occupancyRate > 80) {
      recommendedActions.push('📈 Rozważ podwyższenie cen - wysoki popyt')
    }
    if (priceAppreciation < -5) {
      recommendedActions.push('⚠️ Monitoruj konkurencję - spadek wartości')
    }
    if (salesVelocity > 5) {
      recommendedActions.push('🎯 Optymalizuj proces sprzedażowy - dobra dynamika')
    }

    return {
      salesVelocity,
      priceAppreciation,
      occupancyRate,
      marketPosition,
      recommendedActions
    }
  }

  /**
   * Get portfolio summary for developer
   */
  async getPortfolioSummary(developerId: string): Promise<PortfolioSummary> {
    const projects = await this.getDeveloperProjects(developerId)

    const totalProjects = projects.length
    const totalUnits = projects.reduce((sum, p) => sum + p.totalUnits, 0)
    const totalValue = projects.reduce((sum, p) => sum + p.totalValue, 0)
    const totalSold = projects.reduce((sum, p) => sum + p.soldUnits, 0)
    
    const portfolioSalesRate = totalUnits > 0 ? (totalSold / totalUnits) * 100 : 0
    
    const totalPriceSum = projects.reduce((sum, p) => sum + (p.averagePricePerM2 * p.totalUnits), 0)
    const averagePricePerM2 = totalUnits > 0 ? totalPriceSum / totalUnits : 0

    const projectsByStatus = projects.reduce((acc, project) => {
      acc[project.status]++
      return acc
    }, {
      planning: 0,
      construction: 0,
      marketing: 0,
      completed: 0
    })

    const activeProjects = projectsByStatus.planning + projectsByStatus.construction + projectsByStatus.marketing
    const completedProjects = projectsByStatus.completed

    return {
      totalProjects,
      totalUnits,
      totalValue,
      portfolioSalesRate,
      averagePricePerM2,
      activeProjects,
      completedProjects,
      projectsByStatus
    }
  }

  /**
   * Create new investment project
   */
  async createProject(developerId: string, projectData: {
    name: string
    location: string
    address?: string
    status?: 'planning' | 'construction' | 'marketing' | 'completed'
    startDate?: string
    expectedCompletionDate?: string
  }) {
    const { data: project, error } = await supabaseAdmin
      .from('projects')
      .insert({
        developer_id: developerId,
        name: projectData.name,
        location: projectData.location,
        address: projectData.address,
        status: projectData.status || 'planning',
        start_date: projectData.startDate,
        expected_completion_date: projectData.expectedCompletionDate
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`)
    }

    console.log(`Created new project: ${projectData.name} for developer ${developerId}`)
    return project
  }

  /**
   * Update project details
   */
  async updateProject(projectId: string, updates: Partial<{
    name: string
    location: string
    address: string
    status: 'planning' | 'construction' | 'marketing' | 'completed'
    startDate: string
    expectedCompletionDate: string
    actualCompletionDate: string
  }>) {
    const updateData: any = {}
    
    if (updates.name) updateData.name = updates.name
    if (updates.location) updateData.location = updates.location
    if (updates.address !== undefined) updateData.address = updates.address
    if (updates.status) updateData.status = updates.status
    if (updates.startDate) updateData.start_date = updates.startDate
    if (updates.expectedCompletionDate) updateData.expected_completion_date = updates.expectedCompletionDate
    if (updates.actualCompletionDate) updateData.actual_completion_date = updates.actualCompletionDate

    updateData.updated_at = new Date().toISOString()

    const { error } = await supabaseAdmin
      .from('projects')
      .update(updateData)
      .eq('id', projectId)

    if (error) {
      throw new Error(`Failed to update project: ${error.message}`)
    }

    console.log(`Updated project ${projectId}`)
  }

  /**
   * Generate consolidated reports for all projects
   */
  async generateConsolidatedReport(developerId: string) {
    const projects = await this.getDeveloperProjects(developerId)
    const portfolioSummary = await this.getPortfolioSummary(developerId)

    const projectMetrics = await Promise.all(
      projects.map(async (project) => ({
        project,
        metrics: await this.getProjectMetrics(project.id)
      }))
    )

    return {
      generatedAt: new Date().toISOString(),
      developerId,
      portfolioSummary,
      projects: projectMetrics,
      insights: this.generatePortfolioInsights(portfolioSummary, projectMetrics)
    }
  }

  /**
   * Generate XML/MD reports per project or consolidated
   */
  async generateProjectReports(developerId: string, projectId?: string) {
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('*')
      .eq('id', developerId)
      .single()

    if (!developer) {
      throw new Error('Developer not found')
    }

    let projects: any[] = []

    if (projectId) {
      // Single project report
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select(`
          *,
          properties(*)
        `)
        .eq('id', projectId)
        .eq('developer_id', developerId)
        .single()

      if (project) {
        projects = [project]
      }
    } else {
      // All projects report
      const { data: allProjects } = await supabaseAdmin
        .from('projects')
        .select(`
          *,
          properties(*)
        `)
        .eq('developer_id', developerId)

      projects = allProjects || []
    }

    // Flatten all properties from all projects
    const allProperties = projects.flatMap(project => 
      ((project as any).properties || []).map((property: any) => ({
        ...property,
        project_name: project.name,
        project_location: project.location
      }))
    )

    if (allProperties.length === 0) {
      return {
        xml: '<!-- No properties found -->',
        markdown: '# Brak nieruchomości do raportowania',
        projectsCount: projects.length,
        propertiesCount: 0
      }
    }

    const xmlContent = generateXMLForMinistry({
      developer,
      projects,
      properties: allProperties,
      generatedAt: new Date()
    })

    const markdownContent = generateMarkdownForMinistry({
      developer,
      projects,
      properties: allProperties,
      generatedAt: new Date()
    })

    return {
      xml: xmlContent,
      markdown: markdownContent,
      projectsCount: projects.length,
      propertiesCount: allProperties.length
    }
  }

  /**
   * Portfolio insights generation
   */
  private generatePortfolioInsights(
    portfolio: PortfolioSummary, 
    projectMetrics: Array<{ project: ProjectDetails, metrics: ProjectMetrics }>
  ): string[] {
    const insights: string[] = []

    // Portfolio performance
    if (portfolio.portfolioSalesRate > 70) {
      insights.push(`🎯 Doskonałe wyniki - ${portfolio.portfolioSalesRate.toFixed(1)}% sprzedaży w całym portfolio`)
    } else if (portfolio.portfolioSalesRate < 30) {
      insights.push(`⚠️ Portfolio wymaga optymalizacji - ${portfolio.portfolioSalesRate.toFixed(1)}% sprzedaży`)
    }

    // Project diversification
    if (portfolio.activeProjects > 3) {
      insights.push(`🏗️ Silne zdywersyfikowanie - ${portfolio.activeProjects} aktywnych projektów`)
    }

    // High performing projects
    const highPerformers = projectMetrics.filter(p => p.metrics.occupancyRate > 80)
    if (highPerformers.length > 0) {
      insights.push(`⭐ ${highPerformers.length} projekt(ów) z wysoką sprzedażą (>80%)`)
    }

    // Underperforming projects
    const underPerformers = projectMetrics.filter(p => p.metrics.occupancyRate < 20)
    if (underPerformers.length > 0) {
      insights.push(`⚠️ ${underPerformers.length} projekt(ów) wymaga uwagi (<20% sprzedaży)`)
    }

    // Market positioning
    const premiumProjects = projectMetrics.filter(p => p.metrics.marketPosition === 'premium')
    if (premiumProjects.length > 0) {
      insights.push(`💎 ${premiumProjects.length} projekt(ów) w segmencie premium`)
    }

    return insights
  }
}

export const projectManagementService = new ProjectManagementService()