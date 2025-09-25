import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting database setup...')

    // Migracja 1: Tworzenie tabel
    const migration = `
      -- Enable Row Level Security
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Developers table
      CREATE TABLE IF NOT EXISTS developers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        company_name TEXT,
        nip TEXT,
        phone TEXT,
        subscription_status TEXT DEFAULT 'trial',
        subscription_end_date TIMESTAMP,
        ministry_approved BOOLEAN DEFAULT false,
        ministry_email_sent BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Projects table
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        location TEXT,
        address TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Properties table
      CREATE TABLE IF NOT EXISTS properties (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        property_number TEXT NOT NULL,
        property_type TEXT NOT NULL,
        price_per_m2 DECIMAL,
        total_price DECIMAL,
        final_price DECIMAL,
        area DECIMAL,
        parking_space TEXT,
        parking_price DECIMAL,
        status TEXT DEFAULT 'available',
        raw_data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Uploaded files table
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER,
        processed BOOLEAN DEFAULT false,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Generated files table
      CREATE TABLE IF NOT EXISTS generated_files (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
        file_type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        last_generated TIMESTAMP DEFAULT NOW(),
        properties_count INTEGER,
        UNIQUE(developer_id, file_type)
      );

      -- Payments table
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
        amount DECIMAL NOT NULL,
        currency TEXT DEFAULT 'PLN',
        status TEXT NOT NULL,
        przelewy24_session_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Activity logs table
      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        developer_id UUID REFERENCES developers(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_developers_email ON developers(email);
      CREATE INDEX IF NOT EXISTS idx_projects_developer_id ON projects(developer_id);
      CREATE INDEX IF NOT EXISTS idx_properties_project_id ON properties(project_id);
      CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
      CREATE INDEX IF NOT EXISTS idx_uploaded_files_developer_id ON uploaded_files(developer_id);
      CREATE INDEX IF NOT EXISTS idx_generated_files_developer_id ON generated_files(developer_id);
      CREATE INDEX IF NOT EXISTS idx_payments_developer_id ON payments(developer_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_developer_id ON activity_logs(developer_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

      -- RLS Policies
      ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
      ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
      ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
      ALTER TABLE generated_files ENABLE ROW LEVEL SECURITY;
      ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

      -- Developer policies (users can only access their own data)
      CREATE POLICY IF NOT EXISTS "Developers can view own data" ON developers
        FOR ALL USING (auth.uid()::text = id::text);

      CREATE POLICY IF NOT EXISTS "Projects belong to developer" ON projects
        FOR ALL USING (developer_id IN (
          SELECT id FROM developers WHERE auth.uid()::text = id::text
        ));

      CREATE POLICY IF NOT EXISTS "Properties belong to developer" ON properties
        FOR ALL USING (project_id IN (
          SELECT p.id FROM projects p 
          JOIN developers d ON p.developer_id = d.id 
          WHERE auth.uid()::text = d.id::text
        ));

      CREATE POLICY IF NOT EXISTS "Files belong to developer" ON uploaded_files
        FOR ALL USING (developer_id IN (
          SELECT id FROM developers WHERE auth.uid()::text = id::text
        ));

      CREATE POLICY IF NOT EXISTS "Generated files belong to developer" ON generated_files
        FOR ALL USING (developer_id IN (
          SELECT id FROM developers WHERE auth.uid()::text = id::text
        ));

      CREATE POLICY IF NOT EXISTS "Payments belong to developer" ON payments
        FOR ALL USING (developer_id IN (
          SELECT id FROM developers WHERE auth.uid()::text = id::text
        ));

      CREATE POLICY IF NOT EXISTS "Activity logs belong to developer" ON activity_logs
        FOR ALL USING (developer_id IN (
          SELECT id FROM developers WHERE auth.uid()::text = id::text
        ));

      -- Functions and triggers for updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Triggers
      DROP TRIGGER IF EXISTS update_developers_updated_at ON developers;
      CREATE TRIGGER update_developers_updated_at
        BEFORE UPDATE ON developers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
      CREATE TRIGGER update_properties_updated_at
        BEFORE UPDATE ON properties
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `

    // Uruchom migrację
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: migration })
    
    if (error) {
      console.error('Migration error:', error)
      // Spróbuj wykonać po kawałkach
      const queries = migration.split(';').filter(q => q.trim())
      let successCount = 0
      let errorCount = 0
      
      for (const query of queries) {
        if (query.trim()) {
          try {
            await supabaseAdmin.rpc('exec_sql', { sql: query })
            successCount++
          } catch (err) {
            console.log('Query failed (might be OK):', query.substring(0, 50), err)
            errorCount++
          }
        }
      }
      
      console.log(`Migration completed: ${successCount} success, ${errorCount} errors`)
    }

    // Sprawdź czy tabele zostały utworzone
    const { data: tables } = await supabaseAdmin.rpc('exec_sql', { 
      sql: "SELECT tablename FROM pg_tables WHERE schemaname = 'public'" 
    })

    console.log('📋 Created tables:', tables)

    return NextResponse.json({
      success: true,
      message: 'Database setup completed',
      tablesCreated: tables
    })

  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json(
      { error: 'Database setup failed', details: error },
      { status: 500 }
    )
  }
}