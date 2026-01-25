import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { db, auth } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import type { OfferMined, OfferStatus, MenteeStage, OfferPlatform, OnboardingProgress, Mentee } from '../../types';
import './MenteeHome.css';

// Helper to calculate summary from real data
const calculateMiningSummary = (offers: OfferMined[]) => {
    const testing = offers.filter(o => o.status === 'TESTING').length;
    const winner = offers.filter(o => o.status === 'WINNER').length;
    const candidate = offers.filter(o => o.status === 'CANDIDATE').length;
    const discarded = offers.filter(o => o.status === 'DISCARDED').length;

    const adsTotal = offers.reduce((acc, curr) => acc + curr.adCount, 0);
    const topOffer = [...offers].sort((a, b) => b.adCount - a.adCount)[0];

    return {
        offersTotal: offers.length,
        adsTotal,
        byStatus: { TESTING: testing, WINNER: winner, CANDIDATE: candidate, DISCARDED: discarded },
        topOffer
    };
};

export const MenteeHomePage: React.FC = () => {
    const toast = useToast();
    const navigate = useNavigate();

    const [mentee, setMentee] = useState<Mentee | null>(null);
    const [offers, setOffers] = useState<OfferMined[]>([]);
    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingOffer, setEditingOffer] = useState<OfferMined | null>(null);
    const [filterStatus, setFilterStatus] = useState<OfferStatus | 'ALL'>('ALL');
    const [sortBy, setSortBy] = useState<'adCount' | 'lastTouchedAt'>('adCount');

    // Onboarding state
    const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | null>(null);

    // Fetch Mentee & Onboarding Linked to Auth User
    React.useEffect(() => {
        const fetchMentee = async () => {
            if (!auth.currentUser) return; // Wait for auth

            try {
                const email = auth.currentUser.email;
                if (!email) return;

                // 1. Try to find by UID first (if already linked)
                let q = query(collection(db, 'mentees'), where('uid', '==', auth.currentUser.uid));
                let snapshot = await getDocs(q);

                // 2. If not found, try to find by Email (first login/link)
                if (snapshot.empty) {
                    q = query(collection(db, 'mentees'), where('email', '==', email));
                    snapshot = await getDocs(q);

                    // If found by email, LINK IT by saving the uid
                    if (!snapshot.empty) {
                        const docRef = snapshot.docs[0].ref;
                        await updateDoc(docRef, { uid: auth.currentUser.uid });
                    }
                }

                if (!snapshot.empty) {
                    const docData = snapshot.docs[0];
                    const myMentee = {
                        id: docData.id,
                        ...docData.data(),
                        // Parse dates
                        startAt: docData.data().startAt?.toDate(),
                        lastUpdateAt: docData.data().lastUpdateAt?.toDate(),
                        createdAt: docData.data().createdAt?.toDate(),
                        updatedAt: docData.data().updatedAt?.toDate(),
                        nextCallAt: docData.data().nextCallAt?.toDate()
                    } as Mentee;
                    setMentee(myMentee);

                    // Load onboarding
                    const saved = localStorage.getItem(`onboarding_${myMentee.id}`);
                    if (saved) {
                        setOnboardingProgress(JSON.parse(saved));
                    } else {
                        setOnboardingProgress({
                            menteeId: myMentee.id,
                            templateId: 'default',
                            currentStepIndex: 0,
                            completedSteps: [],
                            skippedSteps: [],
                            stepData: {},
                            xpEarned: 0,
                            startedAt: new Date(),
                            lastActivityAt: new Date()
                        });
                    }
                } else {
                    // No profile found for this user
                    console.log("No mentee profile found for email:", email);
                    // Optionally show a "Profile not found" or "Contact support" state
                }
            } catch (error) {
                console.error("Error fetching mentee:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMentee();
    }, [auth.currentUser]); // Re-run when auth state changes (e.g. login)

    // Fetch Offers
    React.useEffect(() => {
        if (!mentee) return;

        const q = query(collection(db, 'offers'), where('createdByUserId', '==', mentee.id));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setOffers(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
                lastTouchedAt: doc.data().lastTouchedAt?.toDate()
            })) as OfferMined[]);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [mentee]);

    // Calculate visible progress
    const calculatedProgress = React.useMemo(() => {
        if (!mentee || !onboardingProgress) return 0;
        if (mentee.currentStage !== 'ONBOARDING') return mentee.stageProgress;

        const completedCount = onboardingProgress.completedSteps.length;
        const totalSteps = DEFAULT_ONBOARDING_TEMPLATE.length;
        return Math.round((completedCount / totalSteps) * 100);
    }, [mentee, onboardingProgress]);

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
        if (!mentee || !onboardingProgress) return;

        localStorage.setItem(`onboarding_${mentee.id}`, JSON.stringify(onboardingProgress));

        // Check for onboarding completion to advance stage
        if (mentee.currentStage === 'ONBOARDING') {
            const completedCount = onboardingProgress.completedSteps.length;
            const totalSteps = DEFAULT_ONBOARDING_TEMPLATE.length;

            if (completedCount === totalSteps) {
                // Advance to MINING
                toast.success('Parabéns! Você concluiu o Onboarding! 🚀', 'Bem-vindo à fase de Mineração.');

                // Small delay for effect
                setTimeout(async () => {
                    // Update in Firestore
                    await updateDoc(doc(db, 'mentees', mentee.id), {
                        currentStage: 'MINING',
                        stageProgress: 0,
                        updatedAt: new Date()
                    });

                    setMentee(prev => prev ? ({
                        ...prev,
                        currentStage: 'MINING',
                        stageProgress: 0,
                        weeklyGoal: 'Encontrar 10 produtos candidatos'
                    }) : null);
                }, 1500);
            }
        }
    }, [onboardingProgress, mentee?.currentStage, mentee?.id]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-secondary">Carregando seu perfil...</p>
                </div>
            </div>
        );
    }

    if (!mentee) {
        return (
            <div className="flex h-screen items-center justify-center p-4">
                <Card padding="lg" className="max-w-md w-full text-center">
                    <div className="mb-4 text-warning flex justify-center">
                        <Target size={48} />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Perfil não encontrado</h2>
                    <p className="text-secondary mb-6">
                        Não encontramos um mentorado vinculado ao email: <br />
                        <span className="text-primary font-mono bg-secondary/20 px-2 py-1 rounded text-sm block mt-2">
                            {auth.currentUser?.email}
                        </span>
                    </p>
                    <div className="space-y-3">
                        <p className="text-sm text-tertiary">
                            Se você acabou de comprar, verifique se entrou com o <strong>mesmo email</strong> informado no pagamento.
                        </p>
                        <Button variant="secondary" fullWidth onClick={() => auth.signOut()}>
                            Sair e tentar outro email
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const stageConfig = getStageConfig(MENTEE_STAGES, mentee.currentStage);
    const summary = calculateMiningSummary(offers);
    const isOnboarding = mentee.currentStage === 'ONBOARDING' && !!onboardingProgress;

    // Onboarding handlers
    const handleCompleteStep = (stepId: string, data?: Record<string, any>) => {
        if (!onboardingProgress) return;
        // Special trigger for Tour step
        if (stepId === 'ob5') {
            setIsTourOpen(true);
            return;
        }

        const step = DEFAULT_ONBOARDING_TEMPLATE.find(s => s.id === stepId);
        setOnboardingProgress(prev => prev ? ({
            ...prev,
            completedSteps: [...prev.completedSteps, stepId],
            stepData: data ? { ...prev.stepData, [stepId]: data } : prev.stepData,
            xpEarned: prev.xpEarned + (step?.xpReward || 0),
            lastActivityAt: new Date(),
        }) : null);
    };

    const handleSkipStep = (stepId: string) => {
        setOnboardingProgress(prev => prev ? ({
            ...prev,
            skippedSteps: [...prev.skippedSteps, stepId],
            lastActivityAt: new Date(),
        }) : null);
        toast.info('Passo pulado', 'Você pode completar depois');
    };

    const handleTourComplete = () => {
        setIsTourOpen(false);
        // Complete the tour step (ob5)
        const step = DEFAULT_ONBOARDING_TEMPLATE.find(s => s.id === 'ob5');
        setOnboardingProgress(prev => prev ? ({
            ...prev,
            completedSteps: [...prev.completedSteps, 'ob5'],
            xpEarned: prev.xpEarned + (step?.xpReward || 0),
            lastActivityAt: new Date(),
        }) : null);
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

    const handleUpdateAdHistory = async () => {
        if (!updatingHistoryOffer || !mentee) return;

        // Optimistic update for UI
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

        try {
            // Find the updated offer in the local state (it was just updated optimistically)
            // Wait, we can't easily grab it from state inside this closure perfectly without refs or re-calc.
            // Let's just reconstruct the update object for Firestore.

            const offerRef = doc(db, 'offers', updatingHistoryOffer.id);
            // We need to read the current doc or rely on what we just calculated.
            // Simplified: just update the fields we know changed.

            // Re-calc logic for firestore payload
            const o = updatingHistoryOffer;
            const newAdHistory = [...(o.adHistory || [])];
            const existingIndex = newAdHistory.findIndex(h => h.date === historyFormData.date);

            if (existingIndex >= 0) {
                newAdHistory[existingIndex] = { ...newAdHistory[existingIndex], count: historyFormData.count };
            } else {
                newAdHistory.push({ date: historyFormData.date, count: historyFormData.count });
                newAdHistory.sort((a, b) => a.date.localeCompare(b.date));
            }
            const isLatest = newAdHistory[newAdHistory.length - 1].date === historyFormData.date;

            await updateDoc(offerRef, {
                adCount: isLatest ? historyFormData.count : o.adCount,
                adHistory: newAdHistory,
                lastTouchedAt: new Date()
            });

            toast.success('Métrica atualizada!');
        } catch (error) {
            console.error("Error updating ad history:", error);
            toast.error("Erro ao salvar métrica");
        }

        setShowHistoryModal(false);
        setUpdatingHistoryOffer(null);
    };

    const handleChangeStatus = async (offerId: string, status: OfferStatus) => {
        try {
            await updateDoc(doc(db, 'offers', offerId), {
                status,
                lastTouchedAt: new Date()
            });
            toast.success(`Oferta marcada como ${status === 'TESTING' ? 'em teste' : status === 'WINNER' ? 'vencedora' : 'descartada'}`);
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Erro ao atualizar status");
        }
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

    const handleSaveOffer = async () => {
        if (!formData.name || !formData.url) {
            toast.error('Preencha nome e URL');
            return;
        }

        if (!mentee) return;

        const angleArray = formData.angles.split(',').map(s => s.trim()).filter(Boolean);

        try {
            if (editingOffer) {
                // Edit existing
                await updateDoc(doc(db, 'offers', editingOffer.id), {
                    name: formData.name,
                    url: formData.url,
                    adCount: formData.adCount,
                    platform: formData.platform,
                    angles: angleArray,
                    notes: formData.notes,
                    lastTouchedAt: new Date(),
                    updatedAt: new Date(),
                });
                toast.success('Oferta atualizada!');
            } else {
                // Create new
                const today = new Date().toISOString().split('T')[0];
                await addDoc(collection(db, 'offers'), {
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
                });
                toast.success('Oferta cadastrada!');
            }

            setShowAddModal(false);
            setEditingOffer(null);
            setFormData({ name: '', url: '', adCount: 1, platform: 'META', angles: '', notes: '' });
        } catch (error) {
            console.error("Error saving offer:", error);
            toast.error("Erro ao salvar oferta");
        }
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
                    <span className="stage-progress-percent">{calculatedProgress}%</span>
                </div>
                <div className="stage-progress-bar">
                    <div
                        className="stage-progress-fill"
                        style={{ width: `${calculatedProgress}%`, backgroundColor: stageConfig?.color }}
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
                        <Button variant="ghost" size="sm" onClick={() => {
                            setShowTasksModal(false);
                            navigate('/me/tasks');
                        }}>Ver quadro completo</Button>
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
