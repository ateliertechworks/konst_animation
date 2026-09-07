import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Navigation } from './Navigation.jsx'
import { SCROLL_STAGES } from '../data/homeVideo.js'

gsap.registerPlugin(ScrollTrigger)

const goTo = (id) => (e) => {
  e.preventDefault()
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const CTA = {
  dark: 'border border-ink bg-ink text-bone hover:border-brass hover:bg-brass hover:text-ink',
  light: 'border border-bone bg-bone text-ink hover:border-brass hover:bg-brass hover:text-ink',
}

const VIDEO_AUTOPLAY = '/assets/video/animation.mp4'
const VIDEO_SCROLL = '/assets/video/scroll.mp4'

/** How much scroll drives the second (scrubbed) film, in viewport heights. */
const TRACK_VH = 300

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  HOME · TWO-FILM HERO
 * ─────────────────────────────────────────────────────────────────────────────
 *  1. animation.mp4 — the very top of the Home page. It autoplays, loops and
 *     runs on its own, independent of scroll (muted + inline so the browser
 *     permits autoplay). This is the first thing the visitor sees.
 *
 *  2. scroll.mp4 — appears next. It NEVER plays on its own: no `autoplay`, no
 *     `loop`, never `play()`ed. Its playhead is bound 1:1 to scroll through a
 *     pinned section (`scrub: true`) — scroll down and it advances, stop and it
 *     freezes on that exact frame, scroll up and it runs backward.
 *
 *  The existing branding + navigation overlay sits over the top hero (film 1).
 */
export function HomeVideo() {
  const scrollSection = useRef(null)
  const scrollVideo = useRef(null)

  useLayoutEffect(() => {
    const el = scrollSection.current
    const vid = scrollVideo.current
    if (!el || !vid) return

    const ctx = gsap.context((self) => {
      vid.pause() // a surface we seek — it must never run in real time

      /**
       * Seeking pipeline, built for smooth scrubbing:
       *  - the scroll trigger only RECORDS the target progress (cheap);
       *  - the actual seek is applied inside a requestAnimationFrame, once per
       *    paint, never per scroll event;
       *  - the target is quantised to the frame grid, and skipped when it is
       *    within half a frame of the current time, so we never hammer the
       *    decoder with sub-frame seeks;
       *  - while a seek is in flight (`seeking`), new targets are only queued
       *    and applied on `seeked` — rapid overlapping seeks on compressed video
       *    are exactly what stalls playback.
       */
      const FPS = 30
      let target = 0
      let raf = 0

      const apply = () => {
        raf = 0
        const d = vid.duration
        if (!Number.isFinite(d) || d <= 0) return
        const t = Math.round(Math.min(d - 0.05, Math.max(0, target * d)) * FPS) / FPS
        if (Math.abs(t - vid.currentTime) < 0.5 / FPS) return
        if (vid.seeking) return // wait for `seeked`, then apply the latest target
        vid.currentTime = t
      }
      const schedule = () => {
        if (!raf) raf = requestAnimationFrame(apply)
      }
      vid.addEventListener('seeked', schedule)

      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true, // true, not a number — the playhead IS the scroll position
        onUpdate: (self) => {
          target = self.progress
          schedule()
        },
      })

      const onMeta = () => {
        target = st.progress
        schedule()
      }
      if (vid.readyState >= 1) onMeta()
      else vid.addEventListener('loadedmetadata', onMeta, { once: true })

      /**
       * Captions: four stages, one on screen at a time, tied to the exact same
       * scroll range the film itself is bound to (identical trigger/start/end,
       * so a caption and the frame the reader sees always agree). A separate,
       * independently scrubbed timeline — this never touches the seek pipeline
       * above. Each stage rises in and settles, then fades out in place as the
       * next one rises in; only the closing stage has no exit, since it is the
       * sequence's resting end state.
       */
      const stageEls = SCROLL_STAGES.map((s) => self.selector(`[data-stage="${s.id}"]`)[0])
      gsap.set(stageEls, { opacity: 0, y: 14 })
      gsap.set(stageEls[0], { opacity: 1, y: 0 }) // the first stage is already the resting state on arrival

      const SEG = 100 / SCROLL_STAGES.length
      const EASE_UNITS = SEG * 0.15
      const capTl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: true },
      })
      stageEls.forEach((stageEl, i) => {
        const from = i * SEG
        const to = from + SEG
        if (i > 0) capTl.to(stageEl, { opacity: 1, y: 0, duration: EASE_UNITS }, from)
        if (i < stageEls.length - 1) capTl.to(stageEl, { opacity: 0, duration: EASE_UNITS }, to - EASE_UNITS)
      })

      // pin the timeline's total length to exactly 100 — the closing stage's
      // enter fade is the last tween, ending well short of 100, and GSAP would
      // otherwise auto-shrink the timeline to that length, which compresses
      // the scroll-to-stage mapping and shifts every boundary early
      capTl.set({}, {}, 100)

      return () => {
        cancelAnimationFrame(raf)
        vid.removeEventListener('seeked', schedule)
      }
    }, scrollSection)

    return () => ctx.revert()
  }, [])

  return (
    <>
      {/* ── FILM 1 · autoplay + loop, independent of scroll ──────────────── */}
      <section aria-label="Konst Design" className="relative h-[100svh] w-full overflow-hidden bg-ink">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={VIDEO_AUTOPLAY}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
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

        {/* the existing branding + navigation, over the top hero */}
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
              KONST&nbsp;DESIGN
            </a>
            <Navigation />
          </div>
        </header>

        {/* ── centred brand statement, over the film — separate from the nav
            header above it ─────────────────────────────────────────────── */}
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">
          {/* a soft radial scrim behind the words only, so contrast holds
              without dimming the film as a whole */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(58% 50% at 50% 50%, rgba(8,7,6,0.4) 0%, rgba(8,7,6,0.14) 55%, transparent 78%)',
            }}
          />
          <h1 className="font-display text-[clamp(2.2rem,7vw,5.6rem)] font-light uppercase leading-[0.95] tracking-[0.04em] text-bone [text-shadow:0_2px_28px_rgba(8,7,6,0.6)]">
            KONST&nbsp;DESIGNS
          </h1>
          {/* the supporting line and its two calls to action sit directly
              under the wordmark — this film autoplays and loops, so they are
              simply present rather than scroll-triggered */}
          <p className="mt-6 font-display text-[clamp(0.85rem,1.6vw,1.05rem)] font-light italic leading-snug text-bone/70 [text-shadow:0_2px_18px_rgba(8,7,6,0.6)]">
            Architecture · Interiors · 3D Visualizations
          </p>
          <div className="pointer-events-auto mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <a
              href="#projects"
              onClick={goTo('projects')}
              className={`group inline-flex items-center justify-center gap-3 px-6 py-3.5 font-sans text-[10.5px] tracking-label transition-colors duration-500 ${CTA.dark}`}
            >
              Explore our work
              <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
            </a>
            <a
              href="#start-project"
              onClick={goTo('start-project')}
              className={`group inline-flex items-center justify-center gap-3 px-6 py-3.5 font-sans text-[10.5px] tracking-label transition-colors duration-500 ${CTA.light}`}
            >
              Start your project
              <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── FILM 2 · scroll-scrubbed, never autoplays ────────────────────── */}
      <section
        ref={scrollSection}
        aria-label="Konst Design — in motion"
        className="relative w-full bg-ink"
        style={{ height: `${TRACK_VH}vh` }}
      >
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-ink">
          <video
            ref={scrollVideo}
            className="absolute inset-0 h-full w-full object-cover"
            src={VIDEO_SCROLL}
            muted
            playsInline
            preload="auto"
          />
          {/* bottom scrim to settle into the section below */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[26vh]"
            style={{ background: 'linear-gradient(to top, rgba(8,7,6,0.9), rgba(8,7,6,0.2) 55%, transparent)' }}
          />

          {/* ── bottom-left brand statement, over the film — same font family
              and premium treatment throughout; four sequential captions, one
              on screen at a time, each pinned to its own slice of the film's
              scroll range ─────────────────────────────────────────────────── */}
          <div className="pointer-events-none absolute inset-0 z-20">
            {/* one shared scrim, strongest at the bottom-left where every
                stage's text sits, fading out toward the rest of the frame —
                present for the whole sequence since a stage is always active */}
            <div
              className="absolute inset-0 -z-10"
              style={{
                background:
                  'radial-gradient(62% 58% at 6% 100%, rgba(8,7,6,0.6) 0%, rgba(8,7,6,0.24) 42%, transparent 70%)',
              }}
            />

            {SCROLL_STAGES.map((stage) => (
              <div
                key={stage.id}
                data-stage={stage.id}
                className="absolute inset-0 flex flex-col items-start justify-end px-5 pb-12 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20"
              >
                <h2 className="font-display text-[clamp(1.9rem,4.8vw,4rem)] font-light uppercase leading-[0.98] tracking-[0.04em] text-bone [text-shadow:0_2px_28px_rgba(8,7,6,0.6)]">
                  {stage.heading.map((line, i) => (
                    <span key={line}>
                      {line}
                      {i < stage.heading.length - 1 && <br />}
                    </span>
                  ))}
                </h2>
                <p className="mt-5 font-display text-[clamp(0.85rem,1.6vw,1.05rem)] font-light italic leading-snug text-bone/70 [text-shadow:0_2px_18px_rgba(8,7,6,0.6)]">
                  {stage.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
