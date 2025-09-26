# 🚀 CRM License System - Production Deployment Checklist

## ✅ **FINAL PRODUCTION-READY SYSTEM**

### **🔧 Pre-Deployment Configuration**

#### **1. Azure App Service Settings**
```bash
# Set these in Azure Portal > Configuration > Application Settings
TZ=UTC
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=...
APPLICATIONINSIGHTS_CONNECTION_STRING=...
```

#### **2. Database Migration**
```bash
# Run migration to create all tables and constraints
npx prisma migrate deploy
```

#### **3. Seed Database**
```bash
# Populate with test data
npm run db:seed
```

### **🛡️ Production Safeguards Implemented**

#### **✅ Time & Expiry Sanity**
- All timestamps stored in UTC
- `getCurrentTimeUTC()` method ensures consistent time handling
- TZ=UTC set on App Service
- Clock skew tolerance built into expiry checks

#### **✅ Idempotent Seed**
- Uses `upsert` for all operations
- Unique constraints: tenant name, user email, tenantId+licenseType, userId+tenantLicenseId
- Safe to re-run multiple times

#### **✅ Guard Coverage**
- `LicenseGuard` wraps all vertical routes (Service, Sales, Grants)
- Background jobs call `checkUserLicense` before mutations
- System users bypass all checks

#### **✅ Database Constraints**
- Composite uniques: `@@unique([tenantId, licenseType])`, `@@unique([userId, tenantLicenseId])`
- Performance indexes: `@@index([userId, status, expiresAt])`, `@@index([tenantLicenseId])`
- Cascading deletes on join tables

#### **✅ Seat Count Enforcement**
- `totalSeats` enforcement in `assignUserLicense`
- Admin override: `assignUserLicenseWithOverride` with audit logging
- Support can temporarily exceed seats with logged reason

#### **✅ Standardized Error Envelope**
- All license errors return `{ code, message, detail, timestamp }`
- HTTP status codes: 403 (Forbidden), 409 (Conflict), 422 (Unprocessable)
- Never 500 for expected conditions

### **🧪 QA Test Script**

```bash
# Run comprehensive QA tests
./scripts/qa-test.sh
```

**Test Coverage:**
1. ✅ Health endpoints
2. ✅ License validation
3. ✅ Service endpoints with guards
4. ✅ Error handling
5. ✅ Admin endpoints
6. ✅ Database constraints
7. ✅ Time zone configuration
8. ✅ Cache functionality

### **📊 Quick Smoke Tests**

```bash
# 1) Happy path (should 200)
curl -sS "https://<app>/licenses/check?userId=$U&tenantId=$T&licenseType=SMART_SERVICE" | jq

# 2) Expire the seat, should 403 on guarded route
psql -c "update \"UserTenantLicense\" set \"expiresAt\" = now() - interval '1 second' where \"userId\"='$U';"
curl -i "https://<app>/service/tickets" | head -n 1

# 3) Tenant retired (flip status), should 403 for everyone
psql -c "update \"TenantLicense\" set status='inactive' where \"tenantId\"='$T' and \"licenseType\"='SMART_SERVICE';"
curl -i "https://<app>/service/tickets" | head -n 1

# 4) Health checks
curl -sS "https://<app>/health/license?tenantId=$T&licenseType=SMART_SERVICE" | jq
curl -sS "https://<app>/health/license/summary" | jq
```

### **🔍 Database Verification**

```sql
-- Verify composite constraints exist
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'TenantLicense' AND constraint_type = 'UNIQUE';

-- Verify indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename = 'UserTenantLicense' AND indexname LIKE '%userId_status_expiresAt%';

-- Check expiring licenses (30/60/90 days)
SELECT date_trunc('day', utl."expiresAt") AS day, count(*) 
FROM "UserTenantLicense" utl
JOIN "TenantLicense" tl ON tl.id = utl."tenantLicenseId"
WHERE utl.status = 'active'
  AND tl."tenantId" = $TENANT
  AND utl."expiresAt" BETWEEN now() AND now() + interval '90 days'
GROUP BY 1 ORDER BY 1;
```

### **🔄 Rollback Plan**

If needed, use the rollback script:
```bash
# Apply rollback migration
psql $DATABASE_URL -f libs/schema-engine/prisma/rollback.sql
```

### **📈 Monitoring & Alerts**

#### **Health Endpoints**
- `GET /health/license?tenantId=...&licenseType=...`
- `GET /health/license/summary`

#### **Admin Dashboards**
- `GET /licenses/seats/:tenantId` - Seat usage
- `GET /licenses/expiring?days=90` - Expiring licenses
- `POST /licenses/maintenance/expire` - Manual cleanup

#### **Audit Trail**
- All license assignments logged
- Admin overrides logged with reasons
- Failed access attempts logged

### **🚀 Deployment Steps**

1. **✅ Schema Migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **✅ Seed Database**
   ```bash
   npm run db:seed
   ```

3. **✅ Deploy to Azure**
   ```bash
   git push origin main
   ```

4. **✅ Run QA Tests**
   ```bash
   ./scripts/qa-test.sh
   ```

5. **✅ Verify Health**
   ```bash
   curl "https://<app>/health/license/summary"
   ```

### **🎯 Production Features**

#### **✅ License Management**
- Assign/revoke user licenses
- Renew expired licenses
- Admin override for seat limits
- Per-seat expiry tracking

#### **✅ Security**
- System user bypass
- Role-based access control
- Audit logging
- Standardized error responses

#### **✅ Performance**
- Request-level caching (5min TTL)
- Database indexes
- Optimized queries

#### **✅ Monitoring**
- Health endpoints
- License usage tracking
- Expiration alerts
- Audit trail

#### **✅ Maintenance**
- Daily expiration cleanup
- Seat usage statistics
- Admin override logging
- Rollback capability

### **🎉 Ready for Production!**

The CRM License System is now **100% production-ready** with:
- ✅ Comprehensive license management
- ✅ Security and audit trails
- ✅ Performance optimizations
- ✅ Health monitoring
- ✅ Maintenance capabilities
- ✅ Rollback procedures
- ✅ QA test coverage

**Ship it! 🚀**
