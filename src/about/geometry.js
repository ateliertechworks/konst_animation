/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ONE ROOM. ONE CAMERA. THREE STAGES.
 * ─────────────────────────────────────────────────────────────────────────────
 *  Every coordinate in the About sequence is derived from a single one-point
 *  perspective solve, so the sketch, the concrete shell and the finished
 *  interior are physically incapable of disagreeing about where the window is.
 *
 *  The picture plane is the front of the room. `P(x, y, t)` pushes a point on
 *  that plane to depth `t` (0 = front frame, 1 = back wall) by scaling it about
 *  the vanishing point. Front rect and back rect are therefore homothetic —
 *  which is exactly what a one-point perspective is.
 *
 *  Nothing here knows about scroll. This module is pure geometry.
 */

export const VIEW = { w: 1000, h: 700 }
export const FRONT = { x0: 40, y0: 50, x1: 960, y1: 650 }
export const VP = { x: 500, y: 350 }

/** How much the front frame shrinks by the time it reaches the back wall. */
const K = 0.3217

export const depthScale = (t) => 1 - (1 - K) * t

/** A point on the picture plane, pushed to depth `t`. */
export function P(x, y, t) {
  const s = depthScale(t)
  return [VP.x + (x - VP.x) * s, VP.y + (y - VP.y) * s]
}

/** Picture-plane coordinates from room fractions: u across, v up from floor. */
export const fx = (u) => FRONT.x0 + u * (FRONT.x1 - FRONT.x0)
export const fy = (v) => FRONT.y1 - v * (FRONT.y1 - FRONT.y0)

/* ── path helpers ─────────────────────────────────────────────────────────── */

const n = (v) => Math.round(v * 10) / 10
const pt = (p) => `${n(p[0])} ${n(p[1])}`

export const seg = (a, b) => `M${pt(a)}L${pt(b)}`
export const poly = (pts) => `M${pts.map(pt).join('L')}Z`
export const line = (pts) => `M${pts.map(pt).join('L')}`

/* ── the shell ────────────────────────────────────────────────────────────── */

export const FTL = P(FRONT.x0, FRONT.y0, 0)
export const FTR = P(FRONT.x1, FRONT.y0, 0)
export const FBR = P(FRONT.x1, FRONT.y1, 0)
export const FBL = P(FRONT.x0, FRONT.y1, 0)
export const BTL = P(FRONT.x0, FRONT.y0, 1)
export const BTR = P(FRONT.x1, FRONT.y0, 1)
export const BBR = P(FRONT.x1, FRONT.y1, 1)
export const BBL = P(FRONT.x0, FRONT.y1, 1)

/** The back wall, in absolute coordinates — everything on it lives at t = 1. */
export const BACK = { x0: BTL[0], y0: BTL[1], x1: BTR[0], y1: BBR[1] }

export const SURFACE = {
  ceiling: poly([FTL, FTR, BTR, BTL]),
  floor: poly([FBL, FBR, BBR, BBL]),
  wallL: poly([FTL, BTL, BBL, FBL]),
  wallR: poly([FTR, BTR, BBR, FBR]),
  wallB: poly([BTL, BTR, BBR, BBL]),
}

/** Bounding boxes, used to build the progressive clip sweeps. */
export const BBOX = {
  ceiling: { x: FRONT.x0, y: FRONT.y0, w: 920, h: BTL[1] - FRONT.y0 + 1 },
  floor: { x: FRONT.x0, y: BBL[1] - 1, w: 920, h: FRONT.y1 - BBL[1] + 2 },
  wallL: { x: FRONT.x0, y: FRONT.y0, w: BTL[0] - FRONT.x0 + 1, h: 600 },
  wallR: { x: BTR[0] - 1, y: FRONT.y0, w: FRONT.x1 - BTR[0] + 2, h: 600 },
  wallB: { x: BACK.x0, y: BACK.y0, w: BACK.x1 - BACK.x0, h: BACK.y1 - BACK.y0 },
  room: { x: 0, y: 0, w: VIEW.w, h: VIEW.h },
}

/* ── the window (back wall, t = 1) ────────────────────────────────────────── */

const bw = BACK.x1 - BACK.x0
const bh = BACK.y1 - BACK.y0

export const WIN = {
  x0: BACK.x0 + bw * 0.36,
  x1: BACK.x0 + bw * 0.86,
  y0: BACK.y0 + bh * 0.16,
  y1: BACK.y0 + bh * 0.76,
}
WIN.mx = (WIN.x0 + WIN.x1) / 2
WIN.my = (WIN.y0 + WIN.y1) / 2

