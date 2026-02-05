import React, { useMemo } from 'react';
import type { Task } from '../../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

            <div style={{ height: '150px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.chartData}>
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'var(--bg-tertiary)',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {metrics.chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={isSameDay(entry.fullDate, new Date()) ? 'var(--primary)' : 'var(--text-tertiary)'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
