import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign,
    AlertTriangle,
    MessageSquare,
    Phone,
    Copy,
    ChevronRight,
    Zap,
    Calendar,
    ArrowUpRight,
    Search
} from 'lucide-react';

import { Card, Badge, Button } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ActionItem, FinanceSnapshot } from '../../types';
import './Dashboard.css';

// Mock data for demonstration
const mockFinance: FinanceSnapshot = {
    today: 2500,
    week: 8500,
    month: 24500,
    total: 156000,
    openDeals: 4,
    pendingPayments: 2,
    blockedMentees: 1,
};

const mockSalesActions: ActionItem[] = [
    {
        id: '1',
        type: 'deal',
        entityId: 'd1',
        title: 'João Silva',
        subtitle: 'Mentoria Tráfego Direto',
        urgency: 'critical',
        delayHours: 52,
        amount: 3000,
        whatsapp: '11999887766',
        suggestedMessage: 'Fala João! Tudo bem? Vi que ainda não confirmou o pagamento. Bora fechar essa semana?',
        stage: 'PAYMENT_SENT',
    },
    {
        id: '2',
        type: 'lead',
        entityId: 'l2',
        title: 'Maria Costa',
        subtitle: 'Lead qualificado - aguardando pitch',
        urgency: 'attention',
        delayHours: 28,
        whatsapp: '11998765432',
        suggestedMessage: 'Maria, separei um horário pra te explicar como funciona a mentoria. Qual melhor horário pra você?',
        stage: 'QUALIFIED',
    },
    {
        id: '3',
        type: 'deal',
        entityId: 'd3',
        title: 'Pedro Santos',
        subtitle: 'Pitch enviado ontem',
        urgency: 'normal',
        delayHours: 18,
        amount: 2500,
        whatsapp: '11987654321',
        stage: 'PITCH_SENT',
    },
];

const mockDeliveryActions: ActionItem[] = [
    {
        id: '4',
        type: 'call',
        entityId: 'c1',
        title: 'Call com Ana Oliveira',
        subtitle: 'Revisão semanal - 14:00',
        urgency: 'normal',
        dueAt: new Date(),
    },
    {
        id: '5',
        type: 'mentee',
        entityId: 'm1',
        title: 'Carlos Lima - TRAVADO',
        subtitle: '8 dias sem atualização',
        urgency: 'critical',
        delayHours: 192,
        whatsapp: '11976543210',
        suggestedMessage: 'Carlos, tudo bem? Notei que faz uns dias que não temos updates. Bora marcar uma call rápida pra destravar?',
        stage: 'TRAFFIC',
    },
];

// Mock mining overview data
const mockMiningOverview = [
    { menteeId: 'm4', name: 'Fernanda Souza', stage: 'MINING', offersTotal: 5, adsTotal: 67, testing: 1, lastMinedDays: 1 },
    { menteeId: 'm5', name: 'Lucas Pereira', stage: 'MINING', offersTotal: 0, adsTotal: 0, testing: 0, lastMinedDays: null },
];

