import React from 'react';
import './Spinner.css';

export interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: string;
    className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
    size = 'md',
    color = '#818cf8',
    className = ''
}) => {
    return (
        <div className={`spinner spinner--${size} ${className}`}>
            <svg className="spinner__svg" viewBox="0 0 50 50">
                <circle
                    className="spinner__circle"
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    strokeWidth="4"
                    stroke={color}
                />
            </svg>
        </div>
    );
};
