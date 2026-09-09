const Footer = () => (
  <footer className="footer">
    <div className="shell footer-inner">
      <p className="footer-mark">
        SH<sup>®</sup>
      </p>
      <p className="footer-text">Handcrafted by me &copy; 2026.</p>
      <a
        className="footer-link"
        href="https://www.linkedin.com/in/shane-hobson-1a979158/"
        target="_blank"
        // Same claim the Person node in index.html makes under sameAs.
        rel="me noreferrer"
      >
        LinkedIn ↗
      </a>
    </div>
  </footer>
);

export default Footer;
