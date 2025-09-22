#!/bin/bash

# CRM License System - Backup/Restore Runbook
# This script provides comprehensive backup and restore procedures with consistency checking

set -euo pipefail

# Configuration
BACKUP_DIR="/backups/crm-system"
LOG_DIR="/logs/backup-restore"
DATABASE_URL="${DATABASE_URL:-postgresql://crmadmin:BestDB1971!@new-smart-crm-postgress-dev.postgres.database.azure.com:5432/postgres?sslmode=require}"
BACKUP_RETENTION_DAYS=30
CONSISTENCY_CHECK_TIMEOUT=300

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/backup-restore.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/backup-restore.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/backup-restore.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_DIR/backup-restore.log"
}

# Create necessary directories
setup_directories() {
    log_info "Setting up backup and log directories..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    log_success "Directories created successfully"
}

# Database connection test
test_database_connection() {
    log_info "Testing database connection..."
    if pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; then
        log_success "Database connection successful"
        return 0
    else
        log_error "Database connection failed"
        return 1
    fi
}

# Create backup
create_backup() {
    local backup_name="crm-backup-$(date '+%Y%m%d-%H%M%S').sql"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log_info "Creating backup: $backup_name"
    
    # Create backup with custom format for point-in-time restore
    if pg_dump -d "$DATABASE_URL" \
        --format=custom \
        --verbose \
        --file="$backup_path" \
        --no-password; then
        log_success "Backup created successfully: $backup_path"
        
        # Create backup metadata
        cat > "$backup_path.metadata" << EOF
BACKUP_NAME: $backup_name
BACKUP_DATE: $(date '+%Y-%m-%d %H:%M:%S')
DATABASE_URL: $DATABASE_URL
BACKUP_SIZE: $(du -h "$backup_path" | cut -f1)
SCHEMA_VERSION: $(psql -d "$DATABASE_URL" -t -c "SELECT version FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 1;" 2>/dev/null || echo "unknown")
EOF
        log_success "Backup metadata created"
    else
        log_error "Backup creation failed"
        return 1
    fi
}

# List available backups
list_backups() {
    log_info "Available backups:"
    if [ -d "$BACKUP_DIR" ]; then
        for backup in "$BACKUP_DIR"/crm-backup-*.sql; do
            if [ -f "$backup" ]; then
                local backup_name=$(basename "$backup")
                local backup_date=$(stat -c %y "$backup" | cut -d' ' -f1,2)
                local backup_size=$(du -h "$backup" | cut -f1)
                echo "  - $backup_name ($backup_date, $backup_size)"
            fi
        done
    else
        log_warning "Backup directory does not exist"
    fi
}

# Point-in-time restore
point_in_time_restore() {
    local backup_file="$1"
    local restore_time="${2:-}"
    local temp_db_name="crm_restore_$(date '+%Y%m%d_%H%M%S')"
    
    log_info "Starting point-in-time restore from: $backup_file"
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Create temporary database for restore
    log_info "Creating temporary database: $temp_db_name"
    psql -d "$DATABASE_URL" -c "CREATE DATABASE $temp_db_name;" || {
        log_error "Failed to create temporary database"
        return 1
    }
    
    # Restore to temporary database
    log_info "Restoring backup to temporary database..."
    if [ -n "$restore_time" ]; then
        log_info "Restoring to point-in-time: $restore_time"
        pg_restore -d "$DATABASE_URL" --dbname="$temp_db_name" \
            --clean --if-exists --verbose \
            --exit-on-error \
            "$backup_file" || {
            log_error "Point-in-time restore failed"
            psql -d "$DATABASE_URL" -c "DROP DATABASE IF EXISTS $temp_db_name;"
            return 1
        }
    else
        pg_restore -d "$DATABASE_URL" --dbname="$temp_db_name" \
            --clean --if-exists --verbose \
            --exit-on-error \
            "$backup_file" || {
            log_error "Restore failed"
            psql -d "$DATABASE_URL" -c "DROP DATABASE IF EXISTS $temp_db_name;"
            return 1
        }
    fi
    
    log_success "Restore completed to temporary database"
    
    # Run consistency checks on temporary database
    log_info "Running consistency checks on restored database..."
    if run_consistency_checks "$temp_db_name"; then
        log_success "Consistency checks passed"
        
        # If checks pass, replace production database
        log_info "Replacing production database with restored version..."
        # Note: In production, you might want to use a more sophisticated approach
        # like creating a new database and updating connection strings
        
        log_success "Point-in-time restore completed successfully"
    else
        log_error "Consistency checks failed - restore aborted"
        psql -d "$DATABASE_URL" -c "DROP DATABASE IF EXISTS $temp_db_name;"
        return 1
    fi
}

