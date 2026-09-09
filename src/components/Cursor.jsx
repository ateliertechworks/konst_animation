import { useEffect, useRef, useState } from 'react'

/** Everything a reader can actually act on — the ring opens over these. */
const INTERACTIVE = 'a, button, [role="button"], input, textarea, select, label, summary, [data-cursor]'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CURSOR  ·  a drafting reticle, not a blob
 * ─────────────────────────────────────────────────────────────────────────────
 *  A precise dot with a thin ring trailing behind it — the ring eases toward
 *  the pointer rather than tracking it exactly, which is what makes it read as
 *  weighted rather than glued on. Over anything clickable the ring opens and
 *  warms to brass; over pressed elements it tightens.
 *
 *  It is purely decorative: `pointer-events: none` throughout, so it can never
 *  intercept a click, and it is not rendered at all on touch/coarse-pointer
 *  devices — a phone gets its native behaviour and no hidden system cursor.
 */
export function Cursor() {
  const [fine, setFine] = useState(false)
  const dot = useRef(null)
  const ring = useRef(null)

  /* only pointer devices that can actually hover get a custom cursor */
  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine) and (hover: hover)')
    const sync = () => setFine(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!fine) return
    const d = dot.current
    const r = ring.current
    if (!d || !r) return

    document.documentElement.dataset.cursorMode = 'custom'

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let rx = x
    let ry = y
    let raf = 0
    let shown = false

    const frame = () => {
      raf = requestAnimationFrame(frame)
      /* the ring eases in; the dot is exact */
      rx += (x - rx) * 0.18
      ry += (y - ry) * 0.18
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`
      d.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
    }
    raf = requestAnimationFrame(frame)

    const move = (e) => {
      x = e.clientX
      y = e.clientY
      if (!shown) {
        shown = true
        d.style.opacity = '1'
        r.style.opacity = '1'
      }
      const over = e.target instanceof Element ? e.target.closest(INTERACTIVE) : null
      r.dataset.over = over ? 'true' : 'false'
    }
    const leave = () => {
      shown = false
      d.style.opacity = '0'
      r.style.opacity = '0'
    }
    const down = () => (r.dataset.down = 'true')
    const up = () => (r.dataset.down = 'false')

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    document.addEventListener('pointerleave', leave)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.removeEventListener('pointerleave', leave)
      delete document.documentElement.dataset.cursorMode
    }
  }, [fine])

  if (!fine) return null

  return (
    <>
      <span ref={ring} data-cursor-ring aria-hidden="true" />
      <span ref={dot} data-cursor-dot aria-hidden="true" />
    </>
  )
}
