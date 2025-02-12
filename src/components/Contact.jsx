import React from 'react';

const Contact = () => {
  return (
    <div className='contact-contentContainer'>
        <h1 className='section-title'>Contact</h1>
        <p className='contact-subtitle'>
        Interested in working together? Contact me directly by clicking the "Connect" button!
        </p>
        <div className='portfolio-portfolioButtonContainer'>
            <div className='contact-contactButton'>
                <a href='mailto:shanehobson1@gmail.com' className='button'>Connect With Me</a>
            </div>
        </div>
        <div className='contact-socialContainer'>
            <p>Connect with me on LinkedIn</p>
            <a href='https://www.linkedin.com/in/shane-hobson-1a979158/' target='blank'><img src='images/linked-in.png'></img></a>
        </div>
        {/* <div className='contact-socialContainer'>
            <p>View my GitHub</p>
            <a href='https://github.com/shanehobson' target='blank'><img src='images/github.png' className='contact-githubImage'></img></a>
        </div> */}
    </div>
  );
}

export default Contact;