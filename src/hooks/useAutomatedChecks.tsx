import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SystemAlert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    message: string;
    actionLink?: string;
    timestamp: Date;
}

export const useAutomatedChecks = (): { alerts: SystemAlert[], isChecking: boolean } => {
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const runChecks = async () => {
            const newAlerts: SystemAlert[] = [];
            const now = new Date();

            try {
                // 1. Check for Neglected Deals (Closing > 24h)
                const qCritical = query(
                    collection(db, 'deals'),
                    where('stage', 'in', ['CLOSING', 'PAYMENT_SENT']),
                    where('updatedAt', '<', new Date(now.getTime() - 24 * 60 * 60 * 1000))
                );
                const snapCritical = await getDocs(qCritical);

                if (!snapCritical.empty) {
                    newAlerts.push({
                        id: 'critical-deals-neglected',
                        type: 'critical',
                        message: `${snapCritical.size} deals em fechamento sem atenção há 24h!`,
                        actionLink: '/dashboard', // Go to smart tasks
                        timestamp: now
                    });
                }

                // 2. Check for Leads without response (New > 24h) (Approximated by Open Deals for now)
                const qNew = query(
                    collection(db, 'deals'),
                    where('stage', '==', 'OPEN'),
                    where('createdAt', '<', new Date(now.getTime() - 24 * 60 * 60 * 1000))
                );
                const snapNew = await getDocs(qNew);

                if (!snapNew.empty) {
                    newAlerts.push({
                        id: 'new-leads-neglected',
                        type: 'warning',
                        message: `${snapNew.size} novos leads aguardando contato.`,
                        actionLink: '/crm',
                        timestamp: now
                    });
                }

                setAlerts(newAlerts);
            } catch (error) {
                console.error("Error executing automated checks:", error);
            } finally {
                setIsChecking(false);
            }
        };

        runChecks();

        // Re-run every 5 minutes
        const interval = setInterval(runChecks, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return { alerts, isChecking };
};
