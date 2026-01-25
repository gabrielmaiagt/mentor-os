import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    Copy,
    MessageSquare,
    Check,
    Clock,
    RotateCcw,
    Phone,
    User,
    DollarSign,
    AlertTriangle,
    X,
    ExternalLink
} from 'lucide-react';
import { Card, Badge, Button } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import type { ActionItem } from '../../types';
import './Execution.css';

// Combined queue of items to process
const mockQueue: ActionItem[] = [
    {
        id: '1',
        type: 'deal',
        entityId: 'd1',
        title: 'João Silva',
        subtitle: 'Mentoria Tráfego Direto - R$ 3.000',
        urgency: 'critical',
        delayHours: 52,
        amount: 3000,
        whatsapp: '11999887766',
        suggestedMessage: 'Fala João! Tudo certo?\n\nVi que ficou pendente a confirmação do pagamento.\n\nConsegue resolver isso hoje? Bora começar essa semana!',
        stage: 'PAYMENT_SENT',
    },
    {
        id: '2',
        type: 'mentee',
        entityId: 'm1',
        title: 'Carlos Lima',
        subtitle: 'Etapa: TRAFFIC - 8 dias sem update',
        urgency: 'critical',
        delayHours: 192,
        whatsapp: '11976543210',
        suggestedMessage: 'Carlos, tudo bem?\n\nNotei que faz alguns dias que não temos atualização. Como está o progresso?\n\nSe travou em algo, bora marcar uma call rápida pra resolver. Tenho horário amanhã às 15h.',
        stage: 'TRAFFIC',
    },
    {
        id: '3',
        type: 'lead',
        entityId: 'l2',
        title: 'Maria Costa',
        subtitle: 'Lead qualificado - aguardando pitch',
        urgency: 'attention',
        delayHours: 28,
        whatsapp: '11998765432',
        suggestedMessage: 'Maria, boa tarde!\n\nSeparei um tempo pra te explicar como funciona a mentoria de tráfego.\n\nVocê prefere amanhã às 10h ou às 14h?',
        stage: 'QUALIFIED',
    },
    {
        id: '4',
        type: 'deal',
        entityId: 'd3',
        title: 'Pedro Santos',
        subtitle: 'Pitch enviado - aguardando resposta',
        urgency: 'normal',
        delayHours: 18,
        amount: 2500,
        whatsapp: '11987654321',
        suggestedMessage: 'Pedro, como está?\n\nVi a proposta que te mandei. Ficou alguma dúvida?\n\nQualquer coisa estou aqui pra ajudar!',
        stage: 'PITCH_SENT',
    },
];

