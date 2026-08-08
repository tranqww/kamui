/**
 * A display heading whose lines rise out of their own masks on reveal.
 *
 * Lines are authored explicitly rather than measured at runtime: the reference
 * breaks its headings at deliberate points ("A STRATEGIC / CARD GAME"), and
 * re-measuring on resize would fight that. Each line stays a real text node,
 * so the heading is still one selectable, screen-reader-friendly string.
 */
export default function SplitHeading({
  lines,
  as: Tag = 'h2',
  className = '',
  id,
  stagger = 90,
  ...rest
}) {
  return (
    <Tag id={id} className={`display reveal-lines ${className}`.trim()} {...rest}>
      {lines.map((line, i) => (
        <span className="reveal-lines__mask" key={line}>
          <span className="reveal-lines__line" style={{ '--line-delay': `${i * stagger}ms` }}>
            {line}
          </span>
        </span>
      ))}
    </Tag>
  )
}
