import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import {
    DollarSign,
    TrendingUp,
    Clock,
    AlertTriangle,
    Filter,
    ArrowUpRight,
    Search,
    Plus,
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    Download
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, addMonths, isSameMonth, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, Button, Badge, Modal } from '../../../components/ui';
import type { PaymentStatus } from '../../../types/finance';
import { useToast } from '../../../components/ui/Toast';
import { exportToCSV, formatTransactionsForExport } from '../../../utils/export';
import { useFinanceMentees, useTransactions, useCreateTransactionBatch } from '../../../hooks/queries/useFinance';
import '../Finance.css';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

export const MentorshipFinance: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();

    // React Query Hooks
    const { data: transactions = [], isLoading: isLoadingTransactions } = useTransactions();
    const { data: mentees = [] } = useFinanceMentees();
    const createTransaction = useCreateTransactionBatch();

    const [selectedDate, setSelectedDate] = useState(new Date());

    // Calculate Real Stats based on Selected Date
    const stats = useMemo(() => {
        const startOfSelectedMonth = startOfMonth(selectedDate);
        const endOfSelectedMonth = endOfMonth(selectedDate);
        const startOfPreviousMonth = startOfMonth(subMonths(selectedDate, 1));
        const endOfPreviousMonth = endOfMonth(subMonths(selectedDate, 1));

        // 1. Monthly Revenue (Paid in Selected Month)
        const monthlyRevenue = transactions
            .filter(t => t.status === 'PAID' && t.paidAt && isWithinInterval(t.paidAt, { start: startOfSelectedMonth, end: endOfSelectedMonth }))
            .reduce((sum, t) => sum + t.amount, 0);

        // 2. Previous Month Revenue (for comparison)
        const previousMonthRevenue = transactions
            .filter(t => t.status === 'PAID' && t.paidAt && isWithinInterval(t.paidAt, { start: startOfPreviousMonth, end: endOfPreviousMonth }))
            .reduce((sum, t) => sum + t.amount, 0);

        // Growth Calculation
        const growth = previousMonthRevenue === 0 ? 0 : ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

        // 3. Pending Revenue (Due in Selected Month AND Status Pending)
        const pendingRevenue = transactions
            .filter(t => t.status === 'PENDING' && t.dueDate && isWithinInterval(t.dueDate, { start: startOfSelectedMonth, end: endOfSelectedMonth }))
            .reduce((sum, t) => sum + t.amount, 0);

        // 4. Projected (Realized + Pending for this month)
        const projectedRevenue = monthlyRevenue + pendingRevenue;

        // 5. Total Revenue (Lifetime) - Unaffected by date filter
        const totalRevenue = transactions.filter(t => t.status === 'PAID').reduce((sum, t) => sum + t.amount, 0);

        // 6. Overdue (Global Alert - Accumulative)
        const overdueTransactions = transactions.filter(t => t.status === 'OVERDUE');
        const overdueRevenue = overdueTransactions.reduce((sum, t) => sum + t.amount, 0);
        const overdueCount = overdueTransactions.length;

        return {
            totalRevenue,
            monthlyRevenue,
            projectedRevenue,
            pendingRevenue,
            overdueRevenue,
            overdueCount,
            growth,
            previousMonthRevenue
        };
    }, [transactions, selectedDate]);

    // Chart Data (Last 6 Months)
    const chartData = useMemo(() => {
        const end = new Date();
        const start = subMonths(end, 5);
        const months = eachMonthOfInterval({ start, end });

        return months.map(month => {
            const startMonth = startOfMonth(month);
            const endMonth = endOfMonth(month);

            const revenue = transactions
                .filter(t => t.status === 'PAID' && t.paidAt && isWithinInterval(t.paidAt, { start: startMonth, end: endMonth }))
                .reduce((sum, t) => sum + t.amount, 0);

            const pending = transactions
                .filter(t => t.status === 'PENDING' && t.dueDate && isWithinInterval(t.dueDate, { start: startMonth, end: endMonth }))
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                month: format(month, 'MMM', { locale: ptBR }).toUpperCase(),
                revenue,
                projected: revenue + pending
            };
        });
    }, [transactions]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewAll, setViewAll] = useState(false);
    const [showOnlyPending, setShowOnlyPending] = useState(false);

    // Form state
    const [newTx, setNewTx] = useState({
        menteeId: '',
        amount: '',
        status: 'PAID' as PaymentStatus,
        method: 'PIX',
        dueDate: new Date().toISOString().split('T')[0],
        isRecurrent: false,
        installments: 1
    });

    const handleAddTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedMentee = mentees.find(m => m.id === newTx.menteeId);

        createTransaction.mutate({
            newTx,
            menteeName: selectedMentee?.name || ''
        }, {
            onSuccess: () => {
                setIsModalOpen(false);
                toast.success(`${newTx.isRecurrent ? newTx.installments : 1} transação(ões) gerada(s)!`);
                setNewTx({
                    menteeId: '', amount: '', status: 'PAID', method: 'PIX',
                    dueDate: new Date().toISOString().split('T')[0],
                    isRecurrent: false, installments: 1
                });
            },
            onError: () => toast.error("Erro ao adicionar transação")
        });
    };

    const handleExport = () => {
        const formatted = formatTransactionsForExport(filteredTransactions);
        const fileName = `transacoes_${format(selectedDate, 'yyyy-MM', { locale: ptBR })}`;
        exportToCSV(formatted, fileName);
        toast.success(`${filteredTransactions.length} transações exportadas!`);
    };

    // Filter and Sort Transactions
    const filteredTransactions = transactions
        .filter(t => {
            if (showOnlyPending) return t.status === 'PENDING';

            const relevantDate = t.status === 'PAID' ? t.paidAt : t.dueDate;
            if (!relevantDate) return false;
            return isSameMonth(relevantDate, selectedDate);
        })
        .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());

    const displayedTransactions = viewAll ? filteredTransactions : filteredTransactions.slice(0, 5);

    const getStatusBadge = (status: PaymentStatus) => {
        switch (status) {
            case 'PAID': return <Badge variant="success">Pago</Badge>;
            case 'PENDING': return <Badge variant="warning">Pendente</Badge>;
            case 'OVERDUE': return <Badge variant="error">Atrasado</Badge>;
            case 'CANCELED': return <Badge variant="default">Cancelado</Badge>;
        }
    };

    const getMethodIcon = (status: PaymentStatus) => {
        if (status === 'PAID') return <ArrowUpRight size={18} />;
        if (status === 'PENDING') return <Clock size={18} />;
        if (status === 'OVERDUE') return <AlertTriangle size={18} />;
        return <DollarSign size={18} />;
    };

    if (isLoadingTransactions) {
        return <div className="p-8 text-center text-secondary">Carregando financeiro...</div>;
    }

    return (
        <div className="mentorship-finance">
            {/* Header Actions */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4 bg-secondary p-1 rounded-lg border border-subtle">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDate(prev => subMonths(prev, 1))}>
                        <ChevronLeft size={18} />
                    </Button>
                    <div className="flex items-center gap-2 px-2 font-medium min-w-[140px] justify-center">
                        <CalendarIcon size={16} className="text-muted" />
                        {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDate(prev => addMonths(prev, 1))}>
                        <ChevronRight size={18} />
                    </Button>
                </div>

                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        icon={<Download size={16} />}
                        onClick={handleExport}
                    >
                        Exportar
                    </Button>
                    <Button
                        variant="secondary"
                        icon={<Filter size={16} />}
                        onClick={() => {
                            setShowOnlyPending(!showOnlyPending);
                            toast.info(showOnlyPending ? 'Mostrando mês atual' : 'Filtrando pendentes (Geral)');
                        }}
                    >
                        {showOnlyPending ? 'Remover' : 'Pendentes'}
                    </Button>
                    <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
                        Adicionar
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="finance-stats-grid">
                <Card padding="md" className="finance-stat-card">
                    <span className="finance-stat-title">Receita Total (LTV)</span>
                    <span className="finance-stat-value">{formatCurrency(stats.totalRevenue)}</span>
                    <div className={`finance-stat-meta ${stats.growth >= 0 ? 'positive' : 'negative'}`}>
                        <TrendingUp size={14} className={stats.growth < 0 ? 'rotate-180' : ''} />
                        <span>{stats.growth >= 0 ? '+' : ''}{stats.growth.toFixed(1)}% vs anterior</span>
                    </div>
                </Card>

                <Card padding="md" className="finance-stat-card highlight">
                    <span className="finance-stat-title">Faturamento Este Mês</span>
                    <span className="finance-stat-value">{formatCurrency(stats.monthlyRevenue)}</span>
                    <div className="finance-stat-meta">
                        <span>Meta: {formatCurrency(stats.projectedRevenue)}</span>
                    </div>
                </Card>

                <Card padding="md" className="finance-stat-card warning">
                    <span className="finance-stat-title">A Receber (Pendente)</span>
                    <span className="finance-stat-value">{formatCurrency(stats.pendingRevenue)}</span>
                    <div className="finance-stat-meta">
                        <Clock size={14} />
                        <span>Próximos 30 dias</span>
                    </div>
                </Card>

                <Card padding="md" className="finance-stat-card error">
                    <span className="finance-stat-title">Em Atraso (Risco)</span>
                    <span className="finance-stat-value">{formatCurrency(stats.overdueRevenue)}</span>
                    <div className="finance-stat-meta negative">
                        <AlertTriangle size={14} />
                        <span>{stats.overdueCount} faturas vencidas</span>
                    </div>
                </Card>
            </div>

            {/* Content Grid */}
            <div className="finance-content-grid">
                {/* Revenue Chart */}
                <Card padding="lg" className="finance-chart-section">
                    <div className="chart-header">
                        <span className="chart-title">Evolução da Receita</span>
                    </div>

                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                                <XAxis
                                    dataKey="month"
                                    stroke="var(--text-secondary)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="var(--text-secondary)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `R$${value / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-card)',
                                        borderColor: 'var(--border-subtle)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)'
                                    }}
                                    formatter={(value: any) => [formatCurrency(Number(value) || 0), ''] as [string, string]}
                                    cursor={{ fill: 'var(--bg-secondary)' }}
                                />
                                <Legend />
                                <Bar
                                    name="Receita Realizada"
                                    dataKey="revenue"
                                    fill="#22c55e"
                                    radius={[4, 4, 0, 0]}
                                    barSize={30}
                                />
                                <Bar
                                    name="Previsão"
                                    dataKey="projected"
                                    fill="var(--text-tertiary)"
                                    radius={[4, 4, 0, 0]}
                                    barSize={30}
                                    opacity={0.3}
                                />
                                <ReferenceLine y={0} stroke="var(--border-subtle)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Recent Transactions */}
                <Card padding="lg" className="transactions-section">
                    <div className="chart-header">
                        <span className="chart-title">Transações Recentes</span>
                        <Button variant="ghost" size="sm" onClick={() => setViewAll(!viewAll)}>
                            {viewAll ? 'Ver menos' : 'Ver todas'}
                        </Button>
                    </div>

                    <div className="transactions-list">
                        {displayedTransactions.map(transaction => (
                            <div
                                key={transaction.id}
                                className="transaction-item clickable"
                                onClick={() => navigate(`/mentee/${transaction.menteeId}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="transaction-info">
                                    <div className={`transaction-icon ${transaction.status.toLowerCase()}`}>
                                        {getMethodIcon(transaction.status)}
                                    </div>
                                    <div className="transaction-details">
                                        <span className="transaction-title">{transaction.menteeName}</span>
                                        <span className="transaction-subtitle">
                                            {format(transaction.dueDate, "dd 'de' MMM", { locale: ptBR })} • {transaction.method}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="transaction-amount">
                                        {formatCurrency(transaction.amount)}
                                    </div>
                                    <div style={{ marginTop: 4 }}>
                                        {getStatusBadge(transaction.status)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {displayedTransactions.length === 0 && (
                        <div className="empty-state">
                            <Search size={24} />
                            <p>Nenhuma transação encontrada</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Add Transaction Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nova Transação"
            >
                <form onSubmit={handleAddTransaction} className="modal-content-form">
                    <div className="form-group">
                        <label>Mentorado / Cliente</label>
                        <select
                            required
                            className="input-field"
                            value={newTx.menteeId}
                            onChange={e => setNewTx({ ...newTx, menteeId: e.target.value })}
                        >
                            <option value="">Selecione...</option>
                            {mentees.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-row-2">
                        <div className="form-group">
                            <label>Valor (R$)</label>
                            <input
                                required
                                type="number"
                                className="input-field"
                                placeholder="0,00"
                                value={newTx.amount}
                                onChange={e => setNewTx({ ...newTx, amount: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Vencimento</label>
                            <input
                                required
                                type="date"
                                className="input-field"
                                value={newTx.dueDate}
                                onChange={e => setNewTx({ ...newTx, dueDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group mb-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isRecurrent"
                                className="w-4 h-4"
                                checked={newTx.isRecurrent}
                                onChange={e => setNewTx({ ...newTx, isRecurrent: e.target.checked })}
                            />
                            <label htmlFor="isRecurrent" className="text-sm text-primary cursor-pointer select-none">
                                É parcelado / recorrente?
                            </label>
                        </div>
                    </div>

                    {newTx.isRecurrent && (
                        <div className="form-group">
                            <label>Número de Parcelas</label>
                            <input
                                type="number"
                                min="2"
                                max="24"
                                className="input-field"
                                value={newTx.installments}
                                onChange={e => setNewTx({ ...newTx, installments: Number(e.target.value) })}
                            />
                            <p className="text-xs text-secondary mt-1">
                                O valor total será dividido por {newTx.installments}. As parcelas subsequentes serão criadas como PENDENTE mensais.
                            </p>
                        </div>
                    )}

                    <div className="form-row-2">
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                className="input-field"
                                value={newTx.status}
                                onChange={e => setNewTx({ ...newTx, status: e.target.value as PaymentStatus })}
                            >
                                <option value="PAID">Pago</option>
                                <option value="PENDING">Pendente</option>
                                <option value="OVERDUE">Atrasado</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Método</label>
                            <select
                                className="input-field"
                                value={newTx.method}
                                onChange={e => setNewTx({ ...newTx, method: e.target.value })}
                            >
                                <option value="PIX">Pix</option>
                                <option value="CHECKOUT_CARD">Cartão</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-actions">
                        <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" type="submit" disabled={createTransaction.isPending}>
                            {createTransaction.isPending ? 'Adicionando...' : 'Adicionar'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
