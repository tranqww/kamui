import Stage from '../../components/three/Stage.jsx'
import SplitHeading from '../../components/SplitHeading.jsx'
import YokaiScene from './YokaiScene.jsx'
import './yokai.css'

export default function Yokai() {
  return (
    <section id="community" className="section yokai" aria-labelledby="yokai-title">
      <Stage camera={{ position: [0, 0, 36], fov: 40, near: 0.1, far: 300 }}>
        {({ tier, reduced }) => <YokaiScene tier={tier} reduced={reduced} />}
      </Stage>

      <div className="section__content yokai__inner shell">
        <div className="yokai__copy">
          <p className="eyebrow" data-reveal>
            Own Your Cards
          </p>

          <SplitHeading
            id="yokai-title"
            lines={['Summon Yokai', 'Creatures']}
            className="yokai__title"
            data-reveal
          />

          <p className="lede yokai__lede" data-reveal style={{ '--reveal-delay': '160ms' }}>
            With over 280 unique Yokai, demons and ghosts to unleash, each based on Japanese
            folklore, you&rsquo;ll have your work cut out amassing a complete set. Each card is based
            on the ERC-721 standard and is secured on the Ethereum network, so when a card is yours
            &mdash; it&rsquo;s really yours. Real ownership of your unique assets.
          </p>

          <div data-reveal style={{ '--reveal-delay': '280ms' }}>
            <a className="btn btn--solid yokai__cta" href="#waitlist">
              Join the waitlist
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
