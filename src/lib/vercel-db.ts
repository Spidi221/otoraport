import { sql } from '@vercel/postgres';

// ✅ VERCEL POSTGRES CLIENT - REPLACEMENT FOR SUPABASE
// No more PGRST002 errors, no PostgREST layer issues!

export async function getDeveloperByEmail(email: string) {
  try {
    const { rows } = await sql`
      SELECT * FROM developers WHERE email = ${email}
    `;
    return rows[0] || null;
  } catch (error) {
    console.error('❌ VERCEL DB: Error getting developer by email:', error);
    return null;
  }
}

export async function getDeveloperById(id: string) {
  try {
    const { rows } = await sql`
      SELECT * FROM developers WHERE id = ${id}
    `;
    return rows[0] || null;
  } catch (error) {
    console.error('❌ VERCEL DB: Error getting developer by id:', error);
    return null;
  }
}

export async function createDeveloper(data: any) {
  try {
    const { rows } = await sql`
      INSERT INTO developers (user_id, email, company_name, client_id, subscription_plan, subscription_status, nip)
      VALUES (${data.user_id}, ${data.email}, ${data.company_name}, ${data.client_id}, ${data.subscription_plan || 'basic'}, ${data.subscription_status || 'trial'}, ${data.nip || null})
      RETURNING *
    `;
    return rows[0];
  } catch (error) {
    console.error('❌ VERCEL DB: Error creating developer:', error);
    throw new Error('Failed to create developer');
  }
}

export async function updateDeveloper(id: string, updates: any) {
  try {
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      updateFields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`updated_at = NOW()`);

    const query = `
      UPDATE developers
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(id);

    const { rows } = await sql.query(query, values);
    return rows[0];
  } catch (error) {
    console.error('❌ VERCEL DB: Error updating developer:', error);
    throw new Error('Failed to update developer');
  }
}

// ================== PROJECTS ==================

export async function getProjectsByDeveloperId(developerId: string) {
  try {
    const { rows } = await sql`
      SELECT * FROM projects
      WHERE developer_id = ${developerId}
      ORDER BY created_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('❌ VERCEL DB: Error getting projects:', error);
    return [];
  }
}

export async function createProject(project: any) {
  try {
    const { rows } = await sql`
      INSERT INTO projects (developer_id, name, location, address, status)
      VALUES (${project.developer_id}, ${project.name}, ${project.location || null}, ${project.address || null}, ${project.status || 'active'})
      RETURNING *
    `;
    return rows[0];
  } catch (error) {
    console.error('❌ VERCEL DB: Error creating project:', error);
    throw new Error('Failed to create project');
  }
}

// ================== PROPERTIES ==================

export async function getPropertiesByDeveloper(developerId: string) {
  try {
    const { rows } = await sql`
      SELECT p.*, pr.name as project_name, pr.location as project_location
      FROM properties p
      LEFT JOIN projects pr ON p.project_id = pr.id
      WHERE p.developer_id = ${developerId}
      ORDER BY p.created_at DESC
    `;
    return rows;
  } catch (error) {
    console.error('❌ VERCEL DB: Error getting properties by developer:', error);
    return [];
  }
}

export async function getPropertiesByProjectId(projectId: string) {
  try {
    const { rows } = await sql`
      SELECT * FROM properties
      WHERE project_id = ${projectId}
      ORDER BY property_number
    `;
    return rows;
  } catch (error) {
    console.error('❌ VERCEL DB: Error getting properties by project:', error);
    return [];
  }
}

export async function createProperty(property: any) {
  try {
    const { rows } = await sql`
      INSERT INTO properties (
        developer_id, project_id, property_number, property_type, area,
        price_per_m2, total_price, final_price, status, wojewodztwo,
        powiat, gmina, miejscowosc, ulica, kod_pocztowy,
        price_valid_from, price_valid_to
      )
      VALUES (
        ${property.developer_id}, ${property.project_id || null}, ${property.property_number},
        ${property.property_type || 'mieszkanie'}, ${property.area}, ${property.price_per_m2},
        ${property.total_price}, ${property.final_price}, ${property.status || 'available'},
        ${property.wojewodztwo}, ${property.powiat}, ${property.gmina},
        ${property.miejscowosc || null}, ${property.ulica || null}, ${property.kod_pocztowy || null},
        ${property.price_valid_from}, ${property.price_valid_to || null}
      )
      RETURNING *
    `;
    return rows[0];
  } catch (error) {
    console.error('❌ VERCEL DB: Error creating property:', error);
    throw new Error('Failed to create property');
  }
}

