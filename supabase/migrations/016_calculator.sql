-- ── Calculator: tariffs, settings, request log ─────────────────────────────

-- 1. Tariffs — density brackets per category
CREATE TABLE IF NOT EXISTS public.tariffs (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT    NOT NULL,
  category_label TEXT   NOT NULL,
  density_min   NUMERIC NOT NULL DEFAULT 0,
  density_max   NUMERIC,                    -- NULL = no upper limit
  slow_price    NUMERIC NOT NULL,           -- $/kg slow auto
  fast_price    NUMERIC NOT NULL,           -- $/kg fast auto
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tariffs_category_idx ON public.tariffs (category);

-- 2. Tariff settings — key/value for fixed costs
CREATE TABLE IF NOT EXISTS public.tariff_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  label      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Calculator request log
CREATE TABLE IF NOT EXISTS public.calculator_requests (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  category           TEXT,
  order_type         TEXT,                  -- 'personal' | 'group'
  route              TEXT,                  -- 'ural' | 'tk_energy' | 'both'
  weight             NUMERIC,
  volume             NUMERIC,
  density            NUMERIC,
  places             INTEGER,
  packaging          TEXT,
  insurance_rate     NUMERIC,
  product_cost       NUMERIC,
  buyout_percent     NUMERIC,
  total_min          NUMERIC,
  total_max          NUMERIC,
  converted_to_order BOOLEAN     NOT NULL DEFAULT false,
  ip_address         TEXT,
  user_agent         TEXT,
  session_id         TEXT
);

CREATE INDEX IF NOT EXISTS calc_requests_created_at_idx ON public.calculator_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS calc_requests_converted_idx  ON public.calculator_requests (converted_to_order);

-- ── Seed tariff_settings ────────────────────────────────────────────────────
INSERT INTO public.tariff_settings (key, value, label) VALUES
  ('usd_rub',            '90',    'Курс USD/RUB вручную'),
  ('loaders_almaty',     '1750',  'Грузчики/разгрузка Алматы (₽)'),
  ('almaty_uralsk_min',  '600',   'Алматы → Уральск мин за 5 кг (₽)'),
  ('almaty_uralsk_max',  '1000',  'Алматы → Уральск макс за 5 кг (₽)'),
  ('uralsk_tolyatti_min','2000',  'Уральск → Тольятти мин (₽)'),
  ('uralsk_tolyatti_max','3000',  'Уральск → Тольятти макс (₽)'),
  ('tk_energia_per_kg',  '50',    'ТК Энергия Алматы → Тольятти за кг (₽)'),
  ('notify_telegram',    'false', 'Присылать в Telegram каждый расчёт')
ON CONFLICT (key) DO NOTHING;

-- ── Seed tariffs — 8 categories × 5 density brackets ───────────────────────
-- Brackets: 0-150 | 150-250 | 250-350 | 350-500 | 500+

INSERT INTO public.tariffs (category, category_label, density_min, density_max, slow_price, fast_price, sort_order) VALUES
-- 1. Сборный груз/хоз
('cargo_mixed','Сборный груз/хоз', 0,   150,  4.5, 5.5, 1),
('cargo_mixed','Сборный груз/хоз', 150, 250,  4.0, 5.0, 1),
('cargo_mixed','Сборный груз/хоз', 250, 350,  3.5, 4.5, 1),
('cargo_mixed','Сборный груз/хоз', 350, 500,  3.0, 4.0, 1),
('cargo_mixed','Сборный груз/хоз', 500, NULL, 2.5, 3.5, 1),
-- 2. Одна категория
('single_category','Одна категория', 0,   150,  4.3, 5.3, 2),
('single_category','Одна категория', 150, 250,  3.8, 4.8, 2),
('single_category','Одна категория', 250, 350,  3.3, 4.3, 2),
('single_category','Одна категория', 350, 500,  2.8, 3.8, 2),
('single_category','Одна категория', 500, NULL, 2.3, 3.3, 2),
-- 3. Обувь
('shoes','Обувь', 0,   150,  4.8, 5.8, 3),
('shoes','Обувь', 150, 250,  4.3, 5.3, 3),
('shoes','Обувь', 250, 350,  3.8, 4.8, 3),
('shoes','Обувь', 350, 500,  3.3, 4.3, 3),
('shoes','Обувь', 500, NULL, 2.8, 3.8, 3),
-- 4. Одежда/постельное
('clothing_bedding','Одежда/постельное', 0,   150,  4.5, 5.5, 4),
('clothing_bedding','Одежда/постельное', 150, 250,  4.0, 5.0, 4),
('clothing_bedding','Одежда/постельное', 250, 350,  3.5, 4.5, 4),
('clothing_bedding','Одежда/постельное', 350, 500,  3.0, 4.0, 4),
('clothing_bedding','Одежда/постельное', 500, NULL, 2.5, 3.5, 4),
-- 5. Еда/Косметика/Парфюм
('food_cosmetics','Еда/Косметика/Парфюм', 0,   150,  5.0, 6.0, 5),
('food_cosmetics','Еда/Косметика/Парфюм', 150, 250,  4.5, 5.5, 5),
('food_cosmetics','Еда/Косметика/Парфюм', 250, 350,  4.0, 5.0, 5),
('food_cosmetics','Еда/Косметика/Парфюм', 350, 500,  3.5, 4.5, 5),
('food_cosmetics','Еда/Косметика/Парфюм', 500, NULL, 3.0, 4.0, 5),
-- 6. Электро/Мопед
('electronics','Электро/Мопед', 0,   150,  5.5, 6.5, 6),
('electronics','Электро/Мопед', 150, 250,  5.0, 6.0, 6),
('electronics','Электро/Мопед', 250, 350,  4.5, 5.5, 6),
('electronics','Электро/Мопед', 350, 500,  4.0, 5.0, 6),
('electronics','Электро/Мопед', 500, NULL, 3.5, 4.5, 6),
-- 7. Алматы прямой
('almaty_direct','Алматы прямой', 0,   150,  3.5, 4.5, 7),
('almaty_direct','Алматы прямой', 150, 250,  3.0, 4.0, 7),
('almaty_direct','Алматы прямой', 250, 350,  2.5, 3.5, 7),
('almaty_direct','Алматы прямой', 350, 500,  2.0, 3.0, 7),
('almaty_direct','Алматы прямой', 500, NULL, 1.5, 2.5, 7),
-- 8. Бельё/носки
('underwear_socks','Бельё/носки', 0,   150,  4.0, 5.0, 8),
('underwear_socks','Бельё/носки', 150, 250,  3.5, 4.5, 8),
('underwear_socks','Бельё/носки', 250, 350,  3.0, 4.0, 8),
('underwear_socks','Бельё/носки', 350, 500,  2.5, 3.5, 8),
('underwear_socks','Бельё/носки', 500, NULL, 2.0, 3.0, 8);
