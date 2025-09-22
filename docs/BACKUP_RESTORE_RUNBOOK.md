# Backup/Restore Runbook for CRM License System

This document provides comprehensive procedures for backing up and restoring the CRM License System database with point-in-time restore capabilities and post-restore consistency checking.

## Overview

The backup/restore runbook provides automated procedures for:
- Creating database backups with metadata
- Point-in-time restore capabilities
- Comprehensive consistency checking
- Foreign key verification
- Composite unique constraint rebuilding
- Automated cleanup of old backups

## Prerequisites

### Required Tools
- PostgreSQL client tools (`psql`, `pg_dump`, `pg_restore`, `pg_isready`)
- Bash shell with color support
- Access to database with sufficient privileges

### Environment Variables
```bash
DATABASE_URL="postgresql://crmadmin:BestDB1971!@new-smart-crm-postgress-dev.postgres.database.azure.com:5432/postgres?sslmode=require"
BACKUP_DIR="/backups/crm-system"
LOG_DIR="/logs/backup-restore"
```

## Quick Start

### Interactive Mode
```bash
# Make script executable
chmod +x scripts/backup-restore-runbook.sh

# Run interactive menu
./scripts/backup-restore-runbook.sh
```

### Command Line Mode
```bash
# Create backup
./scripts/backup-restore-runbook.sh backup

# Restore from backup
./scripts/backup-restore-runbook.sh restore /backups/crm-system/crm-backup-20240101-120000.sql

# Run consistency checks
./scripts/backup-restore-runbook.sh check

# Cleanup old backups
./scripts/backup-restore-runbook.sh cleanup
```

## Backup Procedures

### Creating Backups

#### Automated Backup
```bash
./scripts/backup-restore-runbook.sh backup
```

**Features:**
- Custom format backup for point-in-time restore
- Automatic metadata creation
- Schema version tracking
- Backup size logging

#### Backup Metadata
Each backup includes metadata file with:
```
BACKUP_NAME: crm-backup-20240101-120000.sql
BACKUP_DATE: 2024-01-01 12:00:00
DATABASE_URL: postgresql://...
BACKUP_SIZE: 15M
SCHEMA_VERSION: 20240101120000_init_schema
```

### Backup Retention

#### Automatic Cleanup
- Default retention: 30 days
- Configurable via `BACKUP_RETENTION_DAYS`
- Removes old backups and metadata files

#### Manual Cleanup
```bash
./scripts/backup-restore-runbook.sh cleanup
```

## Restore Procedures

### Point-in-Time Restore

#### Full Restore
```bash
./scripts/backup-restore-runbook.sh restore /backups/crm-system/crm-backup-20240101-120000.sql
```

#### Point-in-Time Restore
```bash
./scripts/backup-restore-runbook.sh restore /backups/crm-system/crm-backup-20240101-120000.sql "2024-01-01 12:30:00"
```

#### Restore Process
1. **Validation**: Check backup file exists and is valid
2. **Temporary Database**: Create temporary database for restore
3. **Restore**: Restore backup to temporary database
4. **Consistency Checks**: Run comprehensive checks
5. **Production Switch**: Replace production if checks pass
6. **Cleanup**: Remove temporary database

### Restore Safety Features

#### Pre-Restore Checks
- Database connection validation
- Backup file integrity check
- Available disk space verification

#### Post-Restore Validation
- Table existence verification
- Constraint integrity checks
- Foreign key relationship validation
- Data integrity verification

## Consistency Checking

### Comprehensive Checks

#### 1. Table Existence
Verifies all required tables exist:
- `Tenant`, `User`, `Role`
- `TenantLicense`, `UserTenantLicense`
- `PermissionSet`, `RolePermissionSet`
- `UIConfig`, `Menu`, `MenuItem`
- `StyleTemplate`, `AuditLog`
- `SLOMetric`, `SLOAlert`

#### 2. Composite Unique Constraints
Checks critical unique constraints:
- `tenantId_licenseType` on `TenantLicense`
- `userId_tenantLicenseId` on `UserTenantLicense`

#### 3. Foreign Key Relationships
Validates all foreign key relationships:
- `UserTenantLicense.userId -> User.id`
- `UserTenantLicense.tenantLicenseId -> TenantLicense.id`
- `UserTenantLicense.roleId -> Role.id`
- `TenantLicense.tenantId -> Tenant.id`

#### 4. Index Verification
Checks critical indexes:
- `SLOMetric_timestamp_idx`
- `SLOAlert_timestamp_idx`
- `AuditLog_timestamp_idx`

