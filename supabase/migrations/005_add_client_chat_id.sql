alter table public.orders
  add column if not exists client_chat_id bigint default null;
