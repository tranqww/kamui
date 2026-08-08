import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import Hero from './sections/Hero/Hero.jsx'
import Strategic from './sections/Strategic/Strategic.jsx'
import Cards from './sections/Cards/Cards.jsx'
import Yokai from './sections/Yokai/Yokai.jsx'
import { useLenis } from './hooks/useLenis.js'
import { useReveal } from './hooks/useReveal.js'

export default function App() {
  useLenis()
  useReveal()

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Strategic />
        <Cards />
        <Yokai />
      </main>
      <Footer />
    </>
  )
}
