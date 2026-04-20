create table public.event_settings (
  id integer primary key default 1 check (id = 1),
  child_name text not null,
  event_date timestamptz not null,
  ceremony_location text not null,
  restaurant_location text not null,
  contact_parents text not null,
  contact_phone text not null
);

alter table public.event_settings enable row level security;

create policy "public read settings"
on public.event_settings for select
to public
using (true);

create policy "admin udpate settings"
on public.event_settings for update
to authenticated
using (true);

create policy "admin insert settings"
on public.event_settings for insert
to authenticated
with check (true);

insert into public.event_settings (
  id, child_name, event_date, ceremony_location, restaurant_location, contact_parents, contact_phone
) values (
  1,
  'Marc',
  '2026-05-17 10:00:00+00',
  'Parròquia de Sant Joan, Alzira',
  'al jardí de la família amb dinar',
  'Ana i Vicent',
  '+34 600 123 123'
);
