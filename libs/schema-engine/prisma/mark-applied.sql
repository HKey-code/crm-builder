-- Mark the current migration as already applied
-- This tells Prisma that the schema is already up-to-date

INSERT INTO "_prisma_migrations" (
    "id",
    "checksum",
    "finished_at",
    "migration_name",
    "logs",
    "rolled_back_at",
    "started_at",
    "applied_steps_count"
) VALUES (
    '20250721183616_init_schema',
    'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
    NOW(),
    '20250721183616_init_schema',
    NULL,
    NULL,
    NOW(),
    1
) ON CONFLICT ("id") DO NOTHING; 