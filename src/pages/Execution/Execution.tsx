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
    User,
    DollarSign,
    AlertTriangle,
    ExternalLink
} from 'lucide-react';
import { Card, Badge, Button } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import type { ActionItem } from '../../types';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Loader } from 'lucide-react';

// Mock data removed

export const ExecutionPage: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
    const [message, setMessage] = useState('');
    const [queue, setQueue] = useState<ActionItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch and Build Queue (Logic copied/adapted from Dashboard)
    React.useEffect(() => {
        setLoading(true);
        const fetchData = async () => {
            // 1. Deals (Sales Actions)
            const dealsSnap = await getDocs(query(collection(db, 'deals')));
            const deals = dealsSnap.docs.map(d => ({ id: d.id, ...d.data(), updatedAt: d.data().updatedAt?.toDate() })) as any[];

            const salesActions: ActionItem[] = deals
                .filter(d => ['OPEN', 'PITCH_SENT', 'PAYMENT_SENT'].includes(d.stage))
                .map(d => {
                    const hoursSince = Math.floor((Date.now() - d.updatedAt.getTime()) / (1000 * 60 * 60));
                    let urgency: 'normal' | 'attention' | 'critical' = 'normal';
                    if (hoursSince > 48) urgency = 'critical';
                    else if (hoursSince > 24) urgency = 'attention';

                    return {
                        id: d.id,
                        type: 'deal',
                        entityId: d.id,
                        title: d.leadName,
                        subtitle: `${d.offerName} - ${d.stage}`,
                        urgency,
                        delayHours: hoursSince,
                        amount: d.pitchAmount,
                        whatsapp: d.leadWhatsapp,
                        stage: d.stage,
                        suggestedMessage: d.stage === 'PAYMENT_SENT'
                            ? `Fala ${d.leadName.split(' ')[0]}! Tudo certo? Vi que ficou pendente a confirmação do pagamento. Consegue resolver hoje?`
                            : `Oi ${d.leadName.split(' ')[0]}, tudo bem? Como estamos em relação à proposta?`
                    } as ActionItem;
                });

            // 2. Mentees (Stuck)
            const menteesSnap = await getDocs(query(collection(db, 'mentees')));
            const mentees = menteesSnap.docs.map(d => ({ id: d.id, ...d.data(), lastUpdateAt: d.data().lastUpdateAt?.toDate() })) as any[];

            const stuckMentees: ActionItem[] = mentees
                .filter(m => {
                    if (!m.lastUpdateAt) return false;
                    const daysSince = Math.floor((Date.now() - m.lastUpdateAt.getTime()) / (1000 * 60 * 60 * 24));
                    return daysSince > 5;
                })
                .map(m => ({
                    id: `stuck-${m.id}`,
                    type: 'mentee',
                    entityId: m.id,
                    title: m.name,
                    subtitle: `Etapa: ${m.currentStage} - Sem update recente`,
                    urgency: 'critical',
                    delayHours: Math.floor((Date.now() - (m.lastUpdateAt?.getTime() || 0)) / (1000 * 60 * 60)),
                    whatsapp: m.whatsapp || '',
                    suggestedMessage: `Oi ${m.name.split(' ')[0]}, vi que faz um tempo que não temos novidades. Como estão as coisas?`,
                    stage: m.currentStage
                } as ActionItem));

            // Combine and sort
            const combined = [...salesActions, ...stuckMentees].sort((a, b) => {
                // Sort by urgency first
                if (a.urgency === 'critical' && b.urgency !== 'critical') return -1;
                if (b.urgency === 'critical' && a.urgency !== 'critical') return 1;
                // Then by delay
                return (b.delayHours || 0) - (a.delayHours || 0);
            });

            setQueue(combined);
            setLoading(false);
        };
        fetchData();
    }, []);

    const activeQueue = useMemo(() =>
        queue.filter(item => !completedIds.has(item.id)),
        [queue, completedIds]
    );

    const currentItem = activeQueue[currentIndex] || null;
    const progress = queue.length > 0 ? (completedIds.size / queue.length) * 100 : 0;

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

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin text-primary" size={32} /></div>;

    // All done state
    if (activeQueue.length === 0 && queue.length > 0 && completedIds.size > 0) {
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

    if (activeQueue.length === 0 && !loading) {
        return (
            <div className="execution">
                <div className="execution-complete">
                    <h1 className="execution-complete-title">Nada pendente! 😎</h1>
                    <p className="execution-complete-text">
                        Você não tem ações críticas de venda ou entrega pendentes.
                    </p>
                    <Button variant="primary" onClick={() => navigate('/dashboard')}>
                        Voltar ao Dashboard
                    </Button>
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
                        <span>{completedIds.size} de {queue.length}</span>
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
