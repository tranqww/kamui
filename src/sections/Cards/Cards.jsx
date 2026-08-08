import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Stage from '../../components/three/Stage.jsx'
import CardsScene from './CardsScene.jsx'
import { useReducedMotion } from '../../hooks/useEnvironment.js'
import './cards.css'

const CARDS = [
  {
    id: 'esports',
    code: '01 / 03',
    title: 'Esports',
    variant: 0,
    body:
      'To be a truly great game, Kamui needs a vibrant competitive scene — and Kamui has answered the call. With regular tournaments happening worldwide, this is a social card game with a hard edge.',
  },
  {
    id: 'community',
    code: '02 / 03',
    title: 'Community',
    variant: 1,
    body:
      'Kamui is built around the people who play it. Trade, duel and forge alliances in a living world where every Yokai you own is provably, permanently yours.',
  },
  {
    id: 'collection',
    code: '03 / 03',
    title: 'Collection',
    variant: 2,
    body:
      'Draft your deck from over 280 Yokai, each with its own lineage and legend. Strategy is never luck here: every card in your hand is a decision you already made.',
  },
]

const AUTOPLAY_MS = 7000
const FLIP_DELAY_MS = 700

export default function Cards() {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [paused, setPaused] = useState(false)
  const reduced = useReducedMotion()
  const sectionRef = useRef(null)
  const [inView, setInView] = useState(false)

  const active = CARDS[index]

  const go = useCallback((delta) => {
    setRevealed(false)
    setIndex((i) => (i + delta + CARDS.length) % CARDS.length)
  }, [])

  // Reveal the face shortly after a card settles, so the flip reads as a
  // deliberate turn rather than a swap.
  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), FLIP_DELAY_MS)
    return () => clearTimeout(timer)
  }, [index])

  useEffect(() => {
    const node = sectionRef.current
    if (!node || !('IntersectionObserver' in window)) return undefined
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.4,
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Autoplay only while the deck is actually on screen and nobody is
  // interacting with it. Reduced motion opts out entirely.
  useEffect(() => {
    if (reduced || paused || !inView) return undefined
    const timer = setTimeout(() => go(1), AUTOPLAY_MS)
    return () => clearTimeout(timer)
  }, [reduced, paused, inView, index, go])

  const onKeyDown = useCallback(
    (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        go(-1)
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        go(1)
      }
    },
    [go],
  )

  const sceneProps = useMemo(() => ({ cards: CARDS, index, revealed }), [index, revealed])

  return (
    <section
      id="cards"
      className="section cards"
      aria-labelledby="cards-title"
      ref={sectionRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Stage camera={{ position: [0, 0, 36], fov: 40, near: 0.1, far: 200 }}>
        {({ tier, reduced: r }) => <CardsScene tier={tier} reduced={r} {...sceneProps} />}
      </Stage>

      <h2 id="cards-title" className="visually-hidden">
        The Kamui deck
      </h2>

      {/* The deck is rendered in WebGL; this keeps its content readable to
          assistive tech and to anyone with WebGL unavailable. */}
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {`Card ${index + 1} of ${CARDS.length}: ${active.title}. ${active.body}`}
      </div>

      <div
        className="section__content cards__ui shell"
        role="group"
        aria-label="Card carousel"
        onKeyDown={onKeyDown}
      >
        <button type="button" className="cards__nav" onClick={() => go(-1)}>
          <span className="cards__arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="13" height="13">
              <path
                d="M15 4 7 12l8 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="mono">Previous</span>
        </button>

        <ol className="cards__dots">
          {CARDS.map((card, i) => (
            <li key={card.id}>
              <button
                type="button"
                className={`cards__dot${i === index ? ' is-active' : ''}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => {
                  setRevealed(false)
                  setIndex(i)
                }}
              >
                <span className="visually-hidden">{`Show ${card.title}`}</span>
              </button>
            </li>
          ))}
        </ol>

        <button type="button" className="cards__nav cards__nav--next" onClick={() => go(1)}>
          <span className="mono">Next</span>
          <span className="cards__arrow" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="13" height="13">
              <path
                d="M9 4l8 8-8 8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>
    </section>
  )
}
