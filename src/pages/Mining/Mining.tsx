import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Filter,
    ArrowUpDown
} from 'lucide-react';
import { Card, Button, Modal } from '../../components/ui';
import { OfferMinedCard, OfferValidation } from '../../components/mining';
import { useToast } from '../../components/ui/Toast';
import { OFFER_PLATFORMS } from '../../types';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import type { OfferMined, OfferStatus, OfferPlatform, Mentee } from '../../types';
import './Mining.css';

// Helper to calculate summary
const calculateMiningSummary = (offers: OfferMined[]) => {
    const testing = offers.filter(o => o.status === 'TESTING').length;
    const winner = offers.filter(o => o.status === 'WINNER').length;
    const candidate = offers.filter(o => o.status === 'CANDIDATE').length;
    const discarded = offers.filter(o => o.status === 'DISCARDED').length;

    const adsTotal = offers.reduce((acc, curr) => acc + curr.adCount, 0);
    const topOffer = [...offers].sort((a, b) => b.adCount - a.adCount)[0];

    return {
        offersTotal: offers.length,
        adsTotal,
        byStatus: { TESTING: testing, WINNER: winner, CANDIDATE: candidate, DISCARDED: discarded },
        topOffer
    };
};

export const MiningPage: React.FC = () => {
    const toast = useToast();
    const [mentee, setMentee] = useState<Mentee | null>(null);
    const [offers, setOffers] = useState<OfferMined[]>([]);
    const [loading, setLoading] = useState(true);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingOffer, setEditingOffer] = useState<OfferMined | null>(null);
    const [filterStatus, setFilterStatus] = useState<OfferStatus | 'ALL'>('ALL');
    const [sortBy, setSortBy] = useState<'adCount' | 'lastTouchedAt'>('adCount');

    // History Modal
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [updatingHistoryOffer, setUpdatingHistoryOffer] = useState<OfferMined | null>(null);
    const [historyFormData, setHistoryFormData] = useState({
        count: 0,
        date: new Date().toISOString().split('T')[0]
    });

    // Validation Modal
    const [showValidationModal, setShowValidationModal] = useState(false);
    const [validatingOffer, setValidatingOffer] = useState<OfferMined | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        adCount: 1,
        platform: 'META' as OfferPlatform,
        angles: '',
        notes: '',
    });

    // Fetch Mentee
    useEffect(() => {
        const fetchMentee = async () => {
            if (!auth.currentUser) return;
            try {
                // Try finding by UID
                let q = query(collection(db, 'mentees'), where('uid', '==', auth.currentUser.uid));
                let snapshot = await getDocs(q);

                if (snapshot.empty && auth.currentUser.email) {
                    q = query(collection(db, 'mentees'), where('email', '==', auth.currentUser.email));
                    snapshot = await getDocs(q);
                }

                if (!snapshot.empty) {
                    const data = snapshot.docs[0].data();
                    setMentee({ id: snapshot.docs[0].id, ...data } as Mentee);
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchMentee();
    }, [auth.currentUser]);

    // Fetch Offers
    useEffect(() => {
        if (!mentee) return;
        const q = query(collection(db, 'offers'), where('createdByUserId', '==', mentee.id));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setOffers(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate(),
                lastTouchedAt: doc.data().lastTouchedAt?.toDate()
            })) as OfferMined[]);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [mentee]);

    // Handlers (Copy-pasted logic)
    const handleOpenHistoryModal = (offer: OfferMined) => {
        setUpdatingHistoryOffer(offer);
        setHistoryFormData({
            count: offer.adCount,
            date: new Date().toISOString().split('T')[0]
        });
        setShowHistoryModal(true);
    };

    const handleUpdateAdHistory = async () => {
        if (!updatingHistoryOffer) return;
        try {
            const o = updatingHistoryOffer;
            const newAdHistory = [...(o.adHistory || [])];
            const existingIndex = newAdHistory.findIndex(h => h.date === historyFormData.date);

            if (existingIndex >= 0) {
                newAdHistory[existingIndex] = { ...newAdHistory[existingIndex], count: historyFormData.count };
            } else {
                newAdHistory.push({ date: historyFormData.date, count: historyFormData.count });
                newAdHistory.sort((a, b) => a.date.localeCompare(b.date));
            }
            const isLatest = newAdHistory[newAdHistory.length - 1].date === historyFormData.date;

            await updateDoc(doc(db, 'offers', o.id), {
                adCount: isLatest ? historyFormData.count : o.adCount,
                adHistory: newAdHistory,
                lastTouchedAt: new Date()
            });
            toast.success('Métrica atualizada!');
        } catch (e) {
            toast.error('Erro ao atualizar');
        }
        setShowHistoryModal(false);
        setUpdatingHistoryOffer(null);
    };

    const handleChangeStatus = async (offerId: string, status: OfferStatus) => {
        try {
            await updateDoc(doc(db, 'offers', offerId), { status, lastTouchedAt: new Date() });
            toast.success('Status atualizado!');
        } catch (e) {
            toast.error('Erro ao atualizar status');
        }
    };

    const handleEdit = (offer: OfferMined) => {
        setEditingOffer(offer);
        setFormData({
            name: offer.name,
            url: offer.url,
            adCount: offer.adCount,
            platform: offer.platform || 'META',
            angles: offer.angles?.join(', ') || '',
            notes: offer.notes || '',
        });
        setShowAddModal(true);
    };

    const handleValidate = (offer: OfferMined) => {
        setValidatingOffer(offer);
        setShowValidationModal(true);
    };

    const handleSaveOffer = async () => {
        if (!formData.name || !formData.url) return toast.error('Preencha nome e URL');
        if (!mentee) return;

        const angleArray = formData.angles.split(',').map(s => s.trim()).filter(Boolean);
        try {
            if (editingOffer) {
                await updateDoc(doc(db, 'offers', editingOffer.id), {
                    name: formData.name,
                    url: formData.url,
                    adCount: formData.adCount,
                    platform: formData.platform,
                    angles: angleArray,
                    notes: formData.notes,
                    lastTouchedAt: new Date(),
                    updatedAt: new Date(),
                });
                toast.success('Editado com sucesso!');
            } else {
                const today = new Date().toISOString().split('T')[0];
                await addDoc(collection(db, 'offers'), {
                    name: formData.name,
                    url: formData.url,
                    adCount: formData.adCount,
                    platform: formData.platform,
                    angles: angleArray,
                    notes: formData.notes,
                    status: 'CANDIDATE',
                    adHistory: [{ date: today, count: formData.adCount }],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lastTouchedAt: new Date(),
                    createdByUserId: mentee.id,
                });
                toast.success('Criado com sucesso!');
            }
            setShowAddModal(false);
            setEditingOffer(null);
            setFormData({ name: '', url: '', adCount: 1, platform: 'META', angles: '', notes: '' });
        } catch (e) {
            toast.error('Erro ao salvar');
        }
    };

    const summary = calculateMiningSummary(offers);
    const filteredOffers = offers
        .filter(o => filterStatus === 'ALL' || o.status === filterStatus)
        .sort((a, b) => {
            if (sortBy === 'adCount') return b.adCount - a.adCount;
            return b.lastTouchedAt.getTime() - a.lastTouchedAt.getTime();
        });

    if (loading) return <div className="p-8"><div className="animate-pulse">Carregando...</div></div>;

    return (
        <div className="mining-page max-w-[1400px] mx-auto p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center gap-3">
                        <Search size={32} className="text-blue-400" />
                        Mineração e Ofertas
                    </h1>
                    <p className="text-secondary mt-1">Gerencie suas ofertas mineradas e acompanhe a validação.</p>
                </div>
                <Button variant="primary" icon={<Plus size={18} />} onClick={() => {
                    setEditingOffer(null);
                    setFormData({ name: '', url: '', adCount: 1, platform: 'META', angles: '', notes: '' });
                    setShowAddModal(true);
                }}>
                    Nova Oferta
                </Button>
            </div>

            {/* Stats Header */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-blue-500/10 border-blue-500/20 text-center">
                    <span className="text-3xl font-bold text-blue-400 block">{summary.offersTotal}</span>
                    <span className="text-xs text-secondary uppercase tracking-wider">Total Ofertas</span>
                </Card>
                <Card className="bg-purple-500/10 border-purple-500/20 text-center">
                    <span className="text-3xl font-bold text-purple-400 block">{summary.adsTotal}</span>
                    <span className="text-xs text-secondary uppercase tracking-wider">Ads Mapeados</span>
                </Card>
                <Card className="bg-yellow-500/10 border-yellow-500/20 text-center">
                    <span className="text-3xl font-bold text-yellow-400 block">{summary.byStatus.TESTING}</span>
                    <span className="text-xs text-secondary uppercase tracking-wider">Em Teste</span>
                </Card>
                <Card className="bg-green-500/10 border-green-500/20 text-center">
                    <span className="text-3xl font-bold text-green-400 block">{summary.byStatus.WINNER}</span>
                    <span className="text-xs text-secondary uppercase tracking-wider">Campeãs</span>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6 bg-card/50 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-secondary" />
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value as OfferStatus | 'ALL')}
                        style={{ backgroundColor: '#111', color: 'white' }}
                        className="text-sm border-none focus:ring-0 cursor-pointer rounded-md py-1 px-2"
                    >
                        <option value="ALL" style={{ backgroundColor: '#111' }}>Todos os status</option>
                        <option value="CANDIDATE" style={{ backgroundColor: '#111' }}>Candidatas</option>
                        <option value="TESTING" style={{ backgroundColor: '#111' }}>Testando</option>
                        <option value="WINNER" style={{ backgroundColor: '#111' }}>Vencedoras</option>
                        <option value="DISCARDED" style={{ backgroundColor: '#111' }}>Descartadas</option>
                    </select>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex items-center gap-2">
                    <ArrowUpDown size={16} className="text-secondary" />
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as 'adCount' | 'lastTouchedAt')}
                        style={{ backgroundColor: '#111', color: 'white' }}
                        className="text-sm border-none focus:ring-0 cursor-pointer rounded-md py-1 px-2"
                    >
                        <option value="adCount" style={{ backgroundColor: '#111' }}>Mais anúncios</option>
                        <option value="lastTouchedAt" style={{ backgroundColor: '#111' }}>Mais recentes</option>
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredOffers.map(offer => (
                    <OfferMinedCard
                        key={offer.id}
                        offer={offer}
                        onIncrementAds={() => handleOpenHistoryModal(offer)}
                        onEdit={handleEdit}
                        onValidate={handleValidate}
                        onChangeStatus={handleChangeStatus}
                    />
                ))}
            </div>

            {/* Modals */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={editingOffer ? 'Editar Oferta' : 'Nova Oferta'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1 text-secondary">Nome</label>
                        <input
                            className="w-full border border-white/10 rounded p-3 text-white placeholder-zinc-500 focus:border-white/20 transition-all outline-none"
                            style={{ backgroundColor: '#111', color: 'white' }}
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Nome do produto"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-secondary">URL</label>
                        <input
                            className="w-full border border-white/10 rounded p-3 text-white placeholder-zinc-500 focus:border-white/20 transition-all outline-none"
                            style={{ backgroundColor: '#111', color: 'white' }}
                            value={formData.url}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                            placeholder="URL do anúncio"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1 text-secondary">Contagem Ads</label>
                            <input
                                type="number"
                                className="w-full border border-white/10 rounded p-3 text-white placeholder-zinc-500 focus:border-white/20 transition-all outline-none"
                                style={{ backgroundColor: '#111', color: 'white' }}
                                value={formData.adCount}
                                onChange={e => setFormData({ ...formData, adCount: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 text-secondary">Plataforma</label>
                            <select
                                className="w-full border border-white/10 rounded p-3 text-white placeholder-zinc-500 focus:border-white/20 transition-all outline-none"
                                style={{ backgroundColor: '#111', color: 'white' }}
                                value={formData.platform}
                                onChange={e => setFormData({ ...formData, platform: e.target.value as any })}
                            >
                                {OFFER_PLATFORMS.map(p => <option key={p.key} value={p.key} style={{ backgroundColor: '#111' }}>{p.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-secondary">Ângulos (separados por vírgula)</label>
                        <input
                            className="w-full border border-white/10 rounded p-3 text-white placeholder-zinc-500 focus:border-white/20 transition-all outline-none"
                            style={{ backgroundColor: '#111', color: 'white' }}
                            value={formData.angles}
                            onChange={e => setFormData({ ...formData, angles: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSaveOffer}>Salvar</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="Atualizar Histórico">
                <div className="space-y-4">
                    <p className="text-secondary">Atualize a contagem de anúncios ativos para este criativo hoje.</p>
                    <input
                        type="number"
                        className="w-full border border-white/10 rounded p-3 text-2xl text-center font-bold text-white placeholder-zinc-500 focus:border-white/20 transition-all outline-none"
                        style={{ backgroundColor: '#111', color: 'white' }}
                        value={historyFormData.count}
                        onChange={e => setHistoryFormData({ ...historyFormData, count: parseInt(e.target.value) })}
                    />
                    <Button variant="primary" fullWidth onClick={handleUpdateAdHistory}>Atualizar</Button>
                </div>
            </Modal>

            <Modal isOpen={showValidationModal} onClose={() => setShowValidationModal(false)} title="Validar Oferta (ROI)">
                {validatingOffer && (
                    <OfferValidation
                        offer={validatingOffer}
                        onUpdate={() => {
                            // Close modal after efficient save? Or keep open for edits?
                            // Let's keep it open to see the history update instantly if we were real-time, 
                            // but for now maybe just let user close it manually.
                        }}
                    />
                )}
            </Modal>
        </div>
    );
};

export default MiningPage;
