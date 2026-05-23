export type PdfPageType = 
  | 'cover' 
  | 'instruction' 
  | 'materials' 
  | 'table' 
  | 'checklist' 
  | 'tips' 
  | 'errors' 
  | 'content'
  | 'next_step';

export interface PdfPage {
  type: PdfPageType;
  title: string;
  subtitle?: string;
  blocks?: string[]; // General text blocks or paragraphs
  columns?: string[]; // For 'table' page type
  rows?: string[][]; // For 'table' page type (array of strings per column)
  checklist?: { label: string; checked?: boolean }[]; // For 'checklist' page type
  tips?: string[]; // For 'tips' page type
  warnings?: string[]; // For 'errors' page type
  ctaText?: string; // For 'next_step' page type
  ctaLink?: string; // For 'next_step' page type
}

export interface PdfBriefing {
  rawIdea: string;
  refinedTitle: string;
  subtitle: string;
  audience: string;
  mainPromise: string;
  visualStyle: 'premium' | 'artesanal' | 'feminino' | 'dark' | 'minimalista' | 'educacional';
  themeColor: string; // Theme primary hex color code
  pages: PdfPage[];
}
