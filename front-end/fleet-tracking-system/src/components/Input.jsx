import React from 'react';

const Input = ({ className = '', ...props }) => {
  return (
    <input
      className={`block w-full px-3 py-2 border border-[var(--border-color)] rounded-md shadow-sm placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] sm:text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] ${className}`}
      {...props}
    />
  );
};

export default Input;
