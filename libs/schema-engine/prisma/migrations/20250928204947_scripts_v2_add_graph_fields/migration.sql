-- Add fields for graphJson, variablesDef, entryNodeKey to guidance.ScriptVersion
ALTER TABLE "guidance"."ScriptVersion"
  ADD COLUMN IF NOT EXISTS "entryNodeKey" TEXT,
  ADD COLUMN IF NOT EXISTS "graphJson" JSONB,
  ADD COLUMN IF NOT EXISTS "variablesDef" JSONB;
