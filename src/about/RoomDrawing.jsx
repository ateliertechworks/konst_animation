import { memo } from 'react'
import {
  ART, BBOX, BTL, BTR, CEIL, CURTAIN, DOOR, FBL, FBR, FRONT, FTL, FTR,
  FURNITURE, LIGHT_POOL, NICHE, P, PLANT, SLATS, STONE, SURFACE, TRIM,
  VIEW, WIN, WINR, fx, fy, line, poly, seg,
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

/** One face-shaded box. `side` picks whichever flank the camera can see. */
const Solid = ({ b, side = 'right', top, front, dark }) => (
  <>
    <path d={poly(b[side])} fill={dark} />
    <path d={poly(b.front)} fill={front} />
    <path d={poly(b.top)} fill={top} />
  </>
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
        <linearGradient id="gr-oak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6d4a2c" />
          <stop offset="1" stopColor="#8d6440" />
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
          <g clipPath="url(#sw-pB)"><path d={SURFACE.wallB} fill="#d9d0c2" /></g>
          <g clipPath="url(#sw-pL)"><path d={SURFACE.wallL} fill="#cfc6b8" /></g>
          <g clipPath="url(#sw-pR)"><path d={SURFACE.wallR} fill="#c6bdb0" /></g>
          <g clipPath="url(#sw-pC)"><path d={SURFACE.ceiling} fill="#e3dcd1" /></g>

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

          {/* 3 · ceiling design, developed from the architectural ceiling */}
          <g data-layer="ceiling">
            <path data-a="c-recess" d={poly(CEIL.recess)} fill="#d5cec3" opacity="0" />
            <path data-a="c-cove" d={poly(CEIL.cove)} fill="#c8c0b4" opacity="0" />
          </g>

          {/* 4 · floor design */}
          <g clipPath="url(#sw-fFin)">
            <path d={SURFACE.floor} fill="url(#gr-oak)" />
          </g>
          <g data-a="f-sheen" opacity="0">
            <path d={SURFACE.floor} fill="url(#gr-floorFade)" opacity="0.35" />
          </g>

          {/* 5 · furniture, one element at a time */}
          <g data-layer="furniture">
            <g data-a="f-rug" opacity="0">
              <path d={poly(FURNITURE.rug)} fill="#b6aa94" />
              <path d={poly(FURNITURE.rug)} fill="none" stroke="#6f6350" strokeWidth="2.4" />
            </g>

            <g data-a="f-console" opacity="0">
              <Solid b={F.console} side="left" top="#6a5a49" front="#55483a" dark="#423830" />
            </g>

            <g data-a="f-sofa" opacity="0">
              <Solid b={F.sofaSeat} side="right" top="#a05f38" front="#8a4f2d" dark="#6f3f24" />
              <Solid b={F.sofaBack} side="right" top="#ab6a41" front="#955732" dark="#754427" />
              <Solid b={F.sofaArmL} side="right" top="#a3623a" front="#8d522f" dark="#714026" />
              <Solid b={F.sofaArmR} side="right" top="#a3623a" front="#8d522f" dark="#714026" />
            </g>

            <g data-a="f-table" opacity="0">
              <Solid b={F.table} side="right" top="#3f342a" front="#31281f" dark="#272019" />
            </g>

            <g data-a="f-chair" opacity="0">
              <Solid b={F.chairSeat} side="left" top="#cfc3b1" front="#bcb09e" dark="#a49984" />
              <Solid b={F.chairBack} side="left" top="#d4c8b6" front="#c2b6a4" dark="#a99e89" />
            </g>

            <g data-a="f-side" opacity="0">
              <Solid b={F.side} side="left" top="#c3a06a" front="#a88754" dark="#8e7346" />
            </g>

            <g data-a="f-curtain" opacity="0">
              <path d={poly(CURTAIN.l)} fill="#ded0b8" />
              <path d={poly(CURTAIN.r)} fill="#d5c7af" />
            </g>
          </g>

          {/* 6 · decoration — the last layer; the room is simply finished */}
          <g data-layer="decor">
            <g data-a="d-art" opacity="0">
              <path d={poly(ART)} fill="#2f2b27" />
              <path d={poly(ART)} fill="none" stroke="#c3a06a" strokeWidth="1.6" />
            </g>
            <g data-a="d-plant" opacity="0">
              <Solid b={PLANT.pot} side="right" top="#7d6f60" front="#6a5d50" dark="#564b41" />
              <path d={seg(PLANT.stem[0], PLANT.stem[1])} stroke="#4f5f42" strokeWidth="2.4" />
              <ellipse cx={PLANT.canopy[0]} cy={PLANT.canopy[1]} rx="27" ry="22" fill="#4a5c3e" />
              <ellipse cx={PLANT.canopy[0] - 12} cy={PLANT.canopy[1] + 13} rx="18" ry="13" fill="#556a46" />
            </g>
            <g data-a="d-cushion" opacity="0">
              <Solid b={F.cushA} side="right" top="#d8c6a6" front="#c8b591" dark="#b19f7d" />
              <Solid b={F.cushB} side="right" top="#7d5f3f" front="#6d5235" dark="#59422a" />
            </g>
            <g data-a="d-objects" opacity="0">
              <ellipse cx={F.tableTopC[0]} cy={F.tableTopC[1]} rx="16" ry="6" fill="#c3a06a" />
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
