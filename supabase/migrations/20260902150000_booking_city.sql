alter table if exists public.booking_requests
  add column if not exists city text not null default '';
