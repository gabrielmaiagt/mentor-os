import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { OptimizationDay, Optimization } from '../../types';
import { ArrowLeft, Clock, Play, Zap, AlertCircle } from 'lucide-react';
import './PublicDayOptimizations.css';

function isDirectVideo(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
        lower.includes('.mp4') ||
        lower.includes('.webm') ||
        lower.includes('.mov') ||
        lower.includes('.ogg') ||
        lower.includes('firebasestorage.googleapis.com') ||
        lower.includes('storage.googleapis.com')
    );
}

export const PublicDayOptimizationsPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [day, setDay] = useState<OptimizationDay | null>(null);
    const [optimizations, setOptimizations] = useState<Optimization[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [activeVideo, setActiveVideo] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) return;
        (async () => {
            // Fetch the day by slug
            const daysSnap = await getDocs(
                query(collection(db, 'optimization_days'), where('slug', '==', slug))
            );
            if (daysSnap.empty) { setNotFound(true); setLoading(false); return; }

            const dayDoc = daysSnap.docs[0];
            const dayData = { id: dayDoc.id, ...dayDoc.data() } as OptimizationDay;
            setDay(dayData);

            // Fetch optimizations for this day
            const optsSnap = await getDocs(
                query(
                    collection(db, 'optimizations'),
                    where('optimizationDayId', '==', dayDoc.id),
                    orderBy('order', 'asc')
                )
            );
            setOptimizations(optsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Optimization)));
            setLoading(false);
        })();
    }, [slug]);

    if (loading) {
        return (
            <div className="pub-day-root">
                <div className="pub-day-bg-fx" />
                <div className="pub-day-container">
                    <div className="pub-day-loading">
                        <div className="pub-day-spinner" />
                        <span>Carregando otimizações...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (notFound || !day) {
        return (
            <div className="pub-day-root">
                <div className="pub-day-bg-fx" />
                <div className="pub-day-container">
                    <div className="pub-day-notfound">
                        <AlertCircle size={48} />
                        <h2>Dia não encontrado</h2>
                        <p>Este dia de otimizações não existe ou foi removido.</p>
                        <button className="pub-day-back-btn" onClick={() => navigate('/otimizacoes')}>
                            <ArrowLeft size={16} /> Ver todos os dias
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pub-day-root">
            <div className="pub-day-bg-fx" />
            <div className="pub-day-container">
                {/* Back nav */}
                <button className="pub-day-back" onClick={() => navigate('/otimizacoes')}>
                    <ArrowLeft size={16} /> Todos os dias
                </button>

                {/* Header */}
                <header className="pub-day-header">
                    <div className="pub-day-badge">
                        <Zap size={14} />
                        <span>Otimizações Diárias</span>
                    </div>
                    <h1 className="pub-day-title">{day.title}</h1>
                    {day.date && (
                        <p className="pub-day-date">
                            {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                            })}
                        </p>
                    )}
                    <p className="pub-day-count">
                        {optimizations.length} {optimizations.length === 1 ? 'otimização' : 'otimizações'}
                    </p>
                </header>

                {/* Optimizations list */}
                {optimizations.length === 0 ? (
                    <div className="pub-day-empty">
                        <Play size={40} />
                        <p>Nenhum vídeo disponível ainda para este dia.</p>
                    </div>
                ) : (
                    <div className="pub-day-list">
                        {optimizations.map((opt, idx) => (
                            <div key={opt.id} className="pub-day-item" style={{ animationDelay: `${idx * 0.08}s` }}>
                                {/* Item header */}
                                <div className="pub-day-item-header">
                                    <div className="pub-day-item-index">{String(idx + 1).padStart(2, '0')}</div>
                                    <div className="pub-day-item-meta">
                                        <h2 className="pub-day-item-title">{opt.title}</h2>
                                        {opt.time && (
                                            <span className="pub-day-item-time">
                                                <Clock size={13} />
                                                {opt.time}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                {opt.description && (
                                    <p className="pub-day-item-desc">{opt.description}</p>
                                )}

                                {/* Video player */}
                                <div className="pub-day-video-wrapper">
                                    {isDirectVideo(opt.videoUrl) ? (
                                        <video
                                            className="pub-day-video"
                                            controls
                                            playsInline
                                            preload="metadata"
                                            onPlay={() => setActiveVideo(opt.id)}
                                            key={opt.videoUrl}
                                        >
                                            <source src={opt.videoUrl} />
                                            Seu navegador não suporta a reprodução de vídeos.
                                        </video>
                                    ) : (
                                        <div className="pub-day-embed-wrapper">
                                            {activeVideo === opt.id ? (
                                                <iframe
                                                    className="pub-day-iframe"
                                                    src={opt.videoUrl}
                                                    allow="autoplay; fullscreen; picture-in-picture"
                                                    allowFullScreen
                                                    title={opt.title}
                                                />
                                            ) : (
                                                <button
                                                    className="pub-day-play-btn"
                                                    onClick={() => setActiveVideo(opt.id)}
                                                >
                                                    <div className="pub-day-play-icon">
                                                        <Play size={32} fill="currentColor" />
                                                    </div>
                                                    <span>Clique para reproduzir</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <footer className="pub-day-footer">
                    <button className="pub-day-back-btn" onClick={() => navigate('/otimizacoes')}>
                        <ArrowLeft size={16} /> Ver todos os dias
                    </button>
                    <span>© {new Date().getFullYear()} Cérebro Exposto</span>
                </footer>
            </div>
        </div>
    );
};

export default PublicDayOptimizationsPage;
