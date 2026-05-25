-- Reviews table
CREATE TABLE public.reviews (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name  TEXT        NOT NULL,
  text         TEXT        NOT NULL,
  photo_url    TEXT,
  is_published BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON public.reviews (is_published, created_at DESC);

ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;

-- Sample data
INSERT INTO public.reviews (client_name, text, photo_url, created_at) VALUES
(
  'Артём К.',
  'Заказывал кроссовки через Poizon — всё пришло в срок, оригинал проверен. Влад всегда на связи, отвечает быстро. Рекомендую.',
  NULL,
  now() - interval '14 days'
),
(
  'Марина В.',
  'Работаем уже полгода — постоянно закупаем одежду для магазина. Ни разу не подвели: товар проверяют до отправки, документы в порядке. Цены ниже чем у других посредников.',
  NULL,
  now() - interval '30 days'
),
(
  'Дмитрий С.',
  'Брал технику с Taobao — наушники и умные часы. Доставка заняла 28 дней, всё целое, упаковка надёжная. Буду обращаться снова.',
  NULL,
  now() - interval '7 days'
);
