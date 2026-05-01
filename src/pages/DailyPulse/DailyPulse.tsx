import React, { useState, useEffect, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
    Zap, Palette, Play, Video, Youtube, BookOpen, Tag, Layers, Target, BarChart3, Star
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useDailyPulse, useUpdateDailyPulse, useMonthlyPulse } from '../../hooks/queries/useDailyPulse';
import type { PulseActionStatus } from '../../types';

const CATEGORIES = [
    { key: 'traffic', label: 'Tráfego', icon: <Zap size={32} /> },
    { key: 'creative', label: 'Criativo', icon: <Palette size={32} /> },
    { key: 'stories', label: 'Stories', icon: <Play size={32} /> },
    { key: 'reels', label: 'Reels/TikTok', icon: <Video size={32} /> },
    { key: 'youtube', label: 'YouTube', icon: <Youtube size={32} /> },
    { key: 'lesson', label: 'Aula', icon: <BookOpen size={32} /> },
    { key: 'offer', label: 'Oferta', icon: <Tag size={32} /> },
    { key: 'saas', label: 'SaaS', icon: <Layers size={32} /> },
    { key: 'pitch', label: 'Pitch', icon: <Target size={32} /> },
    { key: 'metrics', label: 'Métricas', icon: <BarChart3 size={32} /> },
] as const;

