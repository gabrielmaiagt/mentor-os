import React, { useState } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { Card } from '../ui';

interface KeywordManagerProps {
  title: string;
  description: string;
  keywords: string[];
  onAddKeyword: (word: string) => void;
  onRemoveKeyword: (index: number) => void;
  placeholder?: string;
  badgeColor?: string;
}

export const KeywordManager: React.FC<KeywordManagerProps> = ({
  title,
  description,
  keywords,
  onAddKeyword,
  onRemoveKeyword,
  placeholder = 'Adicionar...',
  badgeColor = 'var(--accent-primary)'
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // Handle comma-separated values
    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
      parts.forEach(part => onAddKeyword(part));
    } else {
      onAddKeyword(trimmed);
    }

    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Card padding="md" className="glass-card flex-1 min-w-[280px]">
      <div className="flex flex-col gap-3 h-full">
        <div>
          <h4 className="font-semibold text-primary text-base flex items-center gap-1.5">
            <Tag size={16} style={{ color: badgeColor }} />
            {title}
          </h4>
          <p className="text-xs text-secondary mt-1">{description}</p>
        </div>

        {/* Chips Container */}
        <div 
          className="flex flex-wrap gap-1.5 p-3 rounded-lg flex-1 min-h-[100px] align-content-start overflow-y-auto"
          style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(255, 255, 255, 0.08)' }}
        >
          {keywords.length === 0 ? (
            <span className="text-xs text-muted m-auto italic">Nenhuma palavra cadastrada</span>
          ) : (
            keywords.map((word, idx) => (
              <span
                key={idx}
                className="text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full flex items-center gap-1 transition-all"
                style={{ 
                  background: `rgba(${badgeColor.includes('accent') ? '99, 102, 241' : '139, 92, 246'}, 0.15)`, 
                  color: badgeColor.includes('accent') ? '#818cf8' : '#a78bfa',
                  border: `1px solid rgba(${badgeColor.includes('accent') ? '99, 102, 241' : '139, 92, 246'}, 0.2)`
                }}
              >
                {word}
                <button
                  type="button"
                  onClick={() => onRemoveKeyword(idx)}
                  className="rounded-full p-0.5 hover:bg-white/10 text-tertiary hover:text-primary transition-colors"
                >
                  <X size={12} />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Input area */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 input-field"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '6px 12px',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px'
            }}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inputValue.trim()}
            className="p-2 rounded-lg bg-accent-primary hover:bg-accent-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            style={{ width: '36px', height: '36px' }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
};
