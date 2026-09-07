/**
 * Content for the sections after Projects — Experience through the Footer.
 *
 * Every figure and line is transcribed from the brief; the studio addresses,
 * phones and email are the real details from konstdesign.in. Nothing is
 * invented — no coordinates, no social URLs (those are left to be supplied).
 */

export const PHONE_PRIMARY = '+91 98943 31115'
export const PHONE_SECONDARY = '+91 77080 08184'
export const EMAIL = 'Mohasher11@gmail.com'

/** the four studio credentials (the "04 Recognition" line heads its own
 *  section rather than sitting here as a fifth stat) */
export const STATS = [
  { value: '14+', label: 'Years of Experience' },
  { value: '237', label: 'Projects Completed' },
  { value: '12', label: 'Awards Won' },
  { value: '11K', label: 'Twitter Followers' },
]

export const AWARDS = [
  'Excellence in Residential Architecture',
  'Best Interior Design Studio — Coimbatore',
  'Young Architect Recognition',
  'Modular Kitchen Design Award',
  'Sustainable Residence Citation',
  'Visualization Studio of the Year',
]

export const PRINCIPLES = [
  { number: '01', title: 'Experience', body: '14+ years of architectural and interior design experience.', image: '/assets/principles/experience.webp', side: 'left' },
  { number: '02', title: 'Craft', body: 'Attention to materials, proportions, lighting and detail.', image: '/assets/principles/craft.webp', side: 'right' },
  { number: '03', title: 'Visualization', body: 'Experience your project through detailed 3D drawings before construction.', image: '/assets/principles/visualization.webp', side: 'left' },
  { number: '04', title: 'Personalization', body: "Every project is designed around the client's lifestyle and requirements.", image: '/assets/principles/personalization.webp', side: 'right' },
]

/** Exact Google Maps URLs supplied by the brief (§27) — used verbatim by both
 *  the map pins and the "View on Google Maps" links. `coord` is [lat, lng] for
 *  placing the pins on the realistic map. */
export const STUDIOS = [
  {
    id: 'coimbatore',
    city: 'Coimbatore',
    role: 'Head Studio',
    lines: ['No. 11, Barathi Nagar,', 'Rathinapuri (PO),', 'Coimbatore – 641027,', 'Tamil Nadu, India.'],
    phone: PHONE_PRIMARY,
    maps: 'https://www.google.com/maps/search/No.+11,+Barathi+Nagar,+Rathinapuri,+Coimbatore+641027,+Tamil+Nadu/@11.0024916,76.9623497,13z/data=!3m1!4b1?entry=ttu&g_ep=EgoyMDI2MDkwMi4wIKXMDSoASAFQAw%3D%3D',
    /* geo coordinates for the realistic map (lat, lng) */
    coord: [11.0024916, 76.9623497],
  },
  {
    id: 'dindigul',
    city: 'Dindigul',
    role: 'Er. Safeeq Ahmed, BE MBA',
    lines: ['Star Construction,', 'MAK Complex,', 'Old Karur Road,', 'Dindigul – 624001.'],
    phone: PHONE_SECONDARY,
    maps: 'https://www.google.com/maps/place/Star+Construction/@10.3784149,77.9892183,17z/data=!3m1!4b1!4m6!3m5!1s0x3b00aa67d7d9485b:0xed296cf6bd244c0d!8m2!3d10.3784149!4d77.9892183!16s%2Fg%2F11b7q5f6v2?entry=ttu&g_ep=EgoyMDI2MDkwMi4wIKXMDSoASAFQAw%3D%3D',
    coord: [10.3784149, 77.9892183],
  },
]

export const FOOTER = {
  nav: [
    { label: 'Home', href: '#top' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact', href: '#studios' },
  ],
  services: [
    'Architectural Design',
    'Interior Design',
    'Bedroom Interiors',
    'Modular Kitchen',
    'Pooja Rooms',
    'TV Units',
    '3D Drawings',
  ],
  /* href null until real handles are supplied — rendered but not invented */
  social: [
    { label: 'Instagram', href: null },
    { label: 'Facebook', href: null },
    { label: 'Twitter / X', href: null },
  ],
}
