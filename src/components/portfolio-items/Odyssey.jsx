import React from "react";

const Odyssey = ({ imageRight }) => {
  return (
    <div
      className={`portfolio-portfolioItem${
        imageRight ? " portfolio-portfolioItem--imageRight" : ""
      }`}
    >
      <div className="portfolio-portfolioItemImage" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <video
          height="300"
          controls
          src="/video/Odyssey_video.mp4"
          type="video/mp4"
        >
        </video>
      </div>
      <div className="portfolio-portfolioItemText">
        <h2 className="portfolio-portfolioItemTitle">Odyssey</h2>
        <p>
          Odyssey is an AI-driven travel planning application that turns
          prompts into structured, day-by-day itineraries in seconds.
        </p>
        <p>
          Built with streaming AI architecture for live partial responses,
          usage-aware design with tiered plans and cost-protection guardrails,
          and a modern React stack using TanStack Query. The serverless backend
          runs on AWS (Lambda, API Gateway, DynamoDB, S3).
        </p>
        <div className="portfolio-portfolioButtonContainer">
          <div className="portfolio-portfolioButton">
            <a
              href="https://www.findmyodyssey.com"
              className="button"
              target="blank"
            >
              Explore The App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Odyssey;
