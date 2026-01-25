import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Plus,
    Edit,
    Trash2,
    GripVertical,
    Play,
    FileText,
    ExternalLink,
    ClipboardList,
    Zap,
    Save,
    Eye
} from 'lucide-react';
import { Card, CardHeader, CardContent, Badge, Button, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { DEFAULT_ONBOARDING_TEMPLATE } from '../../types';
import type { OnboardingStep, OnboardingContentType } from '../../types';
import './OnboardingEditor.css';

const contentTypeIcons: Record<OnboardingContentType, React.ReactNode> = {
    VIDEO: <Play size={16} />,
    PDF: <FileText size={16} />,
    LINK: <ExternalLink size={16} />,
    FORM: <ClipboardList size={16} />,
    ACTION: <Zap size={16} />,
};

const contentTypeLabels: Record<OnboardingContentType, string> = {
    VIDEO: 'Vídeo',
    PDF: 'PDF',
    LINK: 'Link',
    FORM: 'Formulário',
    ACTION: 'Ação',
};

export const OnboardingEditorPage: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [steps, setSteps] = useState<OnboardingStep[]>(DEFAULT_ONBOARDING_TEMPLATE);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingStep, setEditingStep] = useState<OnboardingStep | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        contentType: 'VIDEO' as OnboardingContentType,
        contentUrl: '',
        estimatedMinutes: 5,
        isRequired: true,
        xpReward: 50,
        actionLabel: '',
    });

    const totalXp = steps.reduce((sum, s) => sum + s.xpReward, 0);
    const requiredSteps = steps.filter(s => s.isRequired).length;

    const handleSaveStep = () => {
        if (!formData.title || !formData.description) {
            toast.error('Preencha título e descrição');
            return;
        }

        if (editingStep) {
            // Update existing
            setSteps(prev => prev.map(s =>
                s.id === editingStep.id
                    ? { ...s, ...formData }
                    : s
            ));
            toast.success('Passo atualizado!');
        } else {
            // Add new
            const newStep: OnboardingStep = {
                id: `ob${Date.now()}`,
                order: steps.length + 1,
                ...formData,
            };
            setSteps(prev => [...prev, newStep]);
            toast.success('Passo adicionado!');
        }

        closeModal();
    };

    const handleEdit = (step: OnboardingStep) => {
        setEditingStep(step);
        setFormData({
            title: step.title,
            description: step.description,
            contentType: step.contentType,
            contentUrl: step.contentUrl || '',
            estimatedMinutes: step.estimatedMinutes || 5,
            isRequired: step.isRequired,
            xpReward: step.xpReward,
            actionLabel: step.actionLabel || '',
        });
        setShowAddModal(true);
    };

    const handleDelete = (stepId: string) => {
        setSteps(prev => prev.filter(s => s.id !== stepId).map((s, i) => ({ ...s, order: i + 1 })));
        toast.success('Passo removido');
    };

    const moveStep = (stepId: string, direction: 'up' | 'down') => {
        const index = steps.findIndex(s => s.id === stepId);
        if (direction === 'up' && index > 0) {
            const newSteps = [...steps];
            [newSteps[index], newSteps[index - 1]] = [newSteps[index - 1], newSteps[index]];
            setSteps(newSteps.map((s, i) => ({ ...s, order: i + 1 })));
        } else if (direction === 'down' && index < steps.length - 1) {
            const newSteps = [...steps];
            [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
            setSteps(newSteps.map((s, i) => ({ ...s, order: i + 1 })));
        }
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingStep(null);
        setFormData({
            title: '',
            description: '',
            contentType: 'VIDEO',
            contentUrl: '',
            estimatedMinutes: 5,
            isRequired: true,
            xpReward: 50,
            actionLabel: '',
        });
    };

    const handleSaveTemplate = () => {
        // Would save to Firestore in real app
        toast.success('Template salvo!', 'Alterações aplicadas aos novos mentorados');
    };

    return (
        <div className="onboarding-editor">
            {/* Header */}
            <div className="onboarding-editor-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                    Voltar
                </button>

                <div className="onboarding-editor-actions">
                    <Button
                        variant="secondary"
                        icon={<Eye size={16} />}
                        onClick={() => setShowPreview(true)}
                    >
                        Preview
                    </Button>
                    <Button
                        variant="primary"
                        icon={<Save size={16} />}
                        onClick={handleSaveTemplate}
                    >
                        Salvar Template
                    </Button>
                </div>
            </div>

            {/* Title */}
            <div className="onboarding-editor-title">
                <h1>Editor de Onboarding</h1>
                <p>Configure o checklist de onboarding para novos mentorados</p>
            </div>

            {/* Stats */}
            <div className="onboarding-stats">
                <Card padding="md" className="stat-card">
                    <span className="stat-value">{steps.length}</span>
                    <span className="stat-label">Passos</span>
                </Card>
                <Card padding="md" className="stat-card">
                    <span className="stat-value">{requiredSteps}</span>
                    <span className="stat-label">Obrigatórios</span>
                </Card>
                <Card padding="md" className="stat-card highlight">
                    <span className="stat-value">{totalXp}</span>
                    <span className="stat-label">XP Total</span>
                </Card>
            </div>

            {/* Steps List */}
            <Card padding="lg" className="steps-editor-card">
                <CardHeader
                    title="Checklist de Passos"
                    action={
                        <Button
                            variant="primary"
                            size="sm"
                            icon={<Plus size={14} />}
                            onClick={() => {
                                setEditingStep(null);
                                setShowAddModal(true);
                            }}
                        >
                            Novo Passo
                        </Button>
                    }
                />
                <CardContent>
                    <div className="steps-editor-list">
                        {steps.map((step, index) => (
                            <div key={step.id} className="step-editor-item">
                                <div className="step-drag">
                                    <GripVertical size={16} />
                                </div>
                                <div className="step-order">{step.order}</div>
                                <div className="step-type">
                                    {contentTypeIcons[step.contentType]}
                                </div>
                                <div className="step-info">
                                    <span className="step-title">{step.title}</span>
                                    <div className="step-meta">
                                        <span className="step-type-label">{contentTypeLabels[step.contentType]}</span>
                                        {step.estimatedMinutes && <span>~{step.estimatedMinutes}min</span>}
                                        <Badge variant="default" size="sm">+{step.xpReward} XP</Badge>
                                        {step.isRequired && <Badge variant="warning" size="sm">Obrigatório</Badge>}
                                    </div>
                                </div>
                                <div className="step-actions">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => moveStep(step.id, 'up')}
                                        disabled={index === 0}
                                    >
                                        ↑
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => moveStep(step.id, 'down')}
                                        disabled={index === steps.length - 1}
                                    >
                                        ↓
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<Edit size={14} />}
                                        onClick={() => handleEdit(step)}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<Trash2 size={14} />}
                                        onClick={() => handleDelete(step.id)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={closeModal}
                title={editingStep ? 'Editar Passo' : 'Novo Passo'}
                size="lg"
                footer={
                    <>
                        <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSaveStep}>
                            {editingStep ? 'Salvar' : 'Adicionar'}
                        </Button>
                    </>
                }
            >
                <div className="step-form">
                    <div className="form-field">
                        <label>Título do passo *</label>
                        <input
                            type="text"
                            placeholder="Ex: Boas-vindas à Mentoria"
                            value={formData.title}
                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                    </div>

                    <div className="form-field">
                        <label>Descrição *</label>
                        <textarea
                            rows={2}
                            placeholder="Descreva o que o mentorado deve fazer"
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label>Tipo de conteúdo</label>
                            <select
                                value={formData.contentType}
                                onChange={e => setFormData(prev => ({ ...prev, contentType: e.target.value as OnboardingContentType }))}
                            >
                                <option value="VIDEO">Vídeo</option>
                                <option value="PDF">PDF</option>
                                <option value="LINK">Link externo</option>
                                <option value="FORM">Formulário</option>
                                <option value="ACTION">Ação manual</option>
                            </select>
                        </div>

                        <div className="form-field">
                            <label>Tempo estimado (min)</label>
                            <input
                                type="number"
                                min="1"
                                value={formData.estimatedMinutes}
                                onChange={e => setFormData(prev => ({ ...prev, estimatedMinutes: parseInt(e.target.value) || 5 }))}
                            />
                        </div>
                    </div>

                    {(formData.contentType === 'VIDEO' || formData.contentType === 'PDF' || formData.contentType === 'LINK') && (
                        <div className="form-field">
                            <label>URL do conteúdo</label>
                            <input
                                type="url"
                                placeholder="https://..."
                                value={formData.contentUrl}
                                onChange={e => setFormData(prev => ({ ...prev, contentUrl: e.target.value }))}
                            />
                        </div>
                    )}

                    {formData.contentType === 'ACTION' && (
                        <div className="form-field">
                            <label>Texto do botão de ação</label>
                            <input
                                type="text"
                                placeholder="Ex: Agendar Call"
                                value={formData.actionLabel}
                                onChange={e => setFormData(prev => ({ ...prev, actionLabel: e.target.value }))}
                            />
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-field">
                            <label>XP de recompensa</label>
                            <input
                                type="number"
                                min="0"
                                step="25"
                                value={formData.xpReward}
                                onChange={e => setFormData(prev => ({ ...prev, xpReward: parseInt(e.target.value) || 0 }))}
                            />
                        </div>

                        <div className="form-field checkbox-field">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.isRequired}
                                    onChange={e => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                                />
                                Passo obrigatório
                            </label>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Preview Modal */}
            <Modal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                title="Preview do Onboarding"
                size="lg"
            >
                <div className="preview-checklist">
                    {steps.map((step, index) => (
                        <div key={step.id} className="preview-step">
                            <div className="preview-step-order">{index + 1}</div>
                            <div className="preview-step-icon">
                                {contentTypeIcons[step.contentType]}
                            </div>
                            <div className="preview-step-content">
                                <span className="preview-step-title">{step.title}</span>
                                <span className="preview-step-desc">{step.description}</span>
                            </div>
                            <Badge variant="default" size="sm">+{step.xpReward} XP</Badge>
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
};

export default OnboardingEditorPage;
