import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Target,
    Calendar,
    CheckSquare,
    MessageSquare,
    Search,
    TrendingUp,
    ArrowUpDown,
    Lock
} from 'lucide-react';
import { Card, Badge, Button, Modal, Skeleton } from '../../components/ui';
import { OnboardingChecklist, TourGuide } from '../../components/onboarding';
import { SubmitUpdateModal } from '../../components/mentee/SubmitUpdateModal';
import { useToast } from '../../components/ui/Toast';
import { MENTEE_STAGES, getStageConfig, DEFAULT_ONBOARDING_TEMPLATE, FIRST_LOGIN_TOUR } from '../../types';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, getDocs } from 'firebase/firestore';
import type { OfferMined, OnboardingProgress, Mentee } from '../../types';

import { useAuth } from '../../contexts/AuthContext';
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



    const [nextCall, setNextCall] = useState<any>(null);
    const [pendingTasks, setPendingTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Onboarding state
    const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | null>(null);

    const [isTourOpen, setIsTourOpen] = useState(false);

    // Quick Actions Modals
    const [showTasksModal, setShowTasksModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);

    const { firebaseUser } = useAuth();

    // Fetch Mentee & Onboarding Linked to Auth User
    React.useEffect(() => {
        const fetchMentee = async () => {
            if (!firebaseUser) {
                setLoading(false);
                return;
            }

            try {
                const email = firebaseUser.email;
                if (!email) {
                    setLoading(false);
                    return;
                }

                // 1. Try to find by UID first (if already linked)
                let q = query(collection(db, 'mentees'), where('uid', '==', firebaseUser.uid));
                let snapshot = await getDocs(q);

                // 2. If not found, try to find by Email (first login/link)
                if (snapshot.empty) {
                    q = query(collection(db, 'mentees'), where('email', '==', email));
                    snapshot = await getDocs(q);

                    // If found by email, LINK IT by saving the uid
                    if (!snapshot.empty) {
                        const docRef = snapshot.docs[0].ref;
                        await updateDoc(docRef, { uid: firebaseUser.uid });
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
                }
            } catch (error) {
                console.error("Error fetching mentee:", error);
                toast.error("Erro ao carregar perfil.");
            } finally {
                setLoading(false);
            }
        };

        fetchMentee();
    }, [firebaseUser]);

    // Fetch Offers, Next Call, and Tasks
    React.useEffect(() => {
        if (!mentee) return;

        // 1. Offers
        const qOffers = query(collection(db, 'offers'), where('createdByUserId', '==', mentee.id));
        const unsubOffers = onSnapshot(qOffers, (snapshot) => {
            setOffers(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
                lastTouchedAt: doc.data().lastTouchedAt?.toDate()
            })) as OfferMined[]);
            setLoading(false);
        });

        // 2. Next Call
        const unsubCall = onSnapshot(query(collection(db, 'calls'), where('menteeId', '==', mentee.id)), (snapshot) => {
            const upcoming = snapshot.docs
                .map(d => ({ id: d.id, ...d.data(), startsAt: d.data().startsAt?.toDate() }))
                .filter((c: any) => c.startsAt > new Date())
                .sort((a: any, b: any) => a.startsAt - b.startsAt)[0];
            setNextCall(upcoming || null);
        });

        // 3. Pending Tasks
        const qTasks = query(
            collection(db, 'mentee_tasks'),
            where('menteeId', '==', mentee.id),
            where('status', '==', 'pending')
        );
        const unsubTasks = onSnapshot(qTasks, (snapshot) => {
            setPendingTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubOffers();
            unsubCall();
            unsubTasks();
        };
    }, [mentee]);

    // Calculate visible progress
    const calculatedProgress = React.useMemo(() => {
        if (!mentee || !onboardingProgress) return 0;
        if (mentee.currentStage !== 'ONBOARDING') return mentee.stageProgress;

        const completedCount = onboardingProgress.completedSteps.length;
        const totalSteps = DEFAULT_ONBOARDING_TEMPLATE.length;
        return Math.round((completedCount / totalSteps) * 100);
    }, [mentee, onboardingProgress]);

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
                setTimeout(async () => {
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

    // Handlers
    const handleCompleteStep = (stepId: string, data?: Record<string, any>) => {
        if (!onboardingProgress) return;
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
        const step = DEFAULT_ONBOARDING_TEMPLATE.find(s => s.id === 'ob5');
        setOnboardingProgress(prev => prev ? ({
            ...prev,
            completedSteps: [...prev.completedSteps, 'ob5'],
            xpEarned: prev.xpEarned + (step?.xpReward || 0),
            lastActivityAt: new Date(),
        }) : null);
        toast.success('Tour concluído!', '+75 XP');
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

    if (loading) {
        return (
            <div className="mentee-home">
                <div className="mentee-home-header">
                    <div>
                        <Skeleton width={200} height={32} className="mb-2" />
                        <Skeleton width={150} height={20} />
                    </div>
                    <Skeleton width={100} height={30} variant="circular" style={{ borderRadius: 16 }} />
                </div>
                {/* ... more skeletons ... */}
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
                    <Button variant="secondary" fullWidth onClick={() => auth.signOut()}>
                        Sair e tentar outro email
                    </Button>
                </Card>
            </div>
        );
    }

    if (mentee.status === 'PENDING') {
        return (
            <div className="flex h-screen items-center justify-center p-4">
                <Card padding="lg" className="max-w-md w-full text-center">
                    <div className="mb-4 text-warning flex justify-center">
                        <Lock size={48} />
                    </div>
                    <h2 className="text-xl font-bold mb-2">Aprovação Pendente</h2>
                    <p className="text-secondary mb-6">
                        Olá {mentee.name.split(' ')[0]}, seu cadastro foi recebido com sucesso!
                        <br /><br />
                        Um mentor irá analisar sua solicitação em breve. Você receberá um aviso assim que seu acesso for liberado.
                    </p>
                    <Button variant="secondary" fullWidth onClick={() => auth.signOut()}>
                        Sair
                    </Button>
                </Card>
            </div>
        );
    }

    const stageConfig = getStageConfig(MENTEE_STAGES, mentee.currentStage);
    const summary = calculateMiningSummary(offers);
    const isOnboarding = mentee.currentStage === 'ONBOARDING' && !!onboardingProgress;

    return (
        <div className="mentee-home">
            {/* Header */}
            <div className="mentee-home-header">
                <div>
                    <h1 className="mentee-home-title">Olá, {mentee.name.split(' ')[0]}!</h1>
                    <p className="mentee-home-subtitle">Sua jornada de mentoria</p>
                </div>
                <Badge variant="info" style={{ backgroundColor: stageConfig?.color }}>
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
                    <div className="stage-progress-fill" style={{ width: `${calculatedProgress}%`, backgroundColor: stageConfig?.color }} />
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
                        <span className="quick-action-value">{nextCall ? formatDate(nextCall.startsAt) : 'Nenhuma agendada'}</span>
                    </div>
                </Card>
                <Card padding="md" className="quick-action-card clickable" onClick={() => setShowTasksModal(true)}>
                    <CheckSquare size={20} />
                    <div>
                        <span className="quick-action-label">Tarefas</span>
                        <span className="quick-action-value">{pendingTasks.length} pendentes</span>
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

            {/* Onboarding Checklist */}
            {isOnboarding && (
                <OnboardingChecklist
                    steps={DEFAULT_ONBOARDING_TEMPLATE}
                    progress={onboardingProgress}
                    onCompleteStep={handleCompleteStep}
                    onSkipStep={handleSkipStep}
                />
            )}

            {/* Mining Summary Widget */}
            <div className="mining-section mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Search size={20} className="text-primary" />
                        Mineração
                    </h2>
                    <Button variant="ghost" icon={<ArrowUpDown size={16} />} onClick={() => navigate('/me/mining')}>
                        Ver tudo
                    </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4" onClick={() => navigate('/me/mining')}>
                    <Card className="hover:bg-white/5 transition-colors cursor-pointer text-center py-4 border-dashed border-white/10">
                        <span className="text-3xl font-bold text-white block mb-1">{summary.offersTotal}</span>
                        <span className="text-xs text-secondary uppercase">Ofertas</span>
                    </Card>
                    <Card className="hover:bg-white/5 transition-colors cursor-pointer text-center py-4 border-dashed border-white/10">
                        <span className="text-3xl font-bold text-blue-400 block mb-1">{summary.adsTotal}</span>
                        <span className="text-xs text-secondary uppercase">Ads Mapeados</span>
                    </Card>
                    <Card className="hover:bg-white/5 transition-colors cursor-pointer text-center py-4 border-dashed border-white/10">
                        <span className="text-3xl font-bold text-yellow-400 block mb-1">{summary.byStatus.TESTING}</span>
                        <span className="text-xs text-secondary uppercase">Em Teste</span>
                    </Card>
                    <Card className="hover:bg-white/5 transition-colors cursor-pointer text-center py-4 border-dashed border-white/10">
                        <span className="text-3xl font-bold text-green-400 block mb-1">{summary.byStatus.WINNER}</span>
                        <span className="text-xs text-secondary uppercase">Campeãs</span>
                    </Card>
                </div>
            </div>

            {/* Quick Actions Modals - Kept in Dashboard */}

            {/* Tasks Modal */}
            <Modal
                isOpen={showTasksModal}
                onClose={() => setShowTasksModal(false)}
                title="Minhas Tarefas"
                size="md"
                footer={<Button variant="ghost" onClick={() => setShowTasksModal(false)}>Fechar</Button>}
            >
                <div className="tasks-list-modal">
                    {pendingTasks.length === 0 ? (
                        <p className="text-secondary text-center py-4">Nenhuma tarefa pendente!</p>
                    ) : (
                        pendingTasks.slice(0, 5).map((task, i) => (
                            <div key={task.id || i} className="task-item-modal">
                                <input
                                    type="checkbox"
                                    checked={false}
                                    onChange={async () => {
                                        try {
                                            await updateDoc(doc(db, 'mentee_tasks', task.id), {
                                                status: 'done',
                                                completedAt: new Date()
                                            });
                                            toast.success('Tarefa concluída!');
                                        } catch (e) {
                                            console.error(e);
                                            toast.error('Erro ao concluir');
                                        }
                                    }}
                                />
                                <span>{task.title}</span>
                            </div>
                        ))
                    )}
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

            {/* Submit Update Modal */}
            <SubmitUpdateModal
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                menteeId={mentee.id}
                userId={firebaseUser?.uid || ''}
            />

            {/* Tour Guide */}
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
