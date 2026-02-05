import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import type { Task } from '../types';

export const useTaskScheduler = () => {
    const { user } = useAuth();
    const toast = useToast();

    // Store tasks in a ref to access them inside setInterval without re-triggering effect
    const tasksRef = useRef<Task[]>([]);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'tasks'),
            where('ownerId', '==', user.id),
            where('status', '!=', 'DONE')
        );

        // 1. Listen for DB updates
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedTasks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Task[];
            tasksRef.current = loadedTasks;

            // Initial check on load (in case we missed one while offline)
            checkDueTasks();
        });

        // 2. Check time every 30 seconds
        const intervalId = setInterval(checkDueTasks, 30 * 1000);

        return () => {
            unsubscribe();
            clearInterval(intervalId);
        };
    }, [user]);

    const checkDueTasks = () => {
        const now = new Date();

        tasksRef.current.forEach(async (task) => {
            // Skip if already notified or no due date
            if (task.notified || !task.dueDate) return;

            const dueDate = task.dueDate instanceof Timestamp ? task.dueDate.toDate() : new Date(task.dueDate);

            // Check if due (or passed)
            if (dueDate <= now) {
                // Trigger Notification
                notifyUser(task);

                // Mark as notified in DB
                try {
                    await updateDoc(doc(db, 'tasks', task.id), {
                        notified: true
                    });
                } catch (error) {
                    console.error('Error updating task notification status:', error);
                }
            }
        });
    };

    const notifyUser = (task: Task) => {
        // 1. Browser Notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏰ Hora da Missão!', {
                body: `"${task.title}" está agendada para agora.`,
                icon: '/icon.png' // adjustments might be needed
            });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('⏰ Hora da Missão!', {
                        body: `"${task.title}" está agendada para agora.`
                    });
                }
            });
        }

        // 2. In-App Toast (always works)
        toast.info(task.title, 'Hora da missão!');

        // 3. Audio Alert (Optional)
        try {
            const audio = new Audio('/notification.mp3'); // path to be verified
            audio.play().catch(() => { }); // catch autoplay errors
        } catch (e) {
            // ignore
        }
    };
};
