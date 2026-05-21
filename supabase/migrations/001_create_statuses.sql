-- Справочник статусов заявки
create table if not exists public.statuses (
  id          smallint generated always as identity primary key,
  code        text        not null unique,
  name        text        not null,
  sort_order  smallint    not null
);

insert into public.statuses (code, name, sort_order) values
  ('new',               'Новая',                  1),
  ('in_progress',       'Принята в работу',        2),
  ('searching_supplier','Ищем поставщика',          3),
  ('supplier_found',    'Найден поставщик',         4),
  ('purchase',          'Выкуп',                   5),
  ('shipping',          'Едет в Россию',            6),
  ('ready_for_pickup',  'Готово к выдаче',          7),
  ('completed',         'Завершена',               8);

-- Только сервисная роль может менять справочник
alter table public.statuses enable row level security;

create policy "statuses_read_all" on public.statuses
  for select using (true);
