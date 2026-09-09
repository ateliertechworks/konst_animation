/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE HOME SEQUENCE, AS PURE ARITHMETIC
 * ─────────────────────────────────────────────────────────────────────────────
 *  Every visual state of the two-film hero is a function of one number: how far
 *  the reader has scrolled through the pinned track, 0 → 1. Nothing here reads
 *  the clock, holds state, or remembers which way the reader was going, which
 *  is precisely what makes the sequence reversible — scrolling up runs it
 *  backward because `frameAt(0.3)` is the same picture whether it was reached
 *  from 0.2 or from 0.4.
 *
 *  Keeping it separate from the component also means the whole storyboard can
 *  be asserted without a browser.
 */

/**
 * Where each beat sits, as fractions of total progress. Read top to bottom this
 * is the sequence: film one scrubs → holds its last frame → "KONST designs"
 * floats in from the right → the films cross-dissolve while the wordmark leaves
 * to the right → film two scrubs to its final frame. The overlaps are
 * deliberate; nothing cuts, every beat hands over to the next.
 */
export const BEAT = {
  filmOne: [0.0, 0.46],
  brandIn: [0.52, 0.66],
  cross: [0.72, 0.84],
  brandOut: [0.74, 0.88],
  filmTwo: [0.72, 1.0],
}

/** how far off-centre the wordmark starts and ends its travel, in vw */
export const TRAVEL = 58

/** how far ahead of film two's first frame we start fetching it */
export const PREFETCH_LEAD = 0.2

const spanOf = (p, [a, b]) => Math.max(0, Math.min(1, (p - a) / (b - a)))
const smooth = (t) => t * t * (3 - 2 * t)

/**
 * The complete picture at progress `p`.
 *
 *  - `filmOne` / `filmTwo` are normalised playheads (0 = first frame, 1 = last)
 *  - `fadeOne` / `fadeTwo` are the two films' opacities
 *  - `markOpacity` / `markOffset` place the wordmark; the offset is in vw and
 *    is positive to the RIGHT of centre, so it enters from the right travelling
 *    left, and leaves travelling right again
 */
export function frameAt(p) {
  const enter = smooth(spanOf(p, BEAT.brandIn))
  const leave = smooth(spanOf(p, BEAT.brandOut))
  const cross = smooth(spanOf(p, BEAT.cross))
  return {
    filmOne: spanOf(p, BEAT.filmOne),
    filmTwo: spanOf(p, BEAT.filmTwo),
    fadeOne: 1 - cross,
    fadeTwo: cross,
    markOpacity: enter * (1 - leave),
    /* brandIn finishes before brandOut opens, so the two never fight */
    markOffset: (1 - enter) * TRAVEL + leave * TRAVEL,
  }
}
