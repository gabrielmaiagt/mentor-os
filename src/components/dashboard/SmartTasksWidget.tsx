import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardHeader, CardContent, Button, Badge } from '../ui';
import { CheckCircle, Clock, ArrowRight, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { SmartTask, Deal } from '../../types';
import './SmartTasksWidget.css';

export const SmartTasksWidget: React.FC = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState<SmartTask[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSmartTasks = async () => {
            const calculatedTasks: SmartTask[] = [];

            try {
                // 1. CRITICAL: Deals in CLOSING/PAYMENT_SENT without update > 24h
                const qClosing = query(
                    collection(db, 'deals'),
                    where('stage', 'in', ['CLOSING', 'PAYMENT_SENT']),
                    where('updatedAt', '<', new Date(Date.now() - 24 * 60 * 60 * 1000))
                );
                const snapClosing = await getDocs(qClosing);

                snapClosing.docs.forEach(doc => {
                    const deal = doc.data() as Deal;
                    calculatedTasks.push({
                        id: `task-close-${doc.id}`,
                        type: 'DEAL_CLOSE',
                        priority: 'CRITICAL',
                        entityId: deal.id,
                        entityName: deal.leadName || 'Desconhecido',
                        description: `Deal em fechamento parado há >24h. Cobrar pagamento!`,
                        actionParams: {
                            whatsapp: deal.leadWhatsapp,
                            link: `/lead/${deal.leadId}`
                        },
                        date: (deal.updatedAt as any)?.toDate?.() || deal.updatedAt || new Date()
                    });
                });

                // 2. HIGH: Deals in PITCH_SENT without update > 48h
                const qPitch = query(
                    collection(db, 'deals'),
                    where('stage', '==', 'PITCH_SENT'),
                    where('updatedAt', '<', new Date(Date.now() - 48 * 60 * 60 * 1000))
                );
                const snapPitch = await getDocs(qPitch);

                snapPitch.docs.forEach(doc => {
                    const deal = doc.data() as Deal;
                    calculatedTasks.push({
                        id: `task-pitch-${doc.id}`,
                        type: 'LEAD_FOLLOW_UP',
                        priority: 'HIGH',
                        entityId: deal.id,
                        entityName: deal.leadName || 'Desconhecido',
                        description: `Pitch enviado há >48h. Fazer follow-up.`,
                        actionParams: {
                            whatsapp: deal.leadWhatsapp,
                            link: `/lead/${deal.leadId}`
                        },
                        date: (deal.updatedAt as any)?.toDate?.() || deal.updatedAt || new Date()
                    });
                });

                // 3. NORMAL: New Leads without contact (simulated by checking if deal/lead exists separately, but here assuming deals represent leads)
                // Assuming OPEN deals are new leads
                const qNew = query(
                    collection(db, 'deals'),
                    where('stage', '==', 'OPEN'),
                    where('createdAt', '<', new Date(Date.now() - 24 * 60 * 60 * 1000))
                );
                const snapNew = await getDocs(qNew);

                snapNew.docs.forEach(doc => {
                    const deal = doc.data() as Deal;
                    calculatedTasks.push({
                        id: `task-new-${doc.id}`,
                        type: 'LEAD_FOLLOW_UP',
                        priority: 'NORMAL',
                        entityId: deal.id,
                        entityName: deal.leadName || 'Desconhecido',
                        description: `Novo lead parado. Iniciar contato.`,
                        actionParams: {
                            whatsapp: deal.leadWhatsapp,
                            link: `/lead/${deal.leadId}`
                        },
                        date: (deal.createdAt as any)?.toDate?.() || deal.createdAt || new Date()
                    });
                });

                // Sort by priority (Critical > High > Normal) and then date
                const priorityOrder = { CRITICAL: 0, HIGH: 1, NORMAL: 2 };
                calculatedTasks.sort((a, b) => {
                    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                        return priorityOrder[a.priority] - priorityOrder[b.priority];
                    }
                    return a.date.getTime() - b.date.getTime(); // Oldest first
                });

                // Take top 5
                setTasks(calculatedTasks.slice(0, 5));

            } catch (error) {
                console.error("Error calculating smart tasks:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSmartTasks();
    }, []);

    const getPriorityBadge = (priority: SmartTask['priority']) => {
        switch (priority) {
            case 'CRITICAL': return <Badge variant="error" pulse>Crítico</Badge>; // Assuming 'error' variant exists or fallback
            case 'HIGH': return <Badge variant="warning">Alta</Badge>;
            default: return <Badge variant="default">Normal</Badge>;
        }
    };

    const getIcon = (type: SmartTask['type']) => {
        switch (type) {
            case 'DEAL_CLOSE': return <ArrowRight className="text-error" size={18} />;
            case 'LEAD_FOLLOW_UP': return <MessageSquare className="text-warning" size={18} />;
            default: return <Clock size={16} />;
        }
    };

    if (loading) return (
        <Card>
            <CardContent>
                <div className="p-4 text-center text-secondary">Carregando tarefas inteligentes...</div>
            </CardContent>
        </Card>
    );

    if (tasks.length === 0) return (
        <Card className="smart-tasks-widget empty">
            <CardHeader title="Tarefas Prioritárias" />
            <CardContent>
                <div className="flex flex-col items-center justify-center p-6 text-center">
                    <CheckCircle size={48} className="text-success mb-2 opacity-50" />
                    <p className="text-primary font-medium">Tudo em dia!</p>
                    <p className="text-secondary text-sm">Nenhuma pendência crítica encontrada.</p>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <Card className="smart-tasks-widget">
            <CardHeader
                title={`Tarefas Prioritárias (${tasks.length})`}
                action={<Button variant="ghost" size="sm" onClick={() => navigate('/crm')}>Ver CRM</Button>}
            />
            <CardContent>
                <div className="tasks-list">
                    {tasks.map(task => (
                        <div key={task.id} className={`task-item priority-${task.priority.toLowerCase()}`}>
                            <div className="task-icon">
                                {getIcon(task.type)}
                            </div>
                            <div className="task-details">
                                <div className="task-header">
                                    <span className="task-entity">{task.entityName}</span>
                                    {getPriorityBadge(task.priority)}
                                </div>
                                <p className="task-desc">{task.description}</p>
                            </div>
                            <div className="task-actions">
                                {task.actionParams.whatsapp && (
                                    <button
                                        className="action-icon-btn whatsapp"
                                        title="WhatsApp"
                                        onClick={() => window.open(`https://wa.me/55${task.actionParams.whatsapp}`, '_blank')}
                                    >
                                        <MessageSquare size={16} />
                                    </button>
                                )}
                                <button
                                    className="action-icon-btn"
                                    onClick={() => navigate(task.actionParams.link || '/crm')}
                                >
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
