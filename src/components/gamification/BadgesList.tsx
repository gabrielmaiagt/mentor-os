import React from 'react';
import { BADGES } from '../../lib/gamification';
import { Lock, CheckCircle } from 'lucide-react';
import './BadgesList.css';

interface BadgesListProps {
    earnedBadgeIds?: string[];
}

export const BadgesList: React.FC<BadgesListProps> = ({ earnedBadgeIds = [] }) => {
    // Calculate stats
    const totalBadges = BADGES.length;
    const earnedCount = earnedBadgeIds.length;
    const progress = Math.round((earnedCount / totalBadges) * 100);

    return (
        <div className="badges-container">
            {/* Summary Card */}
            <div className="badges-summary">
                <div className="badges-progress-card">
                    <div className="badges-progress-info">
                        <h3>Minhas Conquistas</h3>
                        <p>{earnedCount} de {totalBadges} desbloqueadas</p>
                    </div>
                    <div className="badges-progress-circle">
                        <svg viewBox="0 0 36 36" className="circular-chart">
                            <path className="circle-bg"
                                d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path className="circle"
                                strokeDasharray={`${progress}, 100`}
                                d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <text x="18" y="20.35" className="percentage">{progress}%</text>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="badges-grid">
                {BADGES.map((badge) => {
                    const isUnlocked = earnedBadgeIds.includes(badge.id);

                    return (
                        <div
                            key={badge.id}
                            className={`badge-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                        >
                            <div className="badge-icon-wrapper">
                                <span className="badge-icon">{badge.icon}</span>
                                {isUnlocked && <div className="badge-check"><CheckCircle size={12} /></div>}
                                {!isUnlocked && <div className="badge-lock"><Lock size={12} /></div>}
                            </div>
                            <div className="badge-info">
                                <h4 className="badge-title">{badge.label}</h4>
                                <p className="badge-description">{badge.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
