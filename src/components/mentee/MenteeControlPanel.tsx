import React, { useState, useEffect } from 'react';
import {
    Settings,
    Save,
    X,
    Check,
    Plus,
    Minus,
    FileText,
    Layers
} from 'lucide-react';
import { Button } from '../ui';
import { MENTEE_STAGES } from '../../types';
import type { Mentee, MenteeStage } from '../../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useToast } from '../ui/Toast';
import './MenteeControlPanel.css';

import { format } from 'date-fns';

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
    const [startAt, setStartAt] = useState<Date>(mentee.startAt || new Date());

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
        setStartAt(mentee.startAt ? new Date(mentee.startAt) : new Date());
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
            // Sanitize data before sending to Firestore
            const sanitizedActiveStages = (activeStages || []).filter(stage => stage !== undefined && stage !== null);

            await updateDoc(doc(db, 'mentees', mentee.id), {
                activeStages: sanitizedActiveStages,
                currentStage: currentStage || 'ONBOARDING',
                callsCount: Number(callsCount) || 0, // Ensure strictly number
                notes: notes || '',
                startAt: startAt,
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

            {/* Manual Counters & Date */}
            <div className="control-section">
                <h4><Settings size={14} /> Ajustes Gerais</h4>
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

                <div style={{ marginTop: 12 }}>
                    <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                        Data de Início da Mentoria
                    </label>
                    <input
                        type="date"
                        className="notes-textarea" // Reusing style for simplicity, or could add specific style
                        style={{ height: 40, paddingTop: 10 }}
                        value={startAt ? format(startAt, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                            // Fix timezone offset issue by treating the input as local date
                            // e.target.value is yyyy-mm-dd
                            if (e.target.value) {
                                const [y, m, d] = e.target.value.split('-').map(Number);
                                setStartAt(new Date(y, m - 1, d));
                            }
                        }}
                    />
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
