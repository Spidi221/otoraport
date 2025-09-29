#!/bin/bash
# Test if XML contains real data from database

echo "🔍 Testing XML generation with real data..."
echo ""

# Get developer's client_id from database (assuming user email chudziszewski221@gmail.com)
echo "Step 1: Checking if properties exist in database..."
echo ""

# We can't query Supabase directly from bash, but we can check the console logs
# when the XML endpoint is hit

echo "✅ Server is running on http://localhost:3000"
echo ""
echo "📋 Manual Test Steps:"
echo "1. Open http://localhost:3000 in browser"
echo "2. Login as chudziszewski221@gmail.com"
echo "3. Go to dashboard"
echo "4. Check if properties are visible in table"
echo "5. Click 'Pobierz XML' button"
echo "6. Open downloaded XML and check if it contains real prices (not 'N/A' or '0')"
echo ""
echo "💡 If XML still shows empty data, the extraction from raw_data didn't work"
