import { useEffect, useRef, useState } from "react";

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "writing", label: "Writing" },
  { id: "work", label: "Work" },
  { id: "contact", label: "Contact" },
];

// Which section is under the middle of the viewport, by id, or null over the
// hero and the footer. The nav links are plain fragment anchors — the browser
// does the smooth scroll (`scroll-behavior` in _base.scss, which also honours
// reduced motion) and `scroll-padding-top` keeps the target out from under the
// fixed bar — so all that is left for JS is the highlight.
const useActiveSection = () => {
  const [active, setActive] = useState(null);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const targets = SECTIONS.map(({ id }) =>
      document.getElementById(id)
    ).filter(Boolean);
    // A thin band across the middle of the viewport: the highlight flips the
    // moment a section's edge crosses it, in either direction.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return active;
};

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const active = useActiveSection();
  const toggleRef = useRef(null);
  const overlayRef = useRef(null);
  const wasMenuOpen = useRef(false);

  // The bar is transparent over the hero and picks up a ground and a hairline
  // once anything has scrolled under it.
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The mobile menu covers the page, so the page behind it must not scroll —
  // and must not be reachable either. Without the inert half, tabbing forward
  // out of the last menu link walks into content that is completely hidden
  // behind an opaque overlay. The bar itself stays live: it paints above the
  // overlay (z-index 100 against 1), so its mark and its toggle are both
  // visible and both still want to be usable.
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    const covered = [
      document.getElementById("content"),
      document.querySelector("footer"),
    ].filter(Boolean);
    for (const el of covered) el.inert = isMenuOpen;
    return () => {
      document.body.style.overflow = "";
      for (const el of covered) el.inert = false;
    };
  }, [isMenuOpen]);

  // Focus follows the panel: into its first link on open, back to the toggle
  // that opened it on close. The guard keeps the first render from stealing
  // focus to the toggle on a page that was never opened.
  useEffect(() => {
    if (isMenuOpen) {
      overlayRef.current?.querySelector("a")?.focus();
    } else if (wasMenuOpen.current) {
      toggleRef.current?.focus();
    }
    wasMenuOpen.current = isMenuOpen;
  }, [isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className={`nav${isScrolled ? " nav--scrolled" : ""}`}>
      <div className="nav-inner shell">
        <a className="nav-mark" href="#hero" onClick={closeMenu}>
          SH<sup>®</sup>
        </a>

        <nav className="nav-links" aria-label="Sections">
          {SECTIONS.map(({ id, label }) => (
            <a
              key={id}
              className={`nav-link${active === id ? " nav-link--active" : ""}`}
              href={`#${id}`}
              aria-current={active === id ? "location" : undefined}
            >
              {label}
            </a>
          ))}
          <a className="nav-link" href="/blog/">
            Blog
          </a>
        </nav>

        <button
          className={`nav-toggle${isMenuOpen ? " nav-toggle--open" : ""}`}
          ref={toggleRef}
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="nav-overlay"
        >
          <span />
          <span />
        </button>
      </div>

      <div
        className={`nav-overlay${isMenuOpen ? " nav-overlay--open" : ""}`}
        id="nav-overlay"
        ref={overlayRef}
        // Hidden from assistive tech and from the tab order while closed; the
        // panel is still in the DOM so it can transition.
        inert={!isMenuOpen}
      >
        {/* Named apart from the bar's own nav: only one of the two is ever
            exposed, but two landmarks called "Sections" would be a coin
            flip for anyone listing them. */}
        <nav className="nav-overlay-links" aria-label="Menu">
          {SECTIONS.map(({ id, label }, index) => (
            <a key={id} href={`#${id}`} onClick={closeMenu}>
              <span className="nav-overlay-index">
                0{index + 1}
              </span>
              {label}
            </a>
          ))}
          <a href="/blog/" onClick={closeMenu}>
            <span className="nav-overlay-index">05</span>
            Blog
          </a>
        </nav>
      </div>
    </header>
  );
};

export default NavBar;
