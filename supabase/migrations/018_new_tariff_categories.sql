-- Migration 018: New tariff categories for updated routing logic
-- Keeps cargo_mixed (сборный груз, 3.8/4.0), adds Almaty and Moscow category tables

-- one_category_almaty: личный заказ, маршрут через Алматы (Уральск или ТК Энергия)
INSERT INTO public.tariffs (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
SELECT v.category, v.category_label, v.density_min, v.density_max, v.slow_price, v.fast_price, v.sort_order
FROM (VALUES
  ('one_category_almaty','Одна категория (Алматы)', 0,   100,  6.0, 7.0, 10),
  ('one_category_almaty','Одна категория (Алматы)', 100, 200,  5.5, 6.5, 10),
  ('one_category_almaty','Одна категория (Алматы)', 200, 300,  5.0, 6.0, 10),
  ('one_category_almaty','Одна категория (Алматы)', 300, 500,  4.5, 5.5, 10),
  ('one_category_almaty','Одна категория (Алматы)', 500, NULL, 4.0, 5.0, 10)
) AS v (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.tariffs t WHERE t.category = 'one_category_almaty');

-- one_category_moscow: одна категория, прямой маршрут через Москву (reserved/future)
INSERT INTO public.tariffs (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
SELECT v.category, v.category_label, v.density_min, v.density_max, v.slow_price, v.fast_price, v.sort_order
FROM (VALUES
  ('one_category_moscow','Одна категория (Москва)', 0,   100,  5.5, 5.5, 11),
  ('one_category_moscow','Одна категория (Москва)', 100, 200,  5.0, 5.0, 11),
  ('one_category_moscow','Одна категория (Москва)', 200, 300,  4.5, 4.5, 11),
  ('one_category_moscow','Одна категория (Москва)', 300, 500,  4.0, 4.0, 11),
  ('one_category_moscow','Одна категория (Москва)', 500, NULL, 3.5, 3.5, 11)
) AS v (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.tariffs t WHERE t.category = 'one_category_moscow');

-- shoes_moscow
INSERT INTO public.tariffs (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
SELECT v.category, v.category_label, v.density_min, v.density_max, v.slow_price, v.fast_price, v.sort_order
FROM (VALUES
  ('shoes_moscow','Обувь (Москва)', 0,   100,  4.5, 4.5, 20),
  ('shoes_moscow','Обувь (Москва)', 100, 200,  4.5, 4.5, 20),
  ('shoes_moscow','Обувь (Москва)', 200, 300,  4.5, 4.5, 20),
  ('shoes_moscow','Обувь (Москва)', 300, 500,  4.5, 4.5, 20),
  ('shoes_moscow','Обувь (Москва)', 500, NULL, 4.5, 4.5, 20)
) AS v (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.tariffs t WHERE t.category = 'shoes_moscow');

-- clothes_moscow
INSERT INTO public.tariffs (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
SELECT v.category, v.category_label, v.density_min, v.density_max, v.slow_price, v.fast_price, v.sort_order
FROM (VALUES
  ('clothes_moscow','Одежда/постельное (Москва)', 0,   100,  3.5, 3.5, 21),
  ('clothes_moscow','Одежда/постельное (Москва)', 100, 200,  3.5, 3.5, 21),
  ('clothes_moscow','Одежда/постельное (Москва)', 200, 300,  3.5, 3.5, 21),
  ('clothes_moscow','Одежда/постельное (Москва)', 300, 500,  3.5, 3.5, 21),
  ('clothes_moscow','Одежда/постельное (Москва)', 500, NULL, 3.5, 3.5, 21)
) AS v (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.tariffs t WHERE t.category = 'clothes_moscow');

-- food_moscow
INSERT INTO public.tariffs (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
SELECT v.category, v.category_label, v.density_min, v.density_max, v.slow_price, v.fast_price, v.sort_order
FROM (VALUES
  ('food_moscow','Еда (Москва)', 0,   100,  5.0, 5.0, 22),
  ('food_moscow','Еда (Москва)', 100, 200,  5.0, 5.0, 22),
  ('food_moscow','Еда (Москва)', 200, 300,  5.0, 5.0, 22),
  ('food_moscow','Еда (Москва)', 300, 500,  5.0, 5.0, 22),
  ('food_moscow','Еда (Москва)', 500, NULL, 5.0, 5.0, 22)
) AS v (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.tariffs t WHERE t.category = 'food_moscow');

-- cosmetics_moscow
INSERT INTO public.tariffs (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
SELECT v.category, v.category_label, v.density_min, v.density_max, v.slow_price, v.fast_price, v.sort_order
FROM (VALUES
  ('cosmetics_moscow','Косметика (Москва)', 0,   100,  6.0, 6.0, 23),
  ('cosmetics_moscow','Косметика (Москва)', 100, 200,  6.0, 6.0, 23),
  ('cosmetics_moscow','Косметика (Москва)', 200, 300,  6.0, 6.0, 23),
  ('cosmetics_moscow','Косметика (Москва)', 300, 500,  6.0, 6.0, 23),
  ('cosmetics_moscow','Косметика (Москва)', 500, NULL, 6.0, 6.0, 23)
) AS v (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.tariffs t WHERE t.category = 'cosmetics_moscow');

-- perfume_moscow
INSERT INTO public.tariffs (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
SELECT v.category, v.category_label, v.density_min, v.density_max, v.slow_price, v.fast_price, v.sort_order
FROM (VALUES
  ('perfume_moscow','Парфюм (Москва)', 0,   100,  7.5, 7.5, 24),
  ('perfume_moscow','Парфюм (Москва)', 100, 200,  7.5, 7.5, 24),
  ('perfume_moscow','Парфюм (Москва)', 200, 300,  7.5, 7.5, 24),
  ('perfume_moscow','Парфюм (Москва)', 300, 500,  7.5, 7.5, 24),
  ('perfume_moscow','Парфюм (Москва)', 500, NULL, 7.5, 7.5, 24)
) AS v (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.tariffs t WHERE t.category = 'perfume_moscow');

-- electro_moscow
INSERT INTO public.tariffs (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
SELECT v.category, v.category_label, v.density_min, v.density_max, v.slow_price, v.fast_price, v.sort_order
FROM (VALUES
  ('electro_moscow','Электро/мопед (Москва)', 0,   100,  4.8, 4.8, 25),
  ('electro_moscow','Электро/мопед (Москва)', 100, 200,  4.8, 4.8, 25),
  ('electro_moscow','Электро/мопед (Москва)', 200, 300,  4.8, 4.8, 25),
  ('electro_moscow','Электро/мопед (Москва)', 300, 500,  4.8, 4.8, 25),
  ('electro_moscow','Электро/мопед (Москва)', 500, NULL, 4.8, 4.8, 25)
) AS v (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.tariffs t WHERE t.category = 'electro_moscow');

-- underwear_moscow
INSERT INTO public.tariffs (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
SELECT v.category, v.category_label, v.density_min, v.density_max, v.slow_price, v.fast_price, v.sort_order
FROM (VALUES
  ('underwear_moscow','Нижнее бельё (Москва)', 0,   100,  4.0, 4.0, 26),
  ('underwear_moscow','Нижнее бельё (Москва)', 100, 200,  4.0, 4.0, 26),
  ('underwear_moscow','Нижнее бельё (Москва)', 200, 300,  4.0, 4.0, 26),
  ('underwear_moscow','Нижнее бельё (Москва)', 300, 500,  4.0, 4.0, 26),
  ('underwear_moscow','Нижнее бельё (Москва)', 500, NULL, 4.0, 4.0, 26)
) AS v (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.tariffs t WHERE t.category = 'underwear_moscow');

-- socks_moscow
INSERT INTO public.tariffs (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
SELECT v.category, v.category_label, v.density_min, v.density_max, v.slow_price, v.fast_price, v.sort_order
FROM (VALUES
  ('socks_moscow','Носки (Москва)', 0,   100,  3.8, 3.8, 27),
  ('socks_moscow','Носки (Москва)', 100, 200,  3.8, 3.8, 27),
  ('socks_moscow','Носки (Москва)', 200, 300,  3.8, 3.8, 27),
  ('socks_moscow','Носки (Москва)', 300, 500,  3.8, 3.8, 27),
  ('socks_moscow','Носки (Москва)', 500, NULL, 3.8, 3.8, 27)
) AS v (category, category_label, density_min, density_max, slow_price, fast_price, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.tariffs t WHERE t.category = 'socks_moscow');
