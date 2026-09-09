/**
 * Primary navigation. This is one continuous scrolling page, so every item is
 * an in-page anchor that smooth-scrolls to its section.
 *
 * The type is deliberately quiet: uppercase, weight 200, and tracked wide
 * enough that HOME reads as H O M E. Position, spacing, layout, hover and
 * active treatment, transparency and responsive behaviour are untouched —
 * only the letterforms changed.
 */
const ITEMS = [
  { label: 'HOME', target: '#top' },
  { label: 'ABOUT US', target: '#about' },
  { label: 'SERVICES', target: '#services' },
  { label: 'PROJECTS', target: '#projects' },
  { label: 'CONTACT US', target: '#start-project' },
]

function scrollTo(target) {
  if (target === '#top') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  document.querySelector(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function Navigation() {
  return (
    <nav
      className="pointer-events-auto flex items-center gap-7 [text-shadow:0_1px_10px_rgba(8,7,6,0.85)] lg:gap-9"
      aria-label="Primary"
    >
      <ul className="hidden items-center gap-7 md:flex lg:gap-9">
        {ITEMS.map(({ label, target }, i) => (
          <li key={label}>
            <a
              href={target}
              onClick={(e) => {
                e.preventDefault()
                scrollTo(target)
              }}
              aria-current={i === 0 ? 'page' : undefined}
              className={`group relative inline-block font-sans text-[10px] font-extralight uppercase tracking-nav transition-colors duration-500 lg:text-[11px] ${
                i === 0 ? 'text-bone' : 'text-bone/70 hover:text-bone'
              }`}
            >
              {label}
              <span
                className={`absolute -bottom-2 left-0 h-px w-full origin-left bg-brass transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
                  i === 0 ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </a>
          </li>
        ))}
      </ul>

      {/* compact mark for small screens */}
      <span className="font-sans text-[10px] font-extralight uppercase tracking-nav text-bone-dim md:hidden">
        MENU
      </span>
    </nav>
  )
}
