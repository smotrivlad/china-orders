-- Rate-limiting table for PIN verification attempts
-- identifier: IP address for web requests, 'tg:{chatId}' for Telegram bot
-- Rows older than 2 hours are logically expired (filtered in queries).
-- A pg_cron job or manual cleanup can periodically DELETE old rows.

CREATE TABLE IF NOT EXISTS public.pin_attempts (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT         NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pin_attempts_lookup
  ON public.pin_attempts (identifier, created_at DESC);

-- Service role only — no public access needed
ALTER TABLE public.pin_attempts DISABLE ROW LEVEL SECURITY;
