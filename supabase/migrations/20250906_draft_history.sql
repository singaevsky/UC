-- file: supabase/migrations/20250906_draft_history.sql
create table if not exists public.draft_cakes_history (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.draft_cakes (id) on delete cascade,
  config jsonb not null,
  author_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz default now()
);
-- Индекс для быстрого поиска по draft_id
create index if not exists draft_history_draft_idx on public.draft_cakes_history (draft_id);
-- RLS: только владелец может читать свою историю
alter table public.draft_cakes_history enable row level security;
create policy "Users can view own draft history" on public.draft_cakes_history
  for select using (auth.uid() = author_user_id);
-- Insert доступен только серверному коду (с ролью service_role). Можно оставить без политики, но лучше ограничить.
