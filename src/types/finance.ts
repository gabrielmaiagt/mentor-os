// ============================================
// FINANCE MODULE TYPES
// ============================================

export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELED';

export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO' | 'TRANSFER';

export interface Transaction {
    id: string;
    menteeId: string;
    menteeName: string;
    amount: number;
    status: PaymentStatus;
    dueDate: Date;
    paidAt?: Date;
    method: PaymentMethod;
    description: string; // "Parcela 1/6 - Mentoria High Ticket"
    invoiceUrl?: string;
}

export interface FinanceStats {
    totalRevenue: number;     // Recebido total (Lifetime)
    monthlyRevenue: number;   // Recebido este mês (MRR Realizado)
    projectedRevenue: number; // A receber este mês (MRR Projetado)
    pendingRevenue: number;   // A receber futuro total
    overdueRevenue: number;   // Em atraso (Risco)
    burnRate?: number;        // Opcional para custos
}

export interface MonthlyRevenue {
    month: string; // "Jan", "Fev"
    year: number;
    revenue: number; // Realizado
    projected: number; // Previsto
    expenses: number;
}
