const Contact = ({ onContact }) => (
  <section className="section contact" id="contact" aria-labelledby="contact-title">
    <div className="shell contact-inner">
      <p className="eyebrow">04 / Contact</p>
      <h2 className="contact-title" id="contact-title">
        Let&rsquo;s build
        <br />
        something.
      </h2>
      <p className="section-lede">
        Interested in working together? Reach out directly — I read every
        message.
      </p>

      <a className="contact-email" href="mailto:shanehobson1@gmail.com">
        shanehobson1@gmail.com
      </a>

      <div className="contact-actions">
        <a
          className="button button--primary"
          href="mailto:shanehobson1@gmail.com"
          onClick={onContact}
          // Announced as a link, because with JavaScript off that is exactly
          // what it is; this says what it does when JavaScript is on.
          aria-haspopup="dialog"
        >
          Connect with me
        </a>
        <a
          className="button"
          href="https://www.linkedin.com/in/shane-hobson-1a979158/"
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn
        </a>
      </div>
    </div>
  </section>
);

export default Contact;
