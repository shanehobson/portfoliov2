import { useEffect, useRef, useState } from "react";

const EMAIL = "shanehobson1@gmail.com";

// The contact form. One dialog for the whole page — every CTA that calls
// `onContact` opens it. Submits JSON to `/api/contact`, which CloudFront routes
// to the contact Lambda (see cdk/lambda/contact).
//
// `opener` is the element that opened the dialog, or null while it is closed.
// It doubles as the open flag and as the place focus goes back to on close.
const ContactModal = ({ opener, onClose }) => {
  const dialogRef = useRef(null);
  const formRef = useRef(null);
  const nameRef = useRef(null);
  const lastOpener = useRef(null);

  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  // null, or { kind: "sending" | "rate-limited" | "failed" }.
  const [status, setStatus] = useState(null);

  // Every way out — the close button, a backdrop click, Escape — ends in the
  // dialog's native `close` event, so this is the one place the reset lives.
  // Escape in particular closes the dialog natively, and not always through
  // React: while a submit is in flight the button is disabled, which drops
  // focus out of the dialog, so a keydown handler on it would never fire.
  useEffect(() => {
    const dialog = dialogRef.current;
    const onClosed = () => {
      // Back to a blank form, so a second message from any CTA starts clean
      // rather than reopening onto the previous "thanks" panel or onto fields
      // still flagged red from the last submit attempt.
      formRef.current?.reset();
      setStatus(null);
      setSubmitted(false);
      setDone(false);
      lastOpener.current?.focus();
      lastOpener.current = null;
      // Already null when the close came from React; this is for the native
      // path, so the same trigger can open the dialog again.
      onClose();
    };
    dialog.addEventListener("close", onClosed);
    return () => dialog.removeEventListener("close", onClosed);
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (opener) {
      lastOpener.current = opener;
      if (!dialog.open) dialog.showModal();
      nameRef.current?.focus();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [opener]);

  // Click on the backdrop (i.e. outside .contact-modal__inner) closes.
  const onBackdropClick = (event) => {
    if (event.target === dialogRef.current) onClose();
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    // `noValidate` suppresses the browser's own bubbles until here, so the
    // first report is the one the submit asks for.
    setSubmitted(true);
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setSending(true);
    setStatus({ kind: "sending" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });

      if (res.ok) {
        setDone(true);
        return;
      }

      setStatus({ kind: res.status === 429 ? "rate-limited" : "failed" });
    } catch {
      // Offline, or the dev proxy is not configured.
      setStatus({ kind: "failed" });
    } finally {
      setSending(false);
    }
  };

  return (
    <dialog
      className="contact-modal"
      ref={dialogRef}
      aria-labelledby="contact-modal-title"
      onClick={onBackdropClick}
    >
      <div className="contact-modal__inner">
        <button
          className="contact-modal__close"
          type="button"
          onClick={onClose}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <p className="eyebrow">Contact</p>
        <h3 className="contact-modal__title" id="contact-modal-title">
          Let&rsquo;s talk
        </h3>
        <p className="contact-modal__lede">
          Tell me what you&rsquo;re working on. I read every message and reply
          within two business days.
        </p>

        <form
          className="contact-form"
          ref={formRef}
          noValidate
          hidden={done}
          data-submitted={submitted ? "" : undefined}
          onSubmit={onSubmit}
        >
          <label className="field">
            <span className="field__label">Name*</span>
            <input
              className="field__input"
              ref={nameRef}
              name="name"
              type="text"
              required
              autoComplete="name"
            />
          </label>

          <label className="field">
            <span className="field__label">Email*</span>
            <input
              className="field__input"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span className="field__label">Phone</span>
            <input
              className="field__input"
              name="phone"
              type="tel"
              autoComplete="tel"
            />
          </label>

          <label className="field">
            <span className="field__label">Message</span>
            <textarea
              className="field__input"
              name="description"
              rows="5"
              placeholder="What are you building?"
            />
          </label>

          {/* Honeypot: off-screen and out of the tab order, so only a bot
              fills it. */}
          <input
            className="visually-hidden"
            name="website"
            tabIndex="-1"
            autoComplete="off"
            aria-hidden="true"
          />

          <p
            className="contact-form__status"
            role="status"
            aria-live="polite"
            data-tone={
              status && status.kind !== "sending" ? "error" : undefined
            }
          >
            {status?.kind === "sending" && "Sending…"}
            {status?.kind === "rate-limited" &&
              "Too many attempts, please try again later."}
            {status?.kind === "failed" && (
              <>
                Could not send &mdash; please email{" "}
                <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
              </>
            )}
          </p>

          <button
            className="button button--primary"
            type="submit"
            disabled={sending}
          >
            Send
          </button>
        </form>

        <div className="contact-done" hidden={!done}>
          <p className="contact-done__title">
            Thanks &mdash; I&rsquo;ll be in touch.
          </p>
          <p className="contact-done__note">
            I reply to every message within two business days.
          </p>
        </div>
      </div>
    </dialog>
  );
};

export default ContactModal;
