// Keep in step with the <link rel="preload"> in index.html.
export const PORTRAIT_SRCSET =
  "/images/shane-cutout-480.webp 480w, /images/shane-cutout-640.webp 640w, /images/shane-cutout.webp 931w";
export const PORTRAIT_SIZES =
  "(max-width: 45rem) 320px, (max-width: 75rem) 56vh, (max-height: 1051px) 73vh, 763px";

// A color field with a cut-out photograph standing in the middle of it: the
// ghosted first name sits behind the head, the oversized wordmark crosses the
// chest, and the contact card floats over the right side.
const Hero = ({ onContact }) => (
  <section className="hero" id="hero">
    <div className="hero-inner shell">
      {/*
        The surname is only shown on a phone, where the wordmark on the bottom
        rail is hidden and the ghost stands in for it as two stacked lines.
      */}
      <p className="hero-ghost" aria-hidden="true">
        <span className="hero-ghost-line">SHANE</span>
        <span className="hero-ghost-line hero-ghost-line--last">HOBSON</span>
      </p>

      {/*
        On a phone this wrapper is the first screen: the statement at the top
        and the portrait hung from the bottom, so the cards start below the
        fold. Everywhere else it is display: contents and the grid sees
        straight through it.
      */}
      <div className="hero-fold">
        <div className="hero-statement">
          <span className="hero-rule" aria-hidden="true" />
          <h1 className="hero-lede">Software Engineer</h1>
        </div>

        {/*
          Decorative: the name is the <h1> above. It is the LCP element, so it
          is also preloaded from index.html, which must carry the same srcset
          and sizes or the browser preloads one file and then fetches another.
          The element is sized by height (hero.scss), so `sizes` describes the
          width that falls out of that: 0.93 x the height at each breakpoint.
        */}
        <div className="hero-portrait" aria-hidden="true">
          <img
            src="/images/shane-cutout.webp"
            srcSet={PORTRAIT_SRCSET}
            sizes={PORTRAIT_SIZES}
            width="931"
            height="1001"
            alt=""
            fetchPriority="high"
            decoding="async"
          />
        </div>
      </div>

      <div className="hero-cards">
        <a
          className="hero-card hero-card--contact"
          href="mailto:shanehobson1@gmail.com"
          onClick={onContact}
        >
          <span className="hero-card-avatar" aria-hidden="true">
            <img
              src="/images/shane-avatar.webp"
              width="144"
              height="144"
              alt=""
              decoding="async"
              fetchPriority="low"
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

      <a className="hero-scroll" href="#about">
        <span>Scroll</span>
        <span className="hero-scroll-line" aria-hidden="true" />
      </a>
    </div>
  </section>
);

export default Hero;
