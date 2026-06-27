import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { OptimizationDay } from '../../types';
import { Calendar, ChevronRight, Zap, Play } from 'lucide-react';
import './PublicOptimizations.css';

export const PublicOptimizationsPage: React.FC = () => {
    const navigate = useNavigate();
    const [days, setDays] = useState<OptimizationDay[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const snap = await getDocs(query(collection(db, 'optimization_days'), orderBy('createdAt', 'desc')));
            setDays(snap.docs.map(d => ({ id: d.id, ...d.data() } as OptimizationDay)));
            setLoading(false);
        })();
    }, []);

    return (
        <div className="pub-opt-root">
            {/* Background FX */}
            <div className="pub-opt-bg-fx" />

            <div className="pub-opt-container">
                {/* Header */}
                <header className="pub-opt-header">
                    <div className="pub-opt-badge">
                        <Zap size={14} />
                        <span>Otimizações Diárias</span>
                    </div>
                    <h1 className="pub-opt-title">
                        Suas Otimizações
                        <span className="pub-opt-title-accent"> Dia a Dia</span>
                    </h1>
                    <p className="pub-opt-subtitle">
                        Acesse os vídeos de otimizações organizados por dia.
                        Clique em um dia para assistir.
                    </p>
                </header>

                {/* Day Cards */}
                {loading ? (
                    <div className="pub-opt-grid">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="pub-opt-skeleton" />
                        ))}
                    </div>
                ) : days.length === 0 ? (
                    <div className="pub-opt-empty">
                        <Play size={48} className="pub-opt-empty-icon" />
                        <p>Nenhuma otimização disponível ainda. Volte em breve!</p>
                    </div>
                ) : (
                    <div className="pub-opt-grid">
                        {days.map((day, idx) => (
                            <button
                                key={day.id}
                                className="pub-opt-card"
                                onClick={() => navigate(`/otimizacoes/${day.slug}`)}
                                style={{ animationDelay: `${idx * 0.06}s` }}
                            >
                                <div className="pub-opt-card-glow" />
                                <div className="pub-opt-card-number">
                                    {String(idx + 1).padStart(2, '0')}
                                </div>
                                <div className="pub-opt-card-content">
                                    <div className="pub-opt-card-icon">
                                        <Zap size={22} />
                                    </div>
                                    <h2 className="pub-opt-card-title">{day.title}</h2>
                                    {day.date && (
                                        <p className="pub-opt-card-date">
                                            <Calendar size={12} />
                                            {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                        </p>
                                    )}
                                </div>
                                <div className="pub-opt-card-arrow">
                                    <ChevronRight size={20} />
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                <footer className="pub-opt-footer">
                    <span>© {new Date().getFullYear()} Cérebro Exposto</span>
                </footer>
            </div>
        </div>
    );
};

export default PublicOptimizationsPage;
