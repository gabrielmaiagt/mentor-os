import { useEffect, useState } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import app from '../lib/firebase';

const useFcmToken = (userId?: string, collectionName: 'mentees' | 'users' = 'mentees') => {
    const [token, setToken] = useState<string | null>(null);
    const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<NotificationPermission>(
        Notification.permission
    );

    useEffect(() => {
        const retrieveToken = async () => {
            try {
                if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                    const messaging = getMessaging(app);

                    // Request permission
                    const permission = await Notification.requestPermission();
                    setNotificationPermissionStatus(permission);

                    if (permission === 'granted') {
                        const currentToken = await getToken(messaging, {
                            // vapidKey: '...' // Generate in Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
                        });

                        if (currentToken) {
                            setToken(currentToken);

                            if (userId) {
                                await updateDoc(doc(db, collectionName, userId), {
                                    fcmTokens: arrayUnion(currentToken)
                                });
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('An error occurred while retrieving token:', error);
            }
        };

        retrieveToken();
    }, [userId, collectionName]);

    return { token, notificationPermissionStatus };
};

export default useFcmToken;
