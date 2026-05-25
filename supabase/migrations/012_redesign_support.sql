-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  012 — Redesign support: sessions + messages                        ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- Drop old support_messages (incompatible schema from migration 010/011)
DROP TABLE IF EXISTS public.support_messages CASCADE;

-- ── support_sessions ──────────────────────────────────────────────────
-- One row per visitor chat session (identified by localStorage session_id)
CREATE TABLE public.support_sessions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT        NOT NULL UNIQUE,
  name       TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'open',
  -- status: open | pending_close | closed
  page       TEXT        NOT NULL DEFAULT '/',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── support_messages ──────────────────────────────────────────────────
-- Individual messages in a session
CREATE TABLE public.support_messages (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT        NOT NULL REFERENCES public.support_sessions(session_id) ON DELETE CASCADE,
  text       TEXT        NOT NULL,
  sender     TEXT        NOT NULL CHECK (sender IN ('client', 'manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON public.support_sessions  (status, created_at DESC);
CREATE INDEX ON public.support_messages  (session_id, created_at ASC);

ALTER TABLE public.support_sessions  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages  DISABLE ROW LEVEL SECURITY;
