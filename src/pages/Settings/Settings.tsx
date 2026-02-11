import React from 'react';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import { Card } from '../../components/ui';
import { Shield, Hammer, BookOpen, Layers, Trophy, FolderOpen } from 'lucide-react';
import './Settings.css';

// Simple Toggle Component with inline styles
const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: (val: boolean) => void }) => (
    <button
        type="button"
        onClick={() => onChange(!enabled)}
        aria-pressed={enabled}
        style={{
            position: 'relative',
            display: 'inline-flex',
            height: '28px',
            width: '52px',
            alignItems: 'center',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            backgroundColor: enabled ? '#10b981' : '#374151',
            padding: '2px',
        }}
    >
        <span
            style={{
                display: 'inline-block',
                height: '22px',
                width: '22px',
                borderRadius: '9999px',
                backgroundColor: 'white',
                transition: 'transform 0.2s ease',
                transform: enabled ? 'translateX(24px)' : 'translateX(2px)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
        />
    </button>
);

export const SettingsPage: React.FC = () => {
    const { features, loading, toggleFeature } = useFeatureFlags();

    const featureList = [
        { key: 'enableMining', label: 'Mineração', icon: <Hammer />, desc: 'Aba de ferramentas de mineração' },
        { key: 'enableWarming', label: 'Blindagem / Aquecimento', icon: <Shield />, desc: 'Gestão de chips e aquecimento' },
        { key: 'enableAcademy', label: 'Academy', icon: <BookOpen />, desc: 'Área de cursos e aulas' },
        { key: 'enableSwipeFile', label: 'Swipe File', icon: <Layers />, desc: 'Biblioteca de ofertas' },
        { key: 'enableRanking', label: 'Ranking', icon: <Trophy />, desc: 'Ranking de gamificação' },
        { key: 'enableResources', label: 'Materiais', icon: <FolderOpen />, desc: 'Área de downloads e links' },
        { key: 'enableRanking', label: 'Ranking', icon: <Trophy />, desc: 'Ranking de gamificação' },
        { key: 'enableResources', label: 'Materiais', icon: <FolderOpen />, desc: 'Área de downloads e links' },
    ];

    const mentorFeatureList = [
        { key: 'mentorEnableDashboard', label: 'Dashboard' },
        { key: 'mentorEnableExecution', label: 'Execução' },
        { key: 'mentorEnableTasks', label: 'Missões' },
        { key: 'mentorEnableCRM', label: 'CRM' },
        { key: 'mentorEnableMentees', label: 'Mentorados' },
        { key: 'mentorEnableCalendar', label: 'Calendário' },
        { key: 'mentorEnableFinance', label: 'Financeiro' },
        { key: 'mentorEnableAcademy', label: 'Academy' },
        { key: 'mentorEnableTemplates', label: 'Templates' },
        { key: 'mentorEnableSwipeFile', label: 'Swipe File' },
        { key: 'mentorEnableAssets', label: 'Ativos' },
        { key: 'mentorEnableWarming', label: 'Aquecimento X1' },
        { key: 'mentorEnableResources', label: 'Recursos' },
        { key: 'mentorEnableOnboarding', label: 'Editor Onboarding' },
        { key: 'mentorEnableOfferLab', label: 'Laboratório de Ofertas' },
        { key: 'mentorEnableStrategyBoard', label: 'Lousa Estratégica' },
    ];

    if (loading) {
        return (
            <div className="settings-page p-6 max-w-4xl mx-auto">
                <div className="text-center text-secondary py-12">Carregando configurações...</div>
            </div>
        );
    }

    return (
        <div className="settings-page p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-2">Configurações da Plataforma</h1>
            <p className="text-secondary mb-8">Personalize quais funcionalidades aparecem para os mentorados.</p>

            <div className="grid grid-cols-1 gap-4">
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Visibilidade de Módulos</h2>
                    <div className="space-y-6">
                        {featureList.map((item) => (
                            <div key={item.key} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-white/5 text-secondary">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{item.label}</h3>
                                        <p className="text-sm text-secondary">{item.desc}</p>
                                    </div>
                                </div>
                                <Toggle
                                    enabled={features[item.key as keyof typeof features] ?? false}
                                    onChange={(val) => toggleFeature(item.key as keyof typeof features, val)}
                                />
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Painel do Mentor (Suas Abas)</h2>
                    <p className="text-secondary text-sm mb-6">Oculte funcionalidades que você não usa no momento para limpar sua visão.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {mentorFeatureList.map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                <span className="text-white font-medium">{item.label}</span>
                                <Toggle
                                    enabled={features[item.key as keyof typeof features] !== false}
                                    onChange={(val) => toggleFeature(item.key as keyof typeof features, val)}
                                />
                            </div>
                        ))}
                    </div>
                </Card>

                <NotificationTester />
            </div>
        </div>
    );
};

const NotificationTester = () => {
    const [title, setTitle] = React.useState('Teste de Notificação');
    const [body, setBody] = React.useState('Se você está vendo isso, as notificações estão funcionando!');

    const handleTest = () => {
        if (!("Notification" in window)) {
            alert("Este navegador não suporta notificações de desktop.");
            return;
        }

        if (Notification.permission === "granted") {
            new Notification(title, { body, icon: '/favicon.ico' });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    new Notification(title, { body, icon: '/favicon.ico' });
                }
            });
        } else {
            alert("Permissão para notificações foi negada. Verifique as configurações do navegador.");
        }
    };

    return (
        <Card className="p-6">
            <h2 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Teste de Notificações</h2>
            <p className="text-secondary mb-4 text-sm">
                Use esta área para verificar se o navegador está exibindo alertas corretamente.
                Certifique-se de que o site tem permissão e que o "Não Perturbe" do Windows está desligado.
            </p>
            <div className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm text-secondary mb-1">Título</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-white/30"
                    />
                </div>
                <div>
                    <label className="block text-sm text-secondary mb-1">Mensagem</label>
                    <input
                        type="text"
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-white/30"
                    />
                </div>
                <button
                    onClick={handleTest}
                    className="self-start px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium transition-colors"
                >
                    Enviar Notificação de Teste
                </button>
            </div>
        </Card>
    );
};
