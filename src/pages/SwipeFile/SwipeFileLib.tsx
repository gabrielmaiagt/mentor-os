import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Button, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { Search, Plus, ExternalLink, Image as ImageIcon } from 'lucide-react';
import type { SwipeFileItem, SwipeFileCategory } from '../../types';
import './SwipeFileLib.css';

const CATEGORIES: SwipeFileCategory[] = ['X1', 'Venda Direta', 'VSL', 'High Ticket', 'Criativos', 'Copy'];

export const SwipeFileLib: React.FC = () => {
    const toast = useToast();
    const [items, setItems] = useState<SwipeFileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState<SwipeFileCategory | 'ALL'>('ALL');
    const [search, setSearch] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Upload Form State
    const [newItem, setNewItem] = useState({
        title: '',
        description: '',
        category: 'Venda Direta' as SwipeFileCategory,
        url: '',
        imageUrl: '',
        tags: ''
    });

    // Fetch Items
    useEffect(() => {
        const q = query(collection(db, 'swipe_file'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setItems(snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            })) as SwipeFileItem[]);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Helper: Is Admin? (Simple check for now, can be improved)
    // For now, let's assume specific email or just allow everyone to post if authorized (which is everyone logged in this context)
    // To restrict, we would check auth.currentUser.email
    const canUpload = true;

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.title || !newItem.category) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        try {
            await addDoc(collection(db, 'swipe_file'), {
                ...newItem,
                tags: newItem.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t),
                createdAt: new Date(),
                createdBy: auth.currentUser?.uid,
                likes: 0,
                views: 0
            });
            toast.success('Oferta adicionada à biblioteca!');
            setIsUploadModalOpen(false);
            setNewItem({
                title: '',
                description: '',
                category: 'Venda Direta',
                url: '',
                imageUrl: '',
                tags: ''
            });
        } catch (error) {
            console.error(error);
            toast.error('Erro ao adicionar oferta');
        }
    };

    const filteredItems = items.filter(item => {
        const matchesCategory = filterCategory === 'ALL' || item.category === filterCategory;
        const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase()) ||
            item.tags?.some((t: string) => t.toLowerCase().includes(search.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="swipe-file-page">
            {/* Header */}
            <div className="swipe-header">
                <div>
                    <h1 className="swipe-title">Swipe File 🕵️‍♂️</h1>
                    <p className="swipe-subtitle">Biblioteca de ofertas validadas para modelagem.</p>
                </div>
                {canUpload && (
                    <Button variant="primary" icon={<Plus size={18} />} onClick={() => setIsUploadModalOpen(true)}>
                        Adicionar Oferta
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="swipe-filters">
                <div className="search-bar">
                    <Search size={16} className="text-secondary" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, tag ou descrição..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="category-filters">
                    <button
                        className={`filter-chip ${filterCategory === 'ALL' ? 'active' : ''}`}
                        onClick={() => setFilterCategory('ALL')}
                    >
                        Todas
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
                            onClick={() => setFilterCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="p-8 text-center text-secondary">Carregando biblioteca...</div>
            ) : filteredItems.length === 0 ? (
                <div className="empty-state">
                    <Search size={48} />
                    <p>Nenhuma oferta encontrada.</p>
                </div>
            ) : (
                <div className="swipe-grid">
                    {filteredItems.map(item => (
                        <div key={item.id} className="swipe-card">
                            <div className="swipe-card-image">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.title} />
                                ) : (
                                    <div className="placeholder-image">
                                        <ImageIcon size={32} />
                                    </div>
                                )}
                                <div className="swipe-category-badge">
                                    {item.category}
                                </div>
                            </div>
                            <div className="swipe-card-content">
                                <h3 className="swipe-card-title">{item.title}</h3>
                                <p className="swipe-card-desc">{item.description}</p>

                                <div className="swipe-card-tags">
                                    {item.tags?.slice(0, 3).map((tag: string) => (
                                        <span key={tag} className="tag">#{tag}</span>
                                    ))}
                                </div>

                                <div className="swipe-card-footer">
                                    <div className="swipe-metrics">
                                        {/* Future: Likes/Views */}
                                    </div>
                                    {item.url && (
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="view-btn">
                                            Ver Oferta <ExternalLink size={14} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            <Modal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                title="Adicionar ao Swipe File"
            >
                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Título</label>
                        <input
                            required
                            type="text"
                            className="input-field"
                            placeholder="Ex: VSL Queima de Estoque"
                            value={newItem.title}
                            onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Categoria</label>
                        <select
                            className="input-field"
                            value={newItem.category}
                            onChange={e => setNewItem({ ...newItem, category: e.target.value as SwipeFileCategory })}
                        >
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Descrição</label>
                        <textarea
                            className="input-field"
                            rows={3}
                            placeholder="O que torna essa oferta boa? Pontos fortes..."
                            value={newItem.description}
                            onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">URL da Oferta (Link)</label>
                        <input
                            type="url"
                            className="input-field"
                            placeholder="https://..."
                            value={newItem.url}
                            onChange={e => setNewItem({ ...newItem, url: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">URL da Imagem (Thumbnail)</label>
                        <input
                            type="url"
                            className="input-field"
                            placeholder="https://..."
                            value={newItem.imageUrl}
                            onChange={e => setNewItem({ ...newItem, imageUrl: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Tags (separar por vírgula)</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Ex: black friday, agressivo, curto"
                            value={newItem.tags}
                            onChange={e => setNewItem({ ...newItem, tags: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="ghost" type="button" onClick={() => setIsUploadModalOpen(false)}>Cancelar</Button>
                        <Button variant="primary" type="submit">Publicar</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
