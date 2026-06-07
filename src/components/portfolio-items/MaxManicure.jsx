import React from "react";

const MaxManicure = ({ imageRight }) => {
  return (
    <div className={`portfolio-portfolioItem${imageRight ? ' portfolio-portfolioItem--imageRight' : ''}`}>
      <div
        className="portfolio-portfolioItemText"
        id="portfolio-maxManicureText"
      >
        <h2 className="portfolio-portfolioItemTitle">Max Manicure</h2>
        <p>
          A website built for a nail salon, with integrated online scheduling
          and payments powered by{" "}
          <a href="https://zaera.io/" target="blank">Zaera</a>.
          Built with Astro for fast static delivery and deployed on AWS via CDK.
        </p>
        <div className="portfolio-portfolioButtonContainer">
          <div className="portfolio-portfolioButton">
            <a
              href="https://www.maxmanicure.com"
              className="button"
              target="blank"
            >
              Explore The Site
            </a>
          </div>
        </div>
      </div>
      <div
        className="portfolio-portfolioItemImage"
        id="portfolio-maxManicure"
      >
        <a href="https://www.maxmanicure.com" target="blank">
          <img
            src="/images/max-manicure.png"
            className="portfolio-screenshot"
          ></img>
        </a>
      </div>
    </div>
  );
};

export default MaxManicure;
