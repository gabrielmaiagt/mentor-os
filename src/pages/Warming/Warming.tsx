import React, { useState, useEffect } from 'react';
import {
    Smartphone,
    Plus,
    Circle,
    Calendar,
    ChevronRight,
    AlertTriangle,
    Check,
    Phone,
    MessageSquare,
    Users,
    Image,
    Settings,
    Mic,
    Bell
} from 'lucide-react';
import { Card, Button, Badge, Modal, Input, Skeleton } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { WARMING_PROTOCOL } from '../../data/warmingProtocol';
import type { Chip, WarmingActionType } from '../../types';
import { useWarmingScheduler } from '../../hooks/useWarmingScheduler';
import './Warming.css';
import { useAuth } from '../../contexts/AuthContext';

export const WarmingPage: React.FC = () => {
    const toast = useToast();
    const { requestPermission } = useWarmingScheduler();
    const [chips, setChips] = useState<Chip[]>([]);
    const [activeChip, setActiveChip] = useState<Chip | null>(null);
    const [loading, setLoading] = useState(true);

    // Add Chip Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newChipName, setNewChipName] = useState('');
    const [newChipPhone, setNewChipPhone] = useState('');

    const { user } = useAuth();

    useEffect(() => {
        if (!user?.id) return;

        const q = query(
            collection(db, 'warming_chips'),
            where('userId', '==', user.id),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedChips = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                startDate: doc.data().startDate?.toDate() || new Date(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            })) as Chip[];

            setChips(fetchedChips);
            if (fetchedChips.length > 0 && !activeChip) {
                setActiveChip(fetchedChips[0]);
            } else if (activeChip) {
                const updated = fetchedChips.find(c => c.id === activeChip.id);
                if (updated) setActiveChip(updated);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching chips:", error);
            if (error.code !== 'failed-precondition') {
                toast.error("Erro ao carregar chips.");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.id]);

    const handleAddChip = async () => {
        if (!newChipName || !newChipPhone) {
            toast.error('Preencha nome e telefone');
            return;
        }
        if (!user?.id) return;

        try {
            const newChip: Omit<Chip, 'id'> = {
                userId: user.id,
                name: newChipName,
                phoneNumber: newChipPhone,
                status: 'WARMING',
                currentDay: 0,
                startDate: new Date(),
                completedActions: {}, // Map of day -> actionIds
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const docRef = await addDoc(collection(db, 'warming_chips'), newChip);
            toast.success('Chip adicionado!');
            setShowAddModal(false);
            setNewChipName('');
            setNewChipPhone('');
            // Auto select
            setActiveChip({ id: docRef.id, ...newChip });
        } catch (e) {
            console.error(e);
            toast.error('Erro ao adicionar chip');
        }
    };

    const toggleAction = async (chip: Chip, day: number, actionId: string) => {
        if (!chip) return;

        const currentCompletedDay = chip.completedActions?.[day] || [];
        const isCompleted = currentCompletedDay.includes(actionId);

        let newCompletedDay;
        if (isCompleted) {
            newCompletedDay = currentCompletedDay.filter(id => id !== actionId);
        } else {
            newCompletedDay = [...currentCompletedDay, actionId];
        }

        const newCompletedActions = {
            ...chip.completedActions,
            [day]: newCompletedDay
        };

        try {
            // Optimistic update
            const updatedChip = { ...chip, completedActions: newCompletedActions };
            setActiveChip(updatedChip);

            await updateDoc(doc(db, 'warming_chips', chip.id), {
                completedActions: newCompletedActions,
                updatedAt: new Date()
            });

            // Check if day is complete (simple logic: > 80%? or all?)
            // For gamification, let's say 100% to advance? Or explicit advance button?
        } catch (e) {
            toast.error('Erro ao atualizar');
        }
    };

    const advanceDay = async (chip: Chip) => {
        if (chip.currentDay >= 10) return;
        try {
            await updateDoc(doc(db, 'warming_chips', chip.id), {
                currentDay: chip.currentDay + 1,
                updatedAt: new Date()
            });
            toast.success(`Parabéns! Dia ${chip.currentDay} concluído.`);
        } catch (e) {
            toast.error('Erro ao avançar dia');
        }
    };

    const getActionIcon = (type: WarmingActionType) => {
        switch (type) {
            case 'MESSAGE': return <MessageSquare size={18} className="text-primary" />;
            case 'CALL': return <Phone size={18} className="text-success" />;
            case 'STATUS': return <Image size={18} className="text-warning" />;
            case 'GROUP': return <Users size={18} className="text-info" />;
            case 'CONFIG': return <Settings size={18} className="text-secondary" />;
            case 'AUDIO': return <Mic size={18} className="text-error" />;
            default: return <Circle size={18} />;
        }
    };

    if (loading) return <div className="p-6"><Skeleton height={400} /></div>;

    const currentProtocol = WARMING_PROTOCOL.find(p => p.day === activeChip?.currentDay);
    const dayActions = currentProtocol?.actions || [];
    const completedCount = activeChip?.completedActions?.[activeChip.currentDay]?.length || 0;
    const totalActions = dayActions.length;
    const progress = totalActions > 0 ? (completedCount / totalActions) * 100 : 0;
    const isDayComplete = completedCount === totalActions && totalActions > 0;

    return (
        <div className="warming-page p-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-warning to-error">
                        Aquecimento X1 (Blindagem)
                    </h1>
                    <p className="text-secondary mt-1 text-base">
                        Protocolo de 10 dias para preparar seus chips para guerra.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        icon={<Bell size={18} />}
                        onClick={requestPermission}
                        title="Ativar lembretes"
                    >
                        Lembretes
                    </Button>
                    <Button
                        variant="primary"
                        icon={<Plus size={18} />}
                        onClick={() => setShowAddModal(true)}
                        className="shadow-glow"
                    >
                        Novo Chip
                    </Button>
                </div>
            </div>

            {/* Chip Selector */}
            {chips.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-4 mb-4 no-scrollbar">
                    {chips.map(chip => (
                        <div
                            key={chip.id}
                            onClick={() => setActiveChip(chip)}
                            className={`
                                min-w-[200px] p-4 rounded-xl border cursor-pointer transition-all duration-200
                                flex flex-col gap-2 relative overflow-hidden group chip-card
                                ${activeChip?.id === chip.id
                                    ? 'bg-warning/10 border-warning shadow-lg shadow-warning/10'
                                    : 'bg-card border-white/5 hover:border-white/10'
                                }
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`font-bold ${activeChip?.id === chip.id ? 'text-warning' : 'text-primary'}`}>
                                    {chip.name}
                                </span>
                                <Smartphone size={16} className="text-secondary" />
                            </div>
                            <div className="text-xs text-secondary">{chip.phoneNumber}</div>
                            <div className="mt-2 flex items-center justify-between">
                                <Badge variant={chip.status === 'WARMING' ? 'warning' : 'success'} size="sm">
                                    {chip.status}
                                </Badge>
                                <span className="text-xs font-mono font-bold">Dia {chip.currentDay}/10</span>
                            </div>
                            {/* Mini Progress Bar */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
                                <div
                                    className="h-full bg-warning transition-all"
                                    style={{ width: `${(chip.currentDay / 10) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {chips.length === 0 ? (
                <div className="empty-warming-state">
                    <div className="empty-icon-wrapper">
                        <Smartphone size={48} className="text-warning" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Nenhum chip em aquecimento</h2>
                    <p className="text-secondary max-w-md mx-auto mb-8">
                        Seus chips são suas armas. Cadastre seu primeiro número para iniciar o protocolo de blindagem de 10 dias.
                    </p>
                    <Button
                        variant="primary"
                        size="lg"
                        icon={<Plus size={20} />}
                        onClick={() => setShowAddModal(true)}
                        className="shadow-glow"
                    >
                        Iniciar Protocolo Agora
                    </Button>
                </div>
            ) : (activeChip && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content - Timeline */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Day Header */}
                        <div className="p-8 bg-gradient-to-br from-card to-white/5 rounded-3xl border border-white/5 relative overflow-hidden group">
                            <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity duration-700 rotate-12 transform">
                                <Calendar size={180} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex flex-col gap-2 mb-4">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="warning" size="md" className="shadow-lg shadow-warning/20">
                                            DIA {activeChip.currentDay} DE 10
                                        </Badge>
                                        <div className="h-px flex-1 bg-white/10"></div>
                                    </div>
                                    <h2 className="text-3xl font-bold text-white tracking-tight">
                                        {currentProtocol?.title.replace(/Dia \d+ - /, '')}
                                    </h2>
                                </div>
                                <p className="text-secondary max-w-lg leading-relaxed text-lg mb-8">
                                    {currentProtocol?.description}
                                </p>

                                <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                                    <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-warning h-full transition-all duration-500 shadow-[0_0_10px_rgba(var(--warning-rgb),0.5)]"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold text-warning whitespace-nowrap">
                                        {Math.round(progress)}% Concluído
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Checklist */}
                        <div className="space-y-3">
                            {dayActions.map(action => {
                                const isCompleted = activeChip.completedActions?.[activeChip.currentDay]?.includes(action.id);
                                return (
                                    <div
                                        key={action.id}
                                        onClick={() => toggleAction(activeChip, activeChip.currentDay, action.id)}
                                        className={`
                                            group flex items-start md:items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden
                                            ${isCompleted
                                                ? 'bg-warning/5 border-warning/20'
                                                : 'bg-card border-white/5 hover:border-white/10 hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        {/* Progress Line for visual flow */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${isCompleted ? 'bg-warning' : 'bg-transparent group-hover:bg-white/10'}`} />

                                        <div className={`
                                            w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all shrink-0 shadow-lg
                                            ${isCompleted
                                                ? 'bg-warning border-warning text-black scale-110'
                                                : 'border-white/10 text-transparent group-hover:border-warning/50'
                                            }
                                        `}>
                                            <Check size={16} strokeWidth={4} className={`transition-transform duration-300 ${isCompleted ? 'scale-100' : 'scale-0'}`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mb-1">
                                                <span className={`
                                                    font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider w-fit
                                                    ${isCompleted ? 'bg-warning/20 text-warning' : 'bg-white/5 text-secondary'}
                                                `}>
                                                    {action.time}
                                                </span>
                                                <h3 className={`font-bold text-base truncate transition-colors ${isCompleted ? 'text-secondary line-through decoration-secondary/50' : 'text-white'}`}>
                                                    {action.title}
                                                </h3>
                                            </div>
                                            <p className={`text-sm leading-relaxed ${isCompleted ? 'text-secondary/40' : 'text-secondary'}`}>
                                                {action.description}
                                            </p>
                                        </div>

                                        <div className={`
                                            p-2 rounded-lg transition-colors
                                            ${isCompleted ? 'bg-warning/10 opacity-50' : 'bg-white/5 text-white/50 group-hover:text-white group-hover:bg-white/10'}
                                        `}>
                                            {getActionIcon(action.type)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Next Day Button */}
                        {isDayComplete && activeChip.currentDay < 10 && (
                            <div className="flex justify-end pt-4 animate-in fade-in slide-in-from-bottom-4">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    className="bg-success hover:bg-success/80 text-black font-bold shadow-glow-success px-8 h-14 text-base"
                                    onClick={() => advanceDay(activeChip)}
                                    icon={<ChevronRight size={20} />}
                                >
                                    Concluir Dia {activeChip.currentDay} e Avançar
                                </Button>
                            </div>
                        )}

                        {activeChip.currentDay === 10 && isDayComplete && (
                            <div className="p-8 bg-success/10 border border-success/30 rounded-3xl text-center">
                                <h3 className="text-3xl font-bold text-success mb-2">Chip Blindado! 🛡️</h3>
                                <p className="text-secondary text-lg">Este chip completou todo o protocolo. Agora é com você, soldado.</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Overview */}
                    <div className="space-y-6">
                        {/* Rules Card */}
                        <Card className="bg-error/5 border-error/20">
                            <h3 className="font-bold text-error flex items-center gap-2 mb-4">
                                <AlertTriangle size={18} /> Regras de Ouro
                            </h3>
                            <ul className="space-y-3 text-sm text-secondary list-disc pl-4 marker:text-error/50">
                                <li>Nunca use WiFi nos primeiros 2 dias.</li>
                                <li>Intervalo de 2-5 min entre mensagens.</li>
                                <li>Nunca copie e cole a mesma mensagem.</li>
                                <li>Pare imediatamente se a taxa de entrega cair.</li>
                            </ul>
                        </Card>
                    </div>
                </div>
            ))}

            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Novo Chip para Aquecimento"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleAddChip}>Iniciar Protocolo</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Nome de Identificação</label>
                        <Input value={newChipName} onChange={e => setNewChipName(e.target.value)} placeholder="Ex: Chip 03 - Claro (João)" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Número</label>
                        <Input value={newChipPhone} onChange={e => setNewChipPhone(e.target.value)} placeholder="(11) 99999-9999" />
                    </div>
                    <div className="p-3 bg-warning/10 rounded-lg text-xs text-warning border border-warning/20">
                        Ao adicionar, o protocolo começará do <strong>Dia 0 (Preparação)</strong>. Certifique-se de que o chip está inserido no aparelho.
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default WarmingPage;
