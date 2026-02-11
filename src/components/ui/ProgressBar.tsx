import React from 'react';
import './ProgressBar.css';

export interface ProgressBarProps {
    value?: number; // 0-100, undefined para indeterminado
    height?: number;
    color?: string;
    backgroundColor?: string;
    showLabel?: boolean;
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    height = 8,
    color = '#818cf8',
    backgroundColor = 'rgba(129, 140, 248, 0.1)',
    showLabel = false,
    className = ''
}) => {
    const isIndeterminate = value === undefined;
    const progressValue = Math.min(Math.max(value || 0, 0), 100);

    return (
        <div className={`progress-bar ${className}`}>
            <div
                className="progress-bar__track"
                style={{
                    height: `${height}px`,
                    backgroundColor
                }}
            >
                <div
                    className={`progress-bar__fill ${isIndeterminate ? 'progress-bar__fill--indeterminate' : ''}`}
                    style={{
                        width: isIndeterminate ? '30%' : `${progressValue}%`,
                        backgroundColor: color
                    }}
                />
            </div>
            {showLabel && !isIndeterminate && (
                <span className="progress-bar__label">{progressValue}%</span>
            )}
        </div>
    );
};
