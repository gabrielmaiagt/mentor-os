import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, orderBy, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
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
import { MENTEE_STAGES, getStageConfig, DEFAULT_ONBOARDING_TEMPLATE } from '../../types';
// mockTemplates removed
import type { Mentee, MenteeStage, Call, Task, OfferMined, OfferStatus, OnboardingProgress } from '../../types';
import { calculateLevel, calculateNextLevelXp, calculateProgressToNextLevel, addXp } from '../../lib/gamification';
import { BadgesList } from '../../components/gamification/BadgesList';
import { MenteeRanking } from '../../components/gamification/MenteeRanking';
import { Zap, Trophy, Medal } from 'lucide-react';
import './MenteeProfile.css';

// Mining Helper
const calculateMiningSummary = (offers: OfferMined[]) => {
    const totalAds = offers.reduce((acc, o) => acc + (o.adCount || 0), 0);
    const topOffer = [...offers].sort((a, b) => (b.adCount || 0) - (a.adCount || 0))[0];
    return {
        offersTotal: offers.length,
        adsTotal: totalAds,
        byStatus: {
            TESTING: offers.filter(o => o.status === 'TESTING').length,
            SCALING: offers.filter(o => o.status === 'SCALING').length,
            STOPPED: offers.filter(o => o.status === 'STOPPED').length
        },
        topOffer
    };
};

// Updated stage journey to include MINING
const stageJourney: MenteeStage[] = ['ONBOARDING', 'MINING', 'OFFER', 'CREATIVES', 'TRAFFIC', 'OPTIMIZATION', 'SCALING'];

type TabType = 'overview' | 'onboarding' | 'mining' | 'calls' | 'tasks' | 'achievements' | 'ranking';

