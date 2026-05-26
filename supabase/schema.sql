-- Research Studio — Supabase schema
-- Run this in the Supabase SQL editor for your project.

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  filename text not null,
  storage_path text not null,
  page_count integer,
  file_size_bytes integer,
  tags text[] default '{}',
  created_at timestamptz default now(),
  last_opened_at timestamptz
);

create table if not exists annotations (
  id uuid primary key default gen_random_uuid(),
  doc_id uuid references documents(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  type text check (type in ('highlight', 'sticky_note')),
  page_number integer not null,
  data jsonb not null, -- stores the full Highlight or StickyNote object
  created_at timestamptz default now()
);

-- Row Level Security: users may only read/write their own rows.
alter table documents enable row level security;
alter table annotations enable row level security;

create policy "users own their documents"
  on documents for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users own their annotations"
  on annotations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Private storage bucket for the PDF files.
insert into storage.buckets (id, name, public)
values ('pdfs', 'pdfs', false)
on conflict (id) do nothing;

-- Storage RLS: each user can only access objects under their own user-id prefix.
create policy "users read own pdfs"
  on storage.objects for select
  using (bucket_id = 'pdfs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users upload own pdfs"
  on storage.objects for insert
  with check (bucket_id = 'pdfs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users delete own pdfs"
  on storage.objects for delete
  using (bucket_id = 'pdfs' and auth.uid()::text = (storage.foldername(name))[1]);
