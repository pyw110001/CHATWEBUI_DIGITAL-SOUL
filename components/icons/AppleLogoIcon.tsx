import React from 'react';

// Note: This component is now used for the application's branding logo.
// The filename is kept as AppleLogoIcon to minimize changes across the codebase.
const AppleLogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#a855f7' }} />
        <stop offset="100%" style={{ stopColor: '#34d399' }} />
      </linearGradient>
    </defs>
    <path
      fill="url(#logoGradient)"
      d="M50,5 C25.1,5 5,25.1 5,50s20.1,45 45,45c12.4,0 23.8-5 32.1-13.2-1.9-8.4-5.6-16.1-10.8-22.6-7.5-9.1-17.8-14.7-29.3-15.4-0.1-1.3-0.2-2.6-0.2-3.9 0-14.9 12.1-27 27-27 8.3,0 15.8,3.8 20.8,9.7C86.6,14.6 70.1,5 50,5z M71.3,64.9c4.3,3.7 7.7,8.2 9.9,13.2C87,71.2 90,61.1 90,50c0-14.3-8.3-26.7-20.2-32.2-3.5,6.6-8.8,12-15.3,15.5 10,2.1 18.8,8.2 24.6,17.1C75.6,55.1 72.8,59.8 71.3,64.9z"
    />
  </svg>
);

export default AppleLogoIcon;