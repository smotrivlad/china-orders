'use client'

import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useCallback, useEffect, useState } from 'react'

interface ReviewPhoto { id: string; url: string; sort_order: number }
interface Review { id: string; client_name: string; text: string; photos: ReviewPhoto[]; created_at: string }

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function StarRow() {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill="#8B1A2F" className="w-3.5 h-3.5">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

/* ── Photo gallery ───────────────────────────────────────────────────────── */

function PhotoGallery({ photos }: { photos: ReviewPhoto[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  if (!photos.length) return null

  const count = photos.length

  return (
    <>
      {count === 1 ? (
        /* Single photo — 4:3 with rounded corners */
        <div
          className="relative overflow-hidden rounded-xl cursor-zoom-in group aspect-[4/3]"
          onClick={() => setLightbox(photos[0].url)}
        >
          <img
            src={photos[0].url}
            alt="Фото отзыва"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
            <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
        </div>
      ) : (
        /* 2-4 photos — thumbnail grid */
        <div className={`grid gap-1 rounded-xl overflow-hidden ${count === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {photos.map((p, i) => (
            <div
              key={p.id}
              className={`relative overflow-hidden cursor-zoom-in group aspect-square ${
                count === 3 && i === 0 ? 'col-span-2 aspect-[2/1]' : ''
              }`}
              onClick={() => setLightbox(p.url)}
            >
              <img
                src={p.url}
                alt={`Фото ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors text-2xl"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>
          <img
            src={lightbox}
            alt="Фото отзыва"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

/* ── Arrow button ────────────────────────────────────────────────────────── */

function ArrowButton({
  direction, onClick,
}: {
  direction: 'prev' | 'next'
  onClick: () => void
}) {
  const isPrev = direction === 'prev'
  return (
    <button
      onClick={onClick}
      aria-label={isPrev ? 'Предыдущий отзыв' : 'Следующий отзыв'}
      className="hidden sm:flex absolute top-1/2 z-10 w-11 h-11 rounded-full
        items-center justify-center
        border-2 border-[#8B1A2F]/40 text-[#8B1A2F]
        hover:bg-[#8B1A2F] hover:border-[#8B1A2F] hover:text-white
        transition-all duration-200 shadow-lg cursor-pointer"
      style={{
        background: 'rgba(15,23,41,0.85)',
        backdropFilter: 'blur(8px)',
        [isPrev ? 'left' : 'right']: 0,
        transform: `translateY(-50%) translateX(${isPrev ? '-50%' : '50%'})`,
      }}
    >
      <svg
        className="w-5 h-5"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
      >
        <path
          strokeLinecap="round" strokeLinejoin="round"
          d={isPrev ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
        />
      </svg>
    </button>
  )
}

/* ── Main slider ─────────────────────────────────────────────────────────── */

export default function ReviewsSlider({ reviews }: { reviews: Review[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', slidesToScroll: 1 },
    [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })],
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps]     = useState<number[]>([])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo   = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    setScrollSnaps(emblaApi.scrollSnapList())
    emblaApi.on('select', onSelect)
    onSelect()
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi, onSelect])

  /* Keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  scrollPrev()
      if (e.key === 'ArrowRight') scrollNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [scrollPrev, scrollNext])

  if (!reviews.length) return null

  return (
    <div className="relative">
      {/* Arrows — visible sm+, positioned outside carousel track */}
      <ArrowButton direction="prev" onClick={scrollPrev} />
      <ArrowButton direction="next" onClick={scrollNext} />

      {/* Carousel — adds side padding on sm+ to not clip arrows */}
      <div ref={emblaRef} className="overflow-hidden sm:mx-6">
        <div className="flex gap-5">
          {reviews.map(r => {
            const hasPhotos = r.photos.length > 0
            const date = new Date(r.created_at).toLocaleDateString('ru-RU', {
              day: '2-digit', month: 'long', year: 'numeric',
            })
            return (
              <div
                key={r.id}
                className="shrink-0 w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] min-w-0"
              >
                <div
                  className="h-full rounded-2xl p-6 flex flex-col gap-4"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(245,240,232,0.07)',
                  }}
                >
                  {/* Stars */}
                  <StarRow />

                  {/* Body: text + photos */}
                  <div className={`flex-1 flex gap-4 ${hasPhotos ? 'flex-col sm:flex-row' : 'flex-col'}`}>
                    {/* Text — bottom on mobile (after photo), left on desktop */}
                    <p
                      className="flex-1 text-sm leading-[1.8] whitespace-pre-line order-last sm:order-first"
                      style={{ color: 'rgba(245,240,232,0.65)' }}
                    >
                      &ldquo;{r.text}&rdquo;
                    </p>

                    {/* Photos — top on mobile (order-first), right on desktop */}
                    {hasPhotos && (
                      <div className="shrink-0 order-first sm:order-last w-full sm:w-[130px]">
                        {/* On mobile: cap width and centre */}
                        <div className="max-w-[300px] sm:max-w-none mx-auto sm:mx-0">
                          <PhotoGallery photos={r.photos} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    className="flex items-center gap-3 pt-3"
                    style={{ borderTop: '1px solid rgba(245,240,232,0.06)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                      style={{ background: 'rgba(139,26,47,0.2)', border: '1px solid rgba(139,26,47,0.35)', color: '#8B1A2F' }}
                    >
                      {initials(r.client_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-milk truncate">{r.client_name}</p>
                      <p className="text-[10px]" style={{ color: 'rgba(245,240,232,0.3)' }}>{date}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dots */}
      {scrollSnaps.length > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {scrollSnaps.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width:      i === selectedIndex ? '24px' : '8px',
                height:     '8px',
                background: i === selectedIndex ? '#8B1A2F' : 'rgba(245,240,232,0.15)',
              }}
              aria-label={`Отзыв ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
