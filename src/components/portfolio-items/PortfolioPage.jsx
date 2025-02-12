import React from 'react';

const PortfolioPage = () => {
  return (
    <div className='portfolio-portfolioItem'>
        <div className='portfolio-portfolioItemText' id='portfolio-portfolioSiteText'>
            <h2 className='portfolio-portfolioItemTitle'>My Portfolio Site</h2>
            <p>Click on the link below to view the source code for this website!         
            </p>
            <div className='portfolio-portfolioButtonContainer'>
                <div className='portfolio-portfolioButton'>
                    <a href='https://github.com/shanehobson/portfolio' className='button' target='blank'>View Source Code</a>
                </div>
            </div>
        </div>
        <div className='portfolio-portfolioItemImage'>
            <a href='#'  target='blank'><img src='/images/portfolio-page.png' className='portfolio-screenshot'></img></a>
        </div>
    </div>
  );
}

export default PortfolioPage;