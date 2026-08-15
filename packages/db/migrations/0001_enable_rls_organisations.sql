-- Defence-in-depth (MULTI_TENANCY.md §3 layer 3): RLS on from the tenant root.
-- The application connects as a non-superuser role, so with no permissive
-- policies defined yet, RLS default-denies direct row access outside the
-- migration/owner role. Policies arrive with the ActorContext session wiring.
ALTER TABLE "organisations" ENABLE ROW LEVEL SECURITY;
