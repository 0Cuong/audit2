-- Privacy-safe placeholder migration.
-- Recovered application rows contain private relationship and personal data.
-- Do not commit recovered rows to migrations or deploy seed data automatically.
-- Generate a local-only seed with: node scripts/export-recovered-to-d1.mjs
-- The generator writes to recovered/private/seed-recovered.local.sql (ignored by Git).
-- Apply that local file manually only after source/target counts and media have been verified.
SELECT 1;
