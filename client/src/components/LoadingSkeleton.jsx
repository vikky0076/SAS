import React from 'react';

export const CardSkeleton = () => (
  <div className="glass-card p-6 animate-pulse space-y-4">
    <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded w-1/3"></div>
    <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded w-1/2"></div>
    <div className="space-y-2">
      <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-full"></div>
      <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-5/6"></div>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="w-full animate-pulse overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
    <div className="bg-slate-200 dark:bg-slate-850 h-10 w-full"></div>
    <div className="divide-y divide-slate-200 dark:divide-slate-800">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex p-4 space-x-4 items-center">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div key={cIdx} className="h-4 bg-slate-300 dark:bg-slate-700 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const StatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 4 }).map((_, idx) => (
      <div key={idx} className="glass-card p-6 animate-pulse flex items-center space-x-4">
        <div className="w-12 h-12 rounded-xl bg-slate-300 dark:bg-slate-700"></div>
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded w-1/2"></div>
          <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-2/3"></div>
        </div>
      </div>
    ))}
  </div>
);
