import React from 'react';

const Button = ({ children, onClick, variant = 'primary', className = '', ...props }) => {
  let baseStyles = 'inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200';
  let variantStyles = '';

  switch (variant) {
    case 'primary':
      variantStyles = 'bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] focus:ring-[var(--accent-color)]';
      break;
    case 'secondary':
      variantStyles = 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] focus:ring-[var(--border-color)] border-[var(--border-color)]';
      break;
    case 'outline':
      variantStyles = 'border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] focus:ring-[var(--border-color)]';
      break;
    case 'danger':
      variantStyles = 'bg-[var(--danger-color)] text-white hover:bg-red-700 focus:ring-[var(--danger-color)]';
      break;
    default:
      variantStyles = 'bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] focus:ring-[var(--accent-color)]';
  }

  return (
    <button
      type="button" // Default to type="button" to prevent accidental form submissions
      onClick={onClick}
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
