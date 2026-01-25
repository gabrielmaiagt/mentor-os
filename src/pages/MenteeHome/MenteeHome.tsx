import React, { useState } from 'react';
import {
    Target,
    Calendar,
    CheckSquare,
    MessageSquare,
    Search,
    TrendingUp,
    Plus,
    Filter,
    ArrowUpDown
} from 'lucide-react';
import { Card, Badge, Button, Modal } from '../../components/ui';
import { OfferMinedCard } from '../../components/mining';
import { OnboardingChecklist, TourGuide } from '../../components/onboarding';
import { useToast } from '../../components/ui/Toast';
import { MENTEE_STAGES, getStageConfig, OFFER_PLATFORMS, DEFAULT_ONBOARDING_TEMPLATE, FIRST_LOGIN_TOUR } from '../../types';
import { mockOffersMined, calculateMiningSummary } from '../../lib/mockMiningData';
import type { OfferMined, OfferStatus, MenteeStage, OfferPlatform, OnboardingProgress } from '../../types';
import './MenteeHome.css';

// Mock mentee data (would come from context/auth in real app)
const mockCurrentMentee = {
    id: 'm1',
    name: 'Carlos Lima',
    currentStage: 'ONBOARDING' as MenteeStage, // Set to ONBOARDING to show checklist
    stageProgress: 40,
    weeklyGoal: 'Completar o onboarding da mentoria',
    nextCallAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
};

// Mock onboarding progress
const mockOnboardingProgress: OnboardingProgress = {
    menteeId: 'm1',
    templateId: 'default',
    currentStepIndex: 1,
    completedSteps: ['ob1'], // First step already done
    skippedSteps: [],
    stepData: {},
    xpEarned: 50,
    startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    lastActivityAt: new Date(),
};

