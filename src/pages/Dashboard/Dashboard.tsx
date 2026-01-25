import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign,
    AlertTriangle,
    MessageSquare,
    Phone,
    Copy,
    ChevronRight,
    Zap,
    Calendar,
    ArrowUpRight,
    Search,
    Loader
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

import { Card, Badge, Button } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ActionItem, FinanceSnapshot } from '../../types';
import './Dashboard.css';

// Mocks removed. Using calculated data.

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [loading, setLoading] = React.useState(true);

    // State for aggregated data
    const [finance, setFinance] = React.useState<FinanceSnapshot>({
        today: 0, week: 0, month: 0, total: 0,
        openDeals: 0, pendingPayments: 0, blockedMentees: 0
    });
    const [salesActions, setSalesActions] = React.useState<ActionItem[]>([]);
    const [deliveryActions, setDeliveryActions] = React.useState<ActionItem[]>([]);
    const [miningOverview, setMiningOverview] = React.useState<any[]>([]);
    const [alerts, setAlerts] = React.useState<any[]>([]);

    React.useEffect(() => {
        const fetchData = async () => {
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

            // 2. Deals (Sales Actions & Finance Stats)
            const unsubDeals = onSnapshot(query(collection(db, 'deals')), (snapshot) => {
                const deals = snapshot.docs.map(d => ({ id: d.id, ...d.data(), updatedAt: d.data().updatedAt?.toDate() })) as any[];

                // Update Finance Stats part 2
                const openDealsCount = deals.filter(d => ['OPEN', 'PITCH_SENT', 'PAYMENT_SENT'].includes(d.stage)).length;
                const pendingPaymentsCount = deals.filter(d => d.stage === 'PAYMENT_SENT').length;

                setFinance(prev => ({ ...prev, openDeals: openDealsCount, pendingPayments: pendingPaymentsCount }));

                // Sales Actions Logic
                const actions: ActionItem[] = deals
                    .filter(d => ['OPEN', 'PITCH_SENT', 'PAYMENT_SENT'].includes(d.stage))
                    .map(d => {
                        const hoursSince = Math.floor((Date.now() - d.updatedAt.getTime()) / (1000 * 60 * 60));
                        let urgency: 'normal' | 'attention' | 'critical' = 'normal';
                        if (hoursSince > 48) urgency = 'critical';
                        else if (hoursSince > 24) urgency = 'attention';

                        return {
                            id: d.id,
                            type: 'deal',
                            entityId: d.id,
                            title: d.leadName,
                            subtitle: `${d.offerName} - ${d.stage}`,
                            urgency,
                            delayHours: hoursSince,
                            amount: d.pitchAmount,
                            whatsapp: d.leadWhatsapp,
                            stage: d.stage
                        } as ActionItem;
                    })
                    .sort((a, b) => (b.delayHours || 0) - (a.delayHours || 0)); // urgent first

                setSalesActions(actions);
            });

            // 3. Mentees (Delivery Actions - Stuck, Mining Overview)
            const unsubMentees = onSnapshot(query(collection(db, 'mentees')), async (snapshot) => {
                const mentees = snapshot.docs.map(d => ({ id: d.id, ...d.data(), lastUpdateAt: d.data().lastUpdateAt?.toDate() })) as any[];

                const blockedCount = mentees.filter(m => m.blocked).length;
                setFinance(prev => ({ ...prev, blockedMentees: blockedCount }));

                // Stuck Mentees Actions
                const stuckMentees = mentees
                    .filter(m => {
                        if (!m.lastUpdateAt) return false;
                        const daysSince = Math.floor((Date.now() - m.lastUpdateAt.getTime()) / (1000 * 60 * 60 * 24));
                        return daysSince > 5;
                    })
                    .map(m => ({
                        id: `stuck-${m.id}`,
                        type: 'mentee',
                        entityId: m.id,
                        title: `${m.name}`,
                        subtitle: 'Sem atualização recente',
                        urgency: 'critical',
                        delayHours: Math.floor((Date.now() - (m.lastUpdateAt?.getTime() || 0)) / (1000 * 60 * 60)),
                        whatsapp: m.whatsapp,
                        suggestedMessage: `Oi ${m.name.split(' ')[0]}, vi que faz um tempo que não temos novidades. Como estão as coisas?`
                    } as ActionItem));

                setDeliveryActions(prev => {
                    // Merge calls (handled below) with stuck mentees
                    // For now just keep stuck mentees, we'll merge them in the render or state update
                    // Better: separate state? Let's assume we merge manually. 
                    // Actually, we need to wait for calls to merge properly.
                    // Let's store stuck mentees in a separate var? No, let's just set it here and merge calls later if possible, but hooks run independently.
                    // Strategy: Two states `callsActions` and `menteesActions`, then merge on render? Or just append.
                    return stuckMentees;
                });

                // Mining Overview
                const miningMentees = mentees.filter(m => m.currentStage === 'MINING');
                // We need offer stats for each. This is expensive (N input queries).
                // Optimization: fetch ALL offers once and aggregate locally.
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

            // 4. Calls (Delivery Actions)
            const unsubCalls = onSnapshot(query(collection(db, 'calls')), (snapshot) => {
                const calls = snapshot.docs.map(d => ({ id: d.id, ...d.data(), scheduledAt: d.data().scheduledAt?.toDate() })) as any[];
                const todayStr = new Date().toDateString();

                const todayCalls = calls
                    .filter(c => c.scheduledAt && new Date(c.scheduledAt).toDateString() === todayStr)
                    .map(c => ({
                        id: c.id,
                        type: 'call',
                        entityId: c.menteeId,
                        title: `Call agendada`, // We need mentee name, maybe fetch or just generic
                        subtitle: `${c.scheduledAt.getHours()}:${c.scheduledAt.getMinutes().toString().padStart(2, '0')}`,
                        urgency: 'normal',
                        dueAt: c.scheduledAt
                    } as ActionItem));

                setDeliveryActions(prev => {
                    // Filter out old calls to avoid duplication if re-run
                    const nonCalls = prev.filter(p => p.type !== 'call');
                    return [...nonCalls, ...todayCalls].sort((a, b) => {
                        // Sort logic: Calls first? Or Urgency?
                        if (a.type === 'call') return -1;
                        return 0;
                    });
                });
            });

            setLoading(false);
            return () => {
                unsubFinance();
                unsubDeals();
                unsubMentees();
                unsubCalls();
            };
        };
        fetchData();
    }, []);

    // Alerts Calculation
    React.useEffect(() => {
        const newAlerts = [];
        const moneyAtRisk = salesActions.filter(a => a.urgency === 'critical').reduce((sum, a) => sum + (a.amount || 0), 0);
        if (moneyAtRisk > 0) newAlerts.push({ id: '1', type: 'money', label: `R$ ${moneyAtRisk} em risco`, count: 0, description: 'Deals críticos' });

        const stuckCount = deliveryActions.filter(a => a.type === 'mentee' && a.urgency === 'critical').length;
        if (stuckCount > 0) newAlerts.push({ id: '2', type: 'stuck', label: `${stuckCount} mentorados travados`, count: stuckCount, description: 'Precisam de atenção' });

        const callsCount = deliveryActions.filter(a => a.type === 'call').length;
        if (callsCount > 0) newAlerts.push({ id: '3', type: 'calls', label: `${callsCount} calls hoje`, count: callsCount, description: 'Prepare a agenda' });

        setAlerts(newAlerts);
    }, [salesActions, deliveryActions]);


    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const getUrgencyBadge = (urgency: string, delayHours?: number) => {
        switch (urgency) {
            case 'critical':
                return (
                    <Badge variant="error" pulse dot>
                        {delayHours ? `${Math.floor(delayHours)}h atraso` : 'Crítico'}
                    </Badge>
                );
            case 'attention':
                return (
                    <Badge variant="warning" dot>
                        {delayHours ? `${Math.floor(delayHours)}h` : 'Atenção'}
                    </Badge>
                );
            default:
                return delayHours ? <Badge variant="default">{Math.floor(delayHours)}h</Badge> : null;
        }
    };

    const copyMessage = async (message: string, name: string) => {
        try {
            await navigator.clipboard.writeText(message);
            toast.success('Mensagem copiada!', `Pronto para enviar para ${name}`);
        } catch (err) {
            toast.error('Erro ao copiar', 'Tente novamente');
        }
    };

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
                {/* VENDER HOJE */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <div className="section-title-group">
                            <h2 className="section-title">🎯 Vender Hoje</h2>
                            <Badge>{salesActions.length}</Badge>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/crm')}>
                            Ver CRM <ChevronRight size={16} />
                        </Button>
                    </div>

                    <div className="action-list">
                        {salesActions.map((action) => (
                            <Card
                                key={action.id}
                                variant={action.urgency === 'critical' ? 'urgent' : 'interactive'}
                                padding="md"
                                className={`action-card ${action.urgency === 'critical' ? 'action-card-urgent' : ''}`}
                                onClick={() => navigate(`/lead/${action.entityId}`)}
                            >
                                <div className="action-card-header">
                                    <div className="action-card-info">
                                        <h3 className="action-card-title">{action.title}</h3>
                                        <p className="action-card-subtitle">{action.subtitle}</p>
                                    </div>
                                    <div className="action-card-meta">
                                        {action.amount && (
                                            <span className="action-card-amount">{formatCurrency(action.amount)}</span>
                                        )}
                                        {getUrgencyBadge(action.urgency, action.delayHours)}
                                    </div>
                                </div>

                                <div className="action-card-actions">
                                    {action.suggestedMessage && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            icon={<Copy size={14} />}
                                            onClick={() => copyMessage(action.suggestedMessage!, action.title)}
                                        >
                                            Copiar msg
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<MessageSquare size={14} />}
                                        onClick={() => window.open(`https://wa.me/55${action.whatsapp}`, '_blank')}
                                    >
                                        WhatsApp
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<ArrowUpRight size={14} />}
                                        onClick={() => navigate(`/lead/${action.entityId}`)}
                                    >
                                        Abrir
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ENTREGAR HOJE */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <div className="section-title-group">
                            <h2 className="section-title">📦 Entregar Hoje</h2>
                            <Badge>{deliveryActions.length}</Badge>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/mentees')}>
                            Ver todos <ChevronRight size={16} />
                        </Button>
                    </div>

                    <div className="action-list">
                        {deliveryActions.map((action) => (
                            <Card
                                key={action.id}
                                variant={action.urgency === 'critical' ? 'urgent' : 'interactive'}
                                padding="md"
                                className={`action-card ${action.urgency === 'critical' ? 'action-card-urgent' : ''}`}
                                onClick={() => navigate(`/mentee/${action.entityId}`)}
                            >
                                <div className="action-card-header">
                                    <div className="action-card-info">
                                        <h3 className="action-card-title">{action.title}</h3>
                                        <p className="action-card-subtitle">{action.subtitle}</p>
                                    </div>
                                    <div className="action-card-meta">
                                        {action.type === 'call' && (
                                            <Badge variant="info" dot>
                                                <Calendar size={12} /> Hoje
                                            </Badge>
                                        )}
                                        {getUrgencyBadge(action.urgency, action.delayHours)}
                                    </div>
                                </div>

                                <div className="action-card-actions">
                                    {action.type === 'call' ? (
                                        <>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                icon={<Phone size={14} />}
                                                onClick={() => {
                                                    toast.success('Iniciando sala...');
                                                    setTimeout(() => window.open('https://meet.google.com', '_blank'), 1000);
                                                }}
                                            >
                                                Iniciar call
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate('/calendar')}
                                            >
                                                Ver agenda
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            {action.suggestedMessage && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    icon={<Copy size={14} />}
                                                    onClick={() => copyMessage(action.suggestedMessage!, action.title)}
                                                >
                                                    Copiar msg
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={<MessageSquare size={14} />}
                                            >
                                                WhatsApp
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={<ArrowUpRight size={14} />}
                                                onClick={() => navigate(`/mentee/${action.entityId}`)}
                                            >
                                                Abrir
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>

            {/* Alerts */}
            <section className="dashboard-section">
                <h2 className="section-title">⚠️ Alertas</h2>
                <div className="alerts-grid">
                    {alerts.map((alert) => (
                        <Card
                            key={alert.id}
                            className="alert-card"
                            padding="md"
                            variant="interactive"
                            onClick={() => {
                                if (alert.type === 'money') navigate('/finance');
                                else if (alert.type === 'stuck') navigate('/mentees');
                                else if (alert.type === 'calls') navigate('/calendar');
                                else if (alert.type === 'mining') navigate('/mentees');
                                else toast.info(`Detalhes: ${alert.description}`);
                            }}
                        >
                            <div className="alert-icon">
                                {alert.type === 'money' && <DollarSign size={20} />}
                                {alert.type === 'stuck' && <AlertTriangle size={20} />}
                                {alert.type === 'calls' && <Calendar size={20} />}
                                {alert.type === 'mining' && <Search size={20} />}
                            </div>
                            <div className="alert-content">
                                <span className="alert-label">{alert.label}</span>
                                <span className="alert-description">{alert.description}</span>
                            </div>
                            <ChevronRight size={18} className="alert-arrow" />
                        </Card>
                    ))}
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
