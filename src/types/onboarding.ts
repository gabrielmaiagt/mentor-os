// ============================================
// ONBOARDING MODULE TYPES
// ============================================

// Onboarding Step Status
export type OnboardingStepStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED';

// Onboarding Content Type
export type OnboardingContentType = 'VIDEO' | 'PDF' | 'LINK' | 'FORM' | 'ACTION';

// Onboarding Step
export interface OnboardingStep {
    id: string;
    order: number;
    title: string;
    description: string;
    contentType: OnboardingContentType;
    contentUrl?: string;
    estimatedMinutes?: number;
    isRequired: boolean;
    xpReward: number;
    // For forms/actions
    actionLabel?: string;
    formFields?: OnboardingFormField[];
}

// Form field for onboarding steps
export interface OnboardingFormField {
    name: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'file' | 'checkbox';
    placeholder?: string;
    required?: boolean;
    options?: string[]; // for select
}

// Onboarding Template (defined by mentor)
export interface OnboardingTemplate {
    id: string;
    name: string;
    description?: string;
    steps: OnboardingStep[];
    totalXp: number;
    estimatedDays: number;
    createdAt: Date;
    updatedAt: Date;
}

// Mentee's onboarding progress
export interface OnboardingProgress {
    menteeId: string;
    templateId: string;
    currentStepIndex: number;
    completedSteps: string[]; // step IDs
    skippedSteps: string[];
    stepData: Record<string, any>; // form submissions per step
    xpEarned: number;
    startedAt: Date;
    completedAt?: Date;
    lastActivityAt: Date;
}

// Tour step for interactive walkthrough
export interface TourStep {
    id: string;
    target: string; // CSS selector
    title: string;
    content: string;
    placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
    spotlightPadding?: number;
    disableBeacon?: boolean;
    actions?: TourAction[];
}

// Tour action button
export interface TourAction {
    label: string;
    type: 'next' | 'skip' | 'close' | 'link';
    url?: string;
}

// Tour configuration
export interface Tour {
    id: string;
    name: string;
    triggerOn: 'first_login' | 'stage_change' | 'manual';
    steps: TourStep[];
}

// Gamification badge
export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // emoji or icon name
    xpThreshold?: number;
    condition?: string; // description of unlock condition
    unlockedAt?: Date;
}

// Default onboarding template for mentees
export const DEFAULT_ONBOARDING_TEMPLATE: OnboardingStep[] = [
    {
        id: 'ob1',
        order: 1,
        title: 'Boas-vindas à Mentoria',
        description: 'Assista ao vídeo de boas-vindas e conheça a metodologia',
        contentType: 'VIDEO',
        contentUrl: 'https://youtube.com/watch?v=example',
        estimatedMinutes: 10,
        isRequired: true,
        xpReward: 50,
    },
    {
        id: 'ob2',
        order: 2,
        title: 'Preencha seu Diagnóstico',
        description: 'Responda as perguntas para personalizar sua jornada',
        contentType: 'FORM',
        estimatedMinutes: 15,
        isRequired: true,
        xpReward: 100,
        actionLabel: 'Preencher diagnóstico',
        formFields: [
            { name: 'experience', label: 'Qual sua experiência com tráfego pago?', type: 'select', options: ['Nenhuma', 'Básico', 'Intermediário', 'Avançado'], required: true },
            { name: 'goal', label: 'Qual seu objetivo principal?', type: 'textarea', placeholder: 'Descreva seu objetivo...', required: true },
            { name: 'available_hours', label: 'Quantas horas por semana você tem disponível?', type: 'select', options: ['Menos de 5h', '5-10h', '10-20h', 'Mais de 20h'], required: true },
            { name: 'budget', label: 'Qual seu orçamento mensal para tráfego?', type: 'select', options: ['Até R$500', 'R$500-2000', 'R$2000-5000', 'Acima de R$5000'], required: true },
        ],
    },
    {
        id: 'ob3',
        order: 3,
        title: 'Configure o WhatsApp',
        description: 'Adicione o número do mentor para receber updates',
        contentType: 'ACTION',
        estimatedMinutes: 2,
        isRequired: true,
        xpReward: 25,
        actionLabel: 'Adicionar contato',
    },
    {
        id: 'ob4',
        order: 4,
        title: 'Agende sua Call de Onboarding',
        description: 'Escolha o melhor horário para nossa primeira call',
        contentType: 'ACTION',
        estimatedMinutes: 3,
        isRequired: true,
        xpReward: 50,
        actionLabel: 'Agendar call',
    },
    {
        id: 'ob5',
        order: 5,
        title: 'Explore a Plataforma',
        description: 'Faça o tour interativo e conheça as funcionalidades',
        contentType: 'ACTION',
        estimatedMinutes: 5,
        isRequired: false,
        xpReward: 75,
        actionLabel: 'Iniciar tour',
    },
];

// Default tour for first login
export const FIRST_LOGIN_TOUR: TourStep[] = [
    {
        id: 't1',
        target: '.mentee-home-header',
        title: 'Bem-vindo ao MentorOS! 🎉',
        content: 'Esta é sua central de controle. Aqui você acompanha seu progresso na mentoria.',
        placement: 'bottom',
    },
    {
        id: 't2',
        target: '.stage-progress-card',
        title: 'Seu progresso',
        content: 'Veja em qual etapa você está e o quanto já evoluiu. Seu objetivo é avançar até a escala!',
        placement: 'bottom',
    },
    {
        id: 't3',
        target: '.quick-actions-row',
        title: 'Ações rápidas',
        content: 'Acesse suas calls, tarefas e envie updates semanais para o mentor.',
        placement: 'top',
    },
    {
        id: 't4',
        target: '.onboarding-checklist',
        title: 'Checklist de Onboarding',
        content: 'Complete todas as etapas para desbloquear a próxima fase. Cada item vale XP!',
        placement: 'left',
    },
];

// Gamification badges
export const ONBOARDING_BADGES: Badge[] = [
    { id: 'early_bird', name: 'Early Bird', description: 'Completou onboarding em menos de 24h', icon: '🌅' },
    { id: 'diagnosed', name: 'Diagnosticado', description: 'Preencheu o formulário de diagnóstico', icon: '📋' },
    { id: 'first_call', name: 'Primeira Call', description: 'Participou da call de onboarding', icon: '📞' },
    { id: 'explorer', name: 'Explorador', description: 'Completou o tour da plataforma', icon: '🧭' },
    { id: 'onboarding_complete', name: 'Onboarding Completo', description: 'Finalizou todo o onboarding', icon: '🏆' },
];

// Helper to calculate progress percentage
export function calculateOnboardingProgress(progress: OnboardingProgress, template: OnboardingStep[]): number {
    const requiredSteps = template.filter(s => s.isRequired);
    const completedRequired = requiredSteps.filter(s => progress.completedSteps.includes(s.id));
    return Math.round((completedRequired.length / requiredSteps.length) * 100);
}

// Helper to get next available step
export function getNextOnboardingStep(progress: OnboardingProgress, template: OnboardingStep[]): OnboardingStep | null {
    const allDone = new Set([...progress.completedSteps, ...progress.skippedSteps]);
    return template.find(step => !allDone.has(step.id)) || null;
}
