insert into storage.buckets (id, name, public)
values ('gifts', 'gifts', true)
on conflict (id) do nothing;

create policy "Public read access to gifts bucket"
on storage.objects for select
to public
using ( bucket_id = 'gifts' );

create policy "Admin upload access to gifts bucket"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'gifts' );

create policy "Admin update access to gifts bucket"
on storage.objects for update
to authenticated
using ( bucket_id = 'gifts' );

create policy "Admin delete access to gifts bucket"
on storage.objects for delete
to authenticated
using ( bucket_id = 'gifts' );
