import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, doc, getDoc, setDoc, getDocs, query, where, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import type { AdLibraryConfig, AdLibraryOffer } from '../../types/adlibrary';

export const useAdLibraryConfig = (menteeId?: string) => {
  return useQuery({
    queryKey: ['ad-library-config', menteeId],
    queryFn: async (): Promise<AdLibraryConfig | null> => {
      if (!menteeId) return null;
      const docRef = doc(db, 'adLibraryConfig', menteeId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as AdLibraryConfig;
      }

      // Default initial config
      return {
        baseKeywords: [],
        intentKeywords: [],
        accessToken: '',
        country: 'BR',
        minDaysRunning: 7,
        minPageAds: 10,
      };
    },
    enabled: !!menteeId,
  });
};

export const useSaveAdLibraryConfig = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ menteeId, config }: { menteeId: string; config: Partial<AdLibraryConfig> }) => {
      const docRef = doc(db, 'adLibraryConfig', menteeId);
      await setDoc(docRef, {
        ...config,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ad-library-config', variables.menteeId] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao salvar configurações');
    },
  });
};

export const useAdLibraryOffers = (menteeId?: string) => {
  return useQuery({
    queryKey: ['ad-library-offers', menteeId],
    queryFn: async (): Promise<AdLibraryOffer[]> => {
      if (!menteeId) return [];

      const q = query(
        collection(db, 'adLibraryOffers'),
        where('createdByUserId', '==', menteeId)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => {
        const raw = d.data();
        return {
          id: d.id,
          ...raw,
          scannedAt: raw.scannedAt?.toDate?.() ?? new Date(raw.scannedAt ?? Date.now()),
          createdAt: raw.createdAt?.toDate?.() ?? new Date(raw.createdAt ?? Date.now()),
        } as AdLibraryOffer;
      });

      // Sort by scannedAt desc
      return data.sort((a, b) => b.scannedAt.getTime() - a.scannedAt.getTime());
    },
    enabled: !!menteeId,
  });
};

export const useSaveAdLibraryOffer = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ menteeId, offer }: { menteeId: string; offer: Partial<AdLibraryOffer> }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      await addDoc(collection(db, 'adLibraryOffers'), {
        ...offer,
        status: offer.status || 'NEW',
        createdByUserId: menteeId,
        scannedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ad-library-offers', variables.menteeId] });
      toast.success('Oferta adicionada ao dashboard!');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao salvar oferta');
    },
  });
};

export const useUpdateAdLibraryOffer = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AdLibraryOffer> }) => {
      const docRef = doc(db, 'adLibraryOffers', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-library-offers'] });
      toast.success('Oferta atualizada!');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao atualizar oferta');
    },
  });
};

export const useDeleteAdLibraryOffer = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const docRef = doc(db, 'adLibraryOffers', id);
      await deleteDoc(docRef);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ad-library-offers'] });
      toast.success('Oferta removida');
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erro ao remover oferta');
    },
  });
};
