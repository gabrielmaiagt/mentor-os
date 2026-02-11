import React, { ReactNode } from 'react';
import { Spinner } from './Spinner';
import './LoadingOverlay.css';

export interface LoadingOverlayProps {
    visible: boolean;
    message?: string;
    progress?: number;
    blur?: boolean;
    children?: ReactNode;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    visible,
    message = 'Carregando...',
    progress,
    blur = true,
    children
}) => {
    if (!visible) return children ? <>{children}</> : null;

    return (
        <div className="loading-overlay-container">
            {children && <div className={`loading-overlay-content ${blur ? 'loading-overlay-content--blur' : ''}`}>{children}</div>}
            <div className="loading-overlay">
                <div className="loading-overlay__card">
                    <Spinner size="lg" />
                    {message && <p className="loading-overlay__message">{message}</p>}
                    {progress !== undefined && (
                        <div className="loading-overlay__progress">
                            <div
                                className="loading-overlay__progress-bar"
                                style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
                            />
                            <span className="loading-overlay__progress-label">{Math.round(progress)}%</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
