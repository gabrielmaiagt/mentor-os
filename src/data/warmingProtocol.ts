import type { WarmingDay } from '../types';

export const WARMING_PROTOCOL: WarmingDay[] = [
    {
        day: 0,
        title: "Dia 0 - Preparação e Blindagem",
        description: "Preparação inicial do chip. Foco em parecer um usuário real e discreto.",
        actions: [
            { id: 'd0-a1', time: '08:00', type: 'CONFIG', title: 'Inserir Chip e Aguardar', description: 'Insira o chip e aguarde 15 min antes de usar. Use APENAS 4G/5G (Sem WiFi).' },
            { id: 'd0-a2', time: '08:30', type: 'CONFIG', title: 'Registro no WhatsApp', description: 'Registre o número. Use foto real. NÃO coloque site ou links.' },
            { id: 'd0-a3', time: '14:00', type: 'CONFIG', title: 'Ativar 2FA', description: 'Ative a verificação em duas etapas e anote o PIN.' },
            { id: 'd0-a4', time: '15:00', type: 'MESSAGE', title: 'Salvar e Mandar Oi', description: 'Salve 3-5 contatos de confiança e mande um "Oi, número novo".' },
            { id: 'd0-a5', time: '19:00', type: 'GROUP', title: 'Entrar no 1º Grupo', description: 'Entre em 1 grupo de figurinhas. Não interaja, apenas observe.' },
            { id: 'd0-a6', time: '20:00', type: 'MESSAGE', title: 'Primeira Mensagem Grupo', description: 'Mande "Olá pessoal, prazer!" no grupo.' },
        ]
    },
    {
        day: 1,
        title: "Dia 1 - Estabelecendo Presença",
        description: "Começando a criar um rastro digital natural.",
        actions: [
            { id: 'd1-a1', time: '09:30', type: 'STATUS', title: 'Primeiro Status', description: 'poste uma foto de paisagem ou café. Texto: "Bom dia!"' },
            { id: 'd1-a2', time: '10:00', type: 'GROUP', title: 'Entrar no 2º Grupo', description: 'Entre em um novo grupo e se apresente.' },
            { id: 'd1-a3', time: '11:00', type: 'MESSAGE', title: 'Interação Individual', description: 'Chame 2-3 pessoas dos grupos no PV para trocar figurinhas.' },
            { id: 'd1-a4', time: '14:30', type: 'CALL', title: 'Primeira Ligação', description: 'Faça uma ligação de áudio de 1 min para um contato salvo.' },
            { id: 'd1-a5', time: '16:00', type: 'MESSAGE', title: 'Interagir nos Grupos', description: 'Mande figurinhas e responda mensagens (3-5 interações).' },
            { id: 'd1-a6', time: '19:00', type: 'CALL', title: 'Chamada de Vídeo', description: 'Faça uma chamada de vídeo curta (30s).' },
        ]
    },
    {
        day: 2,
        title: "Dia 2 - Intensificação Gradual",
        description: "Aumentando levemente o volume de interações.",
        actions: [
            { id: 'd2-a1', time: '08:00', type: 'STATUS', title: 'Status Matinal', description: 'Foto + Texto: "Mais um dia de trabalho!"' },
            { id: 'd2-a2', time: '08:30', type: 'GROUP', title: 'Novos Grupos', description: 'Entre em mais 2 grupos (Total 4).' },
            { id: 'd2-a3', time: '09:30', type: 'GROUP', title: 'Criar Grupo Próprio', description: 'Crie um grupo "Meus Contatos" com seus chips e interaja lá.' },
            { id: 'd2-a4', time: '11:00', type: 'CALL', title: 'Ligação Longa', description: 'Ligação de áudio de 2 min.' },
            { id: 'd2-a5', time: '14:00', type: 'CONFIG', title: 'Configurar Business', description: 'Adicione horário de atendimento (ex: 9h-18h). Adicione descrição simples.' },
            { id: 'd2-a6', time: '15:00', type: 'MESSAGE', title: 'Mensagens Individuais', description: 'Converse com 5 pessoas diferentes.' },
            { id: 'd2-a7', time: '17:30', type: 'AUDIO', title: 'Enviar Áudios', description: 'Grave 2 áudios (um em grupo, um em PV).' },
        ]
    },
    {
        day: 3,
        title: "Dia 3 - Consolidação",
        description: "Solidificando o comportamento de usuário ativo.",
        actions: [
            { id: 'd3-a1', time: '09:00', type: 'MESSAGE', title: 'Responder Acumuladas', description: 'Responda todas as mensagens pendentes.' },
            { id: 'd3-a2', time: '10:00', type: 'CALL', title: '2 Ligações', description: 'Faça 2 ligações para pessoas diferentes.' },
            { id: 'd3-a3', time: '14:00', type: 'CONFIG', title: 'Completar Perfil', description: 'Adicione endereço e melhore a descrição. SEM Catálogo ainda.' },
            { id: 'd3-a4', time: '15:00', type: 'AUDIO', title: 'Sessão de Áudios', description: 'Mande 3 áudios diferentes.' },
            { id: 'd3-a5', time: '16:00', type: 'MESSAGE', title: 'Outreach Leve', description: 'Mande msg para 8 contatos diferentes (Intervalo 5 min).' },
            { id: 'd3-a6', time: '20:30', type: 'GROUP', title: 'Flood de Figurinhas', description: 'Mande figurinhas em todos os 5 grupos.' },
        ]
    },
    {
        day: 4,
        title: "Dia 4 - Aumento de Volume",
        description: "Começando a simular uso intenso.",
        actions: [
            { id: 'd4-a1', time: '08:45', type: 'GROUP', title: 'Mais Grupos', description: 'Entre em 1-2 grupos novos (Total 6-7).' },
            { id: 'd4-a2', time: '10:00', type: 'MESSAGE', title: 'Outreach Médio', description: 'Envie 10-12 mensagens individuais (intervalo 5-10 min).' },
            { id: 'd4-a3', time: '11:45', type: 'GROUP', title: 'Interação em Massa', description: 'Mínimo 20 respostas em grupos.' },
            { id: 'd4-a4', time: '15:00', type: 'MESSAGE', title: 'Outreach Tarde', description: 'Envie 12-15 mensagens individuais.' },
            { id: 'd4-a5', time: '16:30', type: 'AUDIO', title: 'Áudios', description: 'Grave 3 áudios.' },
            { id: 'd4-a6', time: '20:45', type: 'CALL', title: 'Ligações Noturnas', description: 'Faça 2 ligações de áudio.' },
        ]
    },
    {
        day: 5,
        title: "Dia 5 - Introdução Comercial",
        description: "Introduzindo comportamento comercial sutil.",
        actions: [
            { id: 'd5-a1', time: '09:00', type: 'CONFIG', title: 'Descrição Comercial', description: 'Mude a bio para algo mais comercial: "Soluções personalizadas..."' },
            { id: 'd5-a2', time: '10:30', type: 'MESSAGE', title: 'Outreach Comercial Sutil', description: 'Envie 15 msgs. Pode citar trabalho de leve.' },
            { id: 'd5-a3', time: '11:30', type: 'AUDIO', title: 'Áudios Mistos', description: 'Grave 4 áudios (assuntos diversos).' },
            { id: 'd5-a4', time: '16:00', type: 'MESSAGE', title: 'Qualificação', description: 'Envie 18-20 msgs. Pergunte "Você trabalha com X?".' },
            { id: 'd5-a5', time: '17:30', type: 'CALL', title: 'Chamadas de Vídeo', description: 'Faça 2 chamadas de vídeo.' },
        ]
    },
    {
        day: 6,
        title: "Dia 6 - Escalada Comercial",
        description: "Foco em vendas e ofertas sutis.",
        actions: [
            { id: 'd6-a1', time: '08:30', type: 'GROUP', title: 'Grupos de Nicho', description: 'Entre em 1-2 grupos do seu nicho.' },
            { id: 'd6-a2', time: '10:00', type: 'MESSAGE', title: 'Prospecção Leve', description: 'Envie 20-25 msgs. "Trabalho com X, conhece alguém?".' },
            { id: 'd6-a3', time: '14:00', type: 'CONFIG', title: 'Catálogo', description: 'Adicione 2-3 produtos básicos no catálogo.' },
            { id: 'd6-a4', time: '17:00', type: 'MESSAGE', title: 'Ofertas Sutis', description: '25-30 msgs. 40% podem ser ofertas.' },
            { id: 'd6-a5', time: '18:30', type: 'CALL', title: 'Maratona de Chamadas', description: 'Faça 3 chamadas.' },
        ]
    },
    {
        day: 7,
        title: "Dia 7 - Operação Semi-Comercial",
        description: "Volume alto, foco comercial.",
        actions: [
            { id: 'd7-a1', time: '08:00', type: 'CALL', title: '5 Ligações', description: 'Faça 5 ligações pela manhã.' },
            { id: 'd7-a2', time: '09:30', type: 'MESSAGE', title: 'Prospecção Média', description: '30-35 msgs. Use templates variados.' },
            { id: 'd7-a3', time: '14:30', type: 'STATUS', title: 'Status de Venda', description: 'Poste: "Vagas limitadas! Chama no PV."' },
            { id: 'd7-a4', time: '15:00', type: 'CONFIG', title: 'Mais Produtos', description: 'Encha o catálogo.' },
            { id: 'd7-a5', time: '15:45', type: 'MESSAGE', title: 'Follow-ups', description: '35-40 msgs. Personalize cada uma.' },
        ]
    },
    {
        day: 8,
        title: "Dia 8 - Simulação Alta Demanda",
        description: "Testando limites de volume diário.",
        actions: [
            { id: 'd8-a1', time: '09:00', type: 'MESSAGE', title: 'Volume Alto Manhã', description: '40-45 msgs. 70% comerciais. Varie o texto.' },
            { id: 'd8-a2', time: '11:30', type: 'AUDIO', title: '8 Áudios', description: 'Grave 8 áudios, maioria comerciais.' },
            { id: 'd8-a3', time: '15:30', type: 'MESSAGE', title: 'Volume Alto Tarde', description: '45-50 msgs. Use perguntas e ofertas.' },
            { id: 'd8-a4', time: '18:00', type: 'CALL', title: 'Chamadas Fim de Tarde', description: 'Faça 5 chamadas.' },
            { id: 'd8-a5', time: '23:00', type: 'MESSAGE', title: 'Turno da Noite', description: 'Envie 25-30 msgs.' },
        ]
    },
    {
        day: 9,
        title: "Dia 9 - Pré-Operação Total",
        description: "Quase pronto para a guerra.",
        actions: [
            { id: 'd9-a1', time: '07:00', type: 'CALL', title: '7-8 Ligações', description: 'Comece o dia ligando.' },
            { id: 'd9-a2', time: '09:00', type: 'MESSAGE', title: 'Blitz Manhã', description: '50-60 msgs. 80% comerciais.' },
            { id: 'd9-a3', time: '14:30', type: 'MESSAGE', title: 'Blitz Tarde', description: '60-70 msgs. Inclua follow-ups.' },
            { id: 'd9-a4', time: '18:00', type: 'CALL', title: '6 Chamadas', description: 'Mantenha o ritmo.' },
            { id: 'd9-a5', time: '22:30', type: 'CALL', title: '5 Ligações Noite', description: 'Feche o dia ligando.' },
        ]
    },
    {
        day: 10,
        title: "Dia 10 - O Grande Teste",
        description: "Dia final de validação. Pronto para X1.",
        actions: [
            { id: 'd10-a1', time: '06:30', type: 'CALL', title: 'Maratona Ligações', description: '8-10 ligações logo cedo.' },
            { id: 'd10-a2', time: '08:30', type: 'MESSAGE', title: 'Volume Máximo Manhã', description: '70-80 msgs. Use CTA e Urgência.' },
            { id: 'd10-a3', time: '15:00', type: 'MESSAGE', title: 'Volume Máximo Tarde', description: '80-90 msgs.' },
            { id: 'd10-a4', time: '19:00', type: 'CALL', title: '7-8 Chamadas', description: 'Intensifique.' },
            { id: 'd10-a5', time: '01:00', type: 'CONFIG', title: 'TESTE DE DISPARO', description: 'Faça um disparo controlado de 30 msgs. Monitore tudo.' },
        ]
    }
];
