import React, { useState } from 'react';
import { Card, Badge, Button, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { CheckSquare, Clock, Plus } from 'lucide-react';
import './MenteeTasks.css';

import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Loader } from 'lucide-react';

export const MenteeTasksPage: React.FC = () => {
    const toast = useToast();
    const [filter, setFilter] = useState<'ALL' | 'TODO' | 'DONE'>('ALL');
    const [showAddModal, setShowAddModal] = useState(false);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'MEDIUM'
    });

    React.useEffect(() => {
        // Fetch tasks for current user. 
        // For MVP without strict auth, we fetch all tasks or try to match 'menteeId' if we had a context.
        // Let's assume we fetch ALL tasks for now (admin view) OR try to find tasks linked to "m1" if using fallback.
        // Implemented: Fetch ALL tasks.
        const q = query(collection(db, 'tasks'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                dueDate: doc.data().dueDate?.toDate()
            }));
            setTasks(fetched);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredTasks = tasks.filter(task => {
        if (filter === 'ALL') return true;
        return task.status === filter;
    });

    const handleCreateTask = async () => {
        if (!formData.title) {
            toast.error("Título obrigatório");
            return;
        }

        try {
            await addDoc(collection(db, 'tasks'), {
                ...formData,
                dueDate: new Date(formData.dueDate),
                status: 'TODO',
                menteeId: 'm1', // Hardcoded fallback for now if no auth context
                createdAt: new Date()
            });
            toast.success('Tarefa criada com sucesso!');
            setShowAddModal(false);
            setFormData({ title: '', description: '', dueDate: new Date().toISOString().split('T')[0], priority: 'MEDIUM' });
        } catch (error) {
            console.error("Error creating task:", error);
            toast.error("Erro ao criar tarefa");
        }
    };

    const handleToggleStatus = async (taskId: string, currentStatus: string) => {
        try {
            await updateDoc(doc(db, 'tasks', taskId), {
                status: currentStatus === 'DONE' ? 'TODO' : 'DONE'
            });
            toast.success("Status atualizado!");
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error("Erro ao atualizar tarefa");
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: 'short'
        }).format(date);
    };

    const isOverdue = (date: Date) => {
        return date < new Date() && date.toDateString() !== new Date().toDateString();
    };

    return (
        <div className="mentee-tasks">
            <div className="tasks-header">
                <div>
                    <h1>Minhas Tarefas</h1>
                    <p>Gerencie suas entregas e pendências</p>
                </div>
                <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowAddModal(true)}>
                    Nova Tarefa
                </Button>
            </div>

            {/* Filters */}
            <div className="tasks-filters">
                <button
                    className={`filter-tab ${filter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setFilter('ALL')}
                >
                    Todas
                </button>
                <button
                    className={`filter-tab ${filter === 'TODO' ? 'active' : ''}`}
                    onClick={() => setFilter('TODO')}
                >
                    A Fazer
                </button>
                <button
                    className={`filter-tab ${filter === 'DONE' ? 'active' : ''}`}
                    onClick={() => setFilter('DONE')}
                >
                    Concluídas
                </button>
            </div>

            {/* Tasks List */}
            <div className="tasks-list-full">
                {filteredTasks.map(task => {
                    const overdue = task.status === 'TODO' && isOverdue(task.dueDate);

                    return (
                        <Card key={task.id} className={`task-card-full ${task.status === 'DONE' ? 'done' : ''}`} padding="md">
                            <div className="task-checkbox-area">
                                <input
                                    type="checkbox"
                                    checked={task.status === 'DONE'}
                                    onChange={() => handleToggleStatus(task.id, task.status)}
                                />
                            </div>
                            <div className="task-info-full">
                                <div className="task-header-row">
                                    <h3 className={task.status === 'DONE' ? 'text-strike' : ''}>{task.title}</h3>
                                    <div className="task-badges">
                                        {overdue && (
                                            <Badge variant="error" size="sm">Atrasada</Badge>
                                        )}
                                        <Badge variant={
                                            task.priority === 'HIGH' ? 'warning' :
                                                task.priority === 'MEDIUM' ? 'info' : 'default'
                                        } size="sm">
                                            {task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
                                        </Badge>
                                    </div>
                                </div>
                                <p className="task-desc">{task.description}</p>
                                <div className="task-meta">
                                    <span className={`task-date ${overdue ? 'text-error' : ''}`}>
                                        <Clock size={14} />
                                        {formatDate(task.dueDate)}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {filteredTasks.length === 0 && (
                    <div className="empty-tasks">
                        <CheckSquare size={48} />
                        <p>Nenhuma tarefa encontrada neste filtro.</p>
                    </div>
                )}
            </div>

            {/* Add Task Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Nova Tarefa"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleCreateTask}>Criar Tarefa</Button>
                    </>
                }
            >
                <div className="task-form">
                    <div className="form-field">
                        <label>Título *</label>
                        <input
                            type="text"
                            placeholder="O que precisa ser feito?"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div className="form-field">
                        <label>Descrição</label>
                        <textarea
                            rows={3}
                            placeholder="Detalhes da tarefa..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-field">
                            <label>Prazo</label>
                            <input
                                type="date"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                        <div className="form-field">
                            <label>Prioridade</label>
                            <select
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="LOW">Baixa</option>
                                <option value="MEDIUM">Média</option>
                                <option value="HIGH">Alta</option>
                            </select>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default MenteeTasksPage;
