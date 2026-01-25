import type { Transaction, FinanceStats, MonthlyRevenue } from '../types';
import { addMonths, subMonths, format } from 'date-fns';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock Transactions
export const mockTransactions: Transaction[] = [
    {
        id: generateId(),
        menteeId: 'm1',
        menteeName: 'Carlos Lima',
        amount: 2500,
        status: 'PAID',
        dueDate: subMonths(new Date(), 0),
        paidAt: subMonths(new Date(), 0),
        method: 'PIX',
        description: 'Entrada - Mentoria High Ticket',
    },
    {
        id: generateId(),
        menteeId: 'm2',
        menteeName: 'Ana Silva',
        amount: 1500,
        status: 'PAID',
        dueDate: subMonths(new Date(), 1),
        paidAt: subMonths(new Date(), 1),
        method: 'CREDIT_CARD',
        description: 'Mensalidade 2/6',
    },
    {
        id: generateId(),
        menteeId: 'm3',
        menteeName: 'Roberto Dias',
        amount: 2500,
        status: 'OVERDUE',
        dueDate: subMonths(new Date(), 0), // Venceu este mês e não pagou
        method: 'BOLETO',
        description: 'Mensalidade 3/6 - Atrasada',
    },
    {
        id: generateId(),
        menteeId: 'm4',
        menteeName: 'Fernanda Souza',
        amount: 5000,
        status: 'PENDING',
        dueDate: addMonths(new Date(), 0), // Vence este mês (futuro próximo)
        method: 'PIX',
        description: 'Pagamento à vista - Setup',
    },
    {
        id: generateId(),
        menteeId: 'm1',
        menteeName: 'Carlos Lima',
        amount: 2500,
        status: 'PENDING',
        dueDate: addMonths(new Date(), 1),
        method: 'PIX',
        description: 'Parcela 2/6',
    },
    {
        id: generateId(),
        menteeId: 'm2',
        menteeName: 'Ana Silva',
        amount: 1500,
        status: 'PENDING',
        dueDate: addMonths(new Date(), 1),
        method: 'CREDIT_CARD',
        description: 'Mensalidade 3/6',
    },
];

// Generate more past transactions for charts
const generatePastTransactions = () => {
    const historical: Transaction[] = [];
    for (let i = 1; i <= 6; i++) {
        historical.push({
            id: generateId(),
            menteeId: `mx${i}`,
            menteeName: `Mentorado Histórico ${i}`,
            amount: 2000 + Math.random() * 3000,
            status: 'PAID',
            dueDate: subMonths(new Date(), i),
            paidAt: subMonths(new Date(), i),
            method: Math.random() > 0.5 ? 'PIX' : 'CREDIT_CARD',
            description: `Mensalidade Ref Mês -${i}`,
        });
    }
    return historical;
};

export const allMockTransactions = [...mockTransactions, ...generatePastTransactions()].sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());

// Mock Stats
export const mockFinanceStats: FinanceStats = {
    totalRevenue: 145000, // Total acumulado 
    monthlyRevenue: 12500, // Recebido este mês (Carlos + Outros)
    projectedRevenue: 17500, // Previsto este mês (Inclui o pendente da Fernanda)
    pendingRevenue: 48000, // Total a receber futuro 
    overdueRevenue: 2500, // Roberto Dias atrasado
};

// Mock Chart Data (Last 6 months + Current + Next 2)
export const mockRevenueChartData: MonthlyRevenue[] = Array.from({ length: 9 }).map((_, i) => {
    const date = subMonths(new Date(), 6 - i);
    const isFuture = i > 6;
    const isCurrent = i === 6;

    // Base revenue with some randomization/growth
    const baseRevenue = 10000 + (i * 1500);

    return {
        month: format(date, 'MMM'),
        year: date.getFullYear(),
        revenue: isFuture ? 0 : isCurrent ? 12500 : baseRevenue + (Math.random() * 2000 - 1000),
        projected: isFuture ? baseRevenue : isCurrent ? 17500 : 0,
        expenses: 2000 + (i * 100), // Custos operacionais fixos/variáveis
    };
});
