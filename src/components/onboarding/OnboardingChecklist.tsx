import React, { useState } from 'react';
import {
    CheckCircle2,
    Circle,
    Lock,
    Play,
    FileText,
    ExternalLink,
    ClipboardList,
    Zap,
    ChevronDown,
    ChevronUp,
    Trophy,
    Star
} from 'lucide-react';
import { Card, Badge, Button, Modal } from '../ui';
import { useToast } from '../ui/Toast';
import type { OnboardingStep, OnboardingProgress, OnboardingStepStatus } from '../../types';
import './OnboardingChecklist.css';

interface OnboardingChecklistProps {
    steps: OnboardingStep[];
    progress: OnboardingProgress;
    onCompleteStep: (stepId: string, data?: Record<string, any>) => void;
    onSkipStep: (stepId: string) => void;
}

export const OnboardingChecklist: React.FC<OnboardingChecklistProps> = ({
    steps,
    progress,
    onCompleteStep,
    onSkipStep,
}) => {
    const toast = useToast();
    const [expandedStep, setExpandedStep] = useState<string | null>(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [activeFormStep, setActiveFormStep] = useState<OnboardingStep | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [viewingVideoStep, setViewingVideoStep] = useState<string | null>(null);

    const getStepStatus = (step: OnboardingStep): OnboardingStepStatus => {
        if (progress.completedSteps.includes(step.id)) return 'DONE';
        if (progress.skippedSteps.includes(step.id)) return 'SKIPPED';

        // Check if previous required steps are done
        const stepIndex = steps.findIndex(s => s.id === step.id);
        for (let i = 0; i < stepIndex; i++) {
            const prevStep = steps[i];
            if (prevStep.isRequired && !progress.completedSteps.includes(prevStep.id)) {
                return 'LOCKED';
            }
        }

        return 'AVAILABLE';
    };

    const getStepIcon = (step: OnboardingStep, status: OnboardingStepStatus) => {
        if (status === 'DONE') return <CheckCircle2 size={20} className="step-icon done" />;
        if (status === 'LOCKED') return <Lock size={20} className="step-icon locked" />;
        if (status === 'SKIPPED') return <Circle size={20} className="step-icon skipped" />;

        switch (step.contentType) {
            case 'VIDEO': return <Play size={20} className="step-icon available" />;
            case 'PDF': return <FileText size={20} className="step-icon available" />;
            case 'LINK': return <ExternalLink size={20} className="step-icon available" />;
            case 'FORM': return <ClipboardList size={20} className="step-icon available" />;
            case 'ACTION': return <Zap size={20} className="step-icon available" />;
            default: return <Circle size={20} className="step-icon available" />;
        }
    };

    const handleStepClick = (step: OnboardingStep) => {
        const status = getStepStatus(step);
        if (status === 'LOCKED') {
            toast.warning('Passo bloqueado', 'Complete os passos anteriores primeiro');
            return;
        }

        if (expandedStep === step.id) {
            setExpandedStep(null);
        } else {
            setExpandedStep(step.id);
        }
    };

    const handleStartStep = (step: OnboardingStep) => {
        if (step.contentType === 'FORM' && step.formFields) {
            setActiveFormStep(step);
            setFormData({});
            setShowFormModal(true);
        } else if (step.contentType === 'VIDEO') {
            if (step.contentUrl) {
                setViewingVideoStep(step.id);
            }
        } else if (step.contentType === 'LINK') {
            if (step.contentUrl) {
                window.open(step.contentUrl, '_blank');
            }
            // Mark as done after opening
            onCompleteStep(step.id);
            toast.success('+' + step.xpReward + ' XP!', step.title);
        } else if (step.contentType === 'ACTION') {
            // Handle specific actions
            onCompleteStep(step.id);
            toast.success('+' + step.xpReward + ' XP!', step.title);
        }
    };

    const handleFinishVideo = (step: OnboardingStep) => {
        setViewingVideoStep(null);
        onCompleteStep(step.id);
        toast.success('+' + step.xpReward + ' XP!', step.title);
    };

    const handleSubmitForm = () => {
        if (!activeFormStep) return;

        // Validate required fields
        const missingFields = activeFormStep.formFields?.filter(
            field => field.required && !formData[field.name]
        );

        if (missingFields && missingFields.length > 0) {
            toast.error('Campos obrigatórios', 'Preencha todos os campos marcados');
            return;
        }

        onCompleteStep(activeFormStep.id, formData);
        setShowFormModal(false);
        setActiveFormStep(null);
        toast.success('+' + activeFormStep.xpReward + ' XP!', activeFormStep.title);
    };

    const completedCount = progress.completedSteps.length;
    const requiredCount = steps.filter(s => s.isRequired).length;
    const progressPercent = Math.round((completedCount / steps.length) * 100);
    const totalXp = steps.reduce((sum, s) => sum + s.xpReward, 0);

    return (
        <Card className="onboarding-checklist" padding="lg">
            {/* Header */}
            <div className="onboarding-header">
                <div className="onboarding-title-row">
                    <h2 className="onboarding-title">
                        <Trophy size={20} />
                        Checklist de Onboarding
                    </h2>
                    <Badge variant="info">
                        <Star size={12} /> {progress.xpEarned} / {totalXp} XP
                    </Badge>
                </div>
                <div className="onboarding-progress">
                    <div className="onboarding-progress-bar">
                        <div
                            className="onboarding-progress-fill"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <span className="onboarding-progress-text">
                        {completedCount} de {steps.length} concluídos
                    </span>
                </div>
            </div>

            {/* Steps List */}
            <div className="onboarding-steps">
                {steps.map((step, index) => {
                    const status = getStepStatus(step);
                    const isExpanded = expandedStep === step.id;

                    return (
                        <div
                            key={step.id}
                            className={`onboarding-step ${status} ${isExpanded ? 'expanded' : ''}`}
                        >
                            <div
                                className="onboarding-step-header"
                                onClick={() => handleStepClick(step)}
                            >
                                <div className="onboarding-step-order">
                                    {index + 1}
                                </div>
                                {getStepIcon(step, status)}
                                <div className="onboarding-step-info">
                                    <span className="onboarding-step-title">{step.title}</span>
                                    <div className="onboarding-step-meta">
                                        {step.estimatedMinutes && (
                                            <span className="onboarding-step-time">
                                                ~{step.estimatedMinutes}min
                                            </span>
                                        )}
                                        <Badge
                                            variant="default"
                                            size="sm"
                                            className="xp-badge"
                                        >
                                            +{step.xpReward} XP
                                        </Badge>
                                        {step.isRequired && status !== 'DONE' && (
                                            <Badge variant="warning" size="sm">Obrigatório</Badge>
                                        )}
                                    </div>
                                </div>
                                {status !== 'LOCKED' && (
                                    <div className="onboarding-step-expand">
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                )}
                            </div>

                            {isExpanded && status !== 'LOCKED' && (
                                <div className="onboarding-step-content">
                                    <p className="onboarding-step-description">{step.description}</p>

                                    {viewingVideoStep === step.id && step.contentType === 'VIDEO' && step.contentUrl && (
                                        <div className="video-embed-container mb-4">
                                            <iframe
                                                src={step.contentUrl.replace('watch?v=', 'embed/').replace('loom.com/share', 'loom.com/embed')}
                                                title={step.title}
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                style={{ width: '100%', height: '300px', borderRadius: '8px' }}
                                            ></iframe>
                                            <Button
                                                variant="primary"
                                                fullWidth
                                                className="mt-2"
                                                onClick={() => handleFinishVideo(step)}
                                            >
                                                Concluir Vídeo
                                            </Button>
                                        </div>
                                    )}

                                    {!viewingVideoStep && (
                                        <div className="onboarding-step-actions">
                                            {status === 'DONE' ? (
                                                <Badge variant="success">
                                                    <CheckCircle2 size={14} /> Concluído
                                                </Badge>
                                            ) : (
                                                <>
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => handleStartStep(step)}
                                                    >
                                                        {step.contentType === 'VIDEO' ? 'Assistir Vídeo' : (step.actionLabel || 'Começar')}
                                                    </Button>
                                                    {!step.isRequired && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onSkipStep(step.id)}
                                                        >
                                                            Pular
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Completion Message */}
            {completedCount === requiredCount && (
                <div className="onboarding-complete-banner">
                    <Trophy size={24} />
                    <div>
                        <h3>🎉 Onboarding Completo!</h3>
                        <p>Você já pode avançar para a próxima etapa</p>
                    </div>
                </div>
            )}

            {/* Form Modal */}
            <Modal
                isOpen={showFormModal}
                onClose={() => setShowFormModal(false)}
                title={activeFormStep?.title || 'Formulário'}
                size="md"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowFormModal(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={handleSubmitForm}>
                            Enviar
                        </Button>
                    </>
                }
            >
                <div className="onboarding-form">
                    {activeFormStep?.formFields?.map(field => (
                        <div key={field.name} className="form-field">
                            <label>
                                {field.label}
                                {field.required && <span className="required">*</span>}
                            </label>
                            {field.type === 'text' && (
                                <input
                                    type="text"
                                    placeholder={field.placeholder}
                                    value={formData[field.name] || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                />
                            )}
                            {field.type === 'textarea' && (
                                <textarea
                                    placeholder={field.placeholder}
                                    rows={3}
                                    value={formData[field.name] || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                />
                            )}
                            {field.type === 'select' && (
                                <select
                                    value={formData[field.name] || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                >
                                    <option value="">Selecione...</option>
                                    {field.options?.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            )}
                            {field.type === 'checkbox' && (
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData[field.name] || false}
                                        onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.checked }))}
                                    />
                                    {field.placeholder}
                                </label>
                            )}
                        </div>
                    ))}
                </div>
            </Modal>
        </Card>
    );
};

export default OnboardingChecklist;
