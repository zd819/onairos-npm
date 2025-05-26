import React from 'react';

/**
 * Label Component
 * A customizable label component for form elements
 */
export function Label({
  htmlFor,
  children,
  className = '',
  ...props
}) {
  // Base classes
  const baseClasses = 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70';
  
  const classes = `${baseClasses} ${className}`;
  
  return (
    <label
      htmlFor={htmlFor}
      className={classes}
      {...props}
    >
      {children}
    </label>
  );
}

export default Label;
