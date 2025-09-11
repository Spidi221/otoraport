import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { projectManagementService } from '@/lib/project-management'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'
    const projectId = searchParams.get('projectId')

    console.log(`Projects API request for user ${session.user.email}: ${action}`)

    switch (action) {
      case 'list': {
        const projects = await projectManagementService.getDeveloperProjects(userId)
        return NextResponse.json({
          success: true,
          data: projects
        })
      }

      case 'portfolio': {
        const portfolio = await projectManagementService.getPortfolioSummary(userId)
        return NextResponse.json({
          success: true,
          data: portfolio
        })
      }

      case 'metrics': {
        if (!projectId) {
          return NextResponse.json(
            { error: 'Project ID required for metrics' },
            { status: 400 }
          )
        }
        const metrics = await projectManagementService.getProjectMetrics(projectId)
        return NextResponse.json({
          success: true,
          data: metrics
        })
      }

      case 'consolidated-report': {
        const report = await projectManagementService.generateConsolidatedReport(userId)
        return NextResponse.json({
          success: true,
          data: report
        })
      }

      case 'generate-reports': {
        const reports = await projectManagementService.generateProjectReports(userId, projectId || undefined)
        return NextResponse.json({
          success: true,
          data: reports
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Projects API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { action, ...data } = body

    console.log(`Projects POST request for user ${session.user.email}: ${action}`)

    switch (action) {
      case 'create': {
        const { name, location, address, status, startDate, expectedCompletionDate } = data
        
        if (!name || !location) {
          return NextResponse.json(
            { error: 'Name and location are required' },
            { status: 400 }
          )
        }

        const project = await projectManagementService.createProject(userId, {
          name,
          location,
          address,
          status,
          startDate,
          expectedCompletionDate
        })

        return NextResponse.json({
          success: true,
          data: project,
          message: 'Project created successfully'
        })
      }

      case 'update': {
        const { projectId, ...updates } = data
        
        if (!projectId) {
          return NextResponse.json(
            { error: 'Project ID is required' },
            { status: 400 }
          )
        }

        await projectManagementService.updateProject(projectId, updates)

        return NextResponse.json({
          success: true,
          message: 'Project updated successfully'
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Projects POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}