export async function updateProperty(id: string, updates: any) {
  try {
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      updateFields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push(`updated_at = NOW()`);

    const query = `
      UPDATE properties
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    values.push(id);

    const { rows } = await sql.query(query, values);
    return rows[0];
  } catch (error) {
    console.error('❌ VERCEL DB: Error updating property:', error);
    throw new Error('Failed to update property');
  }
}

export async function bulkCreateProperties(properties: any[]) {
  try {
    const results = [];
    for (const property of properties) {
      const result = await createProperty(property);
      results.push(result);
    }
    return results;
  } catch (error) {
    console.error('❌ VERCEL DB: Error bulk creating properties:', error);
    throw new Error('Failed to bulk create properties');
  }
}

// ================== FILE OPERATIONS ==================

export async function createUploadedFile(file: any) {
  try {
    const { rows } = await sql`
      INSERT INTO uploaded_files (developer_id, filename, original_name, file_size, file_type, file_path, processed)
      VALUES (${file.developer_id}, ${file.filename}, ${file.original_name}, ${file.file_size}, ${file.file_type}, ${file.file_path}, ${file.processed || false})
      RETURNING *
    `;
    return rows[0];
  } catch (error) {
    console.error('❌ VERCEL DB: Error creating uploaded file:', error);
    throw new Error('Failed to create uploaded file record');
  }
}

export async function markFileAsProcessed(fileId: string, propertiesCount: number) {
  try {
    const { rows } = await sql`
      UPDATE uploaded_files
      SET processed = true, processed_at = NOW()
      WHERE id = ${fileId}
      RETURNING *
    `;
    return rows[0];
  } catch (error) {
    console.error('❌ VERCEL DB: Error marking file as processed:', error);
    throw new Error('Failed to mark file as processed');
  }
}

// ================== GENERATED FILES ==================

export async function upsertGeneratedFile(generatedFile: any) {
  try {
    const { rows } = await sql`
      INSERT INTO generated_files (developer_id, file_type, file_url, file_path, last_generated)
      VALUES (${generatedFile.developer_id}, ${generatedFile.file_type}, ${generatedFile.file_url}, ${generatedFile.file_path}, NOW())
      ON CONFLICT (developer_id, file_type)
      DO UPDATE SET
        file_url = EXCLUDED.file_url,
        file_path = EXCLUDED.file_path,
        last_generated = NOW()
      RETURNING *
    `;
    return rows[0];
  } catch (error) {
    console.error('❌ VERCEL DB: Error upserting generated file:', error);
    throw new Error('Failed to upsert generated file');
  }
}

export async function getGeneratedFiles(developerId: string) {
  try {
    const { rows } = await sql`
      SELECT * FROM generated_files
      WHERE developer_id = ${developerId}
      ORDER BY last_generated DESC
    `;
    return rows;
  } catch (error) {
    console.error('❌ VERCEL DB: Error getting generated files:', error);
    return [];
  }
}

// ================== DASHBOARD STATS ==================

export async function getDeveloperStats(developerId: string) {
  try {
    // Get projects count
    const { rows: projectsData } = await sql`
      SELECT COUNT(*) as count FROM projects WHERE developer_id = ${developerId}
    `;
    const projectsCount = parseInt(projectsData[0]?.count || '0');

    // Get properties by status
    const { rows: properties } = await sql`
      SELECT status FROM properties WHERE developer_id = ${developerId}
    `;

    const totalProperties = properties.length;
    const availableProperties = properties.filter(p => p.status === 'available').length;
    const soldProperties = properties.filter(p => p.status === 'sold').length;
    const reservedProperties = properties.filter(p => p.status === 'reserved').length;

    // Get last upload
    const { rows: lastUploadData } = await sql`
      SELECT created_at FROM uploaded_files
      WHERE developer_id = ${developerId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return {
      projectsCount,
      totalProperties,
      availableProperties,
      soldProperties,
      reservedProperties,
      lastUpload: lastUploadData[0]?.created_at || null
    };
  } catch (error) {
    console.error('❌ VERCEL DB: Error getting developer stats:', error);
    return {
      projectsCount: 0,
      totalProperties: 0,
      availableProperties: 0,
      soldProperties: 0,
      reservedProperties: 0,
      lastUpload: null
    };
  }
}

// ================== UTILITIES ==================

export async function testConnection() {
  try {
    const { rows } = await sql`SELECT NOW() as current_time`;
    console.log('✅ VERCEL DB: Connection successful:', rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ VERCEL DB: Connection failed:', error);
    return false;
  }
}

export async function createInitialDeveloperData(developerId: string, developerEmail: string, companyName: string) {
  try {
    // Create sample project
    const project = await createProject({
      developer_id: developerId,
      name: 'Przykładowa Inwestycja',
      location: 'Warszawa',
      address: 'ul. Przykładowa 1, 00-000 Warszawa',
      status: 'active'
    });

    // Create sample properties
    const sampleProperties = [
      {
        developer_id: developerId,
        project_id: project.id,
        property_number: 'A1/1',
        property_type: 'Mieszkanie',
        price_per_m2: 12000,
        total_price: 600000,
        final_price: 600000,
        area: 50,
        status: 'available',
        wojewodztwo: 'mazowieckie',
        powiat: 'warszawa',
        gmina: 'Warszawa',
        price_valid_from: new Date().toISOString().split('T')[0]
      },
      {
        developer_id: developerId,
        project_id: project.id,
        property_number: 'A1/2',
        property_type: 'Mieszkanie',
        price_per_m2: 12500,
        total_price: 750000,
        final_price: 750000,
        area: 60,
        status: 'available',
        wojewodztwo: 'mazowieckie',
        powiat: 'warszawa',
        gmina: 'Warszawa',
        price_valid_from: new Date().toISOString().split('T')[0]
      }
    ];

    const createdProperties = await bulkCreateProperties(sampleProperties);

    return { project, properties: createdProperties };
  } catch (error) {
    console.error('❌ VERCEL DB: Error creating initial developer data:', error);
    throw error;
  }
}

console.log('🚀 VERCEL DB: Database client initialized - NO MORE PGRST002 ERRORS!');