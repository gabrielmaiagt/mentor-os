import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Phone,
    Mail,
    MessageSquare,
    Calendar,
    Clock,
    Target,
    Edit,
    Plus,
    CheckCircle,
    AlertTriangle,
    ChevronRight,
    FileText,
    Play,
    Search
} from 'lucide-react';
import { Card, CardHeader, CardContent, Badge, Button, Modal } from '../../components/ui';
import { OfferMinedCard } from '../../components/mining';
import { useToast } from '../../components/ui/Toast';
import { MENTEE_STAGES, getStageConfig } from '../../types';
import { mockOffersMined, calculateMiningSummary } from '../../lib/mockMiningData';
import type { Mentee, MenteeStage, Call, Task, OfferMined, OfferStatus } from '../../types';
import './MenteeProfile.css';

// Mock data - all mentees for lookup by ID
const allMentees: Record<string, Mentee> = {
    'm1': {
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
        nextCallAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    },
    'm2': {
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
    'm3': {
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
    'm4': {
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
};

const mockCalls: Call[] = [
    {
        id: 'c1',
        menteeId: 'm1',
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        durationMinutes: 60,
        type: 'REGULAR',
        status: 'SCHEDULED',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 'c2',
        menteeId: 'm1',
        scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        durationMinutes: 45,
        type: 'REGULAR',
        status: 'DONE',
        summary: 'Revisamos configuração de campanhas. Carlos está com dificuldade no público.',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 'c3',
        menteeId: 'm4',
        scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        durationMinutes: 60,
        type: 'REGULAR',
        status: 'SCHEDULED',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

const mockTasks: Task[] = [
    {
        id: 't1',
        title: 'Criar campanha de teste no Google Ads',
        description: 'Seguir o passo-a-passo do módulo 4',
        dueAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        status: 'OVERDUE',
        ownerId: 'm1',
        ownerRole: 'MENTEE',
        scope: 'DELIVERY',
        entityType: 'MENTEE',
        entityId: 'm1',
        priority: 'HIGH',
        quickActions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 't2',
        title: 'Definir público-alvo',
        dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'TODO',
        ownerId: 'm1',
        ownerRole: 'MENTEE',
        scope: 'DELIVERY',
        entityType: 'MENTEE',
        entityId: 'm1',
        priority: 'MEDIUM',
        quickActions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

// Updated stage journey to include MINING
const stageJourney: MenteeStage[] = ['ONBOARDING', 'MINING', 'OFFER', 'CREATIVES', 'TRAFFIC', 'OPTIMIZATION', 'SCALING'];

type TabType = 'overview' | 'mining' | 'calls' | 'tasks';

export const MenteeProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();

    // Get mentee by ID from URL param
    const mentee = allMentees[id || 'm1'] || allMentees['m1'];

    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showCallModal, setShowCallModal] = useState(false);

    // Mining state
    const [offers, setOffers] = useState<OfferMined[]>(mockOffersMined);
    const miningSummary = useMemo(() => calculateMiningSummary(offers), [offers]);

    const currentStageIndex = stageJourney.indexOf(mentee.currentStage);
    const menteeCalls = mockCalls.filter(c => c.menteeId === mentee.id);
    const menteeTasks = mockTasks.filter(t => t.ownerId === mentee.id);
    const isMiningStage = mentee.currentStage === 'MINING';

    const getDaysSince = (date?: Date) => {
        if (!date) return null;
        return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const handleIncrementAds = (offerId: string) => {
        setOffers(prev => prev.map(o =>
            o.id === offerId
                ? { ...o, adCount: o.adCount + 1, lastTouchedAt: new Date() }
                : o
        ));
        toast.success('+1 anúncio registrado!');
    };

    const handleChangeStatus = (offerId: string, status: OfferStatus) => {
        setOffers(prev => prev.map(o =>
            o.id === offerId
                ? { ...o, status, lastTouchedAt: new Date() }
                : o
        ));
        toast.success(`Status atualizado!`);
    };

    const handleEditOffer = (offer: OfferMined) => {
        toast.info('Edição', `Editando: ${offer.name}`);
    };

    const handleCreateTask = (offer: OfferMined) => {
        toast.success('Tarefa criada!', `Testar oferta: ${offer.name}`);
    };

    const daysSinceUpdate = getDaysSince(mentee.lastUpdateAt);

    return (
        <div className="mentee-profile">
            {/* Header */}
            <div className="mentee-profile-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                    Voltar
                </button>

                <div className="mentee-profile-actions">
                    <Button variant="ghost" size="sm" icon={<Edit size={16} />}>
                        Editar
                    </Button>
                </div>
            </div>

            {/* Main Info */}
            <div className="mentee-profile-main">
                <div className="mentee-avatar-lg">
                    {mentee.name.charAt(0).toUpperCase()}
                </div>
                <div className="mentee-info">
                    <div className="mentee-name-row">
                        <h1 className="mentee-name">{mentee.name}</h1>
                        {mentee.blocked && (
                            <Badge variant="error" pulse>
                                <AlertTriangle size={12} /> TRAVADO
                            </Badge>
                        )}
                    </div>
                    <div className="mentee-meta">
                        <span className="mentee-plan">{mentee.plan}</span>
                        <span className="mentee-start">
                            Início: {new Intl.DateTimeFormat('pt-BR').format(mentee.startAt)}
                        </span>
                    </div>
                    <div className="mentee-contacts">
                        <a href={`https://wa.me/55${mentee.whatsapp}`} target="_blank" rel="noopener noreferrer" className="mentee-contact">
                            <Phone size={14} /> {mentee.whatsapp}
                        </a>
                        {mentee.email && (
                            <a href={`mailto:${mentee.email}`} className="mentee-contact">
                                <Mail size={14} /> {mentee.email}
                            </a>
                        )}
                    </div>
                </div>
                <div className="mentee-quick-actions">
                    <Button
                        variant="primary"
                        icon={<MessageSquare size={16} />}
                        onClick={() => window.open(`https://wa.me/55${mentee.whatsapp}`, '_blank')}
                    >
                        WhatsApp
                    </Button>
                    <Button
                        variant="secondary"
                        icon={<Calendar size={16} />}
                        onClick={() => setShowCallModal(true)}
                    >
                        Agendar Call
                    </Button>
                </div>
            </div>

            {/* Stage Journey */}
            <Card padding="md" className="stage-journey-card">
                <div className="stage-journey">
                    {stageJourney.map((stage, index) => {
                        const config = getStageConfig(MENTEE_STAGES, stage);
                        const isCompleted = index < currentStageIndex;
                        const isCurrent = stage === mentee.currentStage;

                        return (
                            <React.Fragment key={stage}>
                                <div className={`stage-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                                    <div
                                        className="stage-step-dot"
                                        style={{
                                            backgroundColor: isCompleted || isCurrent ? config?.color : 'var(--border-medium)',
                                            borderColor: isCurrent ? config?.color : 'transparent'
                                        }}
                                    >
                                        {isCompleted && <CheckCircle size={12} />}
                                    </div>
                                    <span className="stage-step-label">{config?.label}</span>
                                    {isCurrent && (
                                        <div className="stage-step-progress">
                                            <div
                                                className="stage-step-progress-fill"
                                                style={{ width: `${mentee.stageProgress}%`, backgroundColor: config?.color }}
                                            />
                                        </div>
                                    )}
                                </div>
                                {index < stageJourney.length - 1 && (
                                    <div className={`stage-connector ${isCompleted ? 'completed' : ''}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </Card>

            {/* Tabs */}
            <div className="mentee-tabs">
                <button
                    className={`mentee-tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Visão Geral
                </button>
                <button
                    className={`mentee-tab ${activeTab === 'mining' ? 'active' : ''} ${isMiningStage ? 'highlight' : ''}`}
                    onClick={() => setActiveTab('mining')}
                >
                    <Search size={14} />
                    Mineração
                    {isMiningStage && <Badge variant="info" size="sm">{miningSummary.offersTotal}</Badge>}
                </button>
                <button
                    className={`mentee-tab ${activeTab === 'calls' ? 'active' : ''}`}
                    onClick={() => setActiveTab('calls')}
                >
                    Calls
                </button>
                <button
                    className={`mentee-tab ${activeTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tasks')}
                >
                    Tarefas
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="mentee-profile-grid">
                    {/* Left Column */}
                    <div className="mentee-profile-left">
                        {/* Status Alert */}
                        {mentee.blocked && (
                            <Card padding="md" variant="urgent" className="status-alert">
                                <div className="status-alert-content">
                                    <AlertTriangle size={24} />
                                    <div>
                                        <h3>Mentorado Travado</h3>
                                        <p>{daysSinceUpdate} dias sem atualização. Última atividade: {formatDate(mentee.lastUpdateAt!)}</p>
                                    </div>
                                </div>
                                <Button variant="primary" size="sm">
                                    Enviar Cobrança
                                </Button>
                            </Card>
                        )}

                        {/* Weekly Goal */}
                        <Card padding="md">
                            <CardHeader
                                title="Meta Semanal"
                                action={<Badge variant="info"><Target size={12} /> Ativa</Badge>}
                            />
                            <CardContent>
                                <p className="weekly-goal-text">{mentee.weeklyGoal}</p>
                            </CardContent>
                        </Card>

                        {/* Quick Stats */}
                        <Card padding="md">
                            <CardHeader title="Métricas" />
                            <CardContent>
                                <div className="mentee-stats">
                                    <div className="stat-item">
                                        <span className="stat-value">{menteeCalls.filter(c => c.status === 'DONE').length}</span>
                                        <span className="stat-label">Calls realizadas</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">{menteeTasks.filter(t => t.status === 'DONE').length}</span>
                                        <span className="stat-label">Tarefas concluídas</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">{getDaysSince(mentee.startAt)}</span>
                                        <span className="stat-label">Dias de mentoria</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column */}
                    <div className="mentee-profile-right">
                        {/* Next Call */}
                        {menteeCalls.filter(c => c.status === 'SCHEDULED').length > 0 && (
                            <Card padding="md" className="next-call-card">
                                <CardHeader title="Próxima Call" />
                                <CardContent>
                                    {menteeCalls.filter(c => c.status === 'SCHEDULED').map(call => (
                                        <div key={call.id} className="next-call">
                                            <div className="next-call-date">
                                                <Calendar size={16} />
                                                {formatDate(call.scheduledAt)}
                                            </div>
                                            <div className="next-call-actions">
                                                <Button variant="primary" size="sm" icon={<Play size={14} />}>
                                                    Iniciar Call
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Resources */}
                        <Card padding="md">
                            <CardHeader title="Materiais Enviados" />
                            <CardContent>
                                <div className="resources-list">
                                    <div className="resource-item">
                                        <FileText size={16} />
                                        <span>Módulo 4 - Google Ads Básico</span>
                                        <ChevronRight size={14} />
                                    </div>
                                    <div className="resource-item">
                                        <Play size={16} />
                                        <span>Vídeo: Configurando primeira campanha</span>
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {activeTab === 'mining' && (
                <div className="mining-tab-content">
                    {/* Mining Stats */}
                    <div className="mining-stats-row">
                        <Card padding="md" className="mining-stat-card">
                            <span className="mining-stat-value">{miningSummary.offersTotal}</span>
                            <span className="mining-stat-label">Ofertas</span>
                        </Card>
                        <Card padding="md" className="mining-stat-card highlight">
                            <span className="mining-stat-value">{miningSummary.adsTotal}</span>
                            <span className="mining-stat-label">Anúncios</span>
                        </Card>
                        <Card padding="md" className="mining-stat-card">
                            <span className="mining-stat-value">{miningSummary.byStatus.TESTING}</span>
                            <span className="mining-stat-label">Testando</span>
                        </Card>
                        {miningSummary.topOffer && (
                            <Card padding="md" className="mining-stat-card top-offer">
                                <span className="mining-stat-label">Top Oferta</span>
                                <span className="mining-stat-value small">{miningSummary.topOffer.name}</span>
                                <span className="mining-stat-extra">{miningSummary.topOffer.adCount} anúncios</span>
                            </Card>
                        )}
                    </div>

                    {/* Offers Grid */}
                    <div className="offers-grid">
                        {offers.map(offer => (
                            <OfferMinedCard
                                key={offer.id}
                                offer={offer}
                                onIncrementAds={handleIncrementAds}
                                onEdit={handleEditOffer}
                                onChangeStatus={handleChangeStatus}
                                showMentorActions
                            />
                        ))}
                    </div>

                    {offers.length === 0 && (
                        <Card padding="lg" className="empty-mining">
                            <Search size={32} />
                            <p>Nenhuma oferta minerada ainda</p>
                            <Button variant="primary" onClick={() => handleCreateTask({ name: 'Nova oferta' } as OfferMined)}>
                                Pedir 3 ofertas hoje
                            </Button>
                        </Card>
                    )}
                </div>
            )}

            {activeTab === 'calls' && (
                <div className="calls-tab-content">
                    <Card padding="md">
                        <CardHeader
                            title="Histórico de Calls"
                            action={<Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowCallModal(true)}>Nova Call</Button>}
                        />
                        <CardContent>
                            <div className="calls-list">
                                {menteeCalls.map(call => (
                                    <div key={call.id} className={`call-item ${call.status === 'SCHEDULED' ? 'scheduled' : ''}`}>
                                        <div className="call-info">
                                            <span className="call-date">{formatDate(call.scheduledAt)}</span>
                                            <span className="call-duration">{call.durationMinutes}min</span>
                                            <Badge variant={call.status === 'SCHEDULED' ? 'info' : call.status === 'DONE' ? 'success' : 'default'}>
                                                {call.status === 'SCHEDULED' ? 'Agendada' : call.status === 'DONE' ? 'Realizada' : call.status}
                                            </Badge>
                                        </div>
                                        {call.summary && <p className="call-summary">{call.summary}</p>}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'tasks' && (
                <div className="tasks-tab-content">
                    <Card padding="md">
                        <CardHeader
                            title="Tarefas"
                            action={<Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setShowTaskModal(true)}>Nova Tarefa</Button>}
                        />
                        <CardContent>
                            <div className="tasks-list">
                                {menteeTasks.map(task => (
                                    <div key={task.id} className={`task-item ${task.status === 'OVERDUE' ? 'overdue' : ''}`}>
                                        <div className="task-checkbox">
                                            <input type="checkbox" checked={task.status === 'DONE'} readOnly />
                                        </div>
                                        <div className="task-content">
                                            <span className="task-title">{task.title}</span>
                                            {task.dueAt && (
                                                <span className={`task-due ${task.status === 'OVERDUE' ? 'overdue' : ''}`}>
                                                    <Clock size={12} />
                                                    {task.status === 'OVERDUE' ? 'Atrasada' : formatDate(task.dueAt)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Task Modal */}
            <Modal
                isOpen={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                title="Nova Tarefa"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowTaskModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={() => {
                            toast.success('Tarefa criada!');
                            setShowTaskModal(false);
                        }}>Criar</Button>
                    </>
                }
            >
                <div className="modal-form">
                    <div className="form-field">
                        <label>Título</label>
                        <input type="text" placeholder="O que precisa ser feito?" />
                    </div>
                    <div className="form-field">
                        <label>Prazo</label>
                        <input type="date" />
                    </div>
                </div>
            </Modal>

            {/* Call Modal */}
            <Modal
                isOpen={showCallModal}
                onClose={() => setShowCallModal(false)}
                title="Agendar Call"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowCallModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={() => {
                            toast.success('Call agendada!');
                            setShowCallModal(false);
                        }}>Agendar</Button>
                    </>
                }
            >
                <div className="modal-form">
                    <div className="form-field">
                        <label>Data e Hora</label>
                        <input type="datetime-local" />
                    </div>
                    <div className="form-field">
                        <label>Duração</label>
                        <select defaultValue="60">
                            <option value="30">30 minutos</option>
                            <option value="60">60 minutos</option>
                            <option value="90">90 minutos</option>
                        </select>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MenteeProfilePage;
