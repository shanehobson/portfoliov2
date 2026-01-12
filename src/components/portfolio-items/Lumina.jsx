import React from "react";

const Lumina = ({ imageRight }) => {
  return (
    <div className={`portfolio-portfolioItem${imageRight ? ' portfolio-portfolioItem--imageRight' : ''}`}>
      <div className="portfolio-portfolioItemText">
        <h2 className="portfolio-portfolioItemTitle">Lumina Model Academy</h2>
        <p>
          A website built for a Naples, Florida model academy using NextJS.
        </p>
        <div className="portfolio-portfolioButtonContainer">
          <div className="portfolio-portfolioButton">
            <a
              href="https://www.luminamodelacademy.com"
              className="button"
              target="blank"
            >
              Explore The Site
            </a>
          </div>
        </div>
      </div>
      <div className="portfolio-portfolioItemImage">
        <a href="https://www.luminamodelacademy.com" target="blank">
          <img
            src="/images/lumina.png"
            className="portfolio-screenshot"
          ></img>
        </a>
      </div>
    </div>
  );
};

export default Lumina;
