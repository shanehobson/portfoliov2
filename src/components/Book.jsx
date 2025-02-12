import React from 'react';

const Book = () => {
  return (
    <div className='portfolio-portfolioItem'>
        <div className='portfolio-portfolioItemText'>
            <h2 className='portfolio-portfolioItemTitle'>How To Become a Self-Taught Software Developer</h2>
            <p>I taught myself how to code while working as an attorney in 2016. After successfully landing a job in software development, I began helping others pursue the goal of becoming a software developer without a traditional computer science education.

                Eventually, I decided to formally document the step-by-step process of becoming a self-taught software developer, and the result was this book. Since its publication, the book has helped hundreds of others pursue their dream of breaking into the software industry.

        

           
            </p>
           
            <div className='portfolio-portfolioButtonContainer'>
                <div className='portfolio-portfolioButton'>
                    <a href='https://www.amazon.com/How-Become-Self-Taught-Software-Developer/dp/B0CCCHSC82' className='button' target='blank'>Buy The Book</a>
                </div>
            </div>
        </div>
        <div className='portfolio-portfolioItemImage' id='portfolio-bookImage' style={{display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer'}}>
            <a href='https://www.amazon.com/How-Become-Self-Taught-Software-Developer/dp/B0CCCHSC82' target='blank'>
            <img
                height="400"
                src="/images/Book.png"
          >
            </img>
            </a>
         
        </div>
    </div>
  );
}

export default Book;