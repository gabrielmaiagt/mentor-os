import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../ui';
import { useToast } from '../ui/Toast';
import { addDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import './CreateCallModal.css';

interface CreateCallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateCallModal: React.FC<CreateCallModalProps> = ({
    isOpen,
    onClose
}) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [mentees, setMentees] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        menteeId: '',
        type: 'ONBOARDING',
        scheduledDate: '',
        scheduledTime: '',
        duration: 60,
        meetLink: '',
        notes: ''
    });

    // Fetch mentees for dropdown
    useEffect(() => {
        const fetchMentees = async () => {
            try {
                const q = query(collection(db, 'mentees'), orderBy('name', 'asc'));
                const snapshot = await getDocs(q);
                const menteesList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name
                }));
                setMentees(menteesList);
            } catch (error) {
                console.error('Error fetching mentees:', error);
            }
        };

        if (isOpen) {
            fetchMentees();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.menteeId || !formData.scheduledDate || !formData.scheduledTime) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }

        setLoading(true);
        try {
            // Combine date and time
            const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

            if (scheduledAt < new Date()) {
                toast.error('Data/hora deve ser no futuro');
                setLoading(false);
                return;
            }

            // Get mentee name for denormalization
            const selectedMentee = mentees.find(m => m.id === formData.menteeId);

            await addDoc(collection(db, 'calls'), {
                menteeId: formData.menteeId,
                menteeName: selectedMentee?.name || 'Desconhecido',
                type: formData.type,
                scheduledAt,
                duration: formData.duration,
                status: 'SCHEDULED',
                meetLink: formData.meetLink.trim() || null,
                notes: formData.notes.trim() || null,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            toast.success('Call agendada com sucesso!');
            setFormData({
                menteeId: '',
                type: 'ONBOARDING',
                scheduledDate: '',
                scheduledTime: '',
                duration: 60,
                meetLink: '',
                notes: ''
            });
            onClose();
        } catch (error) {
            console.error('Error creating call:', error);
            toast.error('Erro ao agendar call');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Agendar Nova Call"
            size="md"
        >
            <form onSubmit={handleSubmit} className="create-call-form">
                <div className="form-group">
                    <label htmlFor="menteeId">
                        Mentorado <span className="required">*</span>
                    </label>
                    <select
                        id="menteeId"
                        className="input-field"
                        value={formData.menteeId}
                        onChange={(e) => setFormData({ ...formData, menteeId: e.target.value })}
                        required
                    >
                        <option value="">Selecione...</option>
                        {mentees.map(mentee => (
                            <option key={mentee.id} value={mentee.id}>
                                {mentee.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="type">Tipo de Call</label>
                        <select
                            id="type"
                            className="input-field"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="ONBOARDING">Onboarding</option>
                            <option value="WEEKLY">Semanal</option>
                            <option value="URGENT">Urgente</option>
                            <option value="CLOSING">Fechamento</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="duration">Duração (min)</label>
                        <input
                            type="number"
                            id="duration"
                            className="input-field"
                            min="15"
                            max="180"
                            step="15"
                            value={formData.duration}
                            onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="scheduledDate">
                            Data <span className="required">*</span>
                        </label>
                        <input
                            type="date"
                            id="scheduledDate"
                            className="input-field"
                            value={formData.scheduledDate}
                            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="scheduledTime">
                            Horário <span className="required">*</span>
                        </label>
                        <input
                            type="time"
                            id="scheduledTime"
                            className="input-field"
                            value={formData.scheduledTime}
                            onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="meetLink">Link da Sala (Google Meet, Zoom, etc.)</label>
                    <input
                        type="url"
                        id="meetLink"
                        className="input-field"
                        placeholder="https://meet.google.com/..."
                        value={formData.meetLink}
                        onChange={(e) => setFormData({ ...formData, meetLink: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="notes">Notas / Pauta</label>
                    <textarea
                        id="notes"
                        className="input-field"
                        rows={3}
                        placeholder="Assuntos a tratar, preparação necessária..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                        {loading ? 'Agendando...' : 'Agendar Call'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
