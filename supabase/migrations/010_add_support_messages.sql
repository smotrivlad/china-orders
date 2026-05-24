-- Support chat messages from the website widget
CREATE TABLE IF NOT EXISTS public.support_messages (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT         NOT NULL,
  message    TEXT         NOT NULL,
  page       TEXT         NOT NULL DEFAULT '/',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  answered   BOOLEAN      NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS support_messages_created_at ON public.support_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS support_messages_answered   ON public.support_messages (answered);

-- Service role only — no public read, but public insert is allowed via API
ALTER TABLE public.support_messages DISABLE ROW LEVEL SECURITY;
