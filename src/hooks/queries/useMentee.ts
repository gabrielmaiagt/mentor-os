import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { Mentee } from '../../types';

export const useMentee = () => {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['mentee', user?.id],
        queryFn: async () => {
            if (!user) return null;

            // Try getting by UID (Standard)
            let q = query(collection(db, 'mentees'), where('uid', '==', user.id));
            let snapshot = await getDocs(q);

            // Fallback: Try getting by Email (Legacy support)
            if (snapshot.empty && user.email) {
                q = query(collection(db, 'mentees'), where('email', '==', user.email));
                snapshot = await getDocs(q);
            }

            if (snapshot.empty) return null;

            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() } as Mentee;
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 60, // 1 hour (User profile rarely changes)
    });
};
