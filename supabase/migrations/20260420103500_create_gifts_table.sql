create table public.gifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price numeric(10, 2),
  image_url text,
  purchase_options jsonb default '[]'::jsonb,
  assigned_to text,
  guest_message text,
  assigned_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.gifts enable row level security;

create policy "public read gifts"
on public.gifts
for select
using (true);

create policy "reserve free gift"
on public.gifts
for update
using (assigned_to is null)
with check (
  assigned_to is not null
  and char_length(assigned_to) > 1
);
