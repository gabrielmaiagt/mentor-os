import React, { useState } from 'react';
import { User, Mail, Phone, Calendar } from 'lucide-react';
import { Button, Modal } from '../../components/ui';
import type { Mentee, ProgramType } from '../../types';
import './AddMenteeModal.css';

interface AddMenteeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (mentee: Partial<Mentee>) => void;
}

export const AddMenteeModal: React.FC<AddMenteeModalProps> = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
        plan: '6 meses' as ProgramType,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            currentStage: 'ONBOARDING',
            stageProgress: 0,
            blocked: false,
            startAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        onClose();
        setFormData({ name: '', email: '', whatsapp: '', plan: '6 meses' });
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Novo Mentorado">
            <form onSubmit={handleSubmit} className="add-mentee-form">
                <div className="form-group">
                    <label>Nome Completo</label>
                    <div className="input-wrapper">
                        <User className="input-icon" size={18} />
                        <input
                            type="text"
                            required
                            className="form-input"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Carlos Lima"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <div className="input-wrapper">
                        <Mail className="input-icon" size={18} />
                        <input
                            type="email"
                            required
                            className="form-input"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="carlos@email.com"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>WhatsApp</label>
                    <div className="input-wrapper">
                        <Phone className="input-icon" size={18} />
                        <input
                            type="tel"
                            required
                            className="form-input"
                            value={formData.whatsapp}
                            onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                            placeholder="11999999999"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Plano</label>
                    <div className="input-wrapper">
                        <Calendar className="input-icon" size={18} />
                        <select
                            className="form-select"
                            value={formData.plan}
                            onChange={e => setFormData({ ...formData, plan: e.target.value as ProgramType })}
                        >
                            <option value="3 meses">Mentoria Trimestral (3 meses)</option>
                            <option value="6 meses">Mentoria Semestral (6 meses)</option>
                            <option value="12 meses">Mentoria Anual (12 meses)</option>
                        </select>
                    </div>
                </div>

                <div className="modal-actions">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="primary">
                        Cadastrar
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
