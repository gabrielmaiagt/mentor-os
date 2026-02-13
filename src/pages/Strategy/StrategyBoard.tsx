import React, { useState, useRef, useEffect } from 'react';
import { Presentation, Trash2, MousePointer2, Link2, Plus, Minus, Upload, Pen, Eraser } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
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
    style?: 'solid' | 'dashed';
    color?: string;
    label?: string;
}

interface ImageElement {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    imageUrl: string;
}

interface Drawing {
    id: string;
    path: string; // SVG path data
    color: string;
    width: number; // stroke width
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
    // Undo/Redo History - TODO: Implement
    // const [history, setHistory] = useState<any[]>([]);
    // const [historyIndex, setHistoryIndex] = useState(-1);

    // Resize State
    const [isResizing, setIsResizing] = useState(false);
    const [resizingNoteId, setResizingNoteId] = useState<string | null>(null);
    const [resizeHandle, setResizeHandle] = useState<string | null>(null); // 'se', 'sw', 'ne', 'nw', 'e', 'w', 'n', 's'
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

    // Color Menu State
    // Color Menu State
    const [colorMenuNoteId, setColorMenuNoteId] = useState<string | null>(null);

    // Sprint 2: Pan/Canvas State
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [isSpacePressed, setIsSpacePressed] = useState(false);

    // Sprint 2: Multi-selection State
    const [selectedNotes, setSelectedNotes] = useState<string[]>([]);

    // Sprint 2: Search State
    const [searchQuery, setSearchQuery] = useState('');

    // Sprint 2: Images
    const [images, setImages] = useState<ImageElement[]>([]);

    // Sprint 2: Image Drag State
    const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
    const [isDraggingImage, setIsDraggingImage] = useState(false);

    // Sprint 3.5: Drawing Tools State
    const [drawings, setDrawings] = useState<Drawing[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<string>('');
    const [drawingMode, setDrawingMode] = useState<'none' | 'brush' | 'eraser'>('none');
    const [brushColor, setBrushColor] = useState('#818cf8');
    const [brushWidth, setBrushWidth] = useState(3);

    // Sprint 5: Presentation Mode State
    const [isPresentationMode, setIsPresentationMode] = useState(false);
    const [isToolbarVisible, setIsToolbarVisible] = useState(true);

    // UX Improvements: Hover and Drag
    const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
    const [hoveredImageId, setHoveredImageId] = useState<string | null>(null);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [hasDragMoved, setHasDragMoved] = useState(false);

    // Image resize
    const [isResizingImage, setIsResizingImage] = useState(false);
    const [resizingImageId, setResizingImageId] = useState<string | null>(null);
    const [resizeImageDirection, setResizeImageDirection] = useState<string>('');
    const [resizeImageStart, setResizeImageStart] = useState({ x: 0, y: 0, width: 0, height: 0 });


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

    // Load drawings from Firestore
    useEffect(() => {
        if (!user?.id) return;

        const q = query(collection(db, 'strategyDrawings'), where('userId', '==', user.id));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedDrawings: Drawing[] = [];
            snapshot.forEach((doc) => {
                loadedDrawings.push({ id: doc.id, ...doc.data() } as Drawing);
            });
            setDrawings(loadedDrawings);
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

        // Save start position for drag threshold
        setDragStartPos({ x: e.clientX, y: e.clientY });
        setHasDragMoved(false);
        setDraggedNoteId(id);

        setDragOffset({
            x: e.clientX - note.x,
            y: e.clientY - note.y
        });
    };

    const handleMouseMove = async (e: React.MouseEvent) => {
        // Handle drawing
        if (isDrawing && drawingMode !== 'none') {
            handleDrawMove(e);
            return;
        }

        // Check drag threshold for notes
        if (draggedNoteId && !hasDragMoved) {
            const deltaX = Math.abs(e.clientX - dragStartPos.x);
            const deltaY = Math.abs(e.clientY - dragStartPos.y);

            if (deltaX > 5 || deltaY > 5) {
                setHasDragMoved(true);
                setIsDragging(true);
            }
        }

        // Handle note dragging
        if (isDragging && draggedNoteId && hasDragMoved) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            setNotes(notes.map(n =>
                n.id === draggedNoteId ? { ...n, x: newX, y: newY } : n
            ));
        }

        // Handle image dragging
        if (isDraggingImage && draggedImageId) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            setImages(images.map(img =>
                img.id === draggedImageId ? { ...img, x: newX, y: newY } : img
            ));
        }
    };

