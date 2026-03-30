-- ===========================================================
-- Migration: Convert resumes.data from OID (LOB) to bytea
-- Run this ONCE against your local and production PostgreSQL DB
-- BEFORE restarting the backend with the updated code.
--
-- Why: The @Lob annotation previously stored resume data as
-- a PostgreSQL Large Object (OID), which requires an active
-- transaction to stream. The fix removes @Lob and uses bytea
-- (inline binary) which needs no special transaction handling.
-- ===========================================================

-- Step 1: Add a temporary bytea column
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS data_new bytea;

-- Step 2: Copy OID data to bytea
--   lo_get() reads a large object by OID and returns bytea.
--   Cast the existing 'data' column (stored as oid) to bytea via lo_get.
UPDATE resumes SET data_new = lo_get(data::oid);

-- Step 3: Drop the old OID column
ALTER TABLE resumes DROP COLUMN data;

-- Step 4: Rename new column to 'data'
ALTER TABLE resumes RENAME COLUMN data_new TO data;

-- Step 5: Add NOT NULL constraint back
ALTER TABLE resumes ALTER COLUMN data SET NOT NULL;

-- Done! The resumes table now stores PDF data as bytea.
