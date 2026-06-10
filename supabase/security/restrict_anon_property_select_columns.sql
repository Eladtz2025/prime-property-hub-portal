-- P7 (part 2) — Restrict ANONYMOUS read access on `properties` to public listing
-- columns only, hiding owner PII (name/phone/email), the internal "contact" person,
-- CRM fields and financials (acquisition/renovation/tax/committee, contact notes,
-- last_contact_date) from unauthenticated REST access.
--
-- ⚠️  DEPLOY ORDER MATTERS — this is NOT in supabase/migrations/ on purpose.
--     Apply it ONLY AFTER the frontend that selects explicit columns is live.
--     It revokes the table-level SELECT and re-grants a column allow-list, which breaks
--     any anonymous `select('*')` on properties. The two public anon `select('*')` paths
--     (he/en NewDevelopments) were converted to explicit columns in this change set, and
--     the public hooks (usePublicProperties / usePublicProperty) already select explicit
--     columns — but the OLD deployed bundle still uses `*`, so apply this after deploy.
--
-- Authenticated/admin access is unaffected (the `authenticated` role keeps full access;
-- RLS still scopes rows by role/ownership).

REVOKE SELECT ON public.properties FROM anon;

GRANT SELECT (
  id, property_number, address, city, neighborhood, neighborhood_en,
  title, title_en, description, description_en, property_type, status,
  rooms, rooms_range, property_size, size_range, floor, building_floors,
  bathrooms, parking, elevator, balcony, yard, mamad, roof, furnished,
  balcony_yard_size, custom_features, show_management_badge, monthly_rent,
  current_market_value, featured, available, show_on_website, units_count,
  has_storage, project_status, tracking_url, co_brokerage_status,
  assigned_user_id, created_at, updated_at
) ON public.properties TO anon;

-- Columns intentionally NOT granted to anon (hidden):
--   owner_name, owner_phone, owner_email, contact_name, contact_phone,
--   contact_status, contact_notes, contact_attempts, last_contact_date,
--   acquisition_cost, renovation_costs, municipal_tax, building_committee_fee,
--   notes, deleted_at
