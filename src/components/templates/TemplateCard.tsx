import React from 'react';
import { Copy, Edit2 } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import type { Template } from '../../types';
import { useToast } from '../../components/ui/Toast';

interface TemplateCardProps {
    template: Template;
    onEdit?: (template: Template) => void;
    onDelete?: (template: Template) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onEdit, onDelete }) => {
    const toast = useToast();

    const handleCopy = () => {
        navigator.clipboard.writeText(template.content);
        toast.success('Template copiado!');
    };

    return (
        <Card className="template-card" padding="md" variant="interactive">
            <div className="template-card-header">
                <div>
                    <h3 className="template-title">{template.title}</h3>
                    {template.description && <p className="template-description">{template.description}</p>}
                </div>
                <div className={`intensity-badge intensity-${template.intensity.toLowerCase()}`}>
                    {template.intensity}
                </div>
            </div>

            <div className="template-content-preview">
                {template.content}
            </div>

            <div className="template-footer">
                <div className="flex gap-2">
                    {onEdit && (
                        <Button variant="ghost" size="sm" icon={<Edit2 size={16} />} onClick={() => onEdit(template)}>
                            Editar
                        </Button>
                    )}
                    {onDelete && (
                        <Button variant="ghost" size="sm" className="text-error hover:text-error hover:bg-error/10" onClick={() => onDelete(template)}>
                            Excluir
                        </Button>
                    )}
                </div>
                <Button variant="secondary" size="sm" icon={<Copy size={16} />} onClick={handleCopy}>
                    Copiar
                </Button>
            </div>
        </Card>
    );
};
