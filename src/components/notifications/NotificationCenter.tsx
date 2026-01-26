import React, { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import type { AppNotification } from '../../types';
import { useNavigate } from 'react-router-dom';
import './NotificationCenter.css';

export const NotificationCenter: React.FC = () => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', auth.currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        });

        return () => unsubscribe();
    }, []);

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await updateDoc(doc(db, 'notifications', id), { read: true });
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkAllRead = async () => {
        if (unreadCount === 0) return;
        try {
            const batch = writeBatch(db);
            notifications.filter(n => !n.read).forEach(n => {
                const ref = doc(db, 'notifications', n.id);
                batch.update(ref, { read: true });
            });
            await batch.commit();
        } catch (error) {
            console.error(error);
        }
    };

    const handleClick = (n: AppNotification) => {
        if (!n.read) {
            handleMarkAsRead(n.id, { stopPropagation: () => { } } as any);
        }
        if (n.link) {
            navigate(n.link);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative notification-center">
            <button
                className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell size={20} className={unreadCount > 0 ? 'text-white' : 'text-secondary'} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-[#09090b]" />
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-[var(--bg-card)] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                            <h3 className="font-bold">Notificações</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                                >
                                    Marcar todas lidas
                                </button>
                            )}
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-secondary">
                                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">Nenhuma notificação</p>
                                </div>
                            ) : (
                                <div>
                                    {notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleClick(n)}
                                            className={`
                                                p-4 border-b border-white/5 cursor-pointer transition-colors flex gap-3
                                                ${n.read ? 'opacity-60 hover:opacity-100 hover:bg-white/5' : 'bg-primary/5 hover:bg-primary/10'}
                                            `}
                                        >
                                            <div className={`
                                                w-2 h-2 mt-2 rounded-full shrink-0
                                                ${n.read ? 'bg-transparent' : 'bg-primary'}
                                            `} />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium mb-1">{n.title}</p>
                                                <p className="text-xs text-secondary leading-relaxed">{n.message}</p>
                                                <p className="text-[10px] text-muted mt-2">
                                                    {n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000).toLocaleString() : 'Agora'}
                                                </p>
                                            </div>
                                            {!n.read && (
                                                <button
                                                    onClick={(e) => handleMarkAsRead(n.id, e)}
                                                    className="p-1 hover:bg-white/10 rounded-full h-fit text-secondary hover:text-white"
                                                    title="Marcar como lida"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
