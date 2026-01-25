// Mining module types

export type OfferStatus = 'CANDIDATE' | 'TESTING' | 'DISCARDED' | 'WINNER';
export type OfferPlatform = 'META' | 'TIKTOK' | 'YOUTUBE' | 'GOOGLE' | 'OTHER';

export interface OfferMined {
    id: string;
    name: string;
    url: string;
    adCount: number;
    platform?: OfferPlatform;
    angles?: string[];
    notes?: string;
    notesMentor?: string; // Mentor's internal notes
    status: OfferStatus;
    createdAt: Date;
    updatedAt: Date;
    lastTouchedAt: Date;
    createdByUserId: string;
}

export interface MiningSummary {
    offersTotal: number;
    adsTotal: number;
    byStatus: Record<OfferStatus, number>;
    topOffer?: {
        offerId: string;
        name: string;
        adCount: number;
        url: string;
    };
    lastMinedAt?: Date;
    updatedAt: Date;
}

export const OFFER_STATUSES: { key: OfferStatus; label: string; color: string }[] = [
    { key: 'CANDIDATE', label: 'Candidata', color: '#8b5cf6' },
    { key: 'TESTING', label: 'Testando', color: '#f59e0b' },
    { key: 'DISCARDED', label: 'Descartada', color: '#6b7280' },
    { key: 'WINNER', label: 'Vencedora', color: '#22c55e' },
];

export const OFFER_PLATFORMS: { key: OfferPlatform; label: string }[] = [
    { key: 'META', label: 'Meta (Facebook/Instagram)' },
    { key: 'TIKTOK', label: 'TikTok' },
    { key: 'YOUTUBE', label: 'YouTube' },
    { key: 'GOOGLE', label: 'Google Ads' },
    { key: 'OTHER', label: 'Outro' },
];

export const getOfferStatusConfig = (status: OfferStatus) =>
    OFFER_STATUSES.find(s => s.key === status);
