ALTER TABLE public.event_settings ADD COLUMN hide_prices_after_reservation BOOLEAN DEFAULT false;
ALTER TABLE public.gifts ADD COLUMN is_visible BOOLEAN DEFAULT true;
