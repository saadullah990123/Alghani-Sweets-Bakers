import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: string;
}

export default function Skeleton({ className = '', rounded = 'rounded-xl', ...props }: SkeletonProps) {
  return <div className={`skeleton-shimmer ${rounded} ${className}`} aria-hidden="true" {...props} />;
}