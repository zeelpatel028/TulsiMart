import React from 'react';

export const TableLoader = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full space-y-3 p-4 animate-pulse">
      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div key={cIdx} className="h-8 bg-slate-100 dark:bg-slate-900 rounded-lg flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

export default TableLoader;
