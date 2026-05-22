import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    CloudUpload,
    Image,
    Video,
    HardDrive,
    Files,
    Search,
    Copy,
    Check,
    Trash2,
    X,
    Link,
    Code2,
    Play,
    FolderOpen,
} from 'lucide-react';
import {
    uploadMedia,
    getMediaFiles,
    deleteMedia,
    formatBytes,
    getEmbedCode,
} from '../../services/mediaService';
import type { MediaFile, MediaCategory, UploadProgress } from '../../services/mediaService';
import { useToast } from '../../components/ui/Toast';
import './MediaHub.css';

type FilterType = 'all' | 'image' | 'video';

interface UploadItem {
    id: string;
    name: string;
    progress: UploadProgress | null;
    done: boolean;
    error: string | null;
}

const CATEGORIES: { value: MediaCategory; label: string }[] = [
    { value: 'geral', label: 'Geral' },
    { value: 'thumbnails', label: 'Thumbnails' },
    { value: 'criativos', label: 'Criativos' },
    { value: 'aulas', label: 'Aulas' },
    { value: 'recursos', label: 'Recursos' },
];

const ACCEPTED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/quicktime',
];

const MAX_IMAGE_SIZE = 50 * 1024 * 1024;  // 50 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB

export default function MediaHub() {
    const toast = useToast();

    // Gallery state
    const [files, setFiles] = useState<MediaFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [search, setSearch] = useState('');

    // Upload state
    const [uploadCategory, setUploadCategory] = useState<MediaCategory>('geral');
    const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Modal state
    const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
    const [copiedField, setCopiedField] = useState<'url' | 'embed' | null>(null);

    // Card-level copy state
    const [cardCopied, setCardCopied] = useState<{ id: string; field: 'url' | 'embed' } | null>(null);

    // Load files
    const loadFiles = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMediaFiles();
            setFiles(data);
        } catch (err: any) {
            toast.error('Erro ao carregar arquivos', err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    // Filtered gallery
    const filtered = files.filter((f) => {
        if (filterType !== 'all' && f.type !== filterType) return false;
        if (filterCategory !== 'all' && f.category !== filterCategory) return false;
        if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    // Stats
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    const imageCount = files.filter((f) => f.type === 'image').length;
    const videoCount = files.filter((f) => f.type === 'video').length;

    // File validation
    function validateFile(file: File): string | null {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            return `Tipo não suportado: ${file.type}`;
        }
        if (file.type.startsWith('video/') && file.size > MAX_VIDEO_SIZE) {
            return `Vídeo muito grande (máx 500 MB)`;
        }
        if (file.type.startsWith('image/') && file.size > MAX_IMAGE_SIZE) {
            return `Imagem muito grande (máx 50 MB)`;
        }
        return null;
    }

    // Process selected files
    async function processFiles(fileList: FileList) {
        const toUpload = Array.from(fileList);
        if (toUpload.length === 0) return;

        const items: UploadItem[] = toUpload.map((f) => ({
            id: `${Date.now()}-${f.name}`,
            name: f.name,
            progress: null,
            done: false,
            error: null,
        }));

        setUploadQueue((prev) => [...prev, ...items]);

        for (let i = 0; i < toUpload.length; i++) {
            const file = toUpload[i];
            const item = items[i];

            const validationError = validateFile(file);
            if (validationError) {
                setUploadQueue((prev) =>
                    prev.map((u) => u.id === item.id ? { ...u, error: validationError } : u)
                );
                continue;
            }

            try {
                const saved = await uploadMedia(file, uploadCategory, (progress) => {
                    setUploadQueue((prev) =>
                        prev.map((u) => u.id === item.id ? { ...u, progress } : u)
                    );
                });

                setUploadQueue((prev) =>
                    prev.map((u) => u.id === item.id ? { ...u, done: true } : u)
                );

                // Prepend the new file to the gallery
                setFiles((prev) => [saved, ...prev]);
                toast.success(`Upload concluído: ${file.name}`);
            } catch (err: any) {
                setUploadQueue((prev) =>
                    prev.map((u) =>
                        u.id === item.id ? { ...u, error: err.message ?? 'Erro no upload' } : u
                    )
                );
                toast.error('Erro no upload', err.message);
            }
        }

        // Clear done items after 3s
        setTimeout(() => {
            setUploadQueue((prev) => prev.filter((u) => !u.done && !u.error));
        }, 3000);
    }

    function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files) {
            processFiles(e.target.files);
            e.target.value = '';
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
    }

    async function handleDelete(file: MediaFile, e: React.MouseEvent) {
        e.stopPropagation();
        if (!window.confirm(`Deletar "${file.name}"?`)) return;
        try {
            await deleteMedia(file.id, file.storagePath);
            setFiles((prev) => prev.filter((f) => f.id !== file.id));
            if (selectedFile?.id === file.id) setSelectedFile(null);
            toast.success('Arquivo deletado');
        } catch (err: any) {
            toast.error('Erro ao deletar', err.message);
        }
    }

    async function copyToClipboard(text: string, field: 'url' | 'embed', fileId?: string) {
        try {
            await navigator.clipboard.writeText(text);
            if (fileId) {
                setCardCopied({ id: fileId, field });
                setTimeout(() => setCardCopied(null), 2000);
            } else {
                setCopiedField(field);
                setTimeout(() => setCopiedField(null), 2000);
            }
        } catch {
            toast.error('Não foi possível copiar');
        }
    }

    function handleCardCopyUrl(file: MediaFile, e: React.MouseEvent) {
        e.stopPropagation();
        copyToClipboard(file.url, 'url', file.id);
    }

    function handleCardCopyEmbed(file: MediaFile, e: React.MouseEvent) {
        e.stopPropagation();
        copyToClipboard(getEmbedCode(file), 'embed', file.id);
    }

    const isCardCopied = (id: string, field: 'url' | 'embed') =>
        cardCopied?.id === id && cardCopied.field === field;

    return (
        <div className="media-hub">
            {/* Header */}
            <div className="media-hub-header">
                <div className="media-hub-title-row">
                    <CloudUpload size={28} className="media-hub-title-icon" />
                    <h1>Media Hub</h1>
                </div>

                <div className="media-hub-stats">
                    <div className="stat-card">
                        <div className="stat-icon purple"><Files size={20} /></div>
                        <div className="stat-info">
                            <span className="stat-value">{files.length}</span>
                            <span className="stat-label">Total de arquivos</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon cyan"><HardDrive size={20} /></div>
                        <div className="stat-info">
                            <span className="stat-value">{formatBytes(totalSize)}</span>
                            <span className="stat-label">Espaço utilizado</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green"><Image size={20} /></div>
                        <div className="stat-info">
                            <span className="stat-value">{imageCount}</span>
                            <span className="stat-label">Imagens</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon orange"><Video size={20} /></div>
                        <div className="stat-info">
                            <span className="stat-value">{videoCount}</span>
                            <span className="stat-label">Vídeos</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Zone */}
            <div className="upload-section">
                <label
                    className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={ACCEPTED_TYPES.join(',')}
                        className="upload-zone-input"
                        onChange={handleFileInput}
                    />
                    <div className="upload-zone-icon">
                        <CloudUpload size={32} />
                    </div>
                    <p className="upload-zone-title">
                        {dragOver ? 'Solte os arquivos aqui!' : 'Arraste arquivos ou clique para fazer upload'}
                    </p>
                    <p className="upload-zone-subtitle">Imagens (até 50 MB) · Vídeos (até 500 MB)</p>
                    <p className="upload-zone-hint">JPG, PNG, GIF, WEBP, MP4, MOV, AVI, WEBM</p>

                    <div
                        className="upload-category-row"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="upload-category-label">Categoria:</span>
                        <select
                            className="upload-category-select"
                            value={uploadCategory}
                            onChange={(e) => setUploadCategory(e.target.value as MediaCategory)}
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="upload-zone-btn">Selecionar Arquivos</div>
                </label>

                {/* Upload Queue */}
                {uploadQueue.length > 0 && (
                    <div className="upload-queue">
                        {uploadQueue.map((item) => (
                            <div key={item.id} className="upload-item">
                                <div className="upload-item-icon">
                                    {item.done
                                        ? <Check size={16} className="upload-item-done" style={{ color: 'var(--status-success)' }} />
                                        : item.error
                                            ? <X size={16} style={{ color: 'var(--status-error)' }} />
                                            : <CloudUpload size={16} />}
                                </div>
                                <div className="upload-item-info">
                                    <div className="upload-item-name">{item.name}</div>
                                    {item.error ? (
                                        <div className="upload-item-error">{item.error}</div>
                                    ) : (
                                        <div className="upload-item-progress-bar">
                                            <div
                                                className="upload-item-progress-fill"
                                                style={{ width: `${item.done ? 100 : item.progress?.percentage ?? 0}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                                {!item.error && (
                                    <span className="upload-item-pct">
                                        {item.done ? '✓' : `${item.progress?.percentage ?? 0}%`}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Gallery Toolbar */}
            <div className="gallery-toolbar">
                <div className="gallery-search">
                    <Search size={16} className="gallery-search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        className="gallery-search-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="gallery-filter-tabs">
                    {(['all', 'image', 'video'] as FilterType[]).map((t) => (
                        <button
                            key={t}
                            className={`filter-tab ${filterType === t ? 'active' : ''}`}
                            onClick={() => setFilterType(t)}
                        >
                            {t === 'all' ? 'Todos' : t === 'image' ? 'Imagens' : 'Vídeos'}
                        </button>
                    ))}
                </div>

                <select
                    className="gallery-category-select"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="all">Todas categorias</option>
                    {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                </select>
            </div>

            {/* Gallery Grid */}
            <div className="media-gallery">
                {loading ? (
                    <div className="gallery-empty">
                        <div className="gallery-empty-icon">
                            <CloudUpload size={32} />
                        </div>
                        <h3>Carregando arquivos...</h3>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="gallery-empty">
                        <div className="gallery-empty-icon">
                            <FolderOpen size={32} />
                        </div>
                        <h3>{files.length === 0 ? 'Nenhum arquivo ainda' : 'Nenhum resultado'}</h3>
                        <p>
                            {files.length === 0
                                ? 'Faça upload de imagens ou vídeos acima para começar.'
                                : 'Tente ajustar os filtros de busca.'}
                        </p>
                    </div>
                ) : (
                    filtered.map((file) => (
                        <div
                            key={file.id}
                            className="media-card"
                            onClick={() => setSelectedFile(file)}
                        >
                            <div className="media-card-preview">
                                {file.type === 'image' ? (
                                    <img src={file.url} alt={file.name} loading="lazy" />
                                ) : (
                                    <div className="media-card-video-thumb">
                                        <div className="media-card-play">
                                            <Play size={20} fill="currentColor" />
                                        </div>
                                    </div>
                                )}

                                {/* Hover overlay */}
                                <div className="media-card-overlay">
                                    <button
                                        className={`card-overlay-btn ${isCardCopied(file.id, 'url') ? 'copied' : ''}`}
                                        onClick={(e) => handleCardCopyUrl(file, e)}
                                        title="Copiar link"
                                    >
                                        {isCardCopied(file.id, 'url')
                                            ? <><Check size={12} /> Copiado!</>
                                            : <><Link size={12} /> Link</>}
                                    </button>
                                    <button
                                        className={`card-overlay-btn ${isCardCopied(file.id, 'embed') ? 'copied' : ''}`}
                                        onClick={(e) => handleCardCopyEmbed(file, e)}
                                        title="Copiar embed"
                                    >
                                        {isCardCopied(file.id, 'embed')
                                            ? <><Check size={12} /> Copiado!</>
                                            : <><Code2 size={12} /> Embed</>}
                                    </button>
                                    <button
                                        className="card-overlay-btn delete"
                                        onClick={(e) => handleDelete(file, e)}
                                        title="Deletar"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>

                            <div className="media-card-body">
                                <div className="media-card-name" title={file.name}>{file.name}</div>
                                <div className="media-card-meta">
                                    <span className="media-card-size">{formatBytes(file.size)}</span>
                                    <span className="media-card-badge">{file.category}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Detail Modal */}
            {selectedFile && (
                <div className="media-modal-backdrop" onClick={() => setSelectedFile(null)}>
                    <div className="media-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="media-modal-header">
                            <h2 className="media-modal-title">{selectedFile.name}</h2>
                            <button className="media-modal-close" onClick={() => setSelectedFile(null)}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="media-modal-body">
                            {/* Preview */}
                            <div className="media-modal-preview">
                                {selectedFile.type === 'image' ? (
                                    <img src={selectedFile.url} alt={selectedFile.name} />
                                ) : (
                                    <video src={selectedFile.url} controls />
                                )}
                            </div>

                            {/* Metadata */}
                            <div className="media-modal-info-grid">
                                <div className="modal-info-item">
                                    <span className="modal-info-label">Tipo</span>
                                    <span className="modal-info-value">{selectedFile.mimeType}</span>
                                </div>
                                <div className="modal-info-item">
                                    <span className="modal-info-label">Tamanho</span>
                                    <span className="modal-info-value">{formatBytes(selectedFile.size)}</span>
                                </div>
                                <div className="modal-info-item">
                                    <span className="modal-info-label">Categoria</span>
                                    <span className="modal-info-value">{selectedFile.category}</span>
                                </div>
                                <div className="modal-info-item">
                                    <span className="modal-info-label">Data</span>
                                    <span className="modal-info-value">
                                        {selectedFile.createdAt instanceof Date
                                            ? selectedFile.createdAt.toLocaleDateString('pt-BR')
                                            : '—'}
                                    </span>
                                </div>
                            </div>

                            {/* URL */}
                            <div className="media-modal-field">
                                <span className="media-modal-field-label">
                                    <Link size={14} /> Link Público (CDN)
                                </span>
                                <div className="media-modal-copy-row">
                                    <div className="media-modal-url" title={selectedFile.url}>
                                        {selectedFile.url}
                                    </div>
                                    <button
                                        className={`copy-btn ${copiedField === 'url' ? 'copied' : ''}`}
                                        onClick={() => copyToClipboard(selectedFile.url, 'url')}
                                    >
                                        {copiedField === 'url'
                                            ? <><Check size={14} /> <span>Copiado!</span></>
                                            : <><Copy size={14} /> <span>Copiar</span></>}
                                    </button>
                                </div>
                            </div>

                            {/* Embed */}
                            <div className="media-modal-field">
                                <span className="media-modal-field-label">
                                    <Code2 size={14} /> Código Embed HTML
                                </span>
                                <div className="media-modal-copy-row">
                                    <textarea
                                        className="media-modal-embed-code"
                                        readOnly
                                        value={getEmbedCode(selectedFile)}
                                    />
                                    <button
                                        className={`copy-btn ${copiedField === 'embed' ? 'copied' : ''}`}
                                        onClick={() => copyToClipboard(getEmbedCode(selectedFile), 'embed')}
                                    >
                                        {copiedField === 'embed'
                                            ? <><Check size={14} /> <span>Copiado!</span></>
                                            : <><Copy size={14} /> <span>Copiar</span></>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
