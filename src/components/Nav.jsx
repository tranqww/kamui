import { useCallback, useEffect, useMemo, useState } from 'react'
import { useActiveSection } from '../hooks/useReveal.js'
import './nav.css'

const LINKS = [
  { id: 'game', label: 'Game' },
  { id: 'cards', label: 'Cards' },
  { id: 'community', label: 'Community' },
  { id: 'esports', label: 'Esports' },
]

function TwitchGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M4.3 2 2.5 6.4v14.1h5v3h3.1l3-3h4l5.4-5.4V2H4.3Zm15.7 12-3 3h-4.6l-3 3v-3H5.6V4h14.4v10Zm-4.8-6.5v5.2h-2V7.5h2Zm-5 0v5.2h-2V7.5h2Z"
      />
    </svg>
  )
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState('hero')

  const ids = useMemo(() => ['hero', ...LINKS.map((l) => l.id)], [])
  useActiveSection(ids, setActive)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The mobile sheet is a modal surface: lock the page and honour Escape.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = useCallback(() => setOpen(false), [])

  return (
    <header className={`nav${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <div className="nav__inner shell">
        <a className="nav__logo display" href="#hero" onClick={close}>
          Kamui
        </a>

        <nav className="nav__links" aria-label="Primary">
          <ul>
            {LINKS.map(({ id, label }) => (
              <li key={id}>
                <a
                  className={`nav__link mono${active === id ? ' is-active' : ''}`}
                  href={`#${id}`}
                  aria-current={active === id ? 'true' : undefined}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav__actions">
          <a
            className="btn btn--outline nav__twitch"
            href="https://www.twitch.tv/directory/category/trading-card-games"
            target="_blank"
            rel="noreferrer noopener"
          >
            Twitch
            <TwitchGlyph />
          </a>

          <button
            type="button"
            className="nav__burger"
            aria-expanded={open}
            aria-controls="nav-sheet"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="visually-hidden">{open ? 'Close menu' : 'Open menu'}</span>
            <span className="nav__burger-bar" />
            <span className="nav__burger-bar" />
          </button>
        </div>
      </div>

      <div id="nav-sheet" className="nav__sheet" hidden={!open}>
        <ul>
          {LINKS.map(({ id, label }, i) => (
            <li key={id} style={{ '--i': i }}>
              <a className="display nav__sheet-link" href={`#${id}`} onClick={close}>
                {label}
              </a>
            </li>
          ))}
        </ul>
        <a className="btn btn--solid" href="#waitlist" onClick={close}>
          Join the waitlist
        </a>
      </div>
    </header>
  )
}
