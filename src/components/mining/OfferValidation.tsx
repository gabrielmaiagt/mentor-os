import React, { useState, useEffect } from 'react';
import { Card, Button, Input } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Save } from 'lucide-react';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Offer } from '../../types';

interface DailyStat {
    date: string; // YYYY-MM-DD
    spend: number;
    revenue: number;
    profit: number;
    roi: number;
}

interface OfferValidationProps {
    offer: Offer;
    onUpdate?: () => void;
}

export const OfferValidation: React.FC<OfferValidationProps> = ({ offer, onUpdate }) => {
    const toast = useToast();
    const [spend, setSpend] = useState<string>('');
    const [revenue, setRevenue] = useState<string>('');
    const [stats, setStats] = useState<DailyStat[]>([]);
    const [loading, setLoading] = useState(false);

    // Calculate live ROI based on input
    const numSpend = parseFloat(spend) || 0;
    const numRev = parseFloat(revenue) || 0;
    const profit = numRev - numSpend;
    const roi = numSpend > 0 ? ((profit / numSpend) * 100) : 0;

    // Calculate Lifetime Stats
    const totalSpend = stats.reduce((acc, curr) => acc + curr.spend, 0);
    const totalRevenue = stats.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalProfit = totalRevenue - totalSpend;
    const totalROI = totalSpend > 0 ? ((totalProfit / totalSpend) * 100) : 0;

    useEffect(() => {
        // Load stats from offer if available
        // Assuming offer.dailyStats exists (we need to add it to type)
        if (offer.dailyStats) {
            // Sort by date desc
            const sorted = [...offer.dailyStats].sort((a, b) => b.date.localeCompare(a.date));
            setStats(sorted);
        }
    }, [offer]);

    const handleSave = async () => {
        if (!spend && !revenue) return;
        setLoading(true);

        const today = new Date().toISOString().split('T')[0];

        const newStat: DailyStat = {
            date: today,
            spend: numSpend,
            revenue: numRev,
            profit,
            roi
        };

        try {
            const offerRef = doc(db, 'offers', offer.id);

            // We need to handle "update if today exists" or "push if new"
            // For simplicity in MVP, we might just arrayUnion, but that duplicates if multiple entries per day.
            // Better: Read, filter out today, push new today, save.

            // Since we receive 'offer' prop, we might risk stale data if we don't re-fetch. 
            // Let's optimistic update.

            let updatedStats = offer.dailyStats ? [...offer.dailyStats] : [];
            // Remove existing entry for today
            updatedStats = updatedStats.filter(s => s.date !== today);
            updatedStats.push(newStat);

            await updateDoc(offerRef, {
                dailyStats: updatedStats,
                lastValidationAt: Timestamp.now()
            });

            toast.success('Dados validados com sucesso!');
            setSpend('');
            setRevenue('');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar validação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="offer-validation-card" padding="md">
            <h3 className="section-title flex items-center gap-2 mb-4">
                <DollarSign size={20} className="text-warning" />
                Validar ROI Diário
            </h3>

            {/* Lifetime Stats */}
            {stats.length > 0 && (
                <div className="grid grid-cols-2 gap-4 mb-6 bg-white/5 p-4 rounded-lg border border-white/10">
                    <div>
                        <span className="text-xs text-secondary uppercase tracking-wider block mb-1">Lucro Total</span>
                        <span className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-secondary uppercase tracking-wider block mb-1">ROI Total</span>
                        <span className={`text-xl font-bold ${totalROI >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {totalROI.toFixed(1)}%
                        </span>
                    </div>
                    <div className="col-span-2 flex justify-between text-xs text-gray-500 border-t border-white/10 pt-2 mt-1">
                        <span>Ads: {totalSpend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        <span>Vendas: {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                </div>
            )}

            <div className="validation-grid grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-sm text-gray-400 mb-1 block">Investimento (Hoje)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                        <Input
                            type="number"
                            placeholder="0,00"
                            className="pl-8"
                            value={spend}
                            onChange={(e) => setSpend(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="text-sm text-gray-400 mb-1 block">Retorno (Hoje)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">R$</span>
                        <Input
                            type="number"
                            placeholder="0,00"
                            className="pl-8"
                            value={revenue}
                            onChange={(e) => setRevenue(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Live Calculation */}
            {(numSpend > 0 || numRev > 0) && (
                <div className={`validation-result p-3 rounded-lg mb-4 flex justify-between items-center ${profit >= 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    <div>
                        <span className="block text-xs text-gray-400">Lucro Estimado (Hoje)</span>
                        <span className={`font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {profit >= 0 ? '+' : ''}R$ {profit.toFixed(2)}
                        </span>
                    </div>
                    <div className="text-right">
                        <span className="block text-xs text-gray-400">ROI (Hoje)</span>
                        <span className={`font-bold ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {roi.toFixed(1)}%
                        </span>
                    </div>
                </div>
            )}

            <Button
                variant="primary"
                className="w-full mb-6"
                onClick={handleSave}
                disabled={loading || (numSpend === 0 && numRev === 0)}
                icon={<Save size={16} />}
            >
                Salvar Dia
            </Button>

            {/* History Table */}
            {stats.length > 0 && (
                <div className="validation-history">
                    <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                        <Calendar size={14} /> Histórico Recente
                    </h4>
                    <div className="history-table text-sm">
                        <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 mb-1 pb-1 border-b border-gray-800">
                            <div>Data</div>
                            <div className="text-right">Ads</div>
                            <div className="text-right">Vendas</div>
                            <div className="text-right">ROI</div>
                        </div>
                        {stats.slice(0, 5).map(stat => (
                            <div key={stat.date} className="grid grid-cols-4 gap-2 py-2 border-b border-gray-800/50 last:border-0 hover:bg-white/5 transition-colors rounded px-1">
                                <div className="text-gray-300">
                                    {new Date(stat.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                </div>
                                <div className="text-right text-gray-400">
                                    {stat.spend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </div>
                                <div className="text-right text-gray-300">
                                    {stat.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </div>
                                <div className={`text-right font-medium ${stat.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {stat.roi.toFixed(0)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
};
