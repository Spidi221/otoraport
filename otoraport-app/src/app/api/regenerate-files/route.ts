import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateXMLFile } from '@/lib/xml-generator'
import { generateMarkdownFile } from '@/lib/md-generator'
import { sendEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { developerId, forceRegenerate = false } = await request.json()

    if (!developerId) {
      return NextResponse.json(
        { error: 'Developer ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 Manual regeneration requested for developer: ${developerId}`)

    // 1. Pobierz dane dewelopera
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('*')
      .eq('id', developerId)
      .single()

    if (!developer) {
      return NextResponse.json(
        { error: 'Developer not found' },
        { status: 404 }
      )
    }

    // 2. Pobierz projekty dewelopera
    const { data: projects } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('developer_id', developerId)

    // 3. Pobierz wszystkie nieruchomości dewelopera
    const { data: properties } = await supabaseAdmin
      .from('properties')
      .select(`
        *,
        projects!inner(developer_id)
      `)
      .eq('projects.developer_id', developerId)
      .eq('status', 'available')

    if (!properties || properties.length === 0) {
      return NextResponse.json(
        { error: 'No properties found for this developer' },
        { status: 404 }
      )
    }

    console.log(`📊 Found ${properties.length} properties for ${developer.company_name}`)

    // 4. Sprawdź czy pliki już istnieją i czy potrzeba regeneracji
    const { data: existingFiles } = await supabaseAdmin
      .from('generated_files')
      .select('*')
      .eq('developer_id', developerId)

    const lastGenerated = existingFiles?.[0]?.last_generated
    const lastUpdate = properties.reduce((latest, prop) => {
      const propUpdate = new Date(prop.updated_at)
      return propUpdate > latest ? propUpdate : latest
    }, new Date(0))

    if (!forceRegenerate && lastGenerated && new Date(lastGenerated) > lastUpdate) {
      return NextResponse.json({
        success: true,
        message: 'Files are up to date, no regeneration needed',
        lastGenerated,
        lastDataUpdate: lastUpdate.toISOString(),
        skipRegeneration: true
      })
    }

    // 5. Generuj pliki XML i Markdown
    const xmlContent = generateXMLFile({
      developer,
      projects: projects || [],
      properties,
      generatedAt: new Date()
    })

    const markdownContent = generateMarkdownFile({
      developer,
      projects: projects || [],
      properties,
      generatedAt: new Date()
    })

    // 6. Zapisz pliki w bazie danych lub storage
    const now = new Date().toISOString()

    // Upsert XML file record
    await supabaseAdmin
      .from('generated_files')
      .upsert({
        developer_id: developerId,
        file_type: 'xml',
        file_path: `/api/public/${developerId}/data.xml`,
        last_generated: now,
        properties_count: properties.length
      }, {
        onConflict: 'developer_id,file_type'
      })

    // Upsert Markdown file record
    await supabaseAdmin
      .from('generated_files')
      .upsert({
        developer_id: developerId,
        file_type: 'md',
        file_path: `/api/public/${developerId}/data.md`,
        last_generated: now,
        properties_count: properties.length
      }, {
        onConflict: 'developer_id,file_type'
      })

    // 7. W produkcji: zapisz pliki do storage (Supabase Storage lub S3)
    // TODO: Implementacja storage w przyszłości
    // await supabaseAdmin.storage
    //   .from('generated-files')
    //   .upload(`${developerId}/data.xml`, xmlContent, { upsert: true })

    // 8. Wyślij email powiadomienie do dewelopera
    if (developer.email) {
      try {
        await sendEmail({
          to: developer.email,
          subject: 'OTORAPORT - Pliki zostały zaktualizowane',
          html: `
            <h2>Pliki zostały pomyślnie wygenerowane</h2>
            <p>Szanowny/a ${developer.name},</p>
            
            <p>Twoje pliki XML i Markdown zostały pomyślnie wygenerowane i są dostępne dla ministerstwa pod następującymi adresami:</p>
            
            <ul>
              <li><strong>XML:</strong> <a href="${process.env.NEXTAUTH_URL}/api/public/${developerId}/data.xml">Link do pliku XML</a></li>
              <li><strong>Markdown:</strong> <a href="${process.env.NEXTAUTH_URL}/api/public/${developerId}/data.md">Link do pliku Markdown</a></li>
            </ul>
            
            <p><strong>Statystyki:</strong></p>
            <ul>
              <li>Liczba nieruchomości: ${properties.length}</li>
              <li>Data generowania: ${new Date().toLocaleString('pl-PL')}</li>
              <li>Status: ${forceRegenerate ? 'Wymuszona regeneracja' : 'Automatyczna aktualizacja'}</li>
            </ul>
            
            <p>Ministerstwo ma teraz dostęp do najnowszych danych o cenach Twoich nieruchomości.</p>
            
            <p>Pozdrawiam,<br>
            Zespół OTORAPORT</p>
          `,
          text: `
            OTORAPORT - Pliki zostały zaktualizowane
            
            Szanowny/a ${developer.name},
            
            Twoje pliki XML i Markdown zostały pomyślnie wygenerowane.
            
            XML: ${process.env.NEXTAUTH_URL}/api/public/${developerId}/data.xml
            Markdown: ${process.env.NEXTAUTH_URL}/api/public/${developerId}/data.md
            
            Liczba nieruchomości: ${properties.length}
            Data generowania: ${new Date().toLocaleString('pl-PL')}
            
            Zespół OTORAPORT
          `
        })
      } catch (emailError) {
        console.error('Email notification failed:', emailError)
        // Nie przerywamy procesu jeśli email się nie wyśle
      }
    }

    // 9. Loguj aktywność w bazie
    await supabaseAdmin
      .from('activity_logs')
      .insert({
        developer_id: developerId,
        action: 'files_regenerated',
        details: {
          properties_count: properties.length,
          force_regenerate: forceRegenerate,
          generated_at: now
        }
      })
      .catch(err => {
        console.error('Activity log failed:', err)
        // Nie przerywamy procesu
      })

    console.log(`✅ Files regenerated successfully for ${developer.company_name}`)

    return NextResponse.json({
      success: true,
      message: 'Files regenerated successfully',
      data: {
        developer: {
          name: developer.company_name,
          email: developer.email
        },
        files: {
          xml: `/api/public/${developerId}/data.xml`,
          markdown: `/api/public/${developerId}/data.md`
        },
        statistics: {
          properties_count: properties.length,
          last_generated: now,
          force_regenerate: forceRegenerate
        }
      }
    })

  } catch (error) {
    console.error('Manual regeneration error:', error)
    return NextResponse.json(
      { 
        error: 'File regeneration failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint do sprawdzania statusu
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const developerId = searchParams.get('developerId')

    if (!developerId) {
      return NextResponse.json(
        { error: 'Developer ID is required' },
        { status: 400 }
      )
    }

    // Pobierz informacje o ostatniej regeneracji
    const { data: files } = await supabaseAdmin
      .from('generated_files')
      .select('*')
      .eq('developer_id', developerId)
      .order('last_generated', { ascending: false })

    // Pobierz ostatnią aktualizację danych
    const { data: properties } = await supabaseAdmin
      .from('properties')
      .select(`
        updated_at,
        projects!inner(developer_id)
      `)
      .eq('projects.developer_id', developerId)
      .order('updated_at', { ascending: false })
      .limit(1)

    const lastDataUpdate = properties?.[0]?.updated_at
    const lastFileGeneration = files?.[0]?.last_generated

    const needsRegeneration = !lastFileGeneration || 
      (lastDataUpdate && new Date(lastDataUpdate) > new Date(lastFileGeneration))

    return NextResponse.json({
      success: true,
      data: {
        files: files || [],
        last_data_update: lastDataUpdate,
        last_file_generation: lastFileGeneration,
        needs_regeneration: needsRegeneration,
        total_properties: files?.[0]?.properties_count || 0
      }
    })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    )
  }
}