#### 5. Data Integrity
- Orphaned record detection
- Enum value validation
- Referential integrity checks

#### 6. Enum Validation
Validates enum values:
- `User.userType`: `HUMAN`, `AI`, `SERVICE`
- `User.status`: `active`, `disabled`, `pending`
- `UserTenantLicense.status`: `active`, `expired`, `suspended`

### Running Consistency Checks

#### Interactive Mode
```bash
# Select option 4 from menu
4. Run consistency checks
```

#### Command Line Mode
```bash
./scripts/backup-restore-runbook.sh check
```

#### Output Example
```
[INFO] Running comprehensive consistency checks...
[SUCCESS] Table Tenant exists
[SUCCESS] Table User exists
[SUCCESS] Constraint tenantId_licenseType exists
[SUCCESS] No orphaned records found
[SUCCESS] Enum values valid
[INFO] Consistency check summary: 15/15 checks passed
[SUCCESS] All consistency checks passed
```

## Constraint Rebuilding

### Composite Unique Constraints

#### Rebuilding Process
```bash
# Interactive mode - option 5
5. Rebuild composite unique constraints

# Command line
psql -d "$DATABASE_URL" -c "
    ALTER TABLE \"TenantLicense\" DROP CONSTRAINT IF EXISTS \"tenantId_licenseType\";
    ALTER TABLE \"TenantLicense\" ADD CONSTRAINT \"tenantId_licenseType\" 
    UNIQUE (\"tenantId\", \"licenseType\");
"
```

#### Constraints Rebuilt
1. **TenantLicense**: `tenantId_licenseType`
2. **UserTenantLicense**: `userId_tenantLicenseId`

### Foreign Key Verification

#### Verification Process
```bash
# Interactive mode - option 6
6. Verify foreign keys

# Command line verification
SELECT COUNT(*) FROM "UserTenantLicense" utl 
LEFT JOIN "User" u ON utl."userId" = u.id 
WHERE u.id IS NULL;
```

#### FK Relationships Verified
1. `UserTenantLicense.userId -> User.id`
2. `UserTenantLicense.tenantLicenseId -> TenantLicense.id`
3. `UserTenantLicense.roleId -> Role.id`
4. `TenantLicense.tenantId -> Tenant.id`

## Emergency Procedures

### Disaster Recovery

#### Complete System Restore
```bash
# 1. Stop application
systemctl stop crm-backend

# 2. Create emergency backup (if possible)
./scripts/backup-restore-runbook.sh backup

# 3. Restore from latest backup
./scripts/backup-restore-runbook.sh restore /backups/crm-system/crm-backup-20240101-120000.sql

# 4. Run consistency checks
./scripts/backup-restore-runbook.sh check

# 5. Rebuild constraints if needed
# Interactive mode - option 5

# 6. Restart application
systemctl start crm-backend
```

#### Partial Restore
```bash
# Restore specific tables only
pg_restore -d "$DATABASE_URL" \
    --table="User" \
    --table="UserTenantLicense" \
    /backups/crm-system/crm-backup-20240101-120000.sql
```

### Data Recovery

#### Recovering Deleted Records
```bash
# 1. Identify backup with data
./scripts/backup-restore-runbook.sh

# 2. List available backups
2. List available backups

# 3. Restore to temporary database
pg_restore -d "$DATABASE_URL" --dbname="temp_recovery" \
    /backups/crm-system/crm-backup-20240101-120000.sql

# 4. Extract specific data
psql -d "$DATABASE_URL" --dbname="temp_recovery" -c "
    SELECT * FROM \"User\" WHERE email = 'user@example.com';
"

# 5. Insert recovered data
psql -d "$DATABASE_URL" -c "
    INSERT INTO \"User\" (id, email, name, ...) 
    VALUES ('recovered-id', 'user@example.com', 'Recovered User', ...);
"
```

## Monitoring and Logging

### Log Files
- **Location**: `/logs/backup-restore/backup-restore.log`
- **Format**: Timestamped entries with color coding
- **Retention**: Automatic rotation

### Log Levels
- **INFO**: General operations
- **SUCCESS**: Successful operations
- **WARNING**: Non-critical issues
- **ERROR**: Critical failures

### Monitoring Integration
```bash
# Check backup status
tail -f /logs/backup-restore/backup-restore.log

# Monitor backup directory
watch -n 60 "ls -la /backups/crm-system/"

# Check database connectivity
./scripts/backup-restore-runbook.sh
# Option 8: Test database connection
```

