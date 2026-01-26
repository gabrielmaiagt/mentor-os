import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Card, CardContent, Badge, Button } from '../../components/ui';
import { Calendar, Clock, Play, Video, ChevronRight } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import type { Call } from '../../types';
import './MenteeCalls.css';

export const MenteeCallsPage: React.FC = () => {
    const [calls, setCalls] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);
    const [menteeId, setMenteeId] = useState<string | null>(null);
    const toast = useToast();

    // 1. Get Mentee ID from current User
    useEffect(() => {
        const fetchMenteeId = async () => {
            if (!auth.currentUser) return;

            // Try to find mentee linked to this user
            const q = query(collection(db, 'mentees'), where('userId', '==', auth.currentUser.uid));
            // Real-time listener not strictly needed for ID lookup but good for consistency
            const unsubscribe = onSnapshot(q, (snapshot) => {
                if (!snapshot.empty) {
                    setMenteeId(snapshot.docs[0].id);
                } else {
                    setLoading(false); // User is not a mentee or not linked
                }
            });
            return () => unsubscribe();
        };
        fetchMenteeId();
    }, []);

    // 2. Fetch Calls
    useEffect(() => {
        if (!menteeId) return;

        const q = query(
            collection(db, 'calls'),
            where('menteeId', '==', menteeId),
            orderBy('scheduledAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCalls(snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                scheduledAt: d.data().scheduledAt?.toDate(),
                endAt: d.data().endAt?.toDate(),
                createdAt: d.data().createdAt?.toDate(),
            })) as Call[]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [menteeId]);

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    if (loading) return <div className="p-8 text-center text-secondary animate-pulse">Carregando suas calls...</div>;

    if (!menteeId) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
                <p className="text-secondary">Seu usuário não está vinculado a um perfil de mentorado.</p>
            </div>
        );
    }

    const nextCall = calls.find(c => c.status === 'SCHEDULED');
    const pastCalls = calls.filter(c => c.status === 'DONE' || c.status === 'MISSED' || c.status === 'CANCELED');

    return (
        <div className="mentee-calls-page space-y-8 p-6 max-w-5xl mx-auto">
            <header className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Mentorias</h1>
                <p className="text-secondary text-lg">Acompanhe sua agenda e reveja as gravações dos encontros.</p>
            </header>

            {/* Next Call Highlight */}
            {nextCall && (
                <Card className="border-accent-primary/20 bg-accent-primary/5">
                    <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary">
                                <Calendar size={32} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="info">Próxima Call</Badge>
                                    <span className="text-sm text-secondary uppercase tracking-wider font-semibold">
                                        {nextCall.type}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold mb-1">
                                    {formatDate(nextCall.scheduledAt)}
                                </h3>
                                <div className="flex items-center gap-2 text-secondary">
                                    <Clock size={16} />
                                    <span>{nextCall.durationMinutes} minutos</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-full md:w-auto">
                            <Button
                                variant="primary"
                                size="lg"
                                className="w-full md:w-auto shadow-lg shadow-accent-primary/20"
                                onClick={() => nextCall.meetLink ? window.open(nextCall.meetLink, '_blank') : toast.info('Link não disponível', 'O link da reunião será liberado próximo ao horário.')}
                            >
                                <Video size={18} />
                                Entrar na Sala
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* History */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Play size={20} className="text-secondary" />
                    Histórico de Encontros
                </h2>

                {pastCalls.length === 0 ? (
                    <Card padding="lg" className="text-center py-12 border-dashed">
                        <div className="bg-surface-hover w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-tertiary">
                            <Video size={32} />
                        </div>
                        <p className="text-secondary text-lg">Nenhuma mentoria realizada ainda.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {pastCalls.map(call => (
                            <Card key={call.id} className="hover:border-white/10 transition-colors group">
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${call.status === 'DONE' ? 'bg-success/10 text-success' : 'bg-surface-hover text-tertiary'}`}>
                                            {call.status === 'DONE' ? <Play size={24} fill="currentColor" className="opacity-20" /> : <Video size={24} />}
                                            {call.status === 'DONE' && <Play size={20} className="absolute" />}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg">{formatDate(call.scheduledAt)}</h4>
                                            <div className="flex items-center gap-3 text-sm text-secondary">
                                                <Badge variant={call.status === 'DONE' ? 'success' : 'default'} size="sm">
                                                    {call.status === 'DONE' ? 'Concluída' : call.status}
                                                </Badge>
                                                <span>{call.durationMinutes} min</span>
                                                <span>•</span>
                                                <span className="capitalize">{call.type.toLowerCase()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {call.recordingUrl ? (
                                        <Button
                                            variant="secondary"
                                            onClick={() => window.open(call.recordingUrl, '_blank')}
                                            className="group-hover:bg-white group-hover:text-black transition-colors"
                                        >
                                            Ver Gravação <ChevronRight size={16} />
                                        </Button>
                                    ) : (
                                        <span className="text-sm text-tertiary italic">Sem gravação</span>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenteeCallsPage;
