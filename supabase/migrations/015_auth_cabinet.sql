-- ── User cabinet: link orders to Supabase Auth users ──────────────────────

-- 1. Add user_id FK to orders (nullable — anonymous orders still exist)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_user_id_idx
  ON public.orders (user_id)
  WHERE user_id IS NOT NULL;

-- 2. Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 3. Service role (adminClient) bypasses RLS automatically — no policy needed.

-- 4. Authenticated users can SELECT their own orders
CREATE POLICY "auth_select_own_orders" ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Anyone (anon + authenticated) can INSERT new orders (public form)
CREATE POLICY "anyone_insert_orders" ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- 6. Authenticated users can UPDATE their own orders
--    (allows claiming: user_id IS NULL → set to auth.uid())
CREATE POLICY "auth_update_own_orders" ON public.orders
  FOR UPDATE
  TO authenticated
  USING  (user_id IS NULL OR auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
