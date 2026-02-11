import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FeatureFlags } from '../types';

const DEFAULT_FLAGS: FeatureFlags = {
    enableMining: true,
    enableWarming: true,
    enableAcademy: true,
    enableSwipeFile: true,
    enableRanking: true,
    enableResources: true,

    // Mentor Defaults
    mentorEnableDashboard: true,
    mentorEnableExecution: true,
    mentorEnableTasks: true,
    mentorEnableCRM: true,
    mentorEnableMentees: true,
    mentorEnableCalendar: true,
    mentorEnableFinance: true,
    mentorEnableAcademy: true,
    mentorEnableTemplates: true,
    mentorEnableSwipeFile: true,
    mentorEnableAssets: true,
    mentorEnableWarming: true,
    mentorEnableResources: true,
    mentorEnableOnboarding: true,
    mentorEnableOfferLab: true,
    mentorEnableStrategyBoard: true
};

export function useFeatureFlags() {
    const [features, setFeatures] = useState<FeatureFlags>(DEFAULT_FLAGS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe to global config
        const unsubscribe = onSnapshot(doc(db, 'config', 'global'), (docSnap) => {
            if (docSnap.exists()) {
                setFeatures({ ...DEFAULT_FLAGS, ...docSnap.data() } as FeatureFlags);
            } else {
                // Create default if doesn't exist
                setDoc(doc(db, 'config', 'global'), DEFAULT_FLAGS);
                setFeatures(DEFAULT_FLAGS);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const toggleFeature = async (key: keyof FeatureFlags, value: boolean) => {
        try {
            await setDoc(doc(db, 'config', 'global'), { [key]: value }, { merge: true });
        } catch (error) {
            console.error("Error updating feature flag:", error);
        }
    };

    return { features, loading, toggleFeature };
}
