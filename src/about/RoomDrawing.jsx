import { memo } from 'react'
import {
  ART, BASE_AO, BBOX, BOARDS, BTL, BTR, CABINET, CEIL, CEIL_OUTER, CONTACT,
  CURTAIN, DOOR, FBL, FBR, FRONT, FTL, FTR, FURNITURE, LIGHT_POOL, NICHE, P,
  PENDANT, PENDANT_BAND, RUG, SKIRT, SLATS, SOFA, STONE, SURFACE,
  TABLE_ROUND, TRIM, VIEW, WIN, WINR,
  centroid, fx, fy, line, poly, seg,
} from './geometry.js'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  THE ROOM, IN ONE SVG
 * ─────────────────────────────────────────────────────────────────────────────
 *  Three layers stacked on identical coordinates:
 *
 *    sketch    pen lines that draw themselves stroke by stroke
 *    shell     the same lines gaining surface, depth and shadow
 *    interior  paint, materials, ceiling, floor, furniture, decor, light
 *
 *  Because every layer is generated from `geometry.js`, the window in the
 *  finished interior is the same window, to the pixel, as the one in the first
 *  sketch. There is no second asset to drift out of alignment.
 *
 *  Nothing in here animates. Everything animated carries a `data-` hook and is
 *  driven entirely by the scrubbed timeline in `useAboutTimeline.js`.
 */

/**
 * A stroke that has not been drawn yet.
 *
 * `pathLength` normalises every path so a single dashoffset value means
 * "undrawn" whatever the line's real length. It is 1000 rather than 1 because
 * GSAP rounds px-unit values to whole numbers — normalising to 1 collapses the
 * whole reveal into a single integer step, and every line snaps in instead of
 * drawing itself.
 */
export const SK_LEN = 1000

const Ink = ({ d, w = 1.15, o = 0.78, g }) => (
  <path
    data-sk={g}
    d={d}
    pathLength={SK_LEN}
    strokeDasharray={SK_LEN}
    strokeDashoffset={SK_LEN}
    strokeWidth={w}
    style={{ opacity: o }}
  />
)

/**
 * The same three faces, but with each face outlined in its own fill and the
 * joins rounded. Real furniture has an eased arris — a machined timber edge, a
 * stuffed cushion seam — and that softening is most of what separates a chair
 * from a cube. `r` is the edge radius in user units.
 */
const Piece = ({ b, side = 'right', top, front, dark, r = 3 }) => (
  <g strokeLinejoin="round" strokeLinecap="round">
    <path d={poly(b[side])} fill={dark} stroke={dark} strokeWidth={r} />
    <path d={poly(b.front)} fill={front} stroke={front} strokeWidth={r} />
    <path d={poly(b.top)} fill={top} stroke={top} strokeWidth={r} />
  </g>
)

/** A horizontal disc — a round table top, a stool seat, a lamp base. */
const Disc = ({ d, fill, stroke, w = 0 }) => (
  <ellipse cx={d.cx} cy={d.cy} rx={d.rx} ry={d.ry} fill={fill} stroke={stroke} strokeWidth={w} />
)

/**
 * The shadow a piece drops on the floor. Two ellipses: a wide soft one for the
 * ambient darkening and a tight dense one right at the feet, which is what
 * actually makes an object look like it is standing on the floor rather than
 * hovering a centimetre above it.
 */
const Contact = ({ d, o = 1 }) => (
  <g filter="url(#f-soft)" opacity={o}>
    {/* the wide ambient darkening — it has to spill past the piece to read */}
    <ellipse cx={d.cx} cy={d.cy + d.ry * 0.12} rx={d.rx * 1.38} ry={d.ry * 1.4} fill="#3a2a1a" opacity="0.3" />
    {/* and the tight dense core right at the feet */}
    <ellipse cx={d.cx} cy={d.cy + d.ry * 0.26} rx={d.rx * 0.86} ry={d.ry * 0.72} fill="#1d1409" opacity="0.42" />
  </g>
)

