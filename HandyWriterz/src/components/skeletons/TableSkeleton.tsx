import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

/**
 * TableSkeleton Component
 * 
 * Displays a skeleton loading state for tables with customizable rows and columns.
 * Used to improve perceived performance while data is being fetched.
 */
const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true
}) => {
  return (
    <div className="w-full overflow-hidden animate-pulse">
      {showHeader && (
        <div className="bg-gray-100 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-flow-col gap-4 px-6 py-3">
            {Array.from({ length: columns }).map((_, index) => (
              <div key={`header-${index}`} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      )}
      
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-flow-col gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div 
                  key={`cell-${rowIndex}-${colIndex}`} 
                  className={`h-4 bg-gray-200 rounded ${colIndex === 0 ? 'w-1/3' : 'w-full'}`}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;
