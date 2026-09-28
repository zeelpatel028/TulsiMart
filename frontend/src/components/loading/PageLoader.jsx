import React from 'react';
import CartLoader from '../common/CartLoader';

export const PageLoader = ({ text = "Loading Tulsi Mart...", size = "md" }) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <CartLoader text={text} size={size} />
    </div>
  );
};

export default PageLoader;
