import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { regenerateFilesForDeveloper, regenerateAllActiveFiles } from '@/lib/file-regeneration'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { developerId, regenerateAll = false } = body

    const userId = (session.user as any).id

    if (regenerateAll) {
      // Admin function to regenerate all files
      // In production, this should have additional admin role check
      console.log(`Manual bulk regeneration requested by ${session.user.email}`)
      
      const result = await regenerateAllActiveFiles()
      
      return NextResponse.json({
        success: true,
        message: `Bulk regeneration completed`,
        ...result
      })
    } else {
      // Regenerate files for specific developer (current user or specified developerId)
      const targetDeveloperId = developerId || userId
      
      // If user is not admin, only allow regeneration of their own files
      if (!developerId && targetDeveloperId !== userId) {
        return NextResponse.json(
          { error: 'Cannot regenerate files for other developers' },
          { status: 403 }
        )
      }

      console.log(`Manual regeneration requested by ${session.user.email} for developer ${targetDeveloperId}`)
      
      const result = await regenerateFilesForDeveloper(targetDeveloperId)
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Files regenerated successfully',
          xmlGenerated: result.xmlGenerated,
          markdownGenerated: result.markdownGenerated,
          developerId: targetDeveloperId
        })
      } else {
        return NextResponse.json(
          { 
            error: result.error || 'Regeneration failed',
            xmlGenerated: result.xmlGenerated,
            markdownGenerated: result.markdownGenerated
          },
          { status: 500 }
        )
      }
    }

  } catch (error) {
    console.error('Manual regeneration error:', error)
    return NextResponse.json(
      { error: 'Internal server error during regeneration' },
      { status: 500 }
    )
  }
}

// GET endpoint to check regeneration status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const developerId = searchParams.get('developerId')
    const userId = (session.user as any).id
    const targetId = developerId || userId

    // Get latest generation info from database
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    const { data: generatedFiles, error } = await supabaseAdmin
      .from('generated_files')
      .select('*')
      .eq('developer_id', targetId)
      .order('last_generated', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch regeneration status' },
        { status: 500 }
      )
    }

    const xmlFile = generatedFiles?.find(f => f.file_type === 'xml')
    const mdFile = generatedFiles?.find(f => f.file_type === 'md')

    return NextResponse.json({
      success: true,
      developerId: targetId,
      files: {
        xml: xmlFile ? {
          lastGenerated: xmlFile.last_generated,
          propertiesCount: xmlFile.properties_count,
          filePath: xmlFile.file_path
        } : null,
        markdown: mdFile ? {
          lastGenerated: mdFile.last_generated,
          propertiesCount: mdFile.properties_count,
          filePath: mdFile.file_path
        } : null
      },
      hasFiles: Boolean(xmlFile && mdFile)
    })

  } catch (error) {
    console.error('Regeneration status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}