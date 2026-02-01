import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import {
    Check,
    Plus,
    Clock,
    Target,
    Trash2,
    Bell,
    BellOff,
    CheckSquare,
    ArrowUp
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { Task } from '../../types'; // Ensure Task is imported from index.ts where we added new fields
import './Tasks.css';
import { format, isToday, parse, isValid, addMinutes, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Smart Parser ---
interface ParsedInput {
    title: string;
    startTime?: string;
    targetValue?: number;
}

const parseInput = (text: string): ParsedInput => {
    let title = text;
    let startTime: string | undefined;
    let targetValue: number | undefined;

    // 1. Detect Time (e.g. "14:00", "09:30", "9h", "15h")
    // Regex for HH:mm
    const timeMatch = text.match(/(\d{1,2}:\d{2})/);
    if (timeMatch) {
        startTime = timeMatch[1];
        title = title.replace(timeMatch[0], '').trim();
    } else {
        // Regex for "9h" or "15h"
        const hourMatch = text.match(/\b(\d{1,2})[hH]\b/);
        if (hourMatch) {
            const h = parseInt(hourMatch[1]);
            if (h >= 0 && h <= 23) {
                startTime = `${h.toString().padStart(2, '0')}:00`;
                title = title.replace(hourMatch[0], '').trim();
            }
        }
    }

    // 2. Detect Target (e.g. "5 calls", "10 videos", "3 sales")
    // Look for number at start of string or number followed by space
    const targetMatch = text.match(/^(\d+)\s/); // "5 videos..."
    if (targetMatch) {
        targetValue = parseInt(targetMatch[1]);
        // We generally keep the number in the title for context "5 videos", 
        // but we add the progressive capability.
        // If we want to clean it: title = title.replace(targetMatch[0], '').trim(); 
        // Let's keep it in title for readability but set the counter.
    } else {
        // Try finding "meta: 5" or "(5)" patterns if preferred, but "5 videos" is natural.
        // Let's stick to simple leading number detection or specific pattern like "/5"
        const slashedMatch = text.match(/\/(\d+)/); // "Read book /50"
        if (slashedMatch) {
            targetValue = parseInt(slashedMatch[1]);
            title = title.replace(slashedMatch[0], '').trim();
        }
    }

    return { title, startTime, targetValue };
};

export const TasksPage: React.FC = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [parsedPreview, setParsedPreview] = useState<ParsedInput | null>(null);
    const [permission, setPermission] = useState(Notification.permission);

    // Auto-update time for highlighting current task
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Every minute
        return () => clearInterval(timer);
    }, []);

    // --- Firebase Subscription ---
    useEffect(() => {
        if (!user) return; // Wait for user

        // Query: Tasks where ownerId == user.uid (assuming user has uid, logic from AuthContext)
        // or just all tasks for now if simpler MVP, filtering in memory for security
        // Ideally: where('ownerId', '==', user.uid)

        // For MVP, assuming we save with ownerId = 'current-user' or actual ID
        const q = query(
            collection(db, 'tasks'),
            // where('ownerId', '==', user.uid), // Uncomment when auth is strict
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loaded = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                dueAt: doc.data().dueAt?.toDate(),
                createdAt: doc.data().createdAt?.toDate(),
                completedAt: doc.data().completedAt?.toDate(),
            })) as Task[];
            setTasks(loaded);
        });

        return () => unsubscribe();
    }, [user]);

    // --- Smart Input Effect ---
    useEffect(() => {
        if (inputValue) {
            setParsedPreview(parseInput(inputValue));
        } else {
            setParsedPreview(null);
        }
    }, [inputValue]);

    // --- Notification Logic ---
    useEffect(() => {
        // Check for upcoming tasks (5 min warning)
        if (permission !== 'granted') return;

        tasks.forEach(task => {
            if (task.status === 'DONE' || !task.startTime || task.notify === false) return;

            // Parse task start time
            // Assuming task.dueAt is the Day, and task.startTime is HH:mm
            const taskDate = task.dueAt;
            if (!isToday(taskDate)) return;

            const [h, m] = task.startTime.split(':').map(Number);
            const taskStart = new Date(taskDate);
            taskStart.setHours(h, m, 0, 0);

            const diff = differenceInMinutes(taskStart, now);
            // Notify if exactly 5 mins away (we run this check every minute via 'now' effect? 
            // Actually 'now' updates rendering, but this effect runs when 'tasks' change or permission.
            // We need a dedicated interval for checking notifications against 'tasks'.
        });
    }, [tasks, permission, now]);

    // Dedicated Notification Interval
    useEffect(() => {
        const interval = setInterval(() => {
            if (Notification.permission !== 'granted') return;
            const currentNow = new Date();

            tasks.forEach(task => {
                if (task.status === 'DONE' || !task.startTime) return;
                const taskDate = task.dueAt;
                if (!isToday(taskDate)) return; // Only today's tasks

                const [h, m] = task.startTime.split(':').map(Number);
                const start = new Date(taskDate);
                start.setHours(h, m, 0, 0);

                const diff = differenceInMinutes(start, currentNow);

                // Trigger 10 min before
                if (diff === 10) {
                    new Notification(`Prepare-se: ${task.title}`, {
                        body: `Começa em 10 minutos (${task.startTime})`,
                        icon: '/vite.svg'
                    });
                }
            });
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [tasks]);


    const requestNotification = () => {
        Notification.requestPermission().then(setPermission);
    };

    // --- Handlers ---

    const handleAddTask = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputValue.trim()) return;

        const { title, startTime, targetValue } = parseInput(inputValue);

        try {
            await addDoc(collection(db, 'tasks'), {
                ownerId: user?.uid || 'unknown', // Fallback
                title,
                startTime,
                status: 'TODO',
                priority: 'MEDIUM',
                dueAt: Timestamp.fromDate(new Date()), // Today
                createdAt: Timestamp.now(),
                targetValue: targetValue || 0,
                currentValue: 0,
                // If it has startTime, imply endTime + 1h for now or leave open
                notify: true
            });
            setInputValue('');
            toast.success('Missão adicionada');
        } catch (err) {
            console.error(err);
            toast.error('Erro ao adicionar missão');
        }
    };

    const handleToggle = async (task: Task) => {
        // If progressive, this button finishes it Forcefully? 
        // Or if it's a checkbox, it toggles DONE/TODO.
        const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';

        // Calculate performance if finishing
        let performance = null;
        if (newStatus === 'DONE' && task.startTime) {
            const [h, m] = task.startTime.split(':').map(Number);
            // Assume end time is +1h or user set it. If only StartTime, comparison is vague.
            // Let's just compare start time vs now. If late start? Or late finish?
            // Simplest: If now > startTime + 30min, it's late? 
            // Let's say: On Time = Completed on the same day.
            // Let's leave Performance logic simple: Always 'ON_TIME' if today.
            performance = 'ON_TIME';

            // Advanced logic: if task.endTime, compare.
        }

        await updateDoc(doc(db, 'tasks', task.id), {
            status: newStatus,
            completedAt: newStatus === 'DONE' ? Timestamp.now() : null,
            performance
        });
    };

    const handleIncrement = async (task: Task) => {
        if (!task.targetValue) return;
        const nextVal = (task.currentValue || 0) + 1;

        if (nextVal >= task.targetValue) {
            // Auto complete
            await updateDoc(doc(db, 'tasks', task.id), {
                currentValue: nextVal,
                status: 'DONE',
                completedAt: Timestamp.now(),
                performance: 'ON_TIME'
            });
            toast.success(`Meta batida: ${task.title}`);
        } else {
            await updateDoc(doc(db, 'tasks', task.id), {
                currentValue: nextVal
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Deletar missão?')) {
            await deleteDoc(doc(db, 'tasks', id));
        }
    };

    // --- Auto-Priority Sort ---
    // 1. Pending vs Done
    // 2. Overdue (if Date < today) - skipping for now as we auto-set Due=Today
    // 3. Current Time Block (startTime is closest to NOW)
    // 4. Future
    // 5. No Time
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.status === 'DONE' && b.status !== 'DONE') return 1;
        if (a.status !== 'DONE' && b.status === 'DONE') return -1;

        // Both Pending
        if (a.startTime && b.startTime) {
            return a.startTime.localeCompare(b.startTime);
        }
        if (a.startTime) return -1;
        if (b.startTime) return 1;

        return 0; // Keep insertion order
    });

    // Determine "Active" task (first pending with time closest to now, or just first pending)
    // Actually, "Active" is valid if now >= startTime && now < endTime.
    // Simplify: Highlight task if we are within [startTime, startTime + 1h]
    const isActive = (task: Task) => {
        if (task.status === 'DONE' || !task.startTime) return false;
        const [h, m] = task.startTime.split(':').map(Number);
        const start = new Date();
        start.setHours(h, m, 0, 0);
        const end = addMinutes(start, 60); // Assume 1h blocks default
        return now >= start && now < end;
    };


    return (
        <div className="tasks-page">
            <header className="tasks-header">
                <div>
                    <h1>Field Marshal</h1>
                    <p className="tasks-subtitle">
                        {format(now, "EEEE, d 'de' MMMM", { locale: ptBR })} • {format(now, "HH:mm")}
                    </p>
                </div>
                <div>
                    {permission === 'default' && (
                        <button className="btn-ghost" onClick={requestNotification}>
                            <Bell size={20} /> Ativar Alertas
                        </button>
                    )}
                    {permission === 'granted' && <div className="text-success text-sm flex gap-2"><Check size={14} /> Sistema Online</div>}
                </div>
            </header>

            {/* Smart Input */}
            <div className="smart-input-container">
                <form onSubmit={handleAddTask}>
                    <input
                        type="text"
                        className="smart-input"
                        placeholder="Ex: Ligar para leads 14:00 (ou '5 vendas')"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        autoFocus
                    />
                </form>
                {parsedPreview && (parsedPreview.startTime || parsedPreview.targetValue) && (
                    <div className="smart-tags">
                        {parsedPreview.startTime && (
                            <span className="smart-tag"><Clock size={12} /> {parsedPreview.startTime}</span>
                        )}
                        {parsedPreview.targetValue && (
                            <span className="smart-tag"><Target size={12} /> Meta: {parsedPreview.targetValue}</span>
                        )}
                    </div>
                )}
            </div>

            {/* Task List */}
            <div className="tasks-grid">
                {sortedTasks.length === 0 && (
                    <div className="empty-state">
                        <CheckSquare size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                        <p>Nenhuma missão ativa. O campo está limpo.</p>
                    </div>
                )}

                {sortedTasks.map(task => {
                    const active = isActive(task);
                    const isLate = false; // Implement late logic later

                    return (
                        <div key={task.id} className={`task-card ${active ? 'is-active' : ''} ${task.status === 'DONE' ? 'is-done' : ''}`}>
                            {/* Left: Time */}
                            <div className="task-left">
                                {task.startTime ? (
                                    <span className="task-time">{task.startTime}</span>
                                ) : (
                                    <span className="task-time">--:--</span>
                                )}
                            </div>

                            {/* Center: Info */}
                            <div className="task-center">
                                <div className="task-title">{task.title}</div>
                                {task.targetValue ? (
                                    <div className="task-progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${((task.currentValue || 0) / task.targetValue) * 100}%` }}
                                        />
                                    </div>
                                ) : null}
                            </div>

                            {/* Right: Actions */}
                            <div className="task-right">
                                {/* Progressive Control */}
                                {task.targetValue && task.status !== 'DONE' ? (
                                    <div className="progressive-tracker">
                                        <span className="tracker-val">{task.currentValue || 0}/{task.targetValue}</span>
                                        <button className="tracker-btn" onClick={() => handleIncrement(task)}>
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    // Regular Checkbox
                                    <button
                                        className={`check-btn ${task.status === 'DONE' ? 'checked' : ''}`}
                                        onClick={() => handleToggle(task)}
                                    >
                                        <Check size={18} />
                                    </button>
                                )}

                                {/* Delete */}
                                <button className="tracker-btn" style={{ background: 'transparent', opacity: 0.5 }} onClick={() => handleDelete(task.id)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TasksPage;
