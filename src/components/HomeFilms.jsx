import { useLayoutEffect, useRef } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'
import { Navigation } from './Navigation.jsx'
import { BEAT, PREFETCH_LEAD, QUOTES, frameAt, quoteAt } from '../home/sequence.js'
import { ASH, BURN_W, SMOKE, BurnMark } from '../home/BurnMark.jsx'

gsap.registerPlugin(ScrollTrigger)

const FILM_ONE = '/assets/video/film-one.mp4'
const FILM_TWO = '/assets/video/film-two.mp4'

const BRAND = 'KONST DESIGN'
const BRAND_SUB = 'Architecture · Interior Designs'

/** Scroll budget for the whole sequence, in viewport heights. Long on purpose:
 *  the films must have room to be read frame by frame, and the burn needs room
 *  to be watched rather than flicked past. */
const TRACK_VH = { wide: 820, narrow: 640 }

const goTo = (id) => (e) => {
  e.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const CTA_BASE =
  'group inline-flex items-center justify-center gap-3 px-7 py-4 font-sans text-[10.5px] tracking-label transition-colors duration-500'

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
 *  Over the top: a caption in the lower-left that follows what the film is
 *  actually showing, the wordmark burning away between the two films, and the
 *  closing title and calls to action at the end of the second. All of it is a
 *  pure function of scroll position (see `sequence.js`), so all of it reverses.
 */
export function HomeFilms({ viewport, reduced = false }) {
  const root = useRef(null)
  const filmOne = useRef(null)
  const filmTwo = useRef(null)
  const mark = useRef(null)
  const quotes = useRef(null)
  const ending = useRef(null)
  const narrow = viewport?.mobile || viewport?.portrait

  useLayoutEffect(() => {
    const el = root.current
    const v1 = filmOne.current
    const v2 = filmTwo.current
    const svg = mark.current
    if (!el || !v1 || !v2 || !svg) return

    const ctx = gsap.context((self) => {
      v1.pause() // surfaces we seek — they must never run in real time
      v2.pause()

      const one = scrubber(v1)
      const two = scrubber(v2)

      /* everything the burn writes to, looked up once */
      const eaten = svg.querySelector('[data-burn-eaten]')
      const charGrad = svg.querySelector('[data-burn-char]')
      const emberGrad = svg.querySelector('[data-burn-ember]')
      const glow = svg.querySelector('[data-burn-glow]')
      const ashG = svg.querySelector('[data-burn-ash]')
      const smokeG = svg.querySelector('[data-burn-smoke]')
      const ashEls = ASH.map((_, i) => svg.querySelector(`[data-ash="${i}"]`))
      const smokeEls = SMOKE.map((_, i) => svg.querySelector(`[data-smoke="${i}"]`))

      const quoteEls = QUOTES.map((q) => self.selector(`[data-quote="${q.id}"]`)[0])
      const endEls = ['title', 'sub', 'cta1', 'cta2'].map(
        (k) => self.selector(`[data-end="${k}"]`)[0],
      )

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

        /* ── the burn ─────────────────────────────────────────────────────
           One front position drives all five layers. The letters are drawn
           once and never transformed; only the masks move across them. */
        svg.style.opacity = String(f.markVisible)
        const front = f.burn * BURN_W

        eaten.setAttribute('width', String(front))

        /* the scorch band trails the front; the ember band is tighter still */
        charGrad.setAttribute('x1', String(front - 190))
        charGrad.setAttribute('x2', String(front + 40))
        emberGrad.setAttribute('x1', String(front - 62))
        emberGrad.setAttribute('x2', String(front + 16))
        glow.style.opacity = String(f.ember * 0.85)

        /* ash and smoke only exist while the front is actually travelling */
        ashG.style.opacity = String(f.ember)
        smokeG.style.opacity = String(f.ember)
        for (let i = 0; i < ashEls.length; i++) {
          const a = ASH[i]
          const lift = f.ember
          ashEls[i].setAttribute('cx', String(front - a.lead + a.dx * lift))
          ashEls[i].setAttribute('cy', String(a.y - a.dy * lift))
          ashEls[i].style.opacity = String(Math.max(0, 1 - lift * 0.75))
        }
        for (let i = 0; i < smokeEls.length; i++) {
          const s = SMOKE[i]
          smokeEls[i].setAttribute('cx', String(front - s.lead + s.dx * f.ember))
          smokeEls[i].setAttribute('cy', String(200 - s.dy * f.ember))
          smokeEls[i].style.opacity = String(s.o * (1 - f.ember * 0.45))
        }

        /* ── captions ─────────────────────────────────────────────────────
           Each one owns a band of the scroll; outside it, it is simply not
           there, so two can never overlap and scrolling back up hands over
           in exactly the reverse order. */
        for (let i = 0; i < quoteEls.length; i++) {
          const o = quoteAt(p, QUOTES[i].at)
          quoteEls[i].style.opacity = String(o)
          quoteEls[i].style.transform = reduced ? 'none' : `translate3d(0,${(1 - o) * 14}px,0)`
        }

        /* ── the closing scene ────────────────────────────────────────── */
        const ends = [f.endTitle, f.endSub, f.endCta1, f.endCta2]
        for (let i = 0; i < endEls.length; i++) {
          endEls[i].style.opacity = String(ends[i])
          endEls[i].style.transform = reduced ? 'none' : `translate3d(0,${(1 - ends[i]) * 26}px,0)`
        }
        /* the buttons are only clickable once they are actually there */
        ending.current.style.pointerEvents = f.endCta1 > 0.6 ? 'auto' : 'none'
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
         so arriving mid-section is never blank */
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
      aria-label="KONST DESIGN — in motion"
      className="relative w-full bg-ink"
      style={{ height: `${narrow ? TRACK_VH.narrow : TRACK_VH.wide}vh` }}
    >
      <div className="sticky top-0 panel-h w-full overflow-hidden bg-ink">
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

        {/* legibility scrims — top for the chrome, bottom for the caption */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[22vh]"
          style={{ background: 'linear-gradient(to bottom, rgba(8,7,6,0.72), rgba(8,7,6,0.28) 55%, transparent)' }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[30vh]"
          style={{ background: 'linear-gradient(to top, rgba(8,7,6,0.86), rgba(8,7,6,0.22) 55%, transparent)' }}
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
              className="pointer-events-auto font-sans text-[11px] font-extralight uppercase tracking-brand text-bone sm:text-[12.5px]"
            >
              KONST&nbsp;DESIGN
            </a>
            <Navigation />
          </div>
        </header>

        {/* the wordmark, burning — stationary, centred, letters only */}
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <BurnMark text={BRAND} sub={BRAND_SUB} markRef={mark} />
        </div>

        {/* ── the caption, lower left, clear of the navigation ──────────── */}
        <div
          ref={quotes}
          className="pointer-events-none absolute bottom-0 left-0 z-20 w-full px-5 pb-10 sm:px-8 sm:pb-12 lg:max-w-[46vw] lg:px-12 lg:pb-16"
        >
          {QUOTES.map((q) => (
            <div
              key={q.id}
              data-quote={q.id}
              style={{ opacity: 0, willChange: 'transform, opacity' }}
              className="absolute bottom-20 left-5 right-5 sm:bottom-14 sm:left-8 sm:right-8 lg:bottom-16 lg:left-12 lg:right-auto lg:max-w-[52vw]"
            >
              {/* the large caps line, then the sentence set small under it —
                  the same pairing the About stages use */}
              <p className="font-display text-[clamp(1.6rem,4.4vw,3.4rem)] font-light uppercase leading-[1.02] tracking-[0.035em] text-bone [text-shadow:0_2px_24px_rgba(8,7,6,0.9)]">
                {q.heading}
              </p>
              <p className="mt-2 max-w-[34ch] font-display text-[clamp(0.82rem,1.5vw,1.15rem)] font-light italic leading-snug text-bone/75 [text-shadow:0_2px_16px_rgba(8,7,6,0.9)] sm:mt-3">
                {q.sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── the closing scene, at the end of the second film ──────────── */}
        <div
          ref={ending}
          style={{ pointerEvents: 'none' }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center"
        >
          {/* high-contrast editorial serif — hairline horizontals against
              weighted stems, tracked open. Delicate, not bold; the weight is
              400 and never rises. Size, position, alignment and the
              scroll-driven reveal are unchanged. */}
          <p
            data-end="title"
            style={{ opacity: 0, willChange: 'transform, opacity' }}
            className="font-editorial text-[clamp(1.9rem,7vw,5.4rem)] leading-[1.05] tracking-editorial text-bone [text-shadow:0_2px_30px_rgba(8,7,6,0.7)]"
          >
            {BRAND}
          </p>
          <p
            data-end="sub"
            style={{ opacity: 0, willChange: 'transform, opacity' }}
            className="mt-5 font-display text-[clamp(0.9rem,1.7vw,1.15rem)] font-light italic text-bone/75 [text-shadow:0_2px_18px_rgba(8,7,6,0.7)]"
          >
            Architecture, 3D design, visualization
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <a
              data-end="cta1"
              href="#projects"
              onClick={goTo('projects')}
              style={{ opacity: 0, willChange: 'transform, opacity' }}
              className={`${CTA_BASE} border border-brass bg-brass text-ink hover:border-bone hover:bg-bone`}
            >
              Explore Our Work
              <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
            </a>
            <a
              data-end="cta2"
              href="#start-project"
              onClick={goTo('start-project')}
              style={{ opacity: 0, willChange: 'transform, opacity' }}
              className={`${CTA_BASE} border border-bone bg-bone text-ink hover:border-brass hover:bg-brass`}
            >
              Start Your Project
              <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
