// ============================================
// ENUMS & CONSTANTS
// ============================================

// User Roles
export type UserRole = 'mentor' | 'mentee';

// Lead Stages (Sales Funnel)
export type LeadStage =
    | 'NEW'
    | 'ENGAGED'
    | 'QUALIFIED'
    | 'PITCHED'
    | 'CLOSING'
    | 'WON'
    | 'LOST';

// Lead Status
export type LeadStatus = 'ACTIVE' | 'COLD' | 'CLOSED';

// Next Action Types
export type NextActionType =
    | 'FOLLOW_UP'
    | 'SEND_PROOF'
    | 'SCHEDULE_CALL'
    | 'SEND_PIX'
    | 'SEND_CHECKOUT'
    | 'CLOSE';

// Deal Stages
export type DealStage =
    | 'OPEN'
    | 'PITCH_SENT'
    | 'PAYMENT_SENT'
    | 'PAID'
    | 'LOST';

// Deal Heat (Temperature)
export type DealHeat = 'COLD' | 'WARM' | 'HOT';

// Payment Methods
export type PaymentMethod = 'PIX' | 'CHECKOUT_CARD';

// Payment Status
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'CANCELED';

// Mentee Stages (Delivery)
export type MenteeStage =
    | 'ONBOARDING'
    | 'MINING'
    | 'OFFER'
    | 'CREATIVES'
    | 'TRAFFIC'
    | 'OPTIMIZATION'
    | 'SCALING';

// Call Types
export type CallType = 'ONBOARDING' | 'REGULAR' | 'REVIEW' | 'STRATEGY' | 'EMERGENCY';

// Call Status
export type CallStatus = 'SCHEDULED' | 'DONE' | 'MISSED' | 'CANCELED';


// Task Owner Role
export type TaskOwnerRole = 'MENTOR' | 'MENTEE';

// Task Scope
export type TaskScope = 'SALES' | 'DELIVERY';

// Task Entity Type
export type TaskEntityType = 'LEAD' | 'DEAL' | 'MENTEE' | 'CALL' | 'PAYMENT' | 'OFFER_MINED';


// Task Priority
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Task Status
export type TaskStatus = 'TODO' | 'DOING' | 'DONE' | 'CANCELED' | 'OVERDUE';

// Template Categories
export type TemplateCategory = 'SALES' | 'DELIVERY' | 'FINANCE' | 'LEGAL' | 'TASKS';

// Template Intensity
export type TemplateIntensity = 'SOFT' | 'MEDIUM' | 'HARD';

// Program Types
export type ProgramType = '3 meses' | '6 meses' | '12 meses';

// ============================================
// INTERFACES
// ============================================

// ... (other interfaces)

// Template
export interface Template extends FirestoreTimestamps {
    id: string;
    key: string;
    title: string;
    category: TemplateCategory;
    intensity: TemplateIntensity;
    stageMatch?: string; // Which stage this applies to
    content: string; // Contains variables like {nome}, {valor}, etc.
    description?: string;
}

// Message Template (Quick Replies)
export interface MessageTemplate extends FirestoreTimestamps {
    id: string;
    title: string;
    content: string;
    category: 'WHATSAPP' | 'EMAIL' | 'GENERIC';
    variables?: string[];
    usageCount?: number;
    createdBy?: string;
}

export interface SmartTask {
    id: string;
    type: 'LEAD_FOLLOW_UP' | 'DEAL_CLOSE' | 'MENTEE_UPDATE';
    priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
    entityId: string;
    entityName: string;
    description: string;
    actionParams: {
        whatsapp?: string;
        link?: string;
    };
    date: Date;
}


// Base interface for Firestore timestamps
export interface FirestoreTimestamps {
    createdAt: Date;
    updatedAt: Date;
}

// User
export interface User extends FirestoreTimestamps {
    id: string;
    displayName: string;
    email: string;
    role: UserRole;
    whatsapp?: string;
    timezone?: string;
    avatarUrl?: string;
}

// Lead
export interface Lead extends FirestoreTimestamps {
    id: string;
    name: string;
    whatsapp: string;
    email?: string;
    source?: string;
    tags: string[];
    stage: LeadStage;
    status: LeadStatus;
    lastContactAt?: Date;
    nextActionAt?: Date;
    nextActionType?: NextActionType;
    objections: string[];
    notesShort?: string;
}

