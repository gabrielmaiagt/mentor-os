import React, { useState, useEffect } from 'react';
import { Search, FileText, DollarSign, Scale, Users, CheckCircle, Plus } from 'lucide-react';
import { TemplateCard } from '../../components/templates';
import { mockTemplates } from '../../lib/mockTemplates';
import type { TemplateCategory, Template } from '../../types';
import { AddTemplateModal } from './AddTemplateModal';
import { Button } from '../../components/ui';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import './Templates.css';

const CATEGORIES: { key: TemplateCategory | 'ALL'; label: string; icon: React.ReactNode }[] = [
    { key: 'ALL', label: 'Todos', icon: <FileText size={18} /> },
    { key: 'SALES', label: 'Vendas', icon: <DollarSign size={18} /> },
    { key: 'DELIVERY', label: 'Entrega', icon: <Users size={18} /> },
    { key: 'FINANCE', label: 'Financeiro', icon: <CheckCircle size={18} /> }, // Using CheckCircle as generic finance-related or DollarSign
    { key: 'LEGAL', label: 'Jurídico', icon: <Scale size={18} /> },
];

export const TemplatesPage: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [dbTemplates, setDbTemplates] = useState<Template[]>([]);

    // Real-time listener for templates
    useEffect(() => {
        const q = query(collection(db, 'templates'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const temps = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Template[];
            setDbTemplates(temps);
        }, (error) => {
            console.error("Error fetching templates:", error);
        });

        return () => unsubscribe();
    }, []);

    // Merge mocks with DB templates
    const allTemplates = [...dbTemplates, ...mockTemplates];

    const filteredTemplates = allTemplates.filter(template => {
        const matchesCategory = selectedCategory === 'ALL' || template.category === selectedCategory;
        const matchesSearch =
            template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.content.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    return (
        <div className="templates-page">
            {/* Sidebar */}
            <div className="templates-sidebar">
                <div className="px-4 mb-4">
                    <h2 className="text-xl font-bold mb-2">Templates</h2>
                    <Button
                        variant="primary"
                        className="w-full justify-center"
                        icon={<Plus size={16} />}
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        Novo Template
                    </Button>
                </div>

                {CATEGORIES.map(cat => (
                    <button
                        key={cat.key}
                        className={`category-filter ${selectedCategory === cat.key ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat.key)}
                    >
                        {cat.icon}
                        <span>{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="templates-content">
                <div className="templates-header">
                    <div>
                        <h3 className="text-lg font-semibold text-primary">
                            {selectedCategory === 'ALL' ? 'Todos os Templates' : CATEGORIES.find(c => c.key === selectedCategory)?.label}
                        </h3>
                        <p className="text-sm text-secondary">
                            {filteredTemplates.length} templates encontrados
                        </p>
                    </div>

                    <div className="templates-search">
                        <Search className="search-icon" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="templates-grid">
                    {filteredTemplates.map(template => (
                        <TemplateCard key={template.id} template={template} />
                    ))}

                    {filteredTemplates.length === 0 && (
                        <div className="col-span-full text-center py-12 text-tertiary">
                            Nenhum template encontrado. Crie o primeiro!
                        </div>
                    )}
                </div>
            </div>

            <AddTemplateModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
        </div>
    );
};

export default TemplatesPage;
