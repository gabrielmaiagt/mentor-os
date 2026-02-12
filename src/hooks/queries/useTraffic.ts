import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { OfferTracker, DailyAdStats } from '../../types';

export const useTrafficOffers = (userId?: string) => {
    return useQuery({
        queryKey: ['traffic-offers', userId],
        queryFn: async () => {
            if (!userId) return [];
            const q = query(
                collection(db, 'offer_trackers'),
                where('userId', '==', userId),
                where('status', '==', 'ACTIVE')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as OfferTracker[];
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useDailyStats = (offerId?: string) => {
    return useQuery({
        queryKey: ['daily-stats', offerId],
        queryFn: async () => {
            if (!offerId) return [];
            const q = query(
                collection(db, 'daily_stats'),
                where('offerId', '==', offerId)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as DailyAdStats[];
        },
        enabled: !!offerId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

export const useCreateTrafficOffer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Omit<OfferTracker, 'id'>) => {
            const docRef = await addDoc(collection(db, 'offer_trackers'), data);
            return { id: docRef.id, ...data };
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['traffic-offers', variables.userId] });
        }
    });
};

export const useSaveDailyStat = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id?: string; data: Partial<DailyAdStats> & { offerId: string } }) => {
            if (id) {
                await updateDoc(doc(db, 'daily_stats', id), data);
                return { id, ...data };
            } else {
                const docRef = await addDoc(collection(db, 'daily_stats'), data);
                return { id: docRef.id, ...data };
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['daily-stats', variables.data.offerId] });
        }
    });
};

export const useDeleteDailyStat = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, offerId }: { id: string; offerId: string }) => {
            await deleteDoc(doc(db, 'daily_stats', id));
            return id;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['daily-stats', variables.offerId] });
        }
    });
};
