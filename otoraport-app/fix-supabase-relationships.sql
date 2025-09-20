-- ========================================================================
-- NAPRAWA RELACJI MIĘDZY TABELAMI - refresh Supabase schema cache
-- ========================================================================

-- 1. Sprawdź istniejące foreign keys
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('projects', 'properties');

-- 2. Sprawdź czy foreign key istnieje między properties i projects
SELECT
    conname as constraint_name,
    conrelid::regclass as table_name,
    confrelid::regclass as foreign_table_name,
    a.attname as column_name,
    af.attname as foreign_column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = ANY(c.confkey)
WHERE c.contype = 'f'
    AND (conrelid::regclass::text = 'properties' OR confrelid::regclass::text = 'properties');

-- 3. Jeśli brak foreign key, dodaj go
DO $$
BEGIN
    -- Sprawdź czy foreign key już istnieje
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'properties'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%project%'
    ) THEN
        -- Dodaj foreign key constraint
        ALTER TABLE properties
        ADD CONSTRAINT fk_properties_project_id
        FOREIGN KEY (project_id) REFERENCES projects(id);

        RAISE NOTICE 'Dodano foreign key constraint: properties.project_id -> projects.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint już istnieje';
    END IF;

    -- Sprawdź czy foreign key między projects i developers istnieje
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'projects'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%developer%'
    ) THEN
        -- Dodaj foreign key constraint
        ALTER TABLE projects
        ADD CONSTRAINT fk_projects_developer_id
        FOREIGN KEY (developer_id) REFERENCES developers(id);

        RAISE NOTICE 'Dodano foreign key constraint: projects.developer_id -> developers.id';
    ELSE
        RAISE NOTICE 'Foreign key constraint projects->developers już istnieje';
    END IF;
END $$;

-- 4. Refresh Supabase schema cache (restart connection)
SELECT pg_notify('pgrst', 'reload schema');

-- 5. Test prostego query z JOIN (czy relacje działają)
SELECT
    d.company_name,
    pr.name as project_name,
    COUNT(p.id) as properties_count
FROM developers d
JOIN projects pr ON pr.developer_id = d.id
JOIN properties p ON p.project_id = pr.id
WHERE d.client_id = 'rolbestcompany123'
GROUP BY d.company_name, pr.name;

-- ========================================================================
-- SUKCES! Foreign keys powinny być naprawione
-- ========================================================================