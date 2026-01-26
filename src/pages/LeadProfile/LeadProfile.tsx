import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Phone,
    Mail,
    MessageSquare,
    Copy,
    Calendar,
    Edit,
    Trash2,
    Plus,
    AlertTriangle,
    CheckCircle,
    Flame,
    Loader
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardHeader, CardContent, Badge, Button, Modal } from '../../components/ui';
import { CreateDealModal } from '../../components/crm/CreateDealModal';
import { TemplateSelector } from '../../components/templates/TemplateSelector';
import { MessageTemplatesModal } from '../../components/templates/MessageTemplatesModal';
import { useToast } from '../../components/ui/Toast';
import { LEAD_STAGES, DEAL_STAGES, getStageConfig } from '../../types';
import { openWhatsApp, copyToClipboard } from '../../utils/whatsapp';
import type { Lead, Deal } from '../../types';
import './LeadProfile.css';

// Mocks removed

export const LeadProfilePage: React.FC = () => {
    const { id: leadId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();

    const [lead, setLead] = useState<Lead | null>(null);
    const [deal, setDeal] = useState<Deal | null>(null);
    const [loading, setLoading] = useState(true);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showCreateDealModal, setShowCreateDealModal] = useState(false);
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);

    React.useEffect(() => {
        const fetchLeadData = async () => {
            if (!leadId) return;
            try {
                // Fetch deal associated with this leadId
                // Since we don't have a separate 'leads' collection developed yet, we are using deals.
                const q = query(collection(db, 'deals'), where('leadId', '==', leadId));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const dealDoc = snapshot.docs[0];
                    const dealData = {
                        id: dealDoc.id,
                        ...dealDoc.data(),
                        createdAt: dealDoc.data().createdAt?.toDate(),
                        updatedAt: dealDoc.data().updatedAt?.toDate()
                    } as Deal;
                    setDeal(dealData);

                    // Simulate Lead data from Deal
                    setLead({
                        id: dealData.leadId,
                        name: dealData.leadName || 'Desconhecido',
                        whatsapp: dealData.leadWhatsapp || '',
                        email: '', // Not in deal yet
                        source: 'Indefinido',
                        tags: [],
                        stage: 'CLOSING', // Derived
                        status: 'ACTIVE',
                        lastContactAt: dealData.updatedAt,
                        objections: [],
                        notesShort: '',
                        createdAt: dealData.createdAt,
                        updatedAt: dealData.updatedAt
                    });
                } else {
                    toast.error("Lead não encontrado");
                    navigate('/crm');
                }
            } catch (error) {
                console.error("Error fetching lead:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeadData();
    }, [leadId, navigate]);

    if (loading) return <div className="flex items-center justify-center p-12"><Loader className="animate-spin" /></div>;
    if (!lead || !deal) return null;

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
        const success = await copyToClipboard(message);
        if (success) {
            toast.success('Copiado!');
        } else {
            toast.error('Erro ao copiar');
        }
    };

    const handleTemplateSelect = (content: string) => {
        if (!lead) return;
        const firstName = lead.name.split(' ')[0];
        const processed = content
            .replace(/{{nome}}/g, firstName) // Most common use case is first name for "nome" actually, or we can use specific var
            .replace(/{{primeiro_nome}}/g, firstName)
            .replace(/{{nome_completo}}/g, lead.name)
            .replace(/{{empresa}}/g, 'sua empresa');

        openWhatsApp(lead.whatsapp, processed);
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
                        <CardHeader
                            title="Ações Rápidas"
                            action={
                                <Button variant="ghost" size="sm" onClick={() => setShowTemplatesModal(true)}>
                                    Configurar
                                </Button>
                            }
                        />
                        <CardContent>
                            <div className="quick-actions-grid">
                                <TemplateSelector onSelect={handleTemplateSelect} />
                                <Button
                                    variant="primary"
                                    fullWidth
                                    icon={<MessageSquare size={16} />}
                                    onClick={() => openWhatsApp(lead.whatsapp, `Fala ${lead.name.split(' ')[0]}! Tudo bem?`)}
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
                                {lead.stage !== 'WON' && !deal && (
                                    <Button
                                        variant="secondary"
                                        fullWidth
                                        icon={<Flame size={16} />}
                                        onClick={() => setShowCreateDealModal(true)}
                                    >
                                        Criar Deal
                                    </Button>
                                )}
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
                                <div className="timeline-item">
                                    <div className="timeline-marker">
                                        <div className="timeline-dot timeline-dot-created" />
                                    </div>
                                    <div className="timeline-content">
                                        <p className="timeline-text">Lead/Deal criado</p>
                                        <span className="timeline-date">{formatDate(lead.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="timeline-item">
                                    <div className="timeline-marker">
                                        <div className="timeline-dot timeline-dot-stage" />
                                    </div>
                                    <div className="timeline-content">
                                        <p className="timeline-text">Última atualização: {deal.stage}</p>
                                        <span className="timeline-date">{formatDate(deal.updatedAt)}</span>
                                    </div>
                                </div>
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

            <CreateDealModal
                isOpen={showCreateDealModal}
                onClose={() => setShowCreateDealModal(false)}
                leadId={lead.id}
                leadName={lead.name}
                leadWhatsapp={lead.whatsapp}
            />

            <MessageTemplatesModal
                isOpen={showTemplatesModal}
                onClose={() => setShowTemplatesModal(false)}
            />
        </div>
    );
};

export default LeadProfilePage;
