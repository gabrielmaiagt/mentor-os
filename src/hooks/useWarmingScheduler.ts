import { useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { WARMING_PROTOCOL } from '../data/warmingProtocol';
import type { Chip } from '../types';

export const useWarmingScheduler = () => {
    useEffect(() => {
        if (!auth.currentUser || !('Notification' in window)) return;

        const checkSchedule = async () => {
            if (Notification.permission !== 'granted') return;

            // Fetch user chips
            const q = query(collection(db, 'warming_chips'), where('userId', '==', auth.currentUser!.uid));
            const snapshot = await getDocs(q);
            const chips = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Chip));

            const now = new Date();
            const currentHour = now.getHours().toString().padStart(2, '0');
            const currentMinute = now.getMinutes().toString().padStart(2, '0');
            const currentTime = `${currentHour}:${currentMinute}`;

            chips.forEach(chip => {
                if (chip.status !== 'WARMING') return;

                const protocolDay = WARMING_PROTOCOL.find(p => p.day === chip.currentDay);
                if (!protocolDay) return;

                protocolDay.actions.forEach(action => {
                    // Check if time matches (simple exact match)
                    // In production, might want a wider window or "seen" tracked in local storage to avoid double notify
                    if (action.time === currentTime) {
                        // Check if already completed
                        const isDone = chip.completedActions?.[chip.currentDay]?.includes(action.id);
                        if (!isDone) {
                            // SHOW NOTIFICATION
                            new Notification(`Aquecimento X1: ${chip.name}`, {
                                body: `${action.time} - ${action.title}\n${action.description}`,
                                icon: '/pwa-192x192.png', // Fallback icon path
                                tag: `${chip.id}-${action.id}` // Prevent duplicate for same action
                            });
                        }
                    }
                });
            });
        };

        // Check every minute
        const interval = setInterval(checkSchedule, 60000);
        // Initial check
        checkSchedule();

        return () => clearInterval(interval);
    }, [auth.currentUser]);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            alert('Navegador não suporta notificações.');
            return;
        }
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            new Notification('Notificações Ativadas', { body: 'Você receberá lembretes do Aquecimento X1.' });
        }
    };

    return { requestPermission };
};
