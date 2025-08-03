import React from "react";

const NightingaleNails = () => {
  return (
    <div className="portfolio-portfolioItem">
      <div
        className="portfolio-portfolioItemText"
        id="portfolio-blindsTrackerText"
      >
        <h2 className="portfolio-portfolioItemTitle">Nightingale Nails</h2>
        <p>
          A website built for a Denver, Colorado nail salon using NextJS. This
          site contains an email contact form built on top of NextJS Api Routes
          and Nodemailer. The site uses Incremental Static Regeneration (ISR) to
          achieve fast page loads while maintaining content freshness.
        </p>
        <div className="portfolio-portfolioButtonContainer">
          <div className="portfolio-portfolioButton">
            <a
              href="https://nightingalenails.com/"
              className="button"
              target="blank"
            >
              Explore The App
            </a>
          </div>
        </div>
      </div>
      <div
        className="portfolio-portfolioItemImage"
        id="portfolio-nightingaleNails"
      >
        <a href="https://nightingalenails.com" target="blank">
          <img
            src="/images/nightingale-nails.png"
            className="portfolio-screenshot"
          ></img>
        </a>
      </div>
    </div>
  );
};

export default NightingaleNails;
