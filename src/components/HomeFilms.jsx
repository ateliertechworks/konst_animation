import { useLayoutEffect, useRef } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'
import { Navigation } from './Navigation.jsx'
import { BEAT, PREFETCH_LEAD, frameAt } from '../home/sequence.js'

gsap.registerPlugin(ScrollTrigger)

const FILM_ONE = '/assets/video/film-one.mp4'
const FILM_TWO = '/assets/video/film-two.mp4'

/** Scroll budget for the whole two-film sequence, in viewport heights. Long on
 *  purpose: the films must have room to be read frame by frame rather than
 *  racing past in half a flick of the wheel. */
const TRACK_VH = { wide: 660, narrow: 520 }

/**
 * Binds one video's playhead to a 0–1 value instead of the clock.
 *
 * The video is never played. Seeks are applied at most once per paint, snapped
 * to the frame grid, skipped when they would land within half a frame of where
 * the playhead already is, and queued rather than stacked while a seek is in
 * flight — overlapping seeks on compressed video are exactly what makes
 * scrubbing stutter.
 */
const FPS = 30
function scrubber(vid) {
  let target = 0
  let raf = 0
  const apply = () => {
    raf = 0
    const d = vid.duration
    if (!Number.isFinite(d) || d <= 0) return
    const t = Math.round(Math.min(d - 0.05, Math.max(0, target * d)) * FPS) / FPS
    if (Math.abs(t - vid.currentTime) < 0.5 / FPS) return
    if (vid.seeking) return // the `seeked` handler re-runs with the latest target
    vid.currentTime = t
  }
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(apply)
  }
  vid.addEventListener('seeked', schedule)
  return {
    seek(v) {
      target = v
      schedule()
    },
    refresh: schedule,
    dispose() {
      cancelAnimationFrame(raf)
      vid.removeEventListener('seeked', schedule)
    },
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  HOME · THE TWO-FILM SEQUENCE
 * ─────────────────────────────────────────────────────────────────────────────
 *  Two films, one continuous scroll-driven shot. Neither ever plays on its own:
 *  there is no `autoplay`, no `loop`, no `controls`, and `play()` is never
 *  called. Scroll IS the playhead — down runs them forward, up runs them
 *  backward, stopping freezes the exact frame — because the pinned track is
 *  read with `scrub: true` and the progress is mapped straight onto
 *  `currentTime`.
 *
 *  The branding and navigation overlay sits above both films for the whole
 *  sequence, unchanged.
 */
export function HomeFilms({ viewport, reduced = false }) {
  const root = useRef(null)
  const filmOne = useRef(null)
  const filmTwo = useRef(null)
  const brand = useRef(null)
  const narrow = viewport?.mobile || viewport?.portrait

  useLayoutEffect(() => {
    const el = root.current
    const v1 = filmOne.current
    const v2 = filmTwo.current
    const mark = brand.current
    if (!el || !v1 || !v2 || !mark) return

    const ctx = gsap.context(() => {
      v1.pause() // surfaces we seek — they must never run in real time
      v2.pause()

      const one = scrubber(v1)
      const two = scrubber(v2)

      let progress = 0
      let raf = 0
      let twoArmed = false

      const render = () => {
        raf = 0
        const p = progress
        const f = frameAt(p)

        one.seek(f.filmOne)

        /* film two is only fetched once the reader is actually approaching it,
           so the first film is never competing with it for bandwidth */
        if (!twoArmed && p > BEAT.filmTwo[0] - PREFETCH_LEAD) {
          twoArmed = true
          v2.preload = 'auto'
          v2.load()
        }
        if (twoArmed) two.seek(f.filmTwo)

        v1.style.opacity = String(f.fadeOne)
        v2.style.opacity = String(f.fadeTwo)
        mark.style.transform = reduced ? 'none' : `translate3d(${f.markOffset}vw,0,0)`
        mark.style.opacity = String(f.markOpacity)
      }
      const schedule = () => {
        if (!raf) raf = requestAnimationFrame(render)
      }

      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true, // true, not a number — the playhead IS the scroll position
        onUpdate: (self) => {
          progress = self.progress
          schedule()
        },
      })

      /* draw the correct frame as soon as each film knows its own duration,
         and again on refresh, so arriving mid-section is never blank */
      const onMeta = () => {
        progress = st.progress
        schedule()
      }
      v1.addEventListener('loadedmetadata', onMeta)
      v2.addEventListener('loadedmetadata', onMeta)
      onMeta()

      return () => {
        cancelAnimationFrame(raf)
        v1.removeEventListener('loadedmetadata', onMeta)
        v2.removeEventListener('loadedmetadata', onMeta)
        one.dispose()
        two.dispose()
      }
    }, root)

    return () => ctx.revert()
  }, [reduced])

  return (
    <section
      ref={root}
      aria-label="KONST designs — in motion"
      className="relative w-full bg-ink"
      style={{ height: `${narrow ? TRACK_VH.narrow : TRACK_VH.wide}vh` }}
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-ink">
        <video
          ref={filmOne}
          className="absolute inset-0 h-full w-full object-cover"
          src={FILM_ONE}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />
        <video
          ref={filmTwo}
          className="absolute inset-0 h-full w-full object-cover"
          src={FILM_TWO}
          muted
          playsInline
          preload="metadata"
          style={{ opacity: 0 }}
          aria-hidden="true"
        />

        {/* legibility scrims — top for the chrome, bottom to settle downward */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[22vh]"
          style={{ background: 'linear-gradient(to bottom, rgba(8,7,6,0.72), rgba(8,7,6,0.28) 55%, transparent)' }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[24vh]"
          style={{ background: 'linear-gradient(to top, rgba(8,7,6,0.85), rgba(8,7,6,0.2) 55%, transparent)' }}
        />

        {/* the branding + navigation, over the sequence */}
        <header className="pointer-events-none absolute inset-x-0 top-0 z-30">
          <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-5 pt-6 sm:px-8 sm:pt-8 lg:px-12 lg:pt-9">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="pointer-events-auto font-display text-[13px] font-light tracking-brand text-bone sm:text-[15px]"
            >
              KONST&nbsp;designs
            </a>
            <Navigation />
          </div>
        </header>

        {/* the wordmark that arrives on film one's final frame and leaves as
            film two takes the screen — driven only by scroll */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6">
          <p
            ref={brand}
            style={{ opacity: 0, willChange: 'transform, opacity' }}
            className="whitespace-nowrap font-display text-[clamp(2rem,7vw,5.6rem)] font-light leading-none tracking-[0.06em] text-bone [text-shadow:0_2px_28px_rgba(8,7,6,0.6)]"
          >
            KONST&nbsp;designs
          </p>
        </div>
      </div>
    </section>
  )
}