// Deal
export interface Deal extends FirestoreTimestamps {
    id: string;
    leadId: string;
    offerName: string;
    pitchAmount: number;
    paymentPreference: 'PIX' | 'CARD' | 'UNKNOWN';
    stage: DealStage;
    heat: DealHeat;
    // Denormalized for quick access
    leadName?: string;
    leadWhatsapp?: string;
    email?: string;
    source?: string;
    tags?: string[];
}

// Payment
export interface Payment extends FirestoreTimestamps {
    id: string;
    dealId: string;
    leadId: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    pixKeyUsed?: string;
    checkoutUrl?: string;
    paidAt?: Date;
    // Denormalized
    leadName?: string;
}

// Mentee
export interface Mentee extends FirestoreTimestamps {
    id: string;
    userId?: string; // If mentee has login
    linkedLeadId?: string;
    linkedDealId?: string;
    name: string;
    whatsapp: string;
    email?: string;
    plan?: string;
    startAt: Date;
    currentStage: MenteeStage;
    stageProgress: number; // 0-100
    weeklyGoal?: string;
    blocked: boolean;
    lastUpdateAt?: Date;
    nextCallAt?: Date;
    active?: boolean; // active by default (undefined or true)
    avatarUrl?: string;
    // Gamification
    xp?: number;
    level?: number;
    badges?: string[];
    nextLevelXp?: number;
}

// Call
export interface Call extends FirestoreTimestamps {
    id: string;
    menteeId: string;
    startAt?: Date;
    scheduledAt: Date;
    endAt?: Date;
    durationMinutes: number;
    type: CallType;
    status: CallStatus;
    agenda?: string;
    notes?: string;
    summary?: string;
    meetLink?: string;
    recordingUrl?: string;
    // Denormalized
    menteeName?: string;
}


// Task (The Heart)
export interface Task extends FirestoreTimestamps {
    id: string;
    ownerRole: TaskOwnerRole;
    ownerId: string; // mentor uid or menteeId
    scope: TaskScope;
    entityType: TaskEntityType;
    entityId: string;
    title: string;
    description?: string;
    dueAt: Date;
    priority: TaskPriority;
    status: TaskStatus;
    suggestedWhatsAppText?: string;
    quickActions: string[];
    // Denormalized for display
    entityName?: string;
}

// Update (Mentee weekly report)
export interface Update extends Omit<FirestoreTimestamps, 'updatedAt'> {
    id: string;
    menteeId: string;
    submittedByUserId?: string;
    summary: string;
    results?: string;
    blockers?: string;
}

// ============================================
// HELPER TYPES
// ============================================

// For creating new documents (without id and timestamps)
export type CreateLead = Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateDeal = Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>;
export type CreatePayment = Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateMentee = Omit<Mentee, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateCall = Omit<Call, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateTask = Omit<Task, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateUpdate = Omit<Update, 'id' | 'createdAt'>;
export type CreateTemplate = Omit<Template, 'id' | 'createdAt' | 'updatedAt'>;

// Dashboard aggregations
export interface FinanceSnapshot {
    today: number;
    week: number;
    month: number;
    total: number;
    openDeals: number;
    pendingPayments: number;
    blockedMentees: number;
}

// Action item for dashboard/execution
export interface ActionItem {
    id: string;
    type: 'lead' | 'deal' | 'mentee' | 'task' | 'call';
    entityId: string;
    title: string;
    subtitle?: string;
    urgency: 'normal' | 'attention' | 'critical';
    delayHours?: number;
    amount?: number;
    whatsapp?: string;
    suggestedMessage?: string;
    dueAt?: Date;
    stage?: string;
}

// Stage configuration for display
export interface StageConfig {
    key: string;
    label: string;
    color: string;
    description?: string;
}

// Constants for stage display
export const LEAD_STAGES: StageConfig[] = [
    { key: 'NEW', label: 'Novo', color: 'var(--status-info)' },
    { key: 'ENGAGED', label: 'Engajado', color: 'var(--accent-secondary)' },
    { key: 'QUALIFIED', label: 'Qualificado', color: 'var(--status-warning)' },
    { key: 'PITCHED', label: 'Pitch Enviado', color: 'var(--accent-primary)' },
    { key: 'CLOSING', label: 'Fechando', color: 'var(--heat-hot)' },
    { key: 'WON', label: 'Ganho', color: 'var(--status-success)' },
    { key: 'LOST', label: 'Perdido', color: 'var(--text-tertiary)' },
];

