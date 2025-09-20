import { NextRequest, NextResponse } from 'next/server';
import { testApiSystemFunctionality, initializeSampleData, getApiAnalytics } from '@/lib/api-v1-fallback';
import { MockApiStorage } from '@/lib/mock-api-data';

export async function POST(request: NextRequest) {
  try {
    const { action = 'full_test', developer_id = 'test-developer-uuid' } = await request.json().catch(() => ({}));

    switch (action) {
      case 'full_test':
        // Run comprehensive functionality test
        const testResults = await testApiSystemFunctionality(developer_id);

        return NextResponse.json({
          status: 'completed',
          message: 'API system functionality test completed',
          timestamp: new Date().toISOString(),
          results: testResults
        });

      case 'init_sample_data':
        // Initialize sample data for testing
        await initializeSampleData(developer_id);
        const dataSummary = await MockApiStorage.getDataSummary();

        return NextResponse.json({
          status: 'success',
          message: 'Sample data initialized',
          timestamp: new Date().toISOString(),
          data_summary: dataSummary
        });

      case 'get_analytics':
        // Get API analytics
        const analytics = await getApiAnalytics(developer_id);

        return NextResponse.json({
          status: 'success',
          message: 'Analytics retrieved',
          timestamp: new Date().toISOString(),
          analytics
        });

      case 'clear_data':
        // Clear all test data
        await MockApiStorage.clearAllData();

        return NextResponse.json({
          status: 'success',
          message: 'All test data cleared',
          timestamp: new Date().toISOString()
        });

      case 'data_summary':
        // Get data summary
        const summary = await MockApiStorage.getDataSummary();

        return NextResponse.json({
          status: 'success',
          message: 'Data summary retrieved',
          timestamp: new Date().toISOString(),
          summary
        });

      default:
        return NextResponse.json({
          status: 'error',
          message: 'Invalid action',
          available_actions: ['full_test', 'init_sample_data', 'get_analytics', 'clear_data', 'data_summary'],
          timestamp: new Date().toISOString()
        }, { status: 400 });
    }

  } catch (error) {
    console.error('API system test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Test execution failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Quick status check
    const dataSummary = await MockApiStorage.getDataSummary();

    return NextResponse.json({
      status: 'ready',
      message: 'API testing system is ready',
      timestamp: new Date().toISOString(),
      current_data: dataSummary,
      available_endpoints: {
        'POST /api/test-api-system': {
          description: 'Run API system tests',
          actions: {
            full_test: 'Run comprehensive functionality test',
            init_sample_data: 'Initialize sample data for testing',
            get_analytics: 'Get API analytics',
            clear_data: 'Clear all test data',
            data_summary: 'Get current data summary'
          }
        },
        'GET /api/test-api-system': 'Get testing system status'
      },
      usage_example: {
        curl: "curl -X POST http://localhost:3000/api/test-api-system -H 'Content-Type: application/json' -d '{\"action\": \"full_test\", \"developer_id\": \"test-dev-123\"}'"
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to get testing system status',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}