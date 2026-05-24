-- Optional pin column for admin-overridden order PINs.
-- When NULL the system falls back to the HMAC-derived PIN.
-- When set (after admin clicks "Сгенерировать новый PIN") the stored value
-- takes precedence over the HMAC derivation.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS pin VARCHAR(6) DEFAULT NULL;
