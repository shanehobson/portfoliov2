import React from 'react';

const PitchingTheory = () => {
  return (
    <div className='portfolio-portfolioItem'>
        <div className='portfolio-portfolioItemImage' id='portfolio-loaderGalleryImage' style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <a href='https://d115owle18y2b1.cloudfront.net/' target='blank'><img src='/images/nadia.png' className='portfolio-screenshot'></img></a>
        </div>
        <div className='portfolio-portfolioItemText' id='portfolio-loaderGalleryText'>
            <h2 className='portfolio-portfolioItemTitle'>The Science of Dance</h2>
            <p>
                A website built for a Naples, Florida dance studio containing a contact form that sends an email to the studio owner. Built using React with AWS Lambda, Api Gateway, and Simple Email Service.
            </p>
            <div className='portfolio-portfolioButtonContainer'>
                <div className='portfolio-portfolioButton'>
                    <a href='https://d115owle18y2b1.cloudfront.net/' className='button' target='blank'>Explore The App</a>
                </div>
                <div className='portfolio-portfolioButton'>
                    <a href='https://github.com/shanehobson/nadia' className='button' target='blank'>View Source Code</a>
                </div>
            </div>
        </div>
    </div>
  );
}

export default PitchingTheory;