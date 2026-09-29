import React from 'react';

export const CardLoader = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-2 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/2" />
          <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
};

export default CardLoader;
