-- Ensure required extensions for UUID generation are available
create extension if not exists "pgcrypto";

-- Domain types
create type public.reading_status as enum ('plan', 'reading', 'done');

-- Core tables -----------------------------------------------------------------

create table public.manga (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  slug text not null,
  base_url text not null,
  cover_image text,
  total_chapters integer,
  status public.reading_status not null default 'plan',
  tags text[] not null default '{}',
  last_read jsonb,
  date_added timestamptz not null default timezone('utc', now()),
  date_updated timestamptz not null default timezone('utc', now()),
  constraint manga_slug_user_unique unique (user_id, slug)
);

create index manga_slug_idx on public.manga (slug);
create index manga_user_idx on public.manga (user_id);

create table public.chapters (
  id text primary key,
  manga_id text not null references public.manga(id) on delete cascade,
  chapter_number integer not null,
  title text,
  total_pages integer,
  is_discovered boolean not null default false,
  last_read_page integer,
  progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint chapters_manga_number_unique unique (manga_id, chapter_number)
);

create index chapters_manga_idx on public.chapters (manga_id);
create index chapters_progress_idx on public.chapters (progress);

create table public.pages (
  id text primary key,
  chapter_id text not null references public.chapters(id) on delete cascade,
  page_number integer not null,
  image_url text not null,
  is_cached boolean not null default false,
  load_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint pages_chapter_number_unique unique (chapter_id, page_number)
);

create index pages_chapter_idx on public.pages (chapter_id);

create table public.settings (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index settings_user_unique_idx on public.settings (user_id) where user_id is not null;

-- Timestamp helpers -----------------------------------------------------------

create or replace function public.set_updated_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create or replace function public.set_date_updated()
returns trigger as $$
begin
  new.date_updated = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger update_manga_timestamp
before update on public.manga
for each row execute function public.set_date_updated();

create trigger update_chapters_timestamp
before update on public.chapters
for each row execute function public.set_updated_timestamp();

create trigger update_pages_timestamp
before update on public.pages
for each row execute function public.set_updated_timestamp();

create trigger update_settings_timestamp
before update on public.settings
for each row execute function public.set_updated_timestamp();

-- Row Level Security ----------------------------------------------------------

alter table public.manga enable row level security;
alter table public.chapters enable row level security;
alter table public.pages enable row level security;
alter table public.settings enable row level security;

-- Manga policies
create policy "anon can manage global manga"
on public.manga
for all
using (auth.role() = 'anon' and user_id is null)
with check (auth.role() = 'anon' and user_id is null);

create policy "authenticated users manage own manga"
on public.manga
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Chapters policies
create policy "anon can manage global chapters"
on public.chapters
for all
using (
  auth.role() = 'anon'
  and exists (
    select 1 from public.manga m
    where m.id = public.chapters.manga_id
      and m.user_id is null
  )
)
with check (
  auth.role() = 'anon'
  and exists (
    select 1 from public.manga m
    where m.id = public.chapters.manga_id
      and m.user_id is null
  )
);

create policy "authenticated users manage own chapters"
on public.chapters
for all
using (
  exists (
    select 1 from public.manga m
    where m.id = public.chapters.manga_id
      and m.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.manga m
    where m.id = public.chapters.manga_id
      and m.user_id = auth.uid()
  )
);

-- Pages policies
create policy "anon can manage global pages"
on public.pages
for all
using (
  auth.role() = 'anon'
  and exists (
    select 1 from public.chapters c
    join public.manga m on m.id = c.manga_id
    where c.id = public.pages.chapter_id
      and m.user_id is null
  )
)
with check (
  auth.role() = 'anon'
  and exists (
    select 1 from public.chapters c
    join public.manga m on m.id = c.manga_id
    where c.id = public.pages.chapter_id
      and m.user_id is null
  )
);

create policy "authenticated users manage own pages"
on public.pages
for all
using (
  exists (
    select 1 from public.chapters c
    join public.manga m on m.id = c.manga_id
    where c.id = public.pages.chapter_id
      and m.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.chapters c
    join public.manga m on m.id = c.manga_id
    where c.id = public.pages.chapter_id
      and m.user_id = auth.uid()
  )
);

-- Settings policies
create policy "anon can manage global settings"
on public.settings
for all
using (auth.role() = 'anon' and user_id is null)
with check (auth.role() = 'anon' and user_id is null);

create policy "authenticated users manage own settings"
on public.settings
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
