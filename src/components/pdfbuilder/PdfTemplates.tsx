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

// ─── Theme Definitions ────────────────────────────────────────────────────────
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
  accent: string;
  accent2: string;
  footerBg: string;
  footerColor: string;
  badgeBg: string;
  badgeColor: string;
  isDark: boolean;
}

function hexToRgb(hex: string): string {
  const c = hex.replace('#', '');
  const n = parseInt(c.length === 3 ? c.split('').map(x => x + x).join('') : c, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

const getTheme = (style: PdfPageRendererProps['visualStyle'], color: string): Theme => {
  const themes: Record<string, Theme> = {
    premium: {
      pageBg: '#0f172a', pageColor: '#e2e8f0',
      headerBg: 'rgba(255,255,255,0.04)', headerColor: '#94a3b8',
      titleColor: '#f8fafc', subtitleColor: '#cbd5e1',
      bodyColor: '#94a3b8', mutedColor: '#475569',
      cardBg: 'rgba(255,255,255,0.05)', cardBorder: 'rgba(167,139,250,0.25)',
      fontFamily: "'Inter','Helvetica Neue',sans-serif",
      titleFamily: "'Playfair Display',Georgia,serif",
      accent: color || '#a78bfa', accent2: '#818cf8',
      footerBg: 'rgba(255,255,255,0.03)', footerColor: '#334155',
      badgeBg: 'rgba(167,139,250,0.15)', badgeColor: '#a78bfa', isDark: true,
    },
    artesanal: {
      pageBg: '#fdf8f0', pageColor: '#3d1a00',
      headerBg: '#f0e6d3', headerColor: '#78350f',
      titleColor: '#3d1a00', subtitleColor: '#78350f',
      bodyColor: '#57270a', mutedColor: '#a16207',
      cardBg: '#fff8ed', cardBorder: '#e5c07b',
      fontFamily: "'Lora',Georgia,serif",
      titleFamily: "'Playfair Display',Georgia,serif",
      accent: color || '#d97706', accent2: '#b45309',
      footerBg: '#f0e6d3', footerColor: '#92400e',
      badgeBg: '#fde68a', badgeColor: '#92400e', isDark: false,
    },
    feminino: {
      pageBg: '#fff5f8', pageColor: '#4a0020',
      headerBg: '#fce7f3', headerColor: '#9d174d',
      titleColor: '#831843', subtitleColor: '#9d174d',
      bodyColor: '#6d1b3a', mutedColor: '#be185d',
      cardBg: '#fff0f6', cardBorder: '#f9a8d4',
      fontFamily: "'Lora',Georgia,serif",
      titleFamily: "'Playfair Display',Georgia,serif",
      accent: color || '#ec4899', accent2: '#db2777',
      footerBg: '#fce7f3', footerColor: '#9d174d',
      badgeBg: '#fce7f3', badgeColor: '#be185d', isDark: false,
    },
    dark: {
      pageBg: '#09090b', pageColor: '#d4d4d8',
      headerBg: '#18181b', headerColor: '#71717a',
      titleColor: '#fafafa', subtitleColor: '#a1a1aa',
      bodyColor: '#a1a1aa', mutedColor: '#52525b',
      cardBg: '#18181b', cardBorder: '#27272a',
      fontFamily: "'Space Grotesk','Inter',sans-serif",
      titleFamily: "'Space Grotesk','Inter',sans-serif",
      accent: color || '#4ade80', accent2: '#22d3ee',
      footerBg: '#18181b', footerColor: '#52525b',
      badgeBg: '#27272a', badgeColor: '#a1a1aa', isDark: true,
    },
    minimalista: {
      pageBg: '#ffffff', pageColor: '#111827',
      headerBg: '#f9fafb', headerColor: '#6b7280',
      titleColor: '#111827', subtitleColor: '#374151',
      bodyColor: '#4b5563', mutedColor: '#9ca3af',
      cardBg: '#f9fafb', cardBorder: '#e5e7eb',
      fontFamily: "'Inter','Helvetica Neue',sans-serif",
      titleFamily: "'Inter','Helvetica Neue',sans-serif",
      accent: color || '#111827', accent2: '#6b7280',
      footerBg: '#f9fafb', footerColor: '#9ca3af',
      badgeBg: '#f3f4f6', badgeColor: '#374151', isDark: false,
    },
    educacional: {
      pageBg: '#f0f9ff', pageColor: '#0c4a6e',
      headerBg: '#e0f2fe', headerColor: '#0369a1',
      titleColor: '#0c4a6e', subtitleColor: '#0369a1',
      bodyColor: '#075985', mutedColor: '#0284c7',
      cardBg: '#e0f2fe', cardBorder: '#7dd3fc',
      fontFamily: "'Poppins','Inter',sans-serif",
      titleFamily: "'Poppins','Inter',sans-serif",
      accent: color || '#0ea5e9', accent2: '#6366f1',
      footerBg: '#e0f2fe', footerColor: '#0369a1',
      badgeBg: '#bae6fd', badgeColor: '#0c4a6e', isDark: false,
    },
  };
  return themes[style] || themes.educacional;
};

// ─── Google Fonts ─────────────────────────────────────────────────────────────
let fontsInjected = false;
function ensureFonts() {
  if (fontsInjected || typeof document === 'undefined') return;
  fontsInjected = true;
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Inter:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Space+Grotesk:wght@400;500;600;700&family=Poppins:wght@400;600;700;800;900&display=swap';
  document.head.appendChild(l);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SVG DECORATIONS  — All inline, 100% print-safe
// ═══════════════════════════════════════════════════════════════════════════════

/** Geometric background art for covers */
const CoverArt = ({ accent, accent2, isDark }: { accent: string; accent2: string; isDark: boolean }) => (
  <svg viewBox="0 0 420 520" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }} aria-hidden>
    {/* Large circle top-right */}
    <circle cx="380" cy="60" r="140" fill={accent} />
    {/* Small circle top-left */}
    <circle cx="40" cy="120" r="60" fill={accent2} opacity="0.5" />
    {/* Big ring bottom-left */}
    <circle cx="60" cy="450" r="120" fill="none" stroke={accent} strokeWidth="28" />
    {/* Diagonal lines */}
    <line x1="0" y1="200" x2="420" y2="380" stroke={accent2} strokeWidth="1.5" opacity="0.6" />
    <line x1="0" y1="240" x2="420" y2="420" stroke={accent2} strokeWidth="0.8" opacity="0.4" />
    {/* Triangle decoration */}
    <polygon points="320,400 400,520 240,520" fill={accent} opacity="0.3" />
    {/* Small squares */}
    <rect x="150" y="30" width="18" height="18" rx="3" fill={accent2} opacity="0.6" transform="rotate(15 159 39)" />
    <rect x="30" y="300" width="12" height="12" rx="2" fill={accent} opacity="0.5" transform="rotate(-10 36 306)" />
    {/* Dots grid */}
    {[1,2,3,4,5].map(col => [1,2,3].map(row => (
      <circle key={`${col}-${row}`} cx={290 + col * 18} cy={160 + row * 18} r="2" fill={isDark ? '#fff' : accent} opacity="0.3" />
    )))}
  </svg>
);

/** Artisanal floral / craft SVG */
const ArtisanalArt = ({ accent }: { accent: string }) => (
  <svg viewBox="0 0 420 520" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }} aria-hidden>
    {/* Large decorative circle */}
    <circle cx="340" cy="80" r="130" fill={accent} />
    {/* Vine swirl */}
    <path d="M 20 260 Q 80 180 140 240 Q 200 300 160 380 Q 120 460 80 420" stroke={accent} strokeWidth="3" fill="none" />
    {/* Leaf shapes */}
    <ellipse cx="90" cy="220" rx="22" ry="40" fill={accent} transform="rotate(-30 90 220)" opacity="0.6" />
    <ellipse cx="140" cy="300" rx="20" ry="35" fill={accent} transform="rotate(20 140 300)" opacity="0.5" />
    {/* Small flowers */}
    {[0,60,120,180,240,300].map((angle, i) => (
      <g key={i} transform={`translate(320,420) rotate(${angle})`}>
        <ellipse cx="0" cy="-18" rx="7" ry="13" fill={accent} opacity="0.4" />
      </g>
    ))}
    <circle cx="320" cy="420" r="9" fill={accent} opacity="0.7" />
    {/* Bottom bow decoration */}
    <path d="M 140 490 Q 160 470 210 490 Q 260 510 280 490" stroke={accent} strokeWidth="2.5" fill="none" />
    <path d="M 140 490 Q 160 510 210 490 Q 260 470 280 490" stroke={accent} strokeWidth="2.5" fill="none" />
    <circle cx="210" cy="490" r="5" fill={accent} />
    {/* Corner ornament */}
    <path d="M 0 0 Q 40 30 0 60" stroke={accent} strokeWidth="2" fill="none" opacity="0.5" />
    <path d="M 0 0 Q 30 40 60 0" stroke={accent} strokeWidth="2" fill="none" opacity="0.5" />
  </svg>
);

