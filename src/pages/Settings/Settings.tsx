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
                                    enabled={features[item.key as keyof typeof features]}
                                    onChange={(val) => toggleFeature(item.key as keyof typeof features, val)}
                                />
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};