export const DailyPulsePage: React.FC = () => {
    const { user } = useAuth();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const [selectedDate, setSelectedDate] = useState(todayStr);
    
    const { data: dailyPulse } = useDailyPulse(user?.id, selectedDate);
    const { mutate: updatePulse } = useUpdateDailyPulse();
    
    const [localNote, setLocalNote] = useState('');
    useEffect(() => {
        if (dailyPulse?.note !== undefined) setLocalNote(dailyPulse.note);
    }, [dailyPulse?.note]);

    const currentMonthStr = format(new Date(selectedDate + 'T12:00:00'), 'yyyy-MM');
    const { data: monthlyHistory } = useMonthlyPulse(user?.id, currentMonthStr);

    const weekDays = useMemo(() => {
        const base = new Date();
        return Array.from({ length: 6 }, (_, i) => {
            const date = subDays(base, 5 - i);
            return {
                date: format(date, 'yyyy-MM-dd'),
                label: format(date, 'EEE', { locale: ptBR }).substring(0, 3),
                number: format(date, 'd'),
            };
        });
    }, []);

    const toggleAction = (actionKey: string) => {
        if (!user) return;
        const currentStatus = (dailyPulse?.actions as any)?.[actionKey] || 'none';
        let nextStatus: PulseActionStatus = 'none';
        if (currentStatus === 'none') nextStatus = 'done';
        else if (currentStatus === 'done') nextStatus = 'strong';
        else nextStatus = 'none';
        updatePulse({ userId: user.id, date: selectedDate, actions: { [actionKey]: nextStatus } });
    };

    const stats = useMemo(() => {
        if (!monthlyHistory) return { daysMarked: 0, bestStreak: 0, totalActions: 0 };
        const daysWithActions = monthlyHistory.filter(d => Object.values(d.actions).some(v => v !== 'none'));
        let currentStreak = 0; let maxStreak = 0;
        [...monthlyHistory].sort((a, b) => a.date.localeCompare(b.date)).forEach(d => {
            if (Object.values(d.actions).some(v => v !== 'none')) {
                currentStreak++; maxStreak = Math.max(maxStreak, currentStreak);
            } else currentStreak = 0;
        });
        const totalActions = monthlyHistory.reduce((acc, d) => 
            acc + Object.values(d.actions).filter(v => v !== 'none').length, 0);
        return { daysMarked: daysWithActions.length, bestStreak: maxStreak, totalActions };
    }, [monthlyHistory]);

    const completionRate = useMemo(() => {
        if (!dailyPulse) return 0;
        const count = Object.values(dailyPulse.actions).filter(v => v !== 'none').length;
        return Math.round((count / CATEGORIES.length) * 100);
    }, [dailyPulse]);

    return (
        <div className="dp-main-wrapper">
            <style>{`
                .dp-main-wrapper {
                    background-color: #0c0c0e !important;
                    min-height: 100vh;
                    padding: 24px 20px;
                    color: #fff;
                    font-family: 'Inter', sans-serif;
                    position: relative;
                    z-index: 1;
                }
                .dp-bg-accent {
                    position: fixed;
                    width: 600px; height: 600px;
                    border-radius: 50%;
                    filter: blur(120px);
                    z-index: -1;
                    pointer-events: none;
                }
                .dp-accent-1 { top: -20%; left: -10%; background: rgba(124, 58, 237, 0.15); }
                .dp-accent-2 { bottom: -10%; right: -5%; background: rgba(6, 182, 212, 0.1); }
                
                .dp-glass {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(24px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                }
                .dp-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
                .dp-title { font-size: 32px; font-weight: 900; letter-spacing: -0.05em; margin: 0; color: #fff; line-height: 1; }
                
                .dp-days { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 8px; max-width: 100%; scroll-snap-type: x mandatory; }
                .dp-day-card {
                    min-width: 52px; height: 64px;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    scroll-snap-align: start;
                }
                .dp-day-card.active {
                    background: linear-gradient(135deg, #7c3aed, #06b6d4);
                    height: 74px; margin-top: -10px;
                    box-shadow: 0 10px 20px rgba(124, 58, 237, 0.3);
                    border: 1px solid rgba(255,255,255,0.4);
                }
                
                .dp-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
                .dp-bento { padding: 16px; position: relative; overflow: hidden; border-top: 1px solid rgba(255,255,255,0.1); }
                .dp-bento h3 { font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.5); text-transform: uppercase; margin-bottom: 4px; }
                .dp-bento .val { font-size: 28px; font-weight: 900; }
                
                .dp-actions { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
                .dp-skeuo {
                    background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(0,0,0,0.2));
                    box-shadow: 4px 4px 10px rgba(0,0,0,0.4), -1px -1px 4px rgba(255,255,255,0.05);
                    border-radius: 20px; 
                    height: 110px;
                    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
                    cursor: pointer; border: 1px solid rgba(255,255,255,0.08);
                    transition: all 0.2s;
                }
                .dp-skeuo:active { transform: scale(0.95); box-shadow: inset 4px 4px 10px rgba(0,0,0,0.6); }
                .dp-skeuo.done { background: rgba(124, 58, 237, 0.15); border-color: rgba(124, 58, 237, 0.5); }
                .dp-skeuo.strong { background: linear-gradient(135deg, rgba(124, 58, 237, 0.4), rgba(6, 182, 212, 0.4)); border-color: #fff; }
                
                .dp-icon-wrap {
                    width: 44px; height: 44px; border-radius: 50%;
                    background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;
                    box-shadow: inset 2px 2px 5px rgba(0,0,0,0.3);
                    color: #fff;
                }
                .dp-skeuo.done .dp-icon-wrap { background: #7c3aed; box-shadow: 0 0 10px rgba(124, 58, 237, 0.6); }
                .dp-skeuo.strong .dp-icon-wrap { background: #fff; color: #7c3aed; box-shadow: 0 0 15px #fff; }
                
                .dp-label { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #fff; letter-spacing: 0.05em; text-align: center; padding: 0 4px; }
                
                .dp-footer { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; padding-bottom: 80px; }
                .dp-note-area {
                    width: 100%; height: 60px; background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
                    padding: 10px; color: #fff; resize: none; font-size: 13px;
                }
                
                .dp-status-card { display: flex; align-items: center; gap: 16px; padding: 12px; }
                .dp-circle-wrap { width: 60px; height: 60px; position: relative; flex-shrink: 0; }
                .dp-circle-svg { transform: rotate(-90deg); width: 60px; height: 60px; }
                .dp-circle-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 16px; }

                /* Responsividade Mobile */
                @media (max-width: 640px) {
                    .dp-main-wrapper { padding: 16px; }
                    .dp-title { font-size: 24px; }
                    .dp-grid-3 { grid-template-columns: 1fr; gap: 10px; }
                    .dp-actions { grid-template-columns: repeat(2, 1fr); gap: 10px; }
                    .dp-skeuo { height: 100px; border-radius: 16px; }
                    .dp-footer { grid-template-columns: 1fr; gap: 12px; }
                    .dp-header { align-items: flex-start; flex-direction: column; }
                }
            `}</style>

            <div className="dp-bg-accent dp-accent-1" />
            <div className="dp-bg-accent dp-accent-2" />

            <div className="dp-header">
                <div>
                    <h1 className="dp-title">Bom dia, {user?.displayName?.split(' ')[0] || 'Gabriel'}</h1>
                    <p style={{color: '#a78bfa', fontWeight: 800, marginTop: '4px', fontSize: '12px', textTransform: 'uppercase'}}>
                        {format(new Date(selectedDate + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                </div>
                <div className="dp-days">
                    {weekDays.map(day => (
                        <div 
                            key={day.date} 
                            className={`dp-day-card dp-glass ${selectedDate === day.date ? 'active' : ''}`}
                            onClick={() => setSelectedDate(day.date)}
                        >
                            <span style={{fontSize: '9px', opacity: 0.5, fontWeight: 900}}>{day.label}</span>
                            <span style={{fontSize: '18px', fontWeight: 900}}>{day.number}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="dp-grid-3">
                <div className="dp-bento dp-glass" style={{boxShadow: 'inset 0 0 15px rgba(124, 58, 237, 0.1)'}}>
                    <h3>Dias Concluídos</h3>
                    <div className="val">{stats.daysMarked} <small style={{fontSize: '14px', opacity: 0.5}}>/30</small></div>
                </div>
                <div className="dp-bento dp-glass" style={{boxShadow: 'inset 0 0 15px rgba(6, 182, 212, 0.1)'}}>
                    <div style={{display:'flex', justifyContent:'space-between'}}>
                        <h3>Melhor Sequência</h3>
                        <div style={{display:'flex', alignItems:'center', gap:'4px'}}>
                            <div className="animate-pulse" style={{width:'6px', height:'6px', background:'#06b6d4', borderRadius:'50%'}} />
                            <span style={{fontSize:'8px', fontWeight:900, color:'#06b6d4'}}>LIVE</span>
                        </div>
                    </div>
                    <div className="val">{stats.bestStreak} <small style={{fontSize: '14px', opacity: 0.5}}>dias</small></div>
                </div>
                <div className="dp-bento dp-glass" style={{background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(2,6,23,0.9))'}}>
                    <h3>Ações do Mês</h3>
                    <div className="val">{stats.totalActions}</div>
                </div>
            </div>

            <div className="dp-actions">
                {CATEGORIES.map(cat => {
                    const status = (dailyPulse?.actions as any)?.[cat.key] || 'none';
                    return (
                        <div key={cat.key} className={`dp-skeuo ${status}`} onClick={() => toggleAction(cat.key)}>
                            <div className="dp-icon-wrap">
                                {status === 'strong' ? <Star size={28} /> : cat.icon}
                            </div>
                            <span className="dp-label">{cat.label}</span>
                        </div>
                    );
                })}
            </div>

            <div className="dp-footer">
                <div className="dp-glass" style={{padding: '12px'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom: '8px'}}>
                        <span style={{fontSize:'11px', fontWeight:900, textTransform: 'uppercase', opacity: 0.6}}>Notas</span>
                    </div>
                    <div style={{position:'relative'}}>
                        <textarea 
                            className="dp-note-area" 
                            placeholder="O que está pensando?"
                            value={localNote}
                            onChange={(e) => setLocalNote(e.target.value)}
                            onBlur={() => updatePulse({ userId: user?.id!, date: selectedDate, note: localNote })}
                        />
                    </div>
                </div>
                <div className="dp-glass dp-status-card">
                    <div className="dp-circle-wrap">
                        <svg className="dp-circle-svg" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                            <circle 
                                cx="50" cy="50" r="42" fill="none" stroke="#06b6d4" strokeWidth="10"
                                strokeDasharray="264" strokeDashoffset={264 - (completionRate/100)*264}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="dp-circle-text">{completionRate}%</div>
                    </div>
                    <div style={{fontWeight: 900, fontSize: '14px'}}>Status</div>
                </div>
            </div>
        </div>
    );
};

export default DailyPulsePage;