export const MenteeProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const toast = useToast();

    const [mentee, setMentee] = useState<Mentee | null>(null);
    const [loading, setLoading] = useState(true);
    const [menteeCalls, setMenteeCalls] = useState<Call[]>([]);
    const [menteeTasks, setMenteeTasks] = useState<Task[]>([]);

    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showCallModal, setShowCallModal] = useState(false);

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        whatsapp: '',
        email: '',
        plan: ''
    });

    // Fetch Mentee Data
    useEffect(() => {
        if (!id) return;
        const unsubscribe = onSnapshot(doc(db, 'mentees', id), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setMentee({
                    id: docSnap.id,
                    ...data,
                    startAt: data.startAt?.toDate() || new Date(),
                    lastUpdateAt: data.lastUpdateAt?.toDate() || new Date(),
                    nextCallAt: data.nextCallAt?.toDate(),
                    createdAt: data.createdAt?.toDate(),
                    updatedAt: data.updatedAt?.toDate(),
                } as Mentee);
            } else {
                toast.error("Mentorado não encontrado");
                navigate('/mentees');
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [id, navigate]);

    // Fetch Calls
    useEffect(() => {
        if (!id) return;
        const q = query(collection(db, 'calls'), where('menteeId', '==', id), orderBy('scheduledAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMenteeCalls(snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                scheduledAt: d.data().scheduledAt?.toDate(),
                createdAt: d.data().createdAt?.toDate(),
            })) as Call[]);
        });
        return () => unsubscribe();
    }, [id]);

    // Fetch Tasks
    useEffect(() => {
        if (!id) return;
        const q = query(collection(db, 'tasks'), where('ownerId', '==', id), orderBy('dueDate', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMenteeTasks(snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                dueDate: d.data().dueDate?.toDate(),
                createdAt: d.data().createdAt?.toDate(),
            })) as Task[]);
        });
        return () => unsubscribe();
    }, [id]);

    // New Task State
    // New Task State
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0]
    });

    // Templates State
    const [templates, setTemplates] = useState<any[]>([]);

    useEffect(() => {
        const q = query(collection(db, 'templates'), orderBy('title', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTemplates(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, []);

    const handleTemplateSelect = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setNewTask({
                ...newTask,
                title: template.title,
                description: template.content || template.description || ''
            });
        }
    };

    // Onboarding Data (Mock retrieval)
    const onboardingProgress: OnboardingProgress | null = useMemo(() => {
        if (!mentee) return null;
        // In a real app, this would come from the API/Database
        const saved = localStorage.getItem(`onboarding_${mentee.id}`);
        return saved ? JSON.parse(saved) : null;
    }, [mentee]);

    // Mining state
    const [offers, setOffers] = useState<OfferMined[]>([]);
    const miningSummary = useMemo(() => calculateMiningSummary(offers), [offers]);

    if (loading || !mentee) return <div className="p-8 text-center">Carregando perfil...</div>;

    const currentStageIndex = stageJourney.indexOf(mentee.currentStage);
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

    const handleSaveMentee = async () => {
        if (!mentee || !id) return;
        try {
            await updateDoc(doc(db, 'mentees', id), {
                name: editFormData.name,
                whatsapp: editFormData.whatsapp,
                email: editFormData.email,
                plan: editFormData.plan,
                updatedAt: new Date()
            });
            toast.success('Perfil atualizado com sucesso!');
            setShowEditModal(false);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao atualizar perfil');
        }
    };

    const handleSendNotification = async (title: string, message: string, type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' = 'INFO') => {
        if (!mentee?.userId) {
            toast.error('Erro', 'Mentorado não possui usuário vinculado.');
            return;
        }
        try {
            await addDoc(collection(db, 'notifications'), {
                userId: mentee.userId,
                title,
                message,
                type,
                read: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            toast.success('Notificação enviada!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao enviar notificação');
        }
    };

    const openEditModal = () => {
        if (mentee) {
            setEditFormData({
                name: mentee.name || '',
                whatsapp: mentee.whatsapp || '',
                email: mentee.email || '',
                plan: mentee.plan || ''
            });
            setShowEditModal(true);
        }
    };

    const daysSinceUpdate = getDaysSince(mentee.lastUpdateAt);

    return (
        <div className="mentee-profile-page">
            {/* Header */}
            <div className="page-header">
                <Button variant="ghost" icon={<ArrowLeft size={20} />} onClick={() => navigate('/mentees')}>
                    Voltar
                </Button>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit size={16} />}
                        onClick={openEditModal}
                    >
                        Editar
                    </Button>
                    {/* Test Notification Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<AlertTriangle size={16} />}
                        onClick={() => handleSendNotification('Teste de Notificação', 'Esta é uma notificação de teste enviada pelo mentor.', 'INFO')}
                    >
                        Testar Notificação
                    </Button>
                </div>
            </div>

            <div className="profile-header-card">
                {/* ... existing header content ... */}
            </div>

            {/* Main Info with Gamification */}
            <div className="mentee-profile-main">
                <div className="mentee-avatar-section">
                    <div className="mentee-avatar-lg">
                        {mentee.name.charAt(0).toUpperCase()}
                        <div className="level-badge">
                            {calculateLevel(mentee.xp || 0)}
                        </div>
                    </div>
                </div>

                <div className="mentee-info">
                    <div className="mentee-name-row">
                        <h1 className="mentee-name">{mentee.name}</h1>
                        {mentee.blocked && (
                            <Badge variant="error" pulse>
                                <AlertTriangle size={12} /> TRAVADO
                            </Badge>
                        )}
                        <Badge variant="default" className="xp-badge">
                            <Zap size={12} className="text-warning fill-warning" />
                            {mentee.xp || 0} XP
                        </Badge>
                    </div>

                    {/* Gamification Bar */}
                    <div className="gamification-bar-container">
                        <div className="flex justify-between text-xs text-secondary mb-1">
                            <span>Nível {calculateLevel(mentee.xp || 0)}</span>
                            <span>Próx: {calculateNextLevelXp(calculateLevel(mentee.xp || 0))} XP</span>
                        </div>
                        <div className="xp-progress-bar">
                            <div
                                className="xp-progress-fill"
                                style={{
                                    width: `${calculateProgressToNextLevel(
                                        mentee.xp || 0,
                                        calculateLevel(mentee.xp || 0),
                                        calculateNextLevelXp(calculateLevel(mentee.xp || 0))
                                    )}%`
                                }}
                            />
                        </div>
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
                    className={`mentee-tab ${activeTab === 'achievements' ? 'active' : ''}`}
                    onClick={() => setActiveTab('achievements')}
                >
                    <Trophy size={14} />
                    Conquistas
                </button>
                <button
                    className={`mentee-tab ${activeTab === 'ranking' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ranking')}
                >
                    <Medal size={14} />
                    Ranking
                </button>
                <button
                    className={`mentee-tab ${activeTab === 'onboarding' ? 'active' : ''}`}
                    onClick={() => setActiveTab('onboarding')}
                >
                    <FileText size={14} />
                    Onboarding
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
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleSendNotification('Atenção: Atualize seu progresso', 'Notamos que você não atualiza seu status há mais de 7 dias. Está tudo bem?', 'WARNING')}
                                >
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
                                    <div
                                        className="resource-item clickable"
                                        onClick={() => window.open('https://ads.google.com/intl/pt-BR_br/home/', '_blank')}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <FileText size={16} />
                                        <span>Módulo 4 - Google Ads Básico</span>
                                        <ChevronRight size={14} />
                                    </div>
                                    <div
                                        className="resource-item clickable"
                                        onClick={() => window.open('https://www.youtube.com/watch?v=example', '_blank')}
                                        style={{ cursor: 'pointer' }}
                                    >
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

            {activeTab === 'onboarding' && (
                <div className="onboarding-tab-content">
                    <Card padding="md">
                        <CardHeader
                            title="Progresso do Onboarding"
                            action={
                                onboardingProgress ? (
                                    <Badge variant="info">
                                        {onboardingProgress.xpEarned} XP Acumulado
                                    </Badge>
                                ) : <Badge variant="warning">Não iniciado</Badge>
                            }
                        />
                        <CardContent>
                            {!onboardingProgress ? (
                                <div className="text-secondary text-center py-8">
                                    O mentorado ainda não iniciou o onboarding.
                                </div>
                            ) : (
                                <div className="onboarding-review-list">
                                    {DEFAULT_ONBOARDING_TEMPLATE.map((step, index) => {
                                        const isCompleted = onboardingProgress.completedSteps.includes(step.id);
                                        const data = onboardingProgress.stepData?.[step.id];

                                        return (
                                            <div key={step.id} className={`onboarding-review-item ${isCompleted ? 'completed' : ''}`}>
                                                <div className="review-header">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`step-number ${isCompleted ? 'bg-success' : 'bg-secondary'}`}>
                                                            {isCompleted ? <CheckCircle size={14} /> : index + 1}
                                                        </div>
                                                        <span className={isCompleted ? 'font-medium' : 'text-secondary'}>
                                                            {step.title}
                                                        </span>
                                                    </div>
                                                    {isCompleted && <Badge variant="success" size="sm">Concluído</Badge>}
                                                </div>

                                                {/* Show Form Data if available */}
                                                {data && step.contentType === 'FORM' && (
                                                    <div className="review-data mt-4 p-4 bg-secondary rounded-md">
                                                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                            <FileText size={14} /> Respostas do Formulário
                                                        </h4>
                                                        <div className="grid gap-4">
                                                            {Object.entries(data).map(([key, value]) => {
                                                                // Find field label if possible
                                                                const field = step.formFields?.find(f => f.name === key);
                                                                const label = field?.label || key;

                                                                // Handle boolean/checkbox
                                                                const displayValue = typeof value === 'boolean'
                                                                    ? (value ? 'Sim' : 'Não')
                                                                    : String(value);

                                                                return (
                                                                    <div key={key} className="review-field">
                                                                        <span className="text-xs text-tertiary block mb-1">{label}</span>
                                                                        <span className="text-sm text-primary font-medium">{displayValue}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
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
                                    <div
                                        key={call.id}
                                        className={`call-item clickable ${call.status === 'SCHEDULED' ? 'scheduled' : ''}`}
                                        onClick={() => toast.info('Detalhes da call', `Call ${call.type.toLowerCase()} - ${call.status}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="call-info">
                                            <span className="call-date">{formatDate(call.scheduledAt)}</span>
                                            <span className="call-duration">{call.durationMinutes}min</span>
                                            <Badge variant={call.status === 'SCHEDULED' ? 'info' : call.status === 'DONE' ? 'success' : 'default'}>
                                                {call.status === 'SCHEDULED' ? 'Agendada' : call.status === 'DONE' ? 'Realizada' : call.status}
                                            </Badge>
                                        </div>
                                        {call.summary && <p className="call-summary">{call.summary}</p>}
                                        {call.recordingUrl && (
                                            <div className="call-recording">
                                                <Play size={12} />
                                                <a href={call.recordingUrl} target="_blank" rel="noopener noreferrer">Ver Gravação</a>
                                            </div>
                                        )}
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
                                        <input
                                            type="checkbox"
                                            checked={task.status === 'DONE'}
                                            onChange={async (e) => {
                                                const newStatus = e.target.checked ? 'DONE' : 'TODO';
                                                try {
                                                    await updateDoc(doc(db, 'tasks', task.id), {
                                                        status: newStatus,
                                                        updatedAt: new Date()
                                                    });

                                                    // XP Trigger: Task Completion (+10 XP)
                                                    if (newStatus === 'DONE' && mentee) {
                                                        const res = await addXp(mentee.id, 10);
                                                        if (res?.levelUp) {
                                                            toast.success('LEVEL UP!', `Parabéns! Você alcançou o nível ${res.newLevel}`);
                                                        } else {
                                                            toast.success('+10 XP', 'Tarefa concluída!');
                                                        }
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    toast.error('Erro ao atualizar tarefa');
                                                }
                                            }}
                                        />
                                        <div className="task-content">
                                            <span className="task-title">{task.title}</span>
                                            {task.dueDate && (
                                                <span className={`task-due ${task.status === 'OVERDUE' ? 'overdue' : ''}`}>
                                                    <Clock size={12} />
                                                    {task.status === 'OVERDUE' ? 'Atrasada' : formatDate(task.dueDate)}
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

            {activeTab === 'achievements' && (
                <div className="achievements-tab-content">
                    <BadgesList earnedBadgeIds={mentee.badges} />
                </div>
            )}

            {activeTab === 'ranking' && (
                <div className="ranking-tab-content">
                    <MenteeRanking />
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
                        <Button variant="primary" onClick={async () => {
                            try {
                                if (!id) return;
                                await addDoc(collection(db, 'tasks'), {
                                    title: newTask.title,
                                    description: newTask.description,
                                    dueDate: new Date(newTask.dueDate),
                                    ownerId: id,
                                    ownerRole: 'MENTEE',
                                    scope: 'DELIVERY',
                                    entityType: 'MENTEE',
                                    entityId: id,
                                    status: 'TODO',
                                    priority: 'MEDIUM',
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                    quickActions: []
                                });
                                toast.success('Tarefa criada!', newTask.title);
                                setShowTaskModal(false);
                                setNewTask({ title: '', description: '', dueDate: new Date().toISOString().split('T')[0] });
                            } catch (e) {
                                console.error(e);
                                toast.error('Erro ao criar tarefa');
                            }
                        }}>Criar</Button>
                    </>
                }
            >
                <div className="modal-form">
                    <div className="form-field">
                        <label>Usar Template (Opcional)</label>
                        <select
                            className="bg-secondary border border-subtle rounded-md px-3 py-2 text-primary outline-none"
                            onChange={(e) => handleTemplateSelect(e.target.value)}
                            defaultValue=""
                        >
                            <option value="" disabled>Selecione um template...</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-field">
                        <label>Título</label>
                        <input
                            type="text"
                            placeholder="O que precisa ser feito?"
                            value={newTask.title}
                            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                        />
                    </div>
                    <div className="form-field">
                        <label>Descrição</label>
                        <textarea
                            rows={3}
                            className="w-full bg-secondary border border-subtle rounded-md px-3 py-2 text-primary outline-none"
                            placeholder="Detalhes da tarefa..."
                            value={newTask.description}
                            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                        />
                    </div>
                    <div className="form-field">
                        <label>Prazo</label>
                        <input
                            type="date"
                            value={newTask.dueDate}
                            onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                        />
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
                    <div className="form-field">
                        <label>Link da Gravação (Loom, YouTube, etc)</label>
                        <input type="url" placeholder="https://..." />
                    </div>
                </div>
            </Modal>

            {/* Edit Mentee Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Editar Mentorado"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowEditModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSaveMentee}>Salvar Alterações</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Nome Completo</label>
                        <input
                            type="text"
                            className="w-full bg-[#111] border border-white/10 rounded p-3 text-white placeholder-zinc-500 focus:border-white/20 transition-all outline-none"
                            value={editFormData.name}
                            onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">WhatsApp</label>
                            <input
                                type="text"
                                className="w-full bg-[#111] border border-white/10 rounded p-3 text-white placeholder-zinc-500 focus:border-white/20 transition-all outline-none"
                                value={editFormData.whatsapp}
                                onChange={e => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Plano</label>
                            <select
                                className="w-full bg-[#111] border border-white/10 rounded p-3 text-white placeholder-zinc-500 focus:border-white/20 transition-all outline-none"
                                value={editFormData.plan}
                                onChange={e => setEditFormData({ ...editFormData, plan: e.target.value })}
                            >
                                <option value="Trimestral">Trimestral</option>
                                <option value="Semestral">Semestral</option>
                                <option value="Anual">Anual</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full bg-[#111] border border-white/10 rounded p-3 text-white placeholder-zinc-500 focus:border-white/20 transition-all outline-none"
                            value={editFormData.email}
                            onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};


export default MenteeProfilePage;
