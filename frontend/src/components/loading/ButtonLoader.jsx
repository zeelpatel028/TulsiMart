import React from 'react';

export const ButtonLoader = ({ text = "Processing..." }) => {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      <span>{text}</span>
    </div>
  );
};

export default ButtonLoader;
