import { useEffect, useRef, useState } from "react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(
    () => window.matchMedia(REDUCED_MOTION).matches
  );

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION);
    const onChange = (event) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
};

// A short silent loop is an animated screenshot, so it autoplays rather than
// sitting behind a play button. Under reduced motion it becomes a still poster
// with controls instead — motion the viewer did not ask for, and cannot stop,
// is the thing that setting exists to prevent.
const ProjectMedia = ({ media }) => {
  const videoRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const autoplay = media.kind === "video" && media.autoplay;

  // `autoPlay` covers the initial render; this only has to catch someone
  // turning the OS setting on while the page is already open. There is no
  // matching resume — starting playback from script would override the
  // browser's own autoplay policy (battery saver, data saver, and so on).
  useEffect(() => {
    if (!autoplay || !reducedMotion || !videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  }, [autoplay, reducedMotion]);

  if (media.kind === "video") {
    const video = (
      <video
        ref={videoRef}
        autoPlay={autoplay && !reducedMotion}
        loop={autoplay && !reducedMotion}
        controls={!autoplay || reducedMotion}
        muted
        playsInline
        preload={autoplay && !reducedMotion ? "metadata" : "none"}
        poster={media.poster}
        aria-label={media.alt}
        src={media.src}
      />
    );
    return <div className="project-media">{video}</div>;
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
