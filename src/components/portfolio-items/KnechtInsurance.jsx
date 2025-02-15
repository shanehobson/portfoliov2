import React from 'react';

const KnechtInsurance = () => {
  return (
    <div className='portfolio-portfolioItem'>
         <div className='portfolio-portfolioItemImage' id='portfolio-blindsTrackerImage'>
            <a href='https://mighty-journey-73064.herokuapp.com/' target='blank'><img src='/images/knecht-insurance.png' className='portfolio-screenshot'></img></a>
        </div>
        <div className='portfolio-portfolioItemText' id='portfolio-blindsTrackerText'>
            <h2 className='portfolio-portfolioItemTitle'>Knecht Insurance</h2>
            <p>This is a website for an insurance broker built using HTML, CSS, and vanilla JavaScript.
            The website features a contact form, which allows a prospective customer to contact the business owner to obtain a quote.
            The contact form is powered by a NodeJS backend that intregrates with Gmail's API.
            </p>
            <div className='portfolio-portfolioButtonContainer'>
                <div className='portfolio-portfolioButton'>
                    <a href='https://mighty-journey-73064.herokuapp.com/' className='button' target='blank'>Explore The App</a>
                </div>
                <div className='portfolio-portfolioButton'>
                    <a href='https://github.com/miwaro/knecht-insurance' className='button' target='blank'>View Front-End Code</a>
                </div>
                <div className='portfolio-portfolioButton'>
                    <a href='https://github.com/miwaro/emailer-api' className='button' target='blank'>View Back-End Code</a>
                </div>
            </div>
        </div>
       
    </div>
  );
}

export default KnechtInsurance;