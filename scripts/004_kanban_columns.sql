-- Kanban columns per user (titles/order customizable, status kept compatible with existing flow)

create table if not exists public.kanban_colunas (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pendente', 'em_progresso', 'revisao', 'concluida')),
  titulo text not null,
  ordem integer not null default 0,
  criado_em timestamp with time zone default timezone('utc'::text, now()) not null,
  atualizado_em timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (usuario_id, status)
);

alter table public.kanban_colunas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'kanban_colunas' and policyname = 'kanban_colunas_select_own'
  ) then
    create policy "kanban_colunas_select_own"
      on public.kanban_colunas
      for select
      using (auth.uid() = usuario_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'kanban_colunas' and policyname = 'kanban_colunas_insert_own'
  ) then
    create policy "kanban_colunas_insert_own"
      on public.kanban_colunas
      for insert
      with check (auth.uid() = usuario_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'kanban_colunas' and policyname = 'kanban_colunas_update_own'
  ) then
    create policy "kanban_colunas_update_own"
      on public.kanban_colunas
      for update
      using (auth.uid() = usuario_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'kanban_colunas' and policyname = 'kanban_colunas_delete_own'
  ) then
    create policy "kanban_colunas_delete_own"
      on public.kanban_colunas
      for delete
      using (auth.uid() = usuario_id);
  end if;
end $$;

create index if not exists idx_kanban_colunas_usuario_ordem
  on public.kanban_colunas(usuario_id, ordem);

-- Backfill default columns for existing users
insert into public.kanban_colunas (usuario_id, status, titulo, ordem)
select u.id, 'pendente', 'A FAZER', 0 from auth.users u
on conflict (usuario_id, status) do nothing;

insert into public.kanban_colunas (usuario_id, status, titulo, ordem)
select u.id, 'em_progresso', 'EM FOCO', 1 from auth.users u
on conflict (usuario_id, status) do nothing;

insert into public.kanban_colunas (usuario_id, status, titulo, ordem)
select u.id, 'revisao', 'REVISAO', 2 from auth.users u
on conflict (usuario_id, status) do nothing;

insert into public.kanban_colunas (usuario_id, status, titulo, ordem)
select u.id, 'concluida', 'CONCLUIDAS', 3 from auth.users u
on conflict (usuario_id, status) do nothing;

create or replace function public.seed_kanban_columns_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.kanban_colunas (usuario_id, status, titulo, ordem)
  values
    (new.id, 'pendente', 'A FAZER', 0),
    (new.id, 'em_progresso', 'EM FOCO', 1),
    (new.id, 'revisao', 'REVISAO', 2),
    (new.id, 'concluida', 'CONCLUIDAS', 3)
  on conflict (usuario_id, status) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_kanban_columns on auth.users;

create trigger on_auth_user_created_kanban_columns
  after insert on auth.users
  for each row
  execute function public.seed_kanban_columns_for_new_user();
