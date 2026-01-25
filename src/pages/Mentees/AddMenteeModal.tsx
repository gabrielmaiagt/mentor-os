import React, { useState } from 'react';
import { User, Mail, Phone, Calendar } from 'lucide-react';
import { Button, Modal } from '../../components/ui';
import type { Mentee, ProgramType } from '../../types';

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
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                    <label className="text-sm font-medium text-secondary mb-1 block">Nome Completo</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary" size={18} />
                        <input
                            type="text"
                            required
                            className="bg-secondary border border-subtle rounded-md pl-10 pr-3 py-2 w-full text-primary focus:outline-none focus:border-accent"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Carlos Lima"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="text-sm font-medium text-secondary mb-1 block">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary" size={18} />
                        <input
                            type="email"
                            required
                            className="bg-secondary border border-subtle rounded-md pl-10 pr-3 py-2 w-full text-primary focus:outline-none focus:border-accent"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="carlos@email.com"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="text-sm font-medium text-secondary mb-1 block">WhatsApp</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary" size={18} />
                        <input
                            type="tel"
                            required
                            className="bg-secondary border border-subtle rounded-md pl-10 pr-3 py-2 w-full text-primary focus:outline-none focus:border-accent"
                            value={formData.whatsapp}
                            onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                            placeholder="11999999999"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="text-sm font-medium text-secondary mb-1 block">Plano</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary" size={18} />
                        <select
                            className="bg-secondary border border-subtle rounded-md pl-10 pr-3 py-2 w-full text-primary focus:outline-none focus:border-accent appearance-none"
                            value={formData.plan}
                            onChange={e => setFormData({ ...formData, plan: e.target.value as ProgramType })}
                        >
                            <option value="3 meses">Mentoria Trimestral (3 meses)</option>
                            <option value="6 meses">Mentoria Semestral (6 meses)</option>
                            <option value="12 meses">Mentoria Anual (12 meses)</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
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
