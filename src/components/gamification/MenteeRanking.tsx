import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardHeader, CardContent } from '../ui';
import { calculateLevel } from '../../lib/gamification';
import { Medal, Crown } from 'lucide-react';
import type { Mentee } from '../../types';
import './MenteeRanking.css';

export const MenteeRanking: React.FC = () => {
    const [topMentees, setTopMentees] = useState<Mentee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRanking = async () => {
            const q = query(
                collection(db, 'mentees'),
                orderBy('xp', 'desc'),
                limit(10)
            );

            try {
                const snapshot = await getDocs(q);
                setTopMentees(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Mentee[]);
            } catch (error) {
                console.error("Error fetching ranking:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRanking();
    }, []);

    if (loading) return <div className="p-4 text-center">Carregando ranking...</div>;

    return (
        <Card className="mentee-ranking-card">
            <CardHeader
                title="Ranking Global"
                className="ranking-header"
            />
            <CardContent>
                <div className="ranking-list">
                    {topMentees.map((mentee, index) => {
                        const level = calculateLevel(mentee.xp || 0);
                        let rankIcon;
                        let rankClass = '';

                        if (index === 0) {
                            rankIcon = <Crown size={20} className="text-warning" fill="currentColor" />;
                            rankClass = 'rank-1';
                        } else if (index === 1) {
                            rankIcon = <Medal size={20} className="text-gray-400" />;
                            rankClass = 'rank-2';
                        } else if (index === 2) {
                            rankIcon = <Medal size={20} className="text-amber-700" />;
                            rankClass = 'rank-3';
                        } else {
                            rankIcon = <span className="rank-number">{index + 1}º</span>;
                        }

                        return (
                            <div key={mentee.id} className={`ranking-item ${rankClass}`}>
                                <div className="ranking-position">
                                    {rankIcon}
                                </div>
                                <div className="ranking-avatar">
                                    {mentee.avatarUrl ? (
                                        <img src={mentee.avatarUrl} alt={mentee.name} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {mentee.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="ranking-info">
                                    <span className="ranking-name">{mentee.name}</span>
                                    <span className="ranking-level">Nível {level}</span>
                                </div>
                                <div className="ranking-xp">
                                    {new Intl.NumberFormat('pt-BR').format(mentee.xp || 0)} XP
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
