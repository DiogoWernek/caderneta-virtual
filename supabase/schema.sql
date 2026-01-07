create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_all" on public.profiles
  for select using (true);

create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

do $$
begin
  if not exists (select 1 from pg_type where typname = 'marital_status') then
    create type marital_status as enum ('solteiro','casado','viuvo','separado');
  end if;
end $$;

create table if not exists public.persons (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users (id) on delete set null
);

alter table public.persons
  add column if not exists nome text,
  add column if not exists idade int check (idade >= 0),
  add column if not exists tempo_crente_anos int check (tempo_crente_anos >= 0),
  add column if not exists numero_prontuario text,
  add column if not exists estado_civil marital_status,
  add column if not exists conjugue_nome text,
  add column if not exists conjugue_idade int check (conjugue_idade >= 0),
  add column if not exists conjugue_tempo_crente_anos int check (conjugue_tempo_crente_anos >= 0),
  add column if not exists congregacao_comum text,
  add column if not exists cep text,
  add column if not exists endereco text,
  add column if not exists filhos_idades int[],
  add column if not exists filhas_idades int[],
  add column if not exists filhos_qtd int check (filhos_qtd >= 0),
  add column if not exists filhas_qtd int check (filhas_qtd >= 0);

create index if not exists persons_prontuario_idx on public.persons (numero_prontuario);

alter table public.persons enable row level security;

create policy "persons_select_own" on public.persons
  for select using (created_by = auth.uid());

create policy "persons_insert_own" on public.persons
  for insert with check (created_by = auth.uid());

create policy "persons_update_own" on public.persons
  for update using (created_by = auth.uid());

create policy "persons_delete_own" on public.persons
  for delete using (created_by = auth.uid());

create index if not exists persons_nome_idx on public.persons (lower(nome));

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists persons_set_updated_at on public.persons;
create trigger persons_set_updated_at
  before update on public.persons
  for each row execute procedure public.set_updated_at();
