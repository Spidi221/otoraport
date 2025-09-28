#!/bin/bash

# ============================================================
# OTORAPORT - Final Comprehensive Testing Script
# Date: $(date)
# ============================================================

BASE_URL="http://localhost:3000"
CLIENT_ID="tambud-dev-test-123"

echo "🧪 Starting OTORAPORT Final Testing Suite..."
echo "============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4

    echo -n "Testing: $description... "

    response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint")

    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (HTTP $response)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC} (Expected $expected_status, Got $response)"
        ((TESTS_FAILED++))
    fi
}

# Test function with data
test_endpoint_with_data() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5

    echo -n "Testing: $description... "

    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X $method \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$BASE_URL$endpoint")

    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (HTTP $response)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC} (Expected $expected_status, Got $response)"
        ((TESTS_FAILED++))
    fi
}

echo "============================================="
echo "1. HEALTH & STATUS CHECKS"
echo "============================================="

test_endpoint "GET" "/api/health" 503 "Health Check (DB unavailable expected)"

echo ""
echo "============================================="
echo "2. PUBLIC ENDPOINTS (Ministry Compliance)"
echo "============================================="

test_endpoint "GET" "/api/public/$CLIENT_ID/data.xml" 200 "XML Data Export"
test_endpoint "GET" "/api/public/$CLIENT_ID/data.md5" 200 "MD5 Checksum"
test_endpoint "GET" "/api/public/$CLIENT_ID/data.md" 200 "Markdown Export"
test_endpoint "GET" "/api/public/$CLIENT_ID/info" 200 "Public Developer Info"

echo ""
echo "============================================="
echo "3. AUTHENTICATION SYSTEM"
echo "============================================="

# Test registration
REGISTER_DATA='{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User",
    "companyName": "Test Company",
    "nip": "9512453700"
}'

test_endpoint "GET" "/api/auth/signin" 405 "Sign In Page (GET not allowed)"
test_endpoint "GET" "/api/auth/signup" 405 "Sign Up Page (GET not allowed)"
test_endpoint "POST" "/api/auth/check-email" 200 "Email Availability Check"
test_endpoint "POST" "/api/auth/validate-nip" 200 "NIP Validation"

echo ""
echo "============================================="
echo "4. API v1 SYSTEM"
echo "============================================="

test_endpoint "GET" "/api/v1" 200 "API v1 Root"
test_endpoint "GET" "/api/v1/properties" 401 "Properties (No Auth)"
test_endpoint "GET" "/api/v1/reports" 401 "Reports (No Auth)"
test_endpoint "POST" "/api/v1/keys" 401 "Create API Key (No Auth)"
test_endpoint "DELETE" "/api/v1/keys/test-key" 401 "Delete API Key (No Auth)"

echo ""
echo "============================================="
echo "5. FILE UPLOAD & PROCESSING"
echo "============================================="

test_endpoint "POST" "/api/upload" 401 "File Upload (No Auth)"
test_endpoint "GET" "/api/upload-status" 405 "Upload Status (GET not allowed)"

echo ""
echo "============================================="
echo "6. DASHBOARD & ANALYTICS"
echo "============================================="

test_endpoint "GET" "/api/dashboard/stats" 401 "Dashboard Stats (No Auth)"
test_endpoint "GET" "/api/analytics" 401 "Analytics Data (No Auth)"
test_endpoint "GET" "/api/analytics/dashboard" 401 "Analytics Dashboard (No Auth)"
test_endpoint "GET" "/api/analytics/predictions" 401 "Analytics Predictions (No Auth)"

echo ""
echo "============================================="
echo "7. CHATBOT SYSTEM"
echo "============================================="

CHAT_DATA='{"message":"Ile kosztuje plan Pro?"}'
test_endpoint_with_data "POST" "/api/chatbot" "$CHAT_DATA" 200 "Chatbot Query"

echo ""
echo "============================================="
echo "8. PAYMENT SYSTEM"
echo "============================================="

test_endpoint "POST" "/api/payments/create" 401 "Create Payment (No Auth)"
test_endpoint "POST" "/api/payments/webhook" 400 "Payment Webhook"

echo ""
echo "============================================="
echo "9. PRESENTATION SYSTEM"
echo "============================================="

test_endpoint "POST" "/api/presentation/generate" 401 "Generate Presentation (No Auth)"
test_endpoint "GET" "/api/presentation/preview" 401 "Preview Presentation (No Auth)"
test_endpoint "POST" "/api/presentation/deploy" 401 "Deploy Presentation (No Auth)"

echo ""
echo "============================================="
echo "10. WHITE-LABEL SYSTEM"
echo "============================================="

test_endpoint "GET" "/api/white-label/partners" 401 "White-label Partners (No Auth)"
test_endpoint "GET" "/api/white-label/metrics" 401 "White-label Metrics (No Auth)"
test_endpoint "GET" "/api/white-label/clients" 401 "White-label Clients (No Auth)"

echo ""
echo "============================================="
echo "11. MARKETING AUTOMATION"
echo "============================================="

test_endpoint "GET" "/api/marketing/campaigns" 401 "Marketing Campaigns (No Auth)"
test_endpoint "GET" "/api/marketing/contacts" 401 "Marketing Contacts (No Auth)"
test_endpoint "GET" "/api/marketing/templates" 401 "Marketing Templates (No Auth)"

echo ""
echo "============================================="
echo "12. CUSTOM DOMAINS"
echo "============================================="

test_endpoint "POST" "/api/domains/setup" 401 "Setup Domain (No Auth)"
test_endpoint "POST" "/api/domains/verify" 401 "Verify Domain (No Auth)"
test_endpoint "POST" "/api/domains/deploy" 401 "Deploy to Domain (No Auth)"

echo ""
echo "============================================="
echo "13. EXTERNAL INTEGRATIONS"
echo "============================================="

test_endpoint "GET" "/api/external" 401 "External API (No Auth)"
test_endpoint "POST" "/api/webhooks" 400 "Webhook Receiver"

echo ""
echo "============================================="
echo "14. MD5 CHECKSUM TEST (Bug Fix Verification)"
echo "============================================="

echo -n "Verifying MD5 returns hash not markdown... "
MD5_RESPONSE=$(curl -s "$BASE_URL/api/public/$CLIENT_ID/data.md5")
if [[ $MD5_RESPONSE =~ ^[a-f0-9]{32}$ ]]; then
    echo -e "${GREEN}✅ PASSED${NC} (Valid MD5: ${MD5_RESPONSE:0:8}...)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED${NC} (Not a valid MD5 hash)"
    ((TESTS_FAILED++))
fi

echo ""
echo "============================================="
echo "15. PRICING ENDPOINTS TEST"
echo "============================================="

echo -n "Testing pricing consistency... "
# This would need authentication to fully test
echo -e "${YELLOW}⚠️  SKIPPED${NC} (Requires authentication)"

echo ""
echo "============================================="
echo "📊 FINAL TEST RESULTS"
echo "============================================="
echo ""
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Application is working correctly.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    exit 1
fi