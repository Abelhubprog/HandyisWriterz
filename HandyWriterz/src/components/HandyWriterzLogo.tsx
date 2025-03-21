import React from 'react';
import { Link } from 'react-router-dom';

export interface HandyWriterzLogoProps {
  className?: string;
  withText?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  asLink?: boolean;
  linkProps?: any;
}

export const HandyWriterzLogo: React.FC<HandyWriterzLogoProps> = ({
  className = '',
  withText = true,
  onClick,
  size = 'md',
  asLink = true,
  linkProps = {},
}) => {
  // Size mappings
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const content = (
    <>
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-600/20 transition-transform duration-300 group-hover:scale-110`}>
        <span className={textSizeClasses[size]}>H</span>
      </div>
      {withText && (
        <span className={`${textSizeClasses[size]} font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:tracking-wide`}>
          HandyWriterz
        </span>
      )}
    </>
  );

  if (!asLink) {
    return (
      <div 
        className={`flex items-center gap-2 group ${className}`}
        onClick={onClick}
      >
        {content}
      </div>
    );
  }

  return (
    <Link 
      to="/" 
      className={`flex items-center gap-2 group ${className}`}
      onClick={onClick}
      aria-label="HandyWriterz Home"
      {...linkProps}
    >
      {content}
    </Link>
  );
};

export const HandyWriterzIcon: React.FC<HandyWriterzLogoProps> = (props) => {
  return <HandyWriterzLogo {...props} withText={false} />;
};

export default HandyWriterzLogo; 