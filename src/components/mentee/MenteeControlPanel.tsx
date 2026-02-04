import React, { useState, useEffect } from 'react';
import {
    Settings,
    Save,
    X,
    Check,
    Plus,
    Minus,
    Phone,
    FileText,
    Layers
} from 'lucide-react';
import { Button } from '../ui';
import type { Mentee, MenteeStage } from '../../types';
import { MENTEE_STAGES } from '../../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useToast } from '../ui/Toast';
import './MenteeControlPanel.css';

interface MenteeControlPanelProps {
    mentee: Mentee;
    onClose?: () => void;
    onUpdate?: () => void;
}

export const MenteeControlPanel: React.FC<MenteeControlPanelProps> = ({ mentee, onClose, onUpdate }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);

    // Form State
    const [activeStages, setActiveStages] = useState<MenteeStage[]>([]);
    const [currentStage, setCurrentStage] = useState<MenteeStage>(mentee.currentStage);
    const [callsCount, setCallsCount] = useState<number>(mentee.callsCount || 0);
    const [notes, setNotes] = useState<string>(mentee.notes || '');

    // Initialize state from mentee data
    useEffect(() => {
        // If activeStages exists, use it. Otherwise, initialize with currentStage
        const initialActiveStages = mentee.activeStages && mentee.activeStages.length > 0
            ? mentee.activeStages
            : [mentee.currentStage];

        setActiveStages(initialActiveStages);
        setCurrentStage(mentee.currentStage);
        setCallsCount(mentee.callsCount || 0);
        setNotes(mentee.notes || '');
    }, [mentee]);

    const handleToggleStage = (stage: MenteeStage) => {
        setActiveStages(prev => {
            if (prev.includes(stage)) {
                // Don't allow removing the current main stage to avoid inconsistencies
                // unless we change the current stage logic too. 
                // For now, let's allow removing but ensure one is always active.
                if (prev.length === 1) return prev;
                return prev.filter(s => s !== stage);
            } else {
                return [...prev, stage];
            }
        });
    };

    const handleSetMainStage = (stage: MenteeStage, e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentStage(stage);
        // Ensure main stage is also in active stages
        setActiveStages(prev => {
            if (!prev.includes(stage)) return [...prev, stage];
            return prev;
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateDoc(doc(db, 'mentees', mentee.id), {
                activeStages,
                currentStage,
                callsCount,
                notes,
                lastUpdateAt: new Date()
            });

            toast.success('Configurações atualizadas com sucesso!');
            if (onUpdate) onUpdate();
            if (onClose) onClose();
        } catch (error) {
            console.error('Error updating mentee settings:', error);
            toast.error('Erro ao salvar as alterações.');
        } finally {
            setLoading(false);
        }
    };

    // Helper to order stages correctly
    const allStages = MENTEE_STAGES;

    return (
        <div className="mentee-control-panel">
            <div className="control-panel-header">
                <div className="control-panel-title">
                    <Settings size={18} />
                    Painel de Controle
                </div>
                {onClose && (
                    <button onClick={onClose} className="counter-btn" style={{ marginLeft: 'auto' }}>
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Stages Management */}
            <div className="control-section">
                <h4>
                    <Layers size={14} />
                    Etapas Ativas
                    <span style={{ fontSize: '11px', opacity: 0.7, fontWeight: 400 }}>
                        (Clique para ativar, Clique duplo no ícone para definir como principal)
                    </span>
                </h4>
                <div className="stages-grid">
                    {allStages.map(stageConfig => {
                        const stage = stageConfig.key as MenteeStage;
                        const isActive = activeStages.includes(stage);
                        const isMain = currentStage === stage;

                        return (
                            <div
                                key={stage}
                                className={`stage-toggle ${isActive ? 'active' : ''} ${isMain ? 'main-stage' : ''}`}
                                onClick={() => handleToggleStage(stage)}
                                title={isMain ? "Etapa Principal Atual" : "Clique para ativar/desativar"}
                            >
                                <div
                                    className="stage-icon-wrapper"
                                    onClick={(e) => handleSetMainStage(stage, e)}
                                    style={{ cursor: 'pointer', display: 'flex' }}
                                    title="Clique para definir como etapa principal"
                                >
                                    {isActive ? <Check size={14} /> : <div style={{ width: 14, height: 14 }} />}
                                </div>
                                {stageConfig.label}
                                {isMain && <span style={{ fontSize: '10px', marginLeft: 4, opacity: 0.8 }}>(Principal)</span>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Manual Counters */}
            <div className="control-section">
                <h4><Phone size={14} /> Contagem Manual</h4>
                <div className="counters-row">
                    <div className="counter-control">
                        <span>Calls Realizadas:</span>
                        <button
                            className="counter-btn"
                            onClick={() => setCallsCount(Math.max(0, callsCount - 1))}
                        >
                            <Minus size={14} />
                        </button>
                        <span className="counter-value">{callsCount}</span>
                        <button
                            className="counter-btn"
                            onClick={() => setCallsCount(callsCount + 1)}
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="control-section">
                <h4><FileText size={14} /> Anotações Gerais</h4>
                <textarea
                    className="notes-textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anotações internas sobre o mentorado..."
                />
            </div>

            {/* Actions */}
            <div className="control-actions">
                <Button
                    variant="ghost"
                    onClick={onClose}
                    disabled={loading}
                >
                    Cancelar
                </Button>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    loading={loading}
                    icon={<Save size={16} />}
                >
                    Salvar Alterações
                </Button>
            </div>
        </div>
    );
};
