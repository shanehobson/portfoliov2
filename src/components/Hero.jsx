import { Link } from "react-scroll";

// A color field with a cut-out photograph standing in the middle of it: the
// ghosted first name sits behind the head, the oversized wordmark crosses the
// chest, and two cards float over the right side.
const Hero = () => (
  <section className="hero" id="hero">
    <div className="hero-inner shell">
      <p className="hero-ghost" aria-hidden="true">
        SHANE
      </p>

      <div className="hero-statement">
        <span className="hero-rule" aria-hidden="true" />
        <h1 className="hero-lede">Software Engineer</h1>
      </div>

      {/* Decorative: the name is the <h1> above. */}
      <div className="hero-portrait" aria-hidden="true">
        <img
          src="/images/shane-cutout.webp"
          width="931"
          height="1001"
          alt=""
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <div className="hero-cards">
        <a
          className="hero-card hero-card--work"
          href="https://www.findmyodyssey.com"
          target="_blank"
          rel="noreferrer"
        >
          <span className="hero-card-media">
            <img
              src="/images/odyssey-hero.webp"
              width="1300"
              height="655"
              alt=""
              decoding="async"
            />
          </span>
          <span className="hero-card-foot">
            <span className="hero-card-name">
              <span aria-hidden="true">✳</span> Odyssey
            </span>
            <span className="hero-card-kind">/ Travel Planner</span>
          </span>
        </a>

        <a
          className="hero-card hero-card--contact"
          href="mailto:shanehobson1@gmail.com"
        >
          <span className="hero-card-avatar" aria-hidden="true">
            <img
              src="/images/shane.webp"
              width="600"
              height="645"
              alt=""
              decoding="async"
            />
          </span>
          <span className="hero-card-copy">
            <span className="hero-card-eyebrow">Let&rsquo;s talk</span>
            <span className="hero-card-name">Shane Hobson</span>
            <span className="hero-card-kind">Software Engineer</span>
          </span>
          <span className="hero-card-arrow" aria-hidden="true">
            ↗
          </span>
        </a>
      </div>

      <div className="hero-name">
        <span className="hero-year">&copy;2026</span>
        <span className="hero-wordmark">Shane Hobson</span>
      </div>

      <Link
        className="hero-scroll"
        to="about"
        smooth
        offset={-80}
        duration={800}
      >
        <span>Scroll</span>
        <span className="hero-scroll-line" aria-hidden="true" />
      </Link>
    </div>
  </section>
);

export default Hero;
