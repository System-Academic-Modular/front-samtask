-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  daily_goal integer default 5,
  pomodoro_duration integer default 25,
  short_break integer default 5,
  long_break integer default 15,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Create categories/lists table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text default '#3b82f6',
  icon text default 'folder',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;

create policy "categories_select_own" on public.categories for select using (auth.uid() = user_id);
create policy "categories_insert_own" on public.categories for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories for update using (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories for delete using (auth.uid() = user_id);

-- Create tags table
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text default '#10b981',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tags enable row level security;

create policy "tags_select_own" on public.tags for select using (auth.uid() = user_id);
create policy "tags_insert_own" on public.tags for insert with check (auth.uid() = user_id);
create policy "tags_update_own" on public.tags for update using (auth.uid() = user_id);
create policy "tags_delete_own" on public.tags for delete using (auth.uid() = user_id);

-- Create tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  parent_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  description text,
  status text default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  due_date timestamp with time zone,
  estimated_minutes integer,
  actual_minutes integer default 0,
  is_recurring boolean default false,
  recurrence_pattern text,
  position integer default 0,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tasks enable row level security;

create policy "tasks_select_own" on public.tasks for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on public.tasks for update using (auth.uid() = user_id);
create policy "tasks_delete_own" on public.tasks for delete using (auth.uid() = user_id);

-- Create task_tags junction table
create table if not exists public.task_tags (
  task_id uuid not null references public.tasks(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (task_id, tag_id)
);

alter table public.task_tags enable row level security;

create policy "task_tags_select_own" on public.task_tags for select using (
  exists (select 1 from public.tasks where tasks.id = task_tags.task_id and tasks.user_id = auth.uid())
);
create policy "task_tags_insert_own" on public.task_tags for insert with check (
  exists (select 1 from public.tasks where tasks.id = task_tags.task_id and tasks.user_id = auth.uid())
);
create policy "task_tags_delete_own" on public.task_tags for delete using (
  exists (select 1 from public.tasks where tasks.id = task_tags.task_id and tasks.user_id = auth.uid())
);

-- Create sessoes_pomodoro table
create table if not exists public.sessoes_pomodoro (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  duration_minutes integer not null,
  type text default 'work' check (type in ('work', 'short_break', 'long_break')),
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sessoes_pomodoro enable row level security;

create policy "pomodoro_select_own" on public.sessoes_pomodoro for select using (auth.uid() = user_id);
create policy "pomodoro_insert_own" on public.sessoes_pomodoro for insert with check (auth.uid() = user_id);

-- Create emotional_checkins table
create table if not exists public.emotional_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood integer not null check (mood >= 1 and mood <= 5),
  energy integer not null check (energy >= 1 and energy <= 5),
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.emotional_checkins enable row level security;

create policy "checkins_select_own" on public.emotional_checkins for select using (auth.uid() = user_id);
create policy "checkins_insert_own" on public.emotional_checkins for insert with check (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_tasks_category_id on public.tasks(category_id);
create index if not exists idx_tasks_parent_id on public.tasks(parent_id);
create index if not exists idx_categories_user_id on public.categories(user_id);
create index if not exists idx_tags_user_id on public.tags(user_id);
create index if not exists idx_pomodoro_user_id on public.sessoes_pomodoro(user_id);
create index if not exists idx_checkins_user_id on public.emotional_checkins(user_id);
