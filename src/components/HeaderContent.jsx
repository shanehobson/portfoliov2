import React from 'react';
import { Link } from "react-scroll";

const HeaderContent = () => {
  return (
    <div>
        <div className='HeaderContent-header'>
            <div className='HeaderContent-title'>
                Shane Hobson
            </div>
            <div className='HeaderContent-subtitle'>
                Building high-performance software at scale.
            </div>
            <div className='HeaderContent-button'>
            <Link
                activeClass="active"
                to="portfolio"
                spy={true}
                smooth={true}
                offset={0}
                duration={500}
              >
              <span className='button'>View My Work</span>
              </Link>
            </div>
        </div>
    </div>
  );
}

export default HeaderContent;