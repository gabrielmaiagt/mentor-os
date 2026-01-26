import React, { useState } from 'react';
import {
    FileText,
    ExternalLink,
    MessageCircle,
    Shield,
    FileSpreadsheet,
    Plus,
    Search,
    FolderOpen
} from 'lucide-react';
import { Card, Button, Badge, Modal, Input, Skeleton } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { collection, query, onSnapshot, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Resource, ResourceCategory, ResourceType } from '../../types';
import './Resources.css';

const TABS: { key: ResourceCategory | 'ALL', label: string, icon: any }[] = [
    { key: 'ALL', label: 'Todos', icon: FolderOpen },
    { key: 'X1', label: 'Funis & Ofertas (X1)', icon: MessageCircle },
    { key: 'CONTRACTS', label: 'Contratos', icon: Shield },
    { key: 'GENERAL', label: 'Geral', icon: FileText },
    { key: 'SPREADSHEET', label: 'Planilhas', icon: FileSpreadsheet },
];

export const ResourcesPage: React.FC = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<ResourceCategory | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        url: string;
        category: ResourceCategory;
        type: ResourceType;
    }>({
        title: '',
        description: '',
        url: '',
        category: 'GENERAL',
        type: 'PDF'
    });

    React.useEffect(() => {
        // Fetch resources
        const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setResources(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            })) as Resource[]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAddResource = async () => {
        if (!formData.title || !formData.url) {
            toast.error('Preencha título e URL');
            return;
        }

        try {
            await addDoc(collection(db, 'resources'), {
                ...formData,
                createdAt: new Date(),
                updatedAt: new Date(),
                downloads: 0
            });
            toast.success('Recurso adicionado!');
            setShowAddModal(false);
            setFormData({ title: '', description: '', url: '', category: 'GENERAL', type: 'PDF' });
        } catch (error) {
            console.error(error);
            toast.error('Erro ao adicionar recurso');
        }
    };

    const getIcon = (type: ResourceType) => {
        switch (type) {
            case 'PDF': return <FileText size={20} className="text-error" />;
            case 'SHEET': return <FileSpreadsheet size={20} className="text-success" />;
            case 'LINK': return <ExternalLink size={20} className="text-info" />;
            case 'VIDEO': return <ExternalLink size={20} className="text-warning" />;
            default: return <FileText size={20} />;
        }
    };

    const filteredResources = resources.filter(r => {
        const matchesTab = activeTab === 'ALL' || r.category === activeTab;
        const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    if (loading) {
        return (
            <div className="resources-page p-6 max-w-[1400px] mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <Skeleton width={200} height={32} />
                    <Skeleton width={120} height={40} />
                </div>
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} height={160} variant="card" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="resources-page p-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        Central de Recursos
                    </h1>
                    <p className="text-secondary mt-1 text-base">
                        Materiais, scripts e ferramentas para escalar sua operação.
                    </p>
                </div>
                {/* Only Mentor sees Add Button */}
                {user?.role === 'mentor' && (
                    <Button
                        variant="primary"
                        size="md"
                        icon={<Plus size={18} />}
                        onClick={() => setShowAddModal(true)}
                        className="shadow-glow"
                    >
                        Novo Recurso
                    </Button>
                )}
            </div>

            {/* Controls Bar (Tabs & Search) */}
            <div className="resources-controls">
                {/* Tabs */}
                <div className="resources-tabs">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`filter-tab ${isActive ? 'active' : ''}`}
                            >
                                <tab.icon size={16} className={isActive ? 'animate-pulse-slow' : 'opacity-70'} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1" />

                {/* Search */}
                <div className="resources-search group">
                    <Search className="search-icon" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar arquivo..."
                        className="search-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map(resource => (
                    <Card key={resource.id} className="resource-card group" padding="md" variant="interactive">
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-white/5 rounded-lg group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                                {getIcon(resource.type)}
                            </div>
                            <Badge variant="default" size="sm">{resource.type}</Badge>
                        </div>

                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{resource.title}</h3>
                        <p className="text-secondary text-sm mb-4 line-clamp-2 min-h-[40px]">
                            {resource.description || 'Sem descrição.'}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                            <span className="text-xs text-muted">Adicionado em {resource.createdAt?.toLocaleDateString()}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:bg-primary/10"
                                onClick={() => window.open(resource.url, '_blank')}
                            >
                                {resource.type === 'LINK' ? 'Acessar' : 'Baixar'} <ExternalLink size={14} className="ml-2" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredResources.length === 0 && (
                <div className="text-center py-20 text-secondary">
                    <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Nenhum recurso encontrado nesta categoria.</p>
                </div>
            )}

            {/* Add Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Novo Recurso"
                size="md"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleAddResource}>Salvar</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Título</label>
                        <Input
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ex: Script de Vendas X1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">URL (Drive/Link)</label>
                        <Input
                            value={formData.url}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Categoria</label>
                            <select
                                className="w-full bg-elevated border border-white/10 rounded-md p-2 text-sm"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value as ResourceCategory })}
                            >
                                <option value="GENERAL">Geral</option>
                                <option value="X1">Funis & Ofertas (X1)</option>
                                <option value="CONTRACTS">Contratos</option>
                                <option value="SPREADSHEET">Planilhas</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Tipo</label>
                            <select
                                className="w-full bg-elevated border border-white/10 rounded-md p-2 text-sm"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as ResourceType })}
                            >
                                <option value="PDF">PDF</option>
                                <option value="DOC">Documento</option>
                                <option value="SHEET">Planilha</option>
                                <option value="LINK">Link Externo</option>
                                <option value="VIDEO">Vídeo</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Descrição</label>
                        <textarea
                            className="w-full bg-elevated border border-white/10 rounded-md p-2 text-sm"
                            rows={3}
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Descreva o conteúdo..."
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ResourcesPage;
