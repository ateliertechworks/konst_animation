import { useRef, useState } from 'react'
import { SERVICES } from '../data/services.js'
import { useServicesTimeline } from '../services/useServicesTimeline.js'
import { ServiceDetail } from '../services/ServiceDetail.jsx'

/** Scroll budget for the pinned pass, in viewport heights. */
const TRACK_VH = { wide: 250, narrow: 230 }

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SERVICES
 * ─────────────────────────────────────────────────────────────────────────────
 *  A horizontal, scroll-scrubbed gallery of the six services, sitting between
 *  the hero and About Us. It is self-contained — it borrows the site's tokens
 *  and the About section's "scroll is the only clock" principle, and touches
 *  neither neighbour. The cream ground gives the eye a clean, warm beat between
 *  the two dark rooms.
 */
export function Services({ viewport, reduced }) {
  const root = useRef(null)
  const track = useRef(null)
  const stacked = viewport.mobile || viewport.portrait
  const [open, setOpen] = useState(null)

  useServicesTimeline(root, track, { reduced })

  const total = SERVICES.length
  // smaller than before — a refined editorial filmstrip, not a wall of images
  const panelH = stacked ? '40vh' : '46vh'

  return (
    <section
      id="services"
      ref={root}
      aria-label="KONST designs services"
      className="relative bg-cream"
      style={{ height: `${stacked ? TRACK_VH.narrow : TRACK_VH.wide}vh` }}
    >
      <div className="sticky top-0 flex h-[100svh] w-full flex-col overflow-hidden bg-cream text-ink">
        {/* ── section mark ─────────────────────────────────────────────── */}
        <div className="relative z-20 shrink-0 px-5 pt-7 sm:px-8 lg:px-12">
          <div className="mx-auto flex w-full max-w-[1400px] items-baseline justify-between">
            <p data-svc-head className="font-sans text-[10px] tracking-label text-brass">
              SERVICES
            </p>
            <p data-svc-head className="font-sans text-[9px] tracking-label text-ink/45 sm:text-[10px]">
              WHAT&nbsp;WE&nbsp;DESIGN
            </p>
          </div>
          <div className="mx-auto mt-4 h-px w-full max-w-[1400px] bg-cream-line" />
          <h2
            data-svc-head
            className="mx-auto mt-6 max-w-[1400px] font-display text-[clamp(1.7rem,4vw,3.2rem)] font-light leading-[1.02] text-ink sm:mt-7"
          >
            Six ways we shape a home.
          </h2>
        </div>

        {/* ── the gallery ──────────────────────────────────────────────── */}
        <div className="relative flex min-h-0 flex-1 items-center">
          <div
            ref={track}
            className="flex items-end gap-6 px-[6vw] will-change-transform sm:gap-9 lg:gap-14"
            style={{ transform: 'translate3d(0,0,0)' }}
          >
            {SERVICES.map((s) => (
              <figure
                key={s.id}
                data-svc-panel
                className="group relative shrink-0"
                style={{ '--focus': 1 }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(SERVICES.indexOf(s))}
                  aria-label={`Open ${s.title}`}
                  className="block origin-bottom cursor-pointer overflow-hidden rounded-[3px] shadow-[0_24px_60px_-30px_rgba(60,45,24,0.55)] outline-none transition-[opacity,transform] duration-500 ease-[cubic-bezier(.16,1,.3,1)] focus-visible:ring-2 focus-visible:ring-brass"
                  style={{
                    height: panelH,
                    width: `calc(${panelH} * ${s.ratio})`,
                    opacity: 'calc(0.62 + 0.38 * var(--focus))',
                    transform: 'scale(calc(0.965 + 0.035 * var(--focus)))',
                  }}
                >
                  <img
                    src={s.image}
                    alt={s.title}
                    loading="lazy"
                    decoding="async"
                    draggable="false"
                    className="h-full w-full scale-[1.03] object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.08]"
                  />
                  {/* a whisper of warmth into the lower edge, so the caption
                      below always sits against a settled tone */}
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/25 to-transparent" />
                  <span className="pointer-events-none absolute right-4 top-4 font-sans text-[10px] tracking-label text-cream/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
                    VIEW
                  </span>
                </button>

                <figcaption className="mt-4 flex items-baseline gap-3">
                  <span className="font-sans text-[10px] tracking-label text-brass">
                    {s.number}
                  </span>
                  <span className="h-px w-6 bg-cream-line" />
                  <span className="font-display text-[clamp(1rem,1.6vw,1.4rem)] font-light leading-none text-ink">
                    {s.title}
                  </span>
                </figcaption>
              </figure>
            ))}

            {/* a quiet end-plate so the row has a considered finish, not a
                cut-off edge, as the last image reaches the margin */}
            <div className="flex shrink-0 flex-col justify-center self-center pl-2 pr-[4vw]">
              <span className="font-sans text-[10px] tracking-label text-ink/40">END</span>
              <span className="mt-2 font-display text-[clamp(1.1rem,1.6vw,1.5rem)] font-light leading-tight text-ink/70">
                Coimbatore
              </span>
            </div>
          </div>
        </div>

        {/* ── progress rail + index readout ────────────────────────────── */}
        <div className="relative z-20 shrink-0 px-5 pb-7 sm:px-8 lg:px-12">
          <div className="mx-auto flex w-full max-w-[1400px] items-center gap-4">
            <span className="font-sans text-[9px] tracking-label text-ink/45">01</span>
            <div className="relative h-px flex-1 bg-cream-line">
              <div
                data-svc-rail-fill
                className="absolute inset-0 origin-left bg-brass"
              />
            </div>
            <span className="font-sans text-[9px] tracking-label text-ink/45">
              {String(total).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {open !== null && (
        <ServiceDetail
          index={open}
          onClose={() => setOpen(null)}
          onPrev={() => setOpen((i) => (i + total - 1) % total)}
          onNext={() => setOpen((i) => (i + 1) % total)}
        />
      )}
    </section>
  )
}
