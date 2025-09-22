import { PrismaClient, Prisma, LicenseType, UserType, UserStatus, SeatStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Function to get seed version from package.json or environment
function getSeedVersionFromPackageJson(): string | undefined {
  const candidates = [
    path.join(process.cwd(), 'package.json'),
    path.join(__dirname, '../../../package.json'),
  ];
  
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        const packageJson = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (packageJson.seedVersion) {
          console.log(`📋 Found seed version in: ${p}`);
          return packageJson.seedVersion;
        }
      }
    } catch (error) {
      // Silently continue to next candidate
    }
  }
  
  console.log('⚠️ Could not read seed version from package.json, using default');
  return undefined;
}

// ---- Config (probe OFF by default in prod) ----
const IS_PROD = process.env.NODE_ENV === 'production';
const ENABLE_DEMO_PROBE_USERS =
  process.env.ENABLE_DEMO_PROBE_USERS
    ? process.env.ENABLE_DEMO_PROBE_USERS === 'true'
    : !IS_PROD; // default: false in prod, true elsewhere

const ENABLE_AUDIT_LOGS =
  process.env.ENABLE_AUDIT_LOGS ? process.env.ENABLE_AUDIT_LOGS === 'true' : true;

// Get seed version from environment or package.json
const SEED_VERSION = process.env.SEED_VERSION || getSeedVersionFromPackageJson() || '1.0.0';

// ---- Env-driven names (reusable across projects/envs) ----
const SEED_CONFIG = {
  tenantName: process.env.SEED_TENANT_NAME || 'ACME Corp',
  adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@acme.com',
  serviceEmail: process.env.SEED_SERVICE_EMAIL || 'service@acme.com',
  salesEmail: process.env.SEED_SALES_EMAIL || 'sales@acme.com',
  probeEmail: process.env.SEED_PROBE_EMAIL || 'probe@system.com',
  probeTenantName: process.env.SEED_PROBE_TENANT_NAME || 'SYSTEM-PROBE-TENANT',
};

// ---- UTC-safe dates ----
const nowUtc = () => new Date(new Date().toISOString());
const NOW = nowUtc();
const ONE_YEAR_FROM_NOW = new Date(NOW.getTime() + 365 * 24 * 3600 * 1000);
const NINETY_DAYS_FROM_NOW = new Date(NOW.getTime() + 90 * 24 * 3600 * 1000);

