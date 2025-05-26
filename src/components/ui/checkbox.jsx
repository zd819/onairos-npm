import React from 'react';

/**
 * Checkbox Component
 * A customizable checkbox component
 */
export function Checkbox({
  id,
  className = '',
  checked,
  onCheckedChange,
  disabled = false,
  ...props
}) {
  // Base classes
  const baseClasses = 'peer h-4 w-4 shrink-0 rounded-sm border border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground';
  
  const classes = `${baseClasses} ${className}`;
  
  return (
    <input
      type="checkbox"
      id={id}
      className={classes}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      disabled={disabled}
      {...props}
    />
  );
}

export default Checkbox;
