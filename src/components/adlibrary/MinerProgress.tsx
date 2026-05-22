import React, { useEffect, useRef } from 'react';
import { Play, Square, Loader, AlertTriangle, CheckCircle, Database, Eye, FileCheck } from 'lucide-react';
import { Card, Button } from '../ui';
import type { ScanProgress } from '../../types/adlibrary';

interface MinerProgressProps {
  progress: ScanProgress;
  onCancel: () => void;
}

export const MinerProgress: React.FC<MinerProgressProps> = ({ progress, onCancel }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll logs to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [progress.logs]);

  const percentage = progress.totalCombinations > 0 
    ? Math.round((progress.currentCombinationIndex / progress.totalCombinations) * 100) 
    : 0;

  return (
    <Card padding="md" className="glass-card mb-6">
      <div className="flex flex-col gap-5">
        
        {/* Header & Status Indicator */}
        <div className="flex items-center justify-between border-b pb-3 border-subtle">
          <div className="flex items-center gap-2.5">
            {progress.status === 'running' && (
              <Loader className="text-accent-primary animate-spin" size={20} />
            )}
            {progress.status === 'done' && (
              <CheckCircle className="text-success" size={20} />
            )}
            {progress.status === 'error' && (
              <AlertTriangle className="text-error" size={20} />
            )}
            {progress.status === 'idle' && (
              <Play className="text-muted" size={20} />
            )}
            <h3 className="font-semibold text-lg">
              {progress.status === 'running' && 'Minerador Rodando...'}
              {progress.status === 'done' && 'Mineração Concluída!'}
              {progress.status === 'error' && 'Mineração com Erro'}
              {progress.status === 'idle' && 'Minerador Pronto'}
            </h3>
          </div>

          {progress.status === 'running' && (
            <Button 
              variant="ghost" 
              onClick={onCancel}
              className="text-error hover:bg-error/10 flex items-center gap-1.5 px-3 py-1.5"
            >
              <Square size={14} /> Cancelar Mineração
            </Button>
          )}
        </div>

        {/* Progress Bar & Combination details */}
        {progress.status === 'running' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-secondary font-medium">
              <span>Processando: <strong className="text-primary">{progress.currentCombination || 'Gerando conexões...'}</strong></span>
              <span>{progress.currentCombinationIndex} / {progress.totalCombinations} combinações ({percentage}%)</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden border border-white/5">
              <div 
                className="bg-accent-primary h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Statistics Widgets */}
        <div className="grid grid-cols-3 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/[0.04]">
          <div className="flex flex-col items-center justify-center text-center">
            <Database className="text-accent-primary mb-1 opacity-80" size={18} />
            <span className="text-2xl font-bold text-primary">{progress.adsFound}</span>
            <span className="text-[10px] text-secondary font-medium uppercase tracking-wider">Ads Encontrados</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center border-x border-subtle">
            <Eye className="text-accent-secondary mb-1 opacity-80" size={18} />
            <span className="text-2xl font-bold text-primary">{progress.pagesChecked}</span>
            <span className="text-[10px] text-secondary font-medium uppercase tracking-wider">Páginas Lidas</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <FileCheck className="text-success mb-1 opacity-80" size={18} />
            <span className="text-2xl font-bold text-green-400">{progress.qualifiedOffers}</span>
            <span className="text-[10px] text-secondary font-medium uppercase tracking-wider">Qualificadas (10+ ads)</span>
          </div>
        </div>

        {/* Logs Terminal */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Console de Operação</label>
          <div 
            className="rounded-lg p-3 font-mono text-[11px] h-[150px] overflow-y-auto flex flex-col gap-1 shadow-inner border border-white/[0.06]"
            style={{ 
              background: '#0d0e12', 
              color: '#a5b4fc',
              scrollBehavior: 'smooth'
            }}
          >
            {progress.logs.length === 0 ? (
              <span className="text-muted italic my-auto text-center">O console está aguardando o início do minerador.</span>
            ) : (
              progress.logs.map((log, index) => (
                <div key={index} className="flex gap-2 leading-relaxed">
                  <span className="text-muted flex-shrink-0">[{log.timestamp}]</span>
                  <span className={
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'warning' ? 'text-amber-400' :
                    log.type === 'error' ? 'text-rose-400' : 'text-indigo-200'
                  }>
                    {log.message}
                  </span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>

      </div>
    </Card>
  );
};
