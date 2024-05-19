import React, { useState, useEffect } from 'react';
import './animation.css';

const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: undefined,
        height: undefined,
    });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
};

const StarryBackgroundAnimation = () => {
    const { width } = useWindowSize();
    const isSmallScreen = width < 768;
    const numberOfStars = isSmallScreen ? 20 : 50;  // Reduced number of stars for small screens
    const stars = [];

    for (let i = 0; i < numberOfStars; i++) {
        const sideOrTopBottom = Math.random();

        let leftPosition;
        let topPosition;

        if (sideOrTopBottom < 0.5) {
            // Position stars on the sides (leftmost 20% or rightmost 20%)
            const isLeftSide = Math.random() > 0.5;
            leftPosition = isLeftSide
                ? `${Math.random() * 20}vw`  // Left 20% of the screen
                : `${80 + Math.random() * 20}vw`; // Right 20% of the screen
            topPosition = `${Math.random() * 100}vh`; // Anywhere vertically
        } else {
            // Position stars at the top 20% or bottom 20%
            const isTop = Math.random() > 0.5;
            leftPosition = `${Math.random() * 100}vw`; // Anywhere horizontally
            topPosition = isTop
                ? `${Math.random() * 20}vh` // Top 20% of the screen
                : `${80 + Math.random() * 20}vh`; // Bottom 20% of the screen
        }

        stars.push(
            <div className="star" key={i} style={{
                left: leftPosition,
                top: topPosition,
                animationDelay: `${Math.random() * 3}s`
            }}></div>
        );
    }

    return (
        <div className="stars dark:tw-bg-gray-900">
            {stars}
        </div>
    );
}

export default StarryBackgroundAnimation;
