import { useId, useState } from 'react'
import './footer.css'

const SOCIALS = [
  {
    key: 'twitch',
    label: 'Twitch',
    href: 'https://www.twitch.tv/directory/category/trading-card-games',
    path: 'M4.3 2 2.5 6.4v14.1h5v3h3.1l3-3h4l5.4-5.4V2H4.3Zm15.7 12-3 3h-4.6l-3 3v-3H5.6V4h14.4v10Zm-4.8-6.5v5.2h-2V7.5h2Zm-5 0v5.2h-2V7.5h2Z',
  },
  {
    key: 'discord',
    label: 'Discord',
    href: 'https://discord.com/',
    path: 'M19.3 5.3A16.8 16.8 0 0 0 15.1 4l-.2.4a15.6 15.6 0 0 1 3.7 1.2 12.9 12.9 0 0 0-11.2 0A15.5 15.5 0 0 1 11.1 4.4L10.9 4a16.8 16.8 0 0 0-4.2 1.3C4 9.3 3.3 13.2 3.6 17a16.9 16.9 0 0 0 5.2 2.6l1-1.7a11 11 0 0 1-1.7-.8l.4-.3a12.1 12.1 0 0 0 10.4 0l.4.3a11 11 0 0 1-1.7.8l1 1.7A16.9 16.9 0 0 0 24 17c.4-4.4-.7-8.3-2.9-11.7ZM9.7 14.7c-1 0-1.9-.9-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Zm6.6 0c-1 0-1.9-.9-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Z',
  },
  {
    key: 'x',
    label: 'X',
    href: 'https://x.com/',
    path: 'M17.2 3h3.3l-7.2 8.2L21.7 21h-6.4l-5-6.5L4.6 21H1.3l7.7-8.8L1.6 3H8l4.5 6L17.2 3Zm-1.1 16h1.8L7.1 4.8H5.1L16.1 19Z',
  },
]

const COLUMNS = [
  {
    key: 'game',
    title: 'Game',
    links: [
      { label: 'Overview', href: '#game' },
      { label: 'The deck', href: '#cards' },
      { label: 'Yokai', href: '#community' },
    ],
  },
  {
    key: 'play',
    title: 'Play',
    links: [
      { label: 'Esports', href: '#esports' },
      { label: 'Tournaments', href: '#esports' },
      { label: 'Ranked ladder', href: '#esports' },
    ],
  },
  {
    key: 'about',
    title: 'About',
    links: [
      { label: 'Ethereum', href: '#game' },
      { label: 'ERC-721', href: '#community' },
      { label: 'Press kit', href: '#waitlist' },
    ],
  },
]

export default function Footer() {
  const inputId = useId()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)

  const onSubmit = (event) => {
    event.preventDefault()
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setStatus({ ok: false, message: 'That email address does not look right.' })
      return
    }
    // Kamui is a design concept — there is no backend, and pretending
    // otherwise would be a lie told in a nice typeface.
    setStatus({
      ok: true,
      message: 'Concept build — nothing was sent anywhere. Thanks for playing along.',
    })
    setEmail('')
  }

  return (
    <footer id="esports" className="footer">
      <div className="footer__waitlist shell" id="waitlist">
        <div className="footer__pitch">
          <p className="eyebrow">Season One</p>
          <h2 className="display footer__title">Claim your first Yokai</h2>
          <p className="lede footer__lede">
            Founding summoners get early access to the closed beta and a starter hand drawn from the
            first printing.
          </p>
        </div>

        <form className="footer__form" onSubmit={onSubmit} noValidate>
          <label className="mono footer__label" htmlFor={inputId}>
            Email address
          </label>
          <div className="footer__field">
            <input
              id={inputId}
              className="footer__input"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (status) setStatus(null)
              }}
              aria-describedby={status ? `${inputId}-status` : undefined}
              aria-invalid={status && !status.ok ? 'true' : undefined}
            />
            <button className="btn btn--solid footer__submit" type="submit">
              Join
            </button>
          </div>
          <p
            id={`${inputId}-status`}
            className={`footer__status${status?.ok ? ' is-ok' : ''}`}
            role="status"
            aria-live="polite"
          >
            {status?.message ?? ' '}
          </p>
        </form>
      </div>

      <div className="footer__main shell">
        <div className="footer__brand">
          <a className="display footer__logo" href="#hero">
            Kamui
          </a>
          <p className="footer__tagline mono">A Blockchain Card Game</p>

          <ul className="footer__socials">
            {SOCIALS.map(({ key, label, href, path }) => (
              <li key={key}>
                <a href={href} target="_blank" rel="noreferrer noopener" aria-label={label}>
                  <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
                    <path fill="currentColor" d={path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav className="footer__nav" aria-label="Footer">
          {COLUMNS.map(({ key, title, links }) => (
            <div className="footer__col" key={key}>
              <h3 className="mono footer__col-title">{title}</h3>
              <ul>
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="footer__fine shell">
        <p>
          A design study rebuilt in WebGL from a{' '}
          <a
            href="https://dribbble.com/shots/11180781-K-A-M-U-I"
            target="_blank"
            rel="noreferrer noopener"
          >
            KAMUI concept
          </a>{' '}
          by Zak Steele-Eklund. Not affiliated with the original.
        </p>
        <p>© {new Date().getFullYear()} — built for the love of it.</p>
      </div>
    </footer>
  )
}
