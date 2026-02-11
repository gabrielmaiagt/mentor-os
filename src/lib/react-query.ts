import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Dados são considerados frescos por 5 minutos (não refaz fetch)
            staleTime: 1000 * 60 * 5,

            // Cache dura 30 minutos antes de ser lixo-coletado
            gcTime: 1000 * 60 * 30,

            // Retentar 1 vez em caso de erro
            retry: 1,

            // Não refetch na janela focar se os dados forem frescos
            refetchOnWindowFocus: false,

            // Mas refetch se reconectar a internet
            refetchOnReconnect: true,
        },
        mutations: {
            // Padrão para mutations
            retry: 0,
        }
    },
});
