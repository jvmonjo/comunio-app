-- Migration: Add location links to event_settings
-- Created at: 2026-04-21 15:40:00

alter table public.event_settings 
add column if not exists ceremony_url text,
add column if not exists restaurant_url text;
