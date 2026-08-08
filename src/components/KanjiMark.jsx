/**
 * The crimson brush mark that sits behind the KAMUI wordmark.
 *
 * Not a real kanji — a constructed one. It borrows the stroke grammar of
 * Japanese characters (a heavy horizontal, a dominant vertical, two splayed
 * diagonals, a clipped box) so it reads as writing at a glance while carrying
 * no accidental meaning. Angular, brush-clipped ends match the reference's
 * blocky stamp.
 */
export default function KanjiMark({ className, ...rest }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <g fill="currentColor">
        {/* Top horizontal stroke, angled and clipped at both ends */}
        <path d="M52 44 L186 30 L192 62 L58 76 Z" />
        {/* Dominant vertical */}
        <path d="M104 18 L140 22 L132 214 L96 208 Z" />
        {/* Wide mid horizontal */}
        <path d="M24 106 L214 96 L219 130 L29 140 Z" />
        {/* Left splayed diagonal */}
        <path d="M92 128 L120 148 L52 216 L26 192 Z" />
        {/* Right splayed diagonal */}
        <path d="M146 146 L174 126 L216 196 L188 216 Z" />
        {/* Small clipped box, upper right */}
        <path d="M156 52 L200 48 L204 88 L160 92 Z M168 62 L166 78 L192 76 L194 60 Z" />
      </g>
    </svg>
  )
}
