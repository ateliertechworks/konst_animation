import { useRef, useState } from 'react'
import { PROJECTS } from '../data/projects.js'
import { useProjectsDeck } from '../projects/useProjectsDeck.js'
import { ProjectDetail } from '../projects/ProjectDetail.jsx'

/** Scroll budget for the pinned pass, in viewport heights (weighted, cinematic). */
const TRACK_VH = { wide: 440, narrow: 400 }

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PROJECTS — a 3D floating presentation-board gallery
 * ─────────────────────────────────────────────────────────────────────────────
 *  Six projects arranged on a curved 3D arc in a dark architectural space: one
 *  board dominant at centre, the rest receding in depth to either side. Scroll
 *  is the only clock — the deck advances through the arc exactly as the Services
 *  filmstrip and About sequence do (pinned sticky child, ScrollTrigger with
 *  `scrub: true`) — and clicking any board opens its case-study modal without
 *  leaving the gallery position.
 */
export function Projects({ viewport }) {
  const root = useRef(null)
  const deck = useRef(null)
  const stacked = viewport.mobile || viewport.portrait
  const [active, setActive] = useState(0)
  const [open, setOpen] = useState(null)

  useProjectsDeck(root, deck, PROJECTS.length, { mobile: stacked, onActive: setActive })

  const current = PROJECTS[active]

  return (
    <section
      id="projects"
      ref={root}
      aria-label="Selected projects"
      className="relative bg-about-ground"
      style={{ height: `${stacked ? TRACK_VH.narrow : TRACK_VH.wide}vh` }}
    >
      <div className="sticky top-0 panel-h w-full overflow-hidden bg-about-ground text-bone">
        {/* Warm brown falling away to near-black, laid over the shared About
            ground so the section's colour stays tied to it: a broad warm pool
            behind the boards, a softer wash from above, and the corners sinking
            dark. Always present, whichever project is centred. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(95% 68% at 50% 46%, rgba(88,58,32,0.62) 0%, rgba(52,34,19,0.3) 44%, rgba(20,14,9,0) 74%),' +
              'radial-gradient(120% 80% at 50% -12%, rgba(58,39,21,0.75) 0%, rgba(36,24,16,0) 62%),' +
              'linear-gradient(to bottom, rgba(10,7,5,0) 46%, rgba(7,5,3,0.9) 100%)',
          }}
        />
        <div className="proj-floor" aria-hidden="true" />

        {/* ── section mark ─────────────────────────────────────────────── */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30">
          <div className="mx-auto flex w-full max-w-[1500px] items-baseline justify-between px-5 pt-7 sm:px-8 lg:px-12">
            <p className="font-sans text-[10px] tracking-label text-brass">SELECTED&nbsp;WORK</p>
            <p className="font-sans text-[9px] tracking-label text-bone/40 sm:text-[10px]">
              06&nbsp;PROJECTS
            </p>
          </div>
          <div className="mx-auto mt-4 h-px w-full max-w-[1500px] bg-bone/10" />
        </div>

        {/* ── the 3D deck ──────────────────────────────────────────────── */}
        <div className="absolute inset-0 flex items-center justify-center [perspective:1800px]">
          <div
            ref={deck}
            className="relative [transform-style:preserve-3d]"
            style={{
              width: stacked ? '66vw' : '30vw',
              maxWidth: stacked ? 320 : 520,
              /* the whole wall is seen a few degrees off-axis, so even the
                 centred board reads as a physical panel angled in space
                 rather than a flat rectangle pasted on the screen */
              transform: stacked ? undefined : 'rotateY(-5deg) rotateX(1.2deg)',
            }}
          >
            {PROJECTS.map((p, i) => (
              <button
                key={p.id}
                type="button"
                data-proj-card
                data-centre="false"
                onClick={() => setOpen(i)}
                aria-label={`Open ${p.title}`}
                className="group absolute left-0 top-1/2 block w-full -translate-y-1/2 cursor-pointer rounded-[3px] border border-bone/10 bg-[#17100a] text-left shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)] outline-none [backface-visibility:hidden] focus-visible:ring-2 focus-visible:ring-brass"
                style={{ willChange: 'transform, opacity' }}
              >
                {/* the index tab rides just above the board's top-left corner */}
                <span className="absolute -top-3.5 left-5 z-10 flex h-7 w-9 items-center justify-center bg-brass/90 font-sans text-[10px] tracking-label text-ink shadow-[0_6px_16px_-6px_rgba(0,0,0,0.9)]">
                  {p.number}
                </span>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-[3px]">
                  <img
                    src={p.image}
                    alt={p.title}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    draggable="false"
                    className="h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.05]"
                  />
                  <span className="absolute right-4 top-4 font-sans text-[9px] tracking-label text-bone/0 transition-colors duration-500 group-data-[centre=true]:text-bone/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
                    OPEN&nbsp;→
                  </span>
                </div>
                <div className="flex flex-col justify-center gap-1 px-4 py-4">
                  <h3 className="truncate font-display text-[clamp(0.95rem,1.5vw,1.3rem)] font-light leading-none text-bone">
                    {p.title}
                  </h3>
                  <p className="font-sans text-[8.5px] tracking-label text-bone/45">
                    {p.location.toUpperCase()} · {p.year}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── left-side active-project information ──────────────────────── */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-5 pb-8 sm:px-8 lg:bottom-[12vh] lg:max-w-[30vw] lg:px-12 lg:pb-0">
          <div key={current.id} data-proj-info className="[text-shadow:0_2px_18px_rgba(8,7,6,0.85)]">
            <p className="font-sans text-[9px] tracking-label text-brass sm:text-[10px]">
              {current.category.toUpperCase()} · {current.year} · {current.area.toUpperCase()}
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.6rem,3.2vw,2.8rem)] font-light uppercase leading-[1.0] text-bone">
              {current.title}
            </h2>
            <p className="mt-4 hidden max-w-[34ch] font-sans text-[12px] font-light leading-[1.7] text-bone/60 sm:block">
              {current.blurb}
            </p>
            <button
              type="button"
              onClick={() => setOpen(active)}
              className="pointer-events-auto group mt-5 inline-flex items-center gap-2 font-sans text-[10px] tracking-label text-bone/75 transition-colors hover:text-brass"
            >
              VIEW DRAWINGS
              <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>

        {/* ── right-side project index ─────────────────────────────────── */}
        <div className="absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-4 lg:flex">
          {PROJECTS.map((p, i) => {
            const on = i === active
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => root.current?.__deckTo?.(i)}
                aria-label={`Go to ${p.title}`}
                className="group flex items-center gap-3"
              >
                <span
                  className={`h-px transition-all duration-500 ${
                    on ? 'w-8 bg-brass' : 'w-4 bg-bone/25 group-hover:w-6 group-hover:bg-bone/50'
                  }`}
                />
                <span
                  className={`font-sans text-[10px] tracking-label transition-colors duration-500 ${
                    on ? 'text-brass' : 'text-bone/35 group-hover:text-bone/70'
                  }`}
                >
                  {p.number}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {open !== null && <ProjectDetail index={open} onClose={() => setOpen(null)} />}
    </section>
  )
}