export const DEAL_STAGES: StageConfig[] = [
    { key: 'OPEN', label: 'Aberto', color: 'var(--status-info)' },
    { key: 'PITCH_SENT', label: 'Pitch Enviado', color: 'var(--status-warning)' },
    { key: 'PAYMENT_SENT', label: 'Pagamento Enviado', color: 'var(--accent-primary)' },
    { key: 'PAID', label: 'Pago', color: 'var(--status-success)' },
    { key: 'LOST', label: 'Perdido', color: 'var(--text-tertiary)' },
];

export const MENTEE_STAGES: StageConfig[] = [
    { key: 'ONBOARDING', label: 'Onboarding', color: 'var(--stage-onboarding)' },
    { key: 'MINING', label: 'Mineração', color: 'var(--stage-mining)' },
    { key: 'OFFER', label: 'Oferta', color: 'var(--stage-offer)' },
    { key: 'CREATIVES', label: 'Criativos', color: 'var(--stage-creatives)' },
    { key: 'TRAFFIC', label: 'Tráfego', color: 'var(--stage-traffic)' },
    { key: 'OPTIMIZATION', label: 'Otimização', color: 'var(--stage-optimization)' },
    { key: 'SCALING', label: 'Escala', color: 'var(--stage-scaling)' },
];

// Utility function to get stage config
export function getStageConfig(stages: StageConfig[], key: string): StageConfig | undefined {
    return stages.find(s => s.key === key);
}

// Re-export mining types
export * from './mining';

// Re-export onboarding types
export * from './onboarding';

// Re-export finance types
export * from './finance';

// Resources
export type ResourceCategory = 'GENERAL' | 'CONTRACTS' | 'X1' | 'SPREADSHEET';
export type ResourceType = 'PDF' | 'DOC' | 'SHEET' | 'LINK' | 'VIDEO' | 'IMAGE';

export interface Resource extends FirestoreTimestamps {
    id: string;
    title: string;
    description?: string;
    url: string;
    category: ResourceCategory;
    type: ResourceType;
    downloads?: number;
}

// Academy
export interface AcademyModule extends FirestoreTimestamps {
    id: string;
    title: string;
    description?: string;
    order: number;
    published: boolean;
}

export interface AcademyLesson extends FirestoreTimestamps {
    id: string;
    moduleId: string;
    title: string;
    description?: string;
    videoUrl: string;
    durationMinutes?: number;
    order: number;
    published: boolean;
}

export interface AcademyProgress extends FirestoreTimestamps {
    id: string;
    menteeId: string;
    completedLessonIds: string[];
    lastWatchedLessonId?: string;
}

// Warming / X1
export type WarmingActionType = 'MESSAGE' | 'CALL' | 'STATUS' | 'GROUP' | 'AUDIO' | 'CONFIG';
export type ChipStatus = 'WARMING' | 'READY' | 'BANNED' | 'COOLING';

export interface WarmingAction {
    id: string;
    time: string; // "09:00"
    type: WarmingActionType;
    title: string;
    description?: string;
    required?: boolean;
}

export interface WarmingDay {
    day: number; // 0 to 10
    title: string;
    description: string;
    actions: WarmingAction[];
}

export interface Chip extends FirestoreTimestamps {
    id: string;
    userId: string;
    name: string; // "Chip 01 - Vivo"
    phoneNumber: string;
    status: ChipStatus;
    currentDay: number; // 0 to 10
    startDate: Date;
    completedActions: { [day: number]: string[] }; // Map day -> list of actionIds completed
}

export interface AppNotification extends FirestoreTimestamps {
    id: string;
    userId: string; // Recipient
    title: string;
    message: string;
    read: boolean;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    link?: string;
    createdAt: any;
}

// Swipe File
export type SwipeFileCategory = 'X1' | 'Venda Direta' | 'VSL' | 'High Ticket' | 'Criativos' | 'Copy';

export interface SwipeFileItem {
    id: string;
    title: string;
    description: string;
    category: SwipeFileCategory;
    url?: string; // Link to offer/video
    imageUrl?: string; // Screenshot/Thumbnail
    tags?: string[];
    createdAt: Date;
    createdBy: string;
    likes?: number;
    views?: number;
}

// Config / Feature Flags
export interface FeatureFlags {
    enableMining: boolean;
    enableWarming: boolean;
    enableAcademy: boolean;
    enableSwipeFile: boolean;
    enableRanking: boolean;
    enableResources: boolean;
}

// Assets
export * from './assets';
