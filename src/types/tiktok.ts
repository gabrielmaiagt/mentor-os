export interface FirestoreTimestamps {
  createdAt?: any;
  updatedAt?: any;
}

export type TikTokDomainOrigin = 'Plataforma' | 'Próprio' | 'Outro';

export type TikTokOperationalStatus =
  | 'ON'
  | 'OFF - Não deu ROI'
  | 'BC Caiu'
  | 'Mínimo Alto'
  | 'Pausada'
  | 'Sem Saldo'
  | 'Em Análise'
  | 'Conta Caiu'
  | 'Domínio Ruim'
  | 'Pixel Ruim'
  | 'Teste'
  | 'Escala'
  | 'Encerrada';

export type TikTokDayResult = 'Deu ROI' | 'Não deu ROI' | 'Neutro' | 'Não rodou';

export type TikTokReusable = 'Sim' | 'Não' | 'Talvez';

export type TikTokStructureType = 'offer' | 'bc' | 'account' | 'pixel' | 'domain';

export type TikTokCostType =
  | 'BCs'
  | 'Contas'
  | 'Domínio'
  | 'Criativos'
  | 'Chip'
  | 'Proxy'
  | 'Ferramenta'
  | 'Aquecimento'
  | 'Farm'
  | 'Outro';

export type TikTokPaidBy =
  | 'Do bolso'
  | 'Lucro da operação'
  | 'Cartão'
  | 'Parceiro'
  | 'Outro';

export type TikTokPaymentMethod = 'PIX' | 'Cartão' | 'Dinheiro' | 'Outro';

export interface TikTokLaunch extends FirestoreTimestamps {
  id: string;
  date: string; // YYYY-MM-DD
  offerId: string;
  offerName: string;
  bcId: string;
  bcName: string;
  accountId: string;
  accountName: string;
  pixelId: string;
  pixelName: string;
  pixelOrigin?: string; // BC ou Conta de origem
  domainId: string;
  domainName: string;
  domainOrigin: TikTokDomainOrigin;
  adSpend: number;
  trackedSales: number;
  gatewaySales: number;
  revenue: number;
  operationalStatus: TikTokOperationalStatus;
  dayResult: TikTokDayResult;
  currentMinimumBalance?: number;
  reusable: TikTokReusable;
  notes?: string;
}

export interface TikTokCost extends FirestoreTimestamps {
  id: string;
  date: string; // YYYY-MM-DD
  costType: TikTokCostType;
  description: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  paidBy: TikTokPaidBy;
  paymentMethod: TikTokPaymentMethod;
  notes?: string;
}

export interface TikTokStructure extends FirestoreTimestamps {
  id: string;
  type: TikTokStructureType;
  name: string;
  status: string; // Varia dependendo do tipo
  linkedTo?: string; // Id ou Nome de outra estrutura vinculada
  origin?: string; // Ex: Plataforma / Próprio para domínios
  currentMinimumBalance?: number; // Para BC
  notes?: string;
}

export type CreateTikTokLaunch = Omit<TikTokLaunch, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateTikTokCost = Omit<TikTokCost, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateTikTokStructure = Omit<TikTokStructure, 'id' | 'createdAt' | 'updatedAt'>;
