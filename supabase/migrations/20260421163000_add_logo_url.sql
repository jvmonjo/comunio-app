alter table public.event_settings add column if not exists logo_url text;

-- Setup storage for logos
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "Public read access to logos bucket"
on storage.objects for select
to public
using ( bucket_id = 'logos' );

create policy "Admin upload access to logos bucket"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'logos' );

create policy "Admin update access to logos bucket"
on storage.objects for update
to authenticated
using ( bucket_id = 'logos' );

create policy "Admin delete access to logos bucket"
on storage.objects for delete
to authenticated
using ( bucket_id = 'logos' );
