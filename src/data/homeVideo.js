/**
 * The four captions that play over the scroll-scrubbed hero film (Video 2 on
 * the Home page). One is on screen at a time, tied to scroll progress through
 * the video's own pinned range — see `HomeVideo.jsx`.
 *
 * The former opening stage ("Space that tells your story" + its two buttons)
 * now lives on Video 1 instead, as static (non-scroll-triggered) content
 * alongside "KONST DESIGNS" — see `HomeVideo.jsx`. No stage here carries
 * buttons any more, and the sequence opens directly on "Every space starts
 * with an idea".
 *
 * Every heading is set in caps by the component, so all four stages share the
 * closing line's typography exactly.
 */
export const SCROLL_STAGES = [
  {
    id: 'idea',
    heading: ['Every space starts with an idea'],
    sub: 'From an empty room to a thoughtfully designed living experience.',
  },
  {
    id: 'define',
    heading: ['Define the space'],
    sub: 'Architecture creates the foundation.',
  },
  {
    id: 'details',
    heading: ['Details create the experience'],
    sub: 'Materials, lighting and form come together.',
  },
  {
    id: 'closing',
    heading: ['FROM EMPTY', 'TO EXTRAORDINARY.'],
    sub: 'Designed by Konst Design.',
  },
]
