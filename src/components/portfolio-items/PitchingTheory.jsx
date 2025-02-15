import React from 'react';

const PitchingTheory = () => {
  return (
    <div className='portfolio-portfolioItem'>
        <div className='portfolio-portfolioItemImage' id='portfolio-loaderGalleryImage' style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <video
            height="300"
            controls
            src="/video/app-demo-1.mp4"
            type="video/mp4"
            >
            </video>
        </div>
        <div className='portfolio-portfolioItemText' id='portfolio-loaderGalleryText'>
            <h2 className='portfolio-portfolioItemTitle'>Blog Content Management System</h2>
            <p>
            This web application allows content creators to create a multimedia blog post in less than five minutes. Users have the ability to create blog posts containing text, images, and video. The blog posts can be edited or deleted by the author at any time.
            The app was built using the MEAN stack (MongoDB, Express.js, Angular, and Node.js). The app uses AWS services for file storage and content delivery.
            </p>
            <p>
            Check out the video to the left to see the system in action and watch me create, edit, and delete a blog post in three minutes.
            </p>
            <div className='portfolio-portfolioButtonContainer'>
                {/* <div className='portfolio-portfolioButton'>
                    <a href='https://www.pitchingtheory.com' className='button' target='blank'>Explore The App</a>
                </div> */}
                <div className='portfolio-portfolioButton'>
                    <a href='https://github.com/shanehobson/pitching-theory-app' className='button' target='blank'>View Source Code</a>
                </div>
            </div>
        </div>
    </div>
  );
}

export default PitchingTheory;