/**
 * A clip that wipes its content in from one edge.
 *
 * `from` names the edge the surface grows out of — a wall grows out of the
 * corner it meets, the floor grows back-to-front — and the timeline reads it
 * off `data-from`. The origin is expressed against the rect's own box rather
 * than in user space: GSAP's `svgOrigin` leaves a residual translate behind
 * when it is set on an element that already carries a transform, which silently
 * slides a clip off the surface it is meant to reveal.
 */
const Sweep = ({ id, bbox, from, pad = 2 }) => (
  <clipPath id={id} clipPathUnits="userSpaceOnUse">
    <rect
      data-clip={id}
      data-from={from}
      x={bbox.x - pad}
      y={bbox.y - pad}
      width={bbox.w + pad * 2}
      height={bbox.h + pad * 2}
    />
  </clipPath>
)

const F = FURNITURE
const artC = centroid(ART)

export const RoomDrawing = memo(function RoomDrawing() {
  return (
    <svg
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      className="block h-auto w-full"
      aria-hidden="true"
      shapeRendering="geometricPrecision"
    >
      <defs>
        {/* progressive wipes ------------------------------------------------ */}
        <Sweep id="sw-floor" bbox={BBOX.floor} from="top" />
        <Sweep id="sw-wallL" bbox={BBOX.wallL} from="right" />
        <Sweep id="sw-wallR" bbox={BBOX.wallR} from="left" />
        <Sweep id="sw-wallB" bbox={BBOX.wallB} from="left" />
        <Sweep id="sw-ceil" bbox={BBOX.ceiling} from="bottom" />
        <Sweep id="sw-pB" bbox={BBOX.wallB} from="left" />
        <Sweep id="sw-pL" bbox={BBOX.wallL} from="left" />
        <Sweep id="sw-pR" bbox={BBOX.wallR} from="right" />
        <Sweep id="sw-pC" bbox={BBOX.ceiling} from="top" />
        <Sweep id="sw-fFin" bbox={BBOX.floor} from="bottom" />
        <Sweep id="sw-stone" bbox={BBOX.wallR} from="left" />

        {/* the room can only ever be seen through its own frame ------------- */}
        <clipPath id="sw-art" clipPathUnits="userSpaceOnUse">
          <path d={poly(ART)} />
        </clipPath>

        <clipPath id="sw-rug" clipPathUnits="userSpaceOnUse">
          <path d={poly(FURNITURE.rug)} />
        </clipPath>

        <clipPath id="sw-frame" clipPathUnits="userSpaceOnUse">
          <rect x="0" y="0" width={VIEW.w} height={VIEW.h} />
        </clipPath>

        <linearGradient id="gr-cornerL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.34" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gr-cornerR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.34" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gr-ceil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.34" />
          <stop offset="1" stopColor="#000" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="gr-floorFade" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.6" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gr-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfd8dd" />
          <stop offset="0.55" stopColor="#b9c3c6" />
          <stop offset="1" stopColor="#cdbfa6" />
        </linearGradient>
        {/* one blur, shared by every contact shadow in the room */}
        <filter id="f-soft" x="-80%" y="-120%" width="260%" height="360%">
          <feGaussianBlur stdDeviation="9" />
        </filter>

        {/* light natural oak, laid pale at the back and warming toward the
            camera — the reference room's floor, not a dark stained one */}
        <linearGradient id="gr-oak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cdae84" />
          <stop offset="1" stopColor="#e2c9a6" />
        </linearGradient>

        {/* ── materials ────────────────────────────────────────────────────
            Each is a gradient rather than a flat fill, because a flat fill is
            exactly what makes vector furniture read as a diagram: real fabric
            falls off toward its own shadow, real stone is not one colour, and
            brass has a hot line across it. */}
        {/* the sofa's charcoal weave */}
        <linearGradient id="m-fabTop" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#63656a" />
          <stop offset="1" stopColor="#53555a" />
        </linearGradient>
        <linearGradient id="m-fabFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#55575c" />
          <stop offset="1" stopColor="#44464b" />
        </linearGradient>
        <linearGradient id="m-fabSide" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0" stopColor="#42444a" />
          <stop offset="1" stopColor="#34363b" />
        </linearGradient>
        {/* the armchair's taupe */}
        <linearGradient id="m-taupeTop" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor="#a99f92" />
          <stop offset="1" stopColor="#968c80" />
        </linearGradient>
        <linearGradient id="m-taupeFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#948a7e" />
          <stop offset="1" stopColor="#7f7669" />
        </linearGradient>
        <linearGradient id="m-taupeSide" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0" stopColor="#7d7468" />
          <stop offset="1" stopColor="#68604f" />
        </linearGradient>
        {/* the cream knit thrown over the arm */}
        <linearGradient id="m-knit" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#e9e1d2" />
          <stop offset="1" stopColor="#d3c9b6" />
        </linearGradient>
        <linearGradient id="m-stoneTop" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#ddd4c6" />
          <stop offset="0.45" stopColor="#cbc1b1" />
          <stop offset="0.7" stopColor="#d6ccbd" />
          <stop offset="1" stopColor="#c2b8a8" />
        </linearGradient>
        <linearGradient id="m-walnutTop" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#75634f" />
          <stop offset="1" stopColor="#5d4e3e" />
        </linearGradient>
        <linearGradient id="m-walnutFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b4c3d" />
          <stop offset="1" stopColor="#463a2e" />
        </linearGradient>
        <linearGradient id="m-brass" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="#a98851" />
          <stop offset="0.42" stopColor="#dcbc82" />
          <stop offset="0.6" stopColor="#c3a06a" />
          <stop offset="1" stopColor="#8e7346" />
        </linearGradient>
        {/* the warm wash the window throws across the floor */}
        <linearGradient id="m-daylight" x1="0.7" y1="0" x2="0.1" y2="1">
          <stop offset="0" stopColor="#ffeccb" stopOpacity="0.5" />
          <stop offset="0.55" stopColor="#ffe6bd" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ffe0b2" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gr-stone" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9c2b5" />
          <stop offset="0.5" stopColor="#b0a99c" />
          <stop offset="1" stopColor="#c4bcae" />
        </linearGradient>
      </defs>

      <g clipPath="url(#sw-frame)">
        {/* ══ SHELL ═══════════════════════════════════════════════════════ */}
        {/*  The sketch lines gaining surface, at the positions they already
            occupy. Every one of these is a wipe, not a fade-in.            */}
        <g data-layer="shell">
          <g clipPath="url(#sw-ceil)">
            <path d={SURFACE.ceiling} fill="#5f5a55" />
            <path d={SURFACE.ceiling} fill="url(#gr-ceil)" />
          </g>
          <g clipPath="url(#sw-floor)">
            <path d={SURFACE.floor} fill="#6d6862" />
            <path d={SURFACE.floor} fill="url(#gr-floorFade)" opacity="0.5" />
          </g>
          <g clipPath="url(#sw-wallB)">
            <path d={SURFACE.wallB} fill="#8a847b" />
          </g>
          <g clipPath="url(#sw-wallL)">
            <path d={SURFACE.wallL} fill="#7b756d" />
          </g>
          <g clipPath="url(#sw-wallR)">
            <path d={SURFACE.wallR} fill="#6e6862" />
          </g>

          {/* corners gain depth — the flat sketch becomes a real volume */}
          <g data-a="a-corners" opacity="0">
            <path d={SURFACE.wallL} fill="url(#gr-cornerL)" />
            <path d={SURFACE.wallR} fill="url(#gr-cornerR)" />
            <path d={SURFACE.ceiling} fill="url(#gr-ceil)" opacity="0.4" />
          </g>

          {/* the opening gains a reveal, then glass */}
          <g data-a="a-winreveal" opacity="0">
            <path d={poly([[WIN.x0, WIN.y0], [WIN.x1, WIN.y0], WINR.tr, WINR.tl])} fill="#4e4a45" />
            <path d={poly([[WIN.x0, WIN.y0], WINR.tl, WINR.bl, [WIN.x0, WIN.y1]])} fill="#7a746c" />
            <path d={poly([[WIN.x1, WIN.y0], WINR.tr, WINR.br, [WIN.x1, WIN.y1]])} fill="#5b5651" />
            <path d={poly([[WIN.x0, WIN.y1], WINR.bl, WINR.br, [WIN.x1, WIN.y1]])} fill="#8e877e" />
          </g>
          <path
            data-a="a-glass"
            d={poly([WINR.tl, WINR.tr, WINR.br, WINR.bl])}
            fill="url(#gr-glass)"
            opacity="0"
          />

          {/* the door becomes a real architectural door */}
          <g data-a="a-door" opacity="0">
            <path d={poly(DOOR.quad)} fill="#3b3733" />
            <path d={poly(DOOR.leaf)} fill="#6c655d" />
            <path d={poly(DOOR.panel)} fill="#615a53" />
          </g>

          {/* niche and built-in solidify */}
          <g data-a="a-niche" opacity="0">
            <path d={poly(NICHE.quad)} fill="#332f2c" />
            <path d={seg(NICHE.shelf[0], NICHE.shelf[1])} stroke="#7e776e" strokeWidth="2.4" />
          </g>

          {/* skirting and cornice */}
          <g data-a="a-trim" opacity="0">
            <path d={poly(TRIM.skirtL)} fill="#6f6960" />
            <path d={poly(TRIM.skirtR)} fill="#645f58" />
            <path d={poly(TRIM.skirtB)} fill="#78716a" />
            <path d={poly(TRIM.corniceL)} fill="#565149" />
            <path d={poly(TRIM.corniceR)} fill="#4e4942" />
          </g>

          {/* the window's own shadow, raked across the floor */}
          <g data-a="a-shadow" opacity="0">
            <path d={poly(LIGHT_POOL)} fill="#fff" opacity="0.06" />
          </g>
        </g>

        {/* ══ INTERIOR ════════════════════════════════════════════════════ */}
        <g data-layer="interior">
          {/* 1 · paint, one surface at a time */}
          <g clipPath="url(#sw-pB)"><path d={SURFACE.wallB} fill="#ded7ca" /></g>
          <g clipPath="url(#sw-pL)"><path d={SURFACE.wallL} fill="#d5cec1" /></g>
          <g clipPath="url(#sw-pR)"><path d={SURFACE.wallR} fill="#ccc5b8" /></g>
          <g clipPath="url(#sw-pC)"><path d={SURFACE.ceiling} fill="#f0ebe1" /></g>

          {/* 2 · wall materials */}
          <g data-layer="materials">
            {SLATS.map((s, i) => (
              <path key={i} data-a="m-slat" d={poly(s)} fill="#8a6a45" opacity="0" />
            ))}
            <g clipPath="url(#sw-stone)">
              <path data-a="m-stone" d={poly(STONE)} fill="url(#gr-stone)" opacity="0" />
            </g>
          </g>

          {/* The painted room keeps the volume the shell established — without
              this the interior flattens into a piece of coloured card. */}
          <g data-a="i-depth" opacity="0">
            <path d={SURFACE.wallL} fill="url(#gr-cornerL)" />
            <path d={SURFACE.wallR} fill="url(#gr-cornerR)" />
            <path d={SURFACE.ceiling} fill="url(#gr-ceil)" opacity="0.5" />
            <path d={SURFACE.floor} fill="url(#gr-floorFade)" opacity="0.3" />
          </g>

          {/* the architectural niche survives into the finished room, now lit */}
          <g data-a="i-niche" opacity="0">
            <path d={poly(NICHE.quad)} fill="#3a342d" />
            <path d={seg(NICHE.shelf[0], NICHE.shelf[1])} stroke="#c3a06a" strokeWidth="2.6" />
          </g>

          {/* 3 · ceiling design, then the lighting that belongs to it — the
                cove and the hanging fitting settle together, before any
                built-in or loose furniture arrives */}
          <g data-layer="ceiling">
            {/* three stepped planes, each a shade lighter than the one outside
                it, with the cove reading as a warm line in the reveal rather
                than as a lit panel — the reference ceiling is stepped joinery
                catching light, not a luminous ceiling */}
            <path data-a="c-recess" d={poly(CEIL_OUTER)} fill="#e6e0d4" opacity="0" />
            <path data-a="c-recess" d={poly(CEIL.recess)} fill="#ece7dc" opacity="0" />
            <g data-a="c-cove" opacity="0">
              <path d={poly(CEIL.cove)} fill="#f2ede2" />
              <path d={poly(CEIL.recess)} fill="none" stroke="#f7e6c4" strokeWidth="5" opacity="0.85" />
              <path d={poly(CEIL.cove)} fill="none" stroke="#d8d1c4" strokeWidth="1.2" />
            </g>
            <g data-a="c-cove" opacity="0">
              {/* the warm line the cove throws back at the ceiling */}
              <path d={poly(CEIL.recess)} fill="url(#m-daylight)" opacity="0.8" />
              {/* the pendant: cord, drum shade, and the pool it casts below */}
              <path d={seg(PENDANT.cord[0], PENDANT.cord[1])} stroke="#4c453c" strokeWidth="1.5" />
              <Piece b={PENDANT.shadeEdge} side="right" top="#e6dbc4" front="#dbcfb6" dark="#c5b99f" r={2.4} />
              <Piece b={PENDANT_BAND} side="right" top="url(#m-brass)" front="url(#m-brass)" dark="#8e7346" r={1.6} />
              <Disc d={PENDANT.shadeTop} fill="#efe6d2" />
              <Disc d={PENDANT.shadeBottom} fill="#f6e9c8" />
              <ellipse cx={PENDANT.glow[0]} cy={PENDANT.glow[1]} rx="86" ry="34" fill="#f0d8a8" opacity="0.16" />
            </g>
          </g>

          {/* 4 · floor design */}
          <g clipPath="url(#sw-fFin)">
            <path d={SURFACE.floor} fill="url(#gr-oak)" />
            {/* board joints — perspective lines through the floor plane, so
                they converge on the same vanishing point as the room */}
            <g stroke="#a8875f" strokeWidth="0.9" opacity="0.34">
              {BOARDS.joints.map((j, i) => (
                <path key={i} d={seg(j[0], j[1])} />
              ))}
            </g>
            <g stroke="#a8875f" strokeWidth="0.7" opacity="0.2">
              {BOARDS.ends.map((e, i) => (
                <path key={i} d={seg(e[0], e[1])} />
              ))}
            </g>
          </g>
          <g data-a="f-sheen" opacity="0">
            <path d={SURFACE.floor} fill="url(#gr-floorFade)" opacity="0.35" />
            {/* daylight off the window, raked across the boards */}
            <path d={poly(LIGHT_POOL)} fill="url(#m-daylight)" />
            {/* white painted skirting, as in the reference room */}
            <g>
              <path d={poly(SKIRT.left)} fill="#f4f1ea" />
              <path d={poly(SKIRT.right)} fill="#e8e4dc" />
              <path d={poly(SKIRT.back)} fill="#efece4" />
            </g>
            {/* the room's own ambient occlusion, where the walls meet the floor */}
            <g filter="url(#f-soft)" opacity="0.4">
              <path d={poly(BASE_AO.left)} fill="#2d2013" opacity="0.5" />
              <path d={poly(BASE_AO.right)} fill="#2d2013" opacity="0.5" />
              <path d={poly(BASE_AO.back)} fill="#2d2013" opacity="0.42" />
            </g>
          </g>

          {/* 5 · furniture, one element at a time */}
          <g data-layer="furniture">
            {/* The curtains hang on the BACK wall, so they are painted before
                anything standing on the floor in front of them. They used to be
                drawn last, which put a pale vertical band straight across the
                sofa — paint order has to follow depth even though the timeline
                brings them in late. Their beat is unchanged. */}
            <g data-a="f-curtain" opacity="0">
              <path d={poly(CURTAIN.l)} fill="#ded0b8" />
              <path d={poly(CURTAIN.r)} fill="#d5c7af" />
            </g>

            <g data-a="f-rug" opacity="0">
              <path d={poly(FURNITURE.rug)} fill="#e2ddd1" />
              <g clipPath="url(#sw-rug)" stroke="#9aa0a2" strokeWidth="1" opacity="0.42">
                {RUG.lattice.map((l, i) => (
                  <path key={i} d={seg(l[0], l[1])} />
                ))}
              </g>
              <path d={poly(RUG.border)} fill="none" stroke="#a9a496" strokeWidth="1.6" opacity="0.7" />
              <path d={poly(FURNITURE.rug)} fill="none" stroke="#b8b2a2" strokeWidth="2.4" />
            </g>

            {/* CABINETRY — a carcass lifted on a recessed plinth, its face
                split by a reveal into two drawers, each with a slim pull */}
            <g data-a="f-console" opacity="0">
              <Contact d={CONTACT.cabinet} />
              <Piece b={CABINET.plinth} side="left" top="#2b241d" front="#241e18" dark="#1d1813" r={2} />
              <Piece b={CABINET.carcass} side="left" top="url(#m-walnutTop)" front="url(#m-walnutFront)" dark="#3a3028" r={3.5} />
              <path d={poly(CABINET.drawerA.front)} fill="#5d4f40" />
              <path d={poly(CABINET.drawerB.front)} fill="#5d4f40" />
              <path d={poly(CABINET.drawerA.front)} fill="none" stroke="#3a3128" strokeWidth="1.1" />
              <path d={poly(CABINET.drawerB.front)} fill="none" stroke="#3a3128" strokeWidth="1.1" />
              <path d={seg(CABINET.pullA[0], CABINET.pullA[1])} stroke="#c3a06a" strokeWidth="2.2" strokeLinecap="round" />
              <path d={seg(CABINET.pullB[0], CABINET.pullB[1])} stroke="#c3a06a" strokeWidth="2.2" strokeLinecap="round" />
            </g>

            {/* SOFA — legs, a recessed plinth, two seat cushions divided by a
                seam, two back cushions and arms standing proud of the seat */}
            <g data-a="f-sofa" opacity="0">
              <Contact d={CONTACT.sofa} />
              {SOFA.legs.map((l, i) => (
                <Piece key={i} b={l} side="right" top="#3a2f24" front="#2e251c" dark="#241d16" r={1.6} />
              ))}
              <Piece b={SOFA.plinth} side="right" top="#6d665e" front="#5c5650" dark="#4b4640" r={2.5} />
              <Piece b={SOFA.armL} side="right" top="url(#m-fabTop)" front="url(#m-fabFront)" dark="url(#m-fabSide)" r={7} />
              {SOFA.back.map((b, i) => (
                <Piece key={`b${i}`} b={b} side="right" top="url(#m-fabTop)" front="url(#m-fabFront)" dark="url(#m-fabSide)" r={6} />
              ))}
              {SOFA.seat.map((b, i) => (
                <Piece key={`s${i}`} b={b} side="right" top="url(#m-fabTop)" front="url(#m-fabFront)" dark="url(#m-fabSide)" r={6} />
              ))}
              <Piece b={SOFA.armR} side="right" top="url(#m-fabTop)" front="url(#m-fabFront)" dark="url(#m-fabSide)" r={7} />
            </g>

            {/* COFFEE TABLE — a pale round top carried on a slim dark frame,
                so the rug reads right through underneath it */}
            <g data-a="f-table" opacity="0">
              <Contact d={CONTACT.table} o={0.85} />
              <Disc d={TABLE_ROUND.ring} fill="#8e7346" />
              <Piece b={TABLE_ROUND.stemL} side="right" top="url(#m-brass)" front="#8e7346" dark="#75603a" r={1.2} />
              <Piece b={TABLE_ROUND.stemR} side="right" top="url(#m-brass)" front="#8e7346" dark="#75603a" r={1.2} />
              <Disc d={TABLE_ROUND.under} fill="#a69f91" />
              <Disc d={TABLE_ROUND.top} fill="#e8e2d6" stroke="#c2bbac" w={1} />
            </g>

            {/* The armchair and the pedestal side table have been removed —
                the room is a single large sofa and its table. Their beats are
                left in place and simply carry nothing, so the timeline is
                untouched and everything after them still arrives on cue. */}
          </g>

          {/* 6 · decoration — the last layer; the room is simply finished */}
          <g data-layer="decor">
            <g data-a="d-art" opacity="0">
              <path d={poly(ART)} fill="#efeae0" />
              <path d={poly(ART)} fill="none" stroke="#1c1a18" strokeWidth="4" />
              {/* soft painterly masses — the reference canvas is washed, not
                  drawn, so nothing here is a straight line */}
              <g clipPath="url(#sw-art)">
                <ellipse cx={artC[0] - 6} cy={artC[1] - 16} rx="15" ry="30" fill="#2b2f38" opacity="0.7" />
                <ellipse cx={artC[0] + 7} cy={artC[1] + 14} rx="12" ry="24" fill="#8b8c8e" opacity="0.45" />
                <ellipse cx={artC[0] + 2} cy={artC[1] + 2} rx="8" ry="17" fill="#c3a06a" opacity="0.55" />
              </g>
            </g>
            <g data-a="d-objects" opacity="0">
              <ellipse cx={F.tableTopC[0]} cy={F.tableTopC[1]} rx="16" ry="6" fill="url(#m-brass)" />
              <ellipse cx={F.consoleTopC[0]} cy={F.consoleTopC[1]} rx="11" ry="5" fill="#cfc4b2" />
              <rect
                x={F.sideTopC[0] - 9}
                y={F.sideTopC[1] - 26}
                width="18"
                height="26"
                fill="#efe2c6"
              />
            </g>
          </g>
        </g>

        {/* ══ SKETCH ══════════════════════════════════════════════════════ */}
        {/*  Drawn first in time, painted last in space: these are the room's
            own edges, so they survive into the finished interior as the line
            work that crisps every corner.                                  */}
        <g
          data-layer="sketch"
          fill="none"
          stroke="#ede7de"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* 1 · a single reference line, growing from one point to the other */}
          <Ink g="ref" d={seg(P(FRONT.x0, FRONT.y1, 1), P(FRONT.x1, FRONT.y1, 1))} w="1.5" o="0.9" />

          {/* 2 · floor perspective lines extend */}
          <Ink g="floor" d={seg(P(FRONT.x0, FRONT.y1, 1), FBL)} />
          <Ink g="floor" d={seg(P(FRONT.x1, FRONT.y1, 1), FBR)} />
          <Ink g="floor" d={seg(P(fx(0.34), fy(0), 1), P(fx(0.28), fy(0), 0))} w="0.7" o="0.3" />
          <Ink g="floor" d={seg(P(fx(0.66), fy(0), 1), P(fx(0.73), fy(0), 0))} w="0.7" o="0.3" />

          {/* 3 · the back wall draws itself: corner → top edge → rectangle */}
          <Ink g="back" d={seg(P(FRONT.x0, FRONT.y1, 1), P(FRONT.x0, FRONT.y0, 1))} w="1.35" />
          <Ink g="back" d={seg(P(FRONT.x0, FRONT.y0, 1), P(FRONT.x1, FRONT.y0, 1))} w="1.35" />
          <Ink g="back" d={seg(P(FRONT.x1, FRONT.y0, 1), P(FRONT.x1, FRONT.y1, 1))} w="1.35" />

          {/* 4 · side wall perspective lines, from the architectural corners */}
          <Ink g="walls" d={seg(BTL, FTL)} w="1.25" />
          <Ink g="walls" d={seg(BTR, FTR)} w="1.25" />
          <Ink g="walls" d={seg(P(FRONT.x0, fy(0.035), 1), P(FRONT.x0, fy(0.035), 0))} w="0.7" o="0.32" />
          <Ink g="walls" d={seg(P(FRONT.x1, fy(0.035), 1), P(FRONT.x1, fy(0.035), 0))} w="0.7" o="0.32" />

          {/* 5 · ceiling lines complete the volume */}
          <Ink g="ceil" d={seg(FTL, FTR)} w="1.1" o="0.5" />
          <Ink g="ceil" d={line(CEIL.recess)} w="0.75" o="0.36" />

          {/* 6 · window: outer frame → inner → divisions → sill */}
          <Ink g="win" d={poly([[WIN.x0, WIN.y0], [WIN.x1, WIN.y0], [WIN.x1, WIN.y1], [WIN.x0, WIN.y1]])} w="1.3" o="0.88" />
          <Ink g="win" d={poly([WINR.tl, WINR.tr, WINR.br, WINR.bl])} w="0.9" o="0.6" />
          <Ink g="win" d={seg([WIN.mx, WIN.y0], [WIN.mx, WIN.y1])} w="0.85" o="0.62" />
          <Ink g="win" d={seg([WIN.x0, WIN.my], [WIN.x1, WIN.my])} w="0.85" o="0.62" />
          <Ink g="win" d={seg([WIN.x0 - 7, WIN.y1 + 4], [WIN.x1 + 7, WIN.y1 + 4])} w="1.15" o="0.7" />

          {/* 7 · door: frame → panel → handle */}
          <Ink g="door" d={poly(DOOR.quad)} w="1.25" o="0.85" />
          <Ink g="door" d={poly(DOOR.panel)} w="0.8" o="0.5" />
          <Ink g="door" d={seg(DOOR.handle[0], DOOR.handle[1])} w="1.6" o="0.8" />

          {/* 8 · architectural details */}
          <Ink g="detail" d={poly(NICHE.quad)} w="1.05" o="0.62" />
          <Ink g="detail" d={seg(NICHE.shelf[0], NICHE.shelf[1])} w="0.8" o="0.42" />
          <Ink g="detail" d={line(CEIL.cove)} w="0.7" o="0.3" />
          <Ink g="detail" d={poly(TRIM.skirtB)} w="0.7" o="0.34" />
          <Ink g="detail" d={line(SLATS[0])} w="0.6" o="0.24" />
          <Ink g="detail" d={line(STONE)} w="0.6" o="0.22" />

          {/* 9 · loose furniture placeholders — retracted before the shell is
                 declared finished, because an empty room is an empty room */}
          <g data-loose>
            <Ink g="loose" d={line(F.sofaSeat.top)} w="0.75" o="0.34" />
            <Ink g="loose" d={line(F.sofaBack.top)} w="0.75" o="0.34" />
            <Ink g="loose" d={line(F.table.top)} w="0.75" o="0.32" />
            <Ink g="loose" d={poly(FURNITURE.rug)} w="0.7" o="0.26" />
            <Ink g="loose" d={line(F.chairSeat.top)} w="0.7" o="0.3" />
          </g>
        </g>
      </g>
    </svg>
  )
})
