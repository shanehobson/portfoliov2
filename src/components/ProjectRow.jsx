import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

// The preference is read through useSyncExternalStore rather than in a state
// initialiser so that it never runs during render on the server: the server
// snapshot is `false`, React reuses that for the hydration pass so the markup
// matches, and then re-renders once with the real value.
const subscribe = (callback) => {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};
const getSnapshot = () => window.matchMedia(REDUCED_MOTION).matches;
const getServerSnapshot = () => false;
const useReducedMotion = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

// A short silent loop is an animated screenshot, so it autoplays rather than
// sitting behind a play button. Under reduced motion it becomes a still poster
// with controls instead — motion the viewer did not ask for, and cannot stop,
// is the thing that setting exists to prevent.
//
// A loop also runs well past the five seconds 2.2.2 allows, and that criterion
// is not conditioned on the reduced-motion preference — it covers everyone,
// including the people who cannot set it. So an autoplaying panel carries a
// pause toggle. Full `controls` would do the job too, but it paints a media
// chrome bar across the panel, which is why it was left off in the first
// place. Once stopped it stays stopped: scrolling the panel back into view
// does not restart what the visitor deliberately paused.
//
// "Autoplays" means plays while on screen: the file is not fetched until the
// panel is within 200px of the viewport, and it pauses again once scrolled
// away, so a loop 10,000px down the page is not decoding frames under the
// hero. A muted `play()` from script is subject to the same autoplay policy as
// the attribute — it rejects under Low Power Mode and Data Saver rather than
// overriding anything — and that rejection is what switches the element to
// the same poster-and-controls shape reduced motion uses.
//
// The poster is also held back until the panel is within 800px of the
// viewport. Browsers fetch a `poster` the moment they parse it, whatever
// `preload` says, and twelve of them at once were the largest thing competing
// with the hero portrait for the connection. The cost is that the prerendered
// HTML carries no posters, so a visitor without JS sees plain video boxes far
// below the fold; with JS the observer has set them long before they scroll
// into view.
const ProjectMedia = ({ media }) => {
  const videoRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const [fallback, setFallback] = useState(false);
  const [near, setNear] = useState(false);
  const [paused, setPaused] = useState(false);
  const autoplay =
    media.kind === "video" && media.autoplay && !reducedMotion && !fallback;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: "800px 0px", threshold: 0 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!autoplay || !video) return;

    // Stopped by the toggle: no observer, so scrolling away and back cannot
    // start it again.
    if (paused) {
      video.pause();
      return;
    }

    const play = () =>
      video.play().catch((error) => {
        // pause() landing before play() settled is not a policy refusal.
        if (error?.name !== "AbortError") setFallback(true);
      });

    if (typeof IntersectionObserver === "undefined") {
      play();
      return () => video.pause();
    }

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? play() : video.pause()),
      { rootMargin: "200px 0px", threshold: 0 }
    );
    observer.observe(video);
    return () => {
      observer.disconnect();
      // Also the path for reduced motion being switched on while it plays.
      video.pause();
    };
  }, [autoplay, paused]);

  if (media.kind === "video") {
    return (
      <div className="project-media">
        <video
          ref={videoRef}
          loop={autoplay}
          controls={!autoplay}
          muted
          playsInline
          preload="none"
          poster={near ? media.poster : undefined}
          aria-label={media.alt}
          src={media.src}
        />
        {autoplay && (
          <button
            className="project-media__toggle"
            type="button"
            onClick={() => setPaused((stopped) => !stopped)}
            aria-label={`${paused ? "Play" : "Pause"} video: ${media.alt}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {paused ? (
                <path d="M8 5l11 7-11 7z" fill="currentColor" />
              ) : (
                <path d="M9 5h3v14H9zm6 0h3v14h-3z" fill="currentColor" />
              )}
            </svg>
          </button>
        )}
      </div>
    );
  }

  const image = (
    <img
      src={media.src}
      width={media.width}
      height={media.height}
      loading="lazy"
      decoding="async"
      alt={media.alt}
    />
  );

  return (
    <div className="project-media">
      {media.href ? (
        <a href={media.href} target="_blank" rel="noreferrer">
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  );
};

const ProjectRow = ({ project, index, imageRight }) => (
  <article
    className={`project${imageRight ? " project--imageRight" : ""}`}
    id={project.id}
  >
    <ProjectMedia media={project.media} />

    <div className="project-body">
      <p className="project-index">
        {String(index + 1).padStart(2, "0")}
      </p>
      <h3 className="project-title">{project.title}</h3>

      {project.tags.length > 0 && (
        <ul className="tags">
          {project.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}

      {project.body.map((paragraph, i) => (
        <p key={i} className="project-copy">
          {paragraph}
        </p>
      ))}

      {project.links.length > 0 && (
        <div className="project-links">
          {project.links.map((link) => (
            <a
              key={link.href}
              className="button"
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  </article>
);

export default ProjectRow;
