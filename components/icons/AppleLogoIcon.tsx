import React from 'react';
import logoImage from '@/assets/logo.png';

// Note: This component is now used for the application's branding logo.
// The filename is kept as AppleLogoIcon to minimize changes across the codebase.
const AppleLogoIcon: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (props) => (
  <img
    src={logoImage}
    alt="Logo"
    {...props}
  />
);

export default AppleLogoIcon;