export const ExecutionPage: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
    const [message, setMessage] = useState('');

    const activeQueue = useMemo(() =>
        mockQueue.filter(item => !completedIds.has(item.id)),
        [completedIds]
    );

    const currentItem = activeQueue[currentIndex] || null;
    const progress = mockQueue.length > 0 ? (completedIds.size / mockQueue.length) * 100 : 0;

    // Initialize message when item changes
    React.useEffect(() => {
        if (currentItem?.suggestedMessage) {
            setMessage(currentItem.suggestedMessage);
        }
    }, [currentItem?.id]);

    const copyAndMarkSent = async () => {
        if (!currentItem) return;

        try {
            await navigator.clipboard.writeText(message);
            toast.success('Copiado e registrado!', 'Mensagem pronta para enviar');
            markComplete();
        } catch (err) {
            toast.error('Erro ao copiar');
        }
    };

    const markComplete = () => {
        if (!currentItem) return;

        setCompletedIds(prev => new Set([...prev, currentItem.id]));

        // Move to next item or stay at current position (which will show next unprocessed)
        if (currentIndex >= activeQueue.length - 1) {
            setCurrentIndex(Math.max(0, activeQueue.length - 2));
        }
    };

    const skip = () => {
        if (currentIndex < activeQueue.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const goBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'deal': return <DollarSign size={16} />;
            case 'lead': return <User size={16} />;
            case 'mentee': return <AlertTriangle size={16} />;
            default: return null;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'deal': return 'Negociação';
            case 'lead': return 'Lead';
            case 'mentee': return 'Mentorado';
            default: return type;
        }
    };

    // All done state
    if (activeQueue.length === 0) {
        return (
            <div className="execution">
                <div className="execution-complete">
                    <div className="execution-complete-icon">
                        <Check size={48} />
                    </div>
                    <h1 className="execution-complete-title">Tudo resolvido! 🎉</h1>
                    <p className="execution-complete-text">
                        Você processou {completedIds.size} item{completedIds.size !== 1 ? 's' : ''} hoje.
                    </p>
                    <div className="execution-complete-actions">
                        <Button variant="primary" onClick={() => navigate('/dashboard')}>
                            Voltar ao Dashboard
                        </Button>
                        <Button variant="secondary" onClick={() => {
                            setCompletedIds(new Set());
                            setCurrentIndex(0);
                        }}>
                            Reiniciar fila
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="execution">
            {/* Header */}
            <div className="execution-header">
                <button className="execution-back" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft size={20} />
                    <span>Dashboard</span>
                </button>

                <div className="execution-progress">
                    <div className="execution-progress-text">
                        <span>{completedIds.size} de {mockQueue.length}</span>
                    </div>
                    <div className="execution-progress-bar">
                        <div
                            className="execution-progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="execution-queue-count">
                    {activeQueue.length} pendente{activeQueue.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Main Card */}
            {currentItem && (
                <div className="execution-main">
                    <Card
                        className={`execution-card ${currentItem.urgency === 'critical' ? 'execution-card-urgent' : ''}`}
                        padding="none"
                    >
                        {/* Card Header */}
                        <div className="execution-card-header">
                            <div className="execution-card-type">
                                {getTypeIcon(currentItem.type)}
                                <span>{getTypeLabel(currentItem.type)}</span>
                                {currentItem.stage && (
                                    <Badge variant="default" size="sm">{currentItem.stage}</Badge>
                                )}
                            </div>

                            {currentItem.urgency === 'critical' && (
                                <Badge variant="error" pulse>
                                    {currentItem.delayHours}h de atraso
                                </Badge>
                            )}
                            {currentItem.urgency === 'attention' && (
                                <Badge variant="warning">
                                    {currentItem.delayHours}h
                                </Badge>
                            )}
                        </div>

                        {/* Card Body */}
                        <div className="execution-card-body">
                            <div className="execution-card-info">
                                <h1 className="execution-card-title">{currentItem.title}</h1>
                                <p className="execution-card-subtitle">{currentItem.subtitle}</p>

                                {currentItem.amount && (
                                    <div className="execution-card-amount">
                                        {new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL',
                                        }).format(currentItem.amount)}
                                    </div>
                                )}
                            </div>

                            {/* Context / Risk */}
                            <div className="execution-card-context">
                                <div className="context-block">
                                    <h4>Contexto</h4>
                                    <p>
                                        {currentItem.type === 'deal' && 'Proposta enviada, aguardando pagamento.'}
                                        {currentItem.type === 'lead' && 'Lead qualificado, momento de avançar para pitch.'}
                                        {currentItem.type === 'mentee' && 'Mentorado sem atualizações recentes.'}
                                    </p>
                                </div>
                                <div className={`context-block ${currentItem.urgency === 'critical' ? 'context-urgent' : ''}`}>
                                    <h4>Risco</h4>
                                    <p>
                                        {currentItem.urgency === 'critical' && 'Alto risco de perda. Ação imediata necessária.'}
                                        {currentItem.urgency === 'attention' && 'Atenção necessária. Lead pode esfriar.'}
                                        {currentItem.urgency === 'normal' && 'Situação normal. Follow-up de rotina.'}
                                    </p>
                                </div>
                            </div>

                            {/* Message Editor */}
                            <div className="execution-message">
                                <label className="execution-message-label">
                                    Mensagem sugerida
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setMessage(currentItem.suggestedMessage || '')}
                                    >
                                        <RotateCcw size={14} /> Resetar
                                    </Button>
                                </label>
                                <textarea
                                    className="execution-message-input"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={6}
                                />
                            </div>
                        </div>

                        {/* Card Footer / Actions */}
                        <div className="execution-card-footer">
                            <div className="execution-actions-primary">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    icon={<Copy size={18} />}
                                    onClick={copyAndMarkSent}
                                >
                                    Copiar & Marcar Enviado
                                </Button>

                                <Button
                                    variant="secondary"
                                    size="lg"
                                    icon={<MessageSquare size={18} />}
                                    onClick={() => window.open(`https://wa.me/55${currentItem.whatsapp}`, '_blank')}
                                >
                                    Abrir WhatsApp
                                </Button>
                            </div>

                            <div className="execution-actions-secondary">
                                <Button variant="ghost" size="sm" icon={<Clock size={14} />}>
                                    Reagendar 24h
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<Check size={14} />}
                                    onClick={markComplete}
                                >
                                    Marcar Resolvido
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={<ExternalLink size={14} />}
                                    onClick={() => navigate(`/${currentItem.type === 'mentee' ? 'mentee' : 'lead'}/${currentItem.entityId}`)}
                                >
                                    Abrir Perfil
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Navigation */}
                    <div className="execution-nav">
                        <Button
                            variant="ghost"
                            disabled={currentIndex === 0}
                            onClick={goBack}
                            icon={<ArrowLeft size={16} />}
                        >
                            Anterior
                        </Button>

                        <span className="execution-nav-count">
                            {currentIndex + 1} / {activeQueue.length}
                        </span>

                        <Button
                            variant="ghost"
                            disabled={currentIndex >= activeQueue.length - 1}
                            onClick={skip}
                            iconPosition="right"
                            icon={<ArrowRight size={16} />}
                        >
                            Pular
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExecutionPage;
