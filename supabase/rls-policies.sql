-- =============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR MULTI-TENANT TESORERÍA
-- =============================================================
-- Run this entire script in the Supabase SQL Editor.
-- It is idempotent: DROP IF EXISTS + CREATE ensures re-runnability.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. ENABLE RLS ON ALL PUBLIC TABLES
-- ─────────────────────────────────────────────────────────────

ALTER TABLE "Organization"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BankAccount"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClasificadorCOG"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClasificadorCRI"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IngresoContable"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EgresoContable"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Fuente"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Departamento"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Firmante"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemConfig"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemLog"        ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────
-- 2. HELPER FUNCTION: get_current_org_id()
-- ─────────────────────────────────────────────────────────────
-- Returns the organizationId of the currently authenticated
-- Supabase user by looking up the public "User" table.
-- Uses SECURITY DEFINER so it can read "User" even when RLS
-- is enabled (the function runs as the DB owner).
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "organizationId"
  FROM "User"
  WHERE id = auth.uid()::TEXT
  LIMIT 1;
$$;


-- ─────────────────────────────────────────────────────────────
-- 3. POLICIES FOR "Organization"
-- ─────────────────────────────────────────────────────────────
-- Users can only SELECT their own organization.
-- INSERT is allowed during registration (handled in section 6).
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "org_select_own" ON "Organization";
CREATE POLICY "org_select_own" ON "Organization"
  FOR SELECT
  USING (id = public.get_current_org_id());

DROP POLICY IF EXISTS "org_update_own" ON "Organization";
CREATE POLICY "org_update_own" ON "Organization"
  FOR UPDATE
  USING  (id = public.get_current_org_id())
  WITH CHECK (id = public.get_current_org_id());


-- ─────────────────────────────────────────────────────────────
-- 4. POLICIES FOR "User"
-- ─────────────────────────────────────────────────────────────
-- Users can SELECT all members of their organization.
-- Users can UPDATE only their own profile.
-- INSERT is allowed during registration (handled in section 6).
-- ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "user_select_same_org" ON "User";
CREATE POLICY "user_select_same_org" ON "User"
  FOR SELECT
  USING ("organizationId" = public.get_current_org_id());

DROP POLICY IF EXISTS "user_update_own" ON "User";
CREATE POLICY "user_update_own" ON "User"
  FOR UPDATE
  USING (id = auth.uid()::TEXT)
  WITH CHECK (id = auth.uid()::TEXT);


-- ─────────────────────────────────────────────────────────────
-- 5. POLICIES FOR ALL OPERATIONAL TABLES
-- ─────────────────────────────────────────────────────────────
-- Generic pattern: org-scoped SELECT / INSERT / UPDATE / DELETE.
-- ─────────────────────────────────────────────────────────────

-- Helper: macro-like DO block to create 4 standard policies per table.
-- We use a DO block with dynamic SQL so the pattern is DRY.

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'BankAccount',
    'Transaction',
    'ClasificadorCOG',
    'ClasificadorCRI',
    'IngresoContable',
    'EgresoContable',
    'Fuente',
    'Departamento',
    'Firmante',
    'SystemConfig',
    'SystemLog'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    -- SELECT: only rows from user's org
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I',
      tbl || '_select_org', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR SELECT USING ("organizationId" = public.get_current_org_id())',
      tbl || '_select_org', tbl
    );

    -- INSERT: only if organizationId matches user's org
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I',
      tbl || '_insert_org', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR INSERT WITH CHECK ("organizationId" = public.get_current_org_id())',
      tbl || '_insert_org', tbl
    );

    -- UPDATE: only rows from user's org, cannot change org
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I',
      tbl || '_update_org', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR UPDATE USING ("organizationId" = public.get_current_org_id()) WITH CHECK ("organizationId" = public.get_current_org_id())',
      tbl || '_update_org', tbl
    );

    -- DELETE: only rows from user's org
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I',
      tbl || '_delete_org', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR DELETE USING ("organizationId" = public.get_current_org_id())',
      tbl || '_delete_org', tbl
    );
  END LOOP;
END
$$;


-- ─────────────────────────────────────────────────────────────
-- 6. SPECIAL CASE: REGISTRATION FLOW
-- ─────────────────────────────────────────────────────────────
-- During sign-up, the user doesn't yet have a row in "User",
-- so get_current_org_id() returns NULL. We must allow:
--   a) Creating a new Organization
--   b) Inserting themselves into the User table
-- ─────────────────────────────────────────────────────────────

-- 6a. Allow any authenticated user to INSERT a new Organization
--     (only if they are authenticated via Supabase Auth).
DROP POLICY IF EXISTS "org_insert_on_signup" ON "Organization";
CREATE POLICY "org_insert_on_signup" ON "Organization"
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 6b. Allow a user to insert their own profile row.
--     The id must match auth.uid() to prevent impersonation.
DROP POLICY IF EXISTS "user_insert_self" ON "User";
CREATE POLICY "user_insert_self" ON "User"
  FOR INSERT
  WITH CHECK (id = auth.uid()::TEXT);


-- ─────────────────────────────────────────────────────────────
-- 7. GRANT USAGE ON THE HELPER FUNCTION
-- ─────────────────────────────────────────────────────────────
-- Make sure the anon and authenticated roles can call it.

GRANT EXECUTE ON FUNCTION public.get_current_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_org_id() TO anon;


-- ─────────────────────────────────────────────────────────────
-- 8. OPTIONAL: BYPASS RLS FOR SERVICE ROLE
-- ─────────────────────────────────────────────────────────────
-- Your server-side code (Next.js API routes, server actions)
-- should use the Supabase SERVICE_ROLE key, which already
-- bypasses RLS by default. If you use Prisma directly with
-- a connection string, RLS does NOT apply (direct Postgres
-- connections bypass RLS for the db owner).
--
-- If you want a specific Postgres role to bypass RLS:
-- ALTER TABLE "TableName" FORCE ROW LEVEL SECURITY;
-- CREATE POLICY "service_bypass" ON "TableName"
--   FOR ALL
--   TO service_role
--   USING (true)
--   WITH CHECK (true);
-- ─────────────────────────────────────────────────────────────

-- Done! ✅
-- Verify with: SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
