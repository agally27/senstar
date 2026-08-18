-- ADR-0009 steps 1-2: make row-level security actually bind.
--
-- ENABLE ROW LEVEL SECURITY (migrations 0001, 0003) does NOT apply to the
-- table owner, and a single DATABASE_URL served both the migrator and the
-- application — so the app connected as owner and layer 3 was inert. Two
-- independent changes are needed; neither suffices alone:
--
--   1. FORCE ROW LEVEL SECURITY, which binds the owner as well.
--   2. A non-owning application role for the app to connect as.
--
-- Neither defends against a superuser or a role holding BYPASSRLS, which is
-- why those attributes are asserted in packages/db/test/rls.test.ts rather
-- than assumed.
--
-- IMPORTANT (Neon): this role MUST be created with SQL, as it is here. Roles
-- created through the Neon Console, CLI or API are granted neon_superuser,
-- which carries BYPASSRLS and silently defeats everything below.
-- See https://neon.com/docs/manage/roles
--
-- The role is created without a password. Credentials are environment-
-- specific and never belong in a migration; each environment sets one with
-- ALTER ROLE "senstar_app" WITH PASSWORD '...'. Until then the role exists
-- and holds grants, but cannot connect.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'senstar_app') THEN
    -- NOSUPERUSER/NOBYPASSRLS are the defaults; stated explicitly because
    -- they are the point of the role, not an incidental property.
    CREATE ROLE "senstar_app" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END
$$;--> statement-breakpoint
GRANT USAGE ON SCHEMA "public" TO "senstar_app";--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA "public" TO "senstar_app";--> statement-breakpoint
-- Future tables created by the migrator are reachable by the app without a
-- follow-up grant; RLS still governs which rows it sees.
ALTER DEFAULT PRIVILEGES IN SCHEMA "public" GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "senstar_app";--> statement-breakpoint
-- Bind the owner too. Standing rule: every tenant-scoped table gets both
-- ENABLE and FORCE in the same migration that creates it.
ALTER TABLE "organisations" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_user" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_session" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_account" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "auth_verification" FORCE ROW LEVEL SECURITY;
