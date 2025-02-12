import React from 'react';

const LoaderGallery = () => {
  return (
    <div className='portfolio-portfolioItem'>
        <div className='portfolio-portfolioItemText' id='portfolio-loaderGalleryText'>
            <h2 className='portfolio-portfolioItemTitle'>LoaderGallery.com</h2>
            <p>This web application allows web developers to quickly and easily add loading animations to their websites and web apps
            in order to keep users engaged while pages are loading or while the application makes network requests.
            The user has the ability to select a color from a color picker, or enter a HEX or RGBA value.
            The application then allows the user to easily copy and paste the necessary HTML and CSS code in order to implement the animation into their application in the user's color of choice.
            This app was built using React, Redux, and Material-UI.
            </p>
            <div className='portfolio-portfolioButtonContainer'>
                <div className='portfolio-portfolioButton'>
                    <a href='https://www.loadergallery.com' className='button' target='blank'>Explore The App</a>
                </div>
                <div className='portfolio-portfolioButton'>
                    <a href='https://github.com/shanehobson/loaders' className='button' target='blank'>View Source Code</a>
                </div>
            </div>
        </div>
        <div className='portfolio-portfolioItemImage' id='portfolio-loaderGalleryImage'>
            <a href='https://www.loadergallery.com' target='blank'><img src='/images/loader-gallery.png' className='portfolio-screenshot'></img></a>
        </div>
    </div>
  );
}

export default LoaderGallery;