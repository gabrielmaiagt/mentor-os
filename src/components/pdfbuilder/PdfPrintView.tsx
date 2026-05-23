import React from 'react';
import { Printer, ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { PdfPageRenderer } from './PdfTemplates';
import type { PdfBriefing } from '../../types/pdfbuilder';
import './PdfPrintView.css';

interface PdfPrintViewProps {
  briefing: PdfBriefing;
  onBack: () => void;
  onRegenerate?: () => void;
}

export const PdfPrintView: React.FC<PdfPrintViewProps> = ({
  briefing,
  onBack,
  onRegenerate,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(briefing, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${briefing.refinedTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_structure.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="pdf-print-view-container">
      {/* Top Controller Bar - Hidden when printing */}
      <div className="pdf-print-controls no-print glass-card p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="flex items-center gap-1 text-sm text-secondary hover:text-primary transition-colors py-1.5 px-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10"
          >
            <ArrowLeft size={16} /> Voltar ao Editor
          </button>
          <div>
            <h3 className="font-bold text-base text-primary line-clamp-1">{briefing.refinedTitle}</h3>
            <p className="text-[11px] text-secondary">Estilo: <span className="capitalize font-semibold text-accent-primary">{briefing.visualStyle}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button 
              onClick={onRegenerate}
              className="flex items-center gap-1.5 text-xs py-2 px-3 bg-white/5 border border-white/10 hover:bg-white/10 text-secondary rounded-lg font-medium transition-colors"
            >
              <RefreshCw size={14} /> Regerar IA
            </button>
          )}
          <button 
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 text-xs py-2 px-3 bg-white/5 border border-white/10 hover:bg-white/10 text-secondary rounded-lg font-medium transition-colors"
            title="Exportar estrutura do entregável em JSON"
          >
            <Download size={14} /> Exportar JSON
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-sm py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow transition-all transform hover:-translate-y-0.5"
          >
            <Printer size={16} /> Gerar PDF (Imprimir)
          </button>
        </div>
      </div>

      {/* Screen Presentation Preview area */}
      <div className="pdf-preview-pane no-print">
        <div className="pdf-preview-scroll-container">
          <div className="pdf-printable-area-preview">
            {briefing.pages.map((page, idx) => (
              <div key={idx} className="pdf-page-screen-wrapper">
                <PdfPageRenderer
                  page={page}
                  visualStyle={briefing.visualStyle}
                  themeColor={briefing.themeColor}
                  productName={briefing.refinedTitle}
                  pageIndex={idx + 1}
                  totalPages={briefing.pages.length}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Print-Only Area (Absolutely positioned and formatted for physical A4 paper print) */}
      <div className="pdf-printable-area print-only">
        {briefing.pages.map((page, idx) => (
          <div key={idx} className="pdf-page-print-wrapper">
            <PdfPageRenderer
              page={page}
              visualStyle={briefing.visualStyle}
              themeColor={briefing.themeColor}
              productName={briefing.refinedTitle}
              pageIndex={idx + 1}
              totalPages={briefing.pages.length}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
export default PdfPrintView;
