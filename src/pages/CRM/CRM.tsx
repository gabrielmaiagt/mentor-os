import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Clock,
    CheckCircle,
    Flame
} from 'lucide-react';
import { Card, Badge, Button, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import type { Deal, DealStage, DealHeat } from '../../types';
import { DEAL_STAGES } from '../../types';
import './CRM.css';

// Mock data removed

const stages: DealStage[] = ['OPEN', 'PITCH_SENT', 'PAYMENT_SENT', 'PAID', 'LOST'];

export const CRMPage: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [deals, setDeals] = useState<Deal[]>([]);
    const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [closingDeal, setClosingDeal] = useState<Deal | null>(null); // New state for closing deal modal
    const [loading, setLoading] = useState(true);

    // Fetch Deals
    useEffect(() => {
        const q = query(collection(db, 'deals'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, snapshot => {
            setDeals(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            })) as Deal[]);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Helper to create Mentee if not exists
    const ensureMenteeExists = async (deal: Deal): Promise<string | null> => {
        // Check if mentee already exists for this deal or lead
        // We can check by linkedDealId
        const q = query(collection(db, 'mentees'), where('linkedDealId', '==', deal.id));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) return snapshot.docs[0].id; // Already exists

        // Create new Mentee
        try {
            const docRef = await addDoc(collection(db, 'mentees'), {
                name: deal.leadName,
                whatsapp: deal.leadWhatsapp || '',
                email: deal.email || '', // Now using the deal's email
                plan: deal.offerName.includes('6 meses') ? '6 meses' : '3 meses', // Heuristic
                startAt: new Date(),
                currentStage: 'ONBOARDING',
                stageProgress: 0,
                weeklyGoal: 'Iniciar onboarding',
                blocked: false,
                linkedDealId: deal.id,
                createdBy: auth.currentUser?.uid,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            toast.success('Mentorado criado automaticamente!');
            return docRef.id;
        } catch (error) {
            console.error("Error creating mentee from deal:", error);
            toast.error("Erro ao criar mentorado vinculado.");
            return null;
        }
    };

    // New Deal Form State
    const [newDeal, setNewDeal] = useState({
        leadName: '',
        email: '',
        leadWhatsapp: '',
        offerName: 'Mentoria Tráfego Direto',
        pitchAmount: 2000,
        heat: 'HOT' as DealHeat
    });

    const handleCreateDeal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'deals'), {
                ...newDeal,
                email: newDeal.email,
                leadId: `l-${Date.now()}`, // Still mocking lead ID relation as we don't have Leads module fully strict yet
                paymentPreference: 'UNKNOWN',
                stage: 'OPEN',
                createdAt: new Date(),
                updatedAt: new Date(),
                pitchAmount: Number(newDeal.pitchAmount),
                createdBy: auth.currentUser?.uid
            });
            setIsModalOpen(false);
            setIsModalOpen(false);
            toast.success('Deal criado com sucesso!');
            setNewDeal({ leadName: '', email: '', leadWhatsapp: '', offerName: 'Mentoria Tráfego Direto', pitchAmount: 2000, heat: 'HOT' });
        } catch (error) {
            console.error("Error creating deal:", error);
            toast.error("Erro ao criar deal");
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
        }).format(value);
    };

    // ... (rest of helpers)
    const getHoursSince = (date: Date) => {
        return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    };

    const getHeatBadge = (heat: DealHeat) => {
        switch (heat) {
            case 'HOT':
                return <Badge variant="hot"><Flame size={12} /> Quente</Badge>;
            case 'WARM':
                return <Badge variant="warm">Morno</Badge>;
            case 'COLD':
                return <Badge variant="cold">Frio</Badge>;
        }
    };

    const getUrgencyClass = (hours: number) => {
        if (hours > 48) return 'urgent-critical';
        if (hours > 24) return 'urgent-attention';
        return '';
    };

    const handleDragStart = (deal: Deal) => {
        setDraggedDeal(deal);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (stage: DealStage) => {
        if (!draggedDeal) return;

        try {
            await updateDoc(doc(db, 'deals', draggedDeal.id), {
                stage,
                updatedAt: new Date()
            });

            if (stage === 'PAID') {
                // Check if email exists before marking as paid
                if (!draggedDeal.email) {
                    setClosingDeal(draggedDeal);
                    return; // Stop update, wait for modal
                }
                await ensureMenteeExists(draggedDeal);
            }

            toast.success('Deal atualizado', `Movido para ${DEAL_STAGES.find(s => s.key === stage)?.label}`);
        } catch (error) {
            console.error("Error updating deal:", error);
            toast.error("Erro ao atualizar deal");
        }
        setDraggedDeal(null);
    };

    const markAsPaid = async (deal: Deal) => {
        // If email missing, open close deal modal
        if (!deal.email) {
            setClosingDeal(deal);
            return;
        }

        try {
            await updateDoc(doc(db, 'deals', deal.id), {
                stage: 'PAID',
                updatedAt: new Date()
            });
            await ensureMenteeExists(deal);
            toast.success('Deal fechado!', `${deal.leadName} marcado como pago. Mentorado criado.`);
        } catch (error) {
            console.error("Error marking as paid:", error);
            toast.error("Erro ao atualizar deal");
        }
    };

    const markAsLost = async (deal: Deal) => {
        try {
            await updateDoc(doc(db, 'deals', deal.id), {
                stage: 'LOST',
                updatedAt: new Date()
            });
            toast.info('Deal perdido', `${deal.leadName} movido para perdidos`);
        } catch (error) {
            console.error("Error marking as lost:", error);
            toast.error("Erro ao atualizar deal");
        }
    };

    const getDealsByStage = (stage: DealStage) =>
        deals.filter(d => d.stage === stage);

    const getStageTotals = (stage: DealStage) => {
        const stageDeals = getDealsByStage(stage);
        return stageDeals.reduce((sum, d) => sum + d.pitchAmount, 0);
    };

    if (loading) {
        return <div className="p-8 text-center text-secondary">Carregando CRM...</div>;
    }

    return (
        <div className="crm">
            {/* Header */}
            <div className="crm-header">
                <div>
                    <h1 className="crm-title">CRM - Funil de Vendas</h1>
                    <p className="crm-subtitle">Arraste os cards para mudar de etapa</p>
                </div>
                <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
                    Novo Deal
                </Button>
            </div>

            {/* Pipeline */}
            <div className="crm-pipeline">
                {stages.map(stage => {
                    const stageConfig = DEAL_STAGES.find(s => s.key === stage);
                    const stageDeals = getDealsByStage(stage);
                    const stageTotal = getStageTotals(stage);

                    return (
                        <div
                            key={stage}
                            className="crm-column"
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(stage)}
                        >
                            <div className="crm-column-header">
                                <div className="crm-column-title">
                                    <span
                                        className="crm-column-indicator"
                                        style={{ backgroundColor: stageConfig?.color }}
                                    />
                                    <span>{stageConfig?.label}</span>
                                    <Badge size="sm">{stageDeals.length}</Badge>
                                </div>
                                {stage !== 'LOST' && stageTotal > 0 && (
                                    <span className="crm-column-total">
                                        {formatCurrency(stageTotal)}
                                    </span>
                                )}
                            </div>

                            <div className="crm-column-content">
                                {stageDeals.map(deal => {
                                    const hoursSince = getHoursSince(deal.updatedAt);
                                    const urgencyClass = getUrgencyClass(hoursSince);

                                    return (
                                        <Card
                                            key={deal.id}
                                            className={`crm-card ${urgencyClass}`}
                                            padding="sm"
                                            variant="interactive"
                                            draggable
                                            onDragStart={() => handleDragStart(deal)}
                                            onClick={() => navigate(`/lead/${deal.leadId}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="crm-card-header">
                                                <span className="crm-card-name">{deal.leadName}</span>
                                                {getHeatBadge(deal.heat)}
                                            </div>

                                            <div className="crm-card-amount">
                                                {formatCurrency(deal.pitchAmount)}
                                            </div>

                                            <div className="crm-card-meta">
                                                <span className={`crm-card-time ${urgencyClass}`}>
                                                    <Clock size={12} />
                                                    {hoursSince}h
                                                </span>
                                                <span className="crm-card-offer">{deal.offerName}</span>
                                            </div>

                                            <div className="crm-card-actions">
                                                {stage === 'OPEN' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={async () => {
                                                            await updateDoc(doc(db, 'deals', deal.id), {
                                                                stage: 'PITCH_SENT',
                                                                updatedAt: new Date()
                                                            });
                                                        }}
                                                    >
                                                        Pitch enviado
                                                    </Button>
                                                )}
                                                {stage === 'PITCH_SENT' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={async () => {
                                                            await updateDoc(doc(db, 'deals', deal.id), {
                                                                stage: 'PAYMENT_SENT',
                                                                updatedAt: new Date()
                                                            });
                                                        }}
                                                    >
                                                        Enviar PIX
                                                    </Button>
                                                )}
                                                {stage === 'PAYMENT_SENT' && (
                                                    <>
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            icon={<CheckCircle size={14} />}
                                                            onClick={() => markAsPaid(deal)}
                                                        >
                                                            Pago
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => markAsLost(deal)}
                                                        >
                                                            Perdido
                                                        </Button>
                                                    </>
                                                )}
                                                {(stage === 'PAID' || stage === 'LOST') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigate(`/lead/${deal.leadId}`)}
                                                    >
                                                        Ver perfil
                                                    </Button>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}

                                {stageDeals.length === 0 && (
                                    <div className="crm-column-empty">
                                        Nenhum deal nesta etapa
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* New Deal Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Novo Deal"
            >
                <form onSubmit={handleCreateDeal} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Nome do Lead</label>
                        <input
                            required
                            type="text"
                            className="w-full bg-secondary border border-subtle rounded-md px-3 py-2 text-primary focus:border-accent outline-none"
                            placeholder="Ex: João da Silva"
                            value={newDeal.leadName}
                            onChange={e => setNewDeal({ ...newDeal, leadName: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full bg-secondary border border-subtle rounded-md px-3 py-2 text-primary focus:border-accent outline-none"
                            placeholder="email@cliente.com"
                            value={newDeal.email}
                            onChange={e => setNewDeal({ ...newDeal, email: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">WhatsApp</label>
                        <input
                            type="text"
                            className="w-full bg-secondary border border-subtle rounded-md px-3 py-2 text-primary focus:border-accent outline-none"
                            placeholder="Ex: 11999999999"
                            value={newDeal.leadWhatsapp}
                            onChange={e => setNewDeal({ ...newDeal, leadWhatsapp: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Valor do Pitch (R$)</label>
                            <input
                                required
                                type="number"
                                className="w-full bg-secondary border border-subtle rounded-md px-3 py-2 text-primary focus:border-accent outline-none"
                                value={newDeal.pitchAmount}
                                onChange={e => setNewDeal({ ...newDeal, pitchAmount: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-1">Temperatura</label>
                            <select
                                className="w-full bg-secondary border border-subtle rounded-md px-3 py-2 text-primary focus:border-accent outline-none"
                                value={newDeal.heat}
                                onChange={e => setNewDeal({ ...newDeal, heat: e.target.value as DealHeat })}
                            >
                                <option value="HOT">Quente 🔥</option>
                                <option value="WARM">Morno 😐</option>
                                <option value="COLD">Frio ❄️</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" type="submit">Criar Deal</Button>
                    </div>
                </form>
            </Modal>

            {/* Close Deal Modal (Capture Email) */}
            <Modal
                isOpen={!!closingDeal}
                onClose={() => setClosingDeal(null)}
                title="Fechar Venda - Dados Finais"
            >
                <div className="space-y-4">
                    <p className="text-secondary text-sm">
                        Para liberar o acesso do mentorado, precisamos do email oficial.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Email do Cliente</label>
                        <input
                            type="email"
                            className="w-full bg-secondary border border-subtle rounded-md px-3 py-2 text-primary focus:border-accent outline-none"
                            placeholder="email@cliente.com"
                            // We use a local state or ref for this input, but for simplicity let's use a controlled input inside a small component or just simple generic handler
                            // Wait, simple handler:
                            id="close-email-input"
                            defaultValue={closingDeal?.email || ''}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Confirmação de Valor (R$)</label>
                        <input
                            type="number"
                            className="w-full bg-secondary border border-subtle rounded-md px-3 py-2 text-primary focus:border-accent outline-none"
                            defaultValue={closingDeal?.pitchAmount}
                            id="close-amount-input"
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="ghost" onClick={() => setClosingDeal(null)}>Cancelar</Button>
                        <Button variant="success" onClick={async () => {
                            if (!closingDeal) return;
                            const emailInput = (document.getElementById('close-email-input') as HTMLInputElement).value;
                            const amountInput = (document.getElementById('close-amount-input') as HTMLInputElement).value;

                            if (!emailInput) {
                                toast.error('Email é obrigatório!');
                                return;
                            }

                            try {
                                const updatedDeal = { ...closingDeal, email: emailInput, pitchAmount: Number(amountInput) };
                                await updateDoc(doc(db, 'deals', closingDeal.id), {
                                    email: emailInput,
                                    pitchAmount: Number(amountInput),
                                    stage: 'PAID',
                                    updatedAt: new Date(),
                                    paymentDate: new Date()
                                });

                                const menteeId = await ensureMenteeExists(updatedDeal);

                                // Create Finance Transaction
                                await addDoc(collection(db, 'transactions'), {
                                    menteeId: menteeId || 'legacy_or_error',
                                    menteeName: updatedDeal.leadName,
                                    amount: Number(amountInput),
                                    status: 'PAID',
                                    dueDate: new Date(),
                                    paidAt: new Date(),
                                    method: 'PIX', // Default for CRM sales
                                    description: `Venda CRM - ${updatedDeal.offerName}`,
                                    createdAt: new Date(),
                                    updatedAt: new Date()
                                });

                                toast.success('Venda Confirmada!', 'Mentorado e Transação criados.');
                                setClosingDeal(null);
                            } catch (e) {
                                console.error(e);
                                toast.error('Erro ao fechar venda');
                            }
                        }}>Confirmar e Liberar Acesso</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CRMPage;
