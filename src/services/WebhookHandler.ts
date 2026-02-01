import { db } from '../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

interface WebhookPayload {
    event: 'SALE_APPROVED' | 'SALE_REFUNDED' | 'ABANDONED_CART';
    data: {
        productName: string;
        amount: number; // in cents or full units? Let's assume full units for simplicity or handle both
        currency: string;
        email: string;
        transactionId: string;
        platform: 'HOTMART' | 'KIWIFY' | 'EDUZZ' | 'STRIPE';
    }
}

export const processWebhook = async (payload: WebhookPayload) => {
    console.log("Webhook Received:", payload);

    try {
        if (payload.event === 'SALE_APPROVED') {
            await handleSaleApproved(payload.data);
        }
        // Add other handlers here
    } catch (error) {
        console.error("Error processing webhook:", error);
    }
};

const handleSaleApproved = async (data: WebhookPayload['data']) => {
    // 1. Save to Sales Collection
    const saleData = {
        ...data,
        createdAt: Timestamp.now(),
        status: 'PAID'
    };

    await addDoc(collection(db, 'sales'), saleData);

    // 2. Notification (Visual/Audio)
    // We can't trigger Audio directly from a background service worker if this runs there,
    // but if this runs on client-side simulation, we can.
    // For now, assuming this logic runs within the client app (e.g. called by a listener or simulation)

    // Dispatch custom event for UI components to listen
    const event = new CustomEvent('sale_approved', { detail: data });
    window.dispatchEvent(event);

    // Browser Notification
    if (Notification.permission === 'granted') {
        new Notification(`💰 Venda Aprovada!`, {
            body: `${data.productName} - R$ ${data.amount.toFixed(2)}`,
            icon: '/favicon.ico'
        });
    }

    // Play Sound
    const audio = new Audio('/sounds/kaching.mp3'); // Need to ensure this file exists or use a base64
    audio.play().catch(e => console.warn("Audio play failed", e));
};
