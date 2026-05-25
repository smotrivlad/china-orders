'use client'

import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { useCallback, useEffect, useState } from 'react'

interface Review {
  id: string
  client_name: string
  text: string
  photo_url: string | null
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
      {/* Carousel viewport */}
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
                  {/* Stars */}
                  <StarRow />

                  {/* Text */}
                  <p className="flex-1 text-sm leading-[1.8]" style={{ color: 'rgba(245,240,232,0.65)' }}>
                    &ldquo;{r.text}&rdquo;
                  </p>

                  {/* Photo if exists */}
                  {r.photo_url && (
                    <div className="rounded-xl overflow-hidden aspect-video">
                      <img src={r.photo_url} alt="Фото товара" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Footer: avatar + name + date */}
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

      {/* Dot navigation */}
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
