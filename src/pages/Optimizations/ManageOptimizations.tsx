import React, { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, ChevronDown, ChevronUp,
    Video, Clock, GripVertical, CloudUpload, Link, Check, X
} from 'lucide-react';
import { Card, Button, Input, Modal, Badge, Skeleton } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import {
    collection, query, orderBy, onSnapshot,
    addDoc, updateDoc, doc, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { db, storage, auth } from '../../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import type { OptimizationDay, Optimization } from '../../types';
import './ManageOptimizations.css';

function slugify(text: string): string {
    return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
}

export const ManageOptimizationsPage: React.FC = () => {
    const toast = useToast();
    const [days, setDays] = useState<OptimizationDay[]>([]);
    const [optimizations, setOptimizations] = useState<Optimization[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedDays, setExpandedDays] = useState<string[]>([]);

    // Day modal state
    const [showDayModal, setShowDayModal] = useState(false);
    const [editingDay, setEditingDay] = useState<OptimizationDay | null>(null);
    const [dayForm, setDayForm] = useState({ title: '', slug: '', date: '' });

    // Optimization modal state
    const [showOptModal, setShowOptModal] = useState(false);
    const [editingOpt, setEditingOpt] = useState<Optimization | null>(null);
    const [optForm, setOptForm] = useState({
        title: '', description: '', videoUrl: '',
        time: '', order: 0, optimizationDayId: ''
    });

    // Upload state
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');

    useEffect(() => {
        const unsubDays = onSnapshot(
            query(collection(db, 'optimization_days'), orderBy('createdAt', 'desc')),
            (snap) => {
                setDays(snap.docs.map(d => ({ id: d.id, ...d.data() } as OptimizationDay)));
                setLoading(false);
            }
        );
        const unsubOpts = onSnapshot(
            query(collection(db, 'optimizations'), orderBy('order', 'asc')),
            (snap) => {
                setOptimizations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Optimization)));
            }
        );
        return () => { unsubDays(); unsubOpts(); };
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedDays(prev =>
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
        );
    };

    // ─── Day Actions ────────────────────────────────────────────────────────────
    const openNewDayModal = () => {
        setEditingDay(null);
        setDayForm({ title: '', slug: '', date: '' });
        setShowDayModal(true);
    };

    const openEditDayModal = (day: OptimizationDay) => {
        setEditingDay(day);
        setDayForm({ title: day.title, slug: day.slug, date: day.date || '' });
        setShowDayModal(true);
    };

    const handleSaveDay = async () => {
        if (!dayForm.title.trim()) return toast.error('Título é obrigatório');
        const slug = dayForm.slug.trim() || slugify(dayForm.title);
        try {
            if (editingDay) {
                await updateDoc(doc(db, 'optimization_days', editingDay.id), {
                    title: dayForm.title.trim(),
                    slug,
                    date: dayForm.date || null,
                    updatedAt: serverTimestamp()
                });
                toast.success('Dia atualizado');
            } else {
                await addDoc(collection(db, 'optimization_days'), {
                    title: dayForm.title.trim(),
                    slug,
                    date: dayForm.date || null,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                toast.success('Dia criado');
            }
            setShowDayModal(false);
        } catch {
            toast.error('Erro ao salvar dia');
        }
    };

    const handleDeleteDay = async (day: OptimizationDay) => {
        if (!confirm(`Excluir "${day.title}" e todas as suas otimizações?`)) return;
        try {
            const dayOpts = optimizations.filter(o => o.optimizationDayId === day.id);
            for (const o of dayOpts) await deleteDoc(doc(db, 'optimizations', o.id));
            await deleteDoc(doc(db, 'optimization_days', day.id));
            toast.success('Dia excluído');
        } catch {
            toast.error('Erro ao excluir');
        }
    };

    // ─── Optimization Actions ────────────────────────────────────────────────────
    const openNewOptModal = (dayId: string) => {
        setEditingOpt(null);
        const dayOpts = optimizations.filter(o => o.optimizationDayId === dayId);
        setOptForm({ title: '', description: '', videoUrl: '', time: '', order: dayOpts.length, optimizationDayId: dayId });
        setUploadMode('url');
        setUploadProgress(null);
        setShowOptModal(true);
    };

    const openEditOptModal = (opt: Optimization) => {
        setEditingOpt(opt);
        setOptForm({
            title: opt.title, description: opt.description || '',
            videoUrl: opt.videoUrl, time: opt.time,
            order: opt.order, optimizationDayId: opt.optimizationDayId
        });
        setUploadMode('url');
        setUploadProgress(null);
        setShowOptModal(true);
    };

    const handleSaveOpt = async () => {
        if (!optForm.title.trim() || !optForm.videoUrl.trim())
            return toast.error('Título e vídeo são obrigatórios');
        try {
            if (editingOpt) {
                await updateDoc(doc(db, 'optimizations', editingOpt.id), {
                    ...optForm, title: optForm.title.trim(),
                    updatedAt: serverTimestamp()
                });
                toast.success('Otimização atualizada');
            } else {
                await addDoc(collection(db, 'optimizations'), {
                    ...optForm, title: optForm.title.trim(),
                    createdAt: serverTimestamp(), updatedAt: serverTimestamp()
                });
                toast.success('Otimização criada');
                if (!expandedDays.includes(optForm.optimizationDayId)) toggleExpand(optForm.optimizationDayId);
            }
            setShowOptModal(false);
        } catch {
            toast.error('Erro ao salvar otimização');
        }
    };

    const handleDeleteOpt = async (id: string) => {
        if (!confirm('Excluir otimização?')) return;
        try {
            await deleteDoc(doc(db, 'optimizations', id));
            toast.success('Otimização excluída');
        } catch {
            toast.error('Erro ao excluir');
        }
    };

    // ─── File Upload ─────────────────────────────────────────────────────────────
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const uid = auth.currentUser?.uid;
        if (!uid) return toast.error('Usuário não autenticado');

        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `media-hub/${uid}/${timestamp}-${safeName}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

        setUploadProgress(0);
        uploadTask.on(
            'state_changed',
            (snapshot) => {
                setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
            },
            () => {
                toast.error('Erro no upload do vídeo');
                setUploadProgress(null);
            },
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                setOptForm(prev => ({ ...prev, videoUrl: url }));
                setUploadProgress(null);
                toast.success('Vídeo enviado com sucesso!');
            }
        );
    };

    if (loading) return <div className="p-6"><Skeleton height={400} /></div>;

    return (
        <div className="manage-opt p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-1">Gerenciar Otimizações</h1>
                    <p className="text-secondary">Crie dias e adicione vídeos de otimizações. A página pública pode ser acessada em <code className="opt-code">/otimizacoes</code>.</p>
                </div>
                <Button variant="primary" icon={<Plus size={16} />} onClick={openNewDayModal}>
                    Novo Dia
                </Button>
            </div>

            <div className="space-y-4">
                {days.map(day => {
                    const dayOpts = optimizations.filter(o => o.optimizationDayId === day.id)
                        .sort((a, b) => a.order - b.order);
                    const isExpanded = expandedDays.includes(day.id);
                    return (
                        <Card key={day.id} className="opt-day-card" padding="none">
                            <div className="opt-day-header p-4 flex items-center justify-between">
                                <div
                                    className="flex items-center gap-3 cursor-pointer select-none flex-1"
                                    onClick={() => toggleExpand(day.id)}
                                >
                                    <GripVertical size={20} className="text-muted" />
                                    <button className="p-1 hover:bg-white/10 rounded">
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                    <div>
                                        <h3 className="font-semibold text-lg">{day.title}</h3>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-secondary">/{day.slug}</p>
                                            <Badge variant="info" size="sm">{dayOpts.length} vídeos</Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="ghost" icon={<Plus size={16} />}
                                        onClick={() => openNewOptModal(day.id)}>
                                        Add Vídeo
                                    </Button>
                                    <Button size="sm" variant="ghost" icon={<Edit size={16} />}
                                        onClick={() => openEditDayModal(day)} />
                                    <Button size="sm" variant="ghost" className="text-error"
                                        icon={<Trash2 size={16} />}
                                        onClick={() => handleDeleteDay(day)} />
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="opt-list p-3 bg-black/20">
                                    {dayOpts.map(opt => (
                                        <div key={opt.id} className="opt-item flex items-center justify-between p-3 hover:bg-white/5 rounded-md ml-8 border-l-2 border-white/5 pl-4">
                                            <div className="flex items-center gap-3">
                                                <Video size={16} className="text-primary" />
                                                <div>
                                                    <span className="font-medium">{opt.title}</span>
                                                    <div className="text-xs text-secondary flex gap-2 items-center mt-0.5">
                                                        <Clock size={11} />
                                                        <span>{opt.time || '—'}</span>
                                                        <span>·</span>
                                                        <span>Ordem: {opt.order + 1}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button size="sm" variant="ghost" icon={<Edit size={14} />}
                                                    onClick={() => openEditOptModal(opt)} />
                                                <Button size="sm" variant="ghost" className="text-error"
                                                    icon={<Trash2 size={14} />}
                                                    onClick={() => handleDeleteOpt(opt.id)} />
                                            </div>
                                        </div>
                                    ))}
                                    {dayOpts.length === 0 && (
                                        <div className="text-center p-4 text-sm text-muted italic">
                                            Nenhuma otimização neste dia.
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    );
                })}

                {days.length === 0 && (
                    <div className="text-center py-20 text-secondary">
                        <Video size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Nenhum dia criado. Comece criando o primeiro dia de otimizações.</p>
                    </div>
                )}
            </div>

            {/* Day Modal */}
            <Modal
                isOpen={showDayModal}
                onClose={() => setShowDayModal(false)}
                title={editingDay ? 'Editar Dia' : 'Novo Dia'}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowDayModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSaveDay}>Salvar</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Título do Dia *</label>
                        <Input
                            value={dayForm.title}
                            onChange={e => setDayForm({ ...dayForm, title: e.target.value, slug: slugify(e.target.value) })}
                            placeholder="Ex: Dia 22, Dia 23, 27/06/2026"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Slug (gerado automaticamente)</label>
                        <Input
                            value={dayForm.slug}
                            onChange={e => setDayForm({ ...dayForm, slug: slugify(e.target.value) })}
                            placeholder="Ex: dia-22"
                        />
                        <p className="text-xs text-muted mt-1">URL pública: /otimizacoes/{dayForm.slug || 'slug'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Data (opcional)</label>
                        <Input
                            type="date"
                            value={dayForm.date}
                            onChange={e => setDayForm({ ...dayForm, date: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            {/* Optimization Modal */}
            <Modal
                isOpen={showOptModal}
                onClose={() => setShowOptModal(false)}
                title={editingOpt ? 'Editar Otimização' : 'Nova Otimização'}
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowOptModal(false)}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSaveOpt} disabled={uploadProgress !== null}>
                            {uploadProgress !== null ? `Enviando... ${uploadProgress}%` : 'Salvar'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Título *</label>
                        <Input
                            value={optForm.title}
                            onChange={e => setOptForm({ ...optForm, title: e.target.value })}
                            placeholder="Ex: Otimização de Públicos"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">Horário</label>
                            <Input
                                type="time"
                                value={optForm.time}
                                onChange={e => setOptForm({ ...optForm, time: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Ordem de exibição</label>
                            <Input
                                type="number"
                                min={0}
                                value={optForm.order}
                                onChange={e => setOptForm({ ...optForm, order: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Vídeo *</label>
                        <div className="opt-upload-toggle mb-3">
                            <button
                                type="button"
                                className={`opt-upload-tab ${uploadMode === 'url' ? 'active' : ''}`}
                                onClick={() => setUploadMode('url')}
                            >
                                <Link size={14} /> URL / Link
                            </button>
                            <button
                                type="button"
                                className={`opt-upload-tab ${uploadMode === 'file' ? 'active' : ''}`}
                                onClick={() => setUploadMode('file')}
                            >
                                <CloudUpload size={14} /> Upload de Arquivo
                            </button>
                        </div>

                        {uploadMode === 'url' ? (
                            <Input
                                value={optForm.videoUrl}
                                onChange={e => setOptForm({ ...optForm, videoUrl: e.target.value })}
                                placeholder="https://... (link direto MP4 ou embed)"
                            />
                        ) : (
                            <div className="opt-upload-zone">
                                {uploadProgress !== null ? (
                                    <div className="opt-upload-progress">
                                        <div className="opt-upload-bar" style={{ width: `${uploadProgress}%` }} />
                                        <span>{uploadProgress}%</span>
                                    </div>
                                ) : optForm.videoUrl ? (
                                    <div className="opt-upload-done">
                                        <Check size={18} className="text-success" />
                                        <span className="text-sm text-secondary truncate max-w-xs">{optForm.videoUrl.split('/').pop()}</span>
                                        <button onClick={() => setOptForm(prev => ({ ...prev, videoUrl: '' }))}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="opt-upload-label">
                                        <CloudUpload size={24} />
                                        <span>Clique para selecionar um vídeo</span>
                                        <span className="text-xs text-muted">MP4, MOV, WEBM (até 500 MB)</span>
                                        <input
                                            type="file"
                                            accept="video/*"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                    </label>
                                )}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Descrição (opcional)</label>
                        <textarea
                            className="w-full bg-elevated border border-white/10 rounded-md p-2 text-sm"
                            rows={3}
                            value={optForm.description}
                            onChange={e => setOptForm({ ...optForm, description: e.target.value })}
                            placeholder="Uma breve descrição do que será otimizado..."
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ManageOptimizationsPage;
