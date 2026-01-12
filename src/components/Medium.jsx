import React from "react";

const Medium = () => {
  return (
    <div className="portfolio-portfolioItem portfolio-portfolioItem--imageRight">
      <div className="portfolio-portfolioItemText">
        <h2 className="portfolio-portfolioItemTitle">Medium</h2>
        <p>
          I write on Medium about all things software development: architecture,
          scalability, AI, and real-world lessons from building production
          systems.
        </p>

        <div className="portfolio-portfolioButtonContainer">
          <div className="portfolio-portfolioButton">
            <a
              href="https://medium.com/@shanehobson1"
              className="button"
              target="blank"
            >
              View My Articles
            </a>
          </div>
        </div>
      </div>
      <div
        className="portfolio-portfolioItemImage"
        id="portfolio-bookImage"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <a href="https://medium.com/@shanehobson1" target="blank">
          <img height="280" src="/images/medium.png"></img>
        </a>
      </div>
    </div>
  );
};

export default Medium;
