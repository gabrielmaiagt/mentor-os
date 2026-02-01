import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Calendar,
    Clock,
    AlertTriangle,
    MessageSquare,
    Trash2,
    CreditCard,
    Archive,
    RotateCcw,
    Check,
    X
} from 'lucide-react';
import { Card, Badge, Button } from '../../components/ui';
import { MENTEE_STAGES, getStageConfig } from '../../types';
import type { Mentee, MenteeStage } from '../../types';
import { AddMenteeModal } from './AddMenteeModal';
import { useToast } from '../../components/ui/Toast';
import { exportToCSV, formatMenteesForExport } from '../../utils/export';
import { Download } from 'lucide-react';
import './Mentees.css';

// ... (mockMiningSummaries remains same)

export const MenteesPage: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStage, setFilterStage] = useState<MenteeStage | 'ALL'>('ALL');
    const [viewMode, setViewMode] = useState<'ACTIVE' | 'PENDING' | 'ARCHIVED'>('ACTIVE');
    const [mentees, setMentees] = useState<Mentee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch Mentees from Firestore
    useEffect(() => {
        const q = query(
            collection(db, 'mentees'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMentees = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert timestamps back to Dates
                startAt: doc.data().startAt?.toDate() || new Date(),
                lastUpdateAt: doc.data().lastUpdateAt?.toDate() || new Date(),
                nextCallAt: doc.data().nextCallAt?.toDate(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
                active: doc.data().active !== false, // Default to true if undefined
                status: doc.data().status || (doc.data().active === false ? 'ARCHIVED' : 'ACTIVE')
            })) as Mentee[];
            setMentees(fetchedMentees);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching mentees:", error);
            toast.error("Erro ao carregar mentorados");
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSaveMentee = async (newMenteeData: Partial<Mentee>) => {
        try {
            await addDoc(collection(db, 'mentees'), {
                ...newMenteeData,
                createdBy: auth.currentUser?.uid,
                createdAt: new Date(),
                updatedAt: new Date(),
                // Default values if not present
                currentStage: 'ONBOARDING',
                stageProgress: 0,
                blocked: false,
                active: true,
                startAt: newMenteeData.startAt || new Date()
            });
            toast.success('Mentorado cadastrado com sucesso!');
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error creating mentee:", error);
            toast.error('Erro ao cadastrar mentorado');
        }
    }
    const handleExport = () => {
        const formatted = formatMenteesForExport(mentees);
        exportToCSV(formatted, 'mentorados');
        toast.success(`Lista de mentorados exportada!`);
    };

    const handleApproveMentee = async (mentee: Mentee, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm(`Deseja aprovar a entrada de ${mentee.name}?`)) return;

        try {
            await updateDoc(doc(db, 'mentees', mentee.id), {
                status: 'ACTIVE',
                active: true,
                updatedAt: new Date()
            });
            toast.success(`Mentorado aprovado com sucesso!`);
        } catch (error) {
            console.error("Error approving mentee:", error);
            toast.error("Erro ao aprovar mentorado");
        }
    };

    const handleRejectMentee = async (mentee: Mentee, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm(`Deseja rejeitar e arquivar a solicitação de ${mentee.name}?`)) return;

        try {
            await updateDoc(doc(db, 'mentees', mentee.id), {
                status: 'ARCHIVED',
                active: false,
                updatedAt: new Date()
            });
            toast.success(`Solicitação rejeitada e arquivada.`);
        } catch (error) {
            console.error("Error rejecting mentee:", error);
            toast.error("Erro ao rejeitar solicitação");
        }
    };

    const handleToggleActive = async (mentee: Mentee, e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = !mentee.active;
        const actionName = newStatus ? 'reativado' : 'arquivado';

        if (newStatus === false && !window.confirm(`Deseja arquivar ${mentee.name}? Ele sairá da lista principal.`)) {
            return;
        }

        try {
            await updateDoc(doc(db, 'mentees', mentee.id), {
                active: newStatus,
                status: newStatus ? 'ACTIVE' : 'ARCHIVED',
                updatedAt: new Date()
            });
            toast.success(`Mentorado ${actionName} com sucesso`);
        } catch (error) {
            console.error(`Error toggling active status:`, error);
            toast.error(`Erro ao atualizar status`);
        }
    };

    const handleDeleteMentee = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('ATENÇÃO: Deseja EXCLUIR DEFINITIVAMENTE este mentorado? Para apenas ocultar, use o botão Arquivar. Esta ação não pode ser desfeita.')) {
            try {
                await deleteDoc(doc(db, 'mentees', id));
                toast.success('Mentorado removido permanentemente');
            } catch (error) {
                console.error("Error deleting mentee:", error);
                toast.error('Erro ao remover mentorado');
            }
        }
    };

    const filteredMentees = mentees.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStage = filterStage === 'ALL' || m.currentStage === filterStage;

        let matchesStatus = false;
        if (viewMode === 'ACTIVE') matchesStatus = m.status === 'ACTIVE' || (m.status === undefined && m.active !== false);
        if (viewMode === 'PENDING') matchesStatus = m.status === 'PENDING';
        if (viewMode === 'ARCHIVED') matchesStatus = m.status === 'ARCHIVED' || (m.status !== 'PENDING' && m.active === false);

        return matchesSearch && matchesStage && matchesStatus;
    });

    const getDaysSince = (date?: Date) => {
        if (!date) return null;
        return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    };

    const formatNextCall = (date?: Date) => {
        if (!date) return null;
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (hours < 0) return 'Atrasada';
        if (hours < 24) return `Hoje`;
        if (days === 1) return 'Amanhã';
        return `Em ${days} dias`;
    };

    if (loading) {
        return <div className="p-8 text-center text-secondary">Carregando mentorados...</div>;
    }

    return (
        <div className="mentees">
            {/* Header */}
            <div className="mentees-header">
                <div>
                    <h1 className="mentees-title">Mentorados</h1>
                    <p className="mentees-subtitle">
                        {mentees.filter(m => m.status === 'ACTIVE' || (m.status === undefined && m.active !== false)).length} ativos
                        {mentees.some(m => m.status === 'PENDING') && ` • ${mentees.filter(m => m.status === 'PENDING').length} pendentes`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" icon={<Download size={18} />} onClick={handleExport}>
                        Exportar
                    </Button>
                    <div className="flex bg-surface-primary rounded-lg p-1 border border-border">
                        <button
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'ACTIVE' ? 'bg-primary text-white font-medium shadow-sm' : 'text-secondary hover:text-primary hover:bg-surface-secondary'}`}
                            onClick={() => setViewMode('ACTIVE')}
                        >
                            Ativos
                        </button>
                        <button
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2 ${viewMode === 'PENDING' ? 'bg-primary text-white font-medium shadow-sm' : 'text-secondary hover:text-primary hover:bg-surface-secondary'}`}
                            onClick={() => setViewMode('PENDING')}
                        >
                            Pendentes
                            {mentees.some(m => m.status === 'PENDING') && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${viewMode === 'PENDING' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                                    {mentees.filter(m => m.status === 'PENDING').length}
                                </span>
                            )}
                        </button>
                        <button
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === 'ARCHIVED' ? 'bg-primary text-white font-medium shadow-sm' : 'text-secondary hover:text-primary hover:bg-surface-secondary'}`}
                            onClick={() => setViewMode('ARCHIVED')}
                        >
                            Arquivados
                        </button>
                    </div>
                    <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsModalOpen(true)}>
                        Novo Mentorado
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="mentees-filters">
                <div className="mentees-search">
                    <Search size={18} className="mentees-search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mentees-search-input"
                    />
                </div>

                <div className="mentees-stage-filters">
                    <button
                        className={`stage-filter ${filterStage === 'ALL' ? 'active' : ''}`}
                        onClick={() => setFilterStage('ALL')}
                    >
                        Todos
                    </button>
                    {MENTEE_STAGES.map(stage => (
                        <button
                            key={stage.key}
                            className={`stage-filter ${filterStage === stage.key ? 'active' : ''}`}
                            onClick={() => setFilterStage(stage.key as MenteeStage)}
                        >
                            <span
                                className="stage-indicator"
                                style={{ backgroundColor: stage.color }}
                            />
                            {stage.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="mentees-grid">
                {filteredMentees.map(mentee => {
                    const stageConfig = getStageConfig(MENTEE_STAGES, mentee.currentStage);
                    const daysSinceUpdate = getDaysSince(mentee.lastUpdateAt);
                    const nextCall = formatNextCall(mentee.nextCallAt);
                    const isActive = mentee.active !== false;

                    return (
                        <Card
                            key={mentee.id}
                            variant="interactive"
                            padding="md"
                            className={`mentee-card ${mentee.blocked ? 'mentee-blocked' : ''} ${!isActive ? 'opacity-75 grayscale' : ''}`}
                            onClick={() => navigate(`/mentee/${mentee.id}`)}
                        >
                            {/* Header */}
                            <div className="mentee-card-header">
                                <div className="mentee-avatar">
                                    {mentee.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="mentee-info">
                                    <h3 className="mentee-name">
                                        {mentee.name}
                                        {!isActive && <span className="text-secondary text-xs ml-2">(Arquivado)</span>}
                                    </h3>
                                    <span className="mentee-plan">{mentee.plan}</span>
                                </div>
                                {mentee.blocked && (
                                    <Badge variant="error" pulse>
                                        <AlertTriangle size={12} /> Travado
                                    </Badge>
                                )}
                            </div>

                            {/* Stage Progress */}
                            <div className="mentee-stage">
                                <div className="mentee-stage-header">
                                    <span
                                        className="mentee-stage-name"
                                        style={{ color: stageConfig?.color }}
                                    >
                                        {stageConfig?.label}
                                    </span>
                                    <span className="mentee-stage-progress">{mentee.stageProgress}%</span>
                                </div>
                                <div className="mentee-progress-bar">
                                    <div
                                        className="mentee-progress-fill"
                                        style={{
                                            width: `${mentee.stageProgress}%`,
                                            backgroundColor: stageConfig?.color
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Meta Info */}
                            <div className="mentee-meta">
                                <div className="mentee-meta-item">
                                    <Clock size={14} />
                                    <span className={daysSinceUpdate && daysSinceUpdate > 5 ? 'text-error' : ''}>
                                        {daysSinceUpdate !== null ? `${daysSinceUpdate}d desde update` : 'Sem updates'}
                                    </span>
                                </div>
                                {nextCall && (
                                    <div className="mentee-meta-item">
                                        <Calendar size={14} />
                                        <span className={nextCall === 'Atrasada' ? 'text-error' : ''}>
                                            Call: {nextCall}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="mentee-actions">
                                <span className="text-xs text-secondary flex items-center gap-1 mr-auto">
                                    <CreditCard size={12} />
                                    {/* TODO: Real Payment Method Check */}
                                    Pix
                                </span>
                                {viewMode === 'PENDING' ? (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-success hover:bg-success-light"
                                            title="Aprovar Entrada"
                                            onClick={(e) => handleApproveMentee(mentee, e)}
                                        >
                                            <Check size={18} />
                                            Aprovar
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-error hover:bg-error-light"
                                            title="Rejeitar Solicitação"
                                            onClick={(e) => handleRejectMentee(mentee, e)}
                                        >
                                            <X size={18} />
                                            Rejeitar
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            icon={<MessageSquare size={14} />}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(`https://wa.me/55${mentee.whatsapp}`, '_blank');
                                            }}
                                        >
                                            WhatsApp
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-secondary hover:text-primary"
                                            title={isActive ? "Arquivar (Inativar)" : "Reativar"}
                                            onClick={(e) => handleToggleActive(mentee, e)}
                                        >
                                            {isActive ? <Archive size={14} /> : <RotateCcw size={14} />}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-error hover:bg-error-light"
                                            title="Excluir Permanentemente"
                                            onClick={(e) => handleDeleteMentee(mentee.id, e)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {filteredMentees.length === 0 && (
                <div className="mentees-empty">
                    <p>Nenhum mentorado encontrado.</p>
                </div>
            )}

            <AddMenteeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveMentee}
            />
        </div>
    );
};
export default MenteesPage;
