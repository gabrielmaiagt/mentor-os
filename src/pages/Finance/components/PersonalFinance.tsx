import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../lib/firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import {
    Plus,
    Trash2,
    Home,
    ShoppingBag,
    Heart,
    Coffee,
    Zap,
    Target
} from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import type { DespesaPessoal, CategoriaDespesa } from '../../../types';
import './PersonalFinance.css';
import { format } from 'date-fns';

export const PersonalFinance: React.FC = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [expenses, setExpenses] = useState<DespesaPessoal[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<DespesaPessoal>>({
        nome: '',
        valor: 0,
        categoria: 'MORADIA',
        tipo: 'VARIAVEL',
        metodoPagamento: 'PIX',
        essencial: true,
        data: new Date() // Will be converted on save
    });

    // Ideal Income Goal (Local state for now, could be in user settings)
    const [idealIncome, setIdealIncome] = useState(10000);

    useEffect(() => {
        if (!user) return;

        // 1. Listen to Personal Expenses
        const q = query(
            collection(db, 'personal_expenses'),
            where('userId', '==', user.id),
            orderBy('data', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                data: doc.data().data?.toDate(),
                createdAt: doc.data().createdAt?.toDate()
            })) as DespesaPessoal[];
            setExpenses(loaded);
        });

        // 2. Calculate Operational Profit (Mental model: Revenue - Op Expenses)
        // For now, let's just grab Operational Expenses sum to subtract from a mock revenue 
        // OR just grab Op Expenses to show "Business Cost vs Life Cost".
        // Let's keep it simple: We need to know if "Business Pays Life".
        // We need Revenue. Let's assume a static revenue or fetch from TrafficFinance if possible.
        // For this MVP, let's just calculate Total Personal Cost vs Ideal Income.

        return () => unsubscribe();
    }, [user]);

    const handleSave = async () => {
        if (!user || !formData.nome || !formData.valor) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        setLoading(true);
        try {
            await addDoc(collection(db, 'personal_expenses'), {
                ...formData,
                userId: user.id,
                escopo: 'PESSOAL',
                data: Timestamp.fromDate(new Date(formData.data as any)),
                createdAt: new Date(),
                updatedAt: new Date()
            });
            toast.success('Gasto pessoal adicionado!');
            setShowModal(false);
            setFormData({
                nome: '',
                valor: 0,
                categoria: 'MORADIA',
                tipo: 'VARIAVEL',
                metodoPagamento: 'PIX',
                essencial: true,
                data: new Date()
            });
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar gasto');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza?')) return;
        try {
            await deleteDoc(doc(db, 'personal_expenses', id));
            toast.success('Removido com sucesso');
        } catch (error) {
            toast.error('Erro ao remover');
        }
    };

    // KPIs
    const totalCostOfLiving = expenses.reduce((acc, curr) => acc + curr.valor, 0);
    const essentialCost = expenses.filter(e => e.essencial).reduce((acc, curr) => acc + curr.valor, 0);
    const lifestyleCost = totalCostOfLiving - essentialCost;

    // Progress
    const coveragePercent = Math.min((totalCostOfLiving / idealIncome) * 100, 100);

    return (
        <div className="personal-finance">
            {/* Life Dashboard */}
            <div className="life-dashboard-grid">
                <div className="life-card main-card">
                    <div className="life-header">
                        <Home size={20} className="text-blue" />
                        <span>Custo de Vida Mensal</span>
                    </div>
                    <h1>R$ {totalCostOfLiving.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h1>
                    <div className="life-breakdown">
                        <span className="text-green">Essencial: {Math.round((essentialCost / (totalCostOfLiving || 1)) * 100)}%</span>
                        <span className="text-purple">Lifestyle: {Math.round((lifestyleCost / (totalCostOfLiving || 1)) * 100)}%</span>
                    </div>
                </div>

                <div className="life-card goal-card">
                    <div className="life-header">
                        <Target size={20} className="text-orange" />
                        <span>Meta de Renda Ideal</span>
                    </div>
                    <div className="goal-input-wrapper">
                        <span>R$</span>
                        <input
                            type="number"
                            className="goal-input"
                            value={idealIncome}
                            onChange={(e) => setIdealIncome(Number(e.target.value))}
                        />
                    </div>
                    <div className="goal-progress-bar">
                        <div className="progress-fill" style={{ width: `${coveragePercent}%` }} />
                    </div>
                    <p className="goal-status">
                        Você precisa de mais <b>R$ {(idealIncome - totalCostOfLiving).toLocaleString('pt-BR')}</b> para sua vida ideal.
                    </p>
                </div>
            </div>

            {/* Expenses List */}
            <div className="section-header mt-8">
                <h2>Histórico de Vida</h2>
                <Button onClick={() => setShowModal(true)} variant="secondary">
                    <Plus size={16} />
                    Adicionar Gasto
                </Button>
            </div>

            <div className="personal-expenses-list">
                {expenses.map(expense => (
                    <div key={expense.id} className="personal-expense-item">
                        <div className="expense-icon-col">
                            {getCategoryIcon(expense.categoria)}
                        </div>
                        <div className="expense-info-col">
                            <h3>{expense.nome}</h3>
                            <span className="expense-date">{expense.data ? format(expense.data, 'dd/MM') : '-'}</span>
                        </div>
                        <div className="expense-tags-col">
                            <span className="badge-outline">{expense.metodoPagamento}</span>
                            {expense.essencial && <span className="badge-essential">Essencial</span>}
                        </div>
                        <div className="expense-amount-col">
                            R$ {expense.valor.toFixed(2)}
                        </div>
                        <div className="expense-actions-col">
                            <button className="icon-btn" onClick={() => handleDelete(expense.id)}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Novo Gasto Pessoal"
            >
                <div className="modal-form">
                    <div className="form-field">
                        <label>O que você comprou?</label>
                        <input
                            value={formData.nome}
                            onChange={e => setFormData({ ...formData, nome: e.target.value })}
                            placeholder="Ex: Aluguel, Ifood, Uber..."
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
                            <label>Data</label>
                            <input
                                type="date"
                                value={formData.data ? format(formData.data, 'yyyy-MM-dd') : ''}
                                onChange={e => setFormData({ ...formData, data: new Date(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label>Categoria</label>
                            <select
                                value={formData.categoria}
                                onChange={e => setFormData({ ...formData, categoria: e.target.value as CategoriaDespesa })}
                            >
                                <option value="MORADIA">Moradia</option>
                                <option value="CONTAS">Contas (Luz/Net)</option>
                                <option value="ALIMENTACAO">Alimentação</option>
                                <option value="TRANSPORTE">Transporte</option>
                                <option value="SAUDE">Saúde</option>
                                <option value="LAZER">Lazer</option>
                                <option value="ASSINATURAS_PESSOAIS">Assinaturas</option>
                            </select>
                        </div>
                        <div className="form-field">
                            <label>Pagamento</label>
                            <select
                                value={formData.metodoPagamento}
                                onChange={e => setFormData({ ...formData, metodoPagamento: e.target.value as any })}
                            >
                                <option value="PIX">Pix</option>
                                <option value="CARTAO">Cartão</option>
                                <option value="DINHEIRO">Dinheiro</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-field checkbox-field">
                        <input
                            type="checkbox"
                            checked={formData.essencial}
                            onChange={e => setFormData({ ...formData, essencial: e.target.checked })}
                            id="essential-check"
                        />
                        <label htmlFor="essential-check">Isso é essencial para viver?</label>
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

function getCategoryIcon(network: string) {
    // Simple mapper
    switch (network) {
        case 'MORADIA': return <Home size={18} className="text-blue" />;
        case 'ALIMENTACAO': return <Coffee size={18} className="text-orange" />;
        case 'SAUDE': return <Heart size={18} className="text-red" />;
        case 'LAZER': return <Zap size={18} className="text-purple" />;
        default: return <ShoppingBag size={18} className="text-gray" />;
    }
}
