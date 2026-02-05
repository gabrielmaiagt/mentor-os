import React, { useMemo } from 'react';
import type { Task } from '../../types';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { isSameDay, subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskAnalyticsProps {
    tasks: Task[];
}

export const TaskAnalytics: React.FC<TaskAnalyticsProps> = ({ tasks }) => {
    // Calculate metrics
    const metrics = useMemo(() => {
        const now = new Date();
        const doneTasks = tasks.filter(t => t.status === 'DONE' && t.completedAt);

        // Completed Today
        const completedToday = doneTasks.filter(t =>
            t.completedAt && isSameDay(t.completedAt, now)
        ).length;

        // Daily Average (Last 7 days, excluding today to avoid skewing)
        // Or simplify: Total completed / Days since first completed task?
        // Let's do Last 7 Days Average
        const last7Days = Array.from({ length: 7 }, (_, i) => subDays(now, i));

        const chartData = last7Days.map(date => {
            const count = doneTasks.filter(t =>
                t.completedAt && isSameDay(t.completedAt, date)
            ).length;
            return {
                date: format(date, 'dd/MM', { locale: ptBR }),
                fullDate: date,
                count
            };
        }).reverse(); // Show oldest to newest

        const totalLast7 = chartData.reduce((acc, curr) => acc + curr.count, 0);
        const avgDaily = (totalLast7 / 7).toFixed(1);

        return { completedToday, avgDaily, chartData };
    }, [tasks]);

    return (
        <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid var(--border-color)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📊 Produtividade
                </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Hoje</span>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>
                        {metrics.completedToday}
                    </div>
                </div>
                <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Média diária (7d)</span>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                        {metrics.avgDaily}
                    </div>
                </div>
            </div>

            <div style={{ height: '200px', width: '100%', marginTop: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.chartData}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                fontSize: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                            cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '5 5' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="var(--primary)"
                            fillOpacity={1}
                            fill="url(#colorCount)"
                            strokeWidth={3}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
