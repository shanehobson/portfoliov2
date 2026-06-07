import React from "react";

const Zaera = ({ imageRight }) => {
  return (
    <div className={`portfolio-portfolioItem${imageRight ? ' portfolio-portfolioItem--imageRight' : ''}`}>
      <div
        className="portfolio-portfolioItemText"
        id="portfolio-zaeraText"
      >
        <h2 className="portfolio-portfolioItemTitle">Zaera</h2>
        <p>
          An all-in-one scheduling and payments platform for service businesses.
          Zaera consolidates booking management, payment processing, and customer
          communication into a single dashboard, eliminating manual coordination
          and letting business owners focus on their clients.
        </p>
        <p>
          The platform features a beautiful branded booking experience for customers,
          color-coded team scheduling with double-booking prevention, and secure
          payment collection via Stripe. Built as a multi-tenant SaaS with a React
          admin dashboard, NestJS API, PostgreSQL database, and AWS infrastructure.
        </p>
        <div className="portfolio-portfolioButtonContainer">
          <div className="portfolio-portfolioButton">
            <a
              href="https://zaera.io/"
              className="button"
              target="blank"
            >
              View The Site
            </a>
          </div>
        </div>
      </div>
      <div
        className="portfolio-portfolioItemImage"
        id="portfolio-zaera"
      >
        <a href="https://zaera.io" target="blank">
          <img
            src="/images/zaera.png"
            className="portfolio-screenshot"
          ></img>
        </a>
      </div>
    </div>
  );
};

export default Zaera;
