#!/bin/bash

# Test script for Cost Guardrails functionality
# This script tests the guardrails API endpoints

set -euo pipefail

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
LOG_FILE="/tmp/guardrails-test-$(date '+%Y%m%d-%H%M%S').log"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
    ((TESTS_PASSED++))
    ((TOTAL_TESTS++))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
    ((TESTS_FAILED++))
    ((TOTAL_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Helper functions
check_health() {
    log_info "Checking system health..."
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
    if [ "$response" = "200" ]; then
        log_success "System health check passed"
        return 0
    else
        log_error "System health check failed (HTTP $response)"
        return 1
    fi
}

make_api_request() {
    local method="$1"
    local endpoint="$2"
    local data="${3:-}"
    local expected_status="${4:-200}"
    
    local curl_cmd="curl -s -w '%{http_code}' -X $method"
    
    if [ -n "$AUTH_TOKEN" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $AUTH_TOKEN'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$BASE_URL$endpoint'"
    
    local response=$(eval $curl_cmd)
    local status_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$status_code" = "$expected_status" ]; then
        log_success "API request passed: $method $endpoint (HTTP $status_code)"
        echo "$body"
        return 0
    else
        log_error "API request failed: $method $endpoint (HTTP $status_code, expected $expected_status)"
        echo "$body"
        return 1
    fi
}

# Test functions
test_dashboard_endpoints() {
    log_info "=== Testing Dashboard Endpoints ==="
    
    # Test dashboard data
    log_info "Testing dashboard data endpoint..."
    local dashboard_response=$(make_api_request "GET" "/guardrails/dashboard")
    
    if echo "$dashboard_response" | grep -q "totalTenants\|totalLicenses"; then
        log_success "Dashboard data endpoint working"
    else
        log_error "Dashboard data endpoint failed"
        return 1
    fi
    
    # Test seat usage metrics
    log_info "Testing seat usage metrics endpoint..."
    local metrics_response=$(make_api_request "GET" "/guardrails/seat-usage")
    
    if echo "$metrics_response" | grep -q "tenantId\|usagePercentage"; then
        log_success "Seat usage metrics endpoint working"
    else
        log_error "Seat usage metrics endpoint failed"
        return 1
    fi
    
    # Test summary metrics
    log_info "Testing summary metrics endpoint..."
    local summary_response=$(make_api_request "GET" "/guardrails/metrics/summary")
    
    if echo "$summary_response" | grep -q "summary\|topTenants"; then
        log_success "Summary metrics endpoint working"
    else
        log_error "Summary metrics endpoint failed"
        return 1
    fi
}

test_alert_endpoints() {
    log_info "=== Testing Alert Endpoints ==="
    
    # Test guardrail alerts
    log_info "Testing guardrail alerts endpoint..."
    local alerts_response=$(make_api_request "GET" "/guardrails/alerts")
    
    if echo "$alerts_response" | grep -q "tenantId\|alertType"; then
        log_success "Guardrail alerts endpoint working"
    else
        log_warning "Guardrail alerts endpoint returned empty or unexpected response"
    fi
    
    # Test alert history
    log_info "Testing alert history endpoint..."
    local history_response=$(make_api_request "GET" "/guardrails/alerts/history")
    
    if echo "$history_response" | grep -q "period\|totalAlerts"; then
        log_success "Alert history endpoint working"
    else
        log_error "Alert history endpoint failed"
        return 1
    fi
}

test_config_endpoints() {
    log_info "=== Testing Configuration Endpoints ==="
    
    # Test get configuration
    log_info "Testing get configuration endpoint..."
    local config_response=$(make_api_request "GET" "/guardrails/config")
    
    if echo "$config_response" | grep -q "warningThreshold\|criticalThreshold"; then
        log_success "Get configuration endpoint working"
    else
        log_error "Get configuration endpoint failed"
        return 1
    fi
    
    # Test update configuration
    log_info "Testing update configuration endpoint..."
    local update_data='{"warningThreshold": 80, "criticalThreshold": 90}'
    local update_response=$(make_api_request "POST" "/guardrails/config" "$update_data")
    
    if echo "$update_response" | grep -q "success\|updated"; then
        log_success "Update configuration endpoint working"
    else
        log_error "Update configuration endpoint failed"
        return 1
    fi
}

test_report_endpoints() {
    log_info "=== Testing Report Endpoints ==="
    
    # Test weekly report generation
    log_info "Testing weekly report generation endpoint..."
    local report_response=$(make_api_request "GET" "/guardrails/weekly-report")
    
    if echo "$report_response" | grep -q "reportDate\|totalTenants"; then
        log_success "Weekly report generation endpoint working"
    else
        log_error "Weekly report generation endpoint failed"
        return 1
    fi
    
    # Test cost analysis
    log_info "Testing cost analysis endpoint..."
    local cost_response=$(make_api_request "GET" "/guardrails/cost-analysis")
    
    if echo "$cost_response" | grep -q "summary\|tenantBreakdown"; then
        log_success "Cost analysis endpoint working"
    else
        log_error "Cost analysis endpoint failed"
        return 1
    fi
}

test_dashboard_card() {
    log_info "=== Testing Dashboard Card Endpoint ==="
    
    # Get a tenant ID from seat usage metrics
    log_info "Getting tenant ID for dashboard card test..."
    local metrics_response=$(make_api_request "GET" "/guardrails/seat-usage")
    
    # Extract first tenant ID (this is a simplified approach)
    local tenant_id=$(echo "$metrics_response" | grep -o '"tenantId":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$tenant_id" ]; then
        log_info "Testing dashboard card for tenant: $tenant_id"
        local card_response=$(make_api_request "GET" "/guardrails/dashboard/card/$tenant_id")
        
        if echo "$card_response" | grep -q "tenantName\|usagePercentage"; then
            log_success "Dashboard card endpoint working"
        else
            log_error "Dashboard card endpoint failed"
            return 1
        fi
    else
        log_warning "No tenant ID found for dashboard card test"
    fi
}

test_trends_endpoint() {
    log_info "=== Testing Trends Endpoint ==="
    
    # Get a tenant ID from seat usage metrics
    local metrics_response=$(make_api_request "GET" "/guardrails/seat-usage")
    local tenant_id=$(echo "$metrics_response" | grep -o '"tenantId":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$tenant_id" ]; then
        log_info "Testing trends for tenant: $tenant_id"
        local trends_response=$(make_api_request "GET" "/guardrails/trends/$tenant_id?days=30")
        
        if echo "$trends_response" | grep -q "date\|usagePercentage"; then
            log_success "Trends endpoint working"
        else
            log_error "Trends endpoint failed"
            return 1
        fi
    else
        log_warning "No tenant ID found for trends test"
    fi
}

# Main test execution
main() {
    log_info "🚀 Starting Cost Guardrails Test"
    log_info "Base URL: $BASE_URL"
    log_info "Log file: $LOG_FILE"
    
    # Check system health first
    check_health
    
    # Run test suite
    test_dashboard_endpoints
    test_alert_endpoints
    test_config_endpoints
    test_report_endpoints
    test_dashboard_card
    test_trends_endpoint
    
    # Print test summary
    log_info "=== Guardrails Test Summary ==="
    log_info "Total tests: $TOTAL_TESTS"
    log_info "Tests passed: $TESTS_PASSED"
    log_info "Tests failed: $TESTS_FAILED"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        log_success "🎉 All guardrails tests passed! Cost guardrails are working correctly."
        exit 0
    else
        log_error "❌ Some guardrails tests failed. Check the implementation."
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    "dashboard")
        check_health
        test_dashboard_endpoints
        ;;
    "alerts")
        check_health
        test_alert_endpoints
        ;;
    "config")
        check_health
        test_config_endpoints
        ;;
    "reports")
        check_health
        test_report_endpoints
        ;;
    "card")
        check_health
        test_dashboard_card
        ;;
    "trends")
        check_health
        test_trends_endpoint
        ;;
    *)
        main
        ;;
esac
