import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../lib/firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    orderBy
} from 'firebase/firestore';
import {
    Plus,
    Trash2,
    DollarSign,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import type { DespesaOperacional, CategoriaDespesa, Recorrencia } from '../../../types';
import './OperationalFinance.css';
import { format } from 'date-fns';

export const OperationalFinance: React.FC = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [expenses, setExpenses] = useState<DespesaOperacional[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<DespesaOperacional>>({
        nome: '',
        valor: 0,
        categoria: 'TRAFEGO',
        tipo: 'VARIAVEL',
        recorrencia: 'MENSAL',
        status: 'ATIVO'
    });

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'operational_expenses'),
            where('userId', '==', user.id),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            })) as DespesaOperacional[];
            setExpenses(loaded);
        });

        return () => unsubscribe();
    }, [user]);

    const handleSave = async () => {
        if (!user || !formData.nome || !formData.valor) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'operational_expenses'), {
                ...formData,
                userId: user.id,
                escopo: 'OPERACIONAL',
                notas: formData.notas || '',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            toast.success('Despesa adicionada!');
            setShowModal(false);
            setFormData({
                nome: '',
                valor: 0,
                categoria: 'TRAFEGO',
                tipo: 'VARIAVEL',
                recorrencia: 'MENSAL',
                status: 'ATIVO'
            });
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar despesa');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza?')) return;
        try {
            await deleteDoc(doc(db, 'operational_expenses', id));
            toast.success('Removido com sucesso');
        } catch (error) {
            toast.error('Erro ao remover');
        }
    };

    const handleToggleStatus = async (expense: DespesaOperacional) => {
        try {
            const newStatus = expense.status === 'ATIVO' ? 'CANCELADO' : 'ATIVO';
            await updateDoc(doc(db, 'operational_expenses', expense.id), {
                status: newStatus
            });
            toast.success(`Status alterado para ${newStatus}`);
        } catch (err) {
            toast.error('Erro ao atualizar status');
        }
    };

    // KPIs
    const totalMonthly = expenses
        .filter(e => e.status === 'ATIVO' && (e.recorrencia === 'MENSAL' || e.tipo === 'VARIAVEL')) // Simplification for now
        .reduce((acc, curr) => acc + curr.valor, 0);

    const fixedCost = expenses
        .filter(e => e.tipo === 'FIXO' && e.status === 'ATIVO')
        .reduce((acc, curr) => acc + curr.valor, 0);

    const variableCost = expenses
        .filter(e => e.tipo === 'VARIAVEL')
        .reduce((acc, curr) => acc + curr.valor, 0);

    const mostExpensiveTool = expenses
        .filter(e => e.recorrencia === 'MENSAL' && e.status === 'ATIVO')
        .sort((a, b) => b.valor - a.valor)[0];

    return (
        <div className="operational-finance">
            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card glass">
                    <div className="kpi-icon-wrapper blue">
                        <DollarSign size={20} />
                    </div>
                    <div className="kpi-content">
                        <h3>Custo Operacional</h3>
                        <p className="kpi-value">R$ {totalMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <span className="kpi-subtitle">Mensal Estimado</span>
                    </div>
                </div>

                <div className="kpi-card glass">
                    <div className="kpi-icon-wrapper purple">
                        <RefreshCw size={20} />
                    </div>
                    <div className="kpi-content">
                        <h3>Fixo vs Variável</h3>
                        <div className="mini-bar-chart">
                            <div className="bar-segment fixed" style={{ flex: fixedCost }} title={`Fixo: R$ ${fixedCost}`} />
                            <div className="bar-segment variable" style={{ flex: variableCost || 1 }} title={`Variável: R$ ${variableCost}`} />
                        </div>
                        <span className="kpi-subtitle">
                            Fixo: {Math.round((fixedCost / (fixedCost + variableCost || 1)) * 100)}%
                        </span>
                    </div>
                </div>

                {mostExpensiveTool && (
                    <div className="kpi-card glass">
                        <div className="kpi-icon-wrapper red">
                            <AlertCircle size={20} />
                        </div>
                        <div className="kpi-content">
                            <h3>Maior Custo</h3>
                            <p className="kpi-value text-red">{mostExpensiveTool.nome}</p>
                            <span className="kpi-subtitle">R$ {mostExpensiveTool.valor.toFixed(2)}/mês</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Subscriptions "Netflix" List */}
            <div className="section-header">
                <h2>Assinaturas & Ferramentas</h2>
                <Button onClick={() => setShowModal(true)}>
                    <Plus size={16} />
                    Adicionar Custo
                </Button>
            </div>

            <div className="subscriptions-grid">
                {expenses.filter(e => e.recorrencia !== 'UNICO').map(expense => (
                    <div key={expense.id} className={`subscription-card ${expense.status === 'CANCELADO' ? 'cancelled' : ''}`}>
                        <div className="sub-header">
                            <span className="sub-category">{expense.categoria}</span>
                            <button className="sub-menu-btn" onClick={() => handleDelete(expense.id)}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <div className="sub-body">
                            <h3>{expense.nome}</h3>
                            <p className="sub-price">R$ {expense.valor.toFixed(2)}<small>/{expense.recorrencia === 'MENSAL' ? 'mês' : 'ano'}</small></p>
                        </div>
                        <div className="sub-footer">
                            <button
                                className={`status-toggle ${expense.status === 'ATIVO' ? 'active' : ''}`}
                                onClick={() => handleToggleStatus(expense)}
                            >
                                {expense.status === 'ATIVO' ? 'Ativo' : 'Pausado'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Variable Expenses Table */}
            <div className="section-header mt-8">
                <h2>Histórico de Gastos</h2>
            </div>

            <div className="table-container glass">
                <table className="finance-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Categoria</th>
                            <th>Valor</th>
                            <th>Tipo</th>
                            <th>Data</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(expense => (
                            <tr key={expense.id}>
                                <td>{expense.nome}</td>
                                <td>
                                    <span className="badge">{expense.categoria}</span>
                                </td>
                                <td>R$ {expense.valor.toFixed(2)}</td>
                                <td>{expense.tipo}</td>
                                <td>{expense.createdAt ? format(expense.createdAt, 'dd/MM/yyyy') : '-'}</td>
                                <td>
                                    <button className="icon-btn" onClick={() => handleDelete(expense.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Novo Custo Operacional"
            >
                <div className="modal-form">
                    <div className="form-field">
                        <label>Nome da Despesa</label>
                        <input
                            value={formData.nome}
                            onChange={e => setFormData({ ...formData, nome: e.target.value })}
                            placeholder="Ex: Servidor VPS, Designer..."
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label>Valor (R$)</label>
                            <input
                                type="number"
                                value={formData.valor}
                                onChange={e => setFormData({ ...formData, valor: Number(e.target.value) })}
                            />
                        </div>
                        <div className="form-field">
                            <label>Categoria</label>
                            <select
                                value={formData.categoria}
                                onChange={e => setFormData({ ...formData, categoria: e.target.value as CategoriaDespesa })}
                            >
                                <option value="TRAFEGO">Tráfego</option>
                                <option value="AUTOMACAO">Automação</option>
                                <option value="INFRA">Infraestrutura</option>
                                <option value="DESIGN">Design</option>
                                <option value="IA">Inteligência Artificial</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label>Tipo</label>
                            <select
                                value={formData.tipo}
                                onChange={e => setFormData({ ...formData, tipo: e.target.value as 'FIXO' | 'VARIAVEL' })}
                            >
                                <option value="FIXO">Custo Fixo</option>
                                <option value="VARIAVEL">Custo Variável</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Recorrência</label>
                            <select
                                value={formData.recorrencia}
                                onChange={e => setFormData({ ...formData, recorrencia: e.target.value as Recorrencia })}
                            >
                                <option value="MENSAL">Mensal</option>
                                <option value="ANUAL">Anual</option>
                                <option value="UNICO">Único</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-actions">
                        <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading ? 'Salvando...' : 'Adicionar'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
