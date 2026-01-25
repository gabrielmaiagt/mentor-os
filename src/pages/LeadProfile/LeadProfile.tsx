import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Phone,
    Mail,
    MessageSquare,
    Copy,
    Clock,
    Calendar,
    DollarSign,
    Target,
    Edit,
    Trash2,
    Plus,
    ChevronRight,
    AlertTriangle,
    CheckCircle,
    Flame
} from 'lucide-react';
import { Card, CardHeader, CardContent, Badge, Button, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { LEAD_STAGES, DEAL_STAGES, getStageConfig } from '../../types';
import type { Lead, Deal, LeadStage, DealStage } from '../../types';
import './LeadProfile.css';

// Mock data
const mockLead: Lead = {
    id: 'l1',
    name: 'João Silva',
    whatsapp: '11999887766',
    email: 'joao.silva@email.com',
    source: 'Instagram',
    tags: ['tráfego direto', 'iniciante', 'urgente'],
    stage: 'CLOSING',
    status: 'ACTIVE',
    lastContactAt: new Date(Date.now() - 52 * 60 * 60 * 1000),
    nextActionAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    nextActionType: 'SEND_PIX',
    objections: ['Preço alto', 'Tempo de retorno'],
    notesShort: 'Interessado em tráfego para e-commerce de roupas fitness. Já tentou rodar sozinho mas não teve resultado.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 52 * 60 * 60 * 1000),
};

const mockDeal: Deal = {
    id: 'd1',
    leadId: 'l1',
    offerName: 'Mentoria Tráfego Direto',
    pitchAmount: 3000,
    paymentPreference: 'PIX',
    stage: 'PAYMENT_SENT',
    heat: 'HOT',
    leadName: 'João Silva',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 52 * 60 * 60 * 1000),
};

