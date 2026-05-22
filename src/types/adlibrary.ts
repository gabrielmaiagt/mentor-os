export type AdLibraryOfferStatus = 'NEW' | 'SAVED' | 'DISCARDED';

export interface AdLibraryConfig {
  id?: string;
  baseKeywords: string[];
  intentKeywords: string[];
  accessToken: string;
  country: string;
  minDaysRunning: number;
  minPageAds: number;
  updatedAt?: any;
}

export interface AdLibraryResult {
  id: string;
  page_id: string;
  page_name: string;
  ad_creation_time?: string;
  ad_delivery_start_time?: string;
  ad_creative_bodies?: string[];
  ad_snapshot_url?: string;
  publisher_platforms?: string[];
}

export interface AdLibraryOffer {
  id?: string;
  keyword: string;
  pageName: string;
  pageId: string;
  libraryLink: string;
  adLink: string;
  adText: string;
  startDate: string;
  daysRunning: number;
  pageAdCount: number;
  niche: string;
  subNiche: string;
  offerType: string;
  ctaSignals: string[];
  status: AdLibraryOfferStatus;
  notes: string;
  scannedAt: any;
  createdAt: any;
}

export interface ScanLog {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export interface ScanProgress {
  status: 'idle' | 'running' | 'done' | 'error';
  totalCombinations: number;
  currentCombinationIndex: number;
  currentCombination: string;
  adsFound: number;
  pagesChecked: number;
  qualifiedOffers: number;
  logs: ScanLog[];
}
