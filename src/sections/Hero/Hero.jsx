import Stage from '../../components/three/Stage.jsx'
import KanjiMark from '../../components/KanjiMark.jsx'
import HeroScene from './HeroScene.jsx'
import './hero.css'

export default function Hero() {
  return (
    <section id="hero" className="section hero" aria-labelledby="hero-title">
      <Stage eager camera={{ position: [0, 0, 36], fov: 40, near: 0.1, far: 400 }}>
        {({ tier, reduced }) => <HeroScene tier={tier} reduced={reduced} />}
      </Stage>

      <div className="section__content hero__inner shell">
        <div className="hero__block">
          <div className="hero__markwrap" aria-hidden="true">
            <KanjiMark className="hero__mark" />
          </div>

          {/* The visible wordmark is one word by design; the rest of the
              sentence is there for anyone arriving by screen reader or search
              result, where "Kamui" alone says nothing. */}
          <h1 id="hero-title" className="display hero__title">
            Kamui<span className="visually-hidden"> — a blockchain card game</span>
          </h1>
          <p className="hero__sub mono">A Blockchain Card Game</p>

          <a className="btn btn--glass hero__cta" href="#waitlist">
            Join the waitlist
          </a>

          <p className="hero__note">
            You can find our <a href="#waitlist">Terms &amp; Conditions</a> here
          </p>
        </div>
      </div>
    </section>
  )
}
