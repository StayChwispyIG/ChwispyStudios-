-- ==========================================================================
-- Chwispy Studio client portal: database and file rules for Supabase.
-- Paste this whole file into Supabase > SQL Editor > New query > Run.
-- Safe to run again; it only creates what's missing.
--
-- Who can see what (enforced here, in the database, not in the web page):
--   * A client can READ only the project whose email matches the email they
--     signed in with (their inbox proved it with a 6-digit code), plus that
--     project's invoices, contracts and files. They can change nothing.
--   * An admin (an email listed in public.admins) can read and change all.
--   * Everyone else gets nothing back.
--
-- After running it, add yourself as admin (use your own studio email):
--   insert into public.admins (email) values ('you@example.com');
-- ==========================================================================

create extension if not exists pgcrypto;

create table if not exists public.admins (
  email text primary key check (email = lower(email))
);

create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  company     text,
  email       text not null unique check (email = lower(email)),
  project     text,
  kind        text not null default 'web' check (kind in ('web','shopify','video','design')),
  stage       int  not null default 0 check (stage >= 0),
  done        boolean not null default false,
  stage_dates jsonb not null default '{}'::jsonb,
  note        text,
  note_at     date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.invoices (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  number     text not null,
  title      text not null,
  amount     int  not null check (amount >= 0),          -- cents
  issued_on  date,
  due_on     date,
  status     text not null default 'due' check (status in ('upcoming','due','paid')),
  paid_on    date,
  file_path  text,
  pay_url    text check (pay_url is null or pay_url = '' or pay_url like 'https://%'),
  created_at timestamptz not null default now()
);

create table if not exists public.contracts (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  title      text not null,
  status     text not null default 'sign' check (status in ('sign','signed')),
  sent_on    date,
  signed_on  date,
  file_path  text,
  sign_url   text check (sign_url is null or sign_url = '' or sign_url like 'https://%'),
  created_at timestamptz not null default now()
);

create index if not exists invoices_client_idx  on public.invoices (client_id);
create index if not exists contracts_client_idx on public.contracts (client_id);

-- The signed-in person's verified email, lower-cased.
create or replace function public.my_email() returns text
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where email = public.my_email())
$$;

-- The client row this person may see, if any.
create or replace function public.my_client_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.clients where email = public.my_email() and public.my_email() <> ''
$$;

alter table public.admins    enable row level security;
alter table public.clients   enable row level security;
alter table public.invoices  enable row level security;
alter table public.contracts enable row level security;

-- Nobody reads the admin list through the API; is_admin() checks it.
drop policy if exists "no access" on public.admins;

drop policy if exists "client reads own project" on public.clients;
create policy "client reads own project" on public.clients
  for select to authenticated using (email = public.my_email() or public.is_admin());
drop policy if exists "admin writes clients" on public.clients;
create policy "admin writes clients" on public.clients
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "client reads own invoices" on public.invoices;
create policy "client reads own invoices" on public.invoices
  for select to authenticated using (client_id = public.my_client_id() or public.is_admin());
drop policy if exists "admin writes invoices" on public.invoices;
create policy "admin writes invoices" on public.invoices
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "client reads own contracts" on public.contracts;
create policy "client reads own contracts" on public.contracts
  for select to authenticated using (client_id = public.my_client_id() or public.is_admin());
drop policy if exists "admin writes contracts" on public.contracts;
create policy "admin writes contracts" on public.contracts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Signed-out visitors get no table access at all.
revoke all on public.admins, public.clients, public.invoices, public.contracts from anon;

-- ---- Files: a private bucket, one folder per client id ----------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-files', 'client-files', false, 20971520, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "client reads own files" on storage.objects;
create policy "client reads own files" on storage.objects
  for select to authenticated using (
    bucket_id = 'client-files'
    and ((storage.foldername(name))[1] = public.my_client_id()::text or public.is_admin())
  );
drop policy if exists "admin uploads files" on storage.objects;
create policy "admin uploads files" on storage.objects
  for insert to authenticated with check (bucket_id = 'client-files' and public.is_admin());
drop policy if exists "admin changes files" on storage.objects;
create policy "admin changes files" on storage.objects
  for update to authenticated using (bucket_id = 'client-files' and public.is_admin());
drop policy if exists "admin removes files" on storage.objects;
create policy "admin removes files" on storage.objects
  for delete to authenticated using (bucket_id = 'client-files' and public.is_admin());
