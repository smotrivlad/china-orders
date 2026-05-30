-- ── Calculator extra tables: commission tiers, packaging types, insurance tiers ──

-- Commission tiers (buyout percentages by order amount in RUB)
CREATE TABLE IF NOT EXISTS public.commission_tiers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount_to  INTEGER,                  -- NULL = "and above" (no upper limit)
  rate       NUMERIC(5,2) NOT NULL,    -- percent
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO public.commission_tiers (amount_to, rate, sort_order) VALUES
  (50000,  10, 1),
  (100000,  8, 2),
  (300000,  5, 3),
  (750000,  3, 4),
  (NULL,    1, 5);

-- Packaging types (previously hardcoded in frontend)
CREATE TABLE IF NOT EXISTS public.packaging_types (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value      TEXT NOT NULL UNIQUE,     -- slug used in form state
  label      TEXT NOT NULL,
  price_min  NUMERIC(8,2) NOT NULL DEFAULT 0,
  price_max  NUMERIC(8,2) NOT NULL DEFAULT 0,
  per_m3     BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO public.packaging_types (value, label, price_min, price_max, per_m3, sort_order) VALUES
  ('none',     'Без упаковки',  0,  0,  false, 1),
  ('bag_tape', 'Мешок + скотч', 3,  3,  false, 2),
  ('box',      'Коробка',       5,  5,  false, 3),
  ('corners',  'Уголки',        7,  7,  false, 4),
  ('foam',     'Пенопласт',     9,  9,  false, 5),
  ('crate',    'Обрешётка',     12, 12, false, 6),
  ('pallet',   'Паллет',        25, 45, false, 7),
  ('plywood',  'Фанера',        40, 40, true,  8);

-- Insurance tiers (rate by value-per-kg in USD)
CREATE TABLE IF NOT EXISTS public.insurance_tiers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vpk_to     NUMERIC(8,2),             -- $/kg threshold, NULL = "and above"
  rate       NUMERIC(5,2) NOT NULL,    -- percent
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO public.insurance_tiers (vpk_to, rate, sort_order) VALUES
  (20,   1, 1),
  (30,   2, 2),
  (50,   3, 3),
  (NULL, 4, 4);

-- Add use_cbr_rate to settings
INSERT INTO public.tariff_settings (key, value, label) VALUES
  ('use_cbr_rate', 'true', 'Использовать курс ЦБ автоматически')
ON CONFLICT (key) DO NOTHING;
