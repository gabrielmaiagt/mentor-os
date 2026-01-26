import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Modal, Button, Badge } from '../ui';
import { useToast } from '../ui/Toast';
import { Plus, Trash2, Edit, MessageSquare, Save, X } from 'lucide-react';
import type { MessageTemplate } from '../../types';
import './MessageTemplatesModal.css';

interface MessageTemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const MessageTemplatesModal: React.FC<MessageTemplatesModalProps> = ({ isOpen, onClose }) => {
    const toast = useToast();
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState<Partial<MessageTemplate> | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        const q = query(
            collection(db, 'templates_message'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedTemplates = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            })) as MessageTemplate[];
            setTemplates(fetchedTemplates);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen]);

    const handleSave = async () => {
        if (!editingTemplate?.title || !editingTemplate?.content) {
            toast.error('Preencha título e conteúdo');
            return;
        }

        try {
            if (editingTemplate.id) {
                await updateDoc(doc(db, 'templates_message', editingTemplate.id), {
                    ...editingTemplate,
                    updatedAt: new Date()
                });
                toast.success('Template atualizado!');
            } else {
                await addDoc(collection(db, 'templates_message'), {
                    ...editingTemplate,
                    category: 'WHATSAPP',
                    usageCount: 0,
                    createdBy: auth.currentUser?.uid,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                toast.success('Template criado!');
            }
            setEditingTemplate(null);
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('Erro ao salvar template');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Excluir este template?')) return;
        try {
            await deleteDoc(doc(db, 'templates_message', id));
            toast.success('Template removido');
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('Erro ao remover template');
        }
    };

    const insertVariable = (variable: string) => {
        if (!editingTemplate) return;
        const currentContent = editingTemplate.content || '';
        setEditingTemplate({
            ...editingTemplate,
            content: `${currentContent} {{${variable}}} `
        });
    };

    const filteredTemplates = templates.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Gerenciar Respostas Rápidas"
        >
            <div className="templates-modal-container">
                {editingTemplate ? (
                    <div className="template-editor">
                        <div className="editor-header">
                            <h3>{editingTemplate.id ? 'Editar Template' : 'Novo Template'}</h3>
                            <Button variant="ghost" size="sm" onClick={() => setEditingTemplate(null)}>
                                <X size={16} /> Cancelar
                            </Button>
                        </div>

                        <div className="form-group">
                            <label>Título (Atalho)</label>
                            <input
                                type="text"
                                value={editingTemplate.title || ''}
                                onChange={e => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                                placeholder="Ex: Boas-vindas"
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>Conteúdo da Mensagem</label>
                            <div className="variable-toolbar">
                                <span className="text-xs text-secondary mr-2">Inserir variável:</span>
                                <Button variant="ghost" size="sm" onClick={() => insertVariable('nome')}>Lead Nome</Button>
                                <Button variant="ghost" size="sm" onClick={() => insertVariable('empresa')}>Empresa</Button>
                            </div>
                            <textarea
                                value={editingTemplate.content || ''}
                                onChange={e => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                                placeholder="Olá {{nome}}, tudo bem?"
                                rows={6}
                            />
                        </div>

                        <div className="editor-actions">
                            <Button variant="primary" icon={<Save size={16} />} onClick={handleSave}>
                                Salvar Template
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="templates-list-view">
                        <div className="list-toolbar">
                            <input
                                type="search"
                                placeholder="Buscar templates..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => setEditingTemplate({ category: 'WHATSAPP' })}>
                                Novo
                            </Button>
                        </div>

                        <div className="templates-grid">
                            {loading ? (
                                <div className="p-4 text-center text-secondary">Carregando templates...</div>
                            ) : filteredTemplates.map(template => (
                                <div key={template.id} className="template-item">
                                    <div className="template-header">
                                        <h4>{template.title}</h4>
                                        <div className="template-actions">
                                            <button onClick={() => setEditingTemplate(template)} className="action-btn edit">
                                                <Edit size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(template.id)} className="action-btn delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="template-preview">{template.content}</p>
                                    <div className="template-meta">
                                        <Badge size="sm" variant="default">
                                            <MessageSquare size={10} className="mr-1" />
                                            {template.usageCount || 0} usos
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                            {filteredTemplates.length === 0 && (
                                <div className="empty-state">
                                    <p>Nenhum template encontrado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
