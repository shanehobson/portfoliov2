import React from 'react';

const HobsonElectric = () => {
  return (
    <div className='portfolio-portfolioItem'>
        <div className='portfolio-portfolioItemText'>
            <h2 className='portfolio-portfolioItemTitle'>Hobson Electric, Inc.</h2>
            <p>This project is a website for an electrical services company.
            The website contains information regarding the services provided by the company and information about the people who work for the company.
            The website has a "Contact Us" feature which allows the user
            to quickly send a request to the company for a free estimate on electrical services.
            The "Contact Us" feature relies on a back end that I built using Node.js and Express, which takes in form data and sends an email to the company's owner.
            The front end was built using Bootstrap and vanilla Javascript.
            </p>
            <div className='portfolio-portfolioButtonContainer'>
                <div className='portfolio-portfolioButton'>
                    <a href='https://dpu19jusqcx96.cloudfront.net' className='button' target='blank'>Explore The App</a>
                </div>
                <div className='portfolio-portfolioButton'>
                    <a href='https://github.com/shanehobson/hobson_electric' className='button' target='blank'>View Front-End Code</a>
                </div>
                <div className='portfolio-portfolioButton'>
                    <a href='https://github.com/shanehobson/mailer_api' className='button' target='blank'>View Backend Code</a>
                </div>
            </div>
        </div>
         <div className='portfolio-portfolioItemImage'>
            <a href='https://dpu19jusqcx96.cloudfront.net' target='blank'><img src='/images/hobson-electric.png' className='portfolio-screenshot'></img></a>
        </div>
        
    </div>
  );
}

export default HobsonElectric;