import React from 'react';
import type { PdfPage } from '../../types/pdfbuilder';

interface PdfPageRendererProps {
  page: PdfPage;
  visualStyle: 'premium' | 'artesanal' | 'feminino' | 'dark' | 'minimalista' | 'educacional';
  themeColor: string;
  productName: string;
  pageIndex: number;
  totalPages: number;
}

// ─── Theme Definitions (pure inline styles, print-safe) ──────────────────────
interface Theme {
  pageBg: string;
  pageColor: string;
  headerBg: string;
  headerColor: string;
  titleColor: string;
  subtitleColor: string;
  bodyColor: string;
  mutedColor: string;
  cardBg: string;
  cardBorder: string;
  fontFamily: string;
  titleFamily: string;
  accentBar: string;
  footerBg: string;
  footerColor: string;
  badgeBg: string;
  badgeColor: string;
  coverPattern: string;
}

const getTheme = (
  visualStyle: PdfPageRendererProps['visualStyle'],
  themeColor: string
): Theme => {
  switch (visualStyle) {
    case 'premium':
      return {
        pageBg: '#0f172a',
        pageColor: '#e2e8f0',
        headerBg: 'rgba(255,255,255,0.04)',
        headerColor: '#94a3b8',
        titleColor: '#f8fafc',
        subtitleColor: '#cbd5e1',
        bodyColor: '#94a3b8',
        mutedColor: '#64748b',
        cardBg: 'rgba(255,255,255,0.04)',
        cardBorder: `rgba(${hexToRgb(themeColor)},0.3)`,
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        titleFamily: "'Playfair Display', Georgia, serif",
        accentBar: themeColor,
        footerBg: 'rgba(255,255,255,0.03)',
        footerColor: '#475569',
        badgeBg: `rgba(${hexToRgb(themeColor)},0.15)`,
        badgeColor: themeColor,
        coverPattern: `radial-gradient(ellipse at 20% 50%, rgba(${hexToRgb(themeColor)},0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(${hexToRgb(themeColor)},0.08) 0%, transparent 50%)`,
      };
    case 'artesanal':
      return {
        pageBg: '#fdf8f0',
        pageColor: '#3d1a00',
        headerBg: '#f0e6d3',
        headerColor: '#78350f',
        titleColor: '#3d1a00',
        subtitleColor: '#78350f',
        bodyColor: '#57270a',
        mutedColor: '#a16207',
        cardBg: '#fef3c7',
        cardBorder: '#d97706',
        fontFamily: "'Lora', Georgia, serif",
        titleFamily: "'Playfair Display', Georgia, serif",
        accentBar: '#d97706',
        footerBg: '#f0e6d3',
        footerColor: '#92400e',
        badgeBg: '#fde68a',
        badgeColor: '#92400e',
        coverPattern: `radial-gradient(circle at 90% 10%, #fde68a55 0%, transparent 40%), radial-gradient(circle at 10% 90%, #fcd34d33 0%, transparent 40%)`,
      };
    case 'feminino':
      return {
        pageBg: '#fff5f8',
        pageColor: '#4a0020',
        headerBg: '#fce7f3',
        headerColor: '#9d174d',
        titleColor: '#831843',
        subtitleColor: '#9d174d',
        bodyColor: '#6d1b3a',
        mutedColor: '#be185d',
        cardBg: '#fff0f6',
        cardBorder: '#f9a8d4',
        fontFamily: "'Lora', Georgia, serif",
        titleFamily: "'Playfair Display', Georgia, serif",
        accentBar: '#ec4899',
        footerBg: '#fce7f3',
        footerColor: '#9d174d',
        badgeBg: '#fce7f3',
        badgeColor: '#be185d',
        coverPattern: `radial-gradient(circle at 80% 20%, #fce7f388 0%, transparent 50%), radial-gradient(circle at 20% 80%, #fbcfe855 0%, transparent 40%)`,
      };
    case 'dark':
      return {
        pageBg: '#09090b',
        pageColor: '#d4d4d8',
        headerBg: '#18181b',
        headerColor: '#71717a',
        titleColor: '#fafafa',
        subtitleColor: '#a1a1aa',
        bodyColor: '#a1a1aa',
        mutedColor: '#52525b',
        cardBg: '#18181b',
        cardBorder: '#27272a',
        fontFamily: "'Space Grotesk', 'Inter', sans-serif",
        titleFamily: "'Space Grotesk', 'Inter', sans-serif",
        accentBar: themeColor,
        footerBg: '#18181b',
        footerColor: '#52525b',
        badgeBg: '#27272a',
        badgeColor: '#a1a1aa',
        coverPattern: `radial-gradient(ellipse at 50% 0%, rgba(${hexToRgb(themeColor)},0.12) 0%, transparent 60%)`,
      };
    case 'minimalista':
      return {
        pageBg: '#ffffff',
        pageColor: '#111827',
        headerBg: '#f9fafb',
        headerColor: '#6b7280',
        titleColor: '#111827',
        subtitleColor: '#374151',
        bodyColor: '#4b5563',
        mutedColor: '#9ca3af',
        cardBg: '#f9fafb',
        cardBorder: '#e5e7eb',
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        titleFamily: "'Inter', 'Helvetica Neue', sans-serif",
        accentBar: themeColor,
        footerBg: '#f9fafb',
        footerColor: '#9ca3af',
        badgeBg: '#f3f4f6',
        badgeColor: '#374151',
        coverPattern: '',
      };
    case 'educacional':
      return {
        pageBg: '#f0f9ff',
        pageColor: '#0c4a6e',
        headerBg: '#e0f2fe',
        headerColor: '#0369a1',
        titleColor: '#0c4a6e',
        subtitleColor: '#0369a1',
        bodyColor: '#075985',
        mutedColor: '#0284c7',
        cardBg: '#e0f2fe',
        cardBorder: '#7dd3fc',
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        titleFamily: "'Poppins', 'Inter', sans-serif",
        accentBar: '#0ea5e9',
        footerBg: '#e0f2fe',
        footerColor: '#0369a1',
        badgeBg: '#bae6fd',
        badgeColor: '#0c4a6e',
        coverPattern: `radial-gradient(circle at 80% 80%, #bae6fd55 0%, transparent 40%)`,
      };
  }
};

// ─── Hex to RGB helper ────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r},${g},${b}`;
}

// ─── Google Fonts Link (injected once) ───────────────────────────────────────
let fontsInjected = false;
function ensureFonts() {
  if (fontsInjected) return;
  fontsInjected = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href =
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700&family=Lora:wght@400;600;700&family=Space+Grotesk:wght@400;600;700&family=Poppins:wght@400;600;700;900&display=swap';
  document.head.appendChild(link);
}

// ─── Decorative SVG divider ───────────────────────────────────────────────────
const WaveDivider = ({ color }: { color: string }) => (
  <svg viewBox="0 0 200 8" style={{ width: '100%', height: 8, display: 'block', marginBottom: 16 }}>
    <path d="M0 4 Q25 0 50 4 Q75 8 100 4 Q125 0 150 4 Q175 8 200 4" stroke={color} strokeWidth="1.5" fill="none" opacity="0.5" />
  </svg>
);

// ─── Number Badge ─────────────────────────────────────────────────────────────
const NumBadge = ({ n, color }: { n: number; color: string }) => (
  <div style={{
    width: 28, height: 28, borderRadius: '50%',
    backgroundColor: color, color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  }}>
    {n}
  </div>
);

// ─── Checkmark icon ───────────────────────────────────────────────────────────
const CheckIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
    <rect width="18" height="18" rx="4" fill={color} opacity="0.15" />
    <path d="M4.5 9L7.5 12L13.5 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Alert Icon ───────────────────────────────────────────────────────────────
const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M9 2L16.5 15H1.5L9 2Z" fill="#ef444422" stroke="#ef4444" strokeWidth="1.5" />
    <path d="M9 7V10" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="9" cy="12.5" r="0.75" fill="#ef4444" />
  </svg>
);

// ─── Star Icon ────────────────────────────────────────────────────────────────
const StarIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill={color} style={{ flexShrink: 0 }}>
    <path d="M8 1L9.7 6H15L10.6 9.1L12.4 14L8 11L3.6 14L5.4 9.1L1 6H6.3L8 1Z" />
  </svg>
);

// ─── Main Renderer ────────────────────────────────────────────────────────────
export const PdfPageRenderer: React.FC<PdfPageRendererProps> = ({
  page,
  visualStyle,
  themeColor,
  productName,
  pageIndex,
  totalPages,
}) => {
  ensureFonts();
  const t = getTheme(visualStyle, themeColor);

  // Page wrapper styles
  const pageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    backgroundColor: t.pageBg,
    color: t.pageColor,
    fontFamily: t.fontFamily,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  };

  // ── HEADER ─────────────────────────────────────────────────────────────────
  const renderHeader = () => {
    if (page.type === 'cover') return null;
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 36px',
        backgroundColor: t.headerBg,
        borderBottom: `1px solid ${t.cardBorder}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: t.accentBar }} />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.headerColor }}>
            {productName}
          </span>
        </div>
        <span style={{ fontSize: 9, fontWeight: 600, color: t.mutedColor, letterSpacing: '0.08em' }}>
          {pageIndex} / {totalPages}
        </span>
      </div>
    );
  };

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  const renderFooter = () => {
    if (page.type === 'cover') return null;
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 36px',
        backgroundColor: t.footerBg,
        borderTop: `1px solid ${t.cardBorder}`,
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 8, color: t.footerColor }}>
          © {new Date().getFullYear()} {productName} — Todos os direitos reservados
        </span>
        <div style={{ width: 40, height: 2, borderRadius: 1, backgroundColor: t.accentBar, opacity: 0.5 }} />
      </div>
    );
  };

  // ── COVER ──────────────────────────────────────────────────────────────────
  const renderCover = () => (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '48px 48px 40px',
      position: 'relative',
      background: t.coverPattern ? `${t.coverPattern}, ${t.pageBg}` : t.pageBg,
    }}>
      {/* Top badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 18px', borderRadius: 100,
        backgroundColor: t.badgeBg, color: t.badgeColor,
        fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
        border: `1px solid ${t.cardBorder}`,
      }}>
        <StarIcon color={t.badgeColor} />
        Material Oficial · {productName}
      </div>

      {/* Main content */}
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        {/* Decorative top line */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ height: 1, width: 48, backgroundColor: t.accentBar, opacity: 0.5 }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: t.accentBar }} />
          <div style={{ height: 1, width: 48, backgroundColor: t.accentBar, opacity: 0.5 }} />
        </div>

        <h1 style={{
          fontFamily: t.titleFamily,
          fontSize: 38,
          fontWeight: 900,
          lineHeight: 1.15,
          color: t.titleColor,
          margin: '0 0 20px',
          letterSpacing: '-0.02em',
        }}>
          {page.title}
        </h1>

        {page.subtitle && (
          <p style={{
            fontSize: 14, lineHeight: 1.65,
            color: t.subtitleColor, margin: '0 0 32px',
            fontWeight: 400,
          }}>
            {page.subtitle}
          </p>
        )}

        {/* Accent divider */}
        <div style={{
          width: 64, height: 3, borderRadius: 2,
          backgroundColor: t.accentBar, margin: '0 auto',
        }} />
      </div>

      {/* Bottom area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        {/* Decorative icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          border: `2px solid ${t.accentBar}`,
          backgroundColor: `rgba(${hexToRgb(t.accentBar)},0.08)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32,
        }}>
          ✦
        </div>
        <p style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: t.mutedColor,
        }}>
          Guia de Implementação Rápida
        </p>
      </div>
    </div>
  );

  // ── INSTRUCTION ─────────────────────────────────────────────────────────────
  const renderInstruction = () => (
    <div style={{ flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Section tag */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: t.accentBar,
      }}>
        <div style={{ width: 16, height: 2, backgroundColor: t.accentBar }} />
        Introdução
      </div>

      <div>
        <h2 style={{
          fontFamily: t.titleFamily, fontSize: 26, fontWeight: 700,
          color: t.titleColor, margin: '0 0 8px', lineHeight: 1.2,
        }}>
          {page.title}
        </h2>
        {page.subtitle && (
          <p style={{ fontSize: 11, color: t.subtitleColor, margin: 0 }}>{page.subtitle}</p>
        )}
        <div style={{ height: 2, width: 40, backgroundColor: t.accentBar, borderRadius: 1, marginTop: 12 }} />
      </div>

      {/* Body blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {page.blocks?.map((block, idx) => (
          <p key={idx} style={{
            fontSize: 12, lineHeight: 1.8, color: t.bodyColor,
            margin: 0, borderLeft: idx === 0 ? `3px solid ${t.accentBar}` : 'none',
            paddingLeft: idx === 0 ? 14 : 0,
          }}>
            {block}
          </p>
        ))}
      </div>

      {/* Tips box */}
      {page.tips && page.tips.length > 0 && (
        <div style={{
          backgroundColor: t.cardBg,
          border: `1px solid ${t.cardBorder}`,
          borderRadius: 10, padding: '14px 16px',
          marginTop: 'auto',
        }}>
          <p style={{
            fontSize: 10, fontWeight: 700, color: t.accentBar,
            textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px',
          }}>
            💡 Pontos-chave
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {page.tips.map((tip, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <CheckIcon color={t.accentBar} />
                <span style={{ fontSize: 11, color: t.bodyColor, lineHeight: 1.6 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── MATERIALS ───────────────────────────────────────────────────────────────
  const renderMaterials = () => (
    <div style={{ flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.accentBar,
      }}>
        <div style={{ width: 16, height: 2, backgroundColor: t.accentBar }} /> Materiais Necessários
      </div>

      <div>
        <h2 style={{ fontFamily: t.titleFamily, fontSize: 26, fontWeight: 700, color: t.titleColor, margin: '0 0 8px', lineHeight: 1.2 }}>
          {page.title}
        </h2>
        {page.subtitle && <p style={{ fontSize: 11, color: t.subtitleColor, margin: 0 }}>{page.subtitle}</p>}
        <div style={{ height: 2, width: 40, backgroundColor: t.accentBar, borderRadius: 1, marginTop: 12 }} />
      </div>

      <WaveDivider color={t.accentBar} />

      {/* Grid of items */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {page.blocks?.map((mat, idx) => (
          <div key={idx} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', borderRadius: 8,
            backgroundColor: t.cardBg,
            border: `1px solid ${t.cardBorder}`,
          }}>
            <NumBadge n={idx + 1} color={t.accentBar} />
            <span style={{ fontSize: 11, fontWeight: 600, color: t.bodyColor, lineHeight: 1.4 }}>{mat}</span>
          </div>
        ))}
      </div>

      {page.tips && page.tips.length > 0 && (
        <div style={{
          borderLeft: `3px solid ${t.accentBar}`,
          paddingLeft: 14, marginTop: 4,
          backgroundColor: `rgba(${hexToRgb(t.accentBar)},0.04)`,
          borderRadius: '0 8px 8px 0', padding: '10px 14px',
        }}>
          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: t.accentBar, margin: '0 0 6px' }}>Macetes de Preparação</p>
          {page.tips.map((tip, idx) => (
            <p key={idx} style={{ fontSize: 11, color: t.bodyColor, margin: '0 0 4px', lineHeight: 1.6 }}>• {tip}</p>
          ))}
        </div>
      )}
    </div>
  );

  // ── TABLE ───────────────────────────────────────────────────────────────────
  const renderTable = () => (
    <div style={{ flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.accentBar }}>
        <div style={{ width: 16, height: 2, backgroundColor: t.accentBar }} /> Tabela de Referência
      </div>

      <div>
        <h2 style={{ fontFamily: t.titleFamily, fontSize: 26, fontWeight: 700, color: t.titleColor, margin: '0 0 8px', lineHeight: 1.2 }}>
          {page.title}
        </h2>
        {page.subtitle && <p style={{ fontSize: 11, color: t.subtitleColor, margin: 0 }}>{page.subtitle}</p>}
        <div style={{ height: 2, width: 40, backgroundColor: t.accentBar, borderRadius: 1, marginTop: 10 }} />
      </div>

      {page.blocks && page.blocks.length > 0 && (
        <p style={{ fontSize: 11, color: t.bodyColor, margin: 0, lineHeight: 1.6 }}>{page.blocks[0]}</p>
      )}

      {/* Table */}
      <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${t.cardBorder}`, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ backgroundColor: t.accentBar }}>
              {page.columns?.map((col, idx) => (
                <th key={idx} style={{
                  padding: '11px 14px', textAlign: 'left', color: '#fff',
                  fontWeight: 700, fontSize: 10, textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {page.rows?.map((row, rowIdx) => (
              <tr key={rowIdx} style={{ backgroundColor: rowIdx % 2 === 0 ? t.cardBg : t.pageBg }}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} style={{
                    padding: '10px 14px', color: cellIdx === 0 ? t.titleColor : t.bodyColor,
                    fontWeight: cellIdx === 0 ? 600 : 400,
                    borderBottom: `1px solid ${t.cardBorder}`,
                    lineHeight: 1.5,
                  }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {page.tips && page.tips.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          {page.tips.map((tip, idx) => (
            <p key={idx} style={{ fontSize: 10, color: t.mutedColor, fontStyle: 'italic', margin: 0 }}>* {tip}</p>
          ))}
        </div>
      )}
    </div>
  );

  // ── CHECKLIST ───────────────────────────────────────────────────────────────
  const renderChecklist = () => (
    <div style={{ flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.accentBar }}>
        <div style={{ width: 16, height: 2, backgroundColor: t.accentBar }} /> Checklist de Ação
      </div>

      <div>
        <h2 style={{ fontFamily: t.titleFamily, fontSize: 26, fontWeight: 700, color: t.titleColor, margin: '0 0 8px', lineHeight: 1.2 }}>
          {page.title}
        </h2>
        {page.subtitle && <p style={{ fontSize: 11, color: t.subtitleColor, margin: 0 }}>{page.subtitle}</p>}
        {page.blocks && page.blocks.length > 0 && (
          <p style={{ fontSize: 11, color: t.bodyColor, margin: '10px 0 0', lineHeight: 1.6 }}>{page.blocks[0]}</p>
        )}
        <div style={{ height: 2, width: 40, backgroundColor: t.accentBar, borderRadius: 1, marginTop: 12 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {page.checklist?.map((item, idx) => (
          <div key={idx} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '10px 14px', borderRadius: 8,
            backgroundColor: item.checked ? `rgba(${hexToRgb(t.accentBar)},0.06)` : t.cardBg,
            border: `1px solid ${item.checked ? t.accentBar : t.cardBorder}`,
            transition: 'all 0.2s',
          }}>
            {/* Checkbox */}
            <div style={{
              width: 18, height: 18, borderRadius: 4,
              border: `2px solid ${item.checked ? t.accentBar : t.mutedColor}`,
              backgroundColor: item.checked ? t.accentBar : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: 1,
            }}>
              {item.checked && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <span style={{
              fontSize: 12, color: item.checked ? t.mutedColor : t.bodyColor,
              lineHeight: 1.6, textDecoration: item.checked ? 'line-through' : 'none',
            }}>
              {item.label}
            </span>
            {/* Number badge on right */}
            <span style={{
              marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: t.mutedColor,
              minWidth: 20, textAlign: 'right',
            }}>
              {String(idx + 1).padStart(2, '0')}
            </span>
          </div>
        ))}
      </div>

      {page.tips && page.tips.length > 0 && (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          padding: '10px 14px', borderRadius: 8,
          backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)',
          marginTop: 4,
        }}>
          <AlertIcon />
          <p style={{ fontSize: 11, color: '#b45309', lineHeight: 1.6, margin: 0 }}>{page.tips[0]}</p>
        </div>
      )}
    </div>
  );

  // ── TIPS ────────────────────────────────────────────────────────────────────
  const renderTips = () => (
    <div style={{ flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.accentBar }}>
        <div style={{ width: 16, height: 2, backgroundColor: t.accentBar }} /> Dicas & Técnicas
      </div>

      <div>
        <h2 style={{ fontFamily: t.titleFamily, fontSize: 26, fontWeight: 700, color: t.titleColor, margin: '0 0 8px', lineHeight: 1.2 }}>
          {page.title}
        </h2>
        {page.subtitle && <p style={{ fontSize: 11, color: t.subtitleColor, margin: 0 }}>{page.subtitle}</p>}
        <div style={{ height: 2, width: 40, backgroundColor: t.accentBar, borderRadius: 1, marginTop: 12 }} />
      </div>

      {page.blocks && page.blocks.length > 0 && (
        <p style={{ fontSize: 12, color: t.bodyColor, lineHeight: 1.7, margin: 0, borderLeft: `3px solid ${t.accentBar}`, paddingLeft: 14 }}>
          {page.blocks[0]}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {page.tips?.map((tip, idx) => (
          <div key={idx} style={{
            display: 'flex', gap: 14, alignItems: 'flex-start',
            padding: '14px 16px', borderRadius: 10,
            backgroundColor: t.cardBg,
            border: `1px solid ${t.cardBorder}`,
            borderLeft: `4px solid ${t.accentBar}`,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              backgroundColor: `rgba(${hexToRgb(t.accentBar)},0.12)`,
              color: t.accentBar, fontSize: 11, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {String(idx + 1).padStart(2, '0')}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: t.accentBar, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>
                Dica #{idx + 1}
              </p>
              <p style={{ fontSize: 12, color: t.bodyColor, lineHeight: 1.65, margin: 0 }}>{tip}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── ERRORS ──────────────────────────────────────────────────────────────────
  const renderErrors = () => (
    <div style={{ flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ef4444' }}>
        <div style={{ width: 16, height: 2, backgroundColor: '#ef4444' }} /> Erros a Evitar
      </div>

      <div>
        <h2 style={{ fontFamily: t.titleFamily, fontSize: 26, fontWeight: 700, color: t.titleColor, margin: '0 0 8px', lineHeight: 1.2 }}>
          {page.title}
        </h2>
        {page.subtitle && <p style={{ fontSize: 11, color: t.subtitleColor, margin: 0 }}>{page.subtitle}</p>}
        {page.blocks && <p style={{ fontSize: 11, color: t.bodyColor, margin: '10px 0 0', lineHeight: 1.6 }}>{page.blocks[0]}</p>}
        <div style={{ height: 2, width: 40, backgroundColor: '#ef4444', borderRadius: 1, marginTop: 12 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {page.warnings?.map((warn, idx) => (
          <div key={idx} style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            padding: '12px 14px', borderRadius: 8,
            backgroundColor: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderLeft: '4px solid #ef4444',
          }}>
            <AlertIcon />
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>
                Erro #{idx + 1}
              </p>
              <p style={{ fontSize: 11, color: t.bodyColor, lineHeight: 1.6, margin: 0 }}>{warn}</p>
            </div>
          </div>
        ))}
      </div>

      {page.tips && page.tips.length > 0 && (
        <div style={{
          padding: '12px 16px', borderRadius: 8,
          backgroundColor: 'rgba(34,197,94,0.06)',
          border: '1px solid rgba(34,197,94,0.25)',
          borderLeft: '4px solid #22c55e',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', margin: '0 0 4px' }}>✅ A Solução Correta</p>
          <p style={{ fontSize: 11, color: t.bodyColor, lineHeight: 1.6, margin: 0 }}>{page.tips[0]}</p>
        </div>
      )}
    </div>
  );

  // ── CONTENT ─────────────────────────────────────────────────────────────────
  const renderContent = () => (
    <div style={{ flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: t.accentBar }}>
        <div style={{ width: 16, height: 2, backgroundColor: t.accentBar }} /> Conteúdo
      </div>

      <div>
        <h2 style={{ fontFamily: t.titleFamily, fontSize: 26, fontWeight: 700, color: t.titleColor, margin: '0 0 8px', lineHeight: 1.2 }}>
          {page.title}
        </h2>
        {page.subtitle && <p style={{ fontSize: 11, color: t.subtitleColor, margin: 0 }}>{page.subtitle}</p>}
        <div style={{ height: 2, width: 40, backgroundColor: t.accentBar, borderRadius: 1, marginTop: 12 }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {page.blocks?.map((block, idx) => (
          <p key={idx} style={{ fontSize: 12, lineHeight: 1.8, color: t.bodyColor, margin: 0 }}>{block}</p>
        ))}
      </div>

      {page.tips && page.tips.length > 0 && (
        <div style={{
          marginTop: 'auto', borderLeft: `3px solid ${t.accentBar}`,
          paddingLeft: 14, padding: '10px 16px',
          backgroundColor: `rgba(${hexToRgb(t.accentBar)},0.04)`,
          borderRadius: '0 8px 8px 0',
        }}>
          <p style={{ fontSize: 11, fontStyle: 'italic', color: t.bodyColor, margin: 0, lineHeight: 1.6 }}>{page.tips[0]}</p>
        </div>
      )}
    </div>
  );

  // ── NEXT STEP (CTA) ─────────────────────────────────────────────────────────
  const renderNextStep = () => (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 48px', textAlign: 'center',
      background: t.coverPattern ? `${t.coverPattern}, ${t.pageBg}` : t.pageBg,
    }}>
      {/* Icon */}
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        border: `2px solid ${t.accentBar}`,
        backgroundColor: `rgba(${hexToRgb(t.accentBar)},0.08)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, marginBottom: 24,
      }}>
        🚀
      </div>

      <div style={{ maxWidth: 440 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.accentBar, margin: '0 0 12px' }}>
          Próximo Passo
        </p>
        <h2 style={{ fontFamily: t.titleFamily, fontSize: 32, fontWeight: 900, color: t.titleColor, margin: '0 0 16px', lineHeight: 1.2 }}>
          {page.title}
        </h2>
        {page.subtitle && (
          <p style={{ fontSize: 13, color: t.subtitleColor, lineHeight: 1.7, margin: '0 0 24px' }}>
            {page.subtitle}
          </p>
        )}

        {page.blocks && page.blocks.length > 0 && (
          <div style={{
            padding: '14px 20px', borderRadius: 10,
            backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`,
            marginBottom: 24, textAlign: 'left',
          }}>
            {page.blocks.map((block, idx) => (
              <p key={idx} style={{ fontSize: 11, color: t.bodyColor, lineHeight: 1.7, margin: '0 0 4px' }}>{block}</p>
            ))}
          </div>
        )}

        {/* Decorative divider */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 }}>
          <div style={{ height: 1, width: 32, backgroundColor: t.accentBar, opacity: 0.4 }} />
          <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: t.accentBar }} />
          <div style={{ height: 1, width: 32, backgroundColor: t.accentBar, opacity: 0.4 }} />
        </div>

        {page.ctaText && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 20, padding: '12px 28px', borderRadius: 8,
            backgroundColor: t.accentBar, color: '#fff',
            fontWeight: 700, fontSize: 13, letterSpacing: '0.03em',
          }}>
            {page.ctaText} →
          </div>
        )}
      </div>
    </div>
  );

  // ── DISPATCH ────────────────────────────────────────────────────────────────
  const renderBody = () => {
    switch (page.type) {
      case 'cover':     return renderCover();
      case 'instruction': return renderInstruction();
      case 'materials':   return renderMaterials();
      case 'table':       return renderTable();
      case 'checklist':   return renderChecklist();
      case 'tips':        return renderTips();
      case 'errors':      return renderErrors();
      case 'content':     return renderContent();
      case 'next_step':   return renderNextStep();
      default:
        return <p style={{ padding: 24, color: 'red' }}>Tipo de página desconhecido.</p>;
    }
  };

  return (
    <div style={pageStyle}>
      {renderHeader()}
      {renderBody()}
      {renderFooter()}
    </div>
  );
};

export default PdfPageRenderer;
