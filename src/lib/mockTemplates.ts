import type { Template } from '../types';

const now = new Date();

export const mockTemplates: Template[] = [
    // SALES
    {
        id: 't1',
        key: 'sales-qualify',
        title: 'Script de Qualificação (WhatsApp)',
        category: 'SALES',
        intensity: 'SOFT',
        content: `Oi {nome}, tudo bem? Aqui é o {meu_nome}.
Vi que você tem interesse na mentoria e queria entender melhor seu momento atual.

1. Qual seu faturamento médio hoje?
2. Qual sua maior dificuldade pra escalar?
3. Se tivesse a solução pra isso hoje, quanto você investiria?

Fico no aguardo pra saber se consigo te ajudar de verdade.`,
        description: 'Primeiro contato para filtrar curiosos de leads qualificados.',
        createdAt: now,
        updatedAt: now
    },
    {
        id: 't2',
        key: 'sales-pitch',
        title: 'Pitch de Venda (High Ticket)',
        category: 'SALES',
        intensity: 'HARD',
        content: `{nome}, analisei suas respostas. A mentoria funciona assim:
- 6 meses de acompanhamento
- Calls quinzenais
- Acesso ao meu WhatsApp pessoal
- Acesso ao meu WhatsApp pessoal

O investimento é de {valor} à vista ou 12x no cartão.
Faz sentido darmos esse passo agora?`,
        description: 'Texto direto para fechamento após qualificação.',
        createdAt: now,
        updatedAt: now
    },
    {
        id: 't3',
        key: 'sales-followup-ghost',
        title: 'Follow-up (Vácuo 24h)',
        category: 'SALES',
        intensity: 'MEDIUM',
        content: `Oi {nome}, imaginou que a correria deve estar grande aí.
Só pra eu me organizar aqui: esse assunto ainda é prioridade pra você ou posso encerrar seu processo de aplicação por enquanto?`,
        description: 'Recuperação de lead que parou de responder.',
        createdAt: now,
        updatedAt: now
    },

    // DELIVERY
    {
        id: 't4',
        key: 'onboarding-welcome',
        title: 'Boas-vindas (Pós-compra)',
        category: 'DELIVERY',
        intensity: 'SOFT',
        content: `Parabéns {nome}! 🚀
Seja muito bem-vindo à Mentoria.
O primeiro passo agora é preencher o formulário: {link_diagnostico}

Assim que preencher, agendaremos nossa Call de Kickoff.`,
        description: 'Mensagem imediata após confirmação de pagamento.',
        createdAt: now,
        updatedAt: now
    },

    // FINANCE
    {
        id: 't6',
        key: 'finance-late-payment',
        title: 'Cobrança Amigável (Atraso)',
        category: 'FINANCE',
        intensity: 'MEDIUM',
        content: `Oi {nome}, tudo certo?
Vi aqui que o sistema não identificou o pagamento da parcela {numero_parcela}.
Aconteceu alguma coisa com o link ou cartão?
Segue o link atualizado caso precise: {link_pagamento}`,
        description: 'Primeira mensagem de cobrança para atrasos curtos.',
        createdAt: now,
        updatedAt: now
    },

    // LEGAL
    {
        id: 't8',
        key: 'legal-contract-summary',
        title: 'Resumo do Contrato',
        category: 'LEGAL',
        intensity: 'HARD',
        content: `Olá {nome}, confirmando os termos acordados:
1. Duração: 6 meses
2. Garantia: 7 dias incondicional
3. Multa de cancelamento: 20% do valor restante

Por favor, dê um "DE ACORDO" aqui pra validarmos.`,
        description: 'Formalização rápida via WhatsApp.',
        createdAt: now,
        updatedAt: now
    }
];
