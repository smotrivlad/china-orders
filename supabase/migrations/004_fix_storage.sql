-- Удаляем старые политики для order-files
drop policy if exists "allow_public_upload" on storage.objects;
drop policy if exists "allow_public_read" on storage.objects;
drop policy if exists "orders_files_insert" on storage.objects;
drop policy if exists "orders_files_select" on storage.objects;
drop policy if exists "orders_files_delete" on storage.objects;

-- Политики для нового бакета orders-files
-- (бакет создан через Storage API)
create policy "orders_files_insert"
  on storage.objects for insert
  with check (bucket_id = 'orders-files');

create policy "orders_files_select"
  on storage.objects for select
  using (bucket_id = 'orders-files');

create policy "orders_files_delete"
  on storage.objects for delete
  using (bucket_id = 'orders-files');
