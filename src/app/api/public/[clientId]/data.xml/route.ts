import { NextRequest, NextResponse } from 'next/server'
import { generateXMLForMinistry, createSampleData } from '@/lib/generators'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params

    // Validate client ID format
    if (!clientId || clientId.length < 10) {
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      )
    }

    console.log(`Ministry XML request for client: ${clientId}`)

    let data: any = null
    
    try {
      // Try to get real data from database
      const { data: developer, error: devError } = await supabaseAdmin
        .from('developers')
        .select('*')
        .eq('client_id', clientId)
        .single()
      
      if (devError || !developer) {
        console.log('Developer not found, using sample data')
        data = createSampleData(clientId)
      } else {
        // Get projects for this developer
        const { data: projects } = await supabaseAdmin
          .from('projects')
          .select('*')
          .eq('developer_id', developer.id)

        // Get properties for these projects
        const projectIds = projects?.map(p => p.id) || []
        const { data: properties } = await supabaseAdmin
          .from('properties')
          .select('*')
          .in('project_id', projectIds)

        data = { 
          developer: {
            id: developer.id,
            email: developer.email,
            name: developer.name,
            company_name: developer.company_name,
            nip: developer.nip,
            phone: developer.phone
          }, 
          projects: projects || [], 
          properties: (properties || []).map(prop => ({
            id: prop.id,
            property_number: prop.property_number || 'N/A',
            property_type: prop.property_type || 'mieszkanie',
            price_per_m2: prop.price_per_m2,
            total_price: prop.total_price,
            final_price: prop.final_price || prop.total_price,
            area: prop.area,
            parking_space: prop.parking_space,
            parking_price: prop.parking_price,
            status: prop.status || 'dostępne',
            raw_data: prop
          }))
        }
        
        console.log(`Found real data: ${properties?.length || 0} properties for ${developer.company_name}`)
      }
    } catch (dbError) {
      console.log('Database query failed, using sample data:', dbError)
      data = createSampleData(clientId)
    }

    // Generate XML according to ministry schema 1.13
    const xmlContent = generateXMLForMinistry(data)

    // Set appropriate headers for XML response
    const headers = new Headers({
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      'X-Generated-At': new Date().toISOString(),
      'X-Schema-Version': '1.13',
      'X-Client-ID': clientId
    })

    return new NextResponse(xmlContent, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('XML generation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error generating XML',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}