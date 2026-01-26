import React from 'react';
import './Skeleton.css';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular' | 'card';
    width?: string | number;
    height?: string | number;
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    variant = 'text',
    width,
    height,
    className = '',
    style,
    ...props
}) => {
    const getSize = (size?: string | number) => {
        if (typeof size === 'number') return `${size}px`;
        return size;
    };

    return (
        <div
            className={`skeleton skeleton-${variant} ${className}`}
            style={{
                width: getSize(width),
                height: getSize(height),
                ...style,
            }}
            {...props}
        />
    );
};

export default Skeleton;
