import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface LoadingState {
    [key: string]: {
        isLoading: boolean;
        progress?: number;
        message?: string;
    };
}

interface LoadingContextValue {
    loadingStates: LoadingState;
    startLoading: (key?: string, message?: string) => void;
    stopLoading: (key?: string) => void;
    setProgress: (progress: number, key?: string) => void;
    setMessage: (message: string, key?: string) => void;
    isLoading: (key?: string) => boolean;
    getProgress: (key?: string) => number | undefined;
    getMessage: (key?: string) => string | undefined;
}

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

const DEFAULT_KEY = '__global__';

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [loadingStates, setLoadingStates] = useState<LoadingState>({});

    const startLoading = useCallback((key: string = DEFAULT_KEY, message?: string) => {
        setLoadingStates(prev => ({
            ...prev,
            [key]: { isLoading: true, progress: undefined, message }
        }));
    }, []);

    const stopLoading = useCallback((key: string = DEFAULT_KEY) => {
        setLoadingStates(prev => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        });
    }, []);

    const setProgress = useCallback((progress: number, key: string = DEFAULT_KEY) => {
        setLoadingStates(prev => ({
            ...prev,
            [key]: { ...prev[key], progress, isLoading: true }
        }));
    }, []);

    const setMessage = useCallback((message: string, key: string = DEFAULT_KEY) => {
        setLoadingStates(prev => ({
            ...prev,
            [key]: { ...prev[key], message, isLoading: true }
        }));
    }, []);

    const isLoading = useCallback((key: string = DEFAULT_KEY) => {
        return loadingStates[key]?.isLoading ?? false;
    }, [loadingStates]);

    const getProgress = useCallback((key: string = DEFAULT_KEY) => {
        return loadingStates[key]?.progress;
    }, [loadingStates]);

    const getMessage = useCallback((key: string = DEFAULT_KEY) => {
        return loadingStates[key]?.message;
    }, [loadingStates]);

    const value: LoadingContextValue = {
        loadingStates,
        startLoading,
        stopLoading,
        setProgress,
        setMessage,
        isLoading,
        getProgress,
        getMessage
    };

    return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};

export const useLoadingContext = (): LoadingContextValue => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoadingContext must be used within a LoadingProvider');
    }
    return context;
};