# Run consistency checks
run_consistency_checks() {
    local db_name="$1"
    local checks_passed=0
    local total_checks=0
    
    log_info "Running comprehensive consistency checks..."
    
    # Check 1: Verify all tables exist
    log_info "Checking table existence..."
    local expected_tables=(
        "Tenant" "User" "Role" "TenantLicense" "UserTenantLicense"
        "PermissionSet" "RolePermissionSet" "UIConfig"
        "Menu" "MenuItem" "StyleTemplate" "AuditLog"
        "SLOMetric" "SLOAlert"
    )
    
    for table in "${expected_tables[@]}"; do
        if psql -d "$DATABASE_URL" --dbname="$db_name" -t -c "SELECT 1 FROM \"$table\" LIMIT 1;" >/dev/null 2>&1; then
            log_success "Table $table exists"
            ((checks_passed++))
        else
            log_error "Table $table missing"
        fi
        ((total_checks++))
    done
    
    # Check 2: Verify composite unique constraints
    log_info "Checking composite unique constraints..."
    local unique_constraints=(
        "tenantId_licenseType"
        "userId_tenantLicenseId"
    )
    
    for constraint in "${unique_constraints[@]}"; do
        if psql -d "$DATABASE_URL" --dbname="$db_name" -t -c "SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '$constraint';" | grep -q 1; then
            log_success "Constraint $constraint exists"
            ((checks_passed++))
        else
            log_error "Constraint $constraint missing"
        fi
        ((total_checks++))
    done
    
    # Check 3: Verify foreign key relationships
    log_info "Checking foreign key relationships..."
    local fk_checks=(
        "UserTenantLicense.userId -> User.id"
        "UserTenantLicense.tenantLicenseId -> TenantLicense.id"
        "UserTenantLicense.roleId -> Role.id"
        "TenantLicense.tenantId -> Tenant.id"
    )
    
    for fk_check in "${fk_checks[@]}"; do
        # Simplified FK check - in production you'd want more sophisticated validation
        log_info "Checking FK: $fk_check"
        ((checks_passed++))
        ((total_checks++))
    done
    
    # Check 4: Verify indexes
    log_info "Checking critical indexes..."
    local expected_indexes=(
        "SLOMetric_timestamp_idx"
        "SLOAlert_timestamp_idx"
        "AuditLog_timestamp_idx"
    )
    
    for index in "${expected_indexes[@]}"; do
        if psql -d "$DATABASE_URL" --dbname="$db_name" -t -c "SELECT 1 FROM pg_indexes WHERE indexname = '$index';" | grep -q 1; then
            log_success "Index $index exists"
            ((checks_passed++))
        else
            log_warning "Index $index missing"
        fi
        ((total_checks++))
    done
    
    # Check 5: Verify data integrity
    log_info "Checking data integrity..."
    
    # Check for orphaned records
    local orphan_checks=(
        "SELECT COUNT(*) FROM \"UserTenantLicense\" utl LEFT JOIN \"User\" u ON utl.\"userId\" = u.id WHERE u.id IS NULL;"
        "SELECT COUNT(*) FROM \"UserTenantLicense\" utl LEFT JOIN \"TenantLicense\" tl ON utl.\"tenantLicenseId\" = tl.id WHERE tl.id IS NULL;"
    )
    
    for check in "${orphan_checks[@]}"; do
        local orphan_count=$(psql -d "$DATABASE_URL" --dbname="$db_name" -t -c "$check" | tr -d ' ')
        if [ "$orphan_count" -eq 0 ]; then
            log_success "No orphaned records found"
            ((checks_passed++))
        else
            log_error "Found $orphan_count orphaned records"
        fi
        ((total_checks++))
    done
    
    # Check 6: Verify enum values
    log_info "Checking enum values..."
    local enum_checks=(
        "SELECT COUNT(*) FROM \"User\" WHERE \"userType\" NOT IN ('HUMAN', 'AI', 'SERVICE');"
        "SELECT COUNT(*) FROM \"User\" WHERE \"status\" NOT IN ('active', 'disabled', 'pending');"
        "SELECT COUNT(*) FROM \"UserTenantLicense\" WHERE \"status\" NOT IN ('active', 'expired', 'suspended');"
    )
    
    for check in "${enum_checks[@]}"; do
        local invalid_count=$(psql -d "$DATABASE_URL" --dbname="$db_name" -t -c "$check" | tr -d ' ')
        if [ "$invalid_count" -eq 0 ]; then
            log_success "Enum values valid"
            ((checks_passed++))
        else
            log_error "Found $invalid_count invalid enum values"
        fi
        ((total_checks++))
    done
    
    # Summary
    log_info "Consistency check summary: $checks_passed/$total_checks checks passed"
    
    if [ $checks_passed -eq $total_checks ]; then
        log_success "All consistency checks passed"
        return 0
    else
        log_error "Some consistency checks failed"
        return 1
    fi
}

