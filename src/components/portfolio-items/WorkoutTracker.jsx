import React from 'react';

const WorkoutTracker = () => {
  return (
    <div className='portfolio-portfolioItem'>
        <div className='portfolio-portfolioItemText'>
            <h2 className='portfolio-portfolioItemTitle'>Workout Tracker</h2>
            <p>Workout Tracker allows the user to keep a daily log of their workouts and provides the user with analytics concerning the frequency and intensity of their workouts, along with the relative distribution of exercise types and body part usage.
            The app uses the D3 data visualization framework to build graphs and charts giving the user real-time and historic information on their workouts and workout patterns.
            The app features a chart showing the user's activity over the previous 365-day period, which was inspired by the Github annual contributions chart.
            The front-end of Workout Tracker was built using Angular, and the backend was built using Node.js, Express, and a MongoDB cloud database.
            </p>
            <div className='portfolio-portfolioButtonContainer'>
                <div className='portfolio-portfolioButton'>
                    <a href='https://workout-tracker-application.herokuapp.com/' className='button' target='blank'>Explore The App</a>
                </div>
                <div className='portfolio-portfolioButton'>
                    <a href='https://github.com/shanehobson/workout-tracker' className='button' target='blank'>View Front-End Source Code</a>
                </div>
                <div className='portfolio-portfolioButton'>
                    <a href='https://github.com/shanehobson/workout-tracker-api' className='button' target='blank'>View Back-End Source Code</a>
                </div>
            </div>
        </div>
        <div className='portfolio-portfolioItemImage' id='portfolio-loaderGalleryImage' style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <video
                height="300"
                controls
                src="/video/workout-tracker-video.mp4"
                type="video/mp4">
            </video>
        </div>
    </div>
  );
}

export default WorkoutTracker;