/** The opening is a hole, so its reveal recedes toward the vanishing point. */
const R = 0.915
const rin = (x, y) => [VP.x + (x - VP.x) * R, VP.y + (y - VP.y) * R]
export const WINR = {
  tl: rin(WIN.x0, WIN.y0),
  tr: rin(WIN.x1, WIN.y0),
  br: rin(WIN.x1, WIN.y1),
  bl: rin(WIN.x0, WIN.y1),
}

/* ── the door (left wall) ─────────────────────────────────────────────────── */

const DOOR_T = [0.42, 0.7]
const DOOR_V = 0.62 // head height as a fraction of room height

export const DOOR = {
  quad: [
    P(FRONT.x0, fy(0), DOOR_T[0]),
    P(FRONT.x0, fy(DOOR_V), DOOR_T[0]),
    P(FRONT.x0, fy(DOOR_V), DOOR_T[1]),
    P(FRONT.x0, fy(0), DOOR_T[1]),
  ],
  leaf: [
    P(FRONT.x0, fy(0), DOOR_T[0] + 0.012),
    P(FRONT.x0, fy(DOOR_V - 0.014), DOOR_T[0] + 0.012),
    P(FRONT.x0, fy(DOOR_V - 0.014), DOOR_T[1] - 0.012),
    P(FRONT.x0, fy(0), DOOR_T[1] - 0.012),
  ],
  panel: [
    P(FRONT.x0, fy(0.06), DOOR_T[0] + 0.045),
    P(FRONT.x0, fy(DOOR_V - 0.06), DOOR_T[0] + 0.045),
    P(FRONT.x0, fy(DOOR_V - 0.06), DOOR_T[1] - 0.045),
    P(FRONT.x0, fy(0.06), DOOR_T[1] - 0.045),
  ],
  handle: [P(FRONT.x0, fy(0.3), 0.465), P(FRONT.x0, fy(0.345), 0.465)],
}

/* ── the niche and the built-in (right wall) ──────────────────────────────── */

const NICHE_T = [0.28, 0.6]
export const NICHE = {
  quad: [
    P(FRONT.x1, fy(0.18), NICHE_T[0]),
    P(FRONT.x1, fy(0.7), NICHE_T[0]),
    P(FRONT.x1, fy(0.7), NICHE_T[1]),
    P(FRONT.x1, fy(0.18), NICHE_T[1]),
  ],
  shelf: [
    P(FRONT.x1, fy(0.44), NICHE_T[0]),
    P(FRONT.x1, fy(0.44), NICHE_T[1]),
  ],
}

/* ── ceiling structure ────────────────────────────────────────────────────── */

const rect = (u0, u1, t0, t1, v) => [
  P(fx(u0), fy(v), t0),
  P(fx(u1), fy(v), t0),
  P(fx(u1), fy(v), t1),
  P(fx(u0), fy(v), t1),
]

export const CEIL = {
  recess: rect(0.18, 0.82, 0.16, 0.9, 1),
  cove: rect(0.225, 0.775, 0.225, 0.845, 1),
  spots: [0.3, 0.74].flatMap((t) =>
    [0.28, 0.5, 0.72].map((u) => P(fx(u), fy(0.985), t)),
  ),
}

/* ── skirting and cornice bands ───────────────────────────────────────────── */

const band = (planeX, v0, v1) => [
  P(planeX, fy(v0), 0),
  P(planeX, fy(v1), 0),
  P(planeX, fy(v1), 1),
  P(planeX, fy(v0), 1),
]

export const TRIM = {
  skirtL: band(FRONT.x0, 0, 0.035),
  skirtR: band(FRONT.x1, 0, 0.035),
  skirtB: [
    [BACK.x0, BACK.y1],
    [BACK.x1, BACK.y1],
    [BACK.x1, BACK.y1 - 0.035 * 600 * K],
    [BACK.x0, BACK.y1 - 0.035 * 600 * K],
  ],
  corniceL: band(FRONT.x0, 0.968, 1),
  corniceR: band(FRONT.x1, 0.968, 1),
}

/* ── wall materials ───────────────────────────────────────────────────────── */

/** Timber slats run the left wall from the front corner up to the door. */
export const SLATS = Array.from({ length: 7 }, (_, i) => {
  const a = 0.075 + i * 0.048
  return [
    P(FRONT.x0, fy(0.035), a),
    P(FRONT.x0, fy(0.968), a),
    P(FRONT.x0, fy(0.968), a + 0.03),
    P(FRONT.x0, fy(0.035), a + 0.03),
  ]
})

