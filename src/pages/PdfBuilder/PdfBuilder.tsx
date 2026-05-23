import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, Plus, Trash2, FileText, ChevronRight, AlertTriangle } from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { refineIdea } from '../../services/geminiService';
import { PdfPrintView } from '../../components/pdfbuilder/PdfPrintView';
import type { PdfBriefing, PdfPage, PdfPageType } from '../../types/pdfbuilder';
import './PdfBuilder.css';

export const PdfBuilderPage: React.FC = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showKeyAlert, setShowKeyAlert] = useState(!localStorage.getItem('gemini_api_key'));
  const [tempKey, setTempKey] = useState('');

  // Page workflow states
  const [activeStep, setActiveStep] = useState<'idea' | 'briefing' | 'preview'>('idea');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [niche, setNiche] = useState('Artesanato');
  const [productName, setProductName] = useState('Kit Laços Lucrativos');
  const [rawIdea, setRawIdea] = useState('Quero um PDF de laços para mulheres que querem aprender a fazer laços e vender pelo WhatsApp');
  const [audience, setAudience] = useState('Mulheres iniciantes que buscam renda extra com artesanato');
  const [visualTone, setVisualTone] = useState<'premium' | 'artesanal' | 'feminino' | 'dark' | 'minimalista' | 'educacional'>('artesanal');
  const [depthLevel, setDepthLevel] = useState<'iniciante' | 'intermediario' | 'avancado'>('iniciante');
  const [mode, setMode] = useState<'rapido' | 'avancado'>('avancado');

  // The generated result
  const [briefing, setBriefing] = useState<PdfBriefing | null>(null);

  // Active page editing index (for Step 2: Advanced Mode Editor)
  const [activeEditPageIndex, setActiveEditPageIndex] = useState<number>(0);

  // Load API key updates
  useEffect(() => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) {
      setApiKey(stored);
      setShowKeyAlert(false);
    }
  }, []);

  const handleSaveTempKey = () => {
    if (tempKey.trim()) {
      localStorage.setItem('gemini_api_key', tempKey.trim());
      setApiKey(tempKey.trim());
      setShowKeyAlert(false);
      setErrorMessage('');
    }
  };

  // Run the AI Generator
  const handleGenerate = async () => {
    if (!apiKey) {
      setErrorMessage('Por favor, configure sua chave Gemini API para continuar.');
      return;
    }
    if (!rawIdea.trim()) {
      setErrorMessage('A ideia bruta não pode ser vazia.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');

    try {
      const data = await refineIdea(
        rawIdea,
        {
          niche,
          productName,
          audience,
          visualTone,
          depthLevel,
        },
        apiKey
      );

      setBriefing(data);
      setActiveEditPageIndex(0);

      if (mode === 'rapido') {
        setActiveStep('preview');
      } else {
        setActiveStep('briefing');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Erro ao gerar o briefing do entregável. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 2: Page update helpers
  const handleUpdateBriefingField = (field: keyof PdfBriefing, value: any) => {
    if (!briefing) return;
    setBriefing({
      ...briefing,
      [field]: value
    });
  };

  const handleUpdatePageField = (index: number, field: keyof PdfPage, value: any) => {
    if (!briefing) return;
    const updatedPages = [...briefing.pages];
    updatedPages[index] = {
      ...updatedPages[index],
      [field]: value
    };
    setBriefing({
      ...briefing,
      pages: updatedPages
    });
  };

  const handleAddPage = () => {
    if (!briefing) return;
    const newPage: PdfPage = {
      type: 'content',
      title: 'Nova Página de Conteúdo',
      subtitle: 'Explicação detalhada sobre o tema',
      blocks: ['Insira seu parágrafo prático aqui.'],
      tips: ['Dica rápida.']
    };
    setBriefing({
      ...briefing,
      pages: [...briefing.pages, newPage]
    });
    setActiveEditPageIndex(briefing.pages.length);
  };

  const handleRemovePage = (index: number) => {
    if (!briefing || briefing.pages.length <= 1) return;
    const updated = briefing.pages.filter((_, i) => i !== index);
    setBriefing({
      ...briefing,
      pages: updated
    });
    setActiveEditPageIndex(Math.max(0, index - 1));
  };

  const handleMovePage = (index: number, direction: 'up' | 'down') => {
    if (!briefing) return;
    const pages = [...briefing.pages];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pages.length) return;

    // Swap
    const temp = pages[index];
    pages[index] = pages[targetIdx];
    pages[targetIdx] = temp;

    setBriefing({
      ...briefing,
      pages
    });
    setActiveEditPageIndex(targetIdx);
  };

  return (
    <div className="pdf-builder-container p-6 max-w-7xl mx-auto">
      {/* Header Area */}
      <div className="no-print flex justify-between items-center mb-6 border-b pb-4 border-white/5">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Sparkles className="text-emerald-400" size={28} /> PDF Premium Builder
          </h1>
          <p className="text-sm text-secondary">
            Gere e-books, guias rápidos, tabelas e checklists de altíssimo valor percebido a partir de ideias brutas.
          </p>
        </div>
      </div>

      {/* API Key Missing Warning */}
      {showKeyAlert && (
        <Card className="no-print p-4 mb-6 border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-2 text-yellow-500">
              <AlertTriangle size={24} className="flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-white">Chave de API do Gemini Não Encontrada</h4>
                <p className="text-xs text-secondary">Para gerar os e-books por IA, cole sua chave do Google AI Studio temporariamente abaixo.</p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="password"
                placeholder="Cole sua API Key (AIzaSy...)"
                value={tempKey}
                onChange={e => setTempKey(e.target.value)}
                className="bg-black/40 border border-white/10 rounded px-3 py-1.5 text-xs text-white focus:outline-none w-full md:w-64"
              />
              <Button variant="primary" onClick={handleSaveTempKey} className="text-xs px-4 py-1.5">
                Salvar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Main Workflow Render */}
      {activeStep === 'idea' && (
        <div className="no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form Setup */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="p-6 glass-card">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">1. Ideia do Entregável</h3>
              
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">Nome do Produto</label>
                    <input 
                      type="text" 
                      value={productName} 
                      onChange={e => setProductName(e.target.value)}
                      placeholder="Ex: Kit Laços Lucrativos"
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">Nicho</label>
                    <input 
                      type="text" 
                      value={niche} 
                      onChange={e => setNiche(e.target.value)}
                      placeholder="Ex: Artesanato"
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">Público-Alvo Específico</label>
                  <input 
                    type="text" 
                    value={audience} 
                    onChange={e => setAudience(e.target.value)}
                    placeholder="Ex: Mulheres que querem aprender laços para vender pelo WhatsApp"
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">Ideia Bruta (O que conterá no PDF? Conte de forma simples)</label>
                  <textarea 
                    value={rawIdea} 
                    onChange={e => setRawIdea(e.target.value)}
                    placeholder="Ex: Quero um PDF contendo uma tabela de medidas dos laços mais comuns, materiais necessários para iniciar com menos de R$ 50 reais e 3 dicas de ouro de venda."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30 leading-relaxed"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-400 flex items-center gap-2">
                    <AlertTriangle size={14} /> {errorMessage}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-2 border-t border-white/5 pt-4">
                  <div className="flex items-center gap-4 mr-auto text-xs text-secondary">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="mode" 
                        checked={mode === 'rapido'} 
                        onChange={() => setMode('rapido')} 
                        className="accent-emerald-500"
                      />
                      Modo Rápido (Direto ao PDF)
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="radio" 
                        name="mode" 
                        checked={mode === 'avancado'} 
                        onChange={() => setMode('avancado')}
                        className="accent-emerald-500"
                      />
                      Modo Avançado (Editar antes)
                    </label>
                  </div>

                  <Button 
                    variant="primary" 
                    onClick={handleGenerate} 
                    disabled={isGenerating || !rawIdea.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    {isGenerating ? (
                      <>Criando com Gemini...</>
                    ) : (
                      <>
                        <Wand2 size={16} /> Gerar Entregável
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Visual Tone & Options */}
          <div className="flex flex-col gap-6">
            <Card className="p-6 glass-card">
              <h4 className="font-bold text-sm text-white mb-3 border-b border-white/5 pb-1.5">Estilo e Tom Editorial</h4>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">Visual Tone</label>
                  <select 
                    value={visualTone} 
                    onChange={e => setVisualTone(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white focus:outline-none"
                  >
                    <option value="artesanal">🎨 Artesanal (Fundo Creme, Tons Âmbar)</option>
                    <option value="premium">✨ Premium (Fundo Roxo Escuro, Alta Classe)</option>
                    <option value="feminino">🌸 Feminino (Fundo Rosa Claro, Delicado)</option>
                    <option value="dark">🌑 Dark (Modo Escuro Minimalista, Neon Emerald)</option>
                    <option value="minimalista">▫️ Minimalista (Fundo Branco, Cinza e Preto)</option>
                    <option value="educacional">📘 Educacional (Fundo Branco, Tons Azuis)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">Nível de Profundidade</label>
                  <select 
                    value={depthLevel} 
                    onChange={e => setDepthLevel(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white focus:outline-none"
                  >
                    <option value="iniciante">Simples e Direto (Iniciantes)</option>
                    <option value="intermediario">Guiado com Dicas Extras (Intermediário)</option>
                    <option value="avancado">Denso e Muito Técnico (Avançado)</option>
                  </select>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg text-xs leading-relaxed text-secondary mt-2">
                  <span className="font-bold text-primary block mb-1">Como Funciona:</span>
                  A inteligência artificial irá criar a cópia inteira das páginas, incluindo checklists e tabelas. Em seguida, os estilos CSS de impressão gerarão o arquivo pronto para A4.
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Step 2: Advanced Briefing Editor */}
      {activeStep === 'briefing' && briefing && (
        <div className="no-print flex flex-col gap-6">
          {/* Top Info Editor */}
          <Card className="p-6 glass-card">
            <div className="flex justify-between items-center border-b pb-3 mb-4 border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="text-emerald-400" size={22} /> Editar Briefing e Conteúdo
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveStep('idea')} 
                  className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded text-secondary hover:bg-white/10"
                >
                  Reiniciar
                </button>
                <Button 
                  variant="primary" 
                  onClick={() => setActiveStep('preview')} 
                  className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 font-bold"
                >
                  Ir para Visualização A4 <ChevronRight size={14} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">Título Refinado do PDF</label>
                <input 
                  type="text" 
                  value={briefing.refinedTitle} 
                  onChange={e => handleUpdateBriefingField('refinedTitle', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">Subtítulo (Promessa)</label>
                <input 
                  type="text" 
                  value={briefing.subtitle} 
                  onChange={e => handleUpdateBriefingField('subtitle', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Grid Page Editor Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Pages List */}
            <div className="lg:col-span-1 flex flex-col gap-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Estrutura de Páginas</span>
                <button 
                  onClick={handleAddPage} 
                  className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Plus size={12} /> Adicionar Página
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
                {briefing.pages.map((page, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveEditPageIndex(idx)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                      activeEditPageIndex === idx 
                        ? 'bg-emerald-950/20 border-emerald-500 text-white' 
                        : 'bg-white/5 border-white/5 text-secondary hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-[10px] font-bold opacity-60">#{idx + 1}</span>
                      <span className="text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-[9px]">
                        {page.type}
                      </span>
                      <span className="text-xs font-medium truncate">{page.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Page Content Editor */}
            <div className="lg:col-span-2">
              {briefing.pages[activeEditPageIndex] ? (
                <Card className="p-6 glass-card flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b pb-3 border-white/5">
                    <div>
                      <h4 className="font-bold text-base text-white">Editar Conteúdo da Página #{activeEditPageIndex + 1}</h4>
                      <p className="text-[10px] text-secondary">Ajuste o layout e copie os dados de forma visual.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleMovePage(activeEditPageIndex, 'up')}
                        disabled={activeEditPageIndex === 0}
                        className="p-1 rounded bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 text-white"
                        title="Subir página"
                      >
                        ▲
                      </button>
                      <button 
                        onClick={() => handleMovePage(activeEditPageIndex, 'down')}
                        disabled={activeEditPageIndex === briefing.pages.length - 1}
                        className="p-1 rounded bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 text-white"
                        title="Descer página"
                      >
                        ▼
                      </button>
                      <button 
                        onClick={() => handleRemovePage(activeEditPageIndex)}
                        disabled={briefing.pages.length <= 1}
                        className="p-1 rounded bg-red-950/20 border border-red-900/30 text-error hover:bg-red-950/40 disabled:opacity-30"
                        title="Excluir página"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Editors Fields based on Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-secondary mb-1">Tipo de Página</label>
                      <select 
                        value={briefing.pages[activeEditPageIndex].type} 
                        onChange={e => handleUpdatePageField(activeEditPageIndex, 'type', e.target.value as PdfPageType)}
                        className="w-full bg-white/5 border border-white/10 rounded p-2 text-xs text-white focus:outline-none"
                      >
                        <option value="cover">Capa (cover)</option>
                        <option value="instruction">Como Usar (instruction)</option>
                        <option value="materials">Materiais (materials)</option>
                        <option value="table">Tabela (table)</option>
                        <option value="checklist">Checklist (checklist)</option>
                        <option value="tips">Dicas (tips)</option>
                        <option value="errors">Erros a Evitar (errors)</option>
                        <option value="content">Conteúdo Padrão (content)</option>
                        <option value="next_step">Call to Action final (next_step)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-secondary mb-1">Título da Página</label>
                      <input 
                        type="text" 
                        value={briefing.pages[activeEditPageIndex].title} 
                        onChange={e => handleUpdatePageField(activeEditPageIndex, 'title', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">Subtítulo/Descrição de Topo</label>
                    <input 
                      type="text" 
                      value={briefing.pages[activeEditPageIndex].subtitle || ''} 
                      onChange={e => handleUpdatePageField(activeEditPageIndex, 'subtitle', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  {/* Dynamic Blocks depending on layout */}
                  {briefing.pages[activeEditPageIndex].type !== 'cover' && (
                    <div>
                      <label className="block text-xs font-semibold text-secondary mb-1">Texto Principal / Parágrafos</label>
                      <textarea 
                        value={briefing.pages[activeEditPageIndex].blocks?.join('\n\n') || ''} 
                        onChange={e => handleUpdatePageField(activeEditPageIndex, 'blocks', e.target.value.split('\n\n'))}
                        rows={5}
                        placeholder="Escreva parágrafos separados por duas quebras de linha."
                        className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none leading-relaxed"
                      />
                    </div>
                  )}

                  {/* Table Page Specific Config */}
                  {briefing.pages[activeEditPageIndex].type === 'table' && (
                    <div className="border border-white/5 p-4 rounded-lg space-y-4">
                      <span className="font-bold text-xs text-white block">Configurar Tabela</span>
                      <div>
                        <label className="block text-[10px] text-secondary font-bold uppercase mb-1">Colunas (separadas por vírgula)</label>
                        <input 
                          type="text" 
                          value={briefing.pages[activeEditPageIndex].columns?.join(', ') || ''} 
                          onChange={e => handleUpdatePageField(activeEditPageIndex, 'columns', e.target.value.split(',').map(s => s.trim()))}
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-secondary font-bold uppercase mb-1">Linhas (Uma linha por linha da tabela, colunas separadas por ponto e vírgula ';')</label>
                        <textarea 
                          value={briefing.pages[activeEditPageIndex].rows?.map(row => row.join('; ')).join('\n') || ''} 
                          onChange={e => handleUpdatePageField(activeEditPageIndex, 'rows', e.target.value.split('\n').map(line => line.split(';').map(s => s.trim())))}
                          rows={4}
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Checklist Page Specific Config */}
                  {briefing.pages[activeEditPageIndex].type === 'checklist' && (
                    <div className="border border-white/5 p-4 rounded-lg space-y-4">
                      <span className="font-bold text-xs text-white block">Configurar Checklist</span>
                      <div>
                        <label className="block text-[10px] text-secondary font-bold uppercase mb-1">Itens (Um item por linha)</label>
                        <textarea 
                          value={briefing.pages[activeEditPageIndex].checklist?.map(item => item.label).join('\n') || ''} 
                          onChange={e => handleUpdatePageField(activeEditPageIndex, 'checklist', e.target.value.split('\n').filter(s => s.trim()).map(label => ({ label, checked: true })))}
                          rows={6}
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Tips or Errors Page Specific Config */}
                  {(briefing.pages[activeEditPageIndex].type === 'tips' || briefing.pages[activeEditPageIndex].type === 'errors') && (
                    <div className="border border-white/5 p-4 rounded-lg space-y-4">
                      <span className="font-bold text-xs text-white block">Configurar Destaques / Avisos</span>
                      <div>
                        <label className="block text-[10px] text-secondary font-bold uppercase mb-1">
                          {briefing.pages[activeEditPageIndex].type === 'tips' ? 'Dicas (Uma por linha)' : 'Erros (Um por linha)'}
                        </label>
                        <textarea 
                          value={
                            briefing.pages[activeEditPageIndex].type === 'tips' 
                              ? briefing.pages[activeEditPageIndex].tips?.join('\n') || '' 
                              : briefing.pages[activeEditPageIndex].warnings?.join('\n') || ''
                          } 
                          onChange={e => handleUpdatePageField(
                            activeEditPageIndex, 
                            briefing.pages[activeEditPageIndex].type === 'tips' ? 'tips' : 'warnings', 
                            e.target.value.split('\n').filter(s => s.trim())
                          )}
                          rows={4}
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Call to Action Specific Config */}
                  {briefing.pages[activeEditPageIndex].type === 'next_step' && (
                    <div className="border border-white/5 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-secondary mb-1">Texto do Botão (CTA)</label>
                        <input 
                          type="text" 
                          value={briefing.pages[activeEditPageIndex].ctaText || ''} 
                          onChange={e => handleUpdatePageField(activeEditPageIndex, 'ctaText', e.target.value)}
                          placeholder="Ex: Quero Entrar no WhatsApp"
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-secondary mb-1">Link de Destino</label>
                        <input 
                          type="text" 
                          value={briefing.pages[activeEditPageIndex].ctaLink || ''} 
                          onChange={e => handleUpdatePageField(activeEditPageIndex, 'ctaLink', e.target.value)}
                          placeholder="Ex: https://wa.me/55..."
                          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </Card>
              ) : (
                <p className="text-secondary text-center py-12">Selecione uma página para editar.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Print Preview Area */}
      {activeStep === 'preview' && briefing && (
        <PdfPrintView
          briefing={briefing}
          onBack={() => {
            if (mode === 'rapido') {
              setActiveStep('idea');
            } else {
              setActiveStep('briefing');
            }
          }}
          onRegenerate={handleGenerate}
        />
      )}
    </div>
  );
};

export default PdfBuilderPage;
