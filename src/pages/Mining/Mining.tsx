import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMentee } from '../../hooks/queries/useMentee';
import { useMiningOffers, useCreateMiningOffer, useUpdateMiningOffer } from '../../hooks/queries/useMining';
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
import type { OfferMined, OfferStatus, OfferPlatform } from '../../types';
import './Mining.css';

// Helper to calculate summary
const calculateMiningSummary = (offers: OfferMined[]) => {
    const testing = offers.filter(o => o.status === 'TESTING').length;
    const winner = offers.filter(o => o.status === 'WINNER').length;
    const candidate = offers.filter(o => o.status === 'CANDIDATE').length;
    const discarded = offers.filter(o => o.status === 'DISCARDED').length;

    const adsTotal = offers.reduce((acc, curr) => acc + curr.adCount, 0);
    const topOffer = [...offers].sort((a, b) => (b.adCount || 0) - (a.adCount || 0))[0];

    return {
        offersTotal: offers.length,
        adsTotal,
        byStatus: { TESTING: testing, WINNER: winner, CANDIDATE: candidate, DISCARDED: discarded },
        topOffer
    };
};

export const MiningPage: React.FC = () => {
    const toast = useToast();
    const queryClient = useQueryClient();

    // React Query Hooks
    const { data: mentee, isLoading: isLoadingMentee } = useMentee();
    const { data: offers = [], isLoading: isLoadingOffers } = useMiningOffers(mentee?.id);
    const createOffer = useCreateMiningOffer();
    const updateOffer = useUpdateMiningOffer();

    const isLoading = isLoadingMentee || isLoadingOffers;

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

    const handleAddOffer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mentee?.id) return;

        createOffer.mutate({ offerData: formData, menteeId: mentee.id }, {
            onSuccess: () => {
                setShowAddModal(false);
                setFormData({
                    name: '',
                    url: '',
                    adCount: 1,
                    platform: 'META',
                    angles: '',
                    notes: '',
                });
            }
        });
    };

    const handleUpdateOffer = async (id: string, updates: Partial<OfferMined>) => {
        updateOffer.mutate({ id, data: updates });
    };

    const handleOpenHistoryModal = (offer: OfferMined) => {
        setUpdatingHistoryOffer(offer);
        setHistoryFormData({
            count: offer.adCount,
            date: new Date().toISOString().split('T')[0]
        });
        setShowHistoryModal(true);
    };

    const handleUpdateHistory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!updatingHistoryOffer) return;

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

        updateOffer.mutate({
            id: updatingHistoryOffer.id,
            data: {
                adCount: isLatest ? historyFormData.count : o.adCount,
                adHistory: newAdHistory,
                lastTouchedAt: new Date()
            }
        }, {
            onSuccess: () => setShowHistoryModal(false)
        });
    };

    const handleOpenValidation = (offer: OfferMined) => {
        setValidatingOffer(offer);
        setShowValidationModal(true);
    };

    // Filter and Sort
    const filteredOffers = offers
        .filter(offer => filterStatus === 'ALL' || offer.status === filterStatus)
        .sort((a, b) => {
            if (sortBy === 'adCount') return (b.adCount || 0) - (a.adCount || 0);
            if (sortBy === 'lastTouchedAt') {
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
            return 0;
        });

    const summary = calculateMiningSummary(offers);

    if (isLoading) {
        return (
            <div className="mining-page">
                <div className="flex items-center justify-center p-12">
                    <div className="text-secondary">Carregando ofertas mineradas...</div>
                </div>
            </div>
        );
    }

    if (!mentee) {
        return (
            <div className="mining-page">
                <div className="p-8 text-center text-secondary">
                    Perfil de mentorado não encontrado. Entre em contato com o suporte.
                </div>
            </div>
        );
    }

    return (
        <div className="mining-page">
            <div className="mining-header">
                <div>
                    <h1>Mineração de Ofertas</h1>
                    <p>Gerencie e valide as ofertas que você está modelando</p>
                </div>
                <div className="mining-actions">
                    <Button variant="secondary" icon={<Filter size={18} />}>
                        Filtros
                    </Button>
                    <Button variant="primary" icon={<Plus size={18} />} onClick={() => setShowAddModal(true)}>
                        Nova Oferta
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="mining-stats-grid">
                <Card padding="md" className="mining-stat-card">
                    <span className="stat-label">Total Minerado</span>
                    <span className="stat-value">{summary.offersTotal}</span>
                    <div className="stat-meta">
                        <span className="text-green-400">ATIVO</span>
                    </div>
                </Card>
                <Card padding="md" className="mining-stat-card">
                    <span className="stat-label">Em Validação</span>
                    <span className="stat-value">{summary.byStatus.CANDIDATE}</span>
                    <div className="stat-meta">
                        <span>Aguardando análise</span>
                    </div>
                </Card>
                <Card padding="md" className="mining-stat-card highlight">
                    <span className="stat-label">Campeãs</span>
                    <span className="stat-value">{summary.byStatus.WINNER}</span>
                    <div className="stat-meta">
                        <span>Ofertas validadas</span>
                    </div>
                </Card>
                <Card padding="md" className="mining-stat-card">
                    <span className="stat-label">Total de Anúncios</span>
                    <span className="stat-value">{summary.adsTotal}</span>
                    <div className="stat-meta">
                        <span>Criativos mapeados</span>
                    </div>
                </Card>
            </div>

            {/* Filters Bar */}
            <div className="mining-filters-bar">
                <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input type="text" placeholder="Buscar oferta..." className="search-input" />
                </div>

                <div className="filter-group">
                    <select
                        className="filter-select"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as OfferStatus | 'ALL')}
                    >
                        <option value="ALL">Todos os status</option>
                        <option value="CANDIDATE">Candidata</option>
                        <option value="TESTING">Em Teste</option>
                        <option value="WINNER">Campeã</option>
                        <option value="DISCARDED">Descartada</option>
                    </select>

                    <button
                        className="sort-btn"
                        onClick={() => setSortBy(prev => prev === 'adCount' ? 'lastTouchedAt' : 'adCount')}
                    >
                        <ArrowUpDown size={16} />
                        {sortBy === 'adCount' ? 'Por Anúncios' : 'Recentes'}
                    </button>
                </div>
            </div>

            {/* Offers Grid */}
            <div className="mining-grid">
                {filteredOffers.map(offer => (
                    <OfferMinedCard
                        key={offer.id}
                        offer={offer}
                        onEdit={(o) => {
                            setEditingOffer(o);
                            setShowAddModal(true);
                        }}
                        onUpdateHistory={() => handleOpenHistoryModal(offer)}
                        onValidate={() => handleOpenValidation(offer)}
                        // Implement status change handler
                        onChangeStatus={(id, status) => {
                            updateOffer.mutate({ id, data: { status, lastTouchedAt: new Date() } });
                        }}
                    />
                ))}

                {filteredOffers.length === 0 && (
                    <div className="empty-state-mining">
                        <p>Nenhuma oferta encontrada com os filtros atuais.</p>
                        <Button variant="ghost" onClick={() => setFilterStatus('ALL')}>Limpar filtros</Button>
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title={editingOffer ? "Editar Oferta" : "Nova Oferta"}
            >
                <form onSubmit={handleAddOffer} className="mining-form">
                    <div className="form-group">
                        <label>Nome do Produto/Oferta</label>
                        <input
                            required
                            type="text"
                            className="input-field"
                            placeholder="Ex: Método X"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>URL / Link</label>
                        <input
                            type="url"
                            className="input-field"
                            placeholder="https://..."
                            value={formData.url}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                        />
                    </div>
                    <div className="form-row-2">
                        <div className="form-group">
                            <label>Qtd. Anúncios</label>
                            <input
                                type="number"
                                min="0"
                                className="input-field"
                                value={formData.adCount}
                                onChange={e => setFormData({ ...formData, adCount: Number(e.target.value) })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Plataforma</label>
                            <select
                                className="input-field"
                                value={formData.platform}
                                onChange={e => setFormData({ ...formData, platform: e.target.value as OfferPlatform })}
                            >
                                {OFFER_PLATFORMS.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Ângulos / Promessas</label>
                        <textarea
                            className="input-field"
                            rows={3}
                            placeholder="Quais são as principais promessas?"
                            value={formData.angles}
                            onChange={e => setFormData({ ...formData, angles: e.target.value })}
                        />
                    </div>
                    <div className="modal-actions">
                        <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>Cancelar</Button>
                        <Button type="submit" variant="primary">
                            {createOffer.isPending ? 'Salvando...' : 'Salvar Oferta'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                title="Atualizar Histórico"
            >
                <form onSubmit={handleUpdateHistory}>
                    <div className="form-group">
                        <label>Nova contagem de anúncios</label>
                        <input
                            type="number"
                            className="input-field"
                            value={historyFormData.count}
                            onChange={e => setHistoryFormData({ ...historyFormData, count: Number(e.target.value) })}
                        />
                    </div>
                    <div className="modal-actions">
                        <Button type="button" variant="ghost" onClick={() => setShowHistoryModal(false)}>Cancelar</Button>
                        <Button type="submit" variant="primary">
                            {updateOffer.isPending ? 'Atualizando...' : 'Atualizar'}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showValidationModal} onClose={() => setShowValidationModal(false)} title="Validar Oferta (ROI)">
                {validatingOffer && (
                    <OfferValidation
                        offer={validatingOffer}
                        onUpdate={() => {
                            queryClient.invalidateQueries({ queryKey: ['mining-offers'] });
                        }}
                    />
                )}
            </Modal>
        </div>
    );
};

export default MiningPage;
