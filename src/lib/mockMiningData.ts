// Mock data for mining module

import type { OfferMined, MiningSummary, OfferStatus } from '../types';

// Mock offers mined for Carlos Lima (mentee in MINING stage)
export const mockOffersMined: OfferMined[] = [
    {
        id: 'om1',
        name: 'Curso de Crochê da Maria',
        url: 'https://www.facebook.com/ads/library/?id=123456789',
        adCount: 31,
        platform: 'META',
        angles: ['antes/depois', 'prova social', 'renda extra'],
        notes: 'Muita prova social. Mostra prints de vendas e alunos. Está rodando há mais de 6 meses.',
        status: 'TESTING',
        adHistory: [],
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        lastTouchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdByUserId: 'm1',
    },
    {
        id: 'om2',
        name: 'Método Emagrecer Dormindo',
        url: 'https://www.facebook.com/ads/library/?id=234567890',
        adCount: 18,
        platform: 'META',
        angles: ['sem esforço', 'cientificamente comprovado'],
        notes: 'Promessa forte mas copy um pouco genérica. Vale testar com ajustes.',
        status: 'CANDIDATE',
        adHistory: [],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        lastTouchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdByUserId: 'm1',
    },
    {
        id: 'om3',
        name: 'Curso de Bolos Decorados',
        url: 'https://www.facebook.com/ads/library/?id=345678901',
        adCount: 11,
        platform: 'META',
        angles: ['renda extra', 'trabalhar de casa'],
        status: 'CANDIDATE',
        adHistory: [],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        lastTouchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        createdByUserId: 'm1',
    },
    {
        id: 'om4',
        name: 'App de Delivery Local',
        url: 'https://www.facebook.com/ads/library/?id=456789012',
        adCount: 5,
        platform: 'META',
        notes: 'Poucos anúncios ainda. Monitorar crescimento.',
        status: 'DISCARDED',
        adHistory: [],
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        lastTouchedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        createdByUserId: 'm1',
    },
    {
        id: 'om5',
        name: 'Mentoria de Tráfego Pago',
        url: 'https://www.facebook.com/ads/library/?id=567890123',
        adCount: 2,
        platform: 'META',
        angles: ['autoridade', 'resultados'],
        status: 'CANDIDATE',
        adHistory: [],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        lastTouchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdByUserId: 'm1',
    },
];

// Mock mining summary for Carlos Lima
export const mockMiningSummary: MiningSummary = {
    offersTotal: 5,
    adsTotal: 67, // sum of adCounts
    byStatus: {
        CANDIDATE: 3,
        TESTING: 1,
        DISCARDED: 1,
        WINNER: 0,
    },
    topOffer: {
        offerId: 'om1',
        name: 'Curso de Crochê da Maria',
        adCount: 31,
        url: 'https://www.facebook.com/ads/library/?id=123456789',
    },
    lastMinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
};

// Helper to calculate mining summary from offers
export function calculateMiningSummary(offers: OfferMined[]): MiningSummary {
    const byStatus: Record<OfferStatus, number> = {
        CANDIDATE: 0,
        TESTING: 0,
        DISCARDED: 0,
        WINNER: 0,
    };

    let adsTotal = 0;
    let topOffer: MiningSummary['topOffer'] = undefined;
    let lastMinedAt: Date | undefined = undefined;

    offers.forEach(offer => {
        byStatus[offer.status]++;
        adsTotal += offer.adCount;

        if (!topOffer || offer.adCount > topOffer.adCount) {
            topOffer = {
                offerId: offer.id,
                name: offer.name,
                adCount: offer.adCount,
                url: offer.url,
            };
        }

        if (!lastMinedAt || offer.lastTouchedAt > lastMinedAt) {
            lastMinedAt = offer.lastTouchedAt;
        }
    });

    return {
        offersTotal: offers.length,
        adsTotal,
        byStatus,
        topOffer,
        lastMinedAt,
        updatedAt: new Date(),
    };
}
