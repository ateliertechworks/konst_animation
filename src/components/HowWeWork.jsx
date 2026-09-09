import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PRINCIPLES } from '../data/studio.js'

gsap.registerPlugin(ScrollTrigger)

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  HOW WE WORK  ·  the four-image scroll sequence
 * ─────────────────────────────────────────────────────────────────────────────
 *  Each principle arrives as a real project photograph: as its row scrolls in,
 *  the image enters large and pulled toward the centre of the page, then — tied
 *  1:1 to scroll — settles to its side (alternating left / right) while the
 *  number, title and description rise in on the opposite side. Nothing that has
 *  arrived ever leaves: the pairs accumulate down the page, so by the fourth
 *  all four scenes are stacked and visible, an architectural presentation
 *  assembled by the reader's own movement.
 *
 *  Reuses the site's cream drafting-paper language; reduced motion parks every
 *  pair in its settled state.
 */
export function HowWeWork({ reduced = false }) {
  const root = useRef(null)

  useLayoutEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context((self) => {
      const q = (s) => self.selector(s)

      gsap.from(q('[data-reveal] > *'), {
        opacity: reduced ? 1 : 0, y: reduced ? 0 : 24, duration: 1, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 72%', once: true },
      })

      q('[data-row]').forEach((row) => {
        const img = row.querySelector('[data-row-img]')
        const copy = row.querySelector('[data-row-copy]')
        const left = row.dataset.side === 'left'
        if (reduced) {
          gsap.set([img, copy], { opacity: 1, x: 0, y: 0, scale: 1 })
          gsap.set(copy.children, { opacity: 1, y: 0 })
          return
        }
        const tl = gsap.timeline({
          scrollTrigger: { trigger: row, start: 'top 88%', end: 'top 34%', scrub: true },
        })
        /* image enters pulled toward page centre, then travels to its side */
        tl.fromTo(
          img,
          { opacity: 0, scale: 1.14, xPercent: left ? 42 : -42, yPercent: 8 },
          { opacity: 1, scale: 1, xPercent: 0, yPercent: 0, ease: 'power2.out', duration: 1 },
          0,
        )
        /* text rises in on the opposite side, in one staggered group */
        tl.fromTo(
          copy.children,
          { opacity: 0, y: 34 },
          { opacity: 1, y: 0, ease: 'power2.out', stagger: 0.18, duration: 0.7 },
          0.45,
        )
      })
    }, root)
    return () => ctx.revert()
  }, [reduced])

  return (
    <section
      id="how-we-work"
      ref={root}
      aria-label="How we work"
      className="relative bg-cream"
    >
      <div className="q-grid q-grid-cream" />
      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 py-[10vh] sm:px-10 lg:px-14">
        {/* ── header ───────────────────────────────────────────────────── */}
        <div data-reveal className="max-w-[46rem]">
          <div className="flex items-center gap-4">
            <span className="font-sans text-[11px] tracking-label text-terra">05</span>
            <span className="h-px w-10 bg-cream-line" />
            <span className="font-sans text-[10px] tracking-label text-ink/45">HOW WE WORK</span>
          </div>
          <p className="mt-8 font-sans text-[10px] tracking-label text-brass">WHY KONST designs?</p>
          <h2 className="mt-4 font-display text-[clamp(2.2rem,5vw,4rem)] font-light leading-[1.0] text-ink">
            Four things we<br />never compromise.
          </h2>
          <p className="mt-6 max-w-[42ch] font-sans text-[13px] font-light leading-[1.8] text-ink/60 sm:text-[14px]">
            The reasons clients stay with us across second and third projects — and refer us to their families.
          </p>
        </div>

        {/* ── the four scenes, accumulating down the page ──────────────── */}
        <div className="mt-[10vh] space-y-[14vh]">
          {PRINCIPLES.map((p) => {
            const left = p.side === 'left'
            return (
              <div
                key={p.number}
                data-row
                data-side={p.side}
                className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12"
              >
                <figure
                  data-row-img
                  className={`overflow-hidden border border-cream-line ${
                    left ? 'lg:col-span-7 lg:order-1' : 'lg:col-span-7 lg:col-start-6 lg:order-2'
                  }`}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <div className="aspect-[16/10] w-full">
                    <img
                      src={p.image}
                      alt={`${p.title} — KONST designs`}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </figure>

                <div
                  data-row-copy
                  className={`${
                    left ? 'lg:col-span-4 lg:col-start-9 lg:order-2' : 'lg:col-span-4 lg:col-start-1 lg:order-1'
                  }`}
                >
                  <p className="font-display text-[clamp(1.8rem,3vw,2.6rem)] font-light leading-none text-terra">
                    {p.number}
                  </p>
                  <h3 className="mt-4 font-display text-[clamp(1.6rem,3vw,2.4rem)] font-light leading-[1.05] text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-4 max-w-[34ch] font-sans text-[13px] font-light leading-[1.8] text-ink/65 sm:text-[14px]">
                    {p.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
