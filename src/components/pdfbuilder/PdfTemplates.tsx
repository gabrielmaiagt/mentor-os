import React from 'react';
import { BookOpen, AlertTriangle, CheckSquare, Award, ArrowRight, ShieldAlert, FileText, Layers } from 'lucide-react';
import type { PdfPage } from '../../types/pdfbuilder';

interface PdfPageRendererProps {
  page: PdfPage;
  visualStyle: 'premium' | 'artesanal' | 'feminino' | 'dark' | 'minimalista' | 'educacional';
  themeColor: string;
  productName: string;
  pageIndex: number;
  totalPages: number;
}

export const PdfPageRenderer: React.FC<PdfPageRendererProps> = ({
  page,
  visualStyle,
  themeColor,
  productName,
  pageIndex,
  totalPages,
}) => {
  // Helper to get font styles depending on visualStyle
  const getStyleClasses = () => {
    switch (visualStyle) {
      case 'premium':
        return {
          bg: 'bg-slate-900 text-slate-100',
          titleFont: 'font-serif text-slate-100',
          bodyFont: 'font-sans text-slate-300',
          border: 'border-violet-500/20',
          cardBg: 'bg-slate-800/50 backdrop-blur border border-violet-500/20',
          badgeBg: 'bg-violet-500/20 text-violet-300',
        };
      case 'artesanal':
        return {
          bg: 'bg-[#faf6f0] text-amber-950',
          titleFont: 'font-serif text-amber-950',
          bodyFont: 'font-sans text-amber-900',
          border: 'border-amber-700/20',
          cardBg: 'bg-amber-50 border border-amber-700/20',
          badgeBg: 'bg-amber-100 text-amber-800',
        };
      case 'feminino':
        return {
          bg: 'bg-[#fff5f5] text-rose-950',
          titleFont: 'font-serif text-rose-950',
          bodyFont: 'font-sans text-rose-900',
          border: 'border-rose-300',
          cardBg: 'bg-white border border-rose-200 shadow-sm',
          badgeBg: 'bg-rose-100 text-rose-700',
        };
      case 'dark':
        return {
          bg: 'bg-neutral-950 text-neutral-100',
          titleFont: 'font-mono text-neutral-100',
          bodyFont: 'font-sans text-neutral-300',
          border: 'border-neutral-800',
          cardBg: 'bg-neutral-900 border border-neutral-800',
          badgeBg: 'bg-neutral-800 text-neutral-300',
        };
      case 'minimalista':
        return {
          bg: 'bg-white text-gray-900',
          titleFont: 'font-sans font-light tracking-tight text-gray-900',
          bodyFont: 'font-sans text-gray-600',
          border: 'border-gray-200',
          cardBg: 'bg-gray-50 border border-gray-100',
          badgeBg: 'bg-gray-100 text-gray-800',
        };
      case 'educacional':
        return {
          bg: 'bg-white text-slate-900',
          titleFont: 'font-sans font-bold text-slate-900',
          bodyFont: 'font-sans text-slate-600',
          border: 'border-slate-200',
          cardBg: 'bg-slate-50 border border-slate-200',
          badgeBg: 'bg-blue-100 text-blue-800',
        };
    }
  };

  const style = getStyleClasses();

  // Header Component (not on cover)
  const renderHeader = () => {
    if (page.type === 'cover') return null;
    return (
      <div className={`flex justify-between items-center border-b pb-3 mb-6 ${style.border}`}>
        <span className="text-[10px] uppercase tracking-widest font-semibold opacity-70">
          {productName}
        </span>
        <span className="text-[10px] uppercase tracking-widest font-semibold opacity-70">
          Pág. {pageIndex}
        </span>
      </div>
    );
  };

  // Footer Component (not on cover)
  const renderFooter = () => {
    if (page.type === 'cover') return null;
    return (
      <div className={`mt-auto pt-4 border-t flex justify-between items-center text-[9px] opacity-50 ${style.border}`}>
        <span>© {new Date().getFullYear()} {productName} | Todos os direitos reservados.</span>
        <span>{pageIndex} / {totalPages}</span>
      </div>
    );
  };

  // RENDER SECTIONS BASED ON PAGE TYPE
  const renderContent = () => {
    switch (page.type) {
      case 'cover':
        return (
          <div className="flex flex-col items-center justify-between h-full py-12 text-center">
            {/* Header Badge */}
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${style.badgeBg}`}>
              Material Oficial : {productName}
            </div>

            {/* Title & Promisse */}
            <div className="my-auto space-y-6">
              <h1 
                className={`text-4xl md:text-5xl font-black leading-tight tracking-tight ${style.titleFont}`}
                style={{ color: visualStyle === 'premium' || visualStyle === 'dark' ? '#fff' : themeColor }}
              >
                {page.title}
              </h1>
              {page.subtitle && (
                <p className={`text-base md:text-lg max-w-xl mx-auto leading-relaxed opacity-90 ${style.bodyFont}`}>
                  {page.subtitle}
                </p>
              )}
            </div>

            {/* Graphic Mockup / Icon Container */}
            <div className="my-6">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center m-auto shadow-lg"
                style={{ backgroundColor: `${themeColor}20`, border: `2px solid ${themeColor}` }}
              >
                <Award size={48} style={{ color: themeColor }} />
              </div>
            </div>

            {/* Footer Promise */}
            <div className="space-y-2 mt-auto">
              <p className="text-[11px] uppercase tracking-widest font-bold opacity-60">
                Guia de Implementação Rápida
              </p>
              <div className="h-0.5 w-16 mx-auto" style={{ backgroundColor: themeColor }} />
            </div>
          </div>
        );

      case 'instruction':
        return (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${style.titleFont}`}>
                <BookOpen style={{ color: themeColor }} size={24} />
                {page.title}
              </h2>
              {page.subtitle && <p className="text-xs opacity-70 mb-4">{page.subtitle}</p>}
            </div>

            <div className="space-y-4">
              {page.blocks?.map((block, idx) => (
                <p key={idx} className={`text-sm leading-relaxed ${style.bodyFont}`}>
                  {block}
                </p>
              ))}
            </div>

            {page.tips && page.tips.length > 0 && (
              <div className={`p-4 rounded-xl mt-4 ${style.cardBg}`}>
                <span className="text-xs font-bold uppercase tracking-wider block mb-2 flex items-center gap-1.5" style={{ color: themeColor }}>
                  💡 Dica Importante:
                </span>
                <ul className="list-disc pl-5 space-y-1 text-xs leading-relaxed">
                  {page.tips.map((tip, idx) => (
                    <li key={idx} className={style.bodyFont}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'materials':
        return (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${style.titleFont}`}>
                <Layers style={{ color: themeColor }} size={24} />
                {page.title}
              </h2>
              {page.subtitle && <p className="text-xs opacity-70 mb-4">{page.subtitle}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              {page.blocks?.map((mat, idx) => (
                <div key={idx} className={`p-3 rounded-lg border flex gap-3 items-center ${style.cardBg}`}>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${themeColor}15`, color: themeColor }}
                  >
                    {idx + 1}
                  </div>
                  <span className={`text-xs font-semibold ${style.bodyFont}`}>{mat}</span>
                </div>
              ))}
            </div>

            {page.tips && page.tips.length > 0 && (
              <div className={`p-4 rounded-xl mt-4 border-l-4`} style={{ borderLeftColor: themeColor, backgroundColor: `${themeColor}05` }}>
                <span className="text-xs font-bold block mb-1">Macetes de Preparação:</span>
                <ul className="list-disc pl-5 space-y-1 text-xs opacity-80">
                  {page.tips.map((tip, idx) => (
                    <li key={idx} className={style.bodyFont}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'table':
        return (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${style.titleFont}`}>
                <FileText style={{ color: themeColor }} size={24} />
                {page.title}
              </h2>
              {page.subtitle && <p className="text-xs opacity-70 mb-4">{page.subtitle}</p>}
            </div>

            {page.blocks && page.blocks.length > 0 && (
              <div className="text-xs opacity-80 leading-relaxed mb-2">
                {page.blocks.map((block, idx) => (
                  <p key={idx} className="mb-2">{block}</p>
                ))}
              </div>
            )}

            {/* Responsive Premium Table */}
            <div className="overflow-hidden rounded-xl border border-white/10 mt-2 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr style={{ backgroundColor: themeColor, color: '#fff' }}>
                    {page.columns?.map((col, idx) => (
                      <th key={idx} className="p-3 font-bold uppercase tracking-wider">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {page.rows?.map((row, rowIdx) => (
                    <tr 
                      key={rowIdx} 
                      className={`border-b ${style.border} ${rowIdx % 2 === 0 ? 'bg-black/10' : 'bg-transparent'}`}
                    >
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className={`p-3 ${style.bodyFont}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {page.tips && page.tips.length > 0 && (
              <div className="mt-4 flex flex-col gap-1">
                {page.tips.map((tip, idx) => (
                  <p key={idx} className="text-[11px] italic opacity-70">
                    * {tip}
                  </p>
                ))}
              </div>
            )}
          </div>
        );

      case 'checklist':
        return (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${style.titleFont}`}>
                <CheckSquare style={{ color: themeColor }} size={24} />
                {page.title}
              </h2>
              {page.subtitle && <p className="text-xs opacity-70 mb-4">{page.subtitle}</p>}
            </div>

            {page.blocks && page.blocks.length > 0 && (
              <p className="text-xs opacity-80 mb-2">{page.blocks[0]}</p>
            )}

            <div className="flex flex-col gap-2 mt-2">
              {page.checklist?.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${style.cardBg}`}
                >
                  <div 
                    className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ borderColor: themeColor }}
                  >
                    {item.checked && (
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: themeColor }} />
                    )}
                  </div>
                  <span className={`text-xs ${style.bodyFont}`}>{item.label}</span>
                </div>
              ))}
            </div>

            {page.tips && page.tips.length > 0 && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mt-3 flex gap-2">
                <AlertTriangle className="text-yellow-500 flex-shrink-0" size={16} />
                <span className="text-[11px] text-yellow-400 font-medium">
                  {page.tips[0]}
                </span>
              </div>
            )}
          </div>
        );

      case 'tips':
        return (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${style.titleFont}`}>
                <Award style={{ color: themeColor }} size={24} />
                {page.title}
              </h2>
              {page.subtitle && <p className="text-xs opacity-70 mb-4">{page.subtitle}</p>}
            </div>

            <div className="space-y-4">
              {page.blocks?.map((block, idx) => (
                <p key={idx} className={`text-sm leading-relaxed ${style.bodyFont}`}>
                  {block}
                </p>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 mt-4">
              {page.tips?.map((tip, idx) => (
                <div 
                  key={idx} 
                  className="p-4 rounded-xl border-l-4 flex gap-3 items-start"
                  style={{ borderLeftColor: themeColor, backgroundColor: `${themeColor}08` }}
                >
                  <div className="text-lg mt-[-2px]">💡</div>
                  <div>
                    <h5 className="font-bold text-xs mb-1" style={{ color: themeColor }}>Dica Técnica #{idx + 1}</h5>
                    <p className={`text-xs leading-relaxed ${style.bodyFont}`}>{tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'errors':
        return (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className={`text-2xl font-bold mb-2 flex items-center gap-2 ${style.titleFont}`}>
                <ShieldAlert style={{ color: '#ef4444' }} size={24} />
                {page.title}
              </h2>
              {page.subtitle && <p className="text-xs opacity-70 mb-4">{page.subtitle}</p>}
            </div>

            {page.blocks && page.blocks.length > 0 && (
              <p className="text-xs opacity-80 leading-relaxed mb-2">{page.blocks[0]}</p>
            )}

            <div className="space-y-3 mt-2">
              {page.warnings?.map((warn, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 rounded-lg bg-red-950/20 border border-red-900/30 flex gap-3 items-start"
                >
                  <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                  <div>
                    <h5 className="font-bold text-red-400 text-xs mb-0.5">Erro #{idx + 1}</h5>
                    <p className={`text-xs text-red-200/80 leading-relaxed`}>{warn}</p>
                  </div>
                </div>
              ))}
            </div>

            {page.tips && page.tips.length > 0 && (
              <div className={`p-4 rounded-xl mt-4 ${style.cardBg}`}>
                <span className="text-xs font-bold block mb-1 text-green-400">✅ A Solução Correta:</span>
                <p className={`text-xs ${style.bodyFont}`}>{page.tips[0]}</p>
              </div>
            )}
          </div>
        );

      case 'content':
        return (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className={`text-2xl font-bold mb-2 ${style.titleFont}`}>
                {page.title}
              </h2>
              {page.subtitle && <p className="text-xs opacity-70 mb-4">{page.subtitle}</p>}
            </div>

            <div className="space-y-4">
              {page.blocks?.map((block, idx) => (
                <p key={idx} className={`text-sm leading-relaxed ${style.bodyFont}`}>
                  {block}
                </p>
              ))}
            </div>

            {page.tips && page.tips.length > 0 && (
              <div className={`p-3.5 rounded-lg border-l-4 mt-2`} style={{ borderLeftColor: themeColor, backgroundColor: `${themeColor}05` }}>
                <p className={`text-xs italic ${style.bodyFont}`}>{page.tips[0]}</p>
              </div>
            )}
          </div>
        );

      case 'next_step':
        return (
          <div className="flex flex-col items-center justify-center text-center h-full py-8 gap-6">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mb-2 shadow-lg"
              style={{ backgroundColor: `${themeColor}15`, border: `2px solid ${themeColor}` }}
            >
              <Award size={40} style={{ color: themeColor }} />
            </div>

            <div className="space-y-3">
              <h2 className={`text-3xl font-black ${style.titleFont}`}>
                {page.title}
              </h2>
              {page.subtitle && (
                <p className={`text-sm max-w-md mx-auto leading-relaxed ${style.bodyFont}`}>
                  {page.subtitle}
                </p>
              )}
            </div>

            {page.blocks && page.blocks.length > 0 && (
              <div className={`p-4 rounded-xl max-w-md ${style.cardBg} border text-xs leading-relaxed`}>
                {page.blocks.map((block, idx) => (
                  <p key={idx} className={style.bodyFont}>{block}</p>
                ))}
              </div>
            )}

            {page.ctaText && (
              <a 
                href={page.ctaLink || '#'} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-bold text-sm shadow-md transition-all transform hover:-translate-y-0.5"
                style={{ backgroundColor: themeColor }}
              >
                {page.ctaText}
                <ArrowRight size={16} />
              </a>
            )}
          </div>
        );

      default:
        return <p className="text-error">Tipo de página desconhecido.</p>;
    }
  };

  return (
    <div 
      className={`pdf-page-container ${style.bg} ${page.type === 'cover' ? 'pdf-cover' : ''} flex flex-col`}
      style={{
        boxSizing: 'border-box',
        width: '100%',
        height: '100%',
        minHeight: '297mm',
        padding: page.type === 'cover' ? '40px' : '30px 40px 40px 40px',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {renderHeader()}
      <div className="flex-1 flex flex-col justify-start">
        {renderContent()}
      </div>
      {renderFooter()}
    </div>
  );
};
