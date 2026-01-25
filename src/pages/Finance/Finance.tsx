import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
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
    Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, Button, Badge, Modal } from '../../components/ui';
// Mock data removed
import type { PaymentStatus } from '../../types/finance';
import { useToast } from '../../components/ui/Toast';
import './Finance.css';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const FinancePage: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();

    const [transactions, setTransactions] = useState<any[]>([]);
    const [mentees, setMentees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch Transactions
    useEffect(() => {
        const q = query(collection(db, 'transactions'), orderBy('dueDate', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTransactions(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                dueDate: doc.data().dueDate?.toDate(),
                paidAt: doc.data().paidAt?.toDate(),
                createdAt: doc.data().createdAt?.toDate()
            })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Fetch Mentees for Dropdown
    useEffect(() => {
        const q = query(collection(db, 'mentees'), orderBy('name', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMentees(snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name
            })));
        });
        return () => unsubscribe();
    }, []);

    // Calculate Real Stats
    const stats = useMemo(() => {
        const total = transactions.filter(t => t.status === 'PAID').reduce((sum, t) => sum + t.amount, 0);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthly = transactions
            .filter(t => t.status === 'PAID' && t.paidAt >= startOfMonth)
            .reduce((sum, t) => sum + t.amount, 0);

        const pending = transactions.filter(t => t.status === 'PENDING').reduce((sum, t) => sum + t.amount, 0);
        const overdue = transactions.filter(t => t.status === 'OVERDUE').reduce((sum, t) => sum + t.amount, 0);

        return {
            totalRevenue: total,
            monthlyRevenue: monthly,
            projectedRevenue: monthly + pending, // Simple projection
            pendingRevenue: pending,
            overdueRevenue: overdue
        };
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
        dueDate: new Date().toISOString().split('T')[0]
    });

    const handleAddTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const selectedMentee = mentees.find(m => m.id === newTx.menteeId);
            await addDoc(collection(db, 'transactions'), {
                menteeId: newTx.menteeId,
                menteeName: selectedMentee?.name || 'Desconhecido',
                description: 'Transação Manual',
                amount: Number(newTx.amount),
                status: newTx.status,
                method: newTx.method,
                dueDate: new Date(newTx.dueDate),
                paidAt: newTx.status === 'PAID' ? new Date() : null,
                createdAt: new Date(),
                createdBy: auth.currentUser?.uid
            });
            setIsModalOpen(false);
            toast.success('Transação adicionada!');
            setNewTx({ menteeId: '', amount: '', status: 'PAID', method: 'PIX', dueDate: new Date().toISOString().split('T')[0] });
        } catch (error) {
            console.error("Error adding transaction:", error);
            toast.error("Erro ao adicionar transação");
        }
    };

    // Filter and Sort
    const filteredTransactions = transactions
        .filter(t => !showOnlyPending || t.status === 'PENDING')
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

    if (loading) {
        return <div className="p-8 text-center text-secondary">Carregando financeiro...</div>;
    }

    return (
        <div className="finance-page">
            {/* Header */}
            <div className="finance-header">
                <div>
                    <h1>Financeiro</h1>
                    <p>Visão geral do faturamento e fluxo de caixa</p>
                </div>
                <div className="finance-actions">
                    <Button
                        variant="secondary"
                        icon={<Filter size={16} />}
                        onClick={() => {
                            setShowOnlyPending(!showOnlyPending);
                            toast.info(showOnlyPending ? 'Mostrando todas' : 'Filtrando pendentes');
                        }}
                        className={showOnlyPending ? 'bg-secondary-hover border-accent' : ''}
                    >
                        {showOnlyPending ? 'Ver Todas' : 'Filtrar Pendentes'}
                    </Button>
                    <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
                        Nova Transação
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="finance-stats-grid">
                <Card padding="md" className="finance-stat-card">
                    <span className="finance-stat-title">Receita Total (LTV)</span>
                    <span className="finance-stat-value">{formatCurrency(stats.totalRevenue)}</span>
                    <div className="finance-stat-meta positive">
                        <TrendingUp size={14} />
                        <span>+12% vs mês anterior</span>
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
                        <span>3 faturas vencidas</span>
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
                            <BarChart data={[] /* Charts now use real data, future impl */}>
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
                        <Button variant="primary" type="submit">Adicionar</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default FinancePage;
