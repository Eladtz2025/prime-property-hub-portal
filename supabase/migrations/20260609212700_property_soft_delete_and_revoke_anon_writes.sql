-- Properties audit fixes (2026-06-09)
--
-- P6  — Soft delete: the app previously hard-DELETEd properties, which cascaded to
--       tenants, rent_payments, financial_records, documents and images. The app now
--       sets deleted_at instead. This column is required by the admin read filter
--       (`.is('deleted_at', null)`) and the soft-delete mutation. SAFE to apply anytime;
--       apply BEFORE/with deploying the updated frontend.
--
-- P7 (part 1) — Revoke the anonymous role's latent write grants on properties. RLS
--       already blocks anon writes; removing the grants is defense-in-depth. SELECT is
--       left unchanged here and tightened in the companion script
--       (supabase/security/restrict_anon_property_select_columns.sql) AFTER deploy.

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_properties_deleted_at ON public.properties (deleted_at);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.properties FROM anon;
