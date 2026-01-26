import React, { useState, useEffect } from 'react';
import {
    Smartphone,
    Plus,
    Circle,
    ChevronRight,
    AlertTriangle,
    Check,
    Phone,
    MessageSquare,
    Users,
    Image,
    Settings,
    Mic,
    Bell,
    Trophy,
    Shield
} from 'lucide-react';
import { Button, Badge, Modal, Input, Skeleton } from '../../components/ui';
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
            if (error?.code !== 'failed-precondition') {
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
            case 'MESSAGE': return <MessageSquare size={20} className="text-primary" />;
            case 'CALL': return <Phone size={20} className="text-success" />;
            case 'STATUS': return <Image size={20} className="text-warning" />;
            case 'GROUP': return <Users size={20} className="text-info" />;
            case 'CONFIG': return <Settings size={20} className="text-secondary" />;
            case 'AUDIO': return <Mic size={20} className="text-error" />;
            default: return <Circle size={20} />;
        }
    };

    if (loading) return <div className="p-8 max-w-[1400px] mx-auto"><Skeleton height={400} /></div>;

    const currentProtocol = WARMING_PROTOCOL.find(p => p.day === activeChip?.currentDay);
    const dayActions = currentProtocol?.actions || [];
    const completedCount = activeChip?.completedActions?.[activeChip.currentDay]?.length || 0;
    const totalActions = dayActions.length;
    const progress = totalActions > 0 ? (completedCount / totalActions) * 100 : 0;
    const isDayComplete = completedCount === totalActions && totalActions > 0;

    return (
        <div className="warming-page min-h-screen p-6 md:p-12 relative overflow-hidden">
            {/* Header Glow Effect */}
            <div className="header-glow" />

            <div className="relative max-w-[1400px] mx-auto z-10 flex flex-col gap-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Shield size={32} className="text-warning" />
                            <h1 className="text-4xl font-bold text-white tracking-tight">
                                Blindagem de Chips
                            </h1>
                        </div>
                        <p className="text-secondary text-lg max-w-2xl">
                            Gerencie o aquecimento dos seus números para evitar bloqueios. Siga o protocolo de 10 dias rigorosamente.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={requestPermission}
                            className="text-secondary hover:text-primary gap-2"
                        >
                            <Bell size={18} /> Ativar Alertas
                        </Button>
                        <Button
                            variant="primary"
                            icon={<Plus size={20} />}
                            onClick={() => setShowAddModal(true)}
                            className="bg-warning hover:bg-warning/80 text-black font-bold px-6 py-6 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:shadow-[0_0_30px_rgba(234,179,8,0.5)] transition-all"
                        >
                            Novo Chip
                        </Button>
                    </div>
                </div>

                {chips.length === 0 ? (
                    <div className="empty-state-card glass-panel rounded-3xl p-12 text-center flex flex-col items-center animate-slide-in">
                        <div className="w-24 h-24 rounded-full bg-warning/10 flex items-center justify-center mb-6 border border-warning/20 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                            <Smartphone size={48} className="text-warning" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-white">Nenhum chip em blindagem</h2>
                        <p className="text-secondary max-w-lg mb-8 text-lg">
                            Adicione seu primeiro número para iniciar a contagem do protocolo de segurança.
                        </p>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => setShowAddModal(true)}
                            className="bg-white text-black hover:bg-white/90 font-bold"
                        >
                            Adicionar Primeiro Chip
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                        {/* Left Column: Chip List (3 cols) */}
                        <div className="xl:col-span-3 flex flex-col gap-4">
                            <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-2 px-2">
                                Seus Chips ({chips.length})
                            </h3>
                            <div className="flex flex-col gap-4 overflow-y-auto pr-2 max-h-[80vh] no-scrollbar">
                                {chips.map(chip => (
                                    <div
                                        key={chip.id}
                                        onClick={() => setActiveChip(chip)}
                                        className={`
                                            chip-card-premium rounded-xl p-6 cursor-pointer group relative chip-sim-cut min-h-[140px] flex flex-col justify-between
                                            ${activeChip?.id === chip.id ? 'active' : ''}
                                        `}
                                    >
                                        <div className="sim-contacts" />

                                        <div className="flex justify-between items-start z-10 relative">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${activeChip?.id === chip.id ? 'bg-warning text-black' : 'bg-white/5 text-secondary'}`}>
                                                <Smartphone size={20} />
                                            </div>
                                            <Badge variant={chip.status === 'WARMING' ? 'warning' : 'success'} className="uppercase text-[10px] tracking-wider font-bold">
                                                {chip.status}
                                            </Badge>
                                        </div>

                                        <div className="z-10 relative">
                                            <h4 className={`font-bold text-lg mb-0.5 leading-tight transition-colors ${activeChip?.id === chip.id ? 'text-white' : 'text-zinc-300'}`}>
                                                {chip.name}
                                            </h4>
                                            <p className="text-secondary text-sm font-mono opacity-80">{chip.phoneNumber}</p>
                                        </div>

                                        <div className="z-10 relative pt-2">
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <span className={activeChip?.id === chip.id ? 'text-warning font-bold' : 'text-secondary'}>
                                                    Dia {chip.currentDay}/10
                                                </span>
                                                <span className="text-white/20">{Math.round((chip.currentDay / 10) * 100)}%</span>
                                            </div>
                                            <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-warning transition-all duration-500"
                                                    style={{ width: `${(chip.currentDay / 10) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column: Active Chip Details (9 cols) */}
                        {activeChip && (
                            <div className="xl:col-span-9 flex flex-col gap-6 animate-slide-in">
                                {/* Day Status Card - Premium with Proper Spacing */}
                                <div className="glass-panel rounded-3xl p-12 relative overflow-hidden border border-white/10 shadow-2xl">
                                    {/* Animated Background Gradient Blob */}
                                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-warning/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none animate-pulse-slow" />
                                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-warning/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                                    <div className="relative z-10 space-y-10">
                                        {/* Header with Badges */}
                                        <div className="flex items-center gap-4">
                                            <Badge variant="default" className="border-2 border-warning/40 text-warning bg-warning/10 px-4 py-2.5 text-sm uppercase tracking-wider font-bold backdrop-blur-sm">
                                                <Shield size={16} className="mr-2" />
                                                Dia {activeChip.currentDay} / 10
                                            </Badge>
                                            {isDayComplete ? (
                                                <Badge variant="success" className="px-4 py-2.5 text-sm animate-in fade-in bg-success/20 text-success border-2 border-success/40 backdrop-blur-sm">
                                                    <Check size={16} className="mr-2" strokeWidth={3} />
                                                    COMPLETO
                                                </Badge>
                                            ) : (
                                                <span className="text-sm text-zinc-400 animate-pulse font-medium flex items-center gap-2">
                                                    <Circle size={8} className="fill-current animate-ping" />
                                                    Em andamento
                                                </span>
                                            )}
                                        </div>

                                        {/* Title & Description */}
                                        <div className="space-y-6">
                                            <h2 className="text-5xl lg:text-7xl font-black text-white tracking-tight leading-none">
                                                {currentProtocol?.title.replace(/Dia \d+ - /, '')}
                                            </h2>
                                            <p className="text-zinc-300 text-xl lg:text-2xl max-w-4xl leading-relaxed font-light">
                                                {currentProtocol?.description}
                                            </p>
                                        </div>

                                        {/* Large Progress Bar - Full Width */}
                                        <div className="w-full space-y-5 pt-6 border-t border-white/5">
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <span className="text-zinc-500 font-semibold text-sm uppercase tracking-wider block mb-2">Progresso do Dia</span>
                                                    <span className="text-white font-black text-6xl tabular-nums leading-none">{Math.round(progress)}%</span>
                                                </div>
                                            </div>
                                            <div className="h-8 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl overflow-hidden backdrop-blur-sm border-2 border-white/10 shadow-2xl">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-400 transition-all duration-1000 ease-out relative overflow-hidden"
                                                    style={{ width: `${progress}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                                                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
                                                    <div className="absolute inset-0 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline Actions */}
                                <div className="pl-4 md:pl-8 py-4 relative">
                                    {/* Vertical Line Container */}
                                    <div className="hidden md:block absolute left-8 top-0 bottom-0 w-px bg-white/5 ml-[19px]" />

                                    <div className="space-y-8 relative">
                                        {dayActions.map((action, index) => {
                                            const isCompleted = activeChip.completedActions?.[activeChip.currentDay]?.includes(action.id);

                                            return (
                                                <div
                                                    key={action.id}
                                                    onClick={() => toggleAction(activeChip, activeChip.currentDay, action.id)}
                                                    className="group relative flex gap-6 md:gap-10 items-start cursor-pointer"
                                                >
                                                    {/* Timeline Node */}
                                                    <div className="hidden md:flex flex-col items-center relative z-10">
                                                        <div className={`
                                                            w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-xl
                                                            ${isCompleted
                                                                ? 'bg-warning border-warning text-black scale-110 shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                                                                : 'bg-background border-white/20 text-transparent group-hover:border-warning/50'
                                                            }
                                                        `}>
                                                            <Check size={18} strokeWidth={3} className={`transition-transform duration-300 ${isCompleted ? 'scale-100' : 'scale-0'}`} />
                                                        </div>
                                                        {index !== dayActions.length - 1 && (
                                                            <div className={`w-0.5 h-full absolute top-10 -bottom-8 transition-colors duration-500 ${isCompleted ? 'bg-warning/50' : 'bg-transparent'}`} />
                                                        )}
                                                    </div>

                                                    {/* Content Card */}
                                                    <div className={`
                                                        flex-1 glass-panel rounded-2xl p-6 transition-all duration-300 border-l-4
                                                        ${isCompleted
                                                            ? 'border-l-warning bg-warning/5'
                                                            : 'border-l-transparent hover:border-l-white/20 hover:bg-white/5'
                                                        }
                                                    `}>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <Badge variant="default" className="font-mono bg-black/20 border-white/10 text-secondary">
                                                                    {action.time}
                                                                </Badge>
                                                                <h3 className={`text-xl font-bold transition-colors ${isCompleted ? 'text-white' : 'text-white'}`}>
                                                                    {action.title}
                                                                </h3>
                                                            </div>
                                                            <div className={`p-2 rounded-full ${isCompleted ? 'bg-warning/20 text-warning' : 'bg-white/5 text-secondary'}`}>
                                                                {getActionIcon(action.type)}
                                                            </div>
                                                        </div>
                                                        <p className={`text-lg leading-relaxed ${isCompleted ? 'text-secondary/70' : 'text-secondary'}`}>
                                                            {action.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Next Day Action */}
                                {isDayComplete && activeChip.currentDay < 10 && (
                                    <div className="flex justify-center p-8 animate-in fade-in slide-in-from-bottom-8">
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={() => advanceDay(activeChip)}
                                            className="bg-success text-black hover:bg-success/90 font-bold px-12 py-8 text-xl rounded-full shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_50px_rgba(34,197,94,0.5)] transition-all flex items-center gap-3"
                                        >
                                            Concluir Dia {activeChip.currentDay} <ChevronRight size={24} />
                                        </Button>
                                    </div>
                                )}

                                {activeChip.currentDay === 10 && isDayComplete && (
                                    <div className="glass-panel border-success/30 bg-success/5 p-12 rounded-3xl text-center space-y-6 animate-in zoom-in duration-500">
                                        <div className="w-32 h-32 bg-success/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                                            <Trophy size={64} className="text-success" />
                                        </div>
                                        <div>
                                            <h3 className="text-4xl font-bold text-white mb-2">Chip Blindado! 🛡️</h3>
                                            <p className="text-secondary text-xl max-w-xl mx-auto">
                                                Parabéns! Este número completou todo o protocolo de segurança. Ele está pronto para a guerra.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Novo Chip Blindado"
            >
                <div className="space-y-6 py-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-secondary uppercase tracking-wider">Identificação</label>
                        <Input
                            value={newChipName}
                            onChange={e => setNewChipName(e.target.value)}
                            placeholder="Ex: Chip 01 - Vivo (João)"
                            className="bg-white/5 border-white/10 text-lg py-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-secondary uppercase tracking-wider">Número do WhatsApp</label>
                        <Input
                            value={newChipPhone}
                            onChange={e => setNewChipPhone(e.target.value)}
                            placeholder="(11) 99999-9999"
                            className="bg-white/5 border-white/10 text-lg py-3"
                        />
                    </div>
                    <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl flex gap-3 text-warning/90">
                        <AlertTriangle size={24} className="shrink-0" />
                        <p className="text-sm leading-relaxed">
                            Ao iniciar o protocolo, este chip começará do <strong>Dia 0</strong>. Certifique-se de que ele está inserido em um aparelho conectado à rede 4G/5G (sem WiFi).
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleAddChip} className="bg-warning text-black hover:bg-warning/90 font-bold">Iniciar Protocolo</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
export default WarmingPage;