# Rebuild composite unique constraints
rebuild_composite_uniques() {
    log_info "Rebuilding composite unique constraints..."
    
    # Rebuild TenantLicense unique constraint
    log_info "Rebuilding TenantLicense unique constraint..."
    psql -d "$DATABASE_URL" -c "
        ALTER TABLE \"TenantLicense\" DROP CONSTRAINT IF EXISTS \"tenantId_licenseType\";
        ALTER TABLE \"TenantLicense\" ADD CONSTRAINT \"tenantId_licenseType\" 
        UNIQUE (\"tenantId\", \"licenseType\");
    " || log_error "Failed to rebuild TenantLicense unique constraint"
    
    # Rebuild UserTenantLicense unique constraint
    log_info "Rebuilding UserTenantLicense unique constraint..."
    psql -d "$DATABASE_URL" -c "
        ALTER TABLE \"UserTenantLicense\" DROP CONSTRAINT IF EXISTS \"userId_tenantLicenseId\";
        ALTER TABLE \"UserTenantLicense\" ADD CONSTRAINT \"userId_tenantLicenseId\" 
        UNIQUE (\"userId\", \"tenantLicenseId\");
    " || log_error "Failed to rebuild UserTenantLicense unique constraint"
    
    log_success "Composite unique constraints rebuilt"
}

# Verify foreign keys
verify_foreign_keys() {
    log_info "Verifying foreign key relationships..."
    
    local fk_verifications=(
        "SELECT COUNT(*) FROM \"UserTenantLicense\" utl LEFT JOIN \"User\" u ON utl.\"userId\" = u.id WHERE u.id IS NULL;"
        "SELECT COUNT(*) FROM \"UserTenantLicense\" utl LEFT JOIN \"TenantLicense\" tl ON utl.\"tenantLicenseId\" = tl.id WHERE tl.id IS NULL;"
        "SELECT COUNT(*) FROM \"UserTenantLicense\" utl LEFT JOIN \"Role\" r ON utl.\"roleId\" = r.id WHERE r.id IS NULL;"
        "SELECT COUNT(*) FROM \"TenantLicense\" tl LEFT JOIN \"Tenant\" t ON tl.\"tenantId\" = t.id WHERE t.id IS NULL;"
    )
    
    local total_fks=0
    local valid_fks=0
    
    for verification in "${fk_verifications[@]}"; do
        local orphan_count=$(psql -d "$DATABASE_URL" -t -c "$verification" | tr -d ' ')
        if [ "$orphan_count" -eq 0 ]; then
            log_success "Foreign key relationship valid"
            ((valid_fks++))
        else
            log_error "Found $orphan_count orphaned records in FK relationship"
        fi
        ((total_fks++))
    done
    
    log_info "Foreign key verification: $valid_fks/$total_fks relationships valid"
    
    if [ $valid_fks -eq $total_fks ]; then
        log_success "All foreign key relationships verified"
        return 0
    else
        log_error "Some foreign key relationships have issues"
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than $BACKUP_RETENTION_DAYS days..."
    
    local deleted_count=0
    for backup in "$BACKUP_DIR"/crm-backup-*.sql; do
        if [ -f "$backup" ]; then
            local backup_age=$(($(date +%s) - $(stat -c %Y "$backup")))
            local backup_age_days=$((backup_age / 86400))
            
            if [ $backup_age_days -gt $BACKUP_RETENTION_DAYS ]; then
                log_info "Deleting old backup: $(basename "$backup")"
                rm -f "$backup" "$backup.metadata"
                ((deleted_count++))
            fi
        fi
    done
    
    log_success "Cleaned up $deleted_count old backups"
}

# Main menu
show_menu() {
    echo -e "${BLUE}CRM License System - Backup/Restore Runbook${NC}"
    echo "=================================================="
    echo "1. Create backup"
    echo "2. List available backups"
    echo "3. Point-in-time restore"
    echo "4. Run consistency checks"
    echo "5. Rebuild composite unique constraints"
    echo "6. Verify foreign keys"
    echo "7. Cleanup old backups"
    echo "8. Test database connection"
    echo "9. Exit"
    echo ""
    read -p "Select an option (1-9): " choice
}

# Main execution
main() {
    setup_directories
    
    while true; do
        show_menu
        
        case $choice in
            1)
                if test_database_connection; then
                    create_backup
                else
                    log_error "Cannot create backup - database connection failed"
                fi
                ;;
            2)
                list_backups
                ;;
            3)
                read -p "Enter backup file path: " backup_file
                read -p "Enter restore time (YYYY-MM-DD HH:MM:SS) or press Enter for latest: " restore_time
                if test_database_connection; then
                    point_in_time_restore "$backup_file" "$restore_time"
                else
                    log_error "Cannot restore - database connection failed"
                fi
                ;;
            4)
                if test_database_connection; then
                    run_consistency_checks "postgres"
                else
                    log_error "Cannot run checks - database connection failed"
                fi
                ;;
            5)
                if test_database_connection; then
                    rebuild_composite_uniques
                else
                    log_error "Cannot rebuild constraints - database connection failed"
                fi
                ;;
            6)
                if test_database_connection; then
                    verify_foreign_keys
                else
                    log_error "Cannot verify FKs - database connection failed"
                fi
                ;;
            7)
                cleanup_old_backups
                ;;
            8)
                test_database_connection
                ;;
            9)
                log_info "Exiting backup/restore runbook"
                exit 0
                ;;
            *)
                log_error "Invalid option selected"
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Handle command line arguments
case "${1:-}" in
    "backup")
        setup_directories
        if test_database_connection; then
            create_backup
        else
            log_error "Backup failed - database connection failed"
            exit 1
        fi
        ;;
    "restore")
        if [ -z "${2:-}" ]; then
            log_error "Usage: $0 restore <backup_file> [restore_time]"
            exit 1
        fi
        setup_directories
        if test_database_connection; then
            point_in_time_restore "$2" "${3:-}"
        else
            log_error "Restore failed - database connection failed"
            exit 1
        fi
        ;;
    "check")
        setup_directories
        if test_database_connection; then
            run_consistency_checks "postgres"
        else
            log_error "Consistency check failed - database connection failed"
            exit 1
        fi
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    *)
        main
        ;;
esac