## Automation

### Scheduled Backups

#### Cron Job Setup
```bash
# Add to crontab
0 2 * * * /path/to/scripts/backup-restore-runbook.sh backup
0 3 * * 0 /path/to/scripts/backup-restore-runbook.sh cleanup
```

#### Systemd Service
```ini
[Unit]
Description=CRM System Backup Service
After=network.target

[Service]
Type=oneshot
ExecStart=/path/to/scripts/backup-restore-runbook.sh backup
User=postgres
Environment=DATABASE_URL=postgresql://...

[Install]
WantedBy=multi-user.target
```

### Backup Verification

#### Automated Testing
```bash
#!/bin/bash
# backup-verification.sh

# Create test backup
./scripts/backup-restore-runbook.sh backup

# Run consistency checks
./scripts/backup-restore-runbook.sh check

# Verify backup integrity
pg_restore -l /backups/crm-system/crm-backup-*.sql | head -10
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check connection
pg_isready -d "$DATABASE_URL"

# Verify credentials
psql -d "$DATABASE_URL" -c "SELECT 1;"

# Check network connectivity
telnet new-smart-crm-postgress-dev.postgres.database.azure.com 5432
```

#### 2. Backup Creation Failed
```bash
# Check disk space
df -h /backups/crm-system/

# Verify permissions
ls -la /backups/crm-system/

# Check PostgreSQL logs
tail -f /var/log/postgresql/postgresql-*.log
```

#### 3. Restore Failed
```bash
# Check backup file integrity
pg_restore -l /backups/crm-system/crm-backup-*.sql

# Verify database state
psql -d "$DATABASE_URL" -c "SELECT version();"

# Check for conflicting processes
ps aux | grep pg_restore
```

#### 4. Consistency Checks Failed
```bash
# Run individual checks
psql -d "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"User\";"

# Check constraint status
psql -d "$DATABASE_URL" -c "
    SELECT constraint_name, table_name 
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'UNIQUE';
"

# Verify foreign keys
psql -d "$DATABASE_URL" -c "
    SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE constraint_type = 'FOREIGN KEY';
"
```

### Recovery Procedures

#### 1. Corrupted Backup
```bash
# Try alternative backup
./scripts/backup-restore-runbook.sh
# Option 2: List available backups

# Verify backup integrity
pg_restore -l /backups/crm-system/crm-backup-*.sql

# Create new backup if needed
./scripts/backup-restore-runbook.sh backup
```

#### 2. Incomplete Restore
```bash
# Check restore status
psql -d "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"User\";"

# Re-run consistency checks
./scripts/backup-restore-runbook.sh check

# Rebuild constraints if needed
# Interactive mode - option 5
```

#### 3. Data Inconsistency
```bash
# Identify orphaned records
psql -d "$DATABASE_URL" -c "
    SELECT COUNT(*) FROM \"UserTenantLicense\" utl 
    LEFT JOIN \"User\" u ON utl.\"userId\" = u.id 
    WHERE u.id IS NULL;
"

# Clean up orphaned records
psql -d "$DATABASE_URL" -c "
    DELETE FROM \"UserTenantLicense\" utl 
    WHERE NOT EXISTS (SELECT 1 FROM \"User\" u WHERE u.id = utl.\"userId\");
"
```

## Best Practices

### Backup Strategy
1. **Regular Backups**: Daily automated backups
2. **Retention Policy**: 30-day retention with cleanup
3. **Verification**: Automated consistency checks
4. **Monitoring**: Log monitoring and alerting

### Restore Strategy
1. **Test Restores**: Regular restore testing
2. **Point-in-Time**: Use for data recovery
3. **Validation**: Always run consistency checks
4. **Documentation**: Record all restore procedures

### Security Considerations
1. **Access Control**: Limit backup access
2. **Encryption**: Encrypt backup files
3. **Network Security**: Secure database connections
4. **Audit Trail**: Log all backup/restore operations

## Future Enhancements

### Planned Features
1. **Incremental Backups**: Faster backup creation
2. **Compression**: Reduce backup storage requirements
3. **Encryption**: Secure backup storage
4. **Cloud Integration**: Backup to cloud storage

### Monitoring Expansion
1. **Backup Metrics**: Success rate tracking
2. **Performance Monitoring**: Backup/restore timing
3. **Alert Integration**: Failure notifications
4. **Dashboard**: Backup status dashboard
