import React, { useState } from 'react';
import { Link } from "react-scroll";

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div>
        <div className='NavBar-navBar'>
            <div className='NavBar-item' id='NavBar-icon'>
            </div>
            
            <button 
              className='NavBar-hamburger'
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <span className={`NavBar-hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
              <span className={`NavBar-hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
              <span className={`NavBar-hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
            </button>

            <div className={`NavBar-menu ${isMenuOpen ? 'NavBar-menu-open' : ''}`}>
              <div className='NavBar-item'>
                <Link
                  activeClass="active"
                  to="about"
                  spy={true}
                  smooth={true}
                  offset={0}
                  duration={1000}
                  onClick={closeMenu}
                >
                  <p>About Me</p>
                </Link>
              </div>
              <div className='NavBar-item'>
                <Link
                  activeClass="active"
                  to="writing"
                  spy={true}
                  smooth={true}
                  offset={0}
                  duration={1000}
                  onClick={closeMenu}
                >
                  <p>Writing</p>
                </Link>
              </div>
              <div className='NavBar-item'>
                <Link
                  activeClass="active"
                  to="portfolio"
                  spy={true}
                  smooth={true}
                  offset={0}
                  duration={500}
                  onClick={closeMenu}
                >
                  <p>Portfolio</p>
                </Link>
              </div>
              <div className='NavBar-item'>
                <Link
                  activeClass="active"
                  to="contact"
                  spy={true}
                  smooth={true}
                  offset={0}
                  duration={1200}
                  onClick={closeMenu}
                >
                  <p>Contact</p>
                </Link>
              </div>
            </div>
        </div>
    </div>
  );
}

export default NavBar;