const mockAlerts = [
    { id: '1', type: 'money', label: 'R$ 5.500 em risco', count: 2, description: 'Deals com ação vencida há +48h' },
    { id: '2', type: 'stuck', label: '1 mentorado travado', count: 1, description: 'Sem update há mais de 5 dias' },
    { id: '3', type: 'calls', label: '2 calls em 24h', count: 2, description: 'Preparar agenda e material' },
    { id: '4', type: 'mining', label: '1 em MINING sem ofertas', count: 1, description: 'Mentorado precisa minerar' },
];

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const toast = useToast();

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
        }).format(value);
    };

    const getUrgencyBadge = (urgency: string, delayHours?: number) => {
        switch (urgency) {
            case 'critical':
                return (
                    <Badge variant="error" pulse dot>
                        {delayHours ? `${Math.floor(delayHours)}h atraso` : 'Crítico'}
                    </Badge>
                );
            case 'attention':
                return (
                    <Badge variant="warning" dot>
                        {delayHours ? `${Math.floor(delayHours)}h` : 'Atenção'}
                    </Badge>
                );
            default:
                return delayHours ? <Badge variant="default">{Math.floor(delayHours)}h</Badge> : null;
        }
    };

    const copyMessage = async (message: string, name: string) => {
        try {
            await navigator.clipboard.writeText(message);
            toast.success('Mensagem copiada!', `Pronto para enviar para ${name}`);
        } catch (err) {
            toast.error('Erro ao copiar', 'Tente novamente');
        }
    };

    return (
        <div className="dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Sala de Guerra</h1>
                    <p className="dashboard-subtitle">
                        {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                </div>
                <Button
                    variant="primary"
                    icon={<Zap size={18} />}
                    onClick={() => navigate('/execution')}
                >
                    Modo Execução
                </Button>
            </div>

            {/* Finance Snapshot */}
            <section className="dashboard-section">
                <div className="finance-grid">
                    <Card className="finance-card finance-card-main" padding="lg">
                        <div className="finance-card-icon">
                            <DollarSign size={24} />
                        </div>
                        <div className="finance-card-content">
                            <span className="finance-card-label">Hoje</span>
                            <span className="finance-card-value">{formatCurrency(mockFinance.today)}</span>
                        </div>
                    </Card>

                    <Card className="finance-card" padding="md">
                        <div className="finance-card-content">
                            <span className="finance-card-label">7 dias</span>
                            <span className="finance-card-value">{formatCurrency(mockFinance.week)}</span>
                        </div>
                    </Card>

                    <Card className="finance-card" padding="md">
                        <div className="finance-card-content">
                            <span className="finance-card-label">30 dias</span>
                            <span className="finance-card-value">{formatCurrency(mockFinance.month)}</span>
                        </div>
                    </Card>

                    <Card className="finance-card finance-card-stats" padding="md">
                        <div className="finance-stats">
                            <div className="finance-stat">
                                <span className="finance-stat-value">{mockFinance.openDeals}</span>
                                <span className="finance-stat-label">Deals abertos</span>
                            </div>
                            <div className="finance-stat">
                                <span className="finance-stat-value text-warning">{mockFinance.pendingPayments}</span>
                                <span className="finance-stat-label">Pagamentos</span>
                            </div>
                            <div className="finance-stat">
                                <span className="finance-stat-value text-error">{mockFinance.blockedMentees}</span>
                                <span className="finance-stat-label">Travados</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            {/* Main Grid */}
            <div className="dashboard-grid">
                {/* VENDER HOJE */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <div className="section-title-group">
                            <h2 className="section-title">🎯 Vender Hoje</h2>
                            <Badge>{mockSalesActions.length}</Badge>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/crm')}>
                            Ver CRM <ChevronRight size={16} />
                        </Button>
                    </div>

                    <div className="action-list">
                        {mockSalesActions.map((action) => (
                            <Card
                                key={action.id}
                                variant={action.urgency === 'critical' ? 'urgent' : 'interactive'}
                                padding="md"
                                className={`action-card ${action.urgency === 'critical' ? 'action-card-urgent' : ''}`}
                            >
                                <div className="action-card-header">
                                    <div className="action-card-info">
                                        <h3 className="action-card-title">{action.title}</h3>
                                        <p className="action-card-subtitle">{action.subtitle}</p>
                                    </div>
                                    <div className="action-card-meta">
                                        {action.amount && (
                                            <span className="action-card-amount">{formatCurrency(action.amount)}</span>
                                        )}
                                        {getUrgencyBadge(action.urgency, action.delayHours)}
                                    </div>
                                </div>

                                <div className="action-card-actions">
                                    {action.suggestedMessage && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            icon={<Copy size={14} />}
                                            onClick={() => copyMessage(action.suggestedMessage!, action.title)}
                                        >
                                            Copiar msg
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<MessageSquare size={14} />}
                                        onClick={() => window.open(`https://wa.me/55${action.whatsapp}`, '_blank')}
                                    >
                                        WhatsApp
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<ArrowUpRight size={14} />}
                                        onClick={() => navigate(`/lead/${action.entityId}`)}
                                    >
                                        Abrir
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ENTREGAR HOJE */}
                <section className="dashboard-section">
                    <div className="section-header">
                        <div className="section-title-group">
                            <h2 className="section-title">📦 Entregar Hoje</h2>
                            <Badge>{mockDeliveryActions.length}</Badge>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/mentees')}>
                            Ver todos <ChevronRight size={16} />
                        </Button>
                    </div>

                    <div className="action-list">
                        {mockDeliveryActions.map((action) => (
                            <Card
                                key={action.id}
                                variant={action.urgency === 'critical' ? 'urgent' : 'interactive'}
                                padding="md"
                                className={`action-card ${action.urgency === 'critical' ? 'action-card-urgent' : ''}`}
                            >
                                <div className="action-card-header">
                                    <div className="action-card-info">
                                        <h3 className="action-card-title">{action.title}</h3>
                                        <p className="action-card-subtitle">{action.subtitle}</p>
                                    </div>
                                    <div className="action-card-meta">
                                        {action.type === 'call' && (
                                            <Badge variant="info" dot>
                                                <Calendar size={12} /> Hoje
                                            </Badge>
                                        )}
                                        {getUrgencyBadge(action.urgency, action.delayHours)}
                                    </div>
                                </div>

                                <div className="action-card-actions">
                                    {action.type === 'call' ? (
                                        <>
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                icon={<Phone size={14} />}
                                                onClick={() => {
                                                    toast.success('Iniciando sala...');
                                                    setTimeout(() => window.open('https://meet.google.com', '_blank'), 1000);
                                                }}
                                            >
                                                Iniciar call
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => navigate('/calendar')}
                                            >
                                                Ver agenda
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            {action.suggestedMessage && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    icon={<Copy size={14} />}
                                                    onClick={() => copyMessage(action.suggestedMessage!, action.title)}
                                                >
                                                    Copiar msg
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={<MessageSquare size={14} />}
                                            >
                                                WhatsApp
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                icon={<ArrowUpRight size={14} />}
                                                onClick={() => navigate(`/mentee/${action.entityId}`)}
                                            >
                                                Abrir
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>

            {/* Alerts */}
            <section className="dashboard-section">
                <h2 className="section-title">⚠️ Alertas</h2>
                <div className="alerts-grid">
                    {mockAlerts.map((alert) => (
                        <Card
                            key={alert.id}
                            className="alert-card"
                            padding="md"
                            variant="interactive"
                            onClick={() => {
                                if (alert.type === 'money') navigate('/finance');
                                else if (alert.type === 'stuck') navigate('/mentees');
                                else if (alert.type === 'calls') navigate('/calendar');
                                else if (alert.type === 'mining') navigate('/mentees');
                                else toast.info(`Detalhes: ${alert.description}`);
                            }}
                        >
                            <div className="alert-icon">
                                {alert.type === 'money' && <DollarSign size={20} />}
                                {alert.type === 'stuck' && <AlertTriangle size={20} />}
                                {alert.type === 'calls' && <Calendar size={20} />}
                                {alert.type === 'mining' && <Search size={20} />}
                            </div>
                            <div className="alert-content">
                                <span className="alert-label">{alert.label}</span>
                                <span className="alert-description">{alert.description}</span>
                            </div>
                            <ChevronRight size={18} className="alert-arrow" />
                        </Card>
                    ))}
                </div>
            </section>

            {/* Mining Overview */}
            <section className="dashboard-section">
                <div className="section-header">
                    <div className="section-title-group">
                        <h2 className="section-title">⛏️ Mineração — Visão Geral</h2>
                        <Badge>{mockMiningOverview.length} em MINING</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/mentees')}>
                        Ver todos <ChevronRight size={16} />
                    </Button>
                </div>

                <div className="mining-overview-grid">
                    {mockMiningOverview.map((m) => (
                        <Card
                            key={m.menteeId}
                            variant="interactive"
                            padding="md"
                            className={`mining-overview-card ${m.offersTotal === 0 ? 'mining-alert' : ''}`}
                            onClick={() => navigate(`/mentee/${m.menteeId}`)}
                        >
                            <div className="mining-overview-header">
                                <div className="mining-overview-avatar">
                                    {m.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="mining-overview-info">
                                    <span className="mining-overview-name">{m.name}</span>
                                    {m.offersTotal === 0 ? (
                                        <Badge variant="warning" size="sm">Sem ofertas</Badge>
                                    ) : (
                                        <span className="mining-overview-last">
                                            {m.lastMinedDays === 0 ? 'Hoje' : m.lastMinedDays === 1 ? 'Ontem' : `${m.lastMinedDays}d atrás`}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="mining-overview-stats">
                                <div className="mining-overview-stat">
                                    <span className="stat-number">{m.offersTotal}</span>
                                    <span className="stat-name">ofertas</span>
                                </div>
                                <div className="mining-overview-stat highlight">
                                    <span className="stat-number">{m.adsTotal}</span>
                                    <span className="stat-name">anúncios</span>
                                </div>
                                <div className="mining-overview-stat">
                                    <span className="stat-number">{m.testing}</span>
                                    <span className="stat-name">testing</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
};


export default DashboardPage;
