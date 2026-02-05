import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { Plus, Trash2, Check, Pencil, Calendar, Target } from 'lucide-react';
import type { Task } from '../../types';
import { useToast } from '../../components/ui/Toast';
import './Tasks.css';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const TasksPage: React.FC = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [targetValue, setTargetValue] = useState('');
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [showDescription, setShowDescription] = useState(false);

    // --- Firebase Subscription ---
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'tasks'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                dueDate: doc.data().dueDate?.toDate(),
                createdAt: doc.data().createdAt?.toDate(),
                completedAt: doc.data().completedAt?.toDate(),
            })) as Task[];
            setTasks(loaded);
        });

        return () => unsubscribe();
    }, [user]);

    const handleAddTask = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim()) {
            toast.error('Digite um título para a missão');
            return;
        }

        if (!user) {
            toast.error('Erro de autenticação');
            return;
        }

        try {
            const taskData = {
                ownerId: user.id || 'unknown',
                ownerRole: 'mentor',
                scope: 'PERSONAL',
                entityType: 'NONE',
                entityId: '',
                title: inputValue.trim(),
                description: description.trim() || null,
                dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
                status: 'TODO',
                priority: 'MEDIUM',
                createdAt: Timestamp.now(),
                targetValue: targetValue ? parseInt(targetValue) : null,
                currentValue: 0,
                quickActions: [],
                notified: false
            };

            await addDoc(collection(db, 'tasks'), taskData);

            setInputValue('');
            setDescription('');
            setDueDate('');
            setTargetValue('');
            setShowDescription(false);
            toast.success('Missão criada!');
        } catch (err) {
            console.error("Firestore Error:", err);
            toast.error('Erro ao criar missão');
        }
    };

    const handleEditTask = async () => {
        if (!editingTask || !inputValue.trim()) return;

        try {
            await updateDoc(doc(db, 'tasks', editingTask.id), {
                title: inputValue.trim(),
                description: description.trim() || null,
                dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
                targetValue: targetValue ? parseInt(targetValue) : null,
            });

            setEditingTask(null);
            setInputValue('');
            setDescription('');
            setDueDate('');
            setTargetValue('');
            toast.success('Missão atualizada!');
        } catch (err) {
            console.error("Error updating task:", err);
            toast.error('Erro ao atualizar missão');
        }
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setInputValue(task.title);
        setDescription(task.description || '');
        setDueDate(task.dueDate ? format(task.dueDate, "yyyy-MM-dd'T'HH:mm") : '');
        setTargetValue(task.targetValue?.toString() || '');
        setShowDescription(!!task.description);
    };

    const cancelEdit = () => {
        setEditingTask(null);
        setInputValue('');
        setDescription('');
        setDueDate('');
        setTargetValue('');
        setShowDescription(false);
    };

    const handleToggle = async (task: Task) => {
        const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';

        try {
            await updateDoc(doc(db, 'tasks', task.id), {
                status: newStatus,
                completedAt: newStatus === 'DONE' ? Timestamp.now() : null,
                currentValue: newStatus === 'DONE' && task.targetValue ? task.targetValue : task.currentValue
            });
        } catch (err) {
            console.error("Error toggling task:", err);
            toast.error('Erro ao atualizar missão');
        }
    };

    const handleIncrement = async (task: Task) => {
        if (!task.targetValue) return;

        const newValue = Math.min((task.currentValue || 0) + 1, task.targetValue);
        const isDone = newValue >= task.targetValue;

        // Optimistic Update
        setTasks(prev => prev.map(t =>
            t.id === task.id
                ? { ...t, currentValue: newValue, status: isDone ? 'DONE' : t.status }
                : t
        ));

        const updates: any = {
            currentValue: newValue,
            status: isDone ? 'DONE' : task.status
        };

        if (isDone) {
            updates.completedAt = Timestamp.now();
        }

        try {
            await updateDoc(doc(db, 'tasks', task.id), updates);
        } catch (err) {
            console.error("Error incrementing:", err);
            toast.error('Erro ao atualizar progresso');
            // Revert on error (optional, but good practice. For now simpler to just fetch again or let snapshot correct it)
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja excluir esta missão?')) return;
        try {
            await deleteDoc(doc(db, 'tasks', id));
            toast.success('Missão removida');
        } catch (err) {
            toast.error('Erro ao remover missão');
        }
    };

    const formatDate = (date?: Date) => {
        if (!date) return null;
        // Check if it has time component (not midnight)
        const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
        const timeStr = hasTime ? ` às ${format(date, 'HH:mm')}` : '';

        if (isToday(date)) return `Hoje${timeStr}`;
        if (isTomorrow(date)) return `Amanhã${timeStr}`;
        return `${format(date, 'dd/MM', { locale: ptBR })}${timeStr}`;
    };

    const filteredTasks = tasks.filter(t =>
        t.ownerId === user?.id
    );

    const sortedTasks = [...filteredTasks].sort((a, b) => {
        if (a.status === 'DONE' && b.status !== 'DONE') return 1;
        if (a.status !== 'DONE' && b.status === 'DONE') return -1;
        if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
    });

    return (
        <div className="tasks-page">
            <div className="tasks-header">
                <div>
                    <h1>Missões</h1>
                    <p className="tasks-subtitle">
                        {filteredTasks.filter(t => t.status !== 'DONE').length} pendentes •{' '}
                        {filteredTasks.filter(t => t.status === 'DONE').length} concluídas
                    </p>
                </div>
            </div>

            {/* Input Form */}
            <div className="smart-input-container">
                <form onSubmit={editingTask ? (e) => { e.preventDefault(); handleEditTask(); } : handleAddTask}>
                    <input
                        className="smart-input"
                        placeholder={editingTask ? "Editar missão..." : "Nova missão..."}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />

                    {showDescription && (
                        <textarea
                            className="task-description-input"
                            placeholder="Descrição (opcional)..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                        />
                    )}

                    <div className="task-meta-inputs">
                        <div className="task-meta-input-group">
                            <Calendar size={16} />
                            <input
                                type="datetime-local"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="task-date-input"
                                style={{ minWidth: '180px' }} // Increased width for datetime
                            />
                        </div>

                        <div className="task-meta-input-group">
                            <Target size={16} />
                            <input
                                type="number"
                                placeholder="Meta (opcional)"
                                value={targetValue}
                                onChange={(e) => setTargetValue(e.target.value)}
                                className="task-target-input"
                            />
                        </div>

                        <button
                            type="button"
                            className="task-toggle-desc-btn"
                            onClick={() => setShowDescription(!showDescription)}
                        >
                            {showDescription ? '−' : '+ Descrição'}
                        </button>
                    </div>

                    <div className="task-form-actions">
                        {editingTask && (
                            <button type="button" className="btn-cancel" onClick={cancelEdit}>
                                Cancelar
                            </button>
                        )}
                        <button type="submit" className="btn-primary">
                            <Plus size={18} />
                            {editingTask ? 'Salvar' : 'Adicionar'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Tasks Grid */}
            <div className="tasks-grid">
                {sortedTasks.map(task => (
                    <div
                        key={task.id}
                        className={`task-card ${task.status === 'DONE' ? 'is-done' : ''} ${task.dueDate && isPast(task.dueDate) && task.status !== 'DONE' ? 'is-late' : ''}`}
                    >
                        <div className="task-left">
                            <button
                                className={`check-btn ${task.status === 'DONE' ? 'checked' : ''}`}
                                onClick={() => handleToggle(task)}
                            >
                                {task.status === 'DONE' && <Check size={18} />}
                            </button>
                        </div>

                        <div className="task-center">
                            <div className="task-title">{task.title}</div>
                            {task.description && (
                                <div className="task-description">{task.description}</div>
                            )}
                            <div className="task-meta">
                                {task.dueDate && (
                                    <span className={`task-date ${task.dueDate && isPast(task.dueDate) && task.status !== 'DONE' ? 'task-date-late' : ''}`}>
                                        📅 {formatDate(task.dueDate)}
                                    </span>
                                )}
                                {task.targetValue && (
                                    <span className="task-progress">
                                        🎯 {task.currentValue || 0}/{task.targetValue}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="task-right">
                            {task.targetValue && task.status !== 'DONE' && (
                                <button
                                    className="tracker-btn"
                                    onClick={() => handleIncrement(task)}
                                    disabled={(task.currentValue || 0) >= task.targetValue}
                                >
                                    +
                                </button>
                            )}
                            <button className="task-edit-btn" onClick={() => openEditModal(task)}>
                                <Pencil size={14} />
                            </button>
                            <button className="task-delete-btn" onClick={() => handleDelete(task.id)}>
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {sortedTasks.length === 0 && (
                <div className="empty-state">
                    <p>Nenhuma missão criada ainda.</p>
                    <p className="text-secondary text-sm">Comece adicionando sua primeira missão acima!</p>
                </div>
            )}
        </div>
    );
};

export default TasksPage;
