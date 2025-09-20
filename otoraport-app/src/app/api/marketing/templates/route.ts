import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailMarketingEngine, EmailTemplate } from '@/lib/email-marketing';

// GET /api/marketing/templates - List email templates
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
        error: 'Email templates require Pro or Enterprise plan',
        current_plan: developer?.subscription_plan || 'basic',
        upgrade_required: true
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    // Get templates from database
    let query = supabaseAdmin
      .from('email_templates')
      .select(`
        id,
        name,
        subject,
        content,
        variables,
        category,
        created_at,
        updated_at,
        usage_count,
        performance_metrics
      `)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: templates, error, count } = await query;

    if (error) {
      console.error('Database error fetching templates:', error);
      return getMockTemplates(category, search, page, limit);
    }

    return NextResponse.json({
      success: true,
      data: templates || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        has_more: (templates?.length || 0) === limit
      },
      categories: [
        'onboarding',
        'nurture',
        'promotional',
        'transactional',
        'retention'
      ]
    });

  } catch (error) {
    console.error('Templates API error:', error);
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

// POST /api/marketing/templates - Create email template
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
        error: 'Email templates require Pro or Enterprise plan'
      }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.subject || !body.content || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, subject, content, category' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['onboarding', 'nurture', 'promotional', 'transactional', 'retention'];
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Extract variables from content
    const variables = extractVariables(body.content + ' ' + body.subject);

    // Create template using email marketing engine
    const template = await EmailMarketingEngine.createTemplate({
      name: body.name,
      subject: body.subject,
      content: body.content,
      variables,
      category: body.category
    });

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Email template created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create template error:', error);
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

