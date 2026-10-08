import React from 'react';
import CartLoader from '../common/CartLoader';

export const PageLoader = ({ text = "Checking session...", size = "lg" }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white p-6 font-sans">
      <CartLoader text={text} size={size} showLogo={true} />
    </div>
  );
};

export default PageLoader;

