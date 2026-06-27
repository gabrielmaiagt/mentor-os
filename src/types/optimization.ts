// ============================================
// OTIMIZAÇÕES DIÁRIAS
// ============================================

export interface OptimizationDay {
    id: string;
    title: string;
    slug: string;
    date?: string; // Optional ISO date string, e.g. "2026-06-27"
    createdAt: Date;
    updatedAt: Date;
}

export interface Optimization {
    id: string;
    optimizationDayId: string;
    title: string;
    description?: string;
    videoUrl: string;    // Direct video URL (MP4, Firebase Storage URL) or embed
    time: string;        // HH:MM e.g. "06:30"
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

export type CreateOptimizationDay = Omit<OptimizationDay, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateOptimization = Omit<Optimization, 'id' | 'createdAt' | 'updatedAt'>;
