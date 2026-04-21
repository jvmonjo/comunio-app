-- Add created_by column to gifts to track who created the gift
alter table public.gifts 
add column created_by uuid references auth.users(id) default auth.uid();

-- Create a trigger to automatically set created_by on insert
create or replace function public.handle_gift_created_by()
returns trigger as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger "on_gift_insert_set_created_by"
before insert on public.gifts
for each row execute function public.handle_gift_created_by();

-- Allow admins (authenticated users) to see who created a gift
-- This is already covered by the existing "admin all gifts" policy
-- but let's make sure things are clear.

-- Note: Webhook configuration is usually done via Supabase Dashboard
-- or via SQL in the supabase_functions schema.
-- For self-hosted, we'll document how to set this up in the README.