/** Feminine / floral SVG */
const FemininoArt = ({ accent }: { accent: string }) => (
  <svg viewBox="0 0 420 520" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.14 }} aria-hidden>
    {/* Background circle */}
    <circle cx="370" cy="100" r="160" fill={accent} />
    {/* Rose petals top right */}
    {[0,45,90,135,180,225,270,315].map((a, i) => (
      <g key={i} transform={`translate(370,100) rotate(${a})`}>
        <ellipse cx="0" cy="-55" rx="18" ry="32" fill="#fff" opacity="0.4" />
      </g>
    ))}
    <circle cx="370" cy="100" r="20" fill={accent} opacity="0.8" />
    {/* Scattered petals */}
    <ellipse cx="60" cy="200" rx="14" ry="24" fill={accent} opacity="0.25" transform="rotate(-40 60 200)" />
    <ellipse cx="90" cy="350" rx="10" ry="18" fill={accent} opacity="0.2" transform="rotate(20 90 350)" />
    {/* Hearts bottom */}
    <path d="M 200 460 C 200 452 190 444 180 452 C 170 460 200 480 200 480 C 200 480 230 460 220 452 C 210 444 200 452 200 460Z" fill={accent} opacity="0.3" />
    <path d="M 280 430 C 280 424 273 418 266 424 C 259 430 280 445 280 445 C 280 445 301 430 294 424 C 287 418 280 424 280 430Z" fill={accent} opacity="0.2" />
    {/* Sparkle stars */}
    {[[50,60],[350,300],[100,440],[380,400]].map(([x,y],i) => (
      <g key={i} transform={`translate(${x},${y})`}>
        <path d="M0-8L1-1L8 0L1 1L0 8L-1 1L-8 0L-1-1Z" fill={accent} opacity="0.3" />
      </g>
    ))}
  </svg>
);

