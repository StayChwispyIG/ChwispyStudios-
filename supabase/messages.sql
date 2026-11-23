-- ==========================================================================
-- Chwispy Studio client portal: Messages (a chat between each client and
-- the studio). Run after schema.sql and the Files migration. Safe to re-run.
--
-- Who can do what (enforced here, not in the web page):
--   * A client reads only their own thread and can only post as "client"
--     into their own thread.
--   * An admin reads every thread and can only post as "studio".
--   * Nobody can edit or backdate a message. Only an admin can delete one.
--   * "Read" marks are set through mark_thread_read(), which only ever
--     marks the other side's messages in a thread the caller may see.
--   * Signed-out visitors get nothing.
-- ==========================================================================

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  sender     text not null check (sender in ('client', 'studio')),
  body       text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at    timestamptz
);
create index if not exists messages_thread_idx on public.messages (client_id, created_at);
create index if not exists messages_unread_idx on public.messages (sender, client_id) where read_at is null;

-- The server sets the time and clears the read mark on every new message,
-- and a client can't post more than 20 messages in 10 minutes.
create or replace function public.messages_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.created_at := now();
  new.read_at := null;
  new.body := btrim(new.body);
  if new.sender = 'client' and (
    select count(*) from public.messages
    where client_id = new.client_id and sender = 'client' and created_at > now() - interval '10 minutes'
  ) >= 20 then
    raise exception 'Too many messages at once. Wait a few minutes and try again.';
  end if;
  return new;
end $$;
drop trigger if exists messages_before_insert on public.messages;
create trigger messages_before_insert before insert on public.messages
  for each row execute function public.messages_before_insert();

alter table public.messages enable row level security;

drop policy if exists "read own thread" on public.messages;
create policy "read own thread" on public.messages
  for select to authenticated
  using (client_id = public.my_client_id() or public.is_admin());

drop policy if exists "post as yourself" on public.messages;
create policy "post as yourself" on public.messages
  for insert to authenticated
  with check (
    (sender = 'client' and client_id = public.my_client_id())
    or (sender = 'studio' and public.is_admin())
  );

drop policy if exists "admin deletes messages" on public.messages;
create policy "admin deletes messages" on public.messages
  for delete to authenticated using (public.is_admin());

-- No update policy: messages can't be edited through the API.
revoke all on public.messages from anon;
revoke update on public.messages from authenticated;

-- Mark the other side's messages in one thread as read.
create or replace function public.mark_thread_read(p_client uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    update public.messages set read_at = now()
      where client_id = p_client and sender = 'client' and read_at is null;
  elsif p_client is not null and p_client = public.my_client_id() then
    update public.messages set read_at = now()
      where client_id = p_client and sender = 'studio' and read_at is null;
  end if;
end $$;
revoke all on function public.mark_thread_read(uuid) from public, anon;
grant execute on function public.mark_thread_read(uuid) to authenticated;

-- Live updates: new messages show up without a refresh. Realtime still
-- applies the read rules above, so each person only hears their own thread.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
