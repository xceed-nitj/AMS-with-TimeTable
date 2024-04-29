import React from 'react';
import './animation.css'
const StarryBackgroundAnimation = () => {
    // Generate stars dynamically
    const numberOfStars = 50;
    const stars = [];

    for (let i = 0; i < numberOfStars; i++) {
        stars.push(
            <div className="star" key={i} style={{
                left: `${Math.random() * 100}vw`,
                top:` ${Math.random() * 100}vh`,
                animationDelay:` ${Math.random() * 3}s`
            }}></div>
        );
    }

    return (
        <div className="stars">
            {stars}
        </div>
    );
}

export default StarryBackgroundAnimation;