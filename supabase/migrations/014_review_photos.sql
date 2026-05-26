-- Review photos table (up to 4 photos per review)
CREATE TABLE IF NOT EXISTS public.review_photos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID        NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  url         TEXT        NOT NULL,
  sort_order  INT         NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS review_photos_review_id_idx ON public.review_photos (review_id, sort_order);

ALTER TABLE public.review_photos DISABLE ROW LEVEL SECURITY;
