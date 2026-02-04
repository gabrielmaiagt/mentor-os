import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import { db as firestore } from '../../../lib/firebase';
import {
    Plus,
    Edit2,
    Save,
    TrendingUp,
    DollarSign,
    Users,
    Target,
    Calendar,
    ChevronDown,
    BarChart3,
    Trash2
} from 'lucide-react';
import { Button, Input, Modal } from '../../../components/ui';
import { useToast } from '../../../components/ui/Toast';
import type { OfferTracker, DailyAdStats } from '../../../types';
import { format, subDays, startOfWeek, startOfMonth, startOfYear, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './TrafficFinance.css';

type PeriodFilter = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'TOTAL';

const PERIOD_LABELS: Record<PeriodFilter, string> = {
    TODAY: 'Hoje',
    YESTERDAY: 'Ontem',
    WEEK: 'Semana',
    MONTH: 'Mês',
    YEAR: 'Ano',
    TOTAL: 'Total'
};

const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

interface TrafficFinanceProps {
    menteeId?: string;  // If provided, show data for this mentee (mentor view)
    readOnly?: boolean; // If true, hide edit/delete/create buttons
}

export const TrafficFinance: React.FC<TrafficFinanceProps> = ({ menteeId, readOnly = false }) => {
    const { user } = useAuth();
    const toast = useToast();

    // Use menteeId if provided, otherwise use current user's ID
    const targetUserId = menteeId || user?.id;

    // State
    const [offers, setOffers] = useState<OfferTracker[]>([]);
    const [stats, setStats] = useState<DailyAdStats[]>([]);
    const [selectedOfferId, setSelectedOfferId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Date Selection
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('MONTH');

    // Modals
    const [showNewOfferModal, setShowNewOfferModal] = useState(false);
    const [newOfferName, setNewOfferName] = useState('');
    const [newOfferType, setNewOfferType] = useState<'DIRECT' | 'X1'>('DIRECT');

    // Input Form State
    const [inputForm, setInputForm] = useState({
        spend: '',
        revenue: '',
        leads: '',
        pixGenerated: '',
        pixPaid: ''
    });

    // Fetch Offers
    useEffect(() => {
        if (!targetUserId) return;
        const q = query(collection(firestore, 'offer_trackers'), where('userId', '==', targetUserId), where('status', '==', 'ACTIVE'));
        const unsub = onSnapshot(q, (snapshot) => {
            const loaded = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OfferTracker));
            setOffers(loaded);
            if (loaded.length > 0 && !selectedOfferId) {
                setSelectedOfferId(loaded[0].id);
            }
            setLoading(false);
        });
        return () => unsub();
    }, [targetUserId]);

    // Fetch Stats for Selected Offer
    useEffect(() => {
        if (!selectedOfferId) return;
        const q = query(collection(firestore, 'daily_stats'), where('offerId', '==', selectedOfferId));
        const unsub = onSnapshot(q, (snapshot) => {
            setStats(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DailyAdStats)));
        });
        return () => unsub();
    }, [selectedOfferId]);

    const handleCreateOffer = async () => {
        if (!newOfferName.trim() || !user) return;
        try {
            await addDoc(collection(firestore, 'offer_trackers'), {
                userId: user.id,
                name: newOfferName,
                type: newOfferType,
                status: 'ACTIVE',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            toast.success('Oferta criada!');
            setShowNewOfferModal(false);
            setNewOfferName('');
        } catch (e) {
            console.error(e);
            toast.error('Erro ao criar oferta');
        }
    };

    const handleSaveDailyStat = async () => {
        if (!selectedOfferId) return;

        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const existingStat = stats.find(s => s.date === dateStr);

        const data = {
            offerId: selectedOfferId,
            date: dateStr,
            spend: Number(inputForm.spend) || 0,
            revenue: Number(inputForm.revenue) || 0,
            leads: Number(inputForm.leads) || 0,
            pixGenerated: Number(inputForm.pixGenerated) || 0,
            pixPaid: Number(inputForm.pixPaid) || 0
        };

        try {
            if (existingStat) {
                await updateDoc(doc(firestore, 'daily_stats', existingStat.id), data);
                toast.success('Dados atualizados!');
            } else {
                await addDoc(collection(firestore, 'daily_stats'), data);
                toast.success('Dados salvos!');
            }
        } catch (e) {
            console.error(e);
            toast.error('Erro ao salvar dados');
        }
    };

    const handleDeleteStat = async (statId: string) => {
        if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;
        try {
            await deleteDoc(doc(firestore, 'daily_stats', statId));
            toast.success('Lançamento excluído!');
        } catch (e) {
            console.error(e);
            toast.error('Erro ao excluir');
        }
    };

    // Load form when date changes
    useEffect(() => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const stat = stats.find(s => s.date === dateStr);
        if (stat) {
            setInputForm({
                spend: stat.spend.toString(),
                revenue: stat.revenue.toString(),
                leads: stat.leads?.toString() || '',
                pixGenerated: stat.pixGenerated?.toString() || '',
                pixPaid: stat.pixPaid?.toString() || ''
            });
        } else {
            setInputForm({ spend: '', revenue: '', leads: '', pixGenerated: '', pixPaid: '' });
        }
    }, [selectedDate, stats]);

    const selectedOffer = offers.find(o => o.id === selectedOfferId);

    // Calculations
    const calculateMetrics = (stat: DailyAdStats) => {
        const profit = stat.revenue - stat.spend;
        const roi = stat.spend > 0 ? (stat.revenue / stat.spend) : 0;
        const cpl = (stat.leads && stat.leads > 0) ? stat.spend / stat.leads : 0;
        const conversion = (stat.leads && stat.pixPaid) ? (stat.pixPaid / stat.leads) * 100 : 0;
        return { profit, roi, cpl, conversion };
    };

    // Filter stats by period
    const filteredStats = useMemo(() => {
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');
        const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const monthStart = startOfMonth(today);
        const yearStart = startOfYear(today);

        return stats.filter(s => {
            const statDate = parseISO(s.date);
            switch (periodFilter) {
                case 'TODAY':
                    return s.date === todayStr;
                case 'YESTERDAY':
                    return s.date === yesterdayStr;
                case 'WEEK':
                    return isAfter(statDate, subDays(weekStart, 1));
                case 'MONTH':
                    return isAfter(statDate, subDays(monthStart, 1));
                case 'YEAR':
                    return isAfter(statDate, subDays(yearStart, 1));
                case 'TOTAL':
                default:
                    return true;
            }
        });
    }, [stats, periodFilter]);

    const aggregated = useMemo(() => {
        const totalSpend = filteredStats.reduce((acc, s) => acc + s.spend, 0);
        const totalRevenue = filteredStats.reduce((acc, s) => acc + s.revenue, 0);
        const totalProfit = totalRevenue - totalSpend;
        const totalLeads = filteredStats.reduce((acc, s) => acc + (s.leads || 0), 0);
        const totalSales = filteredStats.reduce((acc, s) => acc + (s.pixPaid || 0), 0);
        const globalRoi = totalSpend > 0 ? totalRevenue / totalSpend : 0;
        const globalCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
        return { totalSpend, totalRevenue, totalProfit, totalLeads, totalSales, globalRoi, globalCpl };
    }, [filteredStats]);

    if (loading) return <div className="traffic-loading">Carregando...</div>;

    return (
        <div className="traffic-finance-redesign">
            {/* Offer Selector Header */}
            <header className="traffic-header">
                <div className="traffic-header-left">
                    <div className="offer-selector-wrapper">
                        <label>Oferta Ativa</label>
                        <div className="offer-selector">
                            <select
                                value={selectedOfferId}
                                onChange={(e) => setSelectedOfferId(e.target.value)}
                            >
                                {offers.map(o => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                                {offers.length === 0 && <option>Nenhuma oferta</option>}
                            </select>
                            <ChevronDown size={16} className="select-icon" />
                        </div>
                        {selectedOffer && (
                            <span className={`offer-type-badge ${selectedOffer.type.toLowerCase()}`}>
                                {selectedOffer.type === 'DIRECT' ? 'Venda Direta' : 'WhatsApp X1'}
                            </span>
                        )}
                    </div>
                </div>
                {!readOnly && (
                    <Button
                        variant="primary"
                        size="sm"
                        icon={<Plus size={16} />}
                        onClick={() => setShowNewOfferModal(true)}
                    >
                        Nova Oferta
                    </Button>
                )}
            </header>

            {/* Main Content */}
            <div className="traffic-content">
                {/* Period Filter */}
                <div className="period-filter-section">
                    <div className="premium-tabs compact">
                        {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map(period => (
                            <button
                                key={period}
                                className={`premium-tab ${periodFilter === period ? 'active' : ''}`}
                                onClick={() => setPeriodFilter(period)}
                            >
                                {PERIOD_LABELS[period]}
                            </button>
                        ))}
                    </div>
                    <span className="period-stats-count">{filteredStats.length} lançamentos</span>
                </div>

                {/* KPI Cards */}
                <section className="kpi-section">
                    <div className="kpi-grid">
                        {/* Faturamento */}
                        <div className="kpi-card revenue">
                            <div className="kpi-icon">
                                <TrendingUp size={24} />
                            </div>
                            <div className="kpi-data">
                                <span className="kpi-label">Faturamento</span>
                                <span className="kpi-value">
                                    {formatCurrency(aggregated.totalRevenue)}
                                </span>
                            </div>
                        </div>

                        {/* Lucro */}
                        <div className="kpi-card profit">
                            <div className="kpi-icon">
                                <DollarSign size={24} />
                            </div>
                            <div className="kpi-data">
                                <span className="kpi-label">Lucro Total</span>
                                <span className={`kpi-value ${aggregated.totalProfit >= 0 ? 'positive' : 'negative'}`}>
                                    {formatCurrency(aggregated.totalProfit)}
                                </span>
                            </div>
                        </div>

                        {/* ROAS */}
                        <div className="kpi-card roas">
                            <div className="kpi-icon">
                                <BarChart3 size={24} />
                            </div>
                            <div className="kpi-data">
                                <span className="kpi-label">ROAS</span>
                                <span className="kpi-value">{aggregated.globalRoi.toFixed(2)}x</span>
                            </div>
                        </div>

                        {selectedOffer?.type === 'X1' ? (
                            <>
                                <div className="kpi-card cpl">
                                    <div className="kpi-icon">
                                        <Target size={24} />
                                    </div>
                                    <div className="kpi-data">
                                        <span className="kpi-label">Custo/Lead</span>
                                        <span className="kpi-value">{formatCurrency(aggregated.globalCpl)}</span>
                                    </div>
                                </div>
                                <div className="kpi-card sales">
                                    <div className="kpi-icon">
                                        <Users size={24} />
                                    </div>
                                    <div className="kpi-data">
                                        <span className="kpi-label">Vendas</span>
                                        <span className="kpi-value">{aggregated.totalSales}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="kpi-card margin">
                                <div className="kpi-icon">
                                    <Target size={24} />
                                </div>
                                <div className="kpi-data">
                                    <span className="kpi-label">Margem</span>
                                    <span className="kpi-value">
                                        {aggregated.totalRevenue > 0 ? ((aggregated.totalProfit / aggregated.totalRevenue) * 100).toFixed(0) : 0}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Chart Section */}
                <section className="chart-section">
                    <div className="section-card">
                        <div className="section-header">
                            <div className="section-title">
                                <TrendingUp size={18} />
                                <h3>Faturamento & Lucro</h3>
                            </div>
                        </div>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={[...stats].sort((a, b) => a.date.localeCompare(b.date)).slice(-15).map(s => ({
                                    date: format(new Date(s.date + 'T12:00:00'), 'dd/MM'),
                                    faturamento: s.revenue,
                                    lucro: s.revenue - s.spend
                                }))}>
                                    <defs>
                                        <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gradientProfit" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 11 }}
                                        tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(15, 23, 42, 0.95)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                        formatter={(value: number) => formatCurrency(value)}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="faturamento"
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        fill="url(#gradientRevenue)"
                                        name="Faturamento"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="lucro"
                                        stroke="#22c55e"
                                        strokeWidth={2}
                                        fill="url(#gradientProfit)"
                                        name="Lucro"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>

                {/* Two Column Layout */}
                <div className={`traffic-grid ${readOnly ? 'read-only' : ''}`}>
                    {/* Input Form - Only show if not readOnly */}
                    {!readOnly && (
                        <section className="input-section">
                            <div className="section-card">
                                <div className="section-header">
                                    <div className="section-title">
                                        <Edit2 size={18} />
                                        <h3>Lançamento Diário</h3>
                                    </div>
                                    <div className="date-picker">
                                        <Calendar size={14} />
                                        <input
                                            type="date"
                                            value={format(selectedDate, 'yyyy-MM-dd')}
                                            onChange={(e) => {
                                                // Use T12:00:00 to avoid timezone offset issues
                                                const newDate = new Date(e.target.value + 'T12:00:00');
                                                if (!isNaN(newDate.getTime())) {
                                                    setSelectedDate(newDate);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="current-date-display">
                                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                </div>

                                <div className="input-form">
                                    <div className="input-row">
                                        <div className="input-group spend">
                                            <label>Gasto (Ads)</label>
                                            <div className="input-wrapper">
                                                <span className="input-prefix">R$</span>
                                                <Input
                                                    type="number"
                                                    placeholder="0,00"
                                                    value={inputForm.spend}
                                                    onChange={e => setInputForm({ ...inputForm, spend: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="input-group revenue">
                                            <label>Retorno (Vendas)</label>
                                            <div className="input-wrapper">
                                                <span className="input-prefix">R$</span>
                                                <Input
                                                    type="number"
                                                    placeholder="0,00"
                                                    value={inputForm.revenue}
                                                    onChange={e => setInputForm({ ...inputForm, revenue: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {selectedOffer?.type === 'X1' && (
                                        <>
                                            <div className="input-row">
                                                <div className="input-group">
                                                    <label>Conversas (Leads)</label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={inputForm.leads}
                                                        onChange={e => setInputForm({ ...inputForm, leads: e.target.value })}
                                                    />
                                                </div>
                                                <div className="input-group">
                                                    <label>Vendas</label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={inputForm.pixPaid}
                                                        onChange={e => setInputForm({ ...inputForm, pixPaid: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <Button
                                        variant="primary"
                                        fullWidth
                                        icon={<Save size={16} />}
                                        onClick={handleSaveDailyStat}
                                        className="save-button"
                                    >
                                        Salvar Lançamento
                                    </Button>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* History Table */}
                    <section className="history-section">
                        <div className="section-card">
                            <div className="section-header">
                                <div className="section-title">
                                    <BarChart3 size={18} />
                                    <h3>Histórico</h3>
                                </div>
                                <span className="record-count">{stats.length} lançamentos</span>
                            </div>

                            <div className="table-container">
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th className="text-right">Gasto</th>
                                            <th className="text-right">Retorno</th>
                                            <th className="text-right">Lucro</th>
                                            <th className="text-right">ROAS</th>
                                            {selectedOffer?.type === 'X1' && (
                                                <>
                                                    <th className="text-center">Leads</th>
                                                    <th className="text-right">CPL</th>
                                                </>
                                            )}
                                            {!readOnly && <th className="text-center">Ações</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...stats].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map((stat, i) => {
                                            const m = calculateMetrics(stat);
                                            return (
                                                <tr key={stat.id} className={i % 2 === 0 ? 'even' : 'odd'}>
                                                    <td className="date-cell">
                                                        {format(new Date(stat.date + 'T12:00:00'), 'dd/MM')}
                                                    </td>
                                                    <td className="text-right spend-value">{formatCurrency(stat.spend)}</td>
                                                    <td className="text-right revenue-value">{formatCurrency(stat.revenue)}</td>
                                                    <td className={`text-right profit-value ${m.profit >= 0 ? 'positive' : 'negative'}`}>
                                                        {formatCurrency(m.profit)}
                                                    </td>
                                                    <td className="text-right">{m.roi.toFixed(2)}x</td>
                                                    {selectedOffer?.type === 'X1' && (
                                                        <>
                                                            <td className="text-center">{stat.leads}</td>
                                                            <td className="text-right">{formatCurrency(m.cpl)}</td>
                                                        </>
                                                    )}
                                                    {!readOnly && (
                                                        <td className="text-center actions-cell">
                                                            <button
                                                                className="edit-btn"
                                                                onClick={() => setSelectedDate(new Date(stat.date + 'T12:00:00'))}
                                                                title="Editar"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                className="delete-btn"
                                                                onClick={() => handleDeleteStat(stat.id)}
                                                                title="Excluir"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                        {stats.length === 0 && (
                                            <tr>
                                                <td colSpan={selectedOffer?.type === 'X1' ? 8 : 6} className="empty-state">
                                                    Nenhum lançamento ainda. Comece adicionando dados!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* New Offer Modal */}
            <Modal isOpen={showNewOfferModal} onClose={() => setShowNewOfferModal(false)} title="Nova Oferta">
                <div className="new-offer-form">
                    <div className="form-field">
                        <label>Nome da Oferta</label>
                        <Input
                            value={newOfferName}
                            onChange={e => setNewOfferName(e.target.value)}
                            placeholder="Ex: Produto X - Escala"
                        />
                    </div>
                    <div className="form-field">
                        <label>Tipo de Funil</label>
                        <div className="type-selector">
                            <button
                                className={`type-option ${newOfferType === 'DIRECT' ? 'active' : ''}`}
                                onClick={() => setNewOfferType('DIRECT')}
                            >
                                <DollarSign size={20} />
                                <span className="type-name">Venda Direta</span>
                                <span className="type-desc">Tráfego direto para VSL/Checkout</span>
                            </button>
                            <button
                                className={`type-option ${newOfferType === 'X1' ? 'active' : ''}`}
                                onClick={() => setNewOfferType('X1')}
                            >
                                <Users size={20} />
                                <span className="type-name">WhatsApp X1</span>
                                <span className="type-desc">Funil de conversão via chat</span>
                            </button>
                        </div>
                    </div>
                    <div className="modal-actions">
                        <Button variant="ghost" onClick={() => setShowNewOfferModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleCreateOffer}>Criar Oferta</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
