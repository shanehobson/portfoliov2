import { useEffect, useRef, useState } from "react";

const EMAIL = "shanehobson1@gmail.com";

// Names for the fields that can fail, so an error reads as a sentence rather
// than as whatever copy the browser happens to ship this year.
const FIELD_LABELS = { name: "Name", email: "Email" };

const errorFor = (field) => {
  if (field.validity.valueMissing) {
    return `${FIELD_LABELS[field.name] ?? "This field"} is required.`;
  }
  if (field.validity.typeMismatch) {
    return "Enter an email address, like name@example.com.";
  }
  return field.validationMessage;
};

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
  const doneRef = useRef(null);
  const lastOpener = useRef(null);

  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  // Field name -> message, populated by a failed submit.
  const [errors, setErrors] = useState({});
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
      setErrors({});
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

  // On success the form is replaced by the thanks panel, which takes the focus
  // that was sitting on the Send button that has just been hidden. Without
  // this, focus falls back to the dialog and nothing says anything happened.
  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  // Click on the backdrop (i.e. outside .contact-modal__inner) closes.
  const onBackdropClick = (event) => {
    if (event.target === dialogRef.current) onClose();
  };

  // Nothing goes red while you are still typing the first character of it —
  // but once a field has been flagged, clearing it should clear the flag,
  // rather than leaving a message standing over an input that is now fine.
  const onFieldInput = (event) => {
    const field = event.currentTarget;
    if (!submitted || !errors[field.name] || !field.checkValidity()) return;
    setErrors((current) => {
      const next = { ...current };
      delete next[field.name];
      return next;
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;

    // `noValidate` suppresses the browser's own bubbles, which are transient,
    // dismissed by the next keystroke and not reliably surfaced. These
    // messages are rendered instead, and tied to their fields.
    setSubmitted(true);
    const invalid = {};
    for (const field of form.elements) {
      if (!field.willValidate || field.checkValidity()) continue;
      invalid[field.name] = errorFor(field);
    }
    setErrors(invalid);

    const [firstInvalid] = Object.keys(invalid);
    if (firstInvalid) {
      form.elements[firstInvalid]?.focus();
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

  const describedBy = (field) =>
    errors[field] ? `contact-${field}-error` : undefined;

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
        <h2 className="contact-modal__title" id="contact-modal-title">
          Let&rsquo;s talk
        </h2>
        <p className="contact-modal__lede">
          Tell me what you&rsquo;re working on. I read every message and reply
          within two business days.
        </p>

        <form
          className="contact-form"
          ref={formRef}
          noValidate
          hidden={done}
          onSubmit={onSubmit}
        >
          <label className="field">
            <span className="field__label">
              Name<span aria-hidden="true">*</span>
              <span className="visually-hidden"> (required)</span>
            </span>
            <input
              className="field__input"
              ref={nameRef}
              name="name"
              type="text"
              required
              autoComplete="name"
              aria-invalid={errors.name ? "true" : undefined}
              aria-describedby={describedBy("name")}
              onInput={onFieldInput}
            />
            {errors.name && (
              <p className="field__error" id="contact-name-error">
                {errors.name}
              </p>
            )}
          </label>

          <label className="field">
            <span className="field__label">
              Email<span aria-hidden="true">*</span>
              <span className="visually-hidden"> (required)</span>
            </span>
            <input
              className="field__input"
              name="email"
              type="email"
              required
              autoComplete="email"
              aria-invalid={errors.email ? "true" : undefined}
              aria-describedby={describedBy("email")}
              onInput={onFieldInput}
            />
            {errors.email && (
              <p className="field__error" id="contact-email-error">
                {errors.email}
              </p>
            )}
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

          <button
            className="button button--primary"
            type="submit"
            disabled={sending}
          >
            Send
          </button>
        </form>

        <div className="contact-done" hidden={!done} ref={doneRef} tabIndex={-1}>
          <p className="contact-done__title">
            Thanks &mdash; I&rsquo;ll be in touch.
          </p>
          <p className="contact-done__note">
            I reply to every message within two business days.
          </p>
        </div>

        {/*
          Outside the <form>, because a successful send hides the form — and a
          live region that is removed at the moment there is something to
          announce announces nothing. The success line is hidden visually
          rather than dropped: the panel above already says it on screen, and
          the region is the only thing that says it out loud.
        */}
        <p
          className={`contact-form__status${done ? " visually-hidden" : ""}`}
          role="status"
          aria-live="polite"
          data-tone={status && status.kind !== "sending" ? "error" : undefined}
        >
          {done && "Message sent."}
          {!done && status?.kind === "sending" && "Sending…"}
          {!done &&
            status?.kind === "rate-limited" &&
            "Too many attempts, please try again later."}
          {!done && status?.kind === "failed" && (
            <>
              Could not send &mdash; please email{" "}
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
            </>
          )}
        </p>
      </div>
    </dialog>
  );
};

export default ContactModal;
