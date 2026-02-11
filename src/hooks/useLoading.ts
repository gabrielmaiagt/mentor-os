import { useCallback } from 'react';
import { useLoadingContext } from '../contexts/LoadingContext';

interface UseLoadingReturn {
    isLoading: boolean;
    startLoading: (message?: string) => void;
    stopLoading: () => void;
    setProgress: (value: number) => void;
    setMessage: (message: string) => void;
    progress?: number;
    message?: string;
}

/**
 * Hook para gerenciar loading state
 * @param key - Identificador único para este loading (opcional)
 * @returns Métodos e estado de loading
 * 
 * @example
 * const { isLoading, startLoading, stopLoading } = useLoading('dashboard');
 * 
 * const fetchData = async () => {
 *   startLoading('Carregando dados...');
 *   try {
 *     const data = await api.getData();
 *     stopLoading();
 *   } catch (error) {
 *     stopLoading();
 *   }
 * };
 */
export const useLoading = (key?: string): UseLoadingReturn => {
    const context = useLoadingContext();

    const startLoading = useCallback((message?: string) => {
        context.startLoading(key, message);
    }, [context, key]);

    const stopLoading = useCallback(() => {
        context.stopLoading(key);
    }, [context, key]);

    const setProgress = useCallback((value: number) => {
        context.setProgress(value, key);
    }, [context, key]);

    const setMessage = useCallback((message: string) => {
        context.setMessage(message, key);
    }, [context, key]);

    return {
        isLoading: context.isLoading(key),
        startLoading,
        stopLoading,
        setProgress,
        setMessage,
        progress: context.getProgress(key),
        message: context.getMessage(key)
    };
};
