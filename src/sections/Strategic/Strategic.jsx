import Stage from '../../components/three/Stage.jsx'
import SplitHeading from '../../components/SplitHeading.jsx'
import PlatformBadges from '../../components/PlatformBadges.jsx'
import StrategicScene from './StrategicScene.jsx'
import './strategic.css'

export default function Strategic() {
  return (
    <section id="game" className="section strategic" aria-labelledby="strategic-title">
      <Stage camera={{ position: [0, 0, 36], fov: 40, near: 0.1, far: 300 }}>
        {({ tier, reduced }) => <StrategicScene tier={tier} reduced={reduced} />}
      </Stage>

      <div className="section__content strategic__inner shell">
        <div className="strategic__copy">
          <p className="eyebrow" data-reveal>
            Powered by Ethereum
          </p>

          <SplitHeading
            id="strategic-title"
            lines={['A Strategic', 'Card Game']}
            className="strategic__title"
            data-reveal
          />

          <p className="lede strategic__lede" data-reveal style={{ '--reveal-delay': '160ms' }}>
            Proudly powered by Ethereum, enter the immersive world of Kamui, a multi-platform gaming
            experience. Marrying the best elements of Gods Unchained and Hearthstone in a fresh and
            vibrant new package, Kamui draws thematic influence from feudal Japan to create an
            experience like no other available today.
          </p>

          <div data-reveal style={{ '--reveal-delay': '260ms' }}>
            <PlatformBadges className="strategic__platforms" />
          </div>
        </div>
      </div>
    </section>
  )
}
