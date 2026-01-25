import React, { useState } from 'react';
import { Button, Modal } from '../../components/ui';
import type { Template, TemplateCategory, TemplateIntensity } from '../../types';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useToast } from '../../components/ui/Toast';

interface AddTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const AddTemplateModal: React.FC<AddTemplateModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<Partial<Template>>({
        title: '',
        category: 'SALES',
        intensity: 'MEDIUM',
        content: '',
        description: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Add to 'templates' collection
            await addDoc(collection(db, 'templates'), {
                ...formData,
                key: `custom-${Date.now()}`,
                createdBy: auth.currentUser?.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            toast.success('Template criado com sucesso!');
            if (onSuccess) onSuccess();
            onClose();
            // Reset form
            setFormData({
                title: '',
                category: 'SALES',
                intensity: 'MEDIUM',
                content: '',
                description: '',
            });
        } catch (error) {
            console.error(error);
            toast.error('Erro ao criar template. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Novo Template">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Título</label>
                    <input
                        type="text"
                        required
                        className="w-full bg-secondary border border-subtle rounded-md px-3 py-2 text-primary focus:border-accent outline-none"
                        placeholder="Ex: Script de Vendas High Ticket"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                {/* Category & Intensity */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Categoria</label>
                        <select
                            className="w-full bg-secondary border border-subtle rounded-md px-3 py-2 text-primary focus:border-accent outline-none"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value as TemplateCategory })}
                        >
                            <option value="SALES">Vendas</option>
                            <option value="DELIVERY">Entrega</option>
                            <option value="TASKS">Tarefas Padrão</option>
                            <option value="FINANCE">Financeiro</option>
                            <option value="LEGAL">Jurídico</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-secondary mb-1">Intensidade</label>
                        <select
                            className="w-full bg-secondary border border-subtle rounded-md px-3 py-2 text-primary focus:border-accent outline-none"
                            value={formData.intensity}
                            onChange={e => setFormData({ ...formData, intensity: e.target.value as TemplateIntensity })}
                        >
                            <option value="SOFT">Soft (Leve)</option>
                            <option value="MEDIUM">Medium (Moderado)</option>
                            <option value="HARD">Hard (Inc isivo)</option>
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Descrição Curta</label>
                    <input
                        type="text"
                        className="w-full bg-secondary border border-subtle rounded-md px-3 py-2 text-primary focus:border-accent outline-none"
                        placeholder="Ex: Usar quando o lead parar de responder"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                {/* Content */}
                <div>
                    <label className="block text-sm font-medium text-secondary mb-1">Conteúdo do Template</label>
                    <div className="text-xs text-tertiary mb-2">Use variáveis como {"{nome}"}, {"{valor}"} para personalizar.</div>
                    <textarea
                        required
                        rows={6}
                        className="w-full bg-secondary border border-subtle rounded-md px-3 py-2 text-primary focus:border-accent outline-none font-mono text-sm"
                        placeholder="Olá {nome}, tudo bem? ..."
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                    />
                </div>

                <div className="flex justify-end gap-2 mt-4">
                    <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? 'Salvando...' : 'Criar Template'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
