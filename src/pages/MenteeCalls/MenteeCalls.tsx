import React from 'react';
import { Card, Button } from '../../components/ui';
import { Calendar, Clock, Video, MessageSquare } from 'lucide-react';
import './MenteeCalls.css';

const mockCalls: any[] = [
    {
        id: 'c1',
        title: 'Revisão Semanal de Mineração',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
        duration: '45 min',
        mentor: 'Gabriel (Mentor)',
        status: 'SCHEDULED',
        link: 'https://meet.google.com/abc-defg-hij',
        recordingUrl: undefined
    },
    {
        id: 'c2',
        title: 'Call de Onboarding',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        duration: '60 min',
        mentor: 'Gabriel (Mentor)',
        status: 'COMPLETED',
        recordingUrl: 'https://loom.com/share/...'
    }
];

export const MenteeCallsPage: React.FC = () => {
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
                <h1>Minhas Calls</h1>
                <p>Acompanhe e agende suas sessões de mentoria</p>
            </div>

            <div className="calls-grid">
                <div className="calls-main">
                    <h2 className="section-title">Próximas Sessões</h2>
                    <div className="calls-list">
                        {mockCalls.filter(c => c.status === 'SCHEDULED').map(call => (
                            <Card key={call.id} className="call-card next" padding="lg">
                                <div className="call-date-badge">
                                    <Calendar size={20} />
                                    <span>{formatDate(call.date)}</span>
                                </div>
                                <div className="call-info">
                                    <h3>{call.title}</h3>
                                    <div className="call-meta">
                                        <span><Clock size={14} /> {call.duration}</span>
                                        <span><Video size={14} /> Google Meet</span>
                                    </div>
                                </div>
                                <div className="call-actions">
                                    <Button variant="primary" onClick={() => window.open(call.link)}>
                                        Acessar Sala
                                    </Button>
                                    <Button variant="ghost">Reagendar</Button>
                                </div>
                            </Card>
                        ))}
                    </div>

                    <h2 className="section-title mt-10">Histórico e Gravações</h2>
                    <div className="calls-list">
                        {mockCalls.filter(c => c.status === 'COMPLETED').map(call => (
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
        </div>
    );
};

export default MenteeCallsPage;
