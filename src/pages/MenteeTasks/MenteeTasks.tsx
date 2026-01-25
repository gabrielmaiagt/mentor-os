import React, { useState } from 'react';
import { Card, Badge, Button, Modal } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { CheckSquare, Clock, Plus } from 'lucide-react';
import './MenteeTasks.css';

// Mock Tasks Data
const mockTasks = [
    {
        id: 't1',
        title: 'Assistir módulo de Mineração',
        description: 'Ver todas as aulas do módulo 3 e anotar dúvidas.',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Amanhã
        priority: 'HIGH',
        status: 'DONE',
    },
    {
        id: 't2',
        title: 'Selecionar 10 ofertas candidatas',
        description: 'Usar a biblioteca de anúncios do Facebook.',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        priority: 'HIGH',
        status: 'TODO',
    },
    {
        id: 't3',
        title: 'Configurar Business Manager',
        description: 'Seguir o checklist de contingência.',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Atrasada
        priority: 'MEDIUM',
        status: 'TODO', // Visualmente atrasada
    },
    {
        id: 't4',
        title: 'Definir orçamento de teste',
        description: 'Calcular com base no CPA ideal.',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        priority: 'LOW',
        status: 'TODO',
    }
];

export const MenteeTasksPage: React.FC = () => {
    const toast = useToast();
    const [filter, setFilter] = useState<'ALL' | 'TODO' | 'DONE'>('ALL');
    const [showAddModal, setShowAddModal] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'MEDIUM'
    });

    const filteredTasks = mockTasks.filter(task => {
        if (filter === 'ALL') return true;
        return task.status === filter;
    });

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
                                    readOnly
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
                        <Button variant="primary" onClick={() => {
                            toast.success('Tarefa criada com sucesso!');
                            setShowAddModal(false);
                            // Aqui adicionaria ao state em uma app real
                        }}>Criar Tarefa</Button>
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