// PUT /api/marketing/templates - Update email template
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { template_id, ...updates } = body;

    if (!template_id) {
      return NextResponse.json(
        { success: false, error: 'template_id is required' },
        { status: 400 }
      );
    }

    // Update variables if content changed
    if (updates.content || updates.subject) {
      const currentTemplate = await EmailMarketingEngine.getTemplate(template_id);
      if (currentTemplate) {
        const newContent = updates.content || currentTemplate.content;
        const newSubject = updates.subject || currentTemplate.subject;
        updates.variables = extractVariables(newContent + ' ' + newSubject);
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: updatedTemplate, error } = await supabaseAdmin
      .from('email_templates')
      .update(updates)
      .eq('id', template_id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Template not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: updatedTemplate,
      message: 'Template updated successfully'
    });

  } catch (error) {
    console.error('Update template error:', error);
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

function extractVariables(content: string): string[] {
  const variableRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
  const variables = new Set<string>();
  let match;

  while ((match = variableRegex.exec(content)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}

function getMockTemplates(category?: string | null, search?: string | null, page: number = 1, limit: number = 20) {
  const mockTemplates: EmailTemplate[] = [
    {
      id: 'tpl_welcome_001',
      name: 'Welcome Email',
      subject: 'Welcome to OtoRaport, {{first_name}}!',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to OtoRaport!</h1>
          <p>Hi {{first_name}},</p>
          <p>Thanks for joining OtoRaport. We're excited to help you automate your property price reporting and ensure compliance with Ministry requirements.</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Quick Start Guide:</h3>
            <ul>
              <li>Upload your property data (CSV or Excel)</li>
              <li>Review and verify the generated XML</li>
              <li>Configure your automated reporting schedule</li>
            </ul>
          </div>

          <p><a href="{{dashboard_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Access Your Dashboard</a></p>

          <p>If you have any questions, our support team is here to help at support@otoraport.pl</p>

          <p>Best regards,<br>The OtoRaport Team</p>
        </div>
      `,
      variables: ['first_name', 'dashboard_url'],
      category: 'onboarding',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tpl_trial_day_1',
      name: 'Trial Day 1 - Getting Started',
      subject: 'Day 1: Getting started with your OtoRaport trial',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to your 14-day trial!</h1>
          <p>Hi {{first_name}},</p>
          <p>You've just started your OtoRaport trial. Here's how to get the most out of the next 14 days:</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Today's Tasks:</h3>
            <ul>
              <li>✅ Upload your first property dataset</li>
              <li>🔄 Review the Ministry XML output</li>
              <li>⚙️ Configure reporting preferences</li>
              <li>📧 Set up email notifications</li>
            </ul>
          </div>

          <p><strong>Trial Progress:</strong> Day 1 of 14 ({{trial_days_remaining}} days remaining)</p>

          <p><a href="{{dashboard_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Continue Setup</a></p>

          <p>Need help? Book a free onboarding call: <a href="{{onboarding_url}}">{{onboarding_url}}</a></p>
        </div>
      `,
      variables: ['first_name', 'dashboard_url', 'trial_days_remaining', 'onboarding_url'],
      category: 'onboarding',
      created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tpl_trial_expiring',
      name: 'Trial Expiring - Upgrade Reminder',
      subject: '{{first_name}}, your trial expires in {{days_remaining}} days',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">Don't lose access to automated reporting!</h1>
          <p>Hi {{first_name}},</p>
          <p>Your OtoRaport trial expires in <strong>{{days_remaining}} days</strong>. Don't risk manual reporting and potential Ministry penalties!</p>

          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
            <h3>Your Trial Results:</h3>
            <ul>
              <li>✅ {{properties_processed}} properties successfully processed</li>
              <li>✅ {{xml_files_generated}} Ministry-compliant XML files generated</li>
              <li>✅ {{potential_penalties_avoided}} in potential penalties avoided</li>
            </ul>
          </div>

          <p><strong>Upgrade Benefits:</strong></p>
          <ul>
            <li>🤖 Fully automated daily reporting</li>
            <li>📊 Advanced analytics and insights</li>
            <li>🛡️ 99.9% uptime guarantee</li>
            <li>📞 Priority support</li>
          </ul>

          <p><a href="{{upgrade_url}}" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Upgrade Now - Save 20%</a></p>

          <p>Questions? Reply to this email or call us at +48 123 456 789</p>
        </div>
      `,
      variables: ['first_name', 'days_remaining', 'properties_processed', 'xml_files_generated', 'potential_penalties_avoided', 'upgrade_url'],
      category: 'nurture',
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tpl_price_alert',
      name: 'Property Price Change Alert',
      subject: 'Price changes detected in {{project_name}}',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Price Update Detected</h1>
          <p>Hi {{first_name}},</p>
          <p>We've detected price changes in your project <strong>{{project_name}}</strong>:</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Changes Summary:</h3>
            <ul>
              <li>📈 {{increased_prices}} properties with price increases</li>
              <li>📉 {{decreased_prices}} properties with price decreases</li>
              <li>💰 Average change: {{average_change}}%</li>
              <li>📅 Effective date: {{effective_date}}</li>
            </ul>
          </div>

          <p><strong>Automatic Actions Taken:</strong></p>
          <ul>
            <li>✅ New XML file generated and uploaded</li>
            <li>✅ Ministry reporting updated</li>
            <li>✅ Compliance dashboard refreshed</li>
          </ul>

          <p><a href="{{view_changes_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Detailed Changes</a></p>

          <p>No action required - your reporting is fully automated!</p>
        </div>
      `,
      variables: ['first_name', 'project_name', 'increased_prices', 'decreased_prices', 'average_change', 'effective_date', 'view_changes_url'],
      category: 'transactional',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'tpl_monthly_report',
      name: 'Monthly Performance Report',
      subject: 'Your {{month}} OtoRaport Performance Summary',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">{{month}} Performance Report</h1>
          <p>Hi {{first_name}},</p>
          <p>Here's your monthly OtoRaport performance summary:</p>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>This Month's Metrics:</h3>
            <ul>
              <li>📊 {{total_reports}} automated reports generated</li>
              <li>✅ {{success_rate}}% successful submissions</li>
              <li>⚡ {{avg_processing_time}}s average processing time</li>
              <li>💰 {{estimated_savings}} in estimated time savings</li>
            </ul>
          </div>

          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Compliance Status:</h3>
            <p>✅ <strong>100% compliant</strong> with Ministry requirements</p>
            <p>🛡️ Zero penalties or violations detected</p>
            <p>📈 {{properties_tracked}} properties actively monitored</p>
          </div>

          <p><a href="{{detailed_report_url}}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Detailed Report</a></p>

          <p>Keep up the great work with automated compliance!</p>
        </div>
      `,
      variables: ['first_name', 'month', 'total_reports', 'success_rate', 'avg_processing_time', 'estimated_savings', 'properties_tracked', 'detailed_report_url'],
      category: 'retention',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  // Apply filters
  let filteredTemplates = mockTemplates;

  if (category) {
    filteredTemplates = filteredTemplates.filter(t => t.category === category);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    filteredTemplates = filteredTemplates.filter(t =>
      t.name.toLowerCase().includes(searchLower) ||
      t.subject.toLowerCase().includes(searchLower)
    );
  }

  // Apply pagination
  const offset = (page - 1) * limit;
  const paginatedTemplates = filteredTemplates.slice(offset, offset + limit);

  return NextResponse.json({
    success: true,
    data: paginatedTemplates,
    pagination: {
      page,
      limit,
      total: filteredTemplates.length,
      has_more: offset + limit < filteredTemplates.length
    },
    categories: [
      'onboarding',
      'nurture',
      'promotional',
      'transactional',
      'retention'
    ],
    note: 'Using mock data - database not available'
  });
}