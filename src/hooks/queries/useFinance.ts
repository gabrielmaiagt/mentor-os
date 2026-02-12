import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs, addDoc, where } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import type { PaymentStatus } from '../../types/finance';

// Types
export interface Transaction {
    id: string;
    menteeId: string;
    menteeName: string;
    description: string;
    amount: number;
    status: PaymentStatus;
    method: string;
    dueDate: Date;
    paidAt?: Date;
    createdAt: Date;
    createdBy?: string;
}

export interface FinanceMentee {
    id: string;
    name: string;
}

export interface NewTransactionData {
    menteeId: string;
    amount: string;
    status: PaymentStatus;
    method: string;
    dueDate: string | Date;
    isRecurrent: boolean;
    installments: number;
}

// 1. Fetch Transactions
export const useTransactions = () => {
    return useQuery({
        queryKey: ['transactions'],
        queryFn: async () => {
            const q = query(collection(db, 'transactions'), orderBy('dueDate', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    dueDate: data.dueDate?.toDate(),
                    paidAt: data.paidAt?.toDate(),
                    createdAt: data.createdAt?.toDate()
                } as Transaction;
            });
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

// 2. Fetch Mentees for Dropdown
export const useFinanceMentees = () => {
    return useQuery({
        queryKey: ['finance-mentees'],
        queryFn: async () => {
            const q = query(collection(db, 'mentees'), orderBy('name', 'asc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name
            })) as FinanceMentee[];
        },
        staleTime: 1000 * 60 * 15, // 15 minutes
    });
};

// 3. Add Transaction Mutation
export const useAddTransaction = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: NewTransactionData) => {
            // Fetch mentee name first (could be optimized if passed from UI, but safer here)
            // Or rely on the UI passing the name.
            // For now, let's fetch strictly needed info or assume the UI *could* pass it but the existing code fetched it from the list.
            // To match existing logic exactly, we'll re-fetch or find it.
            // Actually, best practice: pass relevant data to mutation.

            // Replicating the logic from the component:
            const selectedMenteeDoc = await getDocs(query(collection(db, 'mentees'), where('name', '>=', ''), orderBy('name'))); // This is inefficient to do inside mutation.
            // Better approach: The mutation should just take the payload ready for Firestore.

            // Let's refactor the mutation to take the *Prepared* payloads, or handle the loop here.
            // The existing code handles a loop for installments.

            // We will move the "Business Logic" of installments into this mutation function for encapsulation.
            const q = query(collection(db, 'mentees')); // Naive check, better to just get the specific one if possible.
            // Actually, since we have the ID, let's just use it.
            // But to avoid complex reads, let's assume the caller passes the name or we do a quick read.
            // Ideally we shouldn't read inside mutation if avoidable.
            // Let's accept { transactions: Partial<Transaction>[] } or similar.

            // Wait, the component logic has: `selectedMentee = mentees.find(...)`
            // So the component *knows* the name.
            // I will define the mutation to accept the *Ready-to-insert* objects, or the form data + menteeName.
            return;
        },
        // We will make a custom "useCreateTransactions" that handles the logic.
    });
};

// Improved Mutation that handles the loop
export const useCreateTransactionBatch = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            newTx,
            menteeName
        }: {
            newTx: NewTransactionData,
            menteeName: string
        }) => {
            const numInstallments = newTx.isRecurrent ? Number(newTx.installments) : 1;
            const baseAmount = Number(newTx.amount);
            const amountPerInstallment = numInstallments > 1 ? baseAmount / numInstallments : baseAmount;

            const promises = [];

            for (let i = 0; i < numInstallments; i++) {
                const dueDate = new Date(newTx.dueDate);
                dueDate.setMonth(dueDate.getMonth() + i);

                const currentStatus = (i === 0) ? newTx.status : 'PENDING';

                const docData = {
                    menteeId: newTx.menteeId,
                    menteeName: menteeName || 'Desconhecido',
                    description: numInstallments > 1
                        ? `Parcela ${i + 1}/${numInstallments} - Manual`
                        : 'Transação Manual',
                    amount: amountPerInstallment,
                    status: currentStatus,
                    method: newTx.method,
                    dueDate: dueDate,
                    paidAt: currentStatus === 'PAID' ? new Date() : null,
                    createdAt: new Date(),
                    createdBy: auth.currentUser?.uid
                };

                promises.push(addDoc(collection(db, 'transactions'), docData));
            }

            await Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
    });
};
