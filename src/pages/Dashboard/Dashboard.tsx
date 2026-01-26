import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign,
    Zap,
    ChevronRight,
    Search,
    AlertTriangle,
    Calendar
} from 'lucide-react';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

import { Card, Badge, Button, Skeleton } from '../../components/ui';
import { ActionCenter } from '../../components/dashboard/ActionCenter';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FinanceSnapshot } from '../../types';
import './Dashboard.css';

// Mocks removed. Using calculated data.

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    // const toast = useToast(); -> Removed unused

    const [loading, setLoading] = React.useState(true);

    // State for aggregated data
    const [finance, setFinance] = React.useState<FinanceSnapshot>({
        today: 0, week: 0, month: 0, total: 0,
        openDeals: 0, pendingPayments: 0, blockedMentees: 0
    });
    const [miningOverview, setMiningOverview] = React.useState<any[]>([]);
    // Alerts removed as ActionCenter covers it, or simplification needed.
    // Keeping simple alerts if requested, but for now removing complex alerts state if unused.
    // Actually alerts were used in render. Let's optimize alerts or keep them simple.
    // The previous code had `alerts` state used in render. But `setAlerts` was removed.
    // Let's restore `alerts` if we want to keep the Alerts section, BUT the ActionCenter replaces "SmartTasks".
    // The user requested "Centralize Action Items". The Alerts section (money at risk etc) is valuable summary.
    // I will keep Alerts but calculate them from Finance/Actions if possible, or simplified.
    // Since I removed `salesActions` state, I can't calculate alerts from it easily here.
    // Alternative: Move Alerts logic to ActionCenter OR just remove/simplify the Alerts section to static links.
    // Simplification: static alerts based on finance data!

    // ... logic continues ...

    React.useEffect(() => {
        const fetchData = async () => {
            // Simulate initial load for Skeleton
            setTimeout(() => setLoading(false), 1000);

            // 1. Finance (Transactions)
            // We'll listen to transactions to calculate totals
            const unsubFinance = onSnapshot(query(collection(db, 'transactions')), (snapshot) => {
                const txs = snapshot.docs.map(d => ({ ...d.data(), dueDate: d.data().dueDate?.toDate(), paidAt: d.data().paidAt?.toDate() })) as any[];
                const now = new Date();
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
                const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

                const today = txs.filter(t => t.status === 'PAID' && t.paidAt >= startOfDay).reduce((sum, t) => sum + t.amount, 0);
                const week = txs.filter(t => t.status === 'PAID' && t.paidAt >= startOfWeek).reduce((sum, t) => sum + t.amount, 0);
                const month = txs.filter(t => t.status === 'PAID' && t.paidAt >= startOfMonth).reduce((sum, t) => sum + t.amount, 0);
                const total = txs.filter(t => t.status === 'PAID').reduce((sum, t) => sum + t.amount, 0);

                // Deals stats needed for finance snapshot (pending payments, open deals) can be updated below
                setFinance(prev => ({ ...prev, today, week, month, total }));
            });

            // 2. Deals Finance Stats
            const unsubDeals = onSnapshot(query(collection(db, 'deals')), (snapshot) => {
                const deals = snapshot.docs.map(d => ({ id: d.id, ...d.data(), updatedAt: d.data().updatedAt?.toDate() })) as any[];

                // Update Finance Stats part 2
                const openDealsCount = deals.filter(d => ['OPEN', 'PITCH_SENT', 'PAYMENT_SENT'].includes(d.stage)).length;
                const pendingPaymentsCount = deals.filter(d => d.stage === 'PAYMENT_SENT').length;

                setFinance(prev => ({ ...prev, openDeals: openDealsCount, pendingPayments: pendingPaymentsCount }));
            });

            // 3. Mentees & Mining
            const unsubMentees = onSnapshot(query(collection(db, 'mentees')), async (snapshot) => {
                const mentees = snapshot.docs.map(d => ({ id: d.id, ...d.data(), lastUpdateAt: d.data().lastUpdateAt?.toDate() })) as any[];

                const blockedCount = mentees.filter(m => m.blocked).length;
                setFinance(prev => ({ ...prev, blockedMentees: blockedCount }));

                // Mining Overview
                const miningMentees = mentees.filter(m => m.currentStage === 'MINING');
                const offersSnap = await getDocs(query(collection(db, 'offers')));
                const allOffers = offersSnap.docs.map(d => ({ ...d.data(), createdByUserId: d.data().createdByUserId }));

                const miningStats = miningMentees.map(m => {
                    const mOffers = allOffers.filter((o: any) => o.createdByUserId === m.id);
                    return {
                        menteeId: m.id,
                        name: m.name,
                        stage: 'MINING',
                        offersTotal: mOffers.length,
                        adsTotal: mOffers.reduce((sum: number, o: any) => sum + (o.adCount || 0), 0),
                        testing: mOffers.filter((o: any) => o.status === 'TESTING').length,
                        lastMinedDays: null // Hard to calc without querying sub-activity
                    };
                });
                setMiningOverview(miningStats);
            });

            return () => {
                unsubFinance();
                unsubDeals();
                unsubMentees();
            };
        };
        fetchData();
    }, []);

    // Alerts Calculation (Simplified)
    React.useEffect(() => {
        // ... (Keep simple alerts logic if needed, or remove completely if covered by ActionCenter)
        // For now let's keep alerts for Money at Risk (maybe ActionCenter handles it visually, but top alerts are good)
        // Actually ActionCenter handles most. Let's simplify.
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
        }).format(value);
    };

    if (loading) {
        return (
            <div className="dashboard">
                {/* Header Skeleton */}
                <div className="dashboard-header mb-6">
                    <div>
                        <Skeleton width={200} height={32} className="mb-2" />
                        <Skeleton width={150} height={20} />
                    </div>
                    <Skeleton width={120} height={40} />
                </div>

                {/* Finance Skeleton */}
                <div className="finance-grid mb-8">
                    <Skeleton width="100%" height={120} variant="card" />
                    <Skeleton width="100%" height={120} variant="card" />
                    <Skeleton width="100%" height={120} variant="card" />
                    <Skeleton width="100%" height={120} variant="card" />
                </div>

                {/* Main Grid Skeleton */}
                <div className="dashboard-grid mb-8">
                    <div className="dashboard-section h-96">
                        <Skeleton width="100%" height="100%" variant="card" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Sala de Guerra</h1>
                    <p className="dashboard-subtitle">
                        {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                </div>
                <Button
                    variant="primary"
                    icon={<Zap size={18} />}
                    onClick={() => navigate('/execution')}
                >
                    Modo Execução
                </Button>
            </div>

            {/* Finance Snapshot */}
            <section className="dashboard-section">
                <div className="finance-grid">
                    <Card className="finance-card finance-card-main" padding="lg">
                        <div className="finance-card-icon">
                            <DollarSign size={24} />
                        </div>
                        <div className="finance-card-content">
                            <span className="finance-card-label">Hoje</span>
                            <span className="finance-card-value">{formatCurrency(finance.today)}</span>
                        </div>
                    </Card>

                    <Card className="finance-card" padding="md">
                        <div className="finance-card-content">
                            <span className="finance-card-label">7 dias</span>
                            <span className="finance-card-value">{formatCurrency(finance.week)}</span>
                        </div>
                    </Card>

                    <Card className="finance-card" padding="md">
                        <div className="finance-card-content">
                            <span className="finance-card-label">30 dias</span>
                            <span className="finance-card-value">{formatCurrency(finance.month)}</span>
                        </div>
                    </Card>

                    <Card className="finance-card finance-card-stats" padding="md">
                        <div className="finance-stats">
                            <div className="finance-stat">
                                <span className="finance-stat-value">{finance.openDeals}</span>
                                <span className="finance-stat-label">Deals abertos</span>
                            </div>
                            <div className="finance-stat">
                                <span className="finance-stat-value text-warning">{finance.pendingPayments}</span>
                                <span className="finance-stat-label">Pagamentos</span>
                            </div>
                            <div className="finance-stat">
                                <span className="finance-stat-value text-error">{finance.blockedMentees}</span>
                                <span className="finance-stat-label">Travados</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            {/* Main Grid */}
            <div className="dashboard-grid">
                {/* Action Center - Unified Feed */}
                <section className="dashboard-section md:col-span-2 lg:col-span-3">
                    <ActionCenter />
                </section>
            </div>

            {/* Alerts - Simplified based on Finance */}
            <section className="dashboard-section">
                <h2 className="section-title">⚠️ Alertas</h2>
                <div className="alerts-grid">
                    {/* Money at Risk (Pending Payments) */}
                    {finance.pendingPayments > 0 && (
                        <Card
                            className="alert-card"
                            padding="md"
                            variant="interactive"
                            onClick={() => navigate('/crm')}
                        >
                            <div className="alert-icon">
                                <DollarSign size={20} />
                            </div>
                            <div className="alert-content">
                                <span className="alert-label">{finance.pendingPayments} Pagamentos Pendentes</span>
                                <span className="alert-description">Deals aguardando PIX</span>
                            </div>
                            <ChevronRight size={18} className="alert-arrow" />
                        </Card>
                    )}

                    {/* Stuck Mentees */}
                    {finance.blockedMentees > 0 && (
                        <Card
                            className="alert-card"
                            padding="md"
                            variant="interactive"
                            onClick={() => navigate('/mentees')}
                        >
                            <div className="alert-icon">
                                <AlertTriangle size={20} />
                            </div>
                            <div className="alert-content">
                                <span className="alert-label">{finance.blockedMentees} Mentorados Travados</span>
                                <span className="alert-description">Precisam de atenção</span>
                            </div>
                            <ChevronRight size={18} className="alert-arrow" />
                        </Card>
                    )}

                    {/* Quick Access Calls */}
                    <Card
                        className="alert-card"
                        padding="md"
                        variant="interactive"
                        onClick={() => navigate('/calendar')}
                    >
                        <div className="alert-icon">
                            <Calendar size={20} />
                        </div>
                        <div className="alert-content">
                            <span className="alert-label">Agenda</span>
                            <span className="alert-description">Ver próximos eventos</span>
                        </div>
                        <ChevronRight size={18} className="alert-arrow" />
                    </Card>

                    {/* Quick Access Mining */}
                    <Card
                        className="alert-card"
                        padding="md"
                        variant="interactive"
                        onClick={() => navigate('/mentees')}
                    >
                        <div className="alert-icon">
                            <Search size={20} />
                        </div>
                        <div className="alert-content">
                            <span className="alert-label">Mineração</span>
                            <span className="alert-description">Ver progresso de ofertas</span>
                        </div>
                        <ChevronRight size={18} className="alert-arrow" />
                    </Card>
                </div>
            </section>

            {/* Mining Overview */}
            <section className="dashboard-section">
                <div className="section-header">
                    <div className="section-title-group">
                        <h2 className="section-title">⛏️ Mineração — Visão Geral</h2>
                        <Badge>{miningOverview.length} em MINING</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/mentees')}>
                        Ver todos <ChevronRight size={16} />
                    </Button>
                </div>

                <div className="mining-overview-grid">
                    {miningOverview.map((m) => (
                        <Card
                            key={m.menteeId}
                            variant="interactive"
                            padding="md"
                            className={`mining-overview-card ${m.offersTotal === 0 ? 'mining-alert' : ''}`}
                            onClick={() => navigate(`/mentee/${m.menteeId}`)}
                        >
                            <div className="mining-overview-header">
                                <div className="mining-overview-avatar">
                                    {m.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="mining-overview-info">
                                    <span className="mining-overview-name">{m.name}</span>
                                    {m.offersTotal === 0 ? (
                                        <Badge variant="warning" size="sm">Sem ofertas</Badge>
                                    ) : (
                                        <span className="mining-overview-last">
                                            {m.lastMinedDays === 0 ? 'Hoje' : m.lastMinedDays === 1 ? 'Ontem' : `${m.lastMinedDays}d atrás`}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="mining-overview-stats">
                                <div className="mining-overview-stat">
                                    <span className="stat-number">{m.offersTotal}</span>
                                    <span className="stat-name">ofertas</span>
                                </div>
                                <div className="mining-overview-stat highlight">
                                    <span className="stat-number">{m.adsTotal}</span>
                                    <span className="stat-name">anúncios</span>
                                </div>
                                <div className="mining-overview-stat">
                                    <span className="stat-number">{m.testing}</span>
                                    <span className="stat-name">testing</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
};


export default DashboardPage;
