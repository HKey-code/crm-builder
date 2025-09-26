#!/bin/bash

# CRM License System - Chaos Test Script
# This script performs chaos engineering tests to validate license guard behavior and rollback mechanisms

set -euo pipefail

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
TEST_TENANT_ID="${TEST_TENANT_ID:-test-tenant-123}"
TEST_USER_ID="${TEST_USER_ID:-test-user-456}"
ADMIN_USER_ID="${ADMIN_USER_ID:-admin-789}"
LOG_FILE="/tmp/chaos-test-$(date '+%Y%m%d-%H%M%S').log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
    ((TESTS_FAILED++))
    ((TOTAL_TESTS++))
}

log_chaos() {
    echo -e "${PURPLE}[CHAOS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_rollback() {
    echo -e "${CYAN}[ROLLBACK]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
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

get_auth_token() {
    if [ -z "$AUTH_TOKEN" ]; then
        log_info "Getting authentication token..."
        # This would typically authenticate and get a token
        # For now, we'll use a mock token
        AUTH_TOKEN="mock-auth-token-$(date +%s)"
        log_success "Authentication token obtained"
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
test_initial_state() {
    log_info "=== Testing Initial State ==="
    
    # Test 1: Check system health
    check_health
    
    # Test 2: Verify tenant license is active
    log_info "Checking tenant license status..."
    local license_status=$(make_api_request "GET" "/licenses/validate?userId=$TEST_USER_ID&tenantId=$TEST_TENANT_ID&licenseType=SMART_SERVICE")
    
    if echo "$license_status" | grep -q "active\|valid"; then
        log_success "Tenant license is active"
    else
        log_error "Tenant license is not active"
        return 1
    fi
    
    # Test 3: Verify user seat is active
    log_info "Checking user seat status..."
    local seat_status=$(make_api_request "GET" "/licenses/validate?userId=$TEST_USER_ID&tenantId=$TEST_TENANT_ID&licenseType=SMART_SALES")
    
    if echo "$seat_status" | grep -q "active\|valid"; then
        log_success "User seat is active"
    else
        log_error "User seat is not active"
        return 1
    fi
    
    # Test 4: Test service endpoint access
    log_info "Testing service endpoint access..."
    local service_response=$(make_api_request "GET" "/service/health")
    
    if echo "$service_response" | grep -q "healthy\|success"; then
        log_success "Service endpoint access granted"
    else
        log_error "Service endpoint access denied"
        return 1
    fi
    
    # Test 5: Test sales endpoint access
    log_info "Testing sales endpoint access..."
    local sales_response=$(make_api_request "GET" "/sales/health")
    
    if echo "$sales_response" | grep -q "healthy\|success"; then
        log_success "Sales endpoint access granted"
    else
        log_error "Sales endpoint access denied"
        return 1
    fi
}

test_tenant_license_deactivation() {
    log_info "=== Testing Tenant License Deactivation ==="
    
    log_chaos "Deactivating tenant license for $TEST_TENANT_ID..."
    
    # Deactivate tenant license
    local deactivation_data="{\"tenantId\":\"$TEST_TENANT_ID\",\"licenseType\":\"SMART_SERVICE\",\"status\":\"inactive\",\"reason\":\"Chaos test deactivation\"}"
    local deactivation_response=$(make_api_request "POST" "/licenses/deactivate" "$deactivation_data")
    
    if echo "$deactivation_response" | grep -q "success\|deactivated"; then
        log_success "Tenant license deactivated successfully"
    else
        log_error "Failed to deactivate tenant license"
        return 1
    fi
    
    # Test guard behavior after deactivation
    log_info "Testing guard behavior after license deactivation..."
    
    # Test service endpoint (should be denied)
    local service_response=$(make_api_request "GET" "/service/health" "" "403")
    
    if [ $? -eq 0 ]; then
        log_success "Service endpoint correctly denied after license deactivation"
    else
        log_error "Service endpoint incorrectly allowed after license deactivation"
        return 1
    fi
    
    # Test sales endpoint (should still work if different license)
    local sales_response=$(make_api_request "GET" "/sales/health")
    
    if echo "$sales_response" | grep -q "healthy\|success"; then
        log_success "Sales endpoint still accessible (different license)"
    else
        log_warning "Sales endpoint also affected by service license deactivation"
    fi
    
    # Verify license validation fails
    log_info "Verifying license validation fails..."
    local license_status=$(make_api_request "GET" "/licenses/validate?userId=$TEST_USER_ID&tenantId=$TEST_TENANT_ID&licenseType=SMART_SERVICE" "" "403")
    
    if [ $? -eq 0 ]; then
        log_success "License validation correctly fails after deactivation"
    else
        log_error "License validation incorrectly succeeds after deactivation"
        return 1
    fi
}

test_seat_expiration() {
    log_info "=== Testing Seat Expiration ==="
    
    log_chaos "Expiring user seat for $TEST_USER_ID..."
    
    # Expire user seat
    local expiration_data="{\"userId\":\"$TEST_USER_ID\",\"tenantId\":\"$TEST_TENANT_ID\",\"licenseType\":\"SMART_SALES\",\"expiresAt\":\"$(date -d '1 hour ago' -Iseconds)\",\"reason\":\"Chaos test expiration\"}"
    local expiration_response=$(make_api_request "POST" "/licenses/expire-seat" "$expiration_data")
    
    if echo "$expiration_response" | grep -q "success\|expired"; then
        log_success "User seat expired successfully"
    else
        log_error "Failed to expire user seat"
        return 1
    fi
    
    # Test guard behavior after seat expiration
    log_info "Testing guard behavior after seat expiration..."
    
    # Test sales endpoint (should be denied)
    local sales_response=$(make_api_request "GET" "/sales/health" "" "403")
    
    if [ $? -eq 0 ]; then
        log_success "Sales endpoint correctly denied after seat expiration"
    else
        log_error "Sales endpoint incorrectly allowed after seat expiration"
        return 1
    fi
    
    # Test service endpoint (should still work if different license)
    local service_response=$(make_api_request "GET" "/service/health")
    
    if echo "$service_response" | grep -q "healthy\|success"; then
        log_success "Service endpoint still accessible (different license)"
    else
        log_warning "Service endpoint also affected by sales seat expiration"
    fi
    
    # Verify seat validation fails
    log_info "Verifying seat validation fails..."
    local seat_status=$(make_api_request "GET" "/licenses/validate?userId=$TEST_USER_ID&tenantId=$TEST_TENANT_ID&licenseType=SMART_SALES" "" "403")
    
    if [ $? -eq 0 ]; then
        log_success "Seat validation correctly fails after expiration"
    else
        log_error "Seat validation incorrectly succeeds after expiration"
        return 1
    fi
}

test_system_user_bypass() {
    log_info "=== Testing System User Bypass ==="
    
    log_chaos "Testing system user bypass with deactivated license..."
    
    # Test system user access (should bypass license checks)
    local system_user_id="system-user-999"
    local system_response=$(make_api_request "GET" "/service/health?userId=$system_user_id")
    
    if echo "$system_response" | grep -q "healthy\|success"; then
        log_success "System user correctly bypasses license checks"
    else
        log_error "System user incorrectly blocked by license checks"
        return 1
    fi
    
    # Test system user with expired seat
    local system_sales_response=$(make_api_request "GET" "/sales/health?userId=$system_user_id")
    
    if echo "$system_sales_response" | grep -q "healthy\|success"; then
        log_success "System user correctly bypasses seat expiration"
    else
        log_error "System user incorrectly blocked by seat expiration"
        return 1
    fi
}

test_rollback_mechanisms() {
    log_info "=== Testing Rollback Mechanisms ==="
    
    log_rollback "Rolling back tenant license deactivation..."
    
    # Reactivate tenant license
    local reactivation_data="{\"tenantId\":\"$TEST_TENANT_ID\",\"licenseType\":\"SMART_SERVICE\",\"status\":\"active\",\"reason\":\"Chaos test rollback\"}"
    local reactivation_response=$(make_api_request "POST" "/licenses/activate" "$reactivation_data")
    
    if echo "$reactivation_response" | grep -q "success\|activated"; then
        log_success "Tenant license reactivated successfully"
    else
        log_error "Failed to reactivate tenant license"
        return 1
    fi
    
    # Test service endpoint after rollback
    log_info "Testing service endpoint after rollback..."
    local service_response=$(make_api_request "GET" "/service/health")
    
    if echo "$service_response" | grep -q "healthy\|success"; then
        log_success "Service endpoint correctly restored after rollback"
    else
        log_error "Service endpoint incorrectly blocked after rollback"
        return 1
    fi
    
    log_rollback "Rolling back seat expiration..."
    
    # Renew user seat
    local renewal_data="{\"userId\":\"$TEST_USER_ID\",\"tenantId\":\"$TEST_TENANT_ID\",\"licenseType\":\"SMART_SALES\",\"expiresAt\":\"$(date -d '1 year' -Iseconds)\",\"reason\":\"Chaos test rollback\"}"
    local renewal_response=$(make_api_request "POST" "/licenses/renew-seat" "$renewal_data")
    
    if echo "$renewal_response" | grep -q "success\|renewed"; then
        log_success "User seat renewed successfully"
    else
        log_error "Failed to renew user seat"
        return 1
    fi
    
    # Test sales endpoint after rollback
    log_info "Testing sales endpoint after rollback..."
    local sales_response=$(make_api_request "GET" "/sales/health")
    
    if echo "$sales_response" | grep -q "healthy\|success"; then
        log_success "Sales endpoint correctly restored after rollback"
    else
        log_error "Sales endpoint incorrectly blocked after rollback"
        return 1
    fi
}

test_edge_cases() {
    log_info "=== Testing Edge Cases ==="
    
    # Test 1: Invalid tenant ID
    log_chaos "Testing with invalid tenant ID..."
    local invalid_tenant_response=$(make_api_request "GET" "/licenses/validate?userId=$TEST_USER_ID&tenantId=invalid-tenant&licenseType=SMART_SERVICE" "" "403")
    
    if [ $? -eq 0 ]; then
        log_success "Correctly denied access with invalid tenant ID"
    else
        log_error "Incorrectly allowed access with invalid tenant ID"
        return 1
    fi
    
    # Test 2: Invalid user ID
    log_chaos "Testing with invalid user ID..."
    local invalid_user_response=$(make_api_request "GET" "/licenses/validate?userId=invalid-user&tenantId=$TEST_TENANT_ID&licenseType=SMART_SERVICE" "" "403")
    
    if [ $? -eq 0 ]; then
        log_success "Correctly denied access with invalid user ID"
    else
        log_error "Incorrectly allowed access with invalid user ID"
        return 1
    fi
    
    # Test 3: Expired license with valid seat
    log_chaos "Testing expired license with valid seat..."
    local expired_license_data="{\"tenantId\":\"$TEST_TENANT_ID\",\"licenseType\":\"SMART_SERVICE\",\"expiresAt\":\"$(date -d '1 hour ago' -Iseconds)\",\"reason\":\"Chaos test edge case\"}"
    make_api_request "POST" "/licenses/expire-license" "$expired_license_data" > /dev/null
    
    local expired_license_response=$(make_api_request "GET" "/service/health" "" "403")
    
    if [ $? -eq 0 ]; then
        log_success "Correctly denied access with expired license"
    else
        log_error "Incorrectly allowed access with expired license"
        return 1
    fi
    
    # Rollback expired license
    local license_renewal_data="{\"tenantId\":\"$TEST_TENANT_ID\",\"licenseType\":\"SMART_SERVICE\",\"expiresAt\":\"$(date -d '1 year' -Iseconds)\",\"reason\":\"Chaos test edge case rollback\"}"
    make_api_request "POST" "/licenses/renew-license" "$license_renewal_data" > /dev/null
}

test_performance_under_chaos() {
    log_info "=== Testing Performance Under Chaos ==="
    
    # Test response times under normal conditions
    log_info "Testing response times under normal conditions..."
    local start_time=$(date +%s%N)
    make_api_request "GET" "/service/health" > /dev/null
    local end_time=$(date +%s%N)
    local normal_response_time=$(( (end_time - start_time) / 1000000 ))
    
    log_info "Normal response time: ${normal_response_time}ms"
    
    # Test response times under license deactivation
    log_chaos "Testing response times under license deactivation..."
    local deactivation_data="{\"tenantId\":\"$TEST_TENANT_ID\",\"licenseType\":\"SMART_SERVICE\",\"status\":\"inactive\",\"reason\":\"Performance test\"}"
    make_api_request "POST" "/licenses/deactivate" "$deactivation_data" > /dev/null
    
    start_time=$(date +%s%N)
    make_api_request "GET" "/service/health" "" "403" > /dev/null
    end_time=$(date +%s%N)
    local chaos_response_time=$(( (end_time - start_time) / 1000000 ))
    
    log_info "Chaos response time: ${chaos_response_time}ms"
    
    # Check if performance degradation is acceptable (within 50% of normal)
    local performance_ratio=$((chaos_response_time * 100 / normal_response_time))
    
    if [ $performance_ratio -le 150 ]; then
        log_success "Performance under chaos is acceptable (${performance_ratio}% of normal)"
    else
        log_warning "Performance under chaos is degraded (${performance_ratio}% of normal)"
    fi
    
    # Rollback for next tests
    local reactivation_data="{\"tenantId\":\"$TEST_TENANT_ID\",\"licenseType\":\"SMART_SERVICE\",\"status\":\"active\",\"reason\":\"Performance test rollback\"}"
    make_api_request "POST" "/licenses/activate" "$reactivation_data" > /dev/null
}

test_concurrent_chaos() {
    log_info "=== Testing Concurrent Chaos ==="
    
    log_chaos "Testing concurrent license deactivation and seat expiration..."
    
    # Start concurrent chaos operations
    local deactivation_data="{\"tenantId\":\"$TEST_TENANT_ID\",\"licenseType\":\"SMART_SERVICE\",\"status\":\"inactive\",\"reason\":\"Concurrent chaos test\"}"
    local expiration_data="{\"userId\":\"$TEST_USER_ID\",\"tenantId\":\"$TEST_TENANT_ID\",\"licenseType\":\"SMART_SALES\",\"expiresAt\":\"$(date -d '1 hour ago' -Iseconds)\",\"reason\":\"Concurrent chaos test\"}"
    
    # Run operations concurrently
    make_api_request "POST" "/licenses/deactivate" "$deactivation_data" &
    local deactivation_pid=$!
    
    make_api_request "POST" "/licenses/expire-seat" "$expiration_data" &
    local expiration_pid=$!
    
    # Wait for both operations to complete
    wait $deactivation_pid
    wait $expiration_pid
    
    log_success "Concurrent chaos operations completed"
    
    # Test system behavior under concurrent chaos
    log_info "Testing system behavior under concurrent chaos..."
    
    local service_response=$(make_api_request "GET" "/service/health" "" "403")
    local sales_response=$(make_api_request "GET" "/sales/health" "" "403")
    
    if [ $? -eq 0 ] && [ $? -eq 0 ]; then
        log_success "System correctly handles concurrent chaos"
    else
        log_error "System incorrectly handles concurrent chaos"
        return 1
    fi
    
    # Rollback concurrent chaos
    log_rollback "Rolling back concurrent chaos..."
    
    local reactivation_data="{\"tenantId\":\"$TEST_TENANT_ID\",\"licenseType\":\"SMART_SERVICE\",\"status\":\"active\",\"reason\":\"Concurrent chaos rollback\"}"
    local renewal_data="{\"userId\":\"$TEST_USER_ID\",\"tenantId\":\"$TEST_TENANT_ID\",\"licenseType\":\"SMART_SALES\",\"expiresAt\":\"$(date -d '1 year' -Iseconds)\",\"reason\":\"Concurrent chaos rollback\"}"
    
    make_api_request "POST" "/licenses/activate" "$reactivation_data" &
    make_api_request "POST" "/licenses/renew-seat" "$renewal_data" &
    
    wait
    
    log_success "Concurrent chaos rollback completed"
}

test_final_state() {
    log_info "=== Testing Final State ==="
    
    # Verify system is back to normal
    log_info "Verifying system is back to normal..."
    
    # Test 1: Check system health
    check_health
    
    # Test 2: Verify tenant license is active
    local license_status=$(make_api_request "GET" "/licenses/validate?userId=$TEST_USER_ID&tenantId=$TEST_TENANT_ID&licenseType=SMART_SERVICE")
    
    if echo "$license_status" | grep -q "active\|valid"; then
        log_success "Tenant license is active in final state"
    else
        log_error "Tenant license is not active in final state"
        return 1
    fi
    
    # Test 3: Verify user seat is active
    local seat_status=$(make_api_request "GET" "/licenses/validate?userId=$TEST_USER_ID&tenantId=$TEST_TENANT_ID&licenseType=SMART_SALES")
    
    if echo "$seat_status" | grep -q "active\|valid"; then
        log_success "User seat is active in final state"
    else
        log_error "User seat is not active in final state"
        return 1
    fi
    
    # Test 4: Test service endpoint access
    local service_response=$(make_api_request "GET" "/service/health")
    
    if echo "$service_response" | grep -q "healthy\|success"; then
        log_success "Service endpoint access restored in final state"
    else
        log_error "Service endpoint access not restored in final state"
        return 1
    fi
    
    # Test 5: Test sales endpoint access
    local sales_response=$(make_api_request "GET" "/sales/health")
    
    if echo "$sales_response" | grep -q "healthy\|success"; then
        log_success "Sales endpoint access restored in final state"
    else
        log_error "Sales endpoint access not restored in final state"
        return 1
    fi
}

# Main test execution
main() {
    log_info "🚀 Starting CRM License System Chaos Test"
    log_info "Base URL: $BASE_URL"
    log_info "Test Tenant ID: $TEST_TENANT_ID"
    log_info "Test User ID: $TEST_USER_ID"
    log_info "Log file: $LOG_FILE"
    
    # Get authentication token
    get_auth_token
    
    # Run test suite
    test_initial_state
    test_tenant_license_deactivation
    test_seat_expiration
    test_system_user_bypass
    test_rollback_mechanisms
    test_edge_cases
    test_performance_under_chaos
    test_concurrent_chaos
    test_final_state
    
    # Print test summary
    log_info "=== Chaos Test Summary ==="
    log_info "Total tests: $TOTAL_TESTS"
    log_info "Tests passed: $TESTS_PASSED"
    log_info "Tests failed: $TESTS_FAILED"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        log_success "🎉 All chaos tests passed! System is resilient."
        exit 0
    else
        log_error "❌ Some chaos tests failed. System needs attention."
        exit 1
    fi
}

# Handle command line arguments
case "${1:-}" in
    "health")
        check_health
        ;;
    "initial")
        get_auth_token
        test_initial_state
        ;;
    "deactivation")
        get_auth_token
        test_tenant_license_deactivation
        ;;
    "expiration")
        get_auth_token
        test_seat_expiration
        ;;
    "rollback")
        get_auth_token
        test_rollback_mechanisms
        ;;
    "performance")
        get_auth_token
        test_performance_under_chaos
        ;;
    "concurrent")
        get_auth_token
        test_concurrent_chaos
        ;;
    "final")
        get_auth_token
        test_final_state
        ;;
    *)
        main
        ;;
esac
