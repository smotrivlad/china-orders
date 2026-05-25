-- Add reply fields and session tracking to support_messages
ALTER TABLE public.support_messages
  ADD COLUMN IF NOT EXISTS session_id  TEXT,
  ADD COLUMN IF NOT EXISTS reply       TEXT,
  ADD COLUMN IF NOT EXISTS replied_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS support_messages_session_id
  ON public.support_messages (session_id)
  WHERE session_id IS NOT NULL;
