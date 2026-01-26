import React, { useState, useEffect } from 'react';
import { Modal, Button } from '../ui';
import { useToast } from '../ui/Toast';
import { addDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import './CreateDealModal.css';

interface CreateDealModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string;
    leadName: string;
    leadWhatsapp: string;
}

export const CreateDealModal: React.FC<CreateDealModalProps> = ({
    isOpen,
    onClose,
    leadId,
    leadName,
    leadWhatsapp
}) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [offers, setOffers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        offerName: '',
        pitchAmount: '',
        notes: ''
    });

    // Fetch offers for dropdown
    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const q = query(collection(db, 'offers'), orderBy('name', 'asc'));
                const snapshot = await getDocs(q);
                const offersList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name,
                    price: doc.data().price || 0
                }));
                setOffers(offersList);
            } catch (error) {
                console.error('Error fetching offers:', error);
            }
        };

        if (isOpen) {
            fetchOffers();
        }
    }, [isOpen]);

    const handleOfferChange = (offerName: string) => {
        setFormData({ ...formData, offerName });

        // Auto-fill amount if offer has price
        const selectedOffer = offers.find(o => o.name === offerName);
        if (selectedOffer?.price) {
            setFormData(prev => ({ ...prev, pitchAmount: String(selectedOffer.price) }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.offerName || !formData.pitchAmount) {
            toast.error('Preencha oferta e valor');
            return;
        }

        setLoading(true);
        try {
            // Create deal
            await addDoc(collection(db, 'deals'), {
                leadId,
                leadName,
                leadWhatsapp,
                offerName: formData.offerName,
                pitchAmount: Number(formData.pitchAmount),
                stage: 'PITCHED',
                heat: 'WARM',
                notes: formData.notes.trim() || null,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            toast.success('Deal criado!', `${leadName} - ${formData.offerName}`);
            setFormData({ offerName: '', pitchAmount: '', notes: '' });
            onClose();
        } catch (error) {
            console.error('Error creating deal:', error);
            toast.error('Erro ao criar deal');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Criar Deal"
            size="md"
        >
            <form onSubmit={handleSubmit} className="create-deal-form">
                <div className="deal-lead-info">
                    <h4>{leadName}</h4>
                    <p>{leadWhatsapp}</p>
                </div>

                <div className="form-group">
                    <label htmlFor="offerName">
                        Oferta <span className="required">*</span>
                    </label>
                    <select
                        id="offerName"
                        className="input-field"
                        value={formData.offerName}
                        onChange={(e) => handleOfferChange(e.target.value)}
                        required
                    >
                        <option value="">Selecione uma oferta...</option>
                        {offers.map(offer => (
                            <option key={offer.id} value={offer.name}>
                                {offer.name} {offer.price ? `- R$ ${offer.price.toLocaleString('pt-BR')}` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="pitchAmount">
                        Valor Proposto (R$) <span className="required">*</span>
                    </label>
                    <input
                        type="number"
                        id="pitchAmount"
                        className="input-field"
                        min="0"
                        step="100"
                        value={formData.pitchAmount}
                        onChange={(e) => setFormData({ ...formData, pitchAmount: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="notes">Notas / Contexto</label>
                    <textarea
                        id="notes"
                        className="input-field"
                        rows={3}
                        placeholder="Contexto da conversa, objeções, próximos passos..."
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
                        {loading ? 'Criando...' : 'Criar Deal'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
