-- Sprawdź które kolumny faktycznie istnieją w tabeli properties
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'properties'
AND column_name IN (
    'raw_data',
    'parking_space',
    'parking_price',
    'project_id',
    'apartment_number',
    'property_type',
    'price_per_m2',
    'base_price',
    'final_price',
    'surface_area',
    'status'
)
ORDER BY column_name;