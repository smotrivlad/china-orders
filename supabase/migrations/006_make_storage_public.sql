-- Делаем бакет orders-files публичным, чтобы публичные URL были доступны
-- без авторизации (в том числе для Telegram Bot API)
update storage.buckets
set public = true
where id = 'orders-files';