const mockTimeline = [
    { id: '1', type: 'message', content: 'Enviou PIX da mentoria', date: new Date(Date.now() - 52 * 60 * 60 * 1000) },
    { id: '2', type: 'stage', content: 'Deal movido para PAYMENT_SENT', date: new Date(Date.now() - 52 * 60 * 60 * 1000) },
    { id: '3', type: 'message', content: 'Pitch enviado via WhatsApp', date: new Date(Date.now() - 72 * 60 * 60 * 1000) },
    { id: '4', type: 'call', content: 'Call de qualificação - 25min', date: new Date(Date.now() - 96 * 60 * 60 * 1000) },
    { id: '5', type: 'stage', content: 'Lead qualificado', date: new Date(Date.now() - 96 * 60 * 60 * 1000) },
    { id: '6', type: 'created', content: 'Lead criado via Instagram', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
];

export const LeadProfilePage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    const [lead] = useState(mockLead);
    const [deal] = useState(mockDeal);
    const [showNoteModal, setShowNoteModal] = useState(false);

    const leadStageConfig = getStageConfig(LEAD_STAGES, lead.stage);
    const dealStageConfig = getStageConfig(DEAL_STAGES, deal.stage);

    const getHoursSince = (date?: Date) => {
        if (!date) return null;
        return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const copyMessage = async (message: string) => {
        await navigator.clipboard.writeText(message);
        toast.success('Copiado!');
    };

    const hoursSinceContact = getHoursSince(lead.lastContactAt);
    const isOverdue = hoursSinceContact && hoursSinceContact > 24;

    return (
        <div className="lead-profile">
            {/* Header */}
            <div className="lead-profile-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                    Voltar
                </button>

                <div className="lead-profile-actions">
                    <Button variant="ghost" size="sm" icon={<Edit size={16} />}>
                        Editar
                    </Button>
                    <Button variant="ghost" size="sm" icon={<Trash2 size={16} />}>
                        Arquivar
                    </Button>
                </div>
            </div>

            {/* Main Info */}
            <div className="lead-profile-main">
                <div className="lead-avatar">
                    {lead.name.charAt(0).toUpperCase()}
                </div>
                <div className="lead-info">
                    <h1 className="lead-name">{lead.name}</h1>
                    <div className="lead-contacts">
                        <a href={`https://wa.me/55${lead.whatsapp}`} target="_blank" rel="noopener noreferrer" className="lead-contact">
                            <Phone size={14} /> {lead.whatsapp}
                        </a>
                        {lead.email && (
                            <a href={`mailto:${lead.email}`} className="lead-contact">
                                <Mail size={14} /> {lead.email}
                            </a>
                        )}
                    </div>
                    <div className="lead-tags">
                        {lead.tags.map(tag => (
                            <Badge key={tag} variant="default" size="sm">{tag}</Badge>
                        ))}
                    </div>
                </div>
                <div className="lead-stage-badge">
                    <Badge
                        variant={lead.stage === 'CLOSING' ? 'hot' : 'default'}
                        style={{ backgroundColor: leadStageConfig?.color, color: 'white' }}
                    >
                        {leadStageConfig?.label}
                    </Badge>
                    {isOverdue && (
                        <Badge variant="error" pulse>
                            <AlertTriangle size={12} /> {hoursSinceContact}h sem contato
                        </Badge>
                    )}
                </div>
            </div>

            {/* Content Grid */}
            <div className="lead-profile-grid">
                {/* Left Column */}
                <div className="lead-profile-left">
                    {/* Deal Card */}
                    {deal && (
                        <Card className="deal-card" padding="md">
                            <CardHeader
                                title="Negociação Ativa"
                                action={
                                    <Badge variant={deal.heat === 'HOT' ? 'hot' : deal.heat === 'WARM' ? 'warm' : 'cold'}>
                                        {deal.heat === 'HOT' && <Flame size={12} />}
                                        {deal.heat === 'HOT' ? 'Quente' : deal.heat === 'WARM' ? 'Morno' : 'Frio'}
                                    </Badge>
                                }
                            />
                            <CardContent>
                                <div className="deal-info">
                                    <div className="deal-offer">{deal.offerName}</div>
                                    <div className="deal-amount">{formatCurrency(deal.pitchAmount)}</div>
                                    <div className="deal-stage">
                                        <span
                                            className="deal-stage-dot"
                                            style={{ backgroundColor: dealStageConfig?.color }}
                                        />
                                        {dealStageConfig?.label}
                                    </div>
                                </div>

                                <div className="deal-actions">
                                    <Button
                                        variant="success"
                                        size="sm"
                                        icon={<CheckCircle size={14} />}
                                        onClick={() => toast.success('Deal fechado!', 'Mentorado criado automaticamente.')}
                                    >
                                        Marcar Pago
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        icon={<Copy size={14} />}
                                        onClick={() => copyMessage(`Chave PIX: cpf@exemplo.com\nValor: R$ 3.000\n\nApós o pagamento, me envia o comprovante aqui!`)}
                                    >
                                        Copiar PIX
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Actions */}
                    <Card padding="md">
                        <CardHeader title="Ações Rápidas" />
                        <CardContent>
                            <div className="quick-actions-grid">
                                <Button
                                    variant="primary"
                                    fullWidth
                                    icon={<MessageSquare size={16} />}
                                    onClick={() => window.open(`https://wa.me/55${lead.whatsapp}`, '_blank')}
                                >
                                    Abrir WhatsApp
                                </Button>
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    icon={<Copy size={16} />}
                                    onClick={() => copyMessage(`Fala ${lead.name.split(' ')[0]}! Tudo bem?\n\nVi que ficou pendente a confirmação do pagamento. Consegue resolver isso hoje?\n\nBora começar essa semana!`)}
                                >
                                    Copiar Follow-up
                                </Button>
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    icon={<Calendar size={16} />}
                                >
                                    Agendar Call
                                </Button>
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    icon={<Plus size={16} />}
                                    onClick={() => setShowNoteModal(true)}
                                >
                                    Adicionar Nota
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Objections */}
                    {lead.objections.length > 0 && (
                        <Card padding="md">
                            <CardHeader title="Objeções Identificadas" />
                            <CardContent>
                                <ul className="objections-list">
                                    {lead.objections.map((obj, i) => (
                                        <li key={i} className="objection-item">
                                            <AlertTriangle size={14} />
                                            {obj}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {/* Notes */}
                    {lead.notesShort && (
                        <Card padding="md">
                            <CardHeader title="Notas" />
                            <CardContent>
                                <p className="lead-notes">{lead.notesShort}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - Timeline */}
                <div className="lead-profile-right">
                    <Card padding="md" className="timeline-card">
                        <CardHeader title="Histórico" />
                        <CardContent>
                            <div className="timeline">
                                {mockTimeline.map((event, index) => (
                                    <div key={event.id} className="timeline-item">
                                        <div className="timeline-marker">
                                            <div className={`timeline-dot timeline-dot-${event.type}`} />
                                            {index < mockTimeline.length - 1 && <div className="timeline-line" />}
                                        </div>
                                        <div className="timeline-content">
                                            <p className="timeline-text">{event.content}</p>
                                            <span className="timeline-date">{formatDate(event.date)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Note Modal */}
            <Modal
                isOpen={showNoteModal}
                onClose={() => setShowNoteModal(false)}
                title="Adicionar Nota"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowNoteModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={() => {
                            toast.success('Nota adicionada!');
                            setShowNoteModal(false);
                        }}>
                            Salvar
                        </Button>
                    </>
                }
            >
                <textarea
                    className="note-textarea"
                    placeholder="Digite sua nota aqui..."
                    rows={5}
                />
            </Modal>
        </div>
    );
};

export default LeadProfilePage;
