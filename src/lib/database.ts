// Database service layer - zastępuje mock data
import { createAdminClient } from '@/lib/supabase/server'
// Note: Database types should come from @/types/supabase if needed

// Re-export createAdminClient for backwards compatibility
export { createAdminClient }

// Developer operations
export async function getDeveloperById(id: string) {
  const { data, error } = await createAdminClient()
    .from('developers')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching developer:', error)
    return null
  }

  return data
}

export async function getDeveloperByEmail(email: string) {
  const { data, error } = await createAdminClient()
    .from('developers')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    console.error('Error fetching developer by email:', error)
    return null
  }

  return data
}

export async function createDeveloper(developer: Database['public']['Tables']['developers']['Insert']) {
  const { data, error } = await createAdminClient()
    .from('developers')
    .insert(developer)
    .select()
    .single()

  if (error) {
    console.error('Error creating developer:', error)
    throw new Error('Failed to create developer')
  }

  return data
}

export async function updateDeveloper(
  id: string, 
  updates: Database['public']['Tables']['developers']['Update']
) {
  const { data, error } = await createAdminClient()
    .from('developers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating developer:', error)
    throw new Error('Failed to update developer')
  }

  return data
}

// Project operations
export async function getProjectsByDeveloperId(developerId: string) {
  const { data, error } = await createAdminClient()
    .from('projects')
    .select('*')
    .eq('developer_id', developerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }

  return data
}

export async function createProject(project: Database['public']['Tables']['projects']['Insert']) {
  const { data, error } = await createAdminClient()
    .from('projects')
    .insert(project)
    .select()
    .single()

  if (error) {
    console.error('Error creating project:', error)
    throw new Error('Failed to create project')
  }

  return data
}

// Properties operations
export async function getPropertiesByDeveloperId(developerId: string) {
  const { data, error } = await createAdminClient()
    .from('properties')
    .select(`
      *,
      project:projects(*)
    `)
    .eq('project.developer_id', developerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching properties:', error)
    return []
  }

  return data
}

export async function getPropertiesByProjectId(projectId: string) {
  const { data, error } = await createAdminClient()
    .from('properties')
    .select('*')
    .eq('project_id', projectId)
    .order('property_number')

  if (error) {
    console.error('Error fetching properties by project:', error)
    return []
  }

  return data
}

export async function createProperty(property: Database['public']['Tables']['properties']['Insert']) {
  const { data, error } = await createAdminClient()
    .from('properties')
    .insert(property)
    .select()
    .single()

  if (error) {
    console.error('Error creating property:', error)
    throw new Error('Failed to create property')
  }

  return data
}

export async function updateProperty(
  id: string,
  updates: Database['public']['Tables']['properties']['Update']
) {
  const { data, error } = await createAdminClient()
    .from('properties')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating property:', error)
    throw new Error('Failed to update property')
  }

  return data
}

export async function bulkCreateProperties(properties: Database['public']['Tables']['properties']['Insert'][]) {
  const { data, error } = await createAdminClient()
    .from('properties')
    .insert(properties)
    .select()

  if (error) {
    console.error('Error bulk creating properties:', error)
    throw new Error('Failed to bulk create properties')
  }

  return data
}

// File operations
export async function createUploadedFile(file: Database['public']['Tables']['uploaded_files']['Insert']) {
  const { data, error } = await createAdminClient()
    .from('uploaded_files')
    .insert(file)
    .select()
    .single()

  if (error) {
    console.error('Error creating uploaded file record:', error)
    throw new Error('Failed to create uploaded file record')
  }

  return data
}

export async function markFileAsProcessed(fileId: string) {
  const { data, error } = await createAdminClient()
    .from('uploaded_files')
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
    })
    .eq('id', fileId)
    .select()
    .single()

  if (error) {
    console.error('Error marking file as processed:', error)
    throw new Error('Failed to mark file as processed')
  }

  return data
}

export async function getUploadedFiles(developerId: string) {
  const { data, error } = await createAdminClient()
    .from('uploaded_files')
    .select(`
      *,
      project:projects(id, name)
    `)
    .eq('developer_id', developerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching uploaded files:', error)
    return []
  }

  return data
}

