import React, { useState } from 'react';
import { Card, Button, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { Calendar, Clock, Video, MessageSquare, Plus } from 'lucide-react';
import './MenteeCalls.css';

import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Loader } from 'lucide-react';

export const MenteeCallsPage: React.FC = () => {
    const toast = useToast();
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [calls, setCalls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [scheduleData, setScheduleData] = useState({
        type: 'ONBOARDING',
        date: '',
        time: '10:00'
    });

    React.useEffect(() => {
        // Fetch calls for current mentee (fallback 'm1')
        // Ideally: where('menteeId', '==', auth.currentUser?.uid)
        const q = query(collection(db, 'calls')); // Fetching all for demo if auth not ready, or filter by 'menteeId'
        // Ideally: query(collection(db, 'calls'), where('menteeId', '==', 'm1'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().scheduledAt?.toDate() // Mapping scheduledAt -> date
            }));
            setCalls(fetched);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSchedule = async () => {
        if (!scheduleData.date) {
            toast.error('Selecione uma data para a call');
            return;
        }

        try {
            const scheduledAt = new Date(`${scheduleData.date}T${scheduleData.time}`);
            await addDoc(collection(db, 'calls'), {
                menteeId: 'm1', // Fallback
                menteeName: 'Carlos Lima', // Fallback
                title: `Call: ${scheduleData.type}`,
                scheduledAt: scheduledAt,
                duration: 45,
                status: 'SCHEDULED', // Or REQUESTED if supported
                meetingLink: '',
                createdAt: new Date()
            });

            toast.success('Solicitação enviada!', 'O mentor confirmará o horário em breve.');
            setShowScheduleModal(false);
            setScheduleData({ type: 'ONBOARDING', date: '', time: '10:00' });
        } catch (error) {
            console.error("Error scheduling call:", error);
            toast.error("Erro ao agendar call");
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className="mentee-calls">
            <div className="calls-header">
                <div>
                    <h1>Minhas Calls</h1>
                    <p>Acompanhe e agende suas sessões de mentoria</p>
                </div>
                <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowScheduleModal(true)}>
                    Agendar Nova Call
                </Button>
            </div>

            <div className="calls-grid">
                <div className="calls-main">
                    <h2 className="section-title">Próximas Sessões</h2>
                    <div className="calls-list">
                        {loading ? <Loader className="animate-spin" /> :
                            calls.filter(c => c.status === 'SCHEDULED').map(call => (
                                <Card key={call.id} className="call-card next" padding="lg">
                                    <div className="call-date-badge">
                                        <Calendar size={20} />
                                        <span>{formatDate(call.date)}</span>
                                    </div>
                                    <div className="call-info">
                                        <h3>{call.title}</h3>
                                        <div className="call-meta">
                                            <span><Clock size={14} /> {call.duration} min</span>
                                            <span><Video size={14} /> Google Meet</span>
                                        </div>
                                    </div>
                                    <div className="call-actions">
                                        <Button variant="primary" onClick={() => window.open(call.link)}>
                                            Acessar Sala
                                        </Button>
                                        <Button variant="ghost" onClick={() => {
                                            toast.info('Reagendando call', 'Escolha um novo horário.');
                                            setShowScheduleModal(true);
                                        }}>
                                            Reagendar
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                    </div>

                    <h2 className="section-title mt-10">Histórico e Gravações</h2>
                    <div className="calls-list">
                        {calls.filter(c => c.status === 'COMPLETED').map(call => (
                            <Card key={call.id} className="call-card past" padding="md">
                                <div className="call-info">
                                    <h3>{call.title}</h3>
                                    <span className="call-date">{formatDate(call.date)}</span>
                                </div>
                                <div className="call-past-actions">
                                    {call.recordingUrl && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => window.open(call.recordingUrl, '_blank')}
                                        >
                                            Ver Gravação
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="sm" icon={<MessageSquare size={14} />}>Notas</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

            </div>

            {/* Schedule Modal */}
            <Modal
                isOpen={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                title="Agendar Call"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowScheduleModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSchedule}>Solicitar Agendamento</Button>
                    </>
                }
            >
                <div className="schedule-form">
                    <div className="form-field">
                        <label>Tipo de Call</label>
                        <select
                            value={scheduleData.type}
                            onChange={e => setScheduleData({ ...scheduleData, type: e.target.value })}
                        >
                            <option value="ONBOARDING">Onboarding (Inicial)</option>
                            <option value="STRATEGY">Estratégia</option>
                            <option value="REVIEW">Revisão de Campanhas</option>
                            <option value="DOUBTS">Tira-dúvidas</option>
                        </select>
                    </div>
                    <div className="form-row">
                        <div className="form-field">
                            <label>Data Sugerida</label>
                            <input
                                type="date"
                                min={new Date().toISOString().split('T')[0]}
                                value={scheduleData.date}
                                onChange={e => setScheduleData({ ...scheduleData, date: e.target.value })}
                            />
                        </div>
                        <div className="form-field">
                            <label>Horário</label>
                            <input
                                type="time"
                                value={scheduleData.time}
                                onChange={e => setScheduleData({ ...scheduleData, time: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MenteeCallsPage;
