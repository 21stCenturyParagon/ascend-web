-- Templates schema and storage setup for leaderboard template builder.
-- Run in Supabase SQL editor (or supabase CLI) while connected to your project.
-- KISS/DRY: guard against re-creation using IF NOT EXISTS checks where possible.

-- Create storage bucket for template backgrounds (public read).
insert into storage.buckets (id, name, public)
values ('template-images', 'template-images', true)
on conflict (id) do nothing;

-- Templates table
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  width int not null,
  height int not null,
  background_path text not null,
  config jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure updated_at tracks changes
create or replace function public.set_templates_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists templates_set_updated_at on public.templates;
create trigger templates_set_updated_at
before update on public.templates
for each row execute procedure public.set_templates_updated_at();

alter table public.templates enable row level security;

-- RLS: owner only
drop policy if exists "templates-select-own" on public.templates;
create policy "templates-select-own"
  on public.templates
  for select
  using (auth.uid() = user_id);

drop policy if exists "templates-insert-own" on public.templates;
create policy "templates-insert-own"
  on public.templates
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "templates-update-own" on public.templates;
create policy "templates-update-own"
  on public.templates
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "templates-delete-own" on public.templates;
create policy "templates-delete-own"
  on public.templates
  for delete
  using (auth.uid() = user_id);

-- Storage RLS for template images
alter table storage.objects enable row level security;

drop policy if exists "template-images-read" on storage.objects;
create policy "template-images-read"
  on storage.objects
  for select
  using (bucket_id = 'template-images');

drop policy if exists "template-images-insert-own" on storage.objects;
create policy "template-images-insert-own"
  on storage.objects
  for insert
  with check (
    bucket_id = 'template-images' and (owner = auth.uid() or owner is null)
  );

drop policy if exists "template-images-update-own" on storage.objects;
create policy "template-images-update-own"
  on storage.objects
  for update
  using (
    bucket_id = 'template-images' and auth.uid() = owner
  )
  with check (
    bucket_id = 'template-images' and auth.uid() = owner
  );

drop policy if exists "template-images-delete-own" on storage.objects;
create policy "template-images-delete-own"
  on storage.objects
  for delete
  using (
    bucket_id = 'template-images' and auth.uid() = owner
  );


