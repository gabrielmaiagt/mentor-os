import React from 'react';
import './Badge.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'cold' | 'warm' | 'hot';
    size?: 'sm' | 'md';
    pulse?: boolean;
    dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'md',
    pulse = false,
    dot = false,
    className = '',
    ...props
}) => {
    const classes = [
        'badge',
        `badge-${variant}`,
        `badge-${size}`,
        pulse && 'badge-pulse',
        dot && 'badge-dot',
        className,
    ].filter(Boolean).join(' ');

    return (
        <span className={classes} {...props}>
            {dot && <span className="badge-dot-indicator" />}
            {children}
        </span>
    );
};

export default Badge;
