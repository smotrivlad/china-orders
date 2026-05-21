-- Бакет для файлов заявок
insert into storage.buckets (id, name, public)
values ('order-files', 'order-files', true)
on conflict (id) do nothing;

create policy "allow_public_upload" on storage.objects
  for insert with check (bucket_id = 'order-files');

create policy "allow_public_read" on storage.objects
  for select using (bucket_id = 'order-files');
