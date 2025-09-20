import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { MarketingAutomationEngine, AutomationWorkflow, WorkflowTrigger } from '@/lib/marketing-automation';

// GET /api/marketing/workflows - List automation workflows
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('id, subscription_plan')
      .eq('email', session.user.email)
      .single();

    if (!developer || !['pro', 'enterprise'].includes(developer.subscription_plan)) {
      return NextResponse.json({
        success: false,
        error: 'Marketing automation workflows require Pro or Enterprise plan',
        current_plan: developer?.subscription_plan || 'basic',
        upgrade_required: true
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const status = searchParams.get('status');
    const trigger = searchParams.get('trigger');

    // Get workflows from database
    let query = supabaseAdmin
      .from('automation_workflows')
      .select(`
        id,
        name,
        description,
        trigger_type,
        trigger_conditions,
        actions,
        status,
        performance_metrics,
        created_by,
        created_at,
        updated_at,
        last_executed_at
      `)
      .eq('created_by', developer.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (trigger) {
      query = query.eq('trigger_type', trigger);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: workflows, error, count } = await query;

    if (error) {
      console.error('Database error fetching workflows:', error);
      return getMockWorkflows(status, trigger, page, limit);
    }

    // Enrich with execution metrics
    const enrichedWorkflows = (workflows || []).map(workflow => ({
      ...workflow,
      days_since_created: Math.floor((Date.now() - new Date(workflow.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      total_executions: workflow.performance_metrics?.total_executions || 0,
      success_rate: workflow.performance_metrics?.success_rate || 0,
      avg_completion_time: workflow.performance_metrics?.avg_completion_time || 0
    }));

    return NextResponse.json({
      success: true,
      data: enrichedWorkflows,
      pagination: {
        page,
        limit,
        total: count || 0,
        has_more: (workflows?.length || 0) === limit
      },
      summary: {
        total_workflows: count || 0,
        active_workflows: enrichedWorkflows.filter(w => w.status === 'active').length,
        total_executions: enrichedWorkflows.reduce((sum, w) => sum + w.total_executions, 0),
        avg_success_rate: calculateAvgMetric(enrichedWorkflows, 'success_rate')
      }
    });

  } catch (error) {
    console.error('Workflows API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST /api/marketing/workflows - Create automation workflow
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('id, subscription_plan')
      .eq('email', session.user.email)
      .single();

    if (!developer || !['pro', 'enterprise'].includes(developer.subscription_plan)) {
      return NextResponse.json({
        success: false,
        error: 'Marketing automation workflows require Pro or Enterprise plan'
      }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.trigger_type || !body.actions) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, trigger_type, actions' },
        { status: 400 }
      );
    }

    // Validate trigger type
    const validTriggers = [
      'contact_created', 'contact_updated', 'email_opened', 'email_clicked',
      'form_submitted', 'page_visited', 'trial_started', 'trial_ended',
      'subscription_upgraded', 'subscription_cancelled', 'property_viewed',
      'price_alert_triggered', 'inactivity_detected'
    ];

    if (!validTriggers.includes(body.trigger_type)) {
      return NextResponse.json(
        { success: false, error: `Invalid trigger type. Must be one of: ${validTriggers.join(', ')}` },
        { status: 400 }
      );
    }

    // Create workflow using marketing automation engine
    const workflow = await MarketingAutomationEngine.createWorkflow({
      name: body.name,
      description: body.description,
      trigger_type: body.trigger_type,
      trigger_conditions: body.trigger_conditions || [],
      actions: body.actions,
      created_by: developer.id
    });

    // Save to database
    const { data: savedWorkflow, error } = await supabaseAdmin
      .from('automation_workflows')
      .insert({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        trigger_type: workflow.trigger_type,
        trigger_conditions: workflow.trigger_conditions,
        actions: workflow.actions,
        status: workflow.status,
        performance_metrics: workflow.performance_metrics,
        created_by: workflow.created_by,
        created_at: workflow.created_at
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving workflow:', error);
    }

    return NextResponse.json({
      success: true,
      data: savedWorkflow || workflow,
      message: 'Automation workflow created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create workflow error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// PATCH /api/marketing/workflows - Update workflow status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!developer) {
      return NextResponse.json(
        { success: false, error: 'Developer not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { workflow_id, action, updates } = body;

    if (!workflow_id) {
      return NextResponse.json(
        { success: false, error: 'workflow_id is required' },
        { status: 400 }
      );
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    };

    switch (action) {
      case 'activate':
        updateData.status = 'active';
        break;
      case 'pause':
        updateData.status = 'paused';
        break;
      case 'archive':
        updateData.status = 'archived';
        break;
      case 'update':
        updateData = { ...updateData, ...updates };
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: activate, pause, archive, or update' },
          { status: 400 }
        );
    }

    const { data: updatedWorkflow, error } = await supabaseAdmin
      .from('automation_workflows')
      .update(updateData)
      .eq('id', workflow_id)
      .eq('created_by', developer.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Workflow not found or access denied' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: updatedWorkflow,
      message: `Workflow ${action}d successfully`
    });

  } catch (error) {
    console.error('Update workflow error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper functions

function calculateAvgMetric(workflows: any[], metric: string): number {
  const validWorkflows = workflows.filter(w => w.performance_metrics?.[metric] != null);
  if (validWorkflows.length === 0) return 0;

  const sum = validWorkflows.reduce((acc, w) => acc + (w.performance_metrics[metric] || 0), 0);
  return Math.round((sum / validWorkflows.length) * 100) / 100;
}

function getMockWorkflows(status?: string | null, trigger?: string | null, page: number = 1, limit: number = 20) {
  const mockWorkflows = [
    {
      id: 'workflow_onboarding_001',
      name: 'Onboarding Email Sequence',
      description: 'Welcome new users with 5-day email sequence',
      trigger_type: 'contact_created',
      trigger_conditions: [
        { field: 'lead_source', operator: 'equals', value: 'website_signup' }
      ],
      actions: [
        {
          type: 'send_email',
          template_id: 'welcome_email',
          delay_hours: 0
        },
        {
          type: 'send_email',
          template_id: 'getting_started',
          delay_hours: 24
        },
        {
          type: 'send_email',
          template_id: 'features_overview',
          delay_hours: 72
        },
        {
          type: 'add_tag',
          tag: 'onboarded',
          delay_hours: 120
        }
      ],
      status: 'active',
      performance_metrics: {
        total_executions: 156,
        successful_executions: 152,
        success_rate: 0.974,
        avg_completion_time: 120.5,
        email_open_rate: 0.68,
        email_click_rate: 0.24
      },
      created_by: 'dev_123',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      last_executed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      days_since_created: 30,
      total_executions: 156,
      success_rate: 0.974,
      avg_completion_time: 120.5
    },
    {
      id: 'workflow_trial_follow_up',
      name: 'Trial Follow-up Sequence',
      description: 'Follow up with trial users to encourage conversion',
      trigger_type: 'trial_started',
      trigger_conditions: [],
      actions: [
        {
          type: 'send_email',
          template_id: 'trial_day_1',
          delay_hours: 24
        },
        {
          type: 'send_email',
          template_id: 'trial_day_7',
          delay_hours: 168
        },
        {
          type: 'send_email',
          template_id: 'trial_expiring',
          delay_hours: 312
        }
      ],
      status: 'active',
      performance_metrics: {
        total_executions: 89,
        successful_executions: 87,
        success_rate: 0.978,
        avg_completion_time: 336,
        conversion_rate: 0.28
      },
      created_by: 'dev_123',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      last_executed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      days_since_created: 15,
      total_executions: 89,
      success_rate: 0.978,
      avg_completion_time: 336
    },
    {
      id: 'workflow_price_alert',
      name: 'Price Alert Notifications',
      description: 'Notify contacts when property prices change',
      trigger_type: 'price_alert_triggered',
      trigger_conditions: [
        { field: 'price_change_percentage', operator: 'greater_than', value: 5 }
      ],
      actions: [
        {
          type: 'send_email',
          template_id: 'price_alert',
          delay_hours: 0
        },
        {
          type: 'update_contact',
          field: 'last_activity_at',
          value: 'current_timestamp',
          delay_hours: 0
        }
      ],
      status: 'paused',
      performance_metrics: {
        total_executions: 234,
        successful_executions: 229,
        success_rate: 0.979,
        avg_completion_time: 5.2,
        email_open_rate: 0.82,
        click_through_rate: 0.34
      },
      created_by: 'dev_123',
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      last_executed_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      days_since_created: 45,
      total_executions: 234,
      success_rate: 0.979,
      avg_completion_time: 5.2
    }
  ];

  // Apply filters
  let filteredWorkflows = mockWorkflows;

  if (status) {
    filteredWorkflows = filteredWorkflows.filter(w => w.status === status);
  }

  if (trigger) {
    filteredWorkflows = filteredWorkflows.filter(w => w.trigger_type === trigger);
  }

  // Apply pagination
  const offset = (page - 1) * limit;
  const paginatedWorkflows = filteredWorkflows.slice(offset, offset + limit);

  return NextResponse.json({
    success: true,
    data: paginatedWorkflows,
    pagination: {
      page,
      limit,
      total: filteredWorkflows.length,
      has_more: offset + limit < filteredWorkflows.length
    },
    summary: {
      total_workflows: filteredWorkflows.length,
      active_workflows: filteredWorkflows.filter(w => w.status === 'active').length,
      total_executions: filteredWorkflows.reduce((sum, w) => sum + w.total_executions, 0),
      avg_success_rate: calculateAvgMetric(filteredWorkflows, 'success_rate')
    },
    note: 'Using mock data - database not available'
  });
}