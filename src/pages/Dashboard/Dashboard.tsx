import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign,
    Zap,
    ChevronRight,
    Users,
    Calendar,
    Settings,
    TrendingUp
} from 'lucide-react';
import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import { Card, Badge, Button, Skeleton } from '../../components/ui';
import { useLoading } from '../../hooks/useLoading';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { FinanceSnapshot } from '../../types';
import './Dashboard.css';

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();

    const { isLoading, startLoading, stopLoading } = useLoading('dashboard');

    const [finance, setFinance] = React.useState<FinanceSnapshot>({
        today: 0, week: 0, month: 0, total: 0,
        openDeals: 0, pendingPayments: 0, blockedMentees: 0
    });
    const [chartData, setChartData] = React.useState<{ name: string; value: number }[]>([]);
    const [miningOverview, setMiningOverview] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchData = async () => {
            startLoading('Carregando dashboard...');

            // 1. Finance (Transactions)
            const unsubFinance = onSnapshot(query(collection(db, 'transactions')), (snapshot) => {
                const txs = snapshot.docs.map(d => ({ ...d.data(), dueDate: d.data().dueDate?.toDate(), paidAt: d.data().paidAt?.toDate() })) as any[];
                const now = new Date();
                const startOfToday = startOfDay(now);
                const startOfWeek = subDays(now, 7);
                const startOfMonth = subDays(now, 30);

                const today = txs.filter(t => t.status === 'PAID' && t.paidAt >= startOfToday).reduce((sum, t) => sum + t.amount, 0);
                const week = txs.filter(t => t.status === 'PAID' && t.paidAt >= startOfWeek).reduce((sum, t) => sum + t.amount, 0);
                const month = txs.filter(t => t.status === 'PAID' && t.paidAt >= startOfMonth).reduce((sum, t) => sum + t.amount, 0);
                const total = txs.filter(t => t.status === 'PAID').reduce((sum, t) => sum + t.amount, 0);

                setFinance(prev => ({ ...prev, today, week, month, total }));

                // Generate chart data (last 7 days)
                const days: { name: string; value: number }[] = [];
                for (let i = 6; i >= 0; i--) {
                    const day = subDays(now, i);
                    const dayStart = startOfDay(day);
                    const dayEnd = new Date(dayStart);
                    dayEnd.setHours(23, 59, 59, 999);

                    const dayTotal = txs
                        .filter(t => t.status === 'PAID' && t.paidAt >= dayStart && t.paidAt <= dayEnd)
                        .reduce((sum, t) => sum + t.amount, 0);

                    days.push({
                        name: format(day, 'EEE', { locale: ptBR }),
                        value: dayTotal
                    });
                }
                setChartData(days);
            });

            // 2. Deals Finance Stats
            const unsubDeals = onSnapshot(query(collection(db, 'deals')), (snapshot) => {
                const deals = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                const openDealsCount = deals.filter(d => ['OPEN', 'PITCH_SENT', 'PAYMENT_SENT'].includes(d.stage)).length;
                const pendingPaymentsCount = deals.filter(d => d.stage === 'PAYMENT_SENT').length;
                setFinance(prev => ({ ...prev, openDeals: openDealsCount, pendingPayments: pendingPaymentsCount }));
            });

            // 3. Mentees & Mining
            const unsubMentees = onSnapshot(query(collection(db, 'mentees')), async (snapshot) => {
                const mentees = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                const blockedCount = mentees.filter(m => m.blocked).length;
                setFinance(prev => ({ ...prev, blockedMentees: blockedCount }));

                const miningMentees = mentees.filter(m => m.currentStage === 'MINING');
                const offersSnap = await getDocs(query(collection(db, 'offers')));
                const allOffers = offersSnap.docs.map(d => ({ ...d.data(), createdByUserId: d.data().createdByUserId }));

                const miningStats = miningMentees.map(m => {
                    const mOffers = allOffers.filter((o: any) => o.createdByUserId === m.id);
                    return {
                        menteeId: m.id,
                        name: m.name,
                        offersTotal: mOffers.length,
                        adsTotal: mOffers.reduce((sum: number, o: any) => sum + (o.adCount || 0), 0),
                        testing: mOffers.filter((o: any) => o.status === 'TESTING').length,
                    };
                });
                setMiningOverview(miningStats);
                stopLoading();
            });

            return () => {
                unsubFinance();
                unsubDeals();
                unsubMentees();
            };
        };
        fetchData();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
        }).format(value);
    };

    if (isLoading) {
        return (
            <div className="dashboard">
                <div className="dashboard-header mb-6">
                    <div>
                        <Skeleton width={200} height={32} className="mb-2" />
                        <Skeleton width={150} height={20} />
                    </div>
                    <Skeleton width={120} height={40} />
                </div>
                <div className="finance-hero-skeleton">
                    <Skeleton width="100%" height={300} variant="card" />
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

            {/* Finance Hero Section */}
            <section className="finance-hero">
                <div className="finance-hero-cards">
                    <Card className="finance-hero-card finance-hero-main" padding="lg">
                        <div className="finance-hero-icon">
                            <DollarSign size={28} />
                        </div>
                        <div className="finance-hero-content">
                            <span className="finance-hero-label">Hoje</span>
                            <span className="finance-hero-value">{formatCurrency(finance.today)}</span>
                        </div>
                    </Card>

                    <Card className="finance-hero-card" padding="md">
                        <div className="finance-hero-content">
                            <span className="finance-hero-label">7 dias</span>
                            <span className="finance-hero-value">{formatCurrency(finance.week)}</span>
                        </div>
                    </Card>

                    <Card className="finance-hero-card" padding="md">
                        <div className="finance-hero-content">
                            <span className="finance-hero-label">30 dias</span>
                            <span className="finance-hero-value">{formatCurrency(finance.month)}</span>
                        </div>
                    </Card>

                    <Card className="finance-hero-card finance-hero-total" padding="lg">
                        <div className="finance-hero-icon total">
                            <TrendingUp size={28} />
                        </div>
                        <div className="finance-hero-content">
                            <span className="finance-hero-label">Total Acumulado</span>
                            <span className="finance-hero-value-large">{formatCurrency(finance.total)}</span>
                        </div>
                    </Card>
                </div>

                {/* Gradient Chart */}
                <Card className="finance-chart-card" padding="lg">
                    <h3 className="finance-chart-title">Evolução (7 dias)</h3>
                    <div className="finance-chart">
                        <ResponsiveContainer width="100%" height={180}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#888', fontSize: 12 }}
                                />
                                <YAxis hide />
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{
                                        background: '#1e1e2e',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#22c55e"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorValue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </section>

            {/* Mining Section */}
            <section className="dashboard-section">
                <div className="section-header">
                    <div className="section-title-group">
                        <h2 className="section-title">⛏️ Mineração</h2>
                        <Badge>{miningOverview.length} em MINING</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/mentees')}>
                        Ver todos <ChevronRight size={16} />
                    </Button>
                </div>

                <div className="mining-overview-grid">
                    {miningOverview.length === 0 && (
                        <Card padding="lg" className="mining-empty">
                            <p className="text-secondary">Nenhum mentorado em mineração no momento.</p>
                        </Card>
                    )}
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
                                        <span className="mining-overview-last">{m.offersTotal} ofertas</span>
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

            {/* Quick Links Footer */}
            <section className="quick-links">
                <Card
                    variant="interactive"
                    padding="md"
                    className="quick-link-card"
                    onClick={() => navigate('/crm')}
                >
                    <DollarSign size={20} />
                    <span>CRM</span>
                </Card>
                <Card
                    variant="interactive"
                    padding="md"
                    className="quick-link-card"
                    onClick={() => navigate('/calendar')}
                >
                    <Calendar size={20} />
                    <span>Agenda</span>
                </Card>
                <Card
                    variant="interactive"
                    padding="md"
                    className="quick-link-card"
                    onClick={() => navigate('/mentees')}
                >
                    <Users size={20} />
                    <span>Mentorados</span>
                </Card>
                <Card
                    variant="interactive"
                    padding="md"
                    className="quick-link-card"
                    onClick={() => navigate('/settings')}
                >
                    <Settings size={20} />
                    <span>Config</span>
                </Card>
            </section>
        </div>
    );
};

export default DashboardPage;