    const handleMouseUp = async () => {
        // Handle image drag end
        if (isDraggingImage && draggedImageId) {
            const image = images.find(img => img.id === draggedImageId);
            if (image) {
                await updateImagePosition(draggedImageId, image.x, image.y);
            }
            setIsDraggingImage(false);
            setDraggedImageId(null);
            return; // Exit if an image was dragged
        }

        // Handle note drag end
        if (isDragging && draggedNoteId) {
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
            return; // Exit if a note was dragged
        }

        // Handle resize end
        if (isResizing && resizingNoteId) {
            const note = notes.find(n => n.id === resizingNoteId);
            if (note) {
                try {
                    await updateDoc(doc(db, 'strategyNotes', resizingNoteId), {
                        width: note.width,
                        height: note.height,
                        x: note.x,
                        y: note.y,
                    });
                } catch (error) {
                    console.error('Failed to update note size:', error);
                }
            }
            setIsResizing(false);
            setResizingNoteId(null);
            setResizeHandle(null);
            return; // Exit if a note was resized
        }

        // Handle drawing end
        if (isDrawing && drawingMode !== 'none') {
            await handleDrawEnd();
        }
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

    // Load images from Firestore
    useEffect(() => {
        if (!user?.id) return;

        const imagesQuery = query(
            collection(db, 'strategyImages'),
            where('userId', '==', user.id)
        );

        const unsubscribe = onSnapshot(imagesQuery, (snapshot) => {
            const loadedImages: ImageElement[] = [];
            snapshot.forEach((doc) => {
                loadedImages.push({ id: doc.id, ...doc.data() } as ImageElement);
            });
            setImages(loadedImages);
        });

        return () => unsubscribe();
    }, [user?.id]);

    // Upload image function
    const handleImageUpload = async (file: File) => {
        if (!user?.id) return;

        try {
            const timestamp = Date.now();
            const storageRef = ref(storage, `strategy - images / ${user.id}/${timestamp}_${file.name}`);
            await uploadBytes(storageRef, file);
            const imageUrl = await getDownloadURL(storageRef);

            await addDoc(collection(db, 'strategyImages'), {
                userId: user.id,
                x: 100,
                y: 100,
                width: 300,
                height: 200,
                imageUrl,
                createdAt: new Date()
            });

            alert('✅ Imagem adicionada com sucesso!');
        } catch (error: any) {
            console.error('Failed to upload image:', error);

            // User-friendly error message
            if (error?.code === 'storage/unauthorized' || error?.message?.includes('CORS')) {
                alert(
                    '⚠️ Erro de permissão no Firebase Storage!\n\n' +
                    'Configure as regras do Storage no Firebase Console:\n' +
                    '1. Acesse Firebase Console → Storage → Rules\n' +
                    '2. Use as regras corretas (veja documentação)\n\n' +
                    'Erro técnico: ' + error.message
                );
            } else {
                alert('❌ Falha ao fazer upload da imagem: ' + error.message);
            }
        }
    };

    // Image drag handlers
    const handleImageMouseDown = (e: React.MouseEvent, imageId: string) => {
        if (isSpacePressed) return; // Don't drag image when panning

        e.stopPropagation();
        setIsDraggingImage(true);
        setDraggedImageId(imageId);
    };

    const updateImagePosition = async (imageId: string, x: number, y: number) => {
        try {
            await updateDoc(doc(db, 'strategyImages', imageId), { x, y });
        } catch (error) {
            console.error('Failed to update image position:', error);
        }
    };

    // Drawing handlers
    const handleDrawStart = (e: React.MouseEvent) => {
        // Only draw if in brush mode (not eraser)
        if (drawingMode !== 'brush' || isSpacePressed) return;

        const rect = boardRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDrawing(true);
        setCurrentPath(`M ${x} ${y}`);
    };

    const handleDrawMove = (e: React.MouseEvent) => {
        if (!isDrawing || drawingMode !== 'brush') return;

        const rect = boardRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setCurrentPath(prev => `${prev} L ${x} ${y}`);
    };

    const handleDrawEnd = async () => {
        if (!isDrawing || !user?.id || currentPath.length < 10) {
            setIsDrawing(false);
            setCurrentPath('');
            return;
        }

        try {
            await addDoc(collection(db, 'strategyDrawings'), {
                userId: user.id,
                path: currentPath,
                color: brushColor,
                width: brushWidth,
                createdAt: new Date()
            });
        } catch (error) {
            console.error('Failed to save drawing:', error);
        }

        setIsDrawing(false);
        setCurrentPath('');
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
            // setColorMenuNoteId(null); // Close menu after selection
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

            // Delete - delete selected note(s)
            if (e.key === 'Delete') {
                if (selectedNotes.length > 0) {
                    // Delete all selected notes
                    selectedNotes.forEach(id => deleteNote(id));
                    setSelectedNotes([]);
                } else if (selectedNoteId) {
                    deleteNote(selectedNoteId);
                }
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

            // 't' for toggling toolbar
            if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
                setIsToolbarVisible(prev => !prev);
                return;
            }

            // 'p' for presentation mode
            if (e.key === 'p' && !e.ctrlKey && !e.metaKey) {
                setIsPresentationMode(prev => !prev);
                // Also toggle toolbar based on mode
                setIsToolbarVisible(prev => isPresentationMode); // If exiting (isPresentationMode was true), show toolbar. If entering, hide it.
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

    // Sprint 2: Space key detection for panning
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !isSpacePressed && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                e.preventDefault();
                setIsSpacePressed(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsSpacePressed(false);
                setIsPanning(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isSpacePressed]);

    // Sprint 2: Pan handlers
    const handlePanStart = (e: React.MouseEvent) => {
        if (isSpacePressed) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        }
    };

    const handlePanMove = (e: MouseEvent) => {
        if (isPanning) {
            setPanOffset({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
        }
    };

    const handlePanEnd = () => {
        setIsPanning(false);
    };

    // Pan mouse move/up listeners
    useEffect(() => {
        if (isPanning) {
            window.addEventListener('mousemove', handlePanMove);
            window.addEventListener('mouseup', handlePanEnd);
            return () => {
                window.removeEventListener('mousemove', handlePanMove);
                window.removeEventListener('mouseup', handlePanEnd);
            };
        }
    }, [isPanning, panStart, panOffset]);


    // Connection functions
    const createConnection = async (fromNoteId: string, toNoteId: string) => {
        if (!user?.id || fromNoteId === toNoteId) return;

        try {
            await addDoc(collection(db, 'strategyConnections'), {
                userId: user.id,
                fromNoteId,
                toNoteId,
                style: 'solid', // Sprint 3: default style
                color: '#818cf8', // Sprint 3: default indigo color
                label: '', // Sprint 3: empty by default
                createdAt: new Date()
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

    const handleNoteClick = (noteId: string, e?: React.MouseEvent) => {
        // Sprint 2: Multi-selection with Ctrl+Click
        if (e?.ctrlKey || e?.metaKey) {
            setSelectedNotes(prev => {
                if (prev.includes(noteId)) {
                    return prev.filter(id => id !== noteId);
                } else {
                    return [...prev, noteId];
                }
            });
            return;
        }

        // Clear multi-selection if clicking without Ctrl
        setSelectedNotes([]);
        setSelectedNoteId(noteId);

        // If in connection mode, handle connection
        if (isConnectionMode) {
            if (!selectedNoteForConnection) {
                setSelectedNoteForConnection(noteId);
            } else {
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
            onMouseDown={(e) => {
                // Handle drawing mode
                if (drawingMode !== 'none' && !isSpacePressed) {
                    handleDrawStart(e);
                    return;
                }

                // Handle pan mode
                handlePanStart(e);
            }}
            ref={boardRef}
            style={{
                cursor: isPanning ? 'grabbing'
                    : isSpacePressed ? 'grab'
                        : isDragging ? 'grabbing'
                            : drawingMode === 'brush' ? 'crosshair'
                                : drawingMode === 'eraser' ? 'pointer'
                                    : 'default',
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.08) 1px, transparent 0)',
                backgroundSize: '24px 24px'
            }}
        >
            {/* Toolbar - Bottom Center - Hidden in Presentation Mode */}
            {isToolbarVisible && !isPresentationMode && (
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

                    {/* Search Input */}
                    <input
                        type="text"
                        placeholder="🔍 Buscar notas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            color: '#fff',
                            fontSize: '14px',
                            width: '200px',
                            outline: 'none',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#818cf8'}
                        onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                    />

                    {/* Image Upload Button */}
                    <input
                        type="file"
                        id="image-upload"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                handleImageUpload(file);
                                e.target.value = ''; // Reset input
                            }
                        }}
                    />
                    <button
                        onClick={() => document.getElementById('image-upload')?.click()}
                        style={{
                            backgroundColor: 'rgba(129, 140, 248, 0.2)',
                            border: '2px solid transparent',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: '#818cf8',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(129, 140, 248, 0.3)';
                            e.currentTarget.style.borderColor = '#818cf8';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(129, 140, 248, 0.2)';
                            e.currentTarget.style.borderColor = 'transparent';
                        }}
                        title="Upload Imagem"
                    >
                        <Upload size={16} />
                        <span>Imagem</span>
                    </button>

                    {/* Drawing Tools Buttons */}
                    <button
                        onClick={() => setDrawingMode(drawingMode === 'brush' ? 'none' : 'brush')}
                        style={{
                            backgroundColor: drawingMode === 'brush' ? 'rgba(129, 140, 248, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                            border: drawingMode === 'brush' ? '2px solid #818cf8' : '2px solid transparent',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: drawingMode === 'brush' ? '#818cf8' : '#fff',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                        }}
                        title="Modo Pincel - Desenhar livre"
                    >
                        <Pen size={16} />
                        <span>Pincel</span>
                    </button>

                    <button
                        onClick={() => setDrawingMode(drawingMode === 'eraser' ? 'none' : 'eraser')}
                        style={{
                            backgroundColor: drawingMode === 'eraser' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                            border: drawingMode === 'eraser' ? '2px solid #ef4444' : '2px solid transparent',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: drawingMode === 'eraser' ? '#ef4444' : '#fff',
                            fontSize: '14px',
                            transition: 'all 0.2s',
                        }}
                        title="Modo Borracha - Apagar desenhos"
                    >
                        <Eraser size={16} />
                        <span>Borracha</span>
                    </button>

                    {/* Drawing Controls */}
                    {drawingMode === 'brush' && (
                        <>
                            <input
                                type="color"
                                value={brushColor}
                                onChange={(e) => setBrushColor(e.target.value)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    border: '2px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: 'transparent'
                                }}
                                title="Cor do pincel"
                            />
                            <select
                                value={brushWidth}
                                onChange={(e) => setBrushWidth(Number(e.target.value))}
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    border: '2px solid rgba(255, 255, 255, 0.15)',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                                title="Espessura do pincel"
                            >
                                <option value="1">Fino (1px)</option>
                                <option value="3">Médio (3px)</option>
                                <option value="5">Grosso (5px)</option>
                                <option value="8">Muito Grosso (8px)</option>
                            </select>
                        </>
                    )}

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
            )}

            {/* Presentation Mode - Exit Button */}
            {isPresentationMode && (
                <button
                    onClick={() => {
                        setIsPresentationMode(false);
                        setIsToolbarVisible(true);
                    }}
                    style={{
                        position: 'fixed',
                        top: '24px',
                        right: '24px',
                        zIndex: 9999,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    <Presentation size={16} />
                    <span>Sair da Apresentação (P)</span>
                </button>
            )}

            {/* Board Content - Notes, Images, Connections, Drawings */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
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
                        pointerEvents: drawingMode === 'eraser' ? 'auto' : 'none',
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
                                    stroke={connection.color || '#818cf8'}
                                    strokeWidth="2"
                                    strokeDasharray={connection.style === 'dashed' ? '5,5' : 'none'}
                                    style={{ pointerEvents: 'none' }}
                                />
                                {/* Arrow marker at the end */}
                                <circle
                                    cx={x2}
                                    cy={y2}
                                    r="4"
                                    fill={connection.color || '#818cf8'}
                                    style={{ pointerEvents: 'none' }}
                                />
                                {/* Label text */}
                                {connection.label && (
                                    <text
                                        x={(x1 + x2) / 2}
                                        y={(y1 + y2) / 2 - 8}
                                        fill={connection.color || '#818cf8'}
                                        fontSize="12"
                                        fontWeight="600"
                                        textAnchor="middle"
                                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                                    >
                                        {connection.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Drawings - saved and current */}
                    {drawings.map((drawing) => (
                        <path
                            key={drawing.id}
                            d={drawing.path}
                            stroke={drawing.color}
                            strokeWidth={drawingMode === 'eraser' ? drawing.width + 8 : drawing.width}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{
                                pointerEvents: drawingMode === 'eraser' ? 'stroke' : 'none',
                                cursor: drawingMode === 'eraser' ? 'pointer' : 'default',
                                opacity: drawingMode === 'eraser' ? 0.7 : 1
                            }}
                            onClick={async (e) => {
                                if (drawingMode === 'eraser') {
                                    e.stopPropagation();
                                    try {
                                        await deleteDoc(doc(db, 'strategyDrawings', drawing.id));
                                    } catch (error) {
                                        console.error('Failed to delete drawing:', error);
                                    }
                                }
                            }}
                        />
                    ))}

                    {/* Current drawing path */}
                    {isDrawing && currentPath && (
                        <path
                            d={currentPath}
                            stroke={brushColor}
                            strokeWidth={brushWidth}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ pointerEvents: 'none' }}
                        />
                    )}
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

                {/* Images */}
                {images.map((image) => (
                    <div
                        key={image.id}
                        style={{
                            position: 'absolute',
                            left: image.x,
                            top: image.y,
                            width: image.width,
                            height: image.height,
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            cursor: isDraggingImage && draggedImageId === image.id ? 'grabbing' : 'grab',
                            zIndex: draggedImageId === image.id ? 50 : 5,
                        }}
                        onMouseDown={(e) => {
                            if (isSpacePressed) return;
                            e.stopPropagation();
                            setDragOffset({ x: e.clientX - image.x, y: e.clientY - image.y });
                            handleImageMouseDown(e, image.id);
                        }}
                    >
                        <img
                            src={image.imageUrl}
                            alt="Strategy Image"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    </div>
                ))}

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
                            outline: selectedNoteForConnection === note.id ? '3px solid #818cf8' :
                                selectedNotes.includes(note.id) ? '3px solid #22c55e' : 'none',
                            outlineOffset: '2px',
                        }}
                        onMouseEnter={() => setHoveredNoteId(note.id)}
                        onMouseLeave={() => setHoveredNoteId(null)}
                        onClick={(e) => handleNoteClick(note.id, e)}
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

                        {/* Resize Handles - Only show on hover or when selected */}
                        {(hoveredNoteId === note.id || selectedNotes.includes(note.id) || selectedNoteId === note.id) && (
                            <>
                                {/* Corner Handles */}
                                <div
                                    className="absolute opacity-100 transition-opacity"
                                    style={{ right: -4, bottom: -4, width: 12, height: 12, backgroundColor: '#818cf8', borderRadius: '50%', cursor: 'nwse-resize', zIndex: 100 }}
                                    onMouseDown={(e) => handleResizeStart(e, note.id, 'se')}
                                />
                                <div
                                    className="absolute opacity-100 transition-opacity"
                                    style={{ left: -4, bottom: -4, width: 12, height: 12, backgroundColor: '#818cf8', borderRadius: '50%', cursor: 'nesw-resize', zIndex: 100 }}
                                    onMouseDown={(e) => handleResizeStart(e, note.id, 'sw')}
                                />
                                <div
                                    className="absolute opacity-100 transition-opacity"
                                    style={{ right: -4, top: -4, width: 12, height: 12, backgroundColor: '#818cf8', borderRadius: '50%', cursor: 'nesw-resize', zIndex: 100 }}
                                    onMouseDown={(e) => handleResizeStart(e, note.id, 'ne')}
                                />
                                <div
                                    className="absolute opacity-100 transition-opacity"
                                    style={{ left: -4, top: -4, width: 12, height: 12, backgroundColor: '#818cf8', borderRadius: '50%', cursor: 'nwse-resize', zIndex: 100 }}
                                    onMouseDown={(e) => handleResizeStart(e, note.id, 'nw')}
                                />

                                {/* Edge Handles */}
                                <div
                                    className="absolute opacity-100 transition-opacity"
                                    style={{ right: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 40, backgroundColor: '#818cf8', borderRadius: 4, cursor: 'ew-resize', zIndex: 100 }}
                                    onMouseDown={(e) => handleResizeStart(e, note.id, 'e')}
                                />
                                <div
                                    className="absolute opacity-100 transition-opacity"
                                    style={{ left: -4, top: '50%', transform: 'translateY(-50%)', width: 8, height: 40, backgroundColor: '#818cf8', borderRadius: 4, cursor: 'ew-resize', zIndex: 100 }}
                                    onMouseDown={(e) => handleResizeStart(e, note.id, 'w')}
                                />
                                <div
                                    className="absolute opacity-100 transition-opacity"
                                    style={{ bottom: -4, left: '50%', transform: 'translateX(-50%)', height: 8, width: 40, backgroundColor: '#818cf8', borderRadius: 4, cursor: 'ns-resize', zIndex: 100 }}
                                    onMouseDown={(e) => handleResizeStart(e, note.id, 's')}
                                />
                                <div
                                    className="absolute opacity-100 transition-opacity"
                                    style={{ top: -4, left: '50%', transform: 'translateX(-50%)', height: 8, width: 40, backgroundColor: '#818cf8', borderRadius: 4, cursor: 'ns-resize', zIndex: 100 }}
                                    onMouseDown={(e) => handleResizeStart(e, note.id, 'n')}
                                />
                            </>
                        )}

                        {/* Content */}
                        <textarea
                            className="flex-1 w-full bg-transparent border-none resize-none px-4 pb-4 focus:outline-none text-gray-900 placeholder-black/30 font-medium text-lg leading-snug cursor-text"
                            value={note.content}
                            onChange={(e) => updateNoteContent(note.id, e.target.value)}
                            placeholder="Escreva sua estratégia..."
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}
                        />
                    </div>
                ))}

            </div>
        </div >
    );
};
