import React, { useState, useRef, useEffect } from 'react';
import { Presentation, Trash2, MousePointer2, Link2, Plus, Minus } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface Note {
    id: string;
    x: number;
    y: number;
    content: string;
    color: string;
    width: number;
    height: number;
}

interface Connection {
    id: string;
    fromNoteId: string;
    toNoteId: string;
}

const COLORS = [
    { bg: '#facc15', text: '#000' }, // Yellow
    { bg: '#4ade80', text: '#000' }, // Green
    { bg: '#60a5fa', text: '#000' }, // Blue
    { bg: '#f87171', text: '#000' }, // Red
    { bg: '#c084fc', text: '#000' }, // Purple
];

export const StrategyBoard: React.FC = () => {
    const { user } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [connections, setConnections] = useState<Connection[]>([]);

    // Dragging State
    const [isDragging, setIsDragging] = useState(false);
    const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const boardRef = useRef<HTMLDivElement>(null);

    // Connection Mode State
    const [isConnectionMode, setIsConnectionMode] = useState(false);
    const [selectedNoteForConnection, setSelectedNoteForConnection] = useState<string | null>(null);

    // Zoom State
    const [scale, setScale] = useState(1);

    // Selected Note State (for keyboard shortcuts)
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

    // Undo/Redo History
    const [history, setHistory] = useState<any[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Resize State
    const [isResizing, setIsResizing] = useState(false);
    const [resizingNoteId, setResizingNoteId] = useState<string | null>(null);
    const [resizeHandle, setResizeHandle] = useState<string | null>(null); // 'se', 'sw', 'ne', 'nw', 'e', 'w', 'n', 's'
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

    // Color Menu State
    const [colorMenuNoteId, setColorMenuNoteId] = useState<string | null>(null);

    // Load notes from Firestore
    useEffect(() => {
        if (!user?.id) return;

        const notesQuery = query(
            collection(db, 'strategyNotes'),
            where('userId', '==', user.id)
        );

        const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
            const loadedNotes: Note[] = [];
            snapshot.forEach((doc) => {
                loadedNotes.push({ id: doc.id, ...doc.data() } as Note);
            });
            setNotes(loadedNotes);
        });

        return () => unsubscribe();
    }, [user?.id]);

    // Load connections from Firestore
    useEffect(() => {
        if (!user?.id) return;

        const connectionsQuery = query(
            collection(db, 'strategyConnections'),
            where('userId', '==', user.id)
        );

        const unsubscribe = onSnapshot(connectionsQuery, (snapshot) => {
            const loadedConnections: Connection[] = [];
            snapshot.forEach((doc) => {
                loadedConnections.push({ id: doc.id, ...doc.data() } as Connection);
            });
            setConnections(loadedConnections);
        });

        return () => unsubscribe();
    }, [user?.id]);

    const addNote = async (colorIndex = 0) => {
        if (!user?.id) return;

        const newNote = {
            userId: user.id,
            x: Math.random() * 200 + 100,
            y: Math.random() * 200 + 100,
            content: '',
            color: COLORS[colorIndex].bg,
            width: 220,
            height: 180,
            createdAt: new Date(),
        };

        try {
            await addDoc(collection(db, 'strategyNotes'), newNote);
        } catch (error) {
            console.error('Failed to add note:', error);
        }
    };

    const handleMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const note = notes.find(n => n.id === id);
        if (!note) return;

        setIsDragging(true);
        setDraggedNoteId(id);

        setDragOffset({
            x: e.clientX - note.x,
            y: e.clientY - note.y
        });
    };

    const handleMouseMove = async (e: React.MouseEvent) => {
        if (!isDragging || !draggedNoteId) return;

        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Update local state immediately for smooth dragging
        setNotes(notes.map(n =>
            n.id === draggedNoteId ? { ...n, x: newX, y: newY } : n
        ));
    };

    const handleMouseUp = async () => {
        if (!isDragging || !draggedNoteId) return;

        const note = notes.find(n => n.id === draggedNoteId);
        if (note) {
            try {
                // Save final position to Firestore
                await updateDoc(doc(db, 'strategyNotes', draggedNoteId), {
                    x: note.x,
                    y: note.y,
                });
            } catch (error) {
                console.error('Failed to update note position:', error);
            }
        }

        setIsDragging(false);
        setDraggedNoteId(null);
    };

    const updateNoteContent = async (id: string, content: string) => {
        // Update local state immediately for responsive typing
        setNotes(notes.map(n => n.id === id ? { ...n, content } : n));

        try {
            await updateDoc(doc(db, 'strategyNotes', id), { content });
        } catch (error) {
            console.error('Failed to update note content:', error);
        }
    };

    const deleteNote = async (id: string) => {
        try {
            // Delete the note
            await deleteDoc(doc(db, 'strategyNotes', id));

            // Delete all connections related to this note
            const relatedConnections = connections.filter(
                conn => conn.fromNoteId === id || conn.toNoteId === id
            );

            await Promise.all(
                relatedConnections.map(conn =>
                    deleteDoc(doc(db, 'strategyConnections', conn.id))
                )
            );

            // Clear selection if deleted note was selected
            if (selectedNoteId === id) {
                setSelectedNoteId(null);
            }
        } catch (error) {
            console.error('Failed to delete note:', error);
        }
    };

    // Zoom functions
    const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 3));
    const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.25));
    const resetZoom = () => setScale(1);

    // Duplicate note
    const duplicateNote = async (noteId: string) => {
        if (!user?.id) return;

        const noteToDuplicate = notes.find(n => n.id === noteId);
        if (!noteToDuplicate) return;

        const newNote = {
            userId: user.id,
            x: noteToDuplicate.x + 20,
            y: noteToDuplicate.y + 20,
            content: noteToDuplicate.content,
            color: noteToDuplicate.color,
            width: noteToDuplicate.width,
            height: noteToDuplicate.height,
            createdAt: new Date(),
        };

        try {
            await addDoc(collection(db, 'strategyNotes'), newNote);
        } catch (error) {
            console.error('Failed to duplicate note:', error);
        }
    };

    // Change note color
    const changeNoteColor = async (noteId: string, colorIndex: number) => {
        try {
            await updateDoc(doc(db, 'strategyNotes', noteId), {
                color: COLORS[colorIndex].bg
            });
            setColorMenuNoteId(null); // Close menu after selection
        } catch (error) {
            console.error('Failed to change note color:', error);
        }
    };

    // Resize handlers
    const handleResizeStart = (e: React.MouseEvent, noteId: string, handle: string) => {
        e.stopPropagation();
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        setIsResizing(true);
        setResizingNoteId(noteId);
        setResizeHandle(handle);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: note.width,
            height: note.height
        });
    };

    const handleResizeMove = (e: MouseEvent) => {
        if (!isResizing || !resizingNoteId || !resizeHandle) return;

        const note = notes.find(n => n.id === resizingNoteId);
        if (!note) return;

        const deltaX = (e.clientX - resizeStart.x) / scale;
        const deltaY = (e.clientY - resizeStart.y) / scale;

        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;

        // Calculate new dimensions based on handle
        if (resizeHandle.includes('e')) newWidth = Math.max(120, resizeStart.width + deltaX);
        if (resizeHandle.includes('w')) newWidth = Math.max(120, resizeStart.width - deltaX);
        if (resizeHandle.includes('s')) newHeight = Math.max(100, resizeStart.height + deltaY);
        if (resizeHandle.includes('n')) newHeight = Math.max(100, resizeStart.height - deltaY);

        // Update local state immediately for smooth UX
        setNotes(prev => prev.map(n =>
            n.id === resizingNoteId
                ? { ...n, width: newWidth, height: newHeight }
                : n
        ));
    };

    const handleResizeEnd = async () => {
        if (!isResizing || !resizingNoteId) return;

        const note = notes.find(n => n.id === resizingNoteId);
        if (note) {
            try {
                await updateDoc(doc(db, 'strategyNotes', resizingNoteId), {
                    width: note.width,
                    height: note.height
                });
            } catch (error) {
                console.error('Failed to update note size:', error);
            }
        }

        setIsResizing(false);
        setResizingNoteId(null);
        setResizeHandle(null);
    };

    // Update mouse move to handle both drag and resize
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizing) {
                handleResizeMove(e);
            }
        };

        const handleMouseUp = () => {
            if (isResizing) {
                handleResizeEnd();
            }
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizing, resizingNoteId, resizeHandle, resizeStart, scale, notes]);


    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in textarea
            if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;

            // Delete - delete selected note
            if (e.key === 'Delete' && selectedNoteId) {
                deleteNote(selectedNoteId);
                return;
            }

            // Escape - exit connection mode or deselect
            if (e.key === 'Escape') {
                if (isConnectionMode) {
                    setIsConnectionMode(false);
                    setSelectedNoteForConnection(null);
                } else {
                    setSelectedNoteId(null);
                }
                return;
            }

            // Numbers 1-5 - add note with color
            if (e.key >= '1' && e.key <= '5' && !e.ctrlKey && !e.metaKey) {
                const colorIndex = parseInt(e.key) - 1;
                addNote(colorIndex);
                return;
            }

            // Ctrl/Cmd + D - duplicate
            if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedNoteId) {
                e.preventDefault();
                duplicateNote(selectedNoteId);
                return;
            }

            // Ctrl/Cmd + Z - undo (placeholder for now)
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                // TODO: Implement undo
                console.log('Undo - coming soon');
                return;
            }

            // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z - redo (placeholder)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                // TODO: Implement redo
                console.log('Redo - coming soon');
                return;
            }

            // Ctrl/Cmd + = or + for zoom in
            if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
                e.preventDefault();
                zoomIn();
                return;
            }

            // Ctrl/Cmd + - for zoom out
            if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                e.preventDefault();
                zoomOut();
                return;
            }

            // Ctrl/Cmd + 0 for reset zoom
            if ((e.ctrlKey || e.metaKey) && e.key === '0') {
                e.preventDefault();
                resetZoom();
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNoteId, isConnectionMode, selectedNoteForConnection]);

    // Mouse wheel zoom
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    zoomIn();
                } else {
                    zoomOut();
                }
            }
        };

        const board = boardRef.current;
        if (board) {
            board.addEventListener('wheel', handleWheel, { passive: false });
            return () => board.removeEventListener('wheel', handleWheel);
        }
    }, []);

    // Connection functions
    const createConnection = async (fromNoteId: string, toNoteId: string) => {
        if (!user?.id || fromNoteId === toNoteId) return;

        // Check if connection already exists
        const existingConnection = connections.find(
            conn =>
                (conn.fromNoteId === fromNoteId && conn.toNoteId === toNoteId) ||
                (conn.fromNoteId === toNoteId && conn.toNoteId === fromNoteId)
        );

        if (existingConnection) return;

        try {
            await addDoc(collection(db, 'strategyConnections'), {
                userId: user.id,
                fromNoteId,
                toNoteId,
                createdAt: new Date(),
            });
        } catch (error) {
            console.error('Failed to create connection:', error);
        }
    };

    const deleteConnection = async (connectionId: string) => {
        try {
            await deleteDoc(doc(db, 'strategyConnections', connectionId));
        } catch (error) {
            console.error('Failed to delete connection:', error);
        }
    };

    const handleNoteClick = (noteId: string) => {
        // Always set selected note for keyboard shortcuts
        setSelectedNoteId(noteId);

        // If in connection mode, handle connection
        if (isConnectionMode) {
            if (!selectedNoteForConnection) {
                // First note selected
                setSelectedNoteForConnection(noteId);
            } else {
                // Second note selected, create connection
                createConnection(selectedNoteForConnection, noteId);
                setSelectedNoteForConnection(null);
            }
        }
    };

    const toggleConnectionMode = () => {
        setIsConnectionMode(!isConnectionMode);
        setSelectedNoteForConnection(null);
    };

    return (
        <div
            className="fixed inset-0 top-[64px] md:left-[260px] z-30 bg-[#0a0a0a] overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            ref={boardRef}
            style={{
                cursor: isDragging ? 'grabbing' : 'default',
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.08) 1px, transparent 0)',
                backgroundSize: '24px 24px'
            }}
        >
            {/* Toolbar - Bottom Center - ALWAYS VISIBLE */}
            <div
                style={{
                    position: 'fixed',
                    bottom: '32px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    display: 'flex',
                    gap: '16px',
                    backgroundColor: 'rgba(24, 24, 27, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '16px 24px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingRight: '16px',
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#d4d4d8'
                }}>
                    <Presentation size={20} style={{ color: '#818cf8' }} />
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Adicionar Nota</span>
                </div>

                {COLORS.map((c, i) => (
                    <button
                        key={i}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: c.bg,
                            border: '2px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.borderColor = 'transparent';
                        }}
                        onClick={() => addNote(i)}
                        title={`Adicionar Nota ${['Amarela', 'Verde', 'Azul', 'Vermelha', 'Roxa'][i]}`}
                    />
                ))}

                {/* Connection Mode Button */}
                <div style={{
                    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingLeft: '16px',
                }}>
                    <button
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            backgroundColor: isConnectionMode ? '#818cf8' : 'rgba(129, 140, 248, 0.2)',
                            border: isConnectionMode ? '2px solid #a5b4fc' : '2px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isConnectionMode ? '#000' : '#818cf8',
                        }}
                        onClick={toggleConnectionMode}
                        title={isConnectionMode ? 'Desativar Modo Conexão' : 'Ativar Modo Conexão - Clique em duas notas para conectá-las'}
                    >
                        <Link2 size={20} />
                    </button>
                </div>

                {/* Zoom Controls */}
                <div style={{
                    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingLeft: '16px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                }}>
                    <button
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(129, 140, 248, 0.2)',
                            border: '2px solid transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#818cf8',
                        }}
                        onClick={zoomOut}
                        title="Zoom Out (Ctrl + -)">
                        <Minus size={16} />
                    </button>
                    <span style={{ color: '#d4d4d8', fontSize: '12px', minWidth: '45px', textAlign: 'center' }}>
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(129, 140, 248, 0.2)',
                            border: '2px solid transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#818cf8',
                        }}
                        onClick={zoomIn}
                        title="Zoom In (Ctrl + +)">
                        <Plus size={16} />
                    </button>
                </div>
            </div>

            {/* Scaled Content Wrapper */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.1s ease-out',
            }}>

                {/* Connection Lines SVG Layer */}
                <svg
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                >
                    {connections.map((connection) => {
                        const fromNote = notes.find(n => n.id === connection.fromNoteId);
                        const toNote = notes.find(n => n.id === connection.toNoteId);

                        if (!fromNote || !toNote) return null;

                        // Calculate center points of notes
                        const x1 = fromNote.x + fromNote.width / 2;
                        const y1 = fromNote.y + fromNote.height / 2;
                        const x2 = toNote.x + toNote.width / 2;
                        const y2 = toNote.y + toNote.height / 2;

                        return (
                            <g key={connection.id}>
                                {/* Clickable invisible thicker line for easier deletion */}
                                <line
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    stroke="transparent"
                                    strokeWidth="12"
                                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Deletar esta conexão?')) {
                                            deleteConnection(connection.id);
                                        }
                                    }}
                                />
                                {/* Visible line */}
                                <line
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    stroke="#818cf8"
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                    style={{ pointerEvents: 'none' }}
                                />
                                {/* Arrow marker at the end */}
                                <circle
                                    cx={x2}
                                    cy={y2}
                                    r="4"
                                    fill="#818cf8"
                                    style={{ pointerEvents: 'none' }}
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Hint */}
                {notes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                        <div className="text-center p-8 rounded-2xl bg-zinc-900/50 backdrop-blur-sm border border-white/5">
                            <MousePointer2 size={48} className="mx-auto mb-4 text-indigo-500/50" />
                            <h2 className="text-2xl font-bold text-white mb-2">Sua Lousa está vazia</h2>
                            <p className="text-zinc-400 max-w-xs">Selecione uma cor na barra inferior para adicionar sua primeira nota estratégica.</p>
                        </div>
                    </div>
                )}

                {/* Notes */}
                {notes.map((note) => (
                    <div
                        key={note.id}
                        className="group absolute rounded-xl shadow-2xl flex flex-col transition-all duration-200 hover:ring-2 hover:ring-white/20"
                        style={{
                            left: note.x,
                            top: note.y,
                            width: note.width,
                            height: note.height,
                            backgroundColor: note.color,
                            zIndex: draggedNoteId === note.id ? 50 : 10,
                            transform: draggedNoteId === note.id ? 'scale(1.02)' : 'scale(1)',
                            cursor: isConnectionMode ? 'pointer' : 'default',
                            outline: selectedNoteForConnection === note.id ? '3px solid #818cf8' : 'none',
                            outlineOffset: '2px',
                        }}
                        onClick={() => handleNoteClick(note.id)}
                    >
                        {/* Header (Handle) */}
                        <div
                            className="h-8 cursor-grab active:cursor-grabbing flex justify-between px-2 items-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/5 rounded-t-xl"
                            onMouseDown={(e) => handleMouseDown(e, note.id)}
                        >
                            {/* Color Picker Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setColorMenuNoteId(colorMenuNoteId === note.id ? null : note.id);
                                }}
                                className="p-1 rounded hover:bg-black/10 text-black/40 transition-colors relative"
                                title="Mudar cor"
                            >
                                <div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: note.color, border: '2px solid rgba(0,0,0,0.3)' }} />

                                {/* Color Palette Dropdown */}
                                {colorMenuNoteId === note.id && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            marginTop: '4px',
                                            backgroundColor: '#18181b',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            padding: '8px',
                                            display: 'flex',
                                            gap: '6px',
                                            zIndex: 1000,
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {COLORS.map((c, i) => (
                                            <button
                                                key={i}
                                                onClick={() => changeNoteColor(note.id, i)}
                                                style={{
                                                    width: 24,
                                                    height: 24,
                                                    borderRadius: '50%',
                                                    backgroundColor: c.bg,
                                                    border: note.color === c.bg ? '2px solid white' : '2px solid transparent',
                                                    cursor: 'pointer'
                                                }}
                                                title={['Amarelo', 'Verde', 'Azul', 'Vermelho', 'Roxo'][i]}
                                            />
                                        ))}
                                    </div>
                                )}
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                className="p-1 rounded hover:bg-black/10 text-black/40 hover:text-red-600 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        {/* Resize Handles */}
                        {/* Corner Handles */}
                        <div
                            className="absolute opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ right: -4, bottom: -4, width: 12, height: 12, backgroundColor: '#818cf8', borderRadius: '50%', cursor: 'nwse-resize', zIndex: 100 }}
                            onMouseDown={(e) => handleResizeStart(e, note.id, 'se')}
                        />
                        <div
                            className="absolute opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ left: -4, bottom: -4, width: 12, height: 12, backgroundColor: '#818cf8', borderRadius: '50%', cursor: 'nesw-resize', zIndex: 100 }}
                            onMouseDown={(e) => handleResizeStart(e, note.id, 'sw')}
                        />
                        <div
                            className="absolute opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ right: -4, top: -4, width: 12, height: 12, backgroundColor: '#818cf8', borderRadius: '50%', cursor: 'nesw-resize', zIndex: 100 }}
                            onMouseDown={(e) => handleResizeStart(e, note.id, 'ne')}
                        />
                        <div
                            className="absolute opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ left: -4, top: -4, width: 12, height: 12, backgroundColor: '#818cf8', borderRadius: '50%', cursor: 'nwse-resize', zIndex: 100 }}
                            onMouseDown={(e) => handleResizeStart(e, note.id, 'nw')}
                        />

                        {/* Edge Handles */}
                        <div
                            className="absolute opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ right: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 40, backgroundColor: '#818cf8', borderRadius: 4, cursor: 'ew-resize', zIndex: 100 }}
                            onMouseDown={(e) => handleResizeStart(e, note.id, 'e')}
                        />
                        <div
                            className="absolute opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ left: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 40, backgroundColor: '#818cf8', borderRadius: 4, cursor: 'ew-resize', zIndex: 100 }}
                            onMouseDown={(e) => handleResizeStart(e, note.id, 'w')}
                        />
                        <div
                            className="absolute opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ bottom: -4, left: '50%', transform: 'translateX(-50%)', height: 8, width: 40, backgroundColor: '#818cf8', borderRadius: 4, cursor: 'ns-resize', zIndex: 100 }}
                            onMouseDown={(e) => handleResizeStart(e, note.id, 's')}
                        />
                        <div
                            className="absolute opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ top: -4, left: '50%', transform: 'translateX(-50%)', height: 8, width: 40, backgroundColor: '#818cf8', borderRadius: 4, cursor: 'ns-resize', zIndex: 100 }}
                            onMouseDown={(e) => handleResizeStart(e, note.id, 'n')}
                        />

                        {/* Content */}
                        <textarea
                            className="flex-1 w-full bg-transparent border-none resize-none px-4 pb-4 focus:outline-none text-gray-900 placeholder-black/30 font-medium text-lg leading-snug cursor-text"
                            value={note.content}
                            onChange={(e) => updateNoteContent(note.id, e.target.value)}
                            placeholder="Escreva sua estratégia..."
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}
