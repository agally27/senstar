-- Defence-in-depth on identity storage (SECURITY_AND_PRIVACY.md §3).
-- Guardian identity data gets the same database-level posture as tenant data:
-- RLS on, no permissive policies, so only the owner/migration role reaches
-- rows directly.
ALTER TABLE "auth_user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_verification" ENABLE ROW LEVEL SECURITY;
