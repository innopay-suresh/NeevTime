import React from 'react';

/**
 * Enhanced Skeleton Loader Component with Shimmer Effect
 * Replaces spinners with shimmer effect for better UX
 */
export default function SkeletonLoader({ rows = 5, columns = 4, showHeader = true }) {
    return (
        <div className="card-base overflow-hidden">
            {showHeader && (
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="skeleton-shimmer h-6 w-48 rounded"></div>
                </div>
            )}
            <div className="p-4">
                <table className="w-full">
                    {showHeader && (
                        <thead>
                            <tr>
                                {Array.from({ length: columns }).map((_, i) => (
                                    <th key={i} className="table-header">
                                        <div className="skeleton-shimmer h-4 w-24 rounded"></div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                    )}
                    <tbody>
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                            <tr key={rowIndex} className="table-row">
                                {Array.from({ length: columns }).map((_, colIndex) => (
                                    <td key={colIndex} className="px-6 py-4">
                                        <div className="skeleton-shimmer h-4 rounded" style={{ 
                                            width: colIndex === 0 ? '60%' : colIndex === columns - 1 ? '40%' : '80%' 
                                        }}></div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * Enhanced Skeleton Card Component with Shimmer
 * For loading card-based content
 */
export function SkeletonCard({ lines = 3 }) {
    return (
        <div className="card-base p-6">
            <div className="skeleton-shimmer h-6 w-3/4 rounded mb-4"></div>
            {Array.from({ length: lines }).map((_, i) => (
                <div key={i} className="skeleton-shimmer h-4 rounded mb-2" style={{ 
                    width: i === lines - 1 ? '60%' : '100%' 
                }}></div>
            ))}
        </div>
    );
}

/**
 * Enhanced Skeleton Stat Card Component with Shimmer
 * For loading dashboard stat cards
 */
export function SkeletonStatCard() {
    return (
        <div className="card-base p-5">
            <div className="skeleton-shimmer h-4 w-20 rounded mb-3"></div>
            <div className="skeleton-shimmer h-8 w-16 rounded mb-2"></div>
            <div className="skeleton-shimmer h-3 w-24 rounded"></div>
        </div>
    );
}

/**
 * Skeleton List Item Component
 * For loading list items
 */
export function SkeletonListItem() {
    return (
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="skeleton-shimmer w-10 h-10 rounded-full"></div>
            <div className="flex-1">
                <div className="skeleton-shimmer h-4 w-3/4 rounded mb-2"></div>
                <div className="skeleton-shimmer h-3 w-1/2 rounded"></div>
            </div>
        </div>
    );
}

/**
 * Skeleton Form Component
 * For loading forms
 */
export function SkeletonForm({ fields = 5 }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i}>
                    <div className="skeleton-shimmer h-3 w-24 rounded mb-2"></div>
                    <div className="skeleton-shimmer h-10 w-full rounded"></div>
                </div>
            ))}
        </div>
    );
}

