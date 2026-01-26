import React, { useState } from 'react';
import { Button, Modal } from '../../components/ui';
import type { Template } from '../../types';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useToast } from '../../components/ui/Toast';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: Template | null;
    onSuccess?: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, template, onSuccess }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!template) return;
        setLoading(true);

        try {
            await deleteDoc(doc(db, 'templates', template.id));
            toast.success('Template excluído.');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao excluir template.');
        } finally {
            setLoading(false);
        }
    };

    if (!template) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Excluir Template">
            <div className="flex flex-col items-center text-center p-4">
                <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mb-4 text-error">
                    <AlertTriangle size={24} />
                </div>

                <h3 className="text-lg font-bold text-primary mb-2">Tem certeza?</h3>
                <p className="text-secondary mb-6">
                    Você está prestes a excluir o template <strong>"{template.title}"</strong>.<br />
                    Esta ação não pode ser desfeita.
                </p>

                <div className="flex gap-3 w-full">
                    <Button variant="ghost" className="flex-1" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1 bg-error hover:bg-error/80 text-white border-none"
                        onClick={handleDelete}
                        disabled={loading}
                    >
                        {loading ? 'Excluindo...' : 'Sim, Excluir'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
