import React, { useState, useEffect } from 'react';
import {
    PlayCircle,
    CheckCircle,
    Lock,
    ChevronDown,
    ChevronUp,
    Menu,
    Clock
} from 'lucide-react';
import { Button, Skeleton } from '../../components/ui';
import { useToast } from '../../components/ui/Toast';
import { useLoading } from '../../hooks/useLoading';
import { collection, query, orderBy, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import type { AcademyModule, AcademyLesson } from '../../types';
import './Academy.css';

export const AcademyPage: React.FC = () => {
    const toast = useToast();
    const [modules, setModules] = useState<AcademyModule[]>([]);
    const [lessons, setLessons] = useState<AcademyLesson[]>([]);
    const { isLoading, stopLoading } = useLoading('academy-content');

    // Player State
    const [activeLesson, setActiveLesson] = useState<AcademyLesson | null>(null);
    const [expandedModules, setExpandedModules] = useState<string[]>([]);
    const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);

    useEffect(() => {
        const fetchContent = async () => {
            // Fetch modules
            const modSnap = await getDocs(query(collection(db, 'academy_modules'), orderBy('order', 'asc')));
            const mods = modSnap.docs.map(d => ({ id: d.id, ...d.data() } as AcademyModule)).filter(m => m.published);
            setModules(mods);

            // Fetch lessons
            const lesSnap = await getDocs(query(collection(db, 'academy_lessons'), orderBy('order', 'asc')));
            const allLessons = lesSnap.docs.map(d => ({ id: d.id, ...d.data() } as AcademyLesson)).filter(l => l.published);
            setLessons(allLessons);

            // Fetch Progress
            if (auth.currentUser) {
                // Here we'd ideally fetch a 'progress' subcollection or document
                // For MVP, checking local storage or a simple document
                const progressRef = doc(db, 'mentee_progress', auth.currentUser.uid);
                const progressSnap = await getDoc(progressRef);
                if (progressSnap.exists()) {
                    setCompletedLessonIds(progressSnap.data().completedLessonIds || []);
                    // Restore last watched?
                }
            }

            // Set Initial Active Lesson
            if (allLessons.length > 0) {
                setActiveLesson(allLessons[0]);
                if (mods.length > 0) setExpandedModules([mods[0].id]);
            }

            stopLoading();
        };

        fetchContent();
    }, []);

    const toggleExpand = (modId: string) => {
        setExpandedModules(prev =>
            prev.includes(modId) ? prev.filter(id => id !== modId) : [...prev, modId]
        );
    };

    const handleLessonSelect = (lesson: AcademyLesson) => {
        setActiveLesson(lesson);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleMarkCompleted = async () => {
        if (!activeLesson || !auth.currentUser) return;

        const isCompleted = completedLessonIds.includes(activeLesson.id);
        const newCompleted = isCompleted
            ? completedLessonIds.filter(id => id !== activeLesson.id)
            : [...completedLessonIds, activeLesson.id];

        setCompletedLessonIds(newCompleted);

        try {
            await setDoc(doc(db, 'mentee_progress', auth.currentUser.uid), {
                completedLessonIds: newCompleted,
                lastWatchedLessonId: activeLesson.id,
                updatedAt: new Date()
            }, { merge: true });

            if (!isCompleted) {
                toast.success('Aula concluída! +10 XP');
                // Auto-advance logic could go here
            }
        } catch (e) {
            console.error("Error saving progress", e);
        }
    };

    if (isLoading) return <div className="p-6"><Skeleton height="80vh" /></div>;

    if (modules.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center p-6 text-center">
                <div>
                    <Lock size={48} className="mx-auto mb-4 text-secondary" />
                    <h2 className="text-xl font-bold">Conteúdo em breve</h2>
                    <p className="text-secondary">Seu mentor ainda não publicou aulas.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="academy-layout">
            {/* Sidebar */}
            <div className="academy-sidebar">
                <div className="academy-sidebar-header">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Menu size={20} />
                        Conteúdo do Curso
                    </h2>
                    <div className="text-xs text-secondary mt-1">
                        {completedLessonIds.length} / {lessons.length} aulas concluídas
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 h-1 mt-2 rounded-full overflow-hidden">
                        <div
                            className="bg-primary h-full transition-all duration-500"
                            style={{ width: `${(completedLessonIds.length / Math.max(lessons.length, 1)) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="academy-modules">
                    {modules.map(mod => {
                        const modLessons = lessons.filter(l => l.moduleId === mod.id);
                        if (modLessons.length === 0) return null;

                        return (
                            <div key={mod.id} className="academy-module-item">
                                <button
                                    className="academy-module-header w-full text-left flex items-center justify-between"
                                    onClick={() => toggleExpand(mod.id)}
                                >
                                    <span className="font-medium text-sm">{mod.title}</span>
                                    {expandedModules.includes(mod.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {expandedModules.includes(mod.id) && (
                                    <div className="academy-lesson-list">
                                        {modLessons.map(lesson => {
                                            const isActive = activeLesson?.id === lesson.id;
                                            const isCompleted = completedLessonIds.includes(lesson.id);

                                            return (
                                                <div
                                                    key={lesson.id}
                                                    className={`academy-lesson-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                                    onClick={() => handleLessonSelect(lesson)}
                                                >
                                                    {isCompleted ? (
                                                        <CheckCircle size={16} className="text-success shrink-0" />
                                                    ) : (
                                                        <PlayCircle size={16} className={`shrink-0 ${isActive ? 'text-primary' : 'text-secondary'}`} />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium truncate lesson-title">{lesson.title}</div>
                                                        <div className="text-xs text-secondary flex items-center gap-1">
                                                            <Clock size={10} /> {lesson.durationMinutes} min
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="academy-content">
                {activeLesson ? (
                    <div className="max-w-4xl mx-auto">
                        <div className="video-player-wrapper">
                            {activeLesson.videoUrl.includes('youtube') || activeLesson.videoUrl.includes('youtu.be') ? (
                                <iframe
                                    className="video-iframe"
                                    src={activeLesson.videoUrl.replace('watch?v=', 'embed/')}
                                    title={activeLesson.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : activeLesson.videoUrl.includes('vimeo') ? (
                                <iframe
                                    className="video-iframe"
                                    src={activeLesson.videoUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                                    title={activeLesson.title}
                                    allowFullScreen
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full bg-black text-white">
                                    <p>Player não suportado para esta URL. <a href={activeLesson.videoUrl} target="_blank" rel="noreferrer" className="text-primary underline">Abrir link externo</a></p>
                                </div>
                            )}
                        </div>

                        <div className="lesson-meta">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold mb-2">{activeLesson.title}</h1>
                                    <p className="text-secondary">{activeLesson.description}</p>
                                </div>
                                <Button
                                    variant={completedLessonIds.includes(activeLesson.id) ? 'success' : 'primary'}
                                    icon={completedLessonIds.includes(activeLesson.id) ? <CheckCircle size={18} /> : undefined}
                                    onClick={handleMarkCompleted}
                                >
                                    {completedLessonIds.includes(activeLesson.id) ? 'Concluída' : 'Marcar como Concluída'}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-center">
                        <p className="text-secondary">Selecione uma aula para assistir</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AcademyPage;
