import { useCallback, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { LoadingScreen } from './components/LoadingScreen.jsx'
import { HomeVideo } from './components/HomeVideo.jsx'
import { Quote } from './components/Quote.jsx'
import { Services } from './components/Services.jsx'
import { Projects } from './components/Projects.jsx'
import { Experience } from './components/Experience.jsx'
import { Recognition } from './components/Recognition.jsx'
import { HowWeWork } from './components/HowWeWork.jsx'
import { StartProject } from './components/StartProject.jsx'
import { Studios } from './components/Studios.jsx'
import { SiteFooter } from './components/SiteFooter.jsx'
import { About } from './components/About.jsx'
import { setExperience, useExperience } from './state/experience.js'
import { setReducedMotion } from './state/controller.js'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion.js'
import { useViewport } from './hooks/useViewport.js'

export default function App() {
  const reduced = usePrefersReducedMotion()
  const viewport = useViewport()
  const phase = useExperience((s) => s.phase)
  // The Home hero is now the scroll-scrubbed film — there are no 3D assets to
  // preload, so the title card is a short deliberate beat rather than an
  // asset-progress gate.
  const [pct, setPct] = useState(0)

  useEffect(() => {
    setReducedMotion(reduced)
    gsap.globalTimeline.timeScale(reduced ? 2.8 : 1)
  }, [reduced])

  useEffect(() => {
    const start = performance.now()
    const dur = reduced ? 500 : 1500
    let raf = 0
    const tick = (t) => {
      const e = Math.min(1, (t - start) / dur)
      setPct(Math.round(e * 100))
      if (e < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  const ready = pct >= 100

  useEffect(() => {
    document.body.dataset.locked = phase === 'live' ? 'false' : 'true'
  }, [phase])

  const handOver = useCallback(() => {
    setExperience({ phase: 'live', assetsReady: true })
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [])

  const shown = pct

  return (
    <>
      <main id="top">
        {/* Home hero: the scroll-scrubbed film. The former 3D room animation
            has been removed; the page flows from the video straight into the
            first quote and About below. */}
        <HomeVideo />

        {/* HOME → QUOTE 1 → ABOUT → QUOTE 2 → SERVICES → QUOTE 3. */}
        <Quote
          index="01"
          eyebrow="THE STUDIO"
          tag="ARCHITECTURE · INTERIORS · 3D"
          lines={['DESIGNED AROUND', 'THE WAY YOU LIVE.']}
          body="We design, build and develop homes shaped around the people who live in them — clean, modern and progressive, from the first plan to the finished room."
          reduced={reduced}
        />

        <About viewport={viewport} />

        <Quote
          index="02"
          eyebrow="OUR EXPERTISE"
          tag="ARCHITECTURE · INTERIORS · 3D"
          lines={['ARCHITECTURE.', 'INTERIORS.', 'VISUALIZATION.']}
          body="Three disciplines, one studio. Every project moves through the same hands — from the first sketch of a plan to the last light fitting on site."
          reduced={reduced}
        />

        <Services viewport={viewport} reduced={reduced} />

        <Quote
          index="03"
          eyebrow="THE STUDIO"
          tag="COIMBATORE"
          lines={['DRAWN, DETAILED,', 'DELIVERED.']}
          body="The same care from the first measured drawing to the day the keys are handed over — considered, resolved, and finished to last."
          reduced={reduced}
        />

        {/* Selected work — the 3D presentation-board gallery Quote 3 introduces.
            Added after Quote 3; nothing above it is touched. */}
        <Projects viewport={viewport} />

        {/* Everything after Projects — one continuous cinematic close on the
            site's cream drafting-paper language, ending on the dark footer.
            Additive only; every section above is untouched. */}
        <Experience reduced={reduced} />
        <Recognition reduced={reduced} />
        <HowWeWork reduced={reduced} />
        <StartProject reduced={reduced} />
        <Studios viewport={viewport} reduced={reduced} />
        <SiteFooter reduced={reduced} />
      </main>
      {phase !== 'live' && (
        <LoadingScreen progress={shown} ready={ready} onDone={handOver} />
      )}
    </>
  )
}