async function main() {
  console.log('🌱 Starting database seed...');
  console.log('📋 Configuration:', {
    enableDemoProbeUsers: ENABLE_DEMO_PROBE_USERS,
    enableAuditLogs: ENABLE_AUDIT_LOGS,
    isProduction: IS_PROD,
  });

  // Wrap everything in a single transaction for atomicity
  return await prisma.$transaction(async (tx: any) => {
    try {
              // Create test tenant
        const tenant = await tx.tenant.upsert({
          where: { name: SEED_CONFIG.tenantName },
          update: {},
          create: { 
            name: SEED_CONFIG.tenantName,
            defaultLocale: 'en',
            isIsolated: false,
          },
        });
        console.log('✅ Tenant created:', tenant.name);

      // Create roles
      const [serviceRole, salesRole, adminRole] = await Promise.all([
        tx.role.upsert({
          where: { name: 'Service Agent' },
          update: {},
          create: { 
            name: 'Service Agent',
            description: 'Customer service representative',
            isGlobal: false,
          },
        }),
        tx.role.upsert({
          where: { name: 'Sales Representative' },
          update: {},
          create: { 
            name: 'Sales Representative',
            description: 'Sales team member',
            isGlobal: false,
          },
        }),
        tx.role.upsert({
          where: { name: 'System Administrator' },
          update: {},
          create: { 
            name: 'System Administrator',
            description: 'System admin with full access',
            isGlobal: true,
          },
        }),
      ]);
      console.log('✅ Roles created:', [serviceRole.name, salesRole.name, adminRole.name]);

                // Create system admin user
          const systemAdmin = await tx.user.upsert({
            where: { email: SEED_CONFIG.adminEmail },
            update: {},
            create: { 
              email: SEED_CONFIG.adminEmail,
              name: 'System Administrator',
              isSystemUser: true,
              userType: UserType.HUMAN,
              status: UserStatus.active,
              tenantId: tenant.id,
            },
          });
          console.log('✅ System admin created:', systemAdmin.email);

                // Create regular users
          const [serviceAgent, salesRep] = await Promise.all([
            tx.user.upsert({
              where: { email: SEED_CONFIG.serviceEmail },
              update: {},
              create: { 
                email: SEED_CONFIG.serviceEmail,
                name: 'Service Agent',
                isSystemUser: false,
                userType: UserType.HUMAN,
                status: UserStatus.active,
                tenantId: tenant.id,
              },
            }),
            tx.user.upsert({
              where: { email: SEED_CONFIG.salesEmail },
              update: {},
              create: { 
                email: SEED_CONFIG.salesEmail,
                name: 'Sales Representative',
                isSystemUser: false,
                userType: UserType.HUMAN,
                status: UserStatus.active,
                tenantId: tenant.id,
              },
            }),
          ]);
          console.log('✅ Users created:', [serviceAgent.email, salesRep.email]);

      // Create probe tenant and users for synthetic monitoring (only if enabled)
      let probeTenant: any = null;
      let probeUser: any = null;
      
                if (ENABLE_DEMO_PROBE_USERS) {
            probeTenant = await tx.tenant.upsert({
              where: { name: SEED_CONFIG.probeTenantName },
              update: {},
              create: { 
                name: SEED_CONFIG.probeTenantName,
                defaultLocale: 'en',
                isIsolated: false,
              },
            });
            console.log('✅ Probe tenant created:', probeTenant.name);

            probeUser = await tx.user.upsert({
              where: { email: SEED_CONFIG.probeEmail },
              update: {},
              create: { 
                email: SEED_CONFIG.probeEmail,
                name: 'System Probe User',
                isSystemUser: true,
                userType: UserType.SERVICE,
                status: UserStatus.active,
                tenantId: probeTenant.id,
              },
            });
            console.log('✅ Probe user created:', probeUser.email);
              } else {
          console.log('⏭️ Skipping probe users (disabled or production default)');
          console.log('📊 Probe Summary: Tenant and user creation skipped for production safety');
        }

      // Create tenant licenses
      const [serviceLicense, salesLicense] = await Promise.all([
        tx.tenantLicense.upsert({
          where: { tenantId_licenseType: { tenantId: tenant.id, licenseType: LicenseType.SMART_SERVICE } },
          update: { 
            status: 'active', 
            totalSeats: 50,
            expiresAt: ONE_YEAR_FROM_NOW,
          },
          create: {
            tenantId: tenant.id,
            licenseType: LicenseType.SMART_SERVICE,
            status: 'active',
            activatedAt: NOW,
            totalSeats: 50,
            expiresAt: ONE_YEAR_FROM_NOW,
            metadata: {
              features: ['ticket-management', 'case-tracking', 'knowledge-base'],
              modules: ['service-desk', 'support-portal'],
            },
          },
        }),
        tx.tenantLicense.upsert({
          where: { tenantId_licenseType: { tenantId: tenant.id, licenseType: LicenseType.SMART_SALES } },
          update: { 
            status: 'active', 
            totalSeats: 25,
            expiresAt: ONE_YEAR_FROM_NOW,
          },
          create: {
            tenantId: tenant.id,
            licenseType: LicenseType.SMART_SALES,
            status: 'active',
            activatedAt: NOW,
            totalSeats: 25,
            expiresAt: ONE_YEAR_FROM_NOW,
            metadata: {
              features: ['lead-management', 'opportunity-tracking', 'sales-analytics'],
              modules: ['sales-crm', 'pipeline-management'],
            },
          },
        }),
      ]);
      console.log('✅ Licenses created:', [serviceLicense.licenseType, salesLicense.licenseType]);

      // Assign licenses to users
      const [serviceAssignment, salesAssignment] = await Promise.all([
        tx.userTenantLicense.upsert({
          where: { userId_tenantLicenseId: { userId: serviceAgent.id, tenantLicenseId: serviceLicense.id } },
          update: { 
            roleId: serviceRole.id, 
            status: SeatStatus.active,
            expiresAt: NINETY_DAYS_FROM_NOW,
            assignedBy: systemAdmin.id, // <— add this to correct drift
            assignedAt: NOW, // <— self-heal assigned time drift
          },
          create: {
            userId: serviceAgent.id,
            tenantLicenseId: serviceLicense.id,
            roleId: serviceRole.id,
            status: SeatStatus.active,
            assignedBy: systemAdmin.id,
            assignedAt: NOW, // <— ensure consistency with update path
            expiresAt: NINETY_DAYS_FROM_NOW,
            notes: 'Service agent license assignment',
          },
        }),
        tx.userTenantLicense.upsert({
          where: { userId_tenantLicenseId: { userId: salesRep.id, tenantLicenseId: salesLicense.id } },
          update: { 
            roleId: salesRole.id, 
            status: SeatStatus.active,
            expiresAt: NINETY_DAYS_FROM_NOW,
            assignedBy: systemAdmin.id, // <— add this to correct drift
            assignedAt: NOW, // <— self-heal assigned time drift
          },
          create: {
            userId: salesRep.id,
            tenantLicenseId: salesLicense.id,
            roleId: salesRole.id,
            status: SeatStatus.active,
            assignedBy: systemAdmin.id,
            assignedAt: NOW, // <— ensure consistency with update path
            expiresAt: NINETY_DAYS_FROM_NOW,
            notes: 'Sales representative license assignment',
          },
        }),
      ]);
      console.log('✅ License assignments created');

      // Create some test customers
      // NOTE: Using global IDs (customer-1, customer-2) - suitable for single-tenant seeds
      // For multi-tenant QA scenarios, consider tenant-scoped keys or UUIDs
      const [customer1, customer2] = await Promise.all([
        tx.customer.upsert({
          where: { id: 'customer-1' },
          update: {},
          create: {
            id: 'customer-1',
            name: 'TechStart Inc',
            preferredLanguage: 'en',
            tenantId: tenant.id,
          },
        }),
        tx.customer.upsert({
          where: { id: 'customer-2' },
          update: {},
          create: {
            id: 'customer-2',
            name: 'Global Solutions Ltd',
            preferredLanguage: 'en',
            tenantId: tenant.id,
          },
        }),
      ]);
      console.log('✅ Customers created:', [customer1.name, customer2.name]);

      // Create some test contacts
      // NOTE: Using global IDs (contact-1, contact-2) - suitable for single-tenant seeds
      // For multi-tenant QA scenarios, consider tenant-scoped keys or UUIDs
      await Promise.all([
        tx.contact.upsert({
          where: { id: 'contact-1' },
          update: {},
          create: {
            id: 'contact-1',
            customerId: customer1.id,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@techstart.com',
            phone: '+1-555-0123',
            title: 'CTO',
            department: 'Engineering',
            isPrimary: true,
            tenantId: tenant.id,
          },
        }),
        tx.contact.upsert({
          where: { id: 'contact-2' },
          update: {},
          create: {
            id: 'contact-2',
            customerId: customer2.id,
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@globalsolutions.com',
            phone: '+1-555-0456',
            title: 'VP Sales',
            department: 'Sales',
            isPrimary: true,
            tenantId: tenant.id,
          },
        }),
      ]);
      console.log('✅ Contacts created');

      // Create catalog parties (PERSON and ORG) and an address linked to the person
      const personParty = await tx.party.upsert({
        where: { id: 'seed-person-1' },
        update: {},
        create: { id: 'seed-person-1', type: 'PERSON' },
      });

      await tx.person.upsert({
        where: { partyId: personParty.id },
        update: { firstName: 'Jane', lastName: 'Doe' },
        create: { partyId: personParty.id, firstName: 'Jane', lastName: 'Doe' },
      });

      const orgParty = await tx.party.upsert({
        where: { id: 'seed-org-1' },
        update: {},
        create: { id: 'seed-org-1', type: 'ORG' },
      });

      await tx.organization.upsert({
        where: { partyId: orgParty.id },
        update: { legalName: 'ACME Corporation', orgKind: 'LLC' },
        create: { partyId: orgParty.id, legalName: 'ACME Corporation', orgKind: 'LLC' },
      });

      const addr = await tx.address.upsert({
        where: { id: 'seed-addr-1' },
        update: {},
        create: { id: 'seed-addr-1', line1: '123 Main St', city: 'Plano', country: 'US' },
      });

      await tx.partyAddress.upsert({
        where: { id: 'seed-pa-1' },
        update: {},
        create: { id: 'seed-pa-1', partyId: personParty.id, addressId: addr.id, usage: 'HOME' },
      });

      // Link demo Case and Opportunity to the new person party (updated Case model)
      await tx.case.upsert({
        where: { id: 'seed-case-1' },
        update: { subjectPartyId: personParty.id },
        create: {
          id: 'seed-case-1',
          tenantId: tenant.id,
          caseNumber: 'CASE-001',
          caseType: 'GENERIC',
          subjectPartyId: personParty.id,
          status: 'open',
        },
      });

      await tx.opportunity.upsert({
        where: { id: 'seed-opp-1' },
        update: { partyId: personParty.id },
        create: {
          id: 'seed-opp-1',
          contactId: 'contact-1',
          partyId: personParty.id,
          name: 'Demo Opportunity',
          amount: '1000',
          stage: 'Prospecting',
          probability: 50,
          tenantId: tenant.id,
        },
      });

      // ---- Platform minimal seeds ----
      // Workflow definition
      const wf = await tx.workflow.upsert({
        where: { id: 'seed-wf-1' },
        update: {},
        create: {
          id: 'seed-wf-1',
          key: 'service_case',
          name: 'Service Case',
          version: 1,
          definition: {},
        },
      });
      await tx.workflowState.createMany({
        data: [
          { id: 'seed-wf-st-open', workflowId: wf.id, key: 'open', name: 'Open' },
          { id: 'seed-wf-st-ip', workflowId: wf.id, key: 'in_progress', name: 'In Progress' },
          { id: 'seed-wf-st-res', workflowId: wf.id, key: 'resolved', name: 'Resolved', isTerminal: true },
        ],
        skipDuplicates: true,
      });
      await tx.sLA.upsert({
        where: { id: 'seed-sla-1' },
        update: {},
        create: { id: 'seed-sla-1', workflowId: wf.id, name: 'Default 24h', targetMs: 86_400_000, rule: {} },
      });
      const caseRow = await tx.case.findUnique({ where: { id: 'seed-case-1' } });
      if (caseRow) {
        await tx.workflowInstance.upsert({
          where: { id: 'seed-wfi-1' },
          update: {},
          create: {
            id: 'seed-wfi-1',
            workflowId: wf.id,
            subjectSchema: 'service',
            subjectModel: 'Case',
            subjectId: caseRow.id,
            stateKey: 'open',
          },
        });
      }

      // Automation: job + run and webhook
      await tx.job.upsert({
        where: { id: 'seed-job-1' },
        update: {},
        create: { id: 'seed-job-1', type: 'SCHEDULED', key: 'daily-seat-reconciliation', enabled: true },
      });
      await tx.jobRun.upsert({
        where: { id: 'seed-jobrun-1' },
        update: {},
        create: { id: 'seed-jobrun-1', jobId: 'seed-job-1', status: 'success' },
      });
      await tx.webhookSubscription.upsert({
        where: { id: 'seed-wh-1' },
        update: {},
        create: { id: 'seed-wh-1', eventKey: 'service.case.created', targetUrl: 'https://example/case', secret: 'dev-secret', active: true },
      });

      // Training: prompt + version
      const tmpl = await tx.promptTemplate.upsert({
        where: { id: 'seed-tmpl-1' },
        update: {},
        create: { id: 'seed-tmpl-1', key: '311_intake_triage', description: '311 intake triage prompt' },
      });
      await tx.promptVersion.upsert({
        where: { id: 'seed-tmpl-v1' },
        update: {},
        create: { id: 'seed-tmpl-v1', templateId: tmpl.id, version: 1, content: 'You are a helpful agent...' },
      });

      // Security: policy + target
      await tx.policy.upsert({
        where: { code: 'RETENTION.CASES_1Y' },
        update: {},
        create: { code: 'RETENTION.CASES_1Y', title: 'Case retention 1 year', class: 'INTERNAL', rules: { keepDays: 365 }, active: true },
      });
      const policy = await tx.policy.findUnique({ where: { code: 'RETENTION.CASES_1Y' } });
      if (policy) {
        await tx.policyTarget.upsert({
          where: { id: 'seed-policy-target-tenant' },
          update: {},
          create: { id: 'seed-policy-target-tenant', policyId: policy.id, tenantId: tenant.id },
        });
      }

      // ---- Guidance minimal seeds ----
      const sc = await tx.script.upsert({
        where: { id: 'seed-script-311' },
        update: {},
        create: { id: 'seed-script-311', key: '311_intake', title: '311 Intake', tags: ['311','intake'] },
      });
      const sv = await tx.scriptVersion.upsert({
        where: { id: 'seed-script-311-v1' },
        update: {},
        create: { id: 'seed-script-311-v1', scriptId: sc.id, version: 1, status: 'ACTIVE' },
      });
      await tx.scriptVariable.createMany({
        data: [
          { id: 'sv-var-reason', scriptVersionId: sv.id, key: 'reason', type: 'string', required: true, enumValues: [] },
          { id: 'sv-var-emergency', scriptVersionId: sv.id, key: 'is_emergency', type: 'enum', enumValues: ['yes','no'], defaultVal: 'no' },
        ],
        skipDuplicates: true,
      });
      const info = await tx.scriptNode.upsert({
        where: { id: 'sv-node-welcome' },
        update: {},
        create: { id: 'sv-node-welcome', scriptVersionId: sv.id, key: 'welcome', type: 'INFO', title: 'Welcome', prompt: "Let's capture your request.", orderIndex: 1 },
      });
      const q1 = await tx.scriptNode.upsert({
        where: { id: 'sv-node-q-reason' },
        update: {},
        create: { id: 'sv-node-q-reason', scriptVersionId: sv.id, key: 'q_reason', type: 'QUESTION', title: 'What do you need help with?', uiSchema: { type: 'string' }, orderIndex: 2 },
      });
      const q2 = await tx.scriptNode.upsert({
        where: { id: 'sv-node-q-emer' },
        update: {},
        create: { id: 'sv-node-q-emer', scriptVersionId: sv.id, key: 'q_emergency', type: 'QUESTION', title: 'Is this an emergency?', uiSchema: { enum: ['yes','no'] }, orderIndex: 3 },
      });
      const act = await tx.scriptNode.upsert({
        where: { id: 'sv-node-action-create' },
        update: {},
        create: { id: 'sv-node-action-create', scriptVersionId: sv.id, key: 'act_create_case', type: 'ACTION', title: 'Create Case', config: { action: 'service.createCase', args: { from: 'answers' } }, orderIndex: 4 },
      });
      const end = await tx.scriptNode.upsert({
        where: { id: 'sv-node-end' },
        update: {},
        create: { id: 'sv-node-end', scriptVersionId: sv.id, key: 'end', type: 'END', title: 'Done', orderIndex: 5 },
      });
      await tx.scriptVersion.update({ where: { id: sv.id }, data: { entryNodeId: info.id } });
      await tx.scriptEdge.createMany({
        data: [
          { id: 'sv-edge-1', scriptVersionId: sv.id, fromNodeId: info.id, toNodeId: q1.id },
          { id: 'sv-edge-2', scriptVersionId: sv.id, fromNodeId: q1.id, toNodeId: q2.id },
          { id: 'sv-edge-3', scriptVersionId: sv.id, fromNodeId: q2.id, toNodeId: act.id, condition: { "==": [{ "var": "answers.q_emergency" }, "no"] } },
          { id: 'sv-edge-4', scriptVersionId: sv.id, fromNodeId: q2.id, toNodeId: end.id, condition: { "==": [{ "var": "answers.q_emergency" }, "yes"] } },
        ],
        skipDuplicates: true,
      });
      const kase = await tx.case.findFirst();
      if (kase) {
        await tx.scriptRun.upsert({
          where: { id: 'seed-script-run-1' },
          update: {},
          create: {
            id: 'seed-script-run-1',
            tenantId: kase.tenantId,
            scriptId: sc.id,
            scriptVersion: 1,
            subjectSchema: 'service',
            subjectModel: 'Case',
            subjectId: kase.id,
            state: { cursor: 'welcome', answers: {} },
          },
        });
      }

      // ---- Permits minimal seeds ----
      const buildingType = await tx.permitType.upsert({
        where: { code: 'BUILDING' },
        update: {},
        create: { id: 'seed-ptype-building', tenantId: tenant.id, code: 'BUILDING', name: 'Building Permit' },
      });
      const permitCase = await tx.case.upsert({
        where: { caseNumber: 'PRM-00001' },
        update: {},
        create: {
          id: 'seed-case-permit-1',
          tenantId: tenant.id,
          caseNumber: 'PRM-00001',
          caseType: 'PERMIT',
          subjectPartyId: personParty.id,
          status: 'open',
        },
      });
      await tx.permitCaseExt.upsert({
        where: { caseId: permitCase.id },
        update: {},
        create: { caseId: permitCase.id, permitTypeId: buildingType.id, valuation: '10000' },
      });
      await tx.inspection.upsert({
        where: { id: 'seed-inspection-1' },
        update: {},
        create: { id: 'seed-inspection-1', caseId: permitCase.id, scheduledDate: new Date(Date.now() + 24*3600*1000) },
      });
      await tx.fee.upsert({
        where: { id: 'seed-fee-1' },
        update: {},
        create: { id: 'seed-fee-1', caseId: permitCase.id, code: 'APP-FEE', description: 'Application fee', amount: '100' },
      });

      // Create audit logs (only if enabled and with deduplication)
      if (ENABLE_AUDIT_LOGS) {
        // Parallelize audit pre-checks
        const [existingUserAuditLog, existingLicenseAuditLog] = await Promise.all([
          tx.auditLog.findFirst({
            where: {
              actorId: systemAdmin.id,
              action: 'USER_CREATED',
              targetType: 'User',
              targetId: serviceAgent.id,
            },
          }),
          tx.auditLog.findFirst({
            where: {
              actorId: systemAdmin.id,
              action: 'LICENSE_ASSIGNED',
              targetType: 'UserTenantLicense',
              targetId: serviceAssignment.id,
            },
          }),
        ]);

        // Only create audit logs if they don't already exist
        if (!existingUserAuditLog) {
          await tx.auditLog.create({
            data: {
              actorId: systemAdmin.id,
              action: 'USER_CREATED',
              targetType: 'User',
              targetId: serviceAgent.id,
            },
          });
        }

        if (!existingLicenseAuditLog) {
          await tx.auditLog.create({
            data: {
              actorId: systemAdmin.id,
              action: 'LICENSE_ASSIGNED',
              targetType: 'UserTenantLicense',
              targetId: serviceAssignment.id,
            },
          });
        }

        if (!existingUserAuditLog || !existingLicenseAuditLog) {
          console.log('✅ Audit logs created');
        } else {
          console.log('⏭️ Audit logs already exist, skipping');
        }
              } else {
          console.log('⏭️ Skipping audit logs (disabled)');
        }
        // Track seed version for ops visibility
        const seedVersion = await (tx as any).seedVersionHistory.upsert({
          where: { id: 1 },
          update: {
            version: SEED_VERSION,
            lastRunAt: NOW,
            environment: IS_PROD ? 'production' : 'development',
            config: {
              seedVersion: SEED_VERSION,
              enableDemoProbeUsers: ENABLE_DEMO_PROBE_USERS,
              enableAuditLogs: ENABLE_AUDIT_LOGS,
              tenantName: SEED_CONFIG.tenantName,
              adminEmail: SEED_CONFIG.adminEmail,
              serviceEmail: SEED_CONFIG.serviceEmail,
              salesEmail: SEED_CONFIG.salesEmail,
              probeEmail: SEED_CONFIG.probeEmail,
              probeTenantName: SEED_CONFIG.probeTenantName,
            },
            summary: {
              tenantsCreated: 1,
              usersCreated: ENABLE_DEMO_PROBE_USERS ? 3 : 2, // system admin + service + sales + (probe if enabled)
              licensesCreated: 2,
              licenseAssignmentsCreated: 2,
              customersCreated: 2,
              contactsCreated: 2,
              auditLogsCreated: ENABLE_AUDIT_LOGS ? 2 : 0,
              probeUsersEnabled: ENABLE_DEMO_PROBE_USERS,
            },
          },
          create: {
            id: 1,
            version: SEED_VERSION,
            lastRunAt: NOW,
            environment: IS_PROD ? 'production' : 'development',
            config: {
              seedVersion: SEED_VERSION,
              enableDemoProbeUsers: ENABLE_DEMO_PROBE_USERS,
              enableAuditLogs: ENABLE_AUDIT_LOGS,
              tenantName: SEED_CONFIG.tenantName,
              adminEmail: SEED_CONFIG.adminEmail,
              serviceEmail: SEED_CONFIG.serviceEmail,
              salesEmail: SEED_CONFIG.salesEmail,
              probeEmail: SEED_CONFIG.probeEmail,
              probeTenantName: SEED_CONFIG.probeTenantName,
            },
            summary: {
              tenantsCreated: 1,
              usersCreated: ENABLE_DEMO_PROBE_USERS ? 3 : 2,
              licensesCreated: 2,
              licenseAssignmentsCreated: 2,
              customersCreated: 2,
              contactsCreated: 2,
              auditLogsCreated: ENABLE_AUDIT_LOGS ? 2 : 0,
              probeUsersEnabled: ENABLE_DEMO_PROBE_USERS,
            },
          },
        });
        console.log('✅ Seed version tracked:', seedVersion.version, '(from', SEED_VERSION, ')');

        // Return summary data
        return {
          tenant,
          systemAdmin,
          serviceAgent,
          salesRep,
          probeTenant,
          probeUser,
          serviceLicense,
          salesLicense,
          serviceAssignment,
          salesAssignment,
          customer1,
          customer2,
          seedVersion,
        };

    } catch (error: any) {
      console.error('❌ Seed transaction failed:', error?.message || error);

      const code = error?.code as string | undefined;
      if (code === 'P2002') console.error('💥 Unique constraint violation');
      else if (code === 'P2003') console.error('💥 Foreign key constraint violation');
      else if (code === 'P2025') console.error('💥 Record not found for update');

      throw error; // Re-throw to rollback transaction
    }
  });
}

