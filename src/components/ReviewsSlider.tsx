'use client'

import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useCallback, useEffect, useState } from 'react'

interface ReviewPhoto {
  id: string
  url: string
  sort_order: number
}

interface Review {
  id: string
  client_name: string
  text: string
  photos: ReviewPhoto[]
  created_at: string
}

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

function PhotoGallery({ photos }: { photos: ReviewPhoto[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  if (!photos.length) return null

  const count = photos.length

  return (
    <>
      <div
        className={`grid gap-1.5 rounded-xl overflow-hidden ${
          count === 1 ? 'grid-cols-1' :
          count === 2 ? 'grid-cols-2' :
          count === 3 ? 'grid-cols-3' :
          'grid-cols-2'
        }`}
      >
        {photos.map((p, i) => (
          <div
            key={p.id}
            className={`relative overflow-hidden cursor-zoom-in group ${
              count === 4 ? 'aspect-square' : 'aspect-video'
            } ${count === 3 && i === 0 ? 'col-span-2 !aspect-video' : ''}`}
            onClick={() => setLightbox(p.url)}
          >
            <img
              src={p.url}
              alt={`Фото ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
              <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-4xl leading-none font-light"
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

export default function ReviewsSlider({ reviews }: { reviews: Review[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: 'start', slidesToScroll: 1 },
    [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })],
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    setScrollSnaps(emblaApi.scrollSnapList())
    emblaApi.on('select', onSelect)
    onSelect()
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi, onSelect])

  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi])

  if (!reviews.length) return null

  return (
    <div className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-5">
          {reviews.map(r => {
            const date = new Date(r.created_at).toLocaleDateString('ru-RU', {
              day: '2-digit', month: 'long', year: 'numeric',
            })
            return (
              <div
                key={r.id}
                className="shrink-0 w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] min-w-0"
              >
                <div
                  className="h-full rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(245,240,232,0.07)',
                  }}
                >
                  <StarRow />

                  <p className="flex-1 text-sm leading-[1.8] whitespace-pre-line" style={{ color: 'rgba(245,240,232,0.65)' }}>
                    &ldquo;{r.text}&rdquo;
                  </p>

                  {/* Photos — only rendered when photos exist */}
                  {r.photos.length > 0 && (
                    <PhotoGallery photos={r.photos} />
                  )}

                  <div className="flex items-center gap-3 pt-3"
                    style={{ borderTop: '1px solid rgba(245,240,232,0.06)' }}>
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
