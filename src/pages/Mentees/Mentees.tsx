import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Calendar,
    Clock,
    AlertTriangle,
    MessageSquare,
    Trash2,
    CreditCard
} from 'lucide-react';
import { Card, Badge, Button } from '../../components/ui';
import { MENTEE_STAGES, getStageConfig } from '../../types';
import type { Mentee, MenteeStage } from '../../types';
import { AddMenteeModal } from './AddMenteeModal';
import { useToast } from '../../components/ui/Toast';
import './Mentees.css';

// ... (mockMiningSummaries remains same)

// Mock data (kept as initial state source)
const initialMentees: Mentee[] = [
    // ... (mock data content)
    {
        id: 'm1',
        name: 'Carlos Lima',
        whatsapp: '11965432109',
        email: 'carlos@email.com',
        plan: '6 meses',
        startAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        currentStage: 'TRAFFIC',
        stageProgress: 60,
        weeklyGoal: 'Configurar campanhas no Google Ads',
        blocked: true,
        lastUpdateAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        nextCallAt: undefined,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
    {
        id: 'm2',
        name: 'Ana Oliveira',
        whatsapp: '11976543210',
        email: 'ana@email.com',
        plan: '6 meses',
        startAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        currentStage: 'OFFER',
        stageProgress: 80,
        weeklyGoal: 'Finalizar copy da oferta',
        blocked: false,
        lastUpdateAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        nextCallAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
        id: 'm3',
        name: 'Roberto Silva',
        whatsapp: '11954321098',
        email: 'roberto@email.com',
        plan: '3 meses',
        startAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        currentStage: 'ONBOARDING',
        stageProgress: 40,
        weeklyGoal: 'Completar diagnóstico inicial',
        blocked: false,
        lastUpdateAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        nextCallAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
        id: 'm4',
        name: 'Fernanda Souza',
        whatsapp: '11912345678',
        email: 'fernanda@email.com',
        plan: '6 meses',
        startAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        currentStage: 'MINING',
        stageProgress: 50,
        weeklyGoal: 'Minerar 10 ofertas com mais de 10 anúncios',
        blocked: false,
        lastUpdateAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        nextCallAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
];

export const MenteesPage: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStage, setFilterStage] = useState<MenteeStage | 'ALL'>('ALL');
    const [mentees, setMentees] = useState<Mentee[]>(initialMentees);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSaveMentee = (newMenteeData: Partial<Mentee>) => {
        const newMentee: Mentee = {
            ...newMenteeData as Mentee,
            id: `m${Date.now()}`,
        };

        setMentees(prev => [newMentee, ...prev]);
        toast.success('Mentorado cadastrado com sucesso!');
    };

    const filteredMentees = mentees.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStage = filterStage === 'ALL' || m.currentStage === filterStage;
        return matchesSearch && matchesStage;
    });

    const getDaysSince = (date?: Date) => {
        if (!date) return null;
        return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    };

    const formatNextCall = (date?: Date) => {
        if (!date) return null;
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (hours < 0) return 'Atrasada';
        if (hours < 24) return `Hoje`;
        if (days === 1) return 'Amanhã';
        return `Em ${days} dias`;
    };

    return (
        <div className="mentees">
            {/* Header */}
            <div className="mentees-header">
                <div>
                    <h1 className="mentees-title">Mentorados</h1>
                    <p className="mentees-subtitle">{mentees.length} mentorado{mentees.length !== 1 ? 's' : ''} ativos</p>
                </div>
                <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
                    Novo Mentorado
                </Button>
            </div>

            {/* Filters */}
            <div className="mentees-filters">
                <div className="mentees-search">
                    <Search size={18} className="mentees-search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mentees-search-input"
                    />
                </div>

                <div className="mentees-stage-filters">
                    <button
                        className={`stage-filter ${filterStage === 'ALL' ? 'active' : ''}`}
                        onClick={() => setFilterStage('ALL')}
                    >
                        Todos
                    </button>
                    {MENTEE_STAGES.map(stage => (
                        <button
                            key={stage.key}
                            className={`stage-filter ${filterStage === stage.key ? 'active' : ''}`}
                            onClick={() => setFilterStage(stage.key as MenteeStage)}
                        >
                            <span
                                className="stage-indicator"
                                style={{ backgroundColor: stage.color }}
                            />
                            {stage.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="mentees-grid">
                {filteredMentees.map(mentee => {
                    const stageConfig = getStageConfig(MENTEE_STAGES, mentee.currentStage);
                    const daysSinceUpdate = getDaysSince(mentee.lastUpdateAt);
                    const nextCall = formatNextCall(mentee.nextCallAt);

                    return (
                        <Card
                            key={mentee.id}
                            variant="interactive"
                            padding="md"
                            className={`mentee-card ${mentee.blocked ? 'mentee-blocked' : ''}`}
                            onClick={() => navigate(`/mentee/${mentee.id}`)}
                        >
                            {/* Header */}
                            <div className="mentee-card-header">
                                <div className="mentee-avatar">
                                    {mentee.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="mentee-info">
                                    <h3 className="mentee-name">{mentee.name}</h3>
                                    <span className="mentee-plan">{mentee.plan}</span>
                                </div>
                                {mentee.blocked && (
                                    <Badge variant="error" pulse>
                                        <AlertTriangle size={12} /> Travado
                                    </Badge>
                                )}
                            </div>

                            {/* Stage Progress */}
                            <div className="mentee-stage">
                                <div className="mentee-stage-header">
                                    <span
                                        className="mentee-stage-name"
                                        style={{ color: stageConfig?.color }}
                                    >
                                        {stageConfig?.label}
                                    </span>
                                    <span className="mentee-stage-progress">{mentee.stageProgress}%</span>
                                </div>
                                <div className="mentee-progress-bar">
                                    <div
                                        className="mentee-progress-fill"
                                        style={{
                                            width: `${mentee.stageProgress}%`,
                                            backgroundColor: stageConfig?.color
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Meta Info */}
                            <div className="mentee-meta">
                                <div className="mentee-meta-item">
                                    <Clock size={14} />
                                    <span className={daysSinceUpdate && daysSinceUpdate > 5 ? 'text-error' : ''}>
                                        {daysSinceUpdate !== null ? `${daysSinceUpdate}d desde update` : 'Sem updates'}
                                    </span>
                                </div>
                                {nextCall && (
                                    <div className="mentee-meta-item">
                                        <Calendar size={14} />
                                        <span className={nextCall === 'Atrasada' ? 'text-error' : ''}>
                                            Call: {nextCall}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="mentee-actions">
                                <span className="text-xs text-secondary flex items-center gap-1 mr-auto">
                                    <CreditCard size={12} />
                                    {Math.random() > 0.5 ? 'Pix' : 'Cartão'}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<MessageSquare size={14} />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`https://wa.me/55${mentee.whatsapp}`, '_blank');
                                    }}
                                >
                                    WhatsApp
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-error hover:bg-error-light"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Tem certeza que deseja remover este mentorado?')) {
                                            setMentees(prev => prev.filter(m => m.id !== mentee.id));
                                            toast.success('Mentorado removido');
                                        }
                                    }}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {filteredMentees.length === 0 && (
                <div className="mentees-empty">
                    <p>Nenhum mentorado encontrado</p>
                </div>
            )}

            <AddMenteeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveMentee}
            />
        </div>
    );
};

export default MenteesPage;
