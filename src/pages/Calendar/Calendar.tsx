import React, { useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    Video
} from 'lucide-react';
import { Card, Badge, Button, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import type { Call } from '../../types';
import './Calendar.css';

// Mock data
const mockCalls: Call[] = [
    {
        id: 'c1',
        menteeId: 'm1',
        scheduledAt: new Date(new Date().setHours(10, 0, 0, 0)),
        durationMinutes: 60,
        type: 'REGULAR',
        status: 'SCHEDULED',
        meetLink: 'https://meet.google.com/abc-defg-hij',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 'c2',
        menteeId: 'm2',
        scheduledAt: new Date(new Date().setHours(14, 0, 0, 0)),
        durationMinutes: 45,
        type: 'ONBOARDING',
        status: 'SCHEDULED',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 'c3',
        menteeId: 'm1',
        scheduledAt: new Date(new Date(Date.now() + 24 * 60 * 60 * 1000).setHours(11, 0, 0, 0)),
        durationMinutes: 60,
        type: 'REGULAR',
        status: 'SCHEDULED',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

const mockMentees: Record<string, { name: string }> = {
    'm1': { name: 'Carlos Lima' },
    'm2': { name: 'Ana Oliveira' },
};

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8h to 19h

export const CalendarPage: React.FC = () => {
    const toast = useToast();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showNewCallModal, setShowNewCallModal] = useState(false);

    // Get week dates
    const getWeekDates = () => {
        const start = new Date(currentDate);
        start.setDate(start.getDate() - start.getDay());

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            return date;
        });
    };

    const weekDates = getWeekDates();

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const getCallsForDate = (date: Date) => {
        return mockCalls.filter(call => {
            const callDate = new Date(call.scheduledAt);
            return callDate.toDateString() === date.toDateString();
        });
    };

    const getCallStyle = (call: Call) => {
        const hour = new Date(call.scheduledAt).getHours();
        const top = (hour - 8) * 64 + 8; // 64px per hour + 8px offset
        const height = (call.durationMinutes / 60) * 64 - 4;
        return { top: `${top}px`, height: `${height}px` };
    };

    const navigateWeek = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + direction * 7);
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const getCallTypeColor = (type: string) => {
        switch (type) {
            case 'ONBOARDING': return 'var(--status-info)';
            case 'EMERGENCY': return 'var(--status-error)';
            default: return 'var(--accent-primary)';
        }
    };

    return (
        <div className="calendar-page">
            {/* Header */}
            <div className="calendar-header">
                <div className="calendar-header-left">
                    <h1 className="calendar-title">Calendário de Calls</h1>
                    <div className="calendar-nav">
                        <Button variant="ghost" size="sm" onClick={() => navigateWeek(-1)}>
                            <ChevronLeft size={18} />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={goToToday}>
                            Hoje
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => navigateWeek(1)}>
                            <ChevronRight size={18} />
                        </Button>
                        <span className="calendar-current-month">
                            {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentDate)}
                        </span>
                    </div>
                </div>
                <Button variant="primary" icon={<Plus size={18} />} onClick={() => setShowNewCallModal(true)}>
                    Nova Call
                </Button>
            </div>

            {/* Week View */}
            <Card padding="none" className="calendar-card">
                {/* Week Header */}
                <div className="calendar-week-header">
                    <div className="calendar-time-gutter" />
                    {weekDates.map((date, index) => (
                        <div
                            key={index}
                            className={`calendar-day-header ${isToday(date) ? 'today' : ''}`}
                        >
                            <span className="calendar-day-name">{weekDays[date.getDay()]}</span>
                            <span className="calendar-day-number">{date.getDate()}</span>
                        </div>
                    ))}
                </div>

                {/* Week Body */}
                <div className="calendar-week-body">
                    {/* Time Labels */}
                    <div className="calendar-time-gutter">
                        {hours.map(hour => (
                            <div key={hour} className="calendar-time-label">
                                {hour}:00
                            </div>
                        ))}
                    </div>

                    {/* Day Columns */}
                    {weekDates.map((date, dayIndex) => {
                        const dayCalls = getCallsForDate(date);

                        return (
                            <div
                                key={dayIndex}
                                className={`calendar-day-column ${isToday(date) ? 'today' : ''}`}
                            >
                                {/* Hour grid lines */}
                                {hours.map(hour => (
                                    <div key={hour} className="calendar-hour-row" />
                                ))}

                                {/* Calls */}
                                {dayCalls.map(call => (
                                    <div
                                        key={call.id}
                                        className="calendar-call"
                                        style={{
                                            ...getCallStyle(call),
                                            backgroundColor: getCallTypeColor(call.type),
                                        }}
                                        onClick={() => toast.info('Detalhes da call', `${mockMentees[call.menteeId]?.name} - ${formatTime(call.scheduledAt)}`)}
                                    >
                                        <span className="calendar-call-time">{formatTime(call.scheduledAt)}</span>
                                        <span className="calendar-call-name">{mockMentees[call.menteeId]?.name}</span>
                                        <span className="calendar-call-duration">{call.durationMinutes}min</span>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Upcoming Calls */}
            <div className="upcoming-calls">
                <h2 className="upcoming-title">Próximas Calls</h2>
                <div className="upcoming-list">
                    {mockCalls.slice(0, 3).map(call => (
                        <Card key={call.id} variant="interactive" padding="md" className="upcoming-card">
                            <div className="upcoming-info">
                                <div className="upcoming-avatar">
                                    {mockMentees[call.menteeId]?.name.charAt(0)}
                                </div>
                                <div className="upcoming-details">
                                    <span className="upcoming-name">{mockMentees[call.menteeId]?.name}</span>
                                    <span className="upcoming-time">
                                        <Clock size={12} />
                                        {new Intl.DateTimeFormat('pt-BR', {
                                            weekday: 'short',
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        }).format(call.scheduledAt)}
                                    </span>
                                </div>
                            </div>
                            <div className="upcoming-actions">
                                {call.type === 'ONBOARDING' && (
                                    <Badge variant="info" size="sm">Onboarding</Badge>
                                )}
                                <Button variant="primary" size="sm" icon={<Video size={14} />}>
                                    Entrar
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* New Call Modal */}
            <Modal
                isOpen={showNewCallModal}
                onClose={() => setShowNewCallModal(false)}
                title="Agendar Nova Call"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowNewCallModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={() => {
                            toast.success('Call agendada!');
                            setShowNewCallModal(false);
                        }}>Agendar</Button>
                    </>
                }
            >
                <div className="modal-form">
                    <div className="form-field">
                        <label>Mentorado</label>
                        <select>
                            <option value="">Selecione um mentorado</option>
                            <option value="m1">Carlos Lima</option>
                            <option value="m2">Ana Oliveira</option>
                        </select>
                    </div>
                    <div className="form-field">
                        <label>Data e Hora</label>
                        <input type="datetime-local" />
                    </div>
                    <div className="form-field">
                        <label>Duração</label>
                        <select>
                            <option value="30">30 minutos</option>
                            <option value="60">60 minutos</option>
                            <option value="90">90 minutos</option>
                        </select>
                    </div>
                    <div className="form-field">
                        <label>Tipo</label>
                        <select>
                            <option value="REGULAR">Regular</option>
                            <option value="ONBOARDING">Onboarding</option>
                            <option value="EMERGENCY">Emergência</option>
                        </select>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CalendarPage;