/** Section icon illustrations (SVG) */
const SectionIcon = ({ type, color, size = 48 }: { type: string; color: string; size?: number }) => {
  const s = size;
  const icons: Record<string, JSX.Element> = {
    instruction: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill={color} fillOpacity="0.12" />
        <rect x="10" y="12" width="28" height="4" rx="2" fill={color} opacity="0.8" />
        <rect x="10" y="20" width="22" height="3" rx="1.5" fill={color} opacity="0.5" />
        <rect x="10" y="27" width="25" height="3" rx="1.5" fill={color} opacity="0.5" />
        <rect x="10" y="34" width="16" height="3" rx="1.5" fill={color} opacity="0.3" />
        <circle cx="38" cy="34" r="6" fill={color} />
        <path d="M35 34L37 36L41 32" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    materials: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill={color} fillOpacity="0.12" />
        <rect x="8" y="22" width="14" height="18" rx="2" fill={color} opacity="0.7" />
        <rect x="26" y="16" width="14" height="24" rx="2" fill={color} opacity="0.5" />
        <rect x="17" y="10" width="14" height="30" rx="2" fill={color} opacity="0.9" />
        <rect x="9" y="8" width="30" height="3" rx="1.5" fill={color} />
      </svg>
    ),
    checklist: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill={color} fillOpacity="0.12" />
        {[14,22,30,38].map((y, i) => (
          <g key={i}>
            <rect x="10" y={y-4} width="8" height="8" rx="2" fill={i < 3 ? color : 'none'} stroke={color} strokeWidth="1.5" opacity={i < 3 ? 1 : 0.4} />
            {i < 3 && <path d={`M${11} ${y} L${13} ${y+2} L${17} ${y-2}`} stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />}
            <rect x="22" y={y-2} width={i < 3 ? 18 - i*2 : 10} height="3" rx="1.5" fill={color} opacity={i < 3 ? 0.6 : 0.25} />
          </g>
        ))}
      </svg>
    ),
    tips: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill={color} fillOpacity="0.12" />
        <path d="M24 8C17.37 8 12 13.37 12 20C12 24.5 14.5 28.4 18.2 30.5V34H29.8V30.5C33.5 28.4 36 24.5 36 20C36 13.37 30.63 8 24 8Z" fill={color} opacity="0.8" />
        <rect x="18" y="36" width="12" height="3" rx="1.5" fill={color} opacity="0.6" />
        <rect x="20" y="40" width="8" height="2" rx="1" fill={color} opacity="0.4" />
        <line x1="24" y1="16" x2="24" y2="24" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="27" r="1.5" fill="#fff" />
      </svg>
    ),
    errors: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="#ef4444" fillOpacity="0.1" />
        <path d="M24 10L42 40H6L24 10Z" fill="#ef4444" opacity="0.15" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" />
        <line x1="24" y1="22" x2="24" y2="31" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="24" cy="35" r="1.8" fill="#ef4444" />
      </svg>
    ),
    table: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill={color} fillOpacity="0.12" />
        <rect x="8" y="10" width="32" height="8" rx="2" fill={color} opacity="0.9" />
        {[22,30,38].map((y, i) => (
          <g key={i}>
            <rect x="8" y={y} width="14" height="6" rx="1" fill={color} opacity={0.3 + i * 0.15} />
            <rect x="25" y={y} width="15" height="6" rx="1" fill={color} opacity={0.2 + i * 0.1} />
          </g>
        ))}
      </svg>
    ),
    content: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill={color} fillOpacity="0.12" />
        <rect x="8" y="10" width="32" height="3" rx="1.5" fill={color} opacity="0.9" />
        {[17,23,29,35].map((y, i) => (
          <rect key={i} x="8" y={y} width={24 + (i % 2) * 8} height="2.5" rx="1.25" fill={color} opacity={0.4 + i * 0.05} />
        ))}
      </svg>
    ),
    next_step: (
      <svg width={s} height={s} viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill={color} fillOpacity="0.12" />
        <circle cx="24" cy="24" r="14" fill={color} opacity="0.9" />
        <path d="M20 18L30 24L20 30V18Z" fill="#fff" />
      </svg>
    ),
  };
  return icons[type] || icons.content;
};

/** Decorative divider wave */
const WaveDivider = ({ color, opacity = 0.4 }: { color: string; opacity?: number }) => (
  <svg viewBox="0 0 300 8" style={{ width: '100%', height: 8, display: 'block', margin: '12px 0' }} aria-hidden>
    <path d="M0 4 Q37.5 0 75 4 Q112.5 8 150 4 Q187.5 0 225 4 Q262.5 8 300 4" stroke={color} strokeWidth="1.5" fill="none" opacity={opacity} />
  </svg>
);

/** Dot pattern decoration */
const DotGrid = ({ color, cols = 6, rows = 4 }: { color: string; cols?: number; rows?: number }) => (
  <svg viewBox={`0 0 ${cols * 14} ${rows * 14}`} style={{ width: cols * 14, height: rows * 14, opacity: 0.3 }} aria-hidden>
    {Array.from({ length: rows }).map((_, r) =>
      Array.from({ length: cols }).map((_, c) => (
        <circle key={`${r}-${c}`} cx={7 + c * 14} cy={7 + r * 14} r="2" fill={color} />
      ))
    )}
  </svg>
);

/** Corner ornament SVG */
const CornerOrnament = ({ color, flip = false }: { color: string; flip?: boolean }) => (
  <svg width="60" height="60" viewBox="0 0 60 60" style={{ opacity: 0.3, transform: flip ? 'scaleX(-1)' : 'none' }} aria-hidden>
    <path d="M 0 60 Q 0 0 60 0" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M 0 60 Q 0 15 45 15" stroke={color} strokeWidth="1" fill="none" opacity="0.5" />
    <circle cx="60" cy="0" r="4" fill={color} />
    <circle cx="0" cy="60" r="4" fill={color} />
  </svg>
);

/** Progress strip */
const ProgressStrip = ({ current, total, color }: { current: number; total: number; color: string }) => (
  <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        height: 3, flex: 1, borderRadius: 2,
        backgroundColor: i < current ? color : `rgba(${hexToRgb(color)},0.2)`,
        transition: 'background 0.3s',
      }} />
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN RENDERER
// ═══════════════════════════════════════════════════════════════════════════════
export const PdfPageRenderer: React.FC<PdfPageRendererProps> = ({
  page, visualStyle, themeColor, productName, pageIndex, totalPages,
}) => {
  ensureFonts();
  const t = getTheme(visualStyle, themeColor);
  const accent = t.accent;
  const accentRgb = hexToRgb(accent);

  const pageStyle: React.CSSProperties = {
    width: '100%', height: '100%', boxSizing: 'border-box',
    backgroundColor: t.pageBg, color: t.pageColor,
    fontFamily: t.fontFamily, display: 'flex', flexDirection: 'column',
    position: 'relative', overflow: 'hidden',
  };

  // ── HEADER ──────────────────────────────────────────────────────────────────
  const renderHeader = () => {
    if (page.type === 'cover') return null;
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 36px', backgroundColor: t.headerBg,
        borderBottom: `1px solid ${t.cardBorder}`, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 14, borderRadius: 2, backgroundColor: accent }} />
          <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.headerColor }}>
            {productName}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ProgressStrip current={pageIndex} total={totalPages} color={accent} />
          <span style={{ fontSize: 8.5, fontWeight: 600, color: t.mutedColor, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
            {pageIndex} / {totalPages}
          </span>
        </div>
      </div>
    );
  };

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  const renderFooter = () => {
    if (page.type === 'cover') return null;
    return (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '9px 36px', backgroundColor: t.footerBg,
        borderTop: `1px solid ${t.cardBorder}`, flexShrink: 0,
      }}>
        <span style={{ fontSize: 7.5, color: t.footerColor }}>
          © {new Date().getFullYear()} {productName}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <DotGrid color={accent} cols={4} rows={1} />
        </div>
        <span style={{ fontSize: 7.5, color: t.footerColor }}>
          Material Exclusivo · Todos os direitos reservados
        </span>
      </div>
    );
  };

  // ── COVER ────────────────────────────────────────────────────────────────────
  const renderCover = () => {
    const hasFeminine = visualStyle === 'feminino';
    const hasArtisanal = visualStyle === 'artesanal';
    const hasDark = visualStyle === 'dark' || visualStyle === 'premium';

    return (
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Background art */}
        {hasFeminine
          ? <FemininoArt accent={accent} />
          : hasArtisanal
          ? <ArtisanalArt accent={accent} />
          : <CoverArt accent={accent} accent2={t.accent2} isDark={hasDark} />
        }

        {/* Corner ornaments */}
        <div style={{ position: 'absolute', top: 0, left: 0 }}>
          <CornerOrnament color={accent} />
        </div>
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <CornerOrnament color={accent} flip />
        </div>

        {/* Content */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '52px 56px 44px', position: 'relative', zIndex: 1,
        }}>
          {/* TOP badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '7px 20px', borderRadius: 100,
            backgroundColor: t.badgeBg, border: `1.5px solid ${accent}`,
            fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
            textTransform: 'uppercase', color: t.badgeColor,
          }}>
            ✦ Material Exclusivo · {productName}
          </div>

          {/* CENTER: main title block */}
          <div style={{ textAlign: 'center', maxWidth: 460 }}>
            {/* Visual accent row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 28 }}>
              <div style={{ height: 1.5, flex: 1, maxWidth: 60, background: `linear-gradient(to right, transparent, ${accent})` }} />
              <svg width="20" height="20" viewBox="0 0 20 20" fill={accent} style={{ opacity: 0.8 }}>
                <path d="M10 0L11.8 7.2L19 10L11.8 12.8L10 20L8.2 12.8L1 10L8.2 7.2L10 0Z" />
              </svg>
              <div style={{ height: 1.5, flex: 1, maxWidth: 60, background: `linear-gradient(to left, transparent, ${accent})` }} />
            </div>

            <h1 style={{
              fontFamily: t.titleFamily, fontSize: 40, fontWeight: 900,
              lineHeight: 1.12, color: t.titleColor, margin: '0 0 18px',
              letterSpacing: '-0.02em',
            }}>
              {page.title}
            </h1>

            {page.subtitle && (
              <p style={{
                fontSize: 14, lineHeight: 1.7, color: t.subtitleColor,
                margin: '0 0 28px', fontStyle: hasFeminine || hasArtisanal ? 'italic' : 'normal',
              }}>
                {page.subtitle}
              </p>
            )}

            {/* Accent line */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 3, borderRadius: 2, backgroundColor: accent, opacity: 0.4 }} />
              <div style={{ width: 40, height: 3, borderRadius: 2, backgroundColor: accent }} />
              <div style={{ width: 12, height: 3, borderRadius: 2, backgroundColor: accent, opacity: 0.4 }} />
            </div>
          </div>

          {/* BOTTOM: icon + label */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            {/* Big icon circle */}
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: `radial-gradient(circle at 35% 35%, rgba(${accentRgb},0.3), rgba(${accentRgb},0.08))`,
              border: `2.5px solid ${accent}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38, boxShadow: `0 8px 32px rgba(${accentRgb},0.3)`,
            }}>
              {visualStyle === 'artesanal' ? '🎀'
                : visualStyle === 'feminino' ? '🌸'
                : visualStyle === 'dark' ? '⚡'
                : visualStyle === 'educacional' ? '📘'
                : visualStyle === 'minimalista' ? '◆'
                : '✦'}
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, margin: '0 0 2px' }}>
                Guia Completo de Implementação
              </p>
              <p style={{ fontSize: 8, color: t.mutedColor, margin: 0, letterSpacing: '0.06em' }}>
                {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── SECTION PAGE TEMPLATE (reusable layout) ─────────────────────────────────
  const SectionHeader = ({ typeLabel, icon }: { typeLabel: string; icon: JSX.Element }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
      {/* Icon illustration */}
      {icon}

      <div style={{ flex: 1 }}>
        <p style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: accent, margin: '0 0 4px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ display: 'inline-block', width: 16, height: 2, backgroundColor: accent, borderRadius: 1 }} />
          {typeLabel}
        </p>
        <h2 style={{
          fontFamily: t.titleFamily, fontSize: 24, fontWeight: 700,
          color: t.titleColor, margin: '0 0 4px', lineHeight: 1.2,
        }}>
          {page.title}
        </h2>
        {page.subtitle && (
          <p style={{ fontSize: 11, color: t.subtitleColor, margin: 0, lineHeight: 1.5 }}>
            {page.subtitle}
          </p>
        )}
      </div>

      {/* Dot grid decoration top-right */}
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <DotGrid color={accent} cols={5} rows={3} />
      </div>
    </div>
  );

  // ── INSTRUCTION ──────────────────────────────────────────────────────────────
  const renderInstruction = () => (
    <div style={{ flex: 1, padding: '24px 36px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader typeLabel="Introdução" icon={<SectionIcon type="instruction" color={accent} />} />
      <WaveDivider color={accent} />

      {/* Body paragraphs with left accent */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {page.blocks?.map((block, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 12 }}>
            {idx === 0 && <div style={{ width: 3, borderRadius: 2, backgroundColor: accent, flexShrink: 0 }} />}
            <p style={{ fontSize: 12, lineHeight: 1.8, color: t.bodyColor, margin: 0 }}>{block}</p>
          </div>
        ))}
      </div>

      {/* Tips box */}
      {page.tips && page.tips.length > 0 && (
        <div style={{
          marginTop: 'auto',
          background: `linear-gradient(135deg, rgba(${accentRgb},0.08), rgba(${accentRgb},0.03))`,
          border: `1px solid rgba(${accentRgb},0.25)`,
          borderRadius: 12, padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <SectionIcon type="tips" color={accent} size={28} />
            <p style={{ fontSize: 10, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
              Pontos-Chave
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {page.tips.map((tip, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
                  backgroundColor: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4.2 7L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <span style={{ fontSize: 11, color: t.bodyColor, lineHeight: 1.6 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── MATERIALS ────────────────────────────────────────────────────────────────
  const renderMaterials = () => (
    <div style={{ flex: 1, padding: '24px 36px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader typeLabel="Lista de Materiais" icon={<SectionIcon type="materials" color={accent} />} />
      <WaveDivider color={accent} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        {page.blocks?.map((mat, idx) => (
          <div key={idx} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '11px 14px', borderRadius: 10,
            backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Left color bar */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: accent, borderRadius: '10px 0 0 10px' }} />
            {/* Number */}
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              backgroundColor: accent, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800,
            }}>
              {idx + 1}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: t.bodyColor, lineHeight: 1.4 }}>{mat}</span>
          </div>
        ))}
      </div>

      {page.tips && page.tips.length > 0 && (
        <div style={{
          marginTop: 6,
          borderLeft: `3px solid ${accent}`,
          paddingLeft: 14, padding: '10px 16px',
          background: `rgba(${accentRgb},0.05)`,
          borderRadius: '0 10px 10px 0',
        }}>
          <p style={{ fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase', color: accent, margin: '0 0 6px', letterSpacing: '0.1em' }}>
            🔑 Macetes de Preparação
          </p>
          {page.tips.map((tip, idx) => (
            <p key={idx} style={{ fontSize: 11, color: t.bodyColor, margin: '0 0 4px', lineHeight: 1.6 }}>• {tip}</p>
          ))}
        </div>
      )}
    </div>
  );

  // ── TABLE ────────────────────────────────────────────────────────────────────
  const renderTable = () => (
    <div style={{ flex: 1, padding: '24px 36px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionHeader typeLabel="Tabela de Referência" icon={<SectionIcon type="table" color={accent} />} />

      {page.blocks && page.blocks.length > 0 && (
        <p style={{ fontSize: 11.5, color: t.bodyColor, margin: 0, lineHeight: 1.65, borderLeft: `3px solid ${accent}`, paddingLeft: 12 }}>
          {page.blocks[0]}
        </p>
      )}

      {/* Premium table */}
      <div style={{ borderRadius: 12, overflow: 'hidden', border: `1.5px solid ${t.cardBorder}`, boxShadow: `0 4px 20px rgba(${accentRgb},0.1)` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ background: `linear-gradient(135deg, ${accent}, ${t.accent2})` }}>
              {page.columns?.map((col, idx) => (
                <th key={idx} style={{
                  padding: '12px 14px', textAlign: 'left', color: '#fff',
                  fontWeight: 800, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {page.rows?.map((row, rowIdx) => (
              <tr key={rowIdx} style={{
                backgroundColor: rowIdx % 2 === 0 ? t.cardBg : t.pageBg,
                borderBottom: `1px solid ${t.cardBorder}`,
              }}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} style={{
                    padding: '10px 14px', color: cellIdx === 0 ? t.titleColor : t.bodyColor,
                    fontWeight: cellIdx === 0 ? 700 : 400, lineHeight: 1.5,
                    borderLeft: cellIdx === 0 ? `3px solid ${accent}` : 'none',
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {page.tips.map((tip, idx) => (
            <p key={idx} style={{ fontSize: 9.5, color: t.mutedColor, fontStyle: 'italic', margin: 0 }}>* {tip}</p>
          ))}
        </div>
      )}
    </div>
  );

  // ── CHECKLIST ─────────────────────────────────────────────────────────────────
  const renderChecklist = () => (
    <div style={{ flex: 1, padding: '24px 36px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionHeader typeLabel="Checklist de Ação" icon={<SectionIcon type="checklist" color={accent} />} />

      {page.blocks && page.blocks.length > 0 && (
        <p style={{ fontSize: 11, color: t.bodyColor, margin: 0, lineHeight: 1.65 }}>{page.blocks[0]}</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {page.checklist?.map((item, idx) => (
          <div key={idx} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '9px 13px', borderRadius: 9,
            backgroundColor: item.checked ? `rgba(${accentRgb},0.07)` : t.cardBg,
            border: `1px solid ${item.checked ? `rgba(${accentRgb},0.35)` : t.cardBorder}`,
          }}>
            {/* Checkbox */}
            <div style={{
              width: 19, height: 19, borderRadius: 5, flexShrink: 0, marginTop: 0.5,
              border: `2px solid ${item.checked ? accent : t.mutedColor}`,
              backgroundColor: item.checked ? accent : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {item.checked && (
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M2 5.5L4.5 8L9 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 11.5, color: t.bodyColor, lineHeight: 1.6, flex: 1 }}>
              {item.label}
            </span>
            <span style={{ fontSize: 8.5, fontWeight: 800, color: t.mutedColor, minWidth: 24, textAlign: 'right' }}>
              {String(idx + 1).padStart(2, '0')}
            </span>
          </div>
        ))}
      </div>

      {page.tips && page.tips.length > 0 && (
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          padding: '10px 13px', borderRadius: 9,
          backgroundColor: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.25)',
          marginTop: 4,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M9 2L16.5 15H1.5L9 2Z" fill="#fbbf2422" stroke="#f59e0b" strokeWidth="1.5" />
            <path d="M9 8V11" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="9" cy="13" r="0.8" fill="#f59e0b" />
          </svg>
          <p style={{ fontSize: 11, color: '#92400e', lineHeight: 1.6, margin: 0 }}>{page.tips[0]}</p>
        </div>
      )}
    </div>
  );

  // ── TIPS ─────────────────────────────────────────────────────────────────────
  const renderTips = () => (
    <div style={{ flex: 1, padding: '24px 36px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader typeLabel="Dicas & Técnicas" icon={<SectionIcon type="tips" color={accent} />} />

      {page.blocks && page.blocks.length > 0 && (
        <p style={{ fontSize: 12, color: t.bodyColor, lineHeight: 1.75, margin: 0, borderLeft: `3px solid ${accent}`, paddingLeft: 14 }}>
          {page.blocks[0]}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {page.tips?.map((tip, idx) => (
          <div key={idx} style={{
            display: 'flex', gap: 14, alignItems: 'flex-start',
            padding: '13px 15px', borderRadius: 11,
            backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`,
            borderLeft: `4px solid ${accent}`,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Background number watermark */}
            <div style={{
              position: 'absolute', right: 12, bottom: -4,
              fontSize: 52, fontWeight: 900, color: accent,
              opacity: 0.06, lineHeight: 1, userSelect: 'none',
              fontFamily: t.titleFamily,
            }}>
              {idx + 1}
            </div>
            {/* Number badge */}
            <div style={{
              width: 30, height: 30, borderRadius: 7, flexShrink: 0,
              background: `linear-gradient(135deg, ${accent}, ${t.accent2})`,
              color: '#fff', fontSize: 11, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {String(idx + 1).padStart(2, '0')}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 9, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>
                Dica #{idx + 1}
              </p>
              <p style={{ fontSize: 12, color: t.bodyColor, lineHeight: 1.65, margin: 0 }}>{tip}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── ERRORS ───────────────────────────────────────────────────────────────────
  const renderErrors = () => (
    <div style={{ flex: 1, padding: '24px 36px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader typeLabel="Erros a Evitar" icon={<SectionIcon type="errors" color="#ef4444" />} />

      {page.blocks && <p style={{ fontSize: 11, color: t.bodyColor, margin: 0, lineHeight: 1.65 }}>{page.blocks[0]}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {page.warnings?.map((warn, idx) => (
          <div key={idx} style={{
            display: 'flex', gap: 12, alignItems: 'flex-start',
            padding: '12px 14px', borderRadius: 10,
            backgroundColor: 'rgba(239,68,68,0.04)',
            border: '1px solid rgba(239,68,68,0.18)',
            borderLeft: '4px solid #ef4444',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
              backgroundColor: 'rgba(239,68,68,0.15)',
              color: '#ef4444', fontSize: 11, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {idx + 1}
            </div>
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>
                Erro #{idx + 1}
              </p>
              <p style={{ fontSize: 11.5, color: t.bodyColor, lineHeight: 1.65, margin: 0 }}>{warn}</p>
            </div>
          </div>
        ))}
      </div>

      {page.tips && page.tips.length > 0 && (
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: 'linear-gradient(135deg, rgba(34,197,94,0.07), rgba(16,185,129,0.04))',
          border: '1px solid rgba(34,197,94,0.25)', borderLeft: '4px solid #22c55e',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="1.5" />
              <path d="M5 8L7 10L11 6" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p style={{ fontSize: 9.5, fontWeight: 800, color: '#16a34a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              A Solução Correta
            </p>
          </div>
          <p style={{ fontSize: 11.5, color: t.bodyColor, lineHeight: 1.65, margin: 0 }}>{page.tips[0]}</p>
        </div>
      )}
    </div>
  );

  // ── CONTENT ──────────────────────────────────────────────────────────────────
  const renderContent = () => (
    <div style={{ flex: 1, padding: '24px 36px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader typeLabel="Conteúdo" icon={<SectionIcon type="content" color={accent} />} />
      <WaveDivider color={accent} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {page.blocks?.map((block, idx) => (
          <p key={idx} style={{ fontSize: 12, lineHeight: 1.8, color: t.bodyColor, margin: 0 }}>{block}</p>
        ))}
      </div>

      {page.tips && page.tips.length > 0 && (
        <div style={{
          marginTop: 'auto', borderLeft: `3px solid ${accent}`,
          padding: '10px 16px', background: `rgba(${accentRgb},0.04)`,
          borderRadius: '0 10px 10px 0',
        }}>
          <p style={{ fontSize: 11, fontStyle: 'italic', color: t.bodyColor, margin: 0, lineHeight: 1.7 }}>{page.tips[0]}</p>
        </div>
      )}
    </div>
  );

  // ── NEXT STEP / CTA ──────────────────────────────────────────────────────────
  const renderNextStep = () => (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      {/* Background art (same as cover) */}
      <CoverArt accent={accent} accent2={t.accent2} isDark={t.isDark} />

      <div style={{
        position: 'relative', zIndex: 1,
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 56px', textAlign: 'center',
      }}>
        {/* Big icon */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%', marginBottom: 24,
          background: `radial-gradient(circle at 35% 35%, rgba(${accentRgb},0.35), rgba(${accentRgb},0.1))`,
          border: `2.5px solid ${accent}`, boxShadow: `0 8px 32px rgba(${accentRgb},0.35)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
        }}>
          🚀
        </div>

        <p style={{ fontSize: 9.5, fontWeight: 800, color: accent, letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 10px' }}>
          Próximo Passo
        </p>

        <h2 style={{
          fontFamily: t.titleFamily, fontSize: 34, fontWeight: 900,
          color: t.titleColor, margin: '0 0 14px', lineHeight: 1.15, maxWidth: 420,
        }}>
          {page.title}
        </h2>

        {page.subtitle && (
          <p style={{ fontSize: 13.5, color: t.subtitleColor, lineHeight: 1.7, margin: '0 0 24px', maxWidth: 380 }}>
            {page.subtitle}
          </p>
        )}

        {/* Accent line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <div style={{ height: 1.5, width: 40, background: `linear-gradient(to right, transparent, ${accent})` }} />
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: accent }} />
          <div style={{ height: 1.5, width: 40, background: `linear-gradient(to left, transparent, ${accent})` }} />
        </div>

        {page.blocks && page.blocks.length > 0 && (
          <div style={{
            padding: '14px 22px', borderRadius: 12, marginBottom: 24,
            backgroundColor: t.cardBg, border: `1px solid ${t.cardBorder}`,
            maxWidth: 380, textAlign: 'left',
          }}>
            {page.blocks.map((b, i) => (
              <p key={i} style={{ fontSize: 11.5, color: t.bodyColor, lineHeight: 1.7, margin: '0 0 4px' }}>{b}</p>
            ))}
          </div>
        )}

        {page.ctaText && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '14px 32px', borderRadius: 10,
            background: `linear-gradient(135deg, ${accent}, ${t.accent2})`,
            color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '0.03em',
            boxShadow: `0 8px 24px rgba(${accentRgb},0.4)`,
          }}>
            {page.ctaText}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 9H14M14 9L10 5M14 9L10 13" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {/* Bottom label */}
        <p style={{ fontSize: 8.5, color: t.mutedColor, marginTop: 24, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {productName} · Material Exclusivo
        </p>
      </div>
    </div>
  );

  // ── DISPATCH ─────────────────────────────────────────────────────────────────
  const renderBody = () => {
    switch (page.type) {
      case 'cover':       return renderCover();
      case 'instruction': return renderInstruction();
      case 'materials':   return renderMaterials();
      case 'table':       return renderTable();
      case 'checklist':   return renderChecklist();
      case 'tips':        return renderTips();
      case 'errors':      return renderErrors();
      case 'content':     return renderContent();
      case 'next_step':   return renderNextStep();
      default:
        return <p style={{ padding: 24, color: '#ef4444' }}>Tipo desconhecido: {page.type}</p>;
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
