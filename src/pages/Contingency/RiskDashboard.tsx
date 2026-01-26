import React, { useMemo } from 'react';
import type { Asset } from '../../types/assets';
import { Card } from '../../components/ui';
import { ShieldAlert, ShieldCheck, AlertCircle, Activity } from 'lucide-react';

interface RiskDashboardProps {
    assets: Asset[];
}

export const RiskDashboard: React.FC<RiskDashboardProps> = ({ assets }) => {
    // Risk Calculation Algorithm
    const metrics = useMemo(() => {
        const activeProfiles = assets.filter(a => a.type === 'PROFILE' && a.status === 'ACTIVE').length;
        const warmingProfiles = assets.filter(a => a.type === 'PROFILE' && a.status === 'WARMING').length;
        const bms = assets.filter(a => a.type === 'BM' && a.status === 'ACTIVE').length;
        const adAccounts = assets.filter(a => a.type === 'AD_ACCOUNT' && a.status === 'ACTIVE').length;
        const hasBackupPixel = assets.some(a => a.type === 'PIXEL' && a.name.toLowerCase().includes('backup'));

        let score = 100;
        let risks: string[] = [];

        // Critical Risks (The "Fragilidade" check)
        if (activeProfiles < 2) {
            score -= 40;
            risks.push("Você tem menos de 2 Perfis Ativos. Se um cair, sua operação para.");
        }

        if (bms === 0) {
            score -= 30;
            risks.push("Nenhuma BM ativa cadastrada. Alto risco.");
        }

        if (adAccounts < 1) {
            score -= 10;
            risks.push("Nenhuma Conta de Anúncios ativa.");
        }

        if (!hasBackupPixel) {
            score -= 10;
            risks.push("Sem Pixel de Backup identificado.");
        }

        // Cap score
        score = Math.max(0, score);

        let status: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
        if (score < 50) status = 'CRITICAL';
        else if (score < 80) status = 'WARNING';

        return { score, risks, status, activeProfiles, warmingProfiles, bms };
    }, [assets]);

    return (
        <div className="risk-dashboard grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Main Score Card */}
            <Card className={`col-span-1 p-6 flex flex-col items-center justify-center text-center border-l-4 ${metrics.status === 'SAFE' ? 'border-success bg-success/5' :
                metrics.status === 'WARNING' ? 'border-warning bg-warning/5' :
                    'border-error bg-error/5'
                }`}>
                <div className="mb-4">
                    {metrics.status === 'SAFE' && <ShieldCheck size={48} className="text-success" />}
                    {metrics.status === 'WARNING' && <Activity size={48} className="text-warning" />}
                    {metrics.status === 'CRITICAL' && <ShieldAlert size={48} className="text-error" />}
                </div>
                <h3 className="text-3xl font-bold mb-1">{metrics.score}/100</h3>
                <p className="text-sm font-bold uppercase tracking-widest mb-4">Saúde da Blindagem</p>
                <div className={`px-4 py-1 rounded-full text-xs font-bold ${metrics.status === 'SAFE' ? 'bg-success/20 text-success' :
                    metrics.status === 'WARNING' ? 'bg-warning/20 text-warning' :
                        'bg-error/20 text-error'
                    }`}>
                    {metrics.status === 'SAFE' ? 'OPERAÇÃO SEGURA' : metrics.status === 'WARNING' ? 'ATENÇÃO NECESSÁRIA' : 'RISCO CRÍTICO'}
                </div>
            </Card>

            {/* Quick Stats */}
            <Card className="col-span-1 p-6 flex flex-col justify-center space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-secondary">Perfis Ativos</span>
                    <span className="text-xl font-bold">{metrics.activeProfiles}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-secondary">Em Aquecimento</span>
                    <span className="text-xl font-bold text-warning">{metrics.warmingProfiles}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-secondary">BMs Matriz</span>
                    <span className="text-xl font-bold">{metrics.bms}</span>
                </div>
            </Card>

            {/* Action Items */}
            <Card className="col-span-1 p-6">
                <h4 className="flex items-center gap-2 font-bold mb-4 text-secondary uppercase text-xs tracking-wider">
                    <AlertCircle size={14} /> Pontos de Atenção
                </h4>
                {metrics.risks.length > 0 ? (
                    <ul className="space-y-3">
                        {metrics.risks.map((risk, i) => (
                            <li key={i} className="text-sm text-secondary flex gap-2 items-start">
                                <span className="text-error mt-1">•</span>
                                {risk}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-success">
                        <ShieldCheck size={32} className="mb-2 opacity-50" />
                        <p className="text-sm">Tudo certo! Sua contingência está sólida.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};
