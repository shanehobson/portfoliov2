import React from 'react';
import { Link } from "react-scroll";

const NavBar = () => {
  return (
    <div>
        <div className='NavBar-navBar'>
            <div className='NavBar-item' id='NavBar-icon'>
            </div>
            <div className='NavBar-item'>
              <Link
                activeClass="active"
                to="about"
                spy={true}
                smooth={true}
                offset={0}
                duration={1000}
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
              >
                <p>My Writing</p>
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
              >
                <p>Contact</p>
              </Link>
            </div>
        </div>
    </div>
  );
}

export default NavBar;