export async function deleteUploadedFile(fileId: string, developerId: string) {
  try {
    // First, verify that the file belongs to this developer
    const { data: file, error: fileError } = await createAdminClient()
      .from('uploaded_files')
      .select('id, project_id')
      .eq('id', fileId)
      .eq('developer_id', developerId)
      .single()

    if (fileError || !file) {
      throw new Error('File not found or access denied')
    }

    // Delete all properties associated with this file's project
    // (assuming file is linked to a project)
    let deletedPropertiesCount = 0

    if (file.project_id) {
      // First, count properties to be deleted
      const { count } = await createAdminClient()
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', file.project_id)

      deletedPropertiesCount = count || 0

      // Delete all properties
      const { error: propertiesError } = await createAdminClient()
        .from('properties')
        .delete()
        .eq('project_id', file.project_id)

      if (propertiesError) {
        console.error('Error deleting properties:', propertiesError)
        throw new Error('Failed to delete associated properties')
      }

      console.log(`🗑️ Deleted ${deletedPropertiesCount} properties for project ${file.project_id}`)
    }

    // Delete the file record
    const { error: deleteError } = await createAdminClient()
      .from('uploaded_files')
      .delete()
      .eq('id', fileId)

    if (deleteError) {
      console.error('Error deleting file:', deleteError)
      throw new Error('Failed to delete file')
    }

    return { success: true, deletedPropertiesCount }
  } catch (error) {
    console.error('Error in deleteUploadedFile:', error)
    throw error
  }
}

// Generated files operations
export async function upsertGeneratedFile(
  generatedFile: Database['public']['Tables']['generated_files']['Insert']
) {
  const { data, error } = await createAdminClient()
    .from('generated_files')
    .upsert(generatedFile, {
      onConflict: 'developer_id,file_type'
    })
    .select()
    .single()

  if (error) {
    console.error('Error upserting generated file:', error)
    throw new Error('Failed to upsert generated file')
  }

  return data
}

export async function getGeneratedFiles(developerId: string) {
  const { data, error } = await createAdminClient()
    .from('generated_files')
    .select('*')
    .eq('developer_id', developerId)
    .order('last_generated', { ascending: false })

  if (error) {
    console.error('Error fetching generated files:', error)
    return []
  }

  return data
}

// Dashboard statistics
export async function getDeveloperStats(developerId: string) {
  try {
    // Get projects count
    const { count: projectsCount } = await createAdminClient()
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('developer_id', developerId)

    // Get properties by status
    const { data: properties } = await createAdminClient()
      .from('properties')
      .select('status, project:projects!inner(developer_id)')
      .eq('project.developer_id', developerId)

    const totalProperties = properties?.length || 0
    const availableProperties = properties?.filter(p => p.status === 'available').length || 0
    const soldProperties = properties?.filter(p => p.status === 'sold').length || 0
    const reservedProperties = properties?.filter(p => p.status === 'reserved').length || 0

    // Get last upload
    const { data: lastUpload } = await createAdminClient()
      .from('uploaded_files')
      .select('created_at')
      .eq('developer_id', developerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return {
      projectsCount: projectsCount || 0,
      totalProperties,
      availableProperties,
      soldProperties,
      reservedProperties,
      lastUpload: lastUpload?.created_at || null
    }
  } catch (error) {
    console.error('Error fetching developer stats:', error)
    return {
      projectsCount: 0,
      totalProperties: 0,
      availableProperties: 0,
      soldProperties: 0,
      reservedProperties: 0,
      lastUpload: null
    }
  }
}

// Helper function to create initial data for new developers
export async function createInitialDeveloperData(developerId: string) {
  try {
    // Create sample project
    const project = await createProject({
      developer_id: developerId,
      name: 'Przykładowa Inwestycja',
      location: 'Warszawa',
      address: 'ul. Przykładowa 1, 00-000 Warszawa',
      status: 'active'
    })

    // Create sample properties
    const sampleProperties = [
      {
        project_id: project.id,
        property_number: 'A1/1',
        property_type: 'Mieszkanie',
        price_per_m2: 12000,
        total_price: 600000,
        final_price: 600000,
        area: 50,
        status: 'available' as const
      },
      {
        project_id: project.id,
        property_number: 'A1/2',
        property_type: 'Mieszkanie',
        price_per_m2: 12500,
        total_price: 750000,
        final_price: 750000,
        area: 60,
        status: 'available' as const
      }
    ]

    await bulkCreateProperties(sampleProperties)

    return { project, properties: sampleProperties }
  } catch (error) {
    console.error('Error creating initial developer data:', error)
    throw error
  }
}