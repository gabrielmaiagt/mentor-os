import React, { useState, useEffect } from 'react';
import {
    Plus,
    Edit,
    Trash2,
    GripVertical,
    Video,
    LayoutList,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { Card, Button, Input, Modal, Badge, Skeleton } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { AcademyModule, AcademyLesson } from '../../types';
import './ManageAcademy.css';

export const ManageAcademyPage: React.FC = () => {
    const toast = useToast();
    const [modules, setModules] = useState<AcademyModule[]>([]);
    const [lessons, setLessons] = useState<AcademyLesson[]>([]);
    const [loading, setLoading] = useState(true);

    // Module Modal
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [editingModule, setEditingModule] = useState<AcademyModule | null>(null);
    const [moduleForm, setModuleForm] = useState({ title: '', description: '', published: true });

    // Lesson Modal
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [editingLesson, setEditingLesson] = useState<AcademyLesson | null>(null);
    const [lessonForm, setLessonForm] = useState({
        title: '',
        description: '',
        videoUrl: '',
        durationMinutes: 0,
        moduleId: '',
        published: true
    });

    const [expandedModules, setExpandedModules] = useState<string[]>([]);

    useEffect(() => {
        const unsubModules = onSnapshot(query(collection(db, 'academy_modules'), orderBy('order', 'asc')), (snap) => {
            setModules(snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademyModule)));
        });

        const unsubLessons = onSnapshot(query(collection(db, 'academy_lessons'), orderBy('order', 'asc')), (snap) => {
            setLessons(snap.docs.map(d => ({ id: d.id, ...d.data() } as AcademyLesson)));
            setLoading(false);
        });

        return () => { unsubModules(); unsubLessons(); };
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedModules(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    // Module Actions
    const handleSaveModule = async () => {
        if (!moduleForm.title) return toast.error('Título é obrigatório');
        try {
            if (editingModule) {
                await updateDoc(doc(db, 'academy_modules', editingModule.id), {
                    ...moduleForm,
                    updatedAt: new Date()
                });
                toast.success('Módulo atualizado');
            } else {
                const order = modules.length;
                await addDoc(collection(db, 'academy_modules'), {
                    ...moduleForm,
                    order,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                toast.success('Módulo criado');
            }
            setShowModuleModal(false);
            setEditingModule(null);
            setModuleForm({ title: '', description: '', published: true });
        } catch (e) {
            toast.error('Erro ao salvar módulo');
        }
    };

    const handleDeleteModule = async (id: string) => {
        if (!confirm('Excluir módulo e todas as suas aulas?')) return;
        try {
            // Delete lessons first
            const moduleLessons = lessons.filter(l => l.moduleId === id);
            for (const l of moduleLessons) {
                await deleteDoc(doc(db, 'academy_lessons', l.id));
            }
            await deleteDoc(doc(db, 'academy_modules', id));
            toast.success('Módulo excluído');
        } catch (e) {
            toast.error('Erro ao excluir');
        }
    };

    // Lesson Actions
    const handleSaveLesson = async () => {
        if (!lessonForm.title || !lessonForm.videoUrl || !lessonForm.moduleId)
            return toast.error('Preencha os campos obrigatórios');

        try {
            if (editingLesson) {
                await updateDoc(doc(db, 'academy_lessons', editingLesson.id), {
                    ...lessonForm,
                    updatedAt: new Date()
                });
                toast.success('Aula atualizada');
            } else {
                const moduleLessons = lessons.filter(l => l.moduleId === lessonForm.moduleId);
                const order = moduleLessons.length;
                await addDoc(collection(db, 'academy_lessons'), {
                    ...lessonForm,
                    order,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                toast.success('Aula criada');
                // Auto expand the module
                if (!expandedModules.includes(lessonForm.moduleId)) {
                    toggleExpand(lessonForm.moduleId);
                }
            }
            setShowLessonModal(false);
            setEditingLesson(null);
            setLessonForm({ title: '', description: '', videoUrl: '', durationMinutes: 0, moduleId: '', published: true });
        } catch (e) {
            toast.error('Erro ao salvar aula');
        }
    };

    const handleDeleteLesson = async (id: string) => {
        if (!confirm('Excluir aula?')) return;
        try {
            await deleteDoc(doc(db, 'academy_lessons', id));
            toast.success('Aula excluída');
        } catch (e) {
            toast.error('Erro ao excluir');
        }
    };

    if (loading) return <div className="p-6"><Skeleton height={400} /></div>;

    return (
        <div className="manage-academy p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Gerenciar Academy</h1>
                    <p className="text-secondary">Crie módulos e adicione aulas para seus mentorados.</p>
                </div>
                <Button variant="primary" icon={<Plus size={16} />} onClick={() => {
                    setEditingModule(null);
                    setModuleForm({ title: '', description: '', published: true });
                    setShowModuleModal(true);
                }}>
                    Novo Módulo
                </Button>
            </div>

            <div className="space-y-4">
                {modules.map(module => (
                    <Card key={module.id} className="module-card" padding="none">
                        <div className="module-header p-4 flex items-center justify-between border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => toggleExpand(module.id)}>
                                <GripVertical size={20} className="text-muted cursor-grab" />
                                <button className="p-1 hover:bg-white/10 rounded">
                                    {expandedModules.includes(module.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                <div>
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {module.title}
                                        {!module.published && <Badge variant="warning" size="sm">Rascunho</Badge>}
                                    </h3>
                                    <p className="text-sm text-secondary">{module.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" icon={<Plus size={16} />} onClick={() => {
                                    setEditingLesson(null);
                                    setLessonForm({
                                        title: '', description: '', videoUrl: '',
                                        durationMinutes: 0, moduleId: module.id, published: true
                                    });
                                    setShowLessonModal(true);
                                }}>Add Aula</Button>
                                <Button size="sm" variant="ghost" icon={<Edit size={16} />} onClick={() => {
                                    setEditingModule(module);
                                    setModuleForm({ title: module.title, description: module.description || '', published: module.published });
                                    setShowModuleModal(true);
                                }} />
                                <Button size="sm" variant="ghost" className="text-error" icon={<Trash2 size={16} />} onClick={() => handleDeleteModule(module.id)} />
                            </div>
                        </div>

                        {expandedModules.includes(module.id) && (
                            <div className="lessons-list p-2 bg-black/20">
                                {lessons.filter(l => l.moduleId === module.id).map(lesson => (
                                    <div key={lesson.id} className="lesson-item flex items-center justify-between p-3 hover:bg-white/5 rounded-md ml-8 border-l-2 border-white/5 pl-4">
                                        <div className="flex items-center gap-3">
                                            <Video size={16} className="text-primary" />
                                            <div>
                                                <span className="font-medium">{lesson.title}</span>
                                                <div className="text-xs text-secondary flex gap-2">
                                                    <span>{lesson.durationMinutes} min</span>
                                                    {!lesson.published && <span className="text-warning">Rascunho</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button size="sm" variant="ghost" icon={<Edit size={14} />} onClick={() => {
                                                setEditingLesson(lesson);
                                                setLessonForm({
                                                    title: lesson.title, description: lesson.description || '',
                                                    videoUrl: lesson.videoUrl, durationMinutes: lesson.durationMinutes || 0,
                                                    moduleId: module.id, published: lesson.published
                                                });
                                                setShowLessonModal(true);
                                            }} />
                                            <Button size="sm" variant="ghost" className="text-error" icon={<Trash2 size={14} />} onClick={() => handleDeleteLesson(lesson.id)} />
                                        </div>
                                    </div>
                                ))}
                                {lessons.filter(l => l.moduleId === module.id).length === 0 && (
                                    <div className="text-center p-4 text-sm text-muted italic">
                                        Nenhuma aula neste módulo.
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                ))}

                {modules.length === 0 && (
                    <div className="text-center py-20 text-secondary">
                        <LayoutList size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Nenhum módulo criado. Comece criando o primeiro módulo do seu curso.</p>
                    </div>
                )}
            </div>

            {/* Module Modal */}
            <Modal
                isOpen={showModuleModal}
                onClose={() => setShowModuleModal(false)}
                title={editingModule ? 'Editar Módulo' : 'Novo Módulo'}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowModuleModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSaveModule}>Salvar</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Título</label>
                        <Input value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="Ex: Módulo 1 - Começe Aqui" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Descrição</label>
                        <Input value={moduleForm.description} onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })} placeholder="Descrição breve..." />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={moduleForm.published} onChange={e => setModuleForm({ ...moduleForm, published: e.target.checked })} />
                        <label>Publicado (visível para alunos)</label>
                    </div>
                </div>
            </Modal>

            {/* Lesson Modal */}
            <Modal
                isOpen={showLessonModal}
                onClose={() => setShowLessonModal(false)}
                title={editingLesson ? 'Editar Aula' : 'Nova Aula'}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowLessonModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSaveLesson}>Salvar</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Título da Aula</label>
                        <Input value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="Ex: Aula 1 - Boas vindas" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Link do Vídeo (Embed/Direct)</label>
                        <Input value={lessonForm.videoUrl} onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })} placeholder="https://youtube.com/embed/..." />
                        <p className="text-xs text-muted mt-1">Recomendado: Link embed do YouTube, Vimeo ou Panda.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Duração (minutos)</label>
                        <Input type="number" value={lessonForm.durationMinutes} onChange={e => setLessonForm({ ...lessonForm, durationMinutes: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Descrição</label>
                        <textarea className="w-full bg-elevated border border-white/10 rounded-md p-2 text-sm" rows={3} value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={lessonForm.published} onChange={e => setLessonForm({ ...lessonForm, published: e.target.checked })} />
                        <label>Publicado</label>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ManageAcademyPage;