export const STONE = [
  P(FRONT.x1, fy(0.035), 0.2),
  P(FRONT.x1, fy(0.968), 0.2),
  P(FRONT.x1, fy(0.968), 0.66),
  P(FRONT.x1, fy(0.035), 0.66),
]

/* ── furniture ────────────────────────────────────────────────────────────── */

/**
 * An axis-aligned box, floated between two heights. Returns every face; the
 * caller draws the top, the front and whichever flank the camera can see.
 */
export function box2(u0, u1, t0, t1, v0, v1) {
  const A = P(fx(u0), fy(v0), t0)
  const B = P(fx(u1), fy(v0), t0)
  const C = P(fx(u1), fy(v0), t1)
  const D = P(fx(u0), fy(v0), t1)
  const a = P(fx(u0), fy(v1), t0)
  const b = P(fx(u1), fy(v1), t0)
  const c = P(fx(u1), fy(v1), t1)
  const d = P(fx(u0), fy(v1), t1)
  return {
    base: [A, B, C, D],
    top: [a, b, c, d],
    front: [A, B, b, a],
    left: [A, D, d, a],
    right: [B, C, c, b],
  }
}

/** The common case: a box standing on the floor. */
export const box = (u0, u1, t0, t1, v) => box2(u0, u1, t0, t1, 0, v)

export const centroid = (pts) => [
  pts.reduce((s, p) => s + p[0], 0) / pts.length,
  pts.reduce((s, p) => s + p[1], 0) / pts.length,
]

export const FURNITURE = {
  rug: rect(0.18, 0.72, 0.46, 0.9, 0),
  sofaSeat: box(0.13, 0.5, 0.68, 0.9, 0.125),
  sofaBack: box(0.13, 0.5, 0.855, 0.9, 0.25),
  sofaArmL: box(0.13, 0.175, 0.68, 0.9, 0.19),
  sofaArmR: box(0.455, 0.5, 0.68, 0.9, 0.19),
  table: box(0.3, 0.58, 0.5, 0.64, 0.12),
  chairSeat: box(0.62, 0.79, 0.56, 0.72, 0.125),
  chairBack: box(0.62, 0.79, 0.685, 0.72, 0.28),
  side: box(0.805, 0.895, 0.52, 0.62, 0.16),
  console: box(0.86, 1.0, 0.3, 0.56, 0.17),
  cushA: box2(0.185, 0.255, 0.795, 0.85, 0.125, 0.235),
  cushB: box2(0.375, 0.445, 0.795, 0.85, 0.125, 0.225),
}

/** Where a small object sits when it is placed on a surface. */
FURNITURE.tableTopC = centroid(FURNITURE.table.top)
FURNITURE.consoleTopC = centroid(FURNITURE.console.top)
FURNITURE.sideTopC = centroid(FURNITURE.side.top)

export const CURTAIN = {
  l: [
    [WIN.x0 - 23, BACK.y0 + bh * 0.04],
    [WIN.x0 + 2, BACK.y0 + bh * 0.04],
    [WIN.x0 + 2, BACK.y1],
    [WIN.x0 - 23, BACK.y1],
  ],
  r: [
    [WIN.x1 - 2, BACK.y0 + bh * 0.04],
    [WIN.x1 + 23, BACK.y0 + bh * 0.04],
    [WIN.x1 + 23, BACK.y1],
    [WIN.x1 - 2, BACK.y1],
  ],
}

export const ART = [
  P(FRONT.x0, fy(0.42), 0.14),
  P(FRONT.x0, fy(0.72), 0.14),
  P(FRONT.x0, fy(0.72), 0.3),
  P(FRONT.x0, fy(0.42), 0.3),
]

export const PLANT = {
  potBase: P(fx(0.095), fy(0), 0.35),
  pot: box(0.058, 0.132, 0.325, 0.375, 0.062),
  stem: [P(fx(0.095), fy(0.075), 0.35), P(fx(0.095), fy(0.3), 0.35)],
  canopy: P(fx(0.095), fy(0.36), 0.35),
}

/** Daylight landing on the floor, thrown forward and left of the window. */
export const LIGHT_POOL = [
  P(fx(0.46), fy(0), 0.95),
  P(fx(0.79), fy(0), 0.95),
  P(fx(0.71), fy(0), 0.52),
  P(fx(0.33), fy(0), 0.52),
]
