import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Button, Badge, Skeleton } from '../ui';
import {
    CheckCircle,
    ArrowRight,
    MessageSquare,
    Phone,
    DollarSign,
    AlertTriangle,
    Zap,
    Copy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '../ui/Toast';
import { openWhatsApp, copyToClipboard } from '../../utils/whatsapp';
import './ActionCenter.css';

// Types specific to this aggregated view
interface ActionItem {
    id: string;
    type: 'DEAL' | 'MENTEE' | 'CALL';
    priority: 'CRITICAL' | 'ATTENTION' | 'NORMAL';
    title: string;
    subtitle: string;
    entityId: string;
    timestamp: Date;
    amount?: number;
    whatsapp?: string;
    suggestedMessage?: string;
    actionLink: string;
    actionLabel: string;
    metadata?: {
        stage?: string;
        delayHours?: number;
    };
}

export const ActionCenter: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [actions, setActions] = useState<ActionItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActions = async () => {
            const allActions: ActionItem[] = [];

            try {
                // 1. CRM DEALS (Sales Focus)
                // Critical: Payment Sent or Closing > 24h
                const qCriticalDeals = query(
                    collection(db, 'deals'),
                    where('stage', 'in', ['PAYMENT_SENT', 'CLOSING']),
                    orderBy('updatedAt', 'desc')
                );

                // Active: Pitch Sent or Open
                const qActiveDeals = query(
                    collection(db, 'deals'),
                    where('stage', 'in', ['PITCH_SENT', 'OPEN']),
                    orderBy('updatedAt', 'desc'),
                    limit(10)
                );

                const [snapCritical, snapActive] = await Promise.all([
                    getDocs(qCriticalDeals),
                    getDocs(qActiveDeals)
                ]);

                // Process Critical Deals
                snapCritical.docs.forEach(doc => {
                    const data = doc.data();
                    const updatedAt = data.updatedAt?.toDate() || new Date();
                    const hoursSince = Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60));

                    if (hoursSince > 24) {
                        allActions.push({
                            id: `deal-crit-${doc.id}`,
                            type: 'DEAL',
                            priority: 'CRITICAL',
                            title: data.leadName || 'Sem nome',
                            subtitle: `Aguardando pagamento (${data.offerName})`,
                            entityId: `lead/${data.leadId}`,
                            timestamp: updatedAt,
                            amount: data.pitchAmount,
                            whatsapp: data.leadWhatsapp,
                            suggestedMessage: "Oi tudo bem? Vi que o pagamento não compensou ainda. Teve alguma dúvida?",
                            actionLink: `/lead/${data.leadId}`,
                            actionLabel: 'Ver Deal',
                            metadata: { stage: data.stage, delayHours: hoursSince }
                        });
                    }
                });

                // Process Active Deals
                snapActive.docs.forEach(doc => {
                    const data = doc.data();
                    const updatedAt = data.updatedAt?.toDate() || new Date();
                    const hoursSince = Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60));

                    // Pitch sent > 24h is Attention
                    let priority: 'ATTENTION' | 'NORMAL' = 'NORMAL';
                    if (data.stage === 'PITCH_SENT' && hoursSince > 24) priority = 'ATTENTION';

                    allActions.push({
                        id: `deal-act-${doc.id}`,
                        type: 'DEAL',
                        priority: priority,
                        title: data.leadName || 'Lead',
                        subtitle: `${data.stage === 'PITCH_SENT' ? 'Pitch enviado' : 'Novo Lead'} - ${data.offerName}`,
                        entityId: `lead/${data.leadId}`,
                        timestamp: updatedAt,
                        amount: data.pitchAmount,
                        whatsapp: data.leadWhatsapp,
                        actionLink: `/lead/${data.leadId}`,
                        actionLabel: 'Negociar',
                        metadata: { stage: data.stage, delayHours: hoursSince }
                    });
                });

                // 2. MENTEES (Delivery Focus)
                // Stuck mentees (no update > 7 days)
                const qMentees = query(
                    collection(db, 'mentees'),
                    where('active', '==', true)
                );
                const snapMentees = await getDocs(qMentees);

                snapMentees.docs.forEach(doc => {
                    const data = doc.data();
                    const lastUpdate = data.lastUpdateAt?.toDate() || data.createdAt?.toDate() || new Date();
                    const daysSince = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

                    if (daysSince > 7) {
                        allActions.push({
                            id: `mentee-stuck-${doc.id}`,
                            type: 'MENTEE',
                            priority: 'ATTENTION',
                            title: data.name,
                            subtitle: `Sem atualização há ${daysSince} dias`,
                            entityId: doc.id,
                            timestamp: lastUpdate,
                            whatsapp: data.whatsapp,
                            suggestedMessage: `Oi ${data.name.split(' ')[0]}, como está o progresso? Vamos destravar essa semana!`,
                            actionLink: `/mentee/${doc.id}`,
                            actionLabel: 'Cobrar',
                            metadata: { delayHours: daysSince * 24 }
                        });
                    }
                });

                // 3. CALLS (Routine)
                // Calls for today
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);

                // We'll filter in memory to avoid complex indexes for this simple widget
                const qAllCalls = query(collection(db, 'calls'), limit(50)); // Optimization: just get recent calls
                const snapCalls = await getDocs(qAllCalls);

                snapCalls.docs.forEach(doc => {
                    const data = doc.data();
                    const scheduledAt = data.scheduledAt?.toDate();
                    if (!scheduledAt) return;

                    const isToday = scheduledAt.getDate() === new Date().getDate() &&
                        scheduledAt.getMonth() === new Date().getMonth();

                    if (isToday) {
                        allActions.push({
                            id: `call-${doc.id}`,
                            type: 'CALL',
                            priority: 'NORMAL', // Unless it's happening NOW
                            title: 'Call Agendada',
                            subtitle: `${format(scheduledAt, 'HH:mm')} - ${data.menteeName || 'Mentorado'}`,
                            entityId: data.menteeId,
                            timestamp: scheduledAt,
                            actionLink: '/calendar',
                            actionLabel: 'Entrar',
                            metadata: { delayHours: 0 }
                        });
                    }
                });


                // SORT STRATEGY: 
                // 1. Critical first
                // 2. Then Attention
                // 3. Then Normal
                // Within priority: Money at stake (Deals) > Stuck Mentees > Calls
                const priorityWeight = { CRITICAL: 3, ATTENTION: 2, NORMAL: 1 };
                const typeWeight = { DEAL: 3, MENTEE: 2, CALL: 1 };

                const sorted = allActions.sort((a, b) => {
                    const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
                    if (pDiff !== 0) return pDiff;

                    const tDiff = typeWeight[b.type] - typeWeight[a.type];
                    if (tDiff !== 0) return tDiff;

                    return b.timestamp.getTime() - a.timestamp.getTime();
                });

                setActions(sorted.slice(0, 15)); // Limit to top 15

            } catch (error) {
                console.error("Error fetching actions:", error);
                toast.error("Erro ao carregar ações do dia");
            } finally {
                setLoading(false);
            }
        };

        fetchActions();
    }, []);

    const handleCopy = async (text: string) => {
        const success = await copyToClipboard(text);
        if (success) toast.success("Mensagem copiada!");
    };

    const formatCurrency = (val?: number) => val ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val) : '';

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton height={100} variant="card" />
                <Skeleton height={100} variant="card" />
                <Skeleton height={100} variant="card" />
            </div>
        );
    }

    return (
        <div className="action-center">
            {/* Header */}
            <div className="action-center-header">
                <div className="action-center-title">
                    <Zap size={24} className="text-warning" fill="currentColor" fillOpacity={0.2} />
                    <span>Ações Prioritárias</span>
                    <Badge variant="default" className="text-sm ml-2">{actions.length}</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/execution')}>
                    Modo Foco <ArrowRight size={16} className="ml-2" />
                </Button>
            </div>

            {/* Feed */}
            {actions.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">
                        <CheckCircle size={32} />
                    </div>
                    <h3>Tudo limpo por aqui!</h3>
                    <p>Nenhuma pendência urgente encontrada.</p>
                </div>
            ) : (
                <div className="action-feed">
                    {actions.map(action => (
                        <div key={action.id} className={`action-item priority-${action.priority.toLowerCase()}`}>
                            <div className="action-priority-indicator" />

                            <div className="action-content">
                                <div className="action-header">
                                    <div className="action-main-info">
                                        <div className="action-icon">
                                            {action.type === 'DEAL' && <DollarSign size={20} />}
                                            {action.type === 'MENTEE' && <AlertTriangle size={20} />}
                                            {action.type === 'CALL' && <Phone size={20} />}
                                        </div>
                                        <div>
                                            <div className="action-title-group">
                                                <h3>{action.title}</h3>
                                            </div>
                                            <p className="action-subtitle">
                                                {action.priority === 'CRITICAL' && <AlertTriangle size={12} className="text-error mr-1" />}
                                                {action.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {action.amount && (
                                            <span className="block font-bold text-success text-sm">{formatCurrency(action.amount)}</span>
                                        )}
                                        <span className="text-xs text-secondary">
                                            {format(action.timestamp, "d MMM", { locale: ptBR })}
                                        </span>
                                    </div>
                                </div>

                                {/* Metadata / Quick Actions */}
                                {action.suggestedMessage && (
                                    <div className="bg-white/5 p-3 rounded-md border border-white/5 text-sm text-secondary italic flex justify-between items-center gap-4 group">
                                        <span className="truncate">"{action.suggestedMessage}"</span>
                                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0" onClick={() => handleCopy(action.suggestedMessage!)}>
                                            <Copy size={12} />
                                        </Button>
                                    </div>
                                )}

                                <div className="action-footer">
                                    {action.whatsapp && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            icon={<MessageSquare size={16} />}
                                            onClick={() => openWhatsApp(action.whatsapp!, action.suggestedMessage)}
                                            className="text-success hover:text-success hover:bg-success/10"
                                        >
                                            WhatsApp
                                        </Button>
                                    )}
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        icon={<ArrowRight size={16} />}
                                        onClick={() => navigate(action.actionLink)}
                                    >
                                        {action.actionLabel}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