export const MenteeHomePage: React.FC = () => {
    const toast = useToast();
    const [mentee] = useState(mockCurrentMentee);
    const [offers, setOffers] = useState<OfferMined[]>(mockOffersMined);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingOffer, setEditingOffer] = useState<OfferMined | null>(null);
    const [filterStatus, setFilterStatus] = useState<OfferStatus | 'ALL'>('ALL');
    const [sortBy, setSortBy] = useState<'adCount' | 'lastTouchedAt'>('adCount');

    // Onboarding state - Initialize from localStorage if available
    const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress>(() => {
        const saved = localStorage.getItem(`onboarding_m1`); // Usando id mock m1
        return saved ? JSON.parse(saved) : mockOnboardingProgress;
    });
    const [isTourOpen, setIsTourOpen] = useState(false);


    // Quick Actions Modals
    const [showTasksModal, setShowTasksModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    // History Update Modal state
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [updatingHistoryOffer, setUpdatingHistoryOffer] = useState<OfferMined | null>(null);
    const [historyFormData, setHistoryFormData] = useState({
        count: 0,
        date: new Date().toISOString().split('T')[0]
    });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        adCount: 1,
        platform: 'META' as OfferPlatform,
        angles: '', // Palavras-chave como string separada por vírgula no formulário
        notes: '',
    });

    // Save onboarding to localStorage whenever it changes
    React.useEffect(() => {
        localStorage.setItem(`onboarding_m1`, JSON.stringify(onboardingProgress));
    }, [onboardingProgress]);

    const stageConfig = getStageConfig(MENTEE_STAGES, mentee.currentStage);
    const summary = calculateMiningSummary(offers);
    const isOnboarding = mentee.currentStage === 'ONBOARDING';

    // Onboarding handlers
    const handleCompleteStep = (stepId: string, data?: Record<string, any>) => {
        // Special trigger for Tour step
        if (stepId === 'ob5') {
            setIsTourOpen(true);
            return;
        }

        const step = DEFAULT_ONBOARDING_TEMPLATE.find(s => s.id === stepId);
        setOnboardingProgress(prev => ({
            ...prev,
            completedSteps: [...prev.completedSteps, stepId],
            stepData: data ? { ...prev.stepData, [stepId]: data } : prev.stepData,
            xpEarned: prev.xpEarned + (step?.xpReward || 0),
            lastActivityAt: new Date(),
        }));
    };

    const handleSkipStep = (stepId: string) => {
        setOnboardingProgress(prev => ({
            ...prev,
            skippedSteps: [...prev.skippedSteps, stepId],
            lastActivityAt: new Date(),
        }));
        toast.info('Passo pulado', 'Você pode completar depois');
    };

    const handleTourComplete = () => {
        setIsTourOpen(false);
        // Complete the tour step (ob5)
        const step = DEFAULT_ONBOARDING_TEMPLATE.find(s => s.id === 'ob5');
        setOnboardingProgress(prev => ({
            ...prev,
            completedSteps: [...prev.completedSteps, 'ob5'],
            xpEarned: prev.xpEarned + (step?.xpReward || 0),
            lastActivityAt: new Date(),
        }));
        toast.success('Tour concluído!', '+75 XP');
    };



    // Filter and sort offers
    const filteredOffers = offers
        .filter(o => filterStatus === 'ALL' || o.status === filterStatus)
        .sort((a, b) => {
            if (sortBy === 'adCount') return b.adCount - a.adCount;
            return b.lastTouchedAt.getTime() - a.lastTouchedAt.getTime();
        });

    const handleOpenHistoryModal = (offer: OfferMined) => {
        setUpdatingHistoryOffer(offer);
        setHistoryFormData({
            count: offer.adCount,
            date: new Date().toISOString().split('T')[0]
        });
        setShowHistoryModal(true);
    };

    const handleUpdateAdHistory = () => {
        if (!updatingHistoryOffer) return;

        setOffers(prev => prev.map(o => {
            if (o.id === updatingHistoryOffer.id) {
                const newAdHistory = [...(o.adHistory || [])];
                const existingIndex = newAdHistory.findIndex(h => h.date === historyFormData.date);

                if (existingIndex >= 0) {
                    newAdHistory[existingIndex] = { ...newAdHistory[existingIndex], count: historyFormData.count };
                } else {
                    newAdHistory.push({ date: historyFormData.date, count: historyFormData.count });
                    // Sort by date
                    newAdHistory.sort((a, b) => a.date.localeCompare(b.date));
                }

                // If updating today or a future date, or if it's the latest entry, update adCount
                const isLatest = newAdHistory[newAdHistory.length - 1].date === historyFormData.date;

                return {
                    ...o,
                    adCount: isLatest ? historyFormData.count : o.adCount,
                    adHistory: newAdHistory,
                    lastTouchedAt: new Date()
                };
            }
            return o;
        }));

        setShowHistoryModal(false);
        setUpdatingHistoryOffer(null);
        toast.success('Métrica atualizada!');
    };

    const handleChangeStatus = (offerId: string, status: OfferStatus) => {
        setOffers(prev => prev.map(o =>
            o.id === offerId
                ? { ...o, status, lastTouchedAt: new Date() }
                : o
        ));
        toast.success(`Oferta marcada como ${status === 'TESTING' ? 'em teste' : status === 'WINNER' ? 'vencedora' : 'descartada'}`);
    };

    const handleEdit = (offer: OfferMined) => {
        setEditingOffer(offer);
        setFormData({
            name: offer.name,
            url: offer.url,
            adCount: offer.adCount,
            platform: offer.platform || 'META',
            angles: offer.angles?.join(', ') || '',
            notes: offer.notes || '',
        });
        setShowAddModal(true);
    };

    const handleSaveOffer = () => {
        if (!formData.name || !formData.url) {
            toast.error('Preencha nome e URL');
            return;
        }

        const angleArray = formData.angles.split(',').map(s => s.trim()).filter(Boolean);

        if (editingOffer) {
            // Edit existing
            setOffers(prev => prev.map(o =>
                o.id === editingOffer.id
                    ? {
                        ...o,
                        name: formData.name,
                        url: formData.url,
                        adCount: formData.adCount,
                        platform: formData.platform,
                        angles: angleArray,
                        notes: formData.notes,
                        lastTouchedAt: new Date(),
                        updatedAt: new Date(),
                    }
                    : o
            ));
            toast.success('Oferta atualizada!');
        } else {
            // Create new
            const today = new Date().toISOString().split('T')[0];
            const newOffer: OfferMined = {
                id: `om${Date.now()}`,
                name: formData.name,
                url: formData.url,
                adCount: formData.adCount,
                platform: formData.platform,
                angles: angleArray,
                notes: formData.notes,
                status: 'CANDIDATE',
                adHistory: [{ date: today, count: formData.adCount }],
                createdAt: new Date(),
                updatedAt: new Date(),
                lastTouchedAt: new Date(),
                createdByUserId: mentee.id,
            };
            setOffers(prev => [newOffer, ...prev]);
            toast.success('Oferta cadastrada!');
        }

        setShowAddModal(false);
        setEditingOffer(null);
        setFormData({ name: '', url: '', adCount: 1, platform: 'META', angles: '', notes: '' });
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <div className="mentee-home">
            {/* Header */}
            <div className="mentee-home-header">
                <div>
                    <h1 className="mentee-home-title">Olá, {mentee.name.split(' ')[0]}!</h1>
                    <p className="mentee-home-subtitle">Sua jornada de mentoria</p>
                </div>
                <Badge
                    variant="info"
                    style={{ backgroundColor: stageConfig?.color }}
                >
                    Etapa: {stageConfig?.label}
                </Badge>
            </div>

            {/* Stage Progress */}
            <Card padding="md" className="stage-progress-card">
                <div className="stage-progress-header">
                    <div className="stage-progress-info">
                        <TrendingUp size={20} />
                        <span>Progresso na etapa</span>
                    </div>
                    <span className="stage-progress-percent">{mentee.stageProgress}%</span>
                </div>
                <div className="stage-progress-bar">
                    <div
                        className="stage-progress-fill"
                        style={{ width: `${mentee.stageProgress}%`, backgroundColor: stageConfig?.color }}
                    />
                </div>
                {mentee.weeklyGoal && (
                    <div className="weekly-goal">
                        <Target size={16} />
                        <span>Meta semanal: {mentee.weeklyGoal}</span>
                    </div>
                )}
            </Card>

            {/* Quick Actions */}
            <div className="quick-actions-row">
                <Card padding="md" className="quick-action-card">
                    <Calendar size={20} />
                    <div>
                        <span className="quick-action-label">Próxima Call</span>
                        <span className="quick-action-value">{formatDate(mentee.nextCallAt!)}</span>
                    </div>
                </Card>
                <Card padding="md" className="quick-action-card clickable" onClick={() => setShowTasksModal(true)}>
                    <CheckSquare size={20} />
                    <div>
                        <span className="quick-action-label">Tarefas</span>
                        <span className="quick-action-value">3 pendentes</span>
                    </div>
                </Card>
                <Card padding="md" className="quick-action-card clickable" onClick={() => setShowUpdateModal(true)}>
                    <MessageSquare size={20} />
                    <div>
                        <span className="quick-action-label">Enviar Update</span>
                        <span className="quick-action-value">Semanal</span>
                    </div>
                </Card>
            </div>

            {/* Onboarding Checklist - Only visible in ONBOARDING stage */}
            {isOnboarding && (
                <OnboardingChecklist
                    steps={DEFAULT_ONBOARDING_TEMPLATE}
                    progress={onboardingProgress}
                    onCompleteStep={handleCompleteStep}
                    onSkipStep={handleSkipStep}
                />
            )}

            {/* Mining Section — Always visible */}
            <div className="mining-section">
                <div className="mining-header">
                    <div>
                        <h2 className="mining-title">
                            <Search size={20} />
                            Mineração — Minhas Ofertas
                        </h2>
                        <p className="mining-subtitle">Cadastre ofertas que você está minerando</p>
                    </div>
                    <Button
                        variant="primary"
                        icon={<Plus size={16} />}
                        onClick={() => {
                            setEditingOffer(null);
                            setFormData({ name: '', url: '', adCount: 1, platform: 'META', angles: '', notes: '' });
                            setShowAddModal(true);
                        }}
                    >
                        Adicionar Oferta
                    </Button>
                </div>

                {/* Mining Stats */}
                <div className="mining-stats">
                    <div className="mining-stat">
                        <span className="mining-stat-value">{summary.offersTotal}</span>
                        <span className="mining-stat-label">Ofertas mineradas</span>
                    </div>
                    <div className="mining-stat highlight">
                        <span className="mining-stat-value">{summary.adsTotal}</span>
                        <span className="mining-stat-label">Total de anúncios</span>
                    </div>
                    <div className="mining-stat">
                        <span className="mining-stat-value">{summary.byStatus.TESTING}</span>
                        <span className="mining-stat-label">Em teste</span>
                    </div>
                    {summary.topOffer && (
                        <div className="mining-stat top-offer">
                            <span className="mining-stat-label">Top oferta</span>
                            <span className="mining-stat-value small">{summary.topOffer.name}</span>
                            <span className="mining-stat-extra">{summary.topOffer.adCount} anúncios</span>
                        </div>
                    )}
                </div>

                {/* Filters */}
                <div className="mining-filters">
                    <div className="filter-group">
                        <Filter size={14} />
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as OfferStatus | 'ALL')}
                        >
                            <option value="ALL">Todos os status</option>
                            <option value="CANDIDATE">Candidatas</option>
                            <option value="TESTING">Testando</option>
                            <option value="WINNER">Vencedoras</option>
                            <option value="DISCARDED">Descartadas</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <ArrowUpDown size={14} />
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as 'adCount' | 'lastTouchedAt')}
                        >
                            <option value="adCount">Mais anúncios</option>
                            <option value="lastTouchedAt">Mais recentes</option>
                        </select>
                    </div>
                </div>

                {/* Offers Grid */}
                <div className="offers-grid">
                    {filteredOffers.map(offer => (
                        <OfferMinedCard
                            key={offer.id}
                            offer={offer}
                            onIncrementAds={() => handleOpenHistoryModal(offer)}
                            onEdit={handleEdit}
                            onChangeStatus={handleChangeStatus}
                        />
                    ))}
                </div>

                {filteredOffers.length === 0 && (
                    <Card padding="lg" className="empty-offers">
                        <Search size={32} />
                        <p>Nenhuma oferta encontrada</p>
                        <Button variant="primary" onClick={() => setShowAddModal(true)}>
                            Adicionar sua primeira oferta
                        </Button>
                    </Card>
                )}
            </div>

            {/* Add/Edit Offer Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setEditingOffer(null);
                }}
                title={editingOffer ? 'Editar Oferta' : 'Nova Oferta Minerada'}
                size="md"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowAddModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleSaveOffer}>
                            {editingOffer ? 'Salvar' : 'Adicionar'}
                        </Button>
                    </>
                }
            >
                <div className="offer-form">
                    <div className="form-field">
                        <label>Nome da oferta *</label>
                        <input
                            type="text"
                            placeholder="Ex: Curso de Crochê da Maria"
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>

                    <div className="form-field">
                        <label>URL do anúncio *</label>
                        <input
                            type="url"
                            placeholder="https://www.facebook.com/ads/library/..."
                            value={formData.url}
                            onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label>Anúncios encontrados</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.adCount}
                                onChange={e => setFormData(prev => ({ ...prev, adCount: parseInt(e.target.value) || 1 }))}
                            />
                        </div>

                        <div className="form-field">
                            <label>Plataforma</label>
                            <select
                                value={formData.platform}
                                onChange={e => setFormData(prev => ({ ...prev, platform: e.target.value as OfferPlatform }))}
                            >
                                {OFFER_PLATFORMS.map(p => (
                                    <option key={p.key} value={p.key}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-field">
                        <label>Palavras-chave (ângulos)</label>
                        <input
                            type="text"
                            placeholder="Ex: prova social, renda extra, desconto (separe por vírgula)"
                            value={formData.angles}
                            onChange={e => setFormData(prev => ({ ...prev, angles: e.target.value }))}
                        />
                    </div>

                    <div className="form-field">
                        <label>Notas (opcional)</label>
                        <textarea
                            placeholder="Por que essa oferta parece boa? Qual ângulo? Promessa?"
                            rows={3}
                            value={formData.notes}
                            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        />
                    </div>
                </div>
            </Modal>

            {/* Update History Modal */}
            <Modal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                title="Atualizar Métricas"
                size="sm"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowHistoryModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleUpdateAdHistory}>
                            Salvar
                        </Button>
                    </>
                }
            >
                <div className="offer-form">
                    <p className="text-secondary text-sm mb-4">
                        Atualizando: <strong>{updatingHistoryOffer?.name}</strong>
                    </p>
                    <div className="form-field">
                        <label>Data da medição</label>
                        <input
                            type="date"
                            value={historyFormData.date}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={e => setHistoryFormData(prev => ({ ...prev, date: e.target.value }))}
                        />
                    </div>
                    <div className="form-field">
                        <label>Quantidade de anúncios</label>
                        <input
                            type="number"
                            min="0"
                            value={historyFormData.count}
                            onChange={e => setHistoryFormData(prev => ({ ...prev, count: parseInt(e.target.value) || 0 }))}
                        />
                    </div>
                </div>
            </Modal>

            {/* Tasks Modal */}
            <Modal
                isOpen={showTasksModal}
                onClose={() => setShowTasksModal(false)}
                title="Minhas Tarefas"
                size="md"
                footer={<Button variant="ghost" onClick={() => setShowTasksModal(false)}>Fechar</Button>}
            >
                <div className="tasks-list-modal">
                    {[
                        { title: 'Assistir módulo de Mineração', done: true },
                        { title: 'Selecionar 10 ofertas candidatas', done: false },
                        { title: 'Configurar Business Manager', done: false },
                    ].map((task, i) => (
                        <div key={i} className="task-item-modal">
                            <input
                                type="checkbox"
                                checked={task.done}
                                onChange={() => toast.success('Status atualizado!')}
                            />
                            <span className={task.done ? 'text-strike' : ''}>{task.title}</span>
                        </div>
                    ))}
                    <div className="mt-4 text-center">
                        <Button variant="ghost" size="sm" onClick={() => toast.info('Redirecionando para quadro completo...')}>Ver quadro completo</Button>
                    </div>
                </div>
            </Modal>

            {/* Update Modal */}
            <Modal
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                title="Enviar Update Semanal"
                size="lg"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowUpdateModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={() => {
                            toast.success('Relatório enviado com sucesso!');
                            setShowUpdateModal(false);
                        }}>Enviar Relatório</Button>
                    </>
                }
            >
                <div className="update-form">
                    <p className="text-secondary mb-4">Compartilhe seu progresso com o mentor.</p>
                    <div className="form-field">
                        <label>Resumo da Semana</label>
                        <textarea rows={3} placeholder="O que você fez essa semana?" />
                    </div>
                    <div className="form-field">
                        <label>Resultados Alcançados</label>
                        <textarea rows={2} placeholder="Vendas, leads, métricas..." />
                    </div>
                    <div className="form-field">
                        <label>Dificuldades / Travas</label>
                        <textarea rows={2} placeholder="Onde você precisa de ajuda?" />
                    </div>
                </div>
            </Modal>

            {/* Tour Guide Triggered by state */}
            <TourGuide
                isOpen={isTourOpen}
                steps={FIRST_LOGIN_TOUR}
                onComplete={handleTourComplete}
                onSkip={() => setIsTourOpen(false)}
            />
        </div>
    );
};

export default MenteeHomePage;
