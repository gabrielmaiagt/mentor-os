import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, MessageSquare, ChevronDown } from 'lucide-react';
import type { MessageTemplate } from '../../types';
import './TemplateSelector.css';

interface TemplateSelectorProps {
    onSelect: (content: string) => void;
    category?: 'WHATSAPP' | 'EMAIL' | 'GENERIC';
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect, category = 'WHATSAPP' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchTemplates = async () => {
        if (templates.length > 0) return;

        setLoading(true);
        try {
            const q = query(
                collection(db, 'templates_message'),
                orderBy('title', 'asc')
            );
            const snapshot = await getDocs(q);
            const fetched = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as MessageTemplate[];

            // Filter by category if strictly needed, but for now show all related
            const filtered = category ? fetched.filter(t => t.category === category) : fetched;
            setTemplates(filtered);
        } catch (error) {
            console.error("Error fetching templates:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        if (!isOpen) {
            fetchTemplates();
        }
        setIsOpen(!isOpen);
    };

    const handleSelect = (template: MessageTemplate) => {
        onSelect(template.content);
        setIsOpen(false);
    };

    const filteredTemplates = templates.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="template-selector" ref={dropdownRef}>
            <button
                type="button"
                className={`selector-trigger ${isOpen ? 'active' : ''}`}
                onClick={handleToggle}
                title="Inserir Resposta Rápida"
            >
                <div className="trigger-content">
                    <MessageSquare size={16} />
                    <span>Templates</span>
                </div>
                <ChevronDown size={14} className={`trigger-arrow ${isOpen ? 'rotate' : ''}`} />
            </button>

            {isOpen && (
                <div className="selector-dropdown">
                    <div className="dropdown-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="Buscar resposta rápida..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="dropdown-list">
                        {loading ? (
                            <div className="dropdown-loading">Carregando...</div>
                        ) : filteredTemplates.length > 0 ? (
                            filteredTemplates.map(template => (
                                <div
                                    key={template.id}
                                    className="dropdown-item"
                                    onClick={() => handleSelect(template)}
                                >
                                    <div className="item-title">{template.title}</div>
                                    <div className="item-preview">{template.content}</div>
                                </div>
                            ))
                        ) : (
                            <div className="dropdown-empty">
                                {searchQuery ? 'Nenhum template encontrado' : 'Nenhum template cadastrado'}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
