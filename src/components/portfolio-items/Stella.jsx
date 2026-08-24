import React, { useEffect, useRef, useState } from "react";

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

const Stella = ({ imageRight }) => {
  const videoRef = useRef(null);
  const reducedMotion = useReducedMotion();

  // `autoPlay` covers the initial render; this only has to catch someone
  // turning the OS setting on while the page is already open. There is no
  // matching resume — starting playback from script would override the
  // browser's own autoplay policy (battery saver, data saver, and so on).
  useEffect(() => {
    if (!reducedMotion || !videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  }, [reducedMotion]);

  return (
    <div
      className={`portfolio-portfolioItem${
        imageRight ? " portfolio-portfolioItem--imageRight" : ""
      }`}
    >
      <div
        className="portfolio-portfolioItemImage"
        style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
      >
        {/*
          A 3s silent loop is an animated screenshot, so it autoplays rather
          than sitting behind a play button. Under reduced motion it becomes a
          still poster with controls instead — motion the viewer did not ask
          for, and cannot stop, is the thing that setting exists to prevent.
        */}
        <video
          ref={videoRef}
          height="300"
          autoPlay={!reducedMotion}
          loop={!reducedMotion}
          controls={reducedMotion}
          muted
          playsInline
          preload={reducedMotion ? "none" : "metadata"}
          poster="/images/stella-poster.webp"
          aria-label="The tools and capability catalogue in Stella"
          src="/video/Stella_Demo.mp4"
          type="video/mp4"
        >
        </video>
      </div>
      <div className="portfolio-portfolioItemText">
        <h2 className="portfolio-portfolioItemTitle">Stella</h2>
        <p>
          Stella is an open-source legal workspace that pulls matters,
          documents, review, research, and AI chat into one place. Legal teams
          work alongside an agent that reads their files, connected registries,
          and trusted sources, with approvals and source previews so every
          answer traces back to the underlying text. I'm one of the project's
          top contributors.
        </p>
        <p>
          The platform includes tabular review for extracting structured data
          across document sets, typed clients for national business registries,
          and an MCP-compatible tool layer. Built in TypeScript on TanStack
          Start and Bun, with PostgreSQL, Redis, and Docker — fully
          self-hostable, with no vendor lock-in or per-seat licensing.
        </p>
        <div className="portfolio-portfolioButtonContainer">
          <div className="portfolio-portfolioButton">
            <a href="https://stll.app/" className="button" target="blank">
              Explore The Project
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stella;
