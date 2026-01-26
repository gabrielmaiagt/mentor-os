import type { Mentee } from '../types';

export const LEVEL_SCALING_FACTOR = 100; // XP needed for level 1 -> 2 is approx this base

// Level Formula: Level = floor( sqrt( XP / 100 ) )
// XP Formula: XP = 100 * Level^2
export const calculateLevel = (xp: number): number => {
    if (!xp || xp < 0) return 0;
    return Math.floor(Math.sqrt(xp / LEVEL_SCALING_FACTOR));
};

export const calculateNextLevelXp = (currentLevel: number): number => {
    const nextLevel = currentLevel + 1;
    return LEVEL_SCALING_FACTOR * (nextLevel * nextLevel);
};

export const calculateProgressToNextLevel = (xp: number, currentLevel: number, nextLevelXp: number): number => {
    const currentLevelBaseXp = LEVEL_SCALING_FACTOR * (currentLevel * currentLevel);
    const xpInLevel = xp - currentLevelBaseXp;
    const xpNeededForLevel = nextLevelXp - currentLevelBaseXp;

    if (xpNeededForLevel <= 0) return 100;

    return Math.min(100, Math.floor((xpInLevel / xpNeededForLevel) * 100));
};

export interface BadgeDefinition {
    id: string;
    icon: string;
    label: string;
    description: string;
    condition: (mentee: Mentee, metrics?: any) => boolean;
}

export const BADGES: BadgeDefinition[] = [
    {
        id: 'start',
        icon: '🚀',
        label: 'Start',
        description: 'Entrou para a mentoria',
        condition: (_m: Mentee) => true
    },
    {
        id: 'miner',
        icon: '⛏️',
        label: 'Minerador',
        description: 'Cadastrou 50 ofertas',
        condition: (_m: Mentee) => false // Need external metrics for this
    },
    {
        id: 'first_sale',
        icon: '💰',
        label: 'Primeira Venda',
        description: 'Faturou seu primeiro real',
        condition: (_m: Mentee) => false // Need external metrics
    },
    {
        id: '10k_club',
        icon: '🔥',
        label: '10k Club',
        description: 'Faturou mais de R$ 10.000',
        condition: (_m: Mentee) => false // Need external metrics
    },
    {
        id: 'veteran',
        icon: '🎓',
        label: 'Veterano',
        description: 'Mais de 3 meses de casa',
        condition: (m) => {
            const days = (Date.now() - m.startAt.getTime()) / (1000 * 60 * 60 * 24);
            return days > 90;
        }
    }
];

export const getBadge = (id: string) => BADGES.find(b => b.id === id);

// Simulation helper
// Firestore Integration
import { doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';

export const addXp = async (menteeId: string, amount: number) => {
    if (!menteeId) return;

    const menteeRef = doc(db, 'mentees', menteeId);

    // We use a transaction or simple update. Using simple update for now.
    // We need to fetch current XP to check for Level Up, OR we do it client side?
    // Let's do a smart update: increment XP. 
    // Then we might need a Cloud Function for level up, OR we just check it here.
    // For simplicity without Cloud Functions: read -> calc -> update.

    try {
        const snap = await getDoc(menteeRef);
        if (!snap.exists()) return;

        const data = snap.data() as Mentee;
        const currentXp = data.xp || 0;
        const currentLevel = data.level || 0;

        const newXp = currentXp + amount;
        const newLevel = calculateLevel(newXp);

        const updates: any = {
            xp: newXp,
            level: newLevel,
            lastUpdateAt: new Date()
        };

        // Check for Badge Unlocks (Simple checks)
        // This is better done in a separate function but adding here for "First Sale" trigger

        await updateDoc(menteeRef, updates);

        return { newXp, newLevel, levelUp: newLevel > currentLevel };
    } catch (error) {
        console.error("Error adding XP:", error);
    }
};

export const checkAndUnlockBadge = async (menteeId: string, badgeId: string) => {
    const menteeRef = doc(db, 'mentees', menteeId);
    await updateDoc(menteeRef, {
        badges: arrayUnion(badgeId)
    });
};

