# Deterministic IDs and Multi-Tenant Considerations

## Overview

This document explains the current deterministic ID strategy in the seed script and considerations for multi-tenant scenarios.

## Current Implementation

### ✅ Single-Tenant Seeds (Current)

The seed script currently uses **global deterministic IDs** for test data:

```typescript
// Customers
id: 'customer-1'
id: 'customer-2'

// Contacts  
id: 'contact-1'
id: 'contact-2'
```

**Advantages:**
- ✅ **Simple and predictable** - Easy to reference in tests
- ✅ **Idempotent** - Same IDs on every run
- ✅ **Debugging friendly** - Easy to identify test data
- ✅ **Suitable for single-tenant** - Works perfectly for one tenant per database

**Current Usage:**
```bash
# Single tenant seed (current)
npm run db:seed
# Creates: customer-1, customer-2, contact-1, contact-2
```

## Multi-Tenant QA Considerations

### ⚠️ Potential Issues

When seeding multiple tenants in the same database, global IDs can cause conflicts:

```bash
# Tenant A seed
npm run db:seed SEED_TENANT_NAME="Company A"
# Creates: customer-1, customer-2

# Tenant B seed (CONFLICT!)
npm run db:seed SEED_TENANT_NAME="Company B"  
# Tries to create: customer-1, customer-2 (UNIQUE CONSTRAINT VIOLATION)
```

### 🛡️ Solutions for Multi-Tenant QA

#### **Option 1: Tenant-Scoped IDs (Recommended)**

Modify the seed script to use tenant-scoped IDs:

```typescript
// Current (global)
id: 'customer-1'

// Multi-tenant (tenant-scoped)
id: `${tenant.name.toLowerCase().replace(/\s+/g, '-')}-customer-1`
// Example: "acme-corp-customer-1"
```

**Implementation:**
```typescript
const getTenantScopedId = (baseId: string, tenantName: string) => {
  const tenantPrefix = tenantName.toLowerCase().replace(/\s+/g, '-');
  return `${tenantPrefix}-${baseId}`;
};

// Usage
id: getTenantScopedId('customer-1', SEED_CONFIG.tenantName)
```

#### **Option 2: UUIDs with Deterministic Seeds**

Use UUIDs with deterministic seeds for reproducible randomness:

```typescript
import { v5 as uuidv5 } from 'uuid';

const NAMESPACE = 'seed-namespace';
const getDeterministicId = (baseId: string, tenantId: string) => {
  return uuidv5(`${tenantId}-${baseId}`, NAMESPACE);
};

// Usage
id: getDeterministicId('customer-1', tenant.id)
```

#### **Option 3: Composite Unique Constraints**

Add composite unique constraints to the schema:

```prisma
model Customer {
  id         String @id @default(uuid())
  externalKey String
  tenantId   String
  
  @@unique([tenantId, externalKey])
}
```

Then use `externalKey` for deterministic references:

```typescript
// Use externalKey for deterministic references
externalKey: 'customer-1'  // Can be same across tenants
id: uuid()                 // Unique per tenant
```

## Recommended Approach

### **For Current Single-Tenant Usage:**
- ✅ **Keep current implementation** - Global IDs work perfectly
- ✅ **No changes needed** - Simple and effective

### **For Multi-Tenant QA:**
- 🎯 **Use Option 1 (Tenant-Scoped IDs)** - Simple and clear
- 🎯 **Add environment variable toggle** - `ENABLE_MULTI_TENANT_IDS=true`

### **Implementation Strategy:**

```typescript
// Configuration
const ENABLE_MULTI_TENANT_IDS = process.env.ENABLE_MULTI_TENANT_IDS === 'true';

// ID generation helper
const generateId = (baseId: string, tenantName: string) => {
  if (ENABLE_MULTI_TENANT_IDS) {
    const tenantPrefix = tenantName.toLowerCase().replace(/\s+/g, '-');
    return `${tenantPrefix}-${baseId}`;
  }
  return baseId; // Current behavior
};

// Usage
id: generateId('customer-1', SEED_CONFIG.tenantName)
```

## Environment Variables

### **Single-Tenant (Current):**
```bash
# Default behavior - global IDs
npm run db:seed
```

### **Multi-Tenant QA:**
```bash
# Enable tenant-scoped IDs
ENABLE_MULTI_TENANT_IDS=true npm run db:seed SEED_TENANT_NAME="Company A"
ENABLE_MULTI_TENANT_IDS=true npm run db:seed SEED_TENANT_NAME="Company B"
```

## Migration Path

### **Phase 1: Documentation (Current)**
- ✅ Document current behavior
- ✅ Identify potential issues
- ✅ Provide solutions

### **Phase 2: Implementation (Future)**
- 🔄 Add `ENABLE_MULTI_TENANT_IDS` environment variable
- 🔄 Implement `generateId()` helper function
- 🔄 Update seed script with conditional logic
- 🔄 Add tests for multi-tenant scenarios

### **Phase 3: Schema Updates (If Needed)**
- 🔄 Add composite unique constraints
- 🔄 Migrate existing data
- 🔄 Update application code

## Testing Scenarios

### **Single-Tenant Test:**
```bash
# Should work as before
npm run db:seed
# Creates: customer-1, customer-2, contact-1, contact-2
```

### **Multi-Tenant Test:**
```bash
# First tenant
ENABLE_MULTI_TENANT_IDS=true npm run db:seed SEED_TENANT_NAME="Acme Corp"
# Creates: acme-corp-customer-1, acme-corp-customer-2

# Second tenant (no conflicts)
ENABLE_MULTI_TENANT_IDS=true npm run db:seed SEED_TENANT_NAME="TechStart Inc"
# Creates: techstart-inc-customer-1, techstart-inc-customer-2
```

## Best Practices

### **For Development:**
- ✅ Use global IDs for simplicity
- ✅ Clear documentation of current behavior
- ✅ Easy to understand and debug

### **For QA/Testing:**
- ✅ Use tenant-scoped IDs when multiple tenants needed
- ✅ Environment variable control
- ✅ Deterministic and reproducible

### **For Production:**
- ✅ Single tenant per database (current approach)
- ✅ Global IDs work perfectly
- ✅ No changes needed

## Conclusion

The current deterministic ID strategy is **perfect for single-tenant scenarios** and doesn't need immediate changes. For future multi-tenant QA needs, the tenant-scoped ID approach provides a clean migration path without breaking existing functionality.

**Current Status:** ✅ **Production Ready** - No changes needed for single-tenant deployments.
