import React from 'react';
import NavBar from './NavBar';
import HeaderContent from './HeaderContent';
import Portfolio from './Portfolio';
import About from './About';
import Contact from './Contact';
import Footer from './Footer';
import Writing from './Writing';

class DashboardPage extends React.Component {
  constructor(props) {
    super(props);
  };

  render() {
    return (
      <div>
        <div className='header'>
          <div className='header_dark-overlay '>
              <div className='header-navBar_container'>
                <NavBar />
              </div>
              <HeaderContent />
          </div>
        </div>
        <div className='about-container' id='about'>
          <div className='about-about'>
            <About />
          </div>
        </div>
        <div className='writing-container' id='writing'>
        <div className='writing-writing'>
            <Writing />
          </div>
        </div>
        <div className='portfolio-container' id='portfolio'>
          <div className='portfolio-portfolio'>
            <Portfolio />
          </div>
        </div>
        <div className='contact-container' id='contact'>
          <div className='contact-contact'>
            <Contact />
          </div>
        </div>
        <Footer />
    </div>
    )
  }
}

export default DashboardPage;
