import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import type { OfferMined } from '../../types';

export const useMiningOffers = (menteeId?: string) => {
    return useQuery({
        queryKey: ['mining-offers', menteeId],
        queryFn: async () => {
            if (!menteeId) return [];

            const q = query(
                collection(db, 'offers'),
                where('createdByUserId', '==', menteeId)
                // orderBy moved to client-side or requires composite index
            );

            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as OfferMined[];

            // Sort manually if index is missing
            return data.sort((a, b) => (b.adCount || 0) - (a.adCount || 0));
        },
        enabled: !!menteeId,
        staleTime: 1000 * 60 * 5, // 5 minutes fresh
    });
};

export const useCreateMiningOffer = () => {
    const queryClient = useQueryClient();
    const { user } = useAuth(); // Still needed for auth check
    const toast = useToast();

    return useMutation({
        mutationFn: async ({ offerData, menteeId }: { offerData: Partial<OfferMined>, menteeId: string }) => {
            if (!user?.id) throw new Error("User not authenticated");

            await addDoc(collection(db, 'offers'), {
                ...offerData,
                createdByUserId: menteeId,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mining-offers'] });
            toast.success('Oferta adicionada com sucesso!');
        },
        onError: (error) => {
            console.error(error);
            toast.error('Erro ao adicionar oferta');
        }
    });
};

export const useUpdateMiningOffer = () => {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<OfferMined> }) => {
            const offerRef = doc(db, 'offers', id);
            await updateDoc(offerRef, {
                ...data,
                updatedAt: new Date()
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mining-offers'] });
            toast.success('Oferta atualizada!');
        },
        onError: (error) => {
            console.error(error);
            toast.error('Erro ao atualizar oferta');
        }
    });
};
