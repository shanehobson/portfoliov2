import { useEffect, useState } from "react";
import { Link } from "react-scroll";

const SECTIONS = [
  { to: "about", label: "About" },
  { to: "writing", label: "Writing" },
  { to: "work", label: "Work" },
  { to: "contact", label: "Contact" },
];

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // The bar is transparent over the hero and picks up a ground and a hairline
  // once anything has scrolled under it.
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The mobile menu covers the page, so the page behind it must not scroll.
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
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
        <Link
          to="hero"
          smooth
          duration={600}
          className="nav-mark"
          onClick={closeMenu}
        >
          SH<sup>®</sup>
        </Link>

        <nav className="nav-links" aria-label="Sections">
          {SECTIONS.map(({ to, label }) => (
            <Link
              key={to}
              className="nav-link"
              activeClass="nav-link--active"
              to={to}
              spy
              smooth
              offset={-80}
              duration={600}
            >
              {label}
            </Link>
          ))}
          <a className="nav-link" href="/blog/">
            Blog
          </a>
        </nav>

        <button
          className={`nav-toggle${isMenuOpen ? " nav-toggle--open" : ""}`}
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          <span />
          <span />
        </button>
      </div>

      <div
        className={`nav-overlay${isMenuOpen ? " nav-overlay--open" : ""}`}
        // Hidden from assistive tech and from the tab order while closed; the
        // panel is still in the DOM so it can transition.
        {...(isMenuOpen ? {} : { inert: "" })}
      >
        <nav className="nav-overlay-links" aria-label="Sections">
          {SECTIONS.map(({ to, label }, index) => (
            <Link
              key={to}
              to={to}
              spy
              smooth
              offset={-80}
              duration={600}
              onClick={closeMenu}
            >
              <span className="nav-overlay-index">
                0{index + 1}
              </span>
              {label}
            </Link>
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
