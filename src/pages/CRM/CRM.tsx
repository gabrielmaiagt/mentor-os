import React, { useState } from 'react';
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

// Mock deals data
const mockDeals: Deal[] = [
    {
        id: 'd1',
        leadId: 'l1',
        offerName: 'Mentoria Tráfego Direto',
        pitchAmount: 3000,
        paymentPreference: 'PIX',
        stage: 'PAYMENT_SENT',
        heat: 'HOT',
        leadName: 'João Silva',
        leadWhatsapp: '11999887766',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 52 * 60 * 60 * 1000),
    },
    {
        id: 'd2',
        leadId: 'l2',
        offerName: 'Mentoria Tráfego Direto',
        pitchAmount: 2500,
        paymentPreference: 'CARD',
        stage: 'PITCH_SENT',
        heat: 'WARM',
        leadName: 'Maria Costa',
        leadWhatsapp: '11998765432',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 28 * 60 * 60 * 1000),
    },
    {
        id: 'd3',
        leadId: 'l3',
        offerName: 'Mentoria Tráfego Direto',
        pitchAmount: 2500,
        paymentPreference: 'PIX',
        stage: 'PITCH_SENT',
        heat: 'COLD',
        leadName: 'Pedro Santos',
        leadWhatsapp: '11987654321',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    },
    {
        id: 'd4',
        leadId: 'l4',
        offerName: 'Mentoria Tráfego Direto',
        pitchAmount: 3500,
        paymentPreference: 'UNKNOWN',
        stage: 'OPEN',
        heat: 'WARM',
        leadName: 'Ana Oliveira',
        leadWhatsapp: '11976543210',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    },
    {
        id: 'd5',
        leadId: 'l5',
        offerName: 'Mentoria Tráfego Direto',
        pitchAmount: 2000,
        paymentPreference: 'PIX',
        stage: 'PAID',
        heat: 'HOT',
        leadName: 'Carlos Lima',
        leadWhatsapp: '11965432109',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
        id: 'd6',
        leadId: 'l6',
        offerName: 'Mentoria Tráfego Direto',
        pitchAmount: 2500,
        paymentPreference: 'PIX',
        stage: 'LOST',
        heat: 'COLD',
        leadName: 'Fernanda Souza',
        leadWhatsapp: '11954321098',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
];

const stages: DealStage[] = ['OPEN', 'PITCH_SENT', 'PAYMENT_SENT', 'PAID', 'LOST'];

export const CRMPage: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [deals, setDeals] = useState<Deal[]>(mockDeals);
    const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Deal Form State
    const [newDeal, setNewDeal] = useState({
        leadName: '',
        leadWhatsapp: '',
        offerName: 'Mentoria Tráfego Direto',
        pitchAmount: 2000,
        heat: 'HOT' as DealHeat
    });

    const handleCreateDeal = (e: React.FormEvent) => {
        e.preventDefault();
        const deal: Deal = {
            id: `d-${Date.now()}`,
            leadId: `l-${Date.now()}`, // Mock lead ID
            leadName: newDeal.leadName,
            leadWhatsapp: newDeal.leadWhatsapp || 'Sem whats',
            offerName: newDeal.offerName,
            pitchAmount: Number(newDeal.pitchAmount),
            paymentPreference: 'UNKNOWN',
            stage: 'OPEN',
            heat: newDeal.heat,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        setDeals([deal, ...deals]);
        setIsModalOpen(false);
        toast.success('Deal criado com sucesso!');
        setNewDeal({ leadName: '', leadWhatsapp: '', offerName: 'Mentoria Tráfego Direto', pitchAmount: 2000, heat: 'HOT' });
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

    const handleDrop = (stage: DealStage) => {
        if (!draggedDeal) return;

        // Update deal stage
        setDeals(prev => prev.map(d =>
            d.id === draggedDeal.id
                ? { ...d, stage, updatedAt: new Date() }
                : d
        ));

        toast.success('Deal atualizado', `Movido para ${DEAL_STAGES.find(s => s.key === stage)?.label}`);
        setDraggedDeal(null);
    };

    const markAsPaid = (deal: Deal) => {
        setDeals(prev => prev.map(d =>
            d.id === deal.id
                ? { ...d, stage: 'PAID' as DealStage, updatedAt: new Date() }
                : d
        ));
        toast.success('Deal fechado!', `${deal.leadName} marcado como pago. Mentorado criado.`);
    };

    const markAsLost = (deal: Deal) => {
        setDeals(prev => prev.map(d =>
            d.id === deal.id
                ? { ...d, stage: 'LOST' as DealStage, updatedAt: new Date() }
                : d
        ));
        toast.info('Deal perdido', `${deal.leadName} movido para perdidos`);
    };

    const getDealsByStage = (stage: DealStage) =>
        deals.filter(d => d.stage === stage);

    const getStageTotals = (stage: DealStage) => {
        const stageDeals = getDealsByStage(stage);
        return stageDeals.reduce((sum, d) => sum + d.pitchAmount, 0);
    };

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
                                                        onClick={() => {
                                                            setDeals(prev => prev.map(d =>
                                                                d.id === deal.id
                                                                    ? { ...d, stage: 'PITCH_SENT' as DealStage, updatedAt: new Date() }
                                                                    : d
                                                            ));
                                                        }}
                                                    >
                                                        Pitch enviado
                                                    </Button>
                                                )}
                                                {stage === 'PITCH_SENT' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setDeals(prev => prev.map(d =>
                                                                d.id === deal.id
                                                                    ? { ...d, stage: 'PAYMENT_SENT' as DealStage, updatedAt: new Date() }
                                                                    : d
                                                            ));
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
        </div>
    );
};

export default CRMPage;
