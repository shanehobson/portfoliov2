import React from 'react';

const InvoiceGenerator = () => {
  return (
    <div className='portfolio-portfolioItem'>
        <div className='portfolio-portfolioItemText' id='portfolio-loaderGalleryText'>
            <h2 className='portfolio-portfolioItemTitle'>Invoice Generator</h2>
            <p>
            This web applications allows freelance software developers to create highly customized PDF invoices for client projects in just a few minutes. 
            The front-end of the project was built using React and Redux. On the backend, there is a Node.js/Express server that constructs a PDF document and saves the document in the cloud with AWS S3.
            </p>
            <p>
            Check out the video to the right to see me create an invoice in less than three minutes.
            </p>
            <div className='portfolio-portfolioButtonContainer'>
                <div className='portfolio-portfolioButton'>
                    <a href='https://form-tree-invoice-generator.herokuapp.com/' className='button' target='blank'>Explore The App</a>
                </div>
                <div className='portfolio-portfolioButton'>
                    <a href='https://github.com/shanehobson/invoice-generator-fe' className='button' target='blank'>View Front-End Source Code</a>
                </div>
                <div className='portfolio-portfolioButton'>
                    <a href='https://github.com/shanehobson/invoice-generator' className='button' target='blank'>View Backend Source Code</a>
                </div>
            </div>
        </div>
        <div className='portfolio-portfolioItemImage' id='portfolio-loaderGalleryImage' style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <video
            height="300"
            controls
            src="/video/Invoice_Generator.mp4"
            type="video/mp4"
            >
            </video>
        </div>
    </div>
  );
}

export default InvoiceGenerator;