import React, { useState } from 'react';
import { ExternalLink, Calendar, Layers, Check, Trash2, Edit3, DollarSign, Bookmark, FileText } from 'lucide-react';
import { Card, Button } from '../ui';
import type { AdLibraryOffer, AdLibraryOfferStatus } from '../../types/adlibrary';

interface AdOfferCardProps {
  offer: AdLibraryOffer;
  isTemp?: boolean; // temporary offer during live mining
  onSave?: (offer: AdLibraryOffer) => void;
  onUpdateStatus?: (id: string, status: AdLibraryOfferStatus) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onUpdateDetails?: (id: string, details: { niche: string; subNiche: string; offerType: string }) => void;
  onDelete?: (id: string) => void;
}

export const AdOfferCard: React.FC<AdOfferCardProps> = ({
  offer,
  isTemp = false,
  onSave,
  onUpdateStatus,
  onUpdateNotes,
  onUpdateDetails,
  onDelete,
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(offer.notes || '');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  
  const [detailFields, setDetailFields] = useState({
    niche: offer.niche || 'Artesanato',
    subNiche: offer.subNiche || '',
    offerType: offer.offerType || 'X1 / WhatsApp'
  });

  const handleSaveNotes = () => {
    if (offer.id && onUpdateNotes) {
      onUpdateNotes(offer.id, notesText);
      setIsEditingNotes(false);
    }
  };

  const handleSaveDetails = () => {
    if (offer.id && onUpdateDetails) {
      onUpdateDetails(offer.id, detailFields);
      setIsEditingDetails(false);
    }
  };

  return (
    <Card padding="md" className="glass-card flex flex-col justify-between gap-4 relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
      {/* Visual Indicator of Days Running */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: offer.daysRunning >= 15 
            ? 'linear-gradient(90deg, #22c55e, #10b981)' 
            : 'linear-gradient(90deg, #6366f1, #8b5cf6)'
        }}
      />

      <div className="flex flex-col gap-3">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 border-b pb-2.5 border-subtle">
          <div>
            <h4 className="font-semibold text-primary text-base line-clamp-1">{offer.pageName}</h4>
            <span className="text-[10px] text-secondary font-medium tracking-wide uppercase">Keyword: "{offer.keyword}"</span>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-bold text-green-400 bg-green-950/40 border border-green-800/40 px-2 py-0.5 rounded">
              {offer.pageAdCount} ads ativos
            </span>
            <span className="text-[10px] text-muted">
              {offer.daysRunning} dias rodando
            </span>
          </div>
        </div>

        {/* Badges row */}
        {offer.ctaSignals && offer.ctaSignals.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {offer.ctaSignals.map((sig, idx) => (
              <span 
                key={idx} 
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
                style={{
                  background: sig === 'WhatsApp' ? 'rgba(34, 197, 94, 0.15)' :
                              sig === 'Renda Extra' ? 'rgba(245, 158, 11, 0.15)' :
                              sig === 'Curso/Material' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                  color: sig === 'WhatsApp' ? '#4ade80' :
                         sig === 'Renda Extra' ? '#fbbf24' :
                         sig === 'Curso/Material' ? '#818cf8' : '#e2e8f0',
                  border: `1px solid ${
                    sig === 'WhatsApp' ? 'rgba(34, 197, 94, 0.25)' :
                    sig === 'Renda Extra' ? 'rgba(245, 158, 11, 0.25)' :
                    sig === 'Curso/Material' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.15)'
                  }`
                }}
              >
                {sig}
              </span>
            ))}
          </div>
        )}

        {/* Niche, Subniche & Offer Type */}
        <div className="bg-white/[0.01] border border-white/[0.04] p-2.5 rounded-lg text-xs space-y-1.5">
          {isEditingDetails ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="text-[9px] text-secondary font-bold uppercase">Nicho</label>
                  <input 
                    type="text" 
                    value={detailFields.niche} 
                    onChange={e => setDetailFields({...detailFields, niche: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded px-1.5 py-0.5 text-xs text-primary"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-secondary font-bold uppercase">Subnicho</label>
                  <input 
                    type="text" 
                    value={detailFields.subNiche} 
                    onChange={e => setDetailFields({...detailFields, subNiche: e.target.value})}
                    placeholder="Ex: Laços"
                    className="w-full bg-black/30 border border-white/10 rounded px-1.5 py-0.5 text-xs text-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] text-secondary font-bold uppercase">Tipo de Oferta</label>
                <input 
                  type="text" 
                  value={detailFields.offerType} 
                  onChange={e => setDetailFields({...detailFields, offerType: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded px-1.5 py-0.5 text-xs text-primary"
                />
              </div>
              <div className="flex justify-end gap-1">
                <Button variant="ghost" onClick={() => setIsEditingDetails(false)} className="px-2 py-0.5 text-[10px]">Cancelar</Button>
                <Button variant="primary" onClick={handleSaveDetails} className="px-2 py-0.5 text-[10px]">Salvar</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center text-secondary">
                <span className="flex items-center gap-1"><Layers size={12} /> Nicho/Subnicho:</span>
                <span className="text-primary font-medium">{offer.niche} {offer.subNiche ? `› ${offer.subNiche}` : ''}</span>
              </div>
              <div className="flex justify-between items-center text-secondary">
                <span className="flex items-center gap-1"><DollarSign size={12} /> Tipo de Oferta:</span>
                <span className="text-primary font-medium">{offer.offerType}</span>
              </div>
              <div className="flex justify-between items-center text-secondary">
                <span className="flex items-center gap-1"><Calendar size={12} /> Data de Início:</span>
                <span className="text-primary font-medium">{new Date(offer.startDate).toLocaleDateString('pt-BR')}</span>
              </div>
              {!isTemp && onUpdateDetails && (
                <button 
                  onClick={() => setIsEditingDetails(true)} 
                  className="text-[10px] text-accent-primary hover:underline flex items-center gap-1 mt-1 font-medium ml-auto"
                >
                  <Edit3 size={10} /> Editar Detalhes
                </button>
              )}
            </>
          )}
        </div>

        {/* Copy/Text area */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
            <FileText size={12} /> Texto do Anúncio:
          </span>
          <div className="bg-black/20 p-2.5 rounded border border-subtle max-h-[85px] overflow-y-auto text-xs text-secondary leading-relaxed whitespace-pre-wrap font-sans">
            {offer.adText || <span className="italic text-muted">Sem texto de criativo</span>}
          </div>
        </div>

        {/* Notes area */}
        <div className="border-t border-dashed pt-2.5 mt-1">
          {isEditingNotes ? (
            <div className="flex flex-col gap-1.5">
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Adicione observações da oferta..."
                rows={2}
                className="w-full text-xs input-field"
                style={{ background: 'rgba(0,0,0,0.3)', padding: '6px' }}
              />
              <div className="flex justify-end gap-1">
                <Button variant="ghost" onClick={() => setIsEditingNotes(false)} className="px-2 py-1 text-[10px]">Cancelar</Button>
                <Button variant="primary" onClick={handleSaveNotes} className="px-2 py-1 text-[10px]">Salvar</Button>
              </div>
            </div>
          ) : (
            <div className="text-xs">
              <span className="font-semibold text-primary block mb-0.5">Observação:</span>
              <p className="text-secondary italic bg-white/[0.01] p-2 rounded border border-white/[0.02]">
                {offer.notes || 'Sem observações ainda. Adicione pontos fortes, CTA ou ticket provável.'}
              </p>
              {!isTemp && onUpdateNotes && (
                <button 
                  onClick={() => setIsEditingNotes(true)} 
                  className="text-[10px] text-accent-primary hover:underline flex items-center gap-1 mt-1 font-medium"
                >
                  <Edit3 size={10} /> Editar Observação
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 border-t pt-3 border-subtle mt-1.5">
        <div className="grid grid-cols-2 gap-2">
          <a
            href={offer.libraryLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-subtle hover:bg-white/5 text-xs text-primary font-medium transition-colors"
          >
            📚 Biblioteca <ExternalLink size={12} />
          </a>
          <a
            href={offer.adLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-subtle hover:bg-white/5 text-xs text-primary font-medium transition-colors"
          >
            🔗 Anúncio <ExternalLink size={12} />
          </a>
        </div>

        {isTemp ? (
          <Button
            variant="primary"
            onClick={() => onSave && onSave(offer)}
            className="w-full flex items-center justify-center gap-1.5 text-xs py-2"
          >
            <Bookmark size={14} /> Salvar Oferta no Dashboard
          </Button>
        ) : (
          <div className="flex gap-2">
            {offer.status === 'NEW' && onUpdateStatus && (
              <Button
                variant="secondary"
                onClick={() => onUpdateStatus(offer.id!, 'SAVED')}
                className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 text-green-400 border border-green-900/30 bg-green-950/20 hover:bg-green-950/40"
              >
                <Check size={14} /> Arquivar
              </Button>
            )}
            
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(offer.id!)}
                className="p-1.5 rounded-lg border border-red-900/30 bg-red-950/10 text-error hover:bg-red-950/30 transition-colors flex items-center justify-center"
                style={{ width: '34px', height: '34px' }}
                title="Excluir Oferta"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
