import { useState, useCallback } from 'react';
import { useLoading } from './useLoading';

interface AsyncActionOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    loadingKey?: string;
    loadingMessage?: string;
}

interface AsyncActionState<T> {
    loading: boolean;
    error: Error | null;
    data: T | null;
}

type AsyncActionReturn<T, Args extends any[]> = [
    (...args: Args) => Promise<T | undefined>,
    AsyncActionState<T>
];

/**
 * Hook para executar ações assíncronas com loading automático
 * @param action - Função assíncrona a ser executada
 * @param options - Opções de configuração
 * @returns [execute, { loading, error, data }]
 * 
 * @example
 * const [saveLead, { loading, error }] = useAsyncAction(
 *   async (lead: Lead) => await createLead(lead),
 *   {
 *     onSuccess: () => toast.success('Lead criado!'),
 *     onError: (error) => toast.error(error.message),
 *     loadingKey: 'save-lead',
 *     loadingMessage: 'Salvando lead...'
 *   }
 * );
 * 
 * // Usar
 * await saveLead(newLead);
 */
export const useAsyncAction = <T, Args extends any[] = []>(
    action: (...args: Args) => Promise<T>,
    options: AsyncActionOptions<T> = {}
): AsyncActionReturn<T, Args> => {
    const { startLoading, stopLoading } = useLoading(options.loadingKey);
    const [state, setState] = useState<AsyncActionState<T>>({
        loading: false,
        error: null,
        data: null
    });

    const execute = useCallback(async (...args: Args): Promise<T | undefined> => {
        setState({ loading: true, error: null, data: null });
        startLoading(options.loadingMessage);

        try {
            const result = await action(...args);
            setState({ loading: false, error: null, data: result });
            stopLoading();

            if (options.onSuccess) {
                options.onSuccess(result);
            }

            return result;
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error');
            setState({ loading: false, error: err, data: null });
            stopLoading();

            if (options.onError) {
                options.onError(err);
            }

            return undefined;
        }
    }, [action, options, startLoading, stopLoading]);

    return [execute, state];
};
