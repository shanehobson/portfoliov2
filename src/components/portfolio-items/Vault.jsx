import React from 'react';

const Vault = () => {
  return (
    <div className='portfolio-portfolioItem'>
         <div className='portfolio-portfolioItemImage' id='portfolio-loaderGalleryImage' style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <video
            height="300"
            controls
            src="/video/Vault_Demo.mov"
            type="video/mov"
            >
            </video>
        </div>
        <div className='portfolio-portfolioItemText' id='portfolio-loaderGalleryText'>
            <h2 className='portfolio-portfolioItemTitle'>Vault</h2>
            <p>
            Vault is a web application that allows for quick and easy upload and cloud storage of photos and videos from your phone, tablet, or computer. Vault has a React frontend, and a serverless backend built on AWS Cognito, API Gateway, Lambda, DynamoDB, and S3.
            </p>
            <p>
            Check out the video to the left to see it in action.
            </p>
          
        </div>
       
    </div>
  );
}

export default Vault;