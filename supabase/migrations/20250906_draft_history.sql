-- file: supabase/migrations/20250906_draft_history.sql
create table if not exists public.draft_cakes_history (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references public.draft_cakes(id) on delete cascade,
  config jsonb not null,
  created_at timestamptz default now()
);
