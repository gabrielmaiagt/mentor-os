import type { AdLibraryResult } from '../types/adlibrary';

const GRAPH_API_VERSION = 'v20.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Generates all possible combinations of base keywords and intent keywords.
 */
export const generateCombinations = (baseKeywords: string[], intentKeywords: string[]): string[] => {
  if (baseKeywords.length === 0) return [];
  if (intentKeywords.length === 0) return baseKeywords;

  const combinations: string[] = [];
  baseKeywords.forEach(base => {
    intentKeywords.forEach(intent => {
      combinations.push(`${base} ${intent}`);
    });
  });
  return combinations;
};

/**
 * Searches ads by search terms.
 */
export const searchAds = async (
  searchTerm: string,
  accessToken: string,
  country: string = 'BR'
): Promise<AdLibraryResult[]> => {
  try {
    const url = new URL(`${BASE_URL}/ads_archive`);
    url.searchParams.append('search_terms', searchTerm);
    url.searchParams.append('ad_reached_countries', `['${country}']`);
    url.searchParams.append('ad_active_status', 'ACTIVE');
    url.searchParams.append('fields', 'id,page_id,page_name,ad_creation_time,ad_delivery_start_time,ad_creative_bodies,ad_snapshot_url,publisher_platforms');
    url.searchParams.append('limit', '100');
    url.searchParams.append('access_token', accessToken);

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMsg = errData.error?.message || `HTTP ${response.status}`;
      throw new Error(errorMsg);
    }
    const data = await response.json();
    return data?.data || [];
  } catch (error: any) {
    throw new Error(`Erro na busca de anúncios: ${error.message}`);
  }
};

/**
 * Counts the active ads of a specific page ID.
 */
export const countPageActiveAds = async (
  pageId: string,
  accessToken: string,
  country: string = 'BR'
): Promise<number> => {
  try {
    const url = new URL(`${BASE_URL}/ads_archive`);
    url.searchParams.append('search_page_ids', pageId);
    url.searchParams.append('ad_active_status', 'ACTIVE');
    url.searchParams.append('ad_reached_countries', `['${country}']`);
    url.searchParams.append('fields', 'id');
    url.searchParams.append('limit', '50');
    url.searchParams.append('access_token', accessToken);

    const response = await fetch(url.toString());
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errorMsg = errData.error?.message || `HTTP ${response.status}`;
      console.error(`Erro ao contar anúncios da página ${pageId}:`, errorMsg);
      return 0;
    }
    const data = await response.json();
    return data?.data?.length || 0;
  } catch (error: any) {
    console.error(`Erro ao contar anúncios da página ${pageId}:`, error.message);
    return 0; // return 0 on error to avoid breaking the scan
  }
};

/**
 * Helper to build library links and snapshot links.
 */
export const getLibraryLink = (pageId: string): string => {
  return `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=${pageId}&sort_data[direction]=desc&sort_data[mode]=relevancy_monthly_grouped&media_type=all`;
};

/**
 * Detect CTA keywords/signals in ad creative text.
 */
export const detectCtaSignals = (text: string): string[] => {
  if (!text) return [];
  const signals: string[] = [];
  const lowerText = text.toLowerCase();

  const rules = [
    { key: 'whatsapp', regex: /whatsapp|whats|zap|chame no|envie mensagem/i, label: 'WhatsApp' },
    { key: 'renda_extra', regex: /renda extra|faça e venda|fature|ganhe dinheiro|lucro/i, label: 'Renda Extra' },
    { key: 'curso', regex: /curso|treinamento|método|aula|capacitação|apostila|moldes/i, label: 'Curso/Material' },
    { key: 'low_ticket', regex: /oferta|desconto|barato|por apenas|acesso imediato|compre agora/i, label: 'Promocional' },
  ];

  rules.forEach(rule => {
    if (rule.regex.test(lowerText)) {
      signals.push(rule.label);
    }
  });

  return signals;
};

/**
 * Sleep helper to prevent Meta API rate limits.
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
