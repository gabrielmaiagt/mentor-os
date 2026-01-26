import React, { useState } from 'react';
import { Modal, Button } from '../ui';
import { useToast } from '../ui/Toast';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import './SubmitUpdateModal.css';

interface SubmitUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    menteeId: string;
    userId: string;
}

export const SubmitUpdateModal: React.FC<SubmitUpdateModalProps> = ({
    isOpen,
    onClose,
    menteeId,
    userId
}) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        summary: '',
        results: '',
        blockers: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.summary.trim()) {
            toast.error('Resumo é obrigatório');
            return;
        }

        setLoading(true);
        try {
            // Create update document
            await addDoc(collection(db, 'updates'), {
                menteeId,
                submittedByUserId: userId,
                summary: formData.summary.trim(),
                results: formData.results.trim() || null,
                blockers: formData.blockers.trim() || null,
                createdAt: new Date()
            });

            // Update lastUpdateAt in mentee document
            await updateDoc(doc(db, 'mentees', menteeId), {
                lastUpdateAt: new Date(),
                updatedAt: new Date()
            });

            toast.success('Update enviado com sucesso!');
            setFormData({ summary: '', results: '', blockers: '' });
            onClose();
        } catch (error) {
            console.error('Error submitting update:', error);
            toast.error('Erro ao enviar update');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Enviar Update Semanal"
            size="md"
        >
            <form onSubmit={handleSubmit} className="submit-update-form">
                <div className="form-group">
                    <label htmlFor="summary">
                        Resumo da Semana <span className="required">*</span>
                    </label>
                    <textarea
                        id="summary"
                        className="input-field"
                        rows={4}
                        placeholder="O que você fez esta semana? Principais atividades..."
                        value={formData.summary}
                        onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                        required
                    />
                    <span className="input-hint">Seja específico sobre suas ações e progresso</span>
                </div>

                <div className="form-group">
                    <label htmlFor="results">Resultados</label>
                    <textarea
                        id="results"
                        className="input-field"
                        rows={3}
                        placeholder="Quais resultados você alcançou? Métricas, vendas, aprendizados..."
                        value={formData.results}
                        onChange={(e) => setFormData({ ...formData, results: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="blockers">Bloqueios / Dúvidas</label>
                    <textarea
                        id="blockers"
                        className="input-field"
                        rows={3}
                        placeholder="Algo te travou? Precisa de ajuda com algo específico?"
                        value={formData.blockers}
                        onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
                    />
                </div>

                <div className="modal-actions">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                    >
                        {loading ? 'Enviando...' : 'Enviar Update'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
