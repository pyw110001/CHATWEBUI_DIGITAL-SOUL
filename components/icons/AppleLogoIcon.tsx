import React, { useState } from 'react';
import { motion } from 'motion/react';
import logoImage from '@/assets/logo.png';

// Note: This component is now used for the application's branding logo.
// The filename is kept as AppleLogoIcon to minimize changes across the codebase.
const AppleLogoIcon: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (props) => {
  const [isHovered, setIsHovered] = useState(false);
  const { className, ...restProps } = props;

  return (
    <motion.div
      className="inline-block"
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        duration: 1
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <motion.img
        src={logoImage}
        alt="Logo"
        className={className}
        animate={{
          rotate: isHovered ? 360 : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{
          rotate: {
            duration: 2,
            ease: "easeInOut"
          },
          scale: {
            duration: 0.3
          }
        }}
        {...restProps}
      />
    </motion.div>
  );
};

export default AppleLogoIcon;