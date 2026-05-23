import React, { useState, useEffect } from 'react';
import {
  Sparkles, Wand2, Plus, Trash2, FileText, ChevronRight,
  AlertTriangle, ArrowUp, ArrowDown, Eye, RotateCcw,
  Layers, Type, AlignLeft, Table, CheckSquare,
  Lightbulb, ShieldAlert, MousePointerClick, BookOpen
} from 'lucide-react';
import { refineIdea } from '../../services/geminiService';
import { PdfPrintView } from '../../components/pdfbuilder/PdfPrintView';
import type { PdfBriefing, PdfPage, PdfPageType } from '../../types/pdfbuilder';
import './PdfBuilder.css';


// ─── Page type metadata ───────────────────────────────────────────────────────
const PAGE_TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  cover:      { label: 'Capa',        icon: <BookOpen size={13} />,         color: '#a78bfa' },
  instruction:{ label: 'Introdução',  icon: <AlignLeft size={13} />,        color: '#60a5fa' },
  materials:  { label: 'Materiais',   icon: <Layers size={13} />,           color: '#f59e0b' },
  table:      { label: 'Tabela',      icon: <Table size={13} />,            color: '#34d399' },
  checklist:  { label: 'Checklist',   icon: <CheckSquare size={13} />,      color: '#4ade80' },
  tips:       { label: 'Dicas',       icon: <Lightbulb size={13} />,        color: '#fbbf24' },
  errors:     { label: 'Erros',       icon: <ShieldAlert size={13} />,      color: '#f87171' },
  content:    { label: 'Conteúdo',    icon: <Type size={13} />,             color: '#94a3b8' },
  next_step:  { label: 'CTA Final',   icon: <MousePointerClick size={13} />,color: '#86efac' },
};

const VISUAL_TONES = [
  { value: 'artesanal',   emoji: '🎨', label: 'Artesanal',    desc: 'Creme & Âmbar' },
  { value: 'premium',     emoji: '✨', label: 'Premium',      desc: 'Dark & Roxo' },
  { value: 'feminino',    emoji: '🌸', label: 'Feminino',     desc: 'Rosa & Delicado' },
  { value: 'dark',        emoji: '🌑', label: 'Dark',         desc: 'Preto & Neon' },
  { value: 'minimalista', emoji: '▫️', label: 'Minimalista',  desc: 'Branco & Cinza' },
  { value: 'educacional', emoji: '📘', label: 'Educacional',  desc: 'Azul & Clean' },
];

// ─── Shared input style (dark-native) ────────────────────────────────────────
const inputCls = `
  w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2.5
  text-sm text-slate-100 placeholder-slate-500
  focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30
  transition-all duration-200
`.trim();

const textareaCls = `
  w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2.5
  text-sm text-slate-100 placeholder-slate-500 leading-relaxed
  focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30
  transition-all duration-200 resize-none
`.trim();

const selectCls = `
  w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2.5
  text-sm text-slate-100
  focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30
  transition-all duration-200 cursor-pointer
`.trim();

const labelCls = 'block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide';

// ─── Section box ─────────────────────────────────────────────────────────────
const Section: React.FC<{ title?: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 ${className}`}>
    {title && (
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="w-3 h-0.5 bg-violet-500 rounded inline-block" />
        {title}
      </h3>
    )}
    {children}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const PdfBuilderPage: React.FC = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showKeyAlert, setShowKeyAlert] = useState(!localStorage.getItem('gemini_api_key'));
  const [tempKey, setTempKey] = useState('');

  const [activeStep, setActiveStep] = useState<'idea' | 'briefing' | 'preview'>('idea');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [niche, setNiche] = useState('Artesanato');
  const [productName, setProductName] = useState('Kit Laços Lucrativos');
  const [rawIdea, setRawIdea] = useState('Quero um PDF de laços para mulheres que querem aprender a fazer laços e vender pelo WhatsApp');
  const [audience, setAudience] = useState('Mulheres iniciantes que buscam renda extra com artesanato');
  const [visualTone, setVisualTone] = useState<'premium' | 'artesanal' | 'feminino' | 'dark' | 'minimalista' | 'educacional'>('artesanal');
  const [depthLevel, setDepthLevel] = useState<'iniciante' | 'intermediario' | 'avancado'>('iniciante');
  const [mode, setMode] = useState<'rapido' | 'avancado'>('avancado');

  const [briefing, setBriefing] = useState<PdfBriefing | null>(null);
  const [activeEditPageIndex, setActiveEditPageIndex] = useState<number>(0);

  useEffect(() => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) { setApiKey(stored); setShowKeyAlert(false); }
  }, []);

  const handleSaveTempKey = () => {
    if (tempKey.trim()) {
      localStorage.setItem('gemini_api_key', tempKey.trim());
      setApiKey(tempKey.trim());
      setShowKeyAlert(false);
      setErrorMessage('');
    }
  };

  const handleGenerate = async () => {
    if (!apiKey) { setErrorMessage('Configure sua chave Gemini API para continuar.'); return; }
    if (!rawIdea.trim()) { setErrorMessage('A ideia bruta não pode ser vazia.'); return; }
    setIsGenerating(true);
    setErrorMessage('');
    try {
      const data = await refineIdea(rawIdea, { niche, productName, audience, visualTone, depthLevel }, apiKey);
      setBriefing(data);
      setActiveEditPageIndex(0);
      setActiveStep(mode === 'rapido' ? 'preview' : 'briefing');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao gerar o briefing. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateBriefingField = (field: keyof PdfBriefing, value: any) => {
    if (!briefing) return;
    setBriefing({ ...briefing, [field]: value });
  };

  const handleUpdatePageField = (index: number, field: keyof PdfPage, value: any) => {
    if (!briefing) return;
    const p = [...briefing.pages];
    p[index] = { ...p[index], [field]: value };
    setBriefing({ ...briefing, pages: p });
  };

  const handleAddPage = () => {
    if (!briefing) return;
    const newPage: PdfPage = {
      type: 'content', title: 'Nova Página de Conteúdo',
      subtitle: 'Explicação detalhada sobre o tema',
      blocks: ['Insira seu parágrafo aqui.'], tips: ['Dica rápida.']
    };
    setBriefing({ ...briefing, pages: [...briefing.pages, newPage] });
    setActiveEditPageIndex(briefing.pages.length);
  };

  const handleRemovePage = (index: number) => {
    if (!briefing || briefing.pages.length <= 1) return;
    const updated = briefing.pages.filter((_, i) => i !== index);
    setBriefing({ ...briefing, pages: updated });
    setActiveEditPageIndex(Math.max(0, index - 1));
  };

  const handleMovePage = (index: number, direction: 'up' | 'down') => {
    if (!briefing) return;
    const pages = [...briefing.pages];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pages.length) return;
    [pages[index], pages[targetIdx]] = [pages[targetIdx], pages[index]];
    setBriefing({ ...briefing, pages });
    setActiveEditPageIndex(targetIdx);
  };

  const activePage = briefing?.pages[activeEditPageIndex];

  // ── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#060d1a] text-slate-100 no-print">
      {/* ── Page header ── */}
      <div className="border-b border-white/[0.06] bg-[#080f1e]/80 backdrop-blur-sm sticky top-0 z-20 no-print">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white leading-tight">PDF Premium Builder</h1>
              <p className="text-xs text-slate-500 leading-none">Entregáveis de alto valor percebido gerados por IA</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="hidden md:flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
            {[
              { id: 'idea',     label: '1. Ideia',         icon: <Wand2 size={12} /> },
              { id: 'briefing', label: '2. Editar',        icon: <FileText size={12} /> },
              { id: 'preview',  label: '3. Visualizar',    icon: <Eye size={12} /> },
            ].map(step => (
              <button
                key={step.id}
                onClick={() => {
                  if (step.id === 'idea') setActiveStep('idea');
                  if (step.id === 'briefing' && briefing) setActiveStep('briefing');
                  if (step.id === 'preview' && briefing) setActiveStep('preview');
                }}
                disabled={step.id !== 'idea' && !briefing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeStep === step.id
                    ? 'bg-violet-600 text-white shadow-sm'
                    : briefing || step.id === 'idea'
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                    : 'text-slate-600 cursor-not-allowed'
                }`}
              >
                {step.icon} {step.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* ── API Key alert ── */}
        {showKeyAlert && (
          <div className="mb-6 bg-amber-950/30 border border-amber-500/20 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-300">Chave Gemini API não configurada</p>
                <p className="text-xs text-amber-500/80">Cole sua chave do Google AI Studio para gerar os e-books com IA.</p>
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={tempKey}
                onChange={e => setTempKey(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveTempKey()}
                className={`${inputCls} w-full md:w-64 text-xs py-2`}
              />
              <button
                onClick={handleSaveTempKey}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-lg flex-shrink-0 transition-all"
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 1 — IDEA FORM
        ══════════════════════════════════════════════════════════════════════ */}
        {activeStep === 'idea' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left — Main form */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              <Section title="Dados do Entregável">
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Nome do Produto</label>
                      <input type="text" value={productName} onChange={e => setProductName(e.target.value)}
                        placeholder="Ex: Kit Laços Lucrativos" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Nicho</label>
                      <input type="text" value={niche} onChange={e => setNiche(e.target.value)}
                        placeholder="Ex: Artesanato, Culinária..." className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Público-Alvo Específico</label>
                    <input type="text" value={audience} onChange={e => setAudience(e.target.value)}
                      placeholder="Ex: Mulheres que querem renda extra fazendo laços" className={inputCls} />
                  </div>

                  <div>
                    <label className={labelCls}>
                      Ideia Bruta{' '}
                      <span className="text-violet-400 font-normal">— descreva o que o PDF deve conter</span>
                    </label>
                    <textarea
                      value={rawIdea}
                      onChange={e => setRawIdea(e.target.value)}
                      rows={5}
                      placeholder="Ex: Quero um PDF com tabela de medidas dos laços mais vendidos, lista de materiais abaixo de R$50, checklist de qualidade e 3 dicas de como vender no WhatsApp..."
                      className={textareaCls}
                    />
                    <p className="text-[11px] text-slate-600 mt-1.5">
                      💡 Quanto mais detalhes você der, melhor será o conteúdo gerado.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-red-950/30 border border-red-800/30 rounded-lg text-xs text-red-400">
                      <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                      {errorMessage}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-white/[0.05]">
                    {/* Mode selector */}
                    <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.06] rounded-lg p-1">
                      {[
                        { v: 'rapido',   label: '⚡ Modo Rápido' },
                        { v: 'avancado', label: '✏️ Modo Editor' },
                      ].map(m => (
                        <button
                          key={m.v}
                          onClick={() => setMode(m.v as any)}
                          className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                            mode === m.v ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !rawIdea.trim()}
                      className="flex items-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg shadow-lg shadow-violet-900/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" />
                          </svg>
                          Gerando com Gemini...
                        </>
                      ) : (
                        <>
                          <Wand2 size={16} /> Gerar Entregável com IA
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </Section>
            </div>

            {/* Right — Visual & Options */}
            <div className="flex flex-col gap-5">
              {/* Visual tone grid */}
              <Section title="Estilo Visual do PDF">
                <div className="grid grid-cols-2 gap-2">
                  {VISUAL_TONES.map(tone => (
                    <button
                      key={tone.value}
                      onClick={() => setVisualTone(tone.value as any)}
                      className={`flex flex-col items-start gap-0.5 p-3 rounded-xl border text-left transition-all ${
                        visualTone === tone.value
                          ? 'border-violet-500 bg-violet-500/10 shadow-sm shadow-violet-900/30'
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="text-xl leading-none">{tone.emoji}</span>
                      <span className={`text-xs font-bold mt-1 ${visualTone === tone.value ? 'text-violet-300' : 'text-slate-300'}`}>
                        {tone.label}
                      </span>
                      <span className="text-[10px] text-slate-500">{tone.desc}</span>
                    </button>
                  ))}
                </div>
              </Section>

              {/* Depth level */}
              <Section title="Nível de Profundidade">
                <div className="flex flex-col gap-2">
                  {[
                    { v: 'iniciante',    label: 'Simples e Direto',        sub: 'Ideal para iniciantes' },
                    { v: 'intermediario',label: 'Guiado com Dicas',        sub: 'Com exemplos extras' },
                    { v: 'avancado',     label: 'Técnico e Aprofundado',   sub: 'Para experts' },
                  ].map(d => (
                    <button
                      key={d.v}
                      onClick={() => setDepthLevel(d.v as any)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                        depthLevel === d.v
                          ? 'border-violet-500 bg-violet-500/10'
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/15'
                      }`}
                    >
                      <div>
                        <p className={`text-xs font-semibold ${depthLevel === d.v ? 'text-violet-200' : 'text-slate-300'}`}>{d.label}</p>
                        <p className="text-[10px] text-slate-500">{d.sub}</p>
                      </div>
                      {depthLevel === d.v && <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Info box */}
              <div className="bg-violet-950/20 border border-violet-500/15 rounded-xl p-4">
                <p className="text-xs font-bold text-violet-300 mb-1.5">⚡ Como funciona</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A IA gera toda a estrutura de páginas e conteúdo. No Modo Editor você ajusta antes de gerar o PDF. No Modo Rápido vai direto para visualização.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 2 — ADVANCED EDITOR
        ══════════════════════════════════════════════════════════════════════ */}
        {activeStep === 'briefing' && briefing && (
          <div className="flex flex-col gap-5">
            {/* Top bar with global fields */}
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-violet-400" />
                  <h2 className="text-base font-bold text-white">Editor de Briefing</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveStep('idea')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-slate-400 rounded-lg transition-all"
                  >
                    <RotateCcw size={12} /> Reiniciar
                  </button>
                  <button
                    onClick={() => setActiveStep('preview')}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-lg transition-all shadow-sm shadow-violet-900/30"
                  >
                    <Eye size={12} /> Ver em A4 <ChevronRight size={12} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Título Refinado do PDF</label>
                  <input type="text" value={briefing.refinedTitle}
                    onChange={e => handleUpdateBriefingField('refinedTitle', e.target.value)}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Subtítulo / Promessa</label>
                  <input type="text" value={briefing.subtitle}
                    onChange={e => handleUpdateBriefingField('subtitle', e.target.value)}
                    className={inputCls} />
                </div>
              </div>
            </div>

            {/* Grid editor */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
              {/* LEFT: Pages list */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Páginas ({briefing.pages.length})
                  </span>
                  <button
                    onClick={handleAddPage}
                    className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-semibold transition-colors"
                  >
                    <Plus size={12} /> Adicionar
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                  {briefing.pages.map((page, idx) => {
                    const meta = PAGE_TYPE_META[page.type] || PAGE_TYPE_META.content;
                    const isActive = activeEditPageIndex === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => setActiveEditPageIndex(idx)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all w-full ${
                          isActive
                            ? 'border-violet-500/60 bg-violet-500/10'
                            : 'border-white/[0.05] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                        }`}
                      >
                        {/* Index */}
                        <span className="text-[10px] font-black text-slate-600 w-4 flex-shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>

                        {/* Type badge */}
                        <span
                          className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{ color: meta.color, backgroundColor: `${meta.color}18` }}
                        >
                          {meta.icon} {meta.label}
                        </span>

                        {/* Title */}
                        <span className={`text-xs font-medium truncate flex-1 ${isActive ? 'text-violet-200' : 'text-slate-400'}`}>
                          {page.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT: Page editor */}
              {activePage ? (
                <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-5">
                  {/* Editor header */}
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        {(() => {
                          const meta = PAGE_TYPE_META[activePage.type] || PAGE_TYPE_META.content;
                          return (
                            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md"
                              style={{ color: meta.color, backgroundColor: `${meta.color}18` }}>
                              {meta.icon} {meta.label}
                            </span>
                          );
                        })()}
                      </div>
                      <h4 className="font-bold text-sm text-white">Página #{activeEditPageIndex + 1}</h4>
                      <p className="text-[10px] text-slate-500">Edite o conteúdo e layout desta página</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button onClick={() => handleMovePage(activeEditPageIndex, 'up')}
                        disabled={activeEditPageIndex === 0}
                        title="Mover para cima"
                        className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] disabled:opacity-25 hover:bg-white/[0.08] text-slate-300 transition-all">
                        <ArrowUp size={13} />
                      </button>
                      <button onClick={() => handleMovePage(activeEditPageIndex, 'down')}
                        disabled={activeEditPageIndex === briefing.pages.length - 1}
                        title="Mover para baixo"
                        className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] disabled:opacity-25 hover:bg-white/[0.08] text-slate-300 transition-all">
                        <ArrowDown size={13} />
                      </button>
                      <button onClick={() => handleRemovePage(activeEditPageIndex)}
                        disabled={briefing.pages.length <= 1}
                        title="Excluir página"
                        className="p-1.5 rounded-lg bg-red-950/30 border border-red-900/30 text-red-400 hover:bg-red-950/50 disabled:opacity-25 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Tipo de Página</label>
                      <select value={activePage.type}
                        onChange={e => handleUpdatePageField(activeEditPageIndex, 'type', e.target.value as PdfPageType)}
                        className={selectCls}>
                        {Object.entries(PAGE_TYPE_META).map(([v, m]) => (
                          <option key={v} value={v}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Título da Página</label>
                      <input type="text" value={activePage.title}
                        onChange={e => handleUpdatePageField(activeEditPageIndex, 'title', e.target.value)}
                        className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Subtítulo / Descrição de Topo</label>
                    <input type="text" value={activePage.subtitle || ''}
                      onChange={e => handleUpdatePageField(activeEditPageIndex, 'subtitle', e.target.value)}
                      className={inputCls} />
                  </div>

                  {activePage.type !== 'cover' && (
                    <div>
                      <label className={labelCls}>
                        Texto Principal / Parágrafos{' '}
                        <span className="text-slate-600 font-normal">— separe parágrafos com linha em branco</span>
                      </label>
                      <textarea value={activePage.blocks?.join('\n\n') || ''}
                        onChange={e => handleUpdatePageField(activeEditPageIndex, 'blocks', e.target.value.split('\n\n'))}
                        rows={5} placeholder="Escreva os parágrafos aqui..."
                        className={textareaCls} />
                    </div>
                  )}

                  {/* Table config */}
                  {activePage.type === 'table' && (
                    <div className="bg-black/20 border border-white/[0.05] rounded-xl p-4 flex flex-col gap-4">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <Table size={13} className="text-emerald-400" /> Configurar Tabela
                      </span>
                      <div>
                        <label className={labelCls}>Colunas (separadas por vírgula)</label>
                        <input type="text" value={activePage.columns?.join(', ') || ''}
                          onChange={e => handleUpdatePageField(activeEditPageIndex, 'columns', e.target.value.split(',').map(s => s.trim()))}
                          placeholder="Ex: Tamanho, Fita Necessária, Preço Médio"
                          className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>
                          Linhas{' '}
                          <span className="text-slate-600 font-normal">— uma linha por linha; colunas separadas por ponto-e-vírgula</span>
                        </label>
                        <textarea value={activePage.rows?.map(r => r.join('; ')).join('\n') || ''}
                          onChange={e => handleUpdatePageField(activeEditPageIndex, 'rows', e.target.value.split('\n').map(l => l.split(';').map(s => s.trim())))}
                          rows={5} placeholder="Pequeno; 0,5m; R$3&#10;Médio; 1m; R$5"
                          className={`${textareaCls} font-mono text-xs`} />
                      </div>
                    </div>
                  )}

                  {/* Checklist config */}
                  {activePage.type === 'checklist' && (
                    <div className="bg-black/20 border border-white/[0.05] rounded-xl p-4 flex flex-col gap-3">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <CheckSquare size={13} className="text-green-400" /> Itens do Checklist
                      </span>
                      <label className={labelCls}>Um item por linha</label>
                      <textarea value={activePage.checklist?.map(i => i.label).join('\n') || ''}
                        onChange={e => handleUpdatePageField(activeEditPageIndex, 'checklist', e.target.value.split('\n').filter(s => s.trim()).map(label => ({ label, checked: true })))}
                        rows={7} placeholder="Separar fita do cetim&#10;Cortar o fio de aramado&#10;Montar o laço principal"
                        className={textareaCls} />
                    </div>
                  )}

                  {/* Tips/Errors config */}
                  {(activePage.type === 'tips' || activePage.type === 'errors') && (
                    <div className="bg-black/20 border border-white/[0.05] rounded-xl p-4 flex flex-col gap-3">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        {activePage.type === 'tips'
                          ? <><Lightbulb size={13} className="text-amber-400" /> Dicas</>
                          : <><ShieldAlert size={13} className="text-red-400" /> Erros a Evitar</>}
                      </span>
                      <label className={labelCls}>Um item por linha</label>
                      <textarea
                        value={activePage.type === 'tips'
                          ? activePage.tips?.join('\n') || ''
                          : activePage.warnings?.join('\n') || ''}
                        onChange={e => handleUpdatePageField(
                          activeEditPageIndex,
                          activePage.type === 'tips' ? 'tips' : 'warnings',
                          e.target.value.split('\n').filter(s => s.trim())
                        )}
                        rows={5}
                        placeholder={activePage.type === 'tips' ? 'Dica 1...\nDica 2...' : 'Erro 1...\nErro 2...'}
                        className={textareaCls}
                      />
                    </div>
                  )}

                  {/* CTA config */}
                  {activePage.type === 'next_step' && (
                    <div className="bg-black/20 border border-white/[0.05] rounded-xl p-4 flex flex-col gap-4">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                        <MousePointerClick size={13} className="text-violet-400" /> Call to Action
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Texto do Botão</label>
                          <input type="text" value={activePage.ctaText || ''}
                            onChange={e => handleUpdatePageField(activeEditPageIndex, 'ctaText', e.target.value)}
                            placeholder="Ex: Entrar no Grupo VIP"
                            className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Link de Destino</label>
                          <input type="text" value={activePage.ctaLink || ''}
                            onChange={e => handleUpdatePageField(activeEditPageIndex, 'ctaLink', e.target.value)}
                            placeholder="https://wa.me/55..."
                            className={inputCls} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-slate-600 text-sm">
                  Selecione uma página para editar
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            STEP 3 — PREVIEW
        ══════════════════════════════════════════════════════════════════════ */}
        {activeStep === 'preview' && briefing && (
          <PdfPrintView
            briefing={briefing}
            onBack={() => setActiveStep(mode === 'rapido' ? 'idea' : 'briefing')}
            onRegenerate={handleGenerate}
          />
        )}
      </div>
    </div>
  );
};

export default PdfBuilderPage;