// Main execution with proper error handling
main()
  .then((result) => {
            console.log('🎉 Database seed completed successfully!');
        console.log('\n📋 Test Data Summary:');
        console.log(`- Tenant: ${result.tenant.name} (${result.tenant.id})`);
        console.log(`- System Admin: ${result.systemAdmin.email}`);
        console.log(`- Service Agent: ${result.serviceAgent.email} (${result.serviceLicense.licenseType})`);
        console.log(`- Sales Rep: ${result.salesRep.email} (${result.salesLicense.licenseType})`);
        
        if (result.probeTenant && result.probeUser) {
          console.log(`- Probe Tenant: ${result.probeTenant.name}`);
          console.log(`- Probe User: ${result.probeUser.email}`);
        }
        
        console.log(`- Customers: ${result.customer1.name}, ${result.customer2.name}`);
        console.log('\n🧪 Test Endpoints:');
        console.log(`- Service API: GET /service/tickets (requires SMART_SERVICE)`);
        console.log(`- Sales API: GET /sales/opportunities (requires SMART_SALES)`);
        console.log(`- License Check: GET /licenses/check?userId=${result.serviceAgent.id}&tenantId=${result.tenant.id}&licenseType=SMART_SERVICE`);
        console.log(`- Health Check: GET /health/license?tenantId=${result.tenant.id}&licenseType=SMART_SERVICE`);
        console.log(`- Seat Usage: GET /licenses/seats/${result.tenant.id}`);
        console.log(`- Expiring Licenses: GET /licenses/expiring?days=90`);
        console.log(`- Guardrails Dashboard: GET /guardrails/dashboard`);
        console.log(`- Cost Analysis: GET /guardrails/cost-analysis`);
        console.log('\n🔧 Environment Configuration:');
        console.log(`- Tenant Name: ${SEED_CONFIG.tenantName}`);
        console.log(`- Admin Email: ${SEED_CONFIG.adminEmail}`);
        console.log(`- Service Email: ${SEED_CONFIG.serviceEmail}`);
        console.log(`- Sales Email: ${SEED_CONFIG.salesEmail}`);
        if (ENABLE_DEMO_PROBE_USERS) {
          console.log(`- Probe Email: ${SEED_CONFIG.probeEmail}`);
          console.log(`- Probe Tenant: ${SEED_CONFIG.probeTenantName}`);
        }
        console.log('\n📊 Seed Version Info:');
        console.log(`- Version: ${result.seedVersion?.version || '1.0.0'}`);
        console.log(`- Environment: ${result.seedVersion?.environment || (IS_PROD ? 'production' : 'development')}`);
        console.log(`- Last Run: ${result.seedVersion?.lastRunAt || NOW.toISOString()}`);
      })
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });