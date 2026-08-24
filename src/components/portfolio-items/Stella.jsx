import React from "react";

const Stella = ({ imageRight }) => {
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
        <video
          height="300"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/images/stella-poster.jpg"
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
