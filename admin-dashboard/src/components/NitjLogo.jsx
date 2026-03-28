import React from 'react';
import logoImage from '../assets/image.png';

export default function NitjLogo({ size = 42, className = '' }) {
  return (
    <img 
      src={logoImage} 
      alt="NIT Jalandhar Logo" 
      width={size} 
      height={size} 
      className={className} 
      style={{ display: 'block', objectFit: 'contain' }}
    />
  );
}
