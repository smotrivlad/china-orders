-- Массив товаров для поддержки нескольких позиций в одной заявке
-- Структура каждого элемента: { product_name, description, link, file_urls }
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.orders.items IS
  'Array of order items: [{product_name, description, link, file_urls}]';
