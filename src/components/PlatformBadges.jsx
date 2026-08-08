/**
 * Platform availability row.
 *
 * Icons are inline paths so the row costs nothing extra to load and inherits
 * `currentColor` — the same reason the reference can sit them flush against
 * cream wordmarks without a sprite sheet.
 */

function Apple() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M16.4 12.7c0-2.4 2-3.6 2.1-3.6-1.1-1.7-2.9-1.9-3.6-1.9-1.5-.2-3 .9-3.7.9-.8 0-2-.9-3.2-.8-1.7 0-3.2 1-4 2.5-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.2.7c1.3 0 2.2-1.2 3-2.4.9-1.3 1.3-2.6 1.3-2.7 0 0-2.4-1-2.4-4.1ZM14 5.5c.7-.8 1.1-1.9 1-3-1 0-2.2.7-2.9 1.5-.6.7-1.1 1.9-1 3 1.1.1 2.2-.6 2.9-1.5Z"
      />
    </svg>
  )
}

function Windows() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M3 5.6 10.3 4.6v7.1H3V5.6Zm0 12.8 7.3 1v-7H3v6ZM11.2 19.5 21 21V12.6h-9.8v6.9Zm0-15V11.6H21V3l-9.8 1.5Z"
      />
    </svg>
  )
}

function Linux() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 1.8c-2.7 0-3.6 2-3.5 4.2.1 2.2-.3 3-1.3 4.5-1.1 1.6-2.4 3.4-2.4 5.3 0 1 .5 1.5.3 2.3-.2.8-1 1-.9 1.7.1.8 1.4.8 2.6 1.1 1.2.3 2 1.1 3.1 1.1.9 0 1.4-.6 1.9-.6s1 .6 2 .6c1.1 0 1.9-.8 3.1-1.1 1.2-.3 2.5-.3 2.6-1.1.1-.7-.7-.9-.9-1.7-.2-.8.3-1.3.3-2.3 0-1.9-1.3-3.7-2.4-5.3-1-1.5-1.4-2.3-1.3-4.5.1-2.2-.8-4.2-3.2-4.2Zm-1.7 3.3c.5 0 .9.6.9 1.3s-.4 1.3-.9 1.3-.9-.6-.9-1.3.4-1.3.9-1.3Zm3.5 0c.5 0 .9.6.9 1.3s-.4 1.3-.9 1.3-.9-.6-.9-1.3.4-1.3.9-1.3Zm-1.8 3.1c1 0 2.2.6 2.2 1.1 0 .4-.6.6-1.1.9-.6.4-.9.7-1.3.7s-.8-.4-1.4-.8c-.4-.3-1-.4-1-.8 0-.5 1.4-1.1 2.6-1.1Z"
      />
    </svg>
  )
}

function Android() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M17.1 9.2H6.9v8.6c0 .6.5 1.1 1.1 1.1h1v3a1.3 1.3 0 0 0 2.6 0v-3h1.6v3a1.3 1.3 0 0 0 2.6 0v-3h1a1.1 1.1 0 0 0 1.1-1.1V9.2ZM4.4 9a1.3 1.3 0 0 0-1.3 1.3v5.3a1.3 1.3 0 0 0 2.6 0v-5.3A1.3 1.3 0 0 0 4.4 9Zm15.2 0a1.3 1.3 0 0 0-1.3 1.3v5.3a1.3 1.3 0 0 0 2.6 0v-5.3A1.3 1.3 0 0 0 19.6 9ZM15.3 3.7l.9-1.6a.3.3 0 0 0-.5-.3l-.9 1.6a5.9 5.9 0 0 0-4.6 0l-.9-1.6a.3.3 0 0 0-.5.3l.9 1.6A5 5 0 0 0 6.9 8h10.2a5 5 0 0 0-1.8-4.3ZM9.6 6.3a.6.6 0 1 1 .6-.6.6.6 0 0 1-.6.6Zm4.8 0a.6.6 0 1 1 .6-.6.6.6 0 0 1-.6.6Z"
      />
    </svg>
  )
}

const DESKTOP = [
  { key: 'macos', label: 'macOS', Icon: Apple },
  { key: 'windows', label: 'Windows', Icon: Windows },
  { key: 'linux', label: 'Linux', Icon: Linux },
]

const MOBILE = [
  { key: 'iphone', label: 'iPhone', Icon: Apple },
  { key: 'android', label: 'android', Icon: Android },
  { key: 'ipad', label: 'iPad Pro', Icon: Apple },
]

function Row({ items }) {
  return (
    <li className="platforms__row">
      <ul>
        {items.map(({ key, label, Icon }) => (
          <li className="platforms__item" key={key}>
            <span className="platforms__icon">
              <Icon />
            </span>
            {label}
          </li>
        ))}
      </ul>
    </li>
  )
}

export default function PlatformBadges({ className = '' }) {
  return (
    <ul className={`platforms ${className}`.trim()} aria-label="Available platforms">
      <Row items={DESKTOP} />
      <Row items={MOBILE} />
    </ul>
  )
}
