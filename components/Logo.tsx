
import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => {
  // Design 1: The "Decision Tree" - Minimalist Nodes
  // Represents branching logic and connected variables.
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 12H7L10 7M7 12L10 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="4" cy="12" r="2" fill="currentColor" className="opacity-80"/>
      <circle cx="11" cy="7" r="2" fill="currentColor"/>
      <circle cx="11" cy="17" r="2" fill="currentColor" className="opacity-60"/>
      <path d="M13 7H16L19 5M16 7L19 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="20" cy="5" r="1.5" fill="currentColor"/>
      <circle cx="20" cy="9" r="1.5" fill="currentColor" className="opacity-60"/>
    </svg>
  );
};
