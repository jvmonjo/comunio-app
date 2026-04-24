alter table public.gifts add column sort_order integer default 0;

-- Initialize sort_order based on creation date for existing gifts
with ordered_gifts as (
  select id, row_number() over (order by created_at asc) as row_num
  from public.gifts
)
update public.gifts
set sort_order = ordered_gifts.row_num
from ordered_gifts
where public.gifts.id = ordered_gifts.id;
