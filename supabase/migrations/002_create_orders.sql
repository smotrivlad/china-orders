-- Последовательность для генерации кода CH-XXXX
create sequence if not exists public.order_code_seq start 1000;

-- Основная таблица заявок
create table if not exists public.orders (
  id               uuid        primary key default gen_random_uuid(),
  code             text        not null unique
                               default 'CH-' || nextval('public.order_code_seq'),

  -- Данные клиента
  first_name       text        not null,
  last_name        text        not null,
  contact          text        not null,       -- телефон / email / Telegram

  -- Данные о товаре
  product_name     text        not null,
  description      text,
  link             text,

  -- Параметры заказа
  urgency          text        not null default 'normal'
                               check (urgency in ('normal', 'urgent')),
  order_type       text        not null default 'personal'
                               check (order_type in ('personal', 'group')),

  -- Статус и комментарий менеджера
  status_id        smallint    not null references public.statuses(id) default 1,
  manager_comment  text,

  -- Файлы/фото (массив URL из Supabase Storage)
  file_urls        text[]      default '{}',

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Индексы
create index on public.orders (status_id);
create index on public.orders (created_at desc);
create index on public.orders (code);

-- Триггер: автообновление updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

-- RLS: клиент видит только свои заявки по коду/контакту;
--       сервисная роль (менеджер) видит всё
alter table public.orders enable row level security;

-- Анонимный пользователь может создать заявку
create policy "orders_insert_anon" on public.orders
  for insert with check (true);

-- Клиент читает свою заявку по коду
create policy "orders_select_by_code" on public.orders
  for select using (true);   -- уточним после добавления auth

-- Только сервисная роль обновляет заявку (менеджер)
create policy "orders_update_service" on public.orders
  for update using (auth.role() = 'service_role');
