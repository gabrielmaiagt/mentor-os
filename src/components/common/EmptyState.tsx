import React from 'react';
import { Card, Button } from '../ui';
import type { LucideIcon } from 'lucide-react';
import './EmptyState.css';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    variant?: 'default' | 'minimal';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    variant = 'default'
}) => {
    return (
        <div className={`empty-state ${variant === 'minimal' ? 'empty-state-minimal' : ''}`}>
            <Card className="empty-state-card">
                <div className="empty-state-content">
                    <div className="empty-state-icon">
                        <Icon size={48} strokeWidth={1.5} />
                    </div>
                    <h3 className="empty-state-title">{title}</h3>
                    <p className="empty-state-description">{description}</p>
                    {actionLabel && onAction && (
                        <Button
                            variant="primary"
                            onClick={onAction}
                            className="empty-state-action"
                        >
                            {actionLabel}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};
