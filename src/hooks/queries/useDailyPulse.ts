import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { DailyPulse, PulseActions } from '../../types';
import { useEffect, useState } from 'react';

export const useDailyPulse = (userId: string | undefined, date: string) => {
    const [pulse, setPulse] = useState<DailyPulse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId || !date) return;

        const docRef = doc(db, 'daily_pulse', userId, 'days', date);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setPulse({ id: docSnap.id, ...docSnap.data() } as DailyPulse);
            } else {
                setPulse(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId, date]);

    return { data: pulse, isLoading: loading };
};

export const useMonthlyPulse = (userId: string | undefined, monthStr: string) => {
    return useQuery({
        queryKey: ['monthly-pulse', userId, monthStr],
        queryFn: async () => {
            if (!userId) return [];
            
            // monthStr expected as "YYYY-MM"
            const q = query(
                collection(db, 'daily_pulse', userId, 'days'),
                where('date', '>=', `${monthStr}-01`),
                where('date', '<=', `${monthStr}-31`)
            );
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as DailyPulse[];
        },
        enabled: !!userId && !!monthStr,
    });
};

export const useUpdateDailyPulse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ 
            userId, 
            date, 
            actions, 
            note 
        }: { 
            userId: string; 
            date: string; 
            actions?: Partial<PulseActions>; 
            note?: string;
        }) => {
            const docRef = doc(db, 'daily_pulse', userId, 'days', date);
            const docSnap = await getDoc(docRef);
            
            const existingData = docSnap.exists() ? docSnap.data() as DailyPulse : null;
            
            const newData = {
                userId,
                date,
                actions: {
                    traffic: 'none',
                    creative: 'none',
                    stories: 'none',
                    reels: 'none',
                    youtube: 'none',
                    lesson: 'none',
                    offer: 'none',
                    saas: 'none',
                    pitch: 'none',
                    metrics: 'none',
                    ...(existingData?.actions || {}),
                    ...(actions || {})
                },
                note: note !== undefined ? note : (existingData?.note || ''),
                updatedAt: serverTimestamp(),
                createdAt: existingData?.createdAt || serverTimestamp()
            };

            await setDoc(docRef, newData, { merge: true });
            return { id: date, ...newData };
        },
        onSuccess: (_, variables) => {
            // Invalidate monthly query to update heatmap
            const monthStr = variables.date.substring(0, 7);
            queryClient.invalidateQueries({ queryKey: ['monthly-pulse', variables.userId, monthStr] });
        }
    });
};
