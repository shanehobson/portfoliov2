import React from 'react';

const About = () => {
  return (
    <div className='about-contentContainer'>
        <div>
            <h1 className='section-title'>About Me</h1>
            <div className='about-imageContainer'>
                {/* <img src='/images/me5.png' className='about-pic' id='about-pic1'></img> */}
                <img src='/images/m1.png' className='about-pic' id='about-pic2'></img>
                {/* <img src='/images/profile-pic5.jpg' className='about-pic' id='about-pic3'></img> */}
            </div>

            <p className='section-subtitle' id='about-subtitle'>
                I am a software engineer building high-performance, scalable applications that serve hundreds of thousands of users. I have experince across the entire stack, from frontend to backend to dev ops and cloud services. I have nearly a decade of experience building software for the web, and I am an Amazon Web Services Certified Solutions Architect.
                <br />
            </p>

            <p className='section-subtitle' id='about-subtitle'>
            I have a proven track record of designing and implementing production-grade applications across various technology stacks, helping businesses and individuals solve real-world problems. I thrive on tackling complex challenges, optimizing performance, and delivering robust, maintainable solutions.
                <br />
            </p>

            <p className='section-subtitle' id='about-subtitle2'>
                I currently work as a consultant for a Fortune 100 media company, helping build a system that manages over a billion dollars in ad revenue.  When not working, I enjoy learning new technologies, building all sorts of web apps large and small, writing about software, and reading widely on subjects including software architecture and design, history, philosophy, and law. I also enjoy traveling and exploring the outdoors from my home base in Denver, CO.
            </p>
            <p className='section-subtitle' id='about-subtitle3'>
                Prior to becoming a web developer, I attended law school and practiced law for three years as a litigation and trial attorney. I remain a licensed attorney. As a result of this background, I am deeply interested in the intersection between law and technology and I am passionate about using my dual skillset to solve legal problems using technology. 
            </p>
            <div className='about-listContainer'>
                <div>
                    <p className='about-subheading'>
                        Core Technologies:
                    </p>
                    <p className='about-list'>
                        TypeScript <br />
                        Angular <br />
                        React<br />
                        NodeJS<br />
                        Amazon Web Services<br />
                    </p>
                </div>
               
            </div>
            <div className='about-listContainer'>
                <div>
                    <p className='about-subheading'>
                        Certificates:
                    </p>
                    <p className='about-list'>
                        AWS Certified Solutions Architect (Associate)<br />
                        AWS Certified Cloud Practitioner<br />
                    </p>
                </div>
            </div>
        </div>
        <hr />
    </div>
  );
}

export default About;