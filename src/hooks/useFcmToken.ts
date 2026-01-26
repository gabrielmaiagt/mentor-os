import { useEffect, useState } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import app from '../lib/firebase';

const useFcmToken = (menteeId?: string) => {
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
                            // vapidKey: 'YOUR_VAPID_KEY' // Optional
                        });

                        if (currentToken) {
                            setToken(currentToken);
                            console.log('FCM Token:', currentToken);

                            if (menteeId) {
                                await updateDoc(doc(db, 'mentees', menteeId), {
                                    fcmTokens: arrayUnion(currentToken)
                                });
                            }
                        } else {
                            console.log('No registration token available.');
                        }
                    }
                }
            } catch (error) {
                console.error('An error occurred while retrieving token:', error);
            }
        };

        retrieveToken();
    }, [menteeId]);

    return { token, notificationPermissionStatus };
};

export default useFcmToken;
