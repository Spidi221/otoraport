require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Present' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanupDemoUser() {
  const demoEmail = 'demo@otoraport.pl'
  
  console.log(`🔍 Finding developer for ${demoEmail}...`)
  
  // 1. Get developer ID
  const { data: developer, error: devError } = await supabase
    .from('developers')
    .select('id, email, client_id')
    .eq('email', demoEmail)
    .single()
  
  if (devError || !developer) {
    console.error('❌ Developer not found:', devError?.message)
    return
  }
  
  console.log(`✅ Found developer: ${developer.email} (${developer.client_id})`)
  const developerId = developer.id
  
  // 2. Get all projects for this developer
  console.log('\n📦 Finding projects...')
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name')
    .eq('developer_id', developerId)
  
  const projectIds = projects?.map(p => p.id) || []
  console.log(`   Found ${projectIds.length} projects:`, projects?.map(p => p.name))
  
  // 3. Count data before deletion
  console.log('\n📊 Current data count:')
  
  const { count: propertiesCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .in('project_id', projectIds)
  console.log(`   Properties: ${propertiesCount || 0}`)
  
  const { count: filesCount } = await supabase
    .from('uploaded_files')
    .select('*', { count: 'exact', head: true })
    .eq('developer_id', developerId)
  console.log(`   Uploaded files: ${filesCount || 0}`)
  
  // Check optional tables
  const { count: generatedFilesCount } = await supabase
    .from('generated_files')
    .select('*', { count: 'exact', head: true })
    .eq('developer_id', developerId)
  console.log(`   Generated files: ${generatedFilesCount || 0}`)
  
  const { count: notificationLogsCount } = await supabase
    .from('notification_logs')
    .select('*', { count: 'exact', head: true })
    .eq('developer_id', developerId)
  console.log(`   Notification logs: ${notificationLogsCount || 0}`)
  
  const { count: apiKeysCount } = await supabase
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('developer_id', developerId)
  console.log(`   API keys: ${apiKeysCount || 0}`)
  
  // 4. Delete data (in correct order to respect foreign keys)
  console.log('\n🗑️  Deleting data...\n')
  
  // Delete properties first (depends on projects)
  if (projectIds.length > 0) {
    console.log('   Deleting properties...')
    const { error: propError } = await supabase
      .from('properties')
      .delete()
      .in('project_id', projectIds)
    
    if (propError) {
      console.error('   ❌ Error deleting properties:', propError.message)
    } else {
      console.log(`   ✅ Deleted ${propertiesCount} properties`)
    }
  }
  
  // Delete uploaded files
  console.log('   Deleting uploaded files...')
  const { error: filesError } = await supabase
    .from('uploaded_files')
    .delete()
    .eq('developer_id', developerId)
  
  if (filesError) {
    console.error('   ❌ Error deleting files:', filesError.message)
  } else {
    console.log(`   ✅ Deleted ${filesCount} uploaded files`)
  }
  
  // Delete generated files
  if (generatedFilesCount > 0) {
    console.log('   Deleting generated files...')
    const { error: genFilesError } = await supabase
      .from('generated_files')
      .delete()
      .eq('developer_id', developerId)
    
    if (!genFilesError) {
      console.log(`   ✅ Deleted ${generatedFilesCount} generated files`)
    }
  }
  
  // Delete notification logs
  if (notificationLogsCount > 0) {
    console.log('   Deleting notification logs...')
    const { error: notifError } = await supabase
      .from('notification_logs')
      .delete()
      .eq('developer_id', developerId)
    
    if (!notifError) {
      console.log(`   ✅ Deleted ${notificationLogsCount} notification logs`)
    }
  }
  
  // Delete API keys
  if (apiKeysCount > 0) {
    console.log('   Deleting API keys...')
    const { error: apiError } = await supabase
      .from('api_keys')
      .delete()
      .eq('developer_id', developerId)
    
    if (!apiError) {
      console.log(`   ✅ Deleted ${apiKeysCount} API keys`)
    }
  }
  
  // Delete projects
  console.log('   Deleting projects...')
  const { error: projectsError } = await supabase
    .from('projects')
    .delete()
    .eq('developer_id', developerId)
  
  if (projectsError) {
    console.error('   ❌ Error deleting projects:', projectsError.message)
  } else {
    console.log(`   ✅ Deleted ${projectIds.length} projects`)
  }
  
  // Reset developer metadata
  console.log('   Resetting developer metadata...')
  const { error: updateError } = await supabase
    .from('developers')
    .update({
      xml_url: null,
      md5_url: null,
      presentation_url: null,
      presentation_deployed_at: null,
      presentation_generated_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', developerId)
  
  if (updateError) {
    console.error('   ❌ Error updating developer:', updateError.message)
  } else {
    console.log('   ✅ Reset developer metadata')
  }
  
  // 5. Verify cleanup
  console.log('\n✅ CLEANUP COMPLETE!\n')
  console.log('📊 Verification:')
  
  const { count: newPropsCount } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .in('project_id', projectIds)
  
  const { count: newFilesCount } = await supabase
    .from('uploaded_files')
    .select('*', { count: 'exact', head: true })
    .eq('developer_id', developerId)
  
  const { count: newProjectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('developer_id', developerId)
  
  console.log(`   Properties: ${newPropsCount} (should be 0)`)
  console.log(`   Uploaded files: ${newFilesCount} (should be 0)`)
  console.log(`   Projects: ${newProjectsCount} (should be 0)`)
  
  if (newPropsCount === 0 && newFilesCount === 0 && newProjectsCount === 0) {
    console.log('\n🎉 All data successfully deleted!')
  } else {
    console.log('\n⚠️  Warning: Some data may still exist')
  }
}

cleanupDemoUser().catch(console.error)
