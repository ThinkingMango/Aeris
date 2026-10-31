-- Supabase's pre-2026 project defaults: every new public table and function
-- was granted to anon, authenticated and service_role automatically.
-- The schema must be safe even when these defaults are in force.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
