import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Card, Button, Badge, Modal, Input } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import {
    Shield,
    Plus,
    Server,
    User,
    Layout,
    CreditCard,
    Activity,
    Globe,
    Trash2,
    Edit2,
    Link as LinkIcon
} from 'lucide-react';
import type { Asset, AssetType, AssetStatus } from '../../types';
import { getAssetLabel } from '../../types/assets';
import { RiskDashboard } from './RiskDashboard';
import { ContingencyTree } from './ContingencyTree';
import { RecoveryProtocolModal } from './RecoveryProtocolModal';
import { EmptyState } from '../../components/common/EmptyState';
import { AlertTriangle } from 'lucide-react';
import './AssetsManager.css';

export const AssetsManager: React.FC = () => {
    const toast = useToast();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

    // Form State
    const [form, setForm] = useState<Partial<Asset>>({
        type: 'PROFILE',
        status: 'ACTIVE',
        name: '',
        notes: '',
        healthScore: 100
    });

    useEffect(() => {
        if (!auth.currentUser?.uid) return;
        const q = query(collection(db, 'assets'), where('userId', '==', auth.currentUser.uid));
        const unsubscribe = onSnapshot(q, (snap) => {
            setAssets(snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate() })) as Asset[]);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async () => {
        if (!form.name || !form.type) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        try {
            const data = {
                ...form,
                userId: auth.currentUser?.uid,
                updatedAt: new Date(),
                riskLevel: (form.healthScore || 0) < 50 ? 'HIGH' : 'LOW' // Simple logic for now
            };

            if (editingAsset) {
                await updateDoc(doc(db, 'assets', editingAsset.id), data);
                toast.success('Ativo atualizado');
            } else {
                await addDoc(collection(db, 'assets'), {
                    ...data,
                    createdAt: new Date()
                });
                toast.success('Ativo criado');
            }
            setIsModalOpen(false);
            setEditingAsset(null);
            setForm({ type: 'PROFILE', status: 'ACTIVE', name: '', notes: '', healthScore: 100 });
        } catch (e) {
            console.error(e);
            toast.error('Erro ao salvar ativo');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza? Isso não pode ser desfeito.')) return;
        try {
            await deleteDoc(doc(db, 'assets', id));
            toast.success('Ativo removido');
        } catch (e) {
            toast.error('Erro ao remover');
        }
    };

    const getIcon = (type: AssetType) => {
        switch (type) {
            case 'PROFILE': return <User size={18} />;
            case 'BM': return <Server size={18} />;
            case 'AD_ACCOUNT': return <CreditCard size={18} />;
            case 'PAGE': return <Layout size={18} />;
            case 'PIXEL': return <Activity size={18} />;
            case 'DOMAIN': return <Globe size={18} />;
            default: return <Shield size={18} />;
        }
    };

    const getStatusColor = (status: AssetStatus) => {
        switch (status) {
            case 'ACTIVE': return 'success';
            case 'WARMING': return 'warning';
            case 'RESTRICTED': return 'error'; // We don't have 'error' variant often, maybe 'danger' or fallback
            case 'PERMANENT_BAN': return 'neutral';
            default: return 'default';
        }
    };

    const [viewMode, setViewMode] = useState<'LIST' | 'TREE'>('LIST');

    // Recovery Modal State
    const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
    const [selectedRecoveryAsset, setSelectedRecoveryAsset] = useState<Asset | null>(null);

    return (
        <div className="assets-manager">
            <div className="assets-header flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Shield className="text-warning" /> Meus Ativos
                    </h2>
                    <p className="text-secondary text-sm">Gerencie perfis, BMs e toda sua estrutura.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex bg-neutral-900 rounded-lg p-1 border border-white/10">
                        <button
                            className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'LIST' ? 'bg-zinc-800 text-white shadow-lg' : 'text-secondary hover:text-white'}`}
                            onClick={() => setViewMode('LIST')}
                        >
                            Lista
                        </button>
                        <button
                            className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'TREE' ? 'bg-zinc-800 text-white shadow-lg' : 'text-secondary hover:text-white'}`}
                            onClick={() => setViewMode('TREE')}
                        >
                            Árvore
                        </button>
                    </div>
                    <Button variant="primary" icon={<Plus size={16} />} onClick={() => setIsModalOpen(true)}>
                        Novo Ativo
                    </Button>
                </div>
            </div>

            <RiskDashboard assets={assets} />
            {viewMode === 'TREE' ? (
                assets.length === 0 ? (
                    <EmptyState
                        icon={Shield}
                        title="Nenhum Ativo Cadastrado"
                        description="Comece criando seu primeiro ativo. Perfis, BMs e Pixels vão aparecer aqui em uma estrutura visual."
                        actionLabel="Criar Primeiro Ativo"
                        onAction={() => setIsModalOpen(true)}
                    />
                ) : (
                    <ContingencyTree assets={assets} />
                )
            ) : (
                assets.length === 0 ? (
                    <EmptyState
                        icon={Shield}
                        title="Nenhum Ativo Cadastrado"
                        description="Cadastre seus perfis, BMs, contas de anúncios e outros ativos para ter controle total da sua operação."
                        actionLabel="Adicionar Primeiro Ativo"
                        onAction={() => setIsModalOpen(true)}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {assets.map(asset => (
                            <Card key={asset.id} className="asset-card relative group p-4 border-l-4" style={{
                                borderLeftColor: asset.status === 'ACTIVE' ? 'var(--status-success)' :
                                    asset.status === 'WARMING' ? 'var(--status-warning)' :
                                        'var(--status-error)'
                            }}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2 text-secondary">
                                        {getIcon(asset.type)}
                                        <span className="text-xs font-bold uppercase tracking-wider">{getAssetLabel(asset.type)}</span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingAsset(asset); setForm(asset); setIsModalOpen(true); }} className="p-1 hover:text-white text-secondary">
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(asset.id)} className="p-1 hover:text-red-500 text-secondary">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-bold text-lg text-white mb-2">{asset.name}</h3>

                                <div className="flex justify-between items-center mt-4">
                                    <Badge variant={getStatusColor(asset.status) as any}>{asset.status}</Badge>
                                    {(asset.status === 'RESTRICTED' || asset.status === 'PERMANENT_BAN') && (
                                        <button
                                            onClick={() => { setSelectedRecoveryAsset(asset); setIsRecoveryModalOpen(true); }}
                                            className="text-xs font-bold text-white bg-error/20 px-2 py-1 rounded hover:bg-error/40 transition-colors flex items-center gap-1"
                                        >
                                            <AlertTriangle size={12} />
                                            Protocolo
                                        </button>
                                    )}
                                    {asset.type === 'AD_ACCOUNT' && asset.spendLimit && (
                                        <span className="text-xs text-secondary font-mono">Limit: R$ {asset.spendLimit}</span>
                                    )}
                                </div>

                                {/* Connection Lines (Visual hint) */}
                                {asset.parentId && (
                                    <div className="absolute -top-3 left-6 text-secondary/30">
                                        <LinkIcon size={12} className="rotate-90" />
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )
            )}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingAsset(null); }}
                title={editingAsset ? "Editar Ativo" : "Novo Ativo"}
            >
                <div className="space-y-4 py-2">
                    <div>
                        <label className="block text-sm text-secondary mb-1">Tipo de Ativo</label>
                        <select
                            className="w-full bg-secondary border border-subtle rounded-md p-2 text-primary outline-none"
                            value={form.type}
                            onChange={e => setForm({ ...form, type: e.target.value as AssetType })}
                        >
                            <option value="PROFILE">Perfil (Facebook)</option>
                            <option value="BM">BM (Business Manager)</option>
                            <option value="AD_ACCOUNT">Conta de Anúncio</option>
                            <option value="PAGE">Página</option>
                            <option value="PIXEL">Pixel</option>
                            <option value="DOMAIN">Domínio</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-secondary mb-1">Nome de Identificação</label>
                        <Input
                            value={form.name || ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ex: Perfil 01 - Aquecido"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-secondary mb-1">Status Atual</label>
                        <select
                            className="w-full bg-secondary border border-subtle rounded-md p-2 text-primary outline-none"
                            value={form.status}
                            onChange={e => setForm({ ...form, status: e.target.value as AssetStatus })}
                        >
                            <option value="ACTIVE">Ativo (Rodando)</option>
                            <option value="WARMING">Em Aquecimento</option>
                            <option value="RESTRICTED">Restrito / Bloqueado</option>
                            <option value="PERMANENT_BAN">Banido Permanentemente</option>
                        </select>
                    </div>

                    {/* Dynamic Fields based on Type can go here */}

                    <div>
                        <label className="block text-sm text-secondary mb-1">Observações (Login/Senha/Proxy)</label>
                        <textarea
                            className="w-full bg-secondary border border-subtle rounded-md p-2 text-primary outline-none min-h-[80px]"
                            value={form.notes || ''}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                            placeholder="Dados sensíveis ou anotações..."
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSave}>Salvar</Button>
                    </div>
                </div>
            </Modal>

            <RecoveryProtocolModal
                isOpen={isRecoveryModalOpen}
                onClose={() => setIsRecoveryModalOpen(false)}
                asset={selectedRecoveryAsset}
            />
        </div>
    );
};
