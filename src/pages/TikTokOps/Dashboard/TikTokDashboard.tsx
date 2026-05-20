import React, { useState, useMemo } from 'react';
import type { TikTokLaunch, TikTokCost, TikTokStructure, TikTokOperationalStatus, TikTokDayResult, TikTokDomainOrigin } from '../../../types/tiktok';
import {
  format,
  subDays,
  startOfWeek,
  startOfMonth,
  startOfYear,
  isAfter,
  parseISO
} from 'date-fns';
import {
  TrendingUp,
  DollarSign,
  Wallet,
  Percent,
  ShoppingCart,
  Activity,
  Layers,
  Shield,
  FileText,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  X,
  Target
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface TikTokDashboardProps {
  launches: TikTokLaunch[];
  costs: TikTokCost[];
  structures: TikTokStructure[];
  onNewLaunch: () => void;
  onNewCost: () => void;
  onNewStructure: () => void;
}

type PeriodFilter = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'YEAR' | 'TOTAL';

const PERIOD_LABELS: Record<PeriodFilter, string> = {
  TODAY: 'Hoje',
  YESTERDAY: 'Ontem',
  WEEK: 'Semana',
  MONTH: 'Mês',
  YEAR: 'Ano',
  TOTAL: 'Total'
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const TikTokDashboard: React.FC<TikTokDashboardProps> = ({
  launches,
  costs,
  structures,
  onNewLaunch,
  onNewCost,
  onNewStructure
}) => {
  // Period filter
  const [period, setPeriod] = useState<PeriodFilter>('MONTH');

  // Additional filters state
  const [filterOffer, setFilterOffer] = useState('');
  const [filterBc, setFilterBc] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterPixel, setFilterPixel] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterResult, setFilterResult] = useState('');
  const [filterDomainOrigin, setFilterDomainOrigin] = useState('');

  // 1. FILTER LAUNCHES & COSTS BY PERIOD & ADDITIONAL FILTERS
  const filteredLaunches = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfMonth(today);
    const yearStart = startOfYear(today);

    return launches.filter((launch) => {
      // 1. Period Filter
      const statDate = parseISO(launch.date);
      let matchPeriod = true;
      switch (period) {
        case 'TODAY':
          matchPeriod = launch.date === todayStr;
          break;
        case 'YESTERDAY':
          matchPeriod = launch.date === yesterdayStr;
          break;
        case 'WEEK':
          matchPeriod = isAfter(statDate, subDays(weekStart, 1));
          break;
        case 'MONTH':
          matchPeriod = isAfter(statDate, subDays(monthStart, 1));
          break;
        case 'YEAR':
          matchPeriod = isAfter(statDate, subDays(yearStart, 1));
          break;
        case 'TOTAL':
        default:
          matchPeriod = true;
      }

      if (!matchPeriod) return false;

      // 2. Additional Filters
      if (filterOffer && launch.offerName.toLowerCase() !== filterOffer.toLowerCase()) return false;
      if (filterBc && launch.bcName.toLowerCase() !== filterBc.toLowerCase()) return false;
      if (filterAccount && launch.accountName.toLowerCase() !== filterAccount.toLowerCase()) return false;
      if (filterPixel && launch.pixelName.toLowerCase() !== filterPixel.toLowerCase()) return false;
      if (filterDomain && launch.domainName.toLowerCase() !== filterDomain.toLowerCase()) return false;
      if (filterStatus && launch.operationalStatus !== filterStatus) return false;
      if (filterResult && launch.dayResult !== filterResult) return false;
      if (filterDomainOrigin && launch.domainOrigin !== filterDomainOrigin) return false;

      return true;
    });
  }, [
    launches,
    period,
    filterOffer,
    filterBc,
    filterAccount,
    filterPixel,
    filterDomain,
    filterStatus,
    filterResult,
    filterDomainOrigin
  ]);

  const filteredCosts = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfMonth(today);
    const yearStart = startOfYear(today);

    return costs.filter((cost) => {
      const costDate = parseISO(cost.date);
      switch (period) {
        case 'TODAY':
          return cost.date === todayStr;
        case 'YESTERDAY':
          return cost.date === yesterdayStr;
        case 'WEEK':
          return isAfter(costDate, subDays(weekStart, 1));
        case 'MONTH':
          return isAfter(costDate, subDays(monthStart, 1));
        case 'YEAR':
          return isAfter(costDate, subDays(yearStart, 1));
        case 'TOTAL':
        default:
          return true;
      }
    });
  }, [costs, period]);

  // 2. CALCULATE KPIs (respect filters)
  const totalSpend = useMemo(() => filteredLaunches.reduce((acc, l) => acc + l.adSpend, 0), [filteredLaunches]);
  const totalRevenue = useMemo(() => filteredLaunches.reduce((acc, l) => acc + l.revenue, 0), [filteredLaunches]);
  const totalCosts = useMemo(() => filteredCosts.reduce((acc, c) => acc + c.totalValue, 0), [filteredCosts]);

  // Gross profit
  const grossProfit = totalRevenue - totalSpend;

  // Net Profit
  const netProfit = totalRevenue - totalSpend - totalCosts;

  // ROAS (protect div by zero)
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  // Tracked Sales vs Gateway Sales
  const trackedSales = useMemo(() => filteredLaunches.reduce((acc, l) => acc + l.trackedSales, 0), [filteredLaunches]);
  const gatewaySales = useMemo(() => filteredLaunches.reduce((acc, l) => acc + l.gatewaySales, 0), [filteredLaunches]);

  // CPA Médio (Ads / Tracked Sales)
  const avgCpa = trackedSales > 0 ? totalSpend / trackedSales : 0;

  // Ticket Médio (Faturamento / Gateway Sales)
  const avgTicket = gatewaySales > 0 ? totalRevenue / gatewaySales : 0;

  // Tracking difference (Gateway - Tracked)
  const trackingDiff = gatewaySales - trackedSales;

  // Margem Líquida = Lucro Líquido / Faturamento * 100
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Count structures
  const activeBCsCount = structures.filter((s) => s.type === 'bc' && s.status === 'Ativa').length;
  const bannedBCsCount = structures.filter((s) => s.type === 'bc' && s.status === 'Caiu').length;
  const highMinBCsCount = structures.filter((s) => s.type === 'bc' && s.status === 'Mínimo Alto').length;

  const activeAccountsCount = structures.filter((s) => s.type === 'account' && s.status === 'ON').length;
  const offAccountsCount = structures.filter((s) => s.type === 'account' && s.status === 'OFF - Não deu ROI').length;
  const bannedAccountsCount = structures.filter((s) => s.type === 'account' && s.status === 'Caiu').length;

  const activeDomainsCount = structures.filter((s) => s.type === 'domain' && s.status === 'Ativo').length;
  const runningOffersCount = structures.filter((s) => s.type === 'offer' && s.status === 'Ativa').length;

  // 3. GRAPH DATA (group launches by date)
  const chartData = useMemo(() => {
    const dataMap: Record<string, { faturamento: number; gasto: number; lucro: number }> = {};

    filteredLaunches.forEach((l) => {
      const dateKey = format(parseISO(l.date + 'T12:00:00'), 'dd/MM');
      if (!dataMap[dateKey]) {
        dataMap[dateKey] = { faturamento: 0, gasto: 0, lucro: 0 };
      }
      dataMap[dateKey].faturamento += l.revenue;
      dataMap[dateKey].gasto += l.adSpend;
      dataMap[dateKey].lucro += l.revenue - l.adSpend;
    });

    return Object.keys(dataMap)
      .map((date) => ({
        date,
        faturamento: dataMap[date].faturamento,
        gasto: dataMap[date].gasto,
        lucroLiquido: dataMap[date].lucro
      }))
      .sort((a, b) => {
        // Simple sort by day/month format
        const [dayA, monthA] = a.date.split('/').map(Number);
        const [dayB, monthB] = b.date.split('/').map(Number);
        return monthA === monthB ? dayA - dayB : monthA - monthB;
      })
      .slice(-15); // Show last 15 days
  }, [filteredLaunches]);

  // 4. SMART OPERATIONAL ALERTS
  const operationalAlerts = useMemo(() => {
    const alerts: string[] = [];

    // Alert 1: BCs fallen
    if (bannedBCsCount > 0) {
      alerts.push(`🚨 ${bannedBCsCount} BC${bannedBCsCount > 1 ? 's' : ''} caiu/caíram na operação.`);
    }

    // Alert 2: BC High Min
    if (highMinBCsCount > 0) {
      const highMinStruct = structures.find((s) => s.type === 'bc' && s.status === 'Mínimo Alto');
      const minVal = highMinStruct?.currentMinimumBalance || 1200;
      alerts.push(`⚠️ ${highMinBCsCount} BC subiu mínimo para R$ ${minVal}.`);
    }

    // Alert 3: Reusable accounts
    const reusableAccounts = structures.filter(
      (s) => s.type === 'account' && ['ON', 'OFF - Não deu ROI', 'Sem Saldo'].includes(s.status)
    ).length;
    if (reusableAccounts > 0) {
      alerts.push(`🌱 ${reusableAccounts} conta${reusableAccounts > 1 ? 's' : ''} ainda pode${reusableAccounts > 1 ? 'm' : ''} ser reutilizada${reusableAccounts > 1 ? 's' : ''} amanhã.`);
    }

    // Alert 4: Best ROAS Offer
    if (filteredLaunches.length > 0) {
      const offerPerformanceMap: Record<string, { faturamento: number; gasto: number }> = {};
      filteredLaunches.forEach((l) => {
        if (!offerPerformanceMap[l.offerName]) {
          offerPerformanceMap[l.offerName] = { faturamento: 0, gasto: 0 };
        }
        offerPerformanceMap[l.offerName].faturamento += l.revenue;
        offerPerformanceMap[l.offerName].gasto += l.adSpend;
      });

      let bestOffer = '';
      let bestRoasVal = 0;

      Object.keys(offerPerformanceMap).forEach((name) => {
        const op = offerPerformanceMap[name];
        const offerRoas = op.gasto > 0 ? op.faturamento / op.gasto : 0;
        if (offerRoas > bestRoasVal) {
          bestRoasVal = offerRoas;
          bestOffer = name;
        }
      });

      if (bestOffer && bestRoasVal > 1.0) {
        alerts.push(`🔥 Oferta "${bestOffer}" teve o melhor ROAS da operação (${bestRoasVal.toFixed(2)}x).`);
      }

      // Alert 5: Account burning money without ROI
      let worstAccount = '';
      let maxBurn = 0;
      const accountPerformanceMap: Record<string, { faturamento: number; gasto: number }> = {};

      filteredLaunches.forEach((l) => {
        if (!accountPerformanceMap[l.accountName]) {
          accountPerformanceMap[l.accountName] = { faturamento: 0, gasto: 0 };
        }
        accountPerformanceMap[l.accountName].faturamento += l.revenue;
        accountPerformanceMap[l.accountName].gasto += l.adSpend;
      });

      Object.keys(accountPerformanceMap).forEach((name) => {
        const ap = accountPerformanceMap[name];
        if (ap.faturamento === 0 && ap.gasto > maxBurn) {
          maxBurn = ap.gasto;
          worstAccount = name;
        }
      });

      if (worstAccount && maxBurn > 0) {
        alerts.push(`💸 Conta "${worstAccount}" queimou mais verba (R$ ${maxBurn}) sem gerar nenhum ROI.`);
      }
    }

    return alerts;
  }, [bannedBCsCount, highMinBCsCount, structures, filteredLaunches]);

  // 5. RANKINGS COMPILATION
  // Ranking por Oferta
  const rankingOffers = useMemo(() => {
    const map: Record<string, { spend: number; revenue: number; tracked: number; gateway: number; count: number }> = {};
    filteredLaunches.forEach((l) => {
      if (!map[l.offerName]) map[l.offerName] = { spend: 0, revenue: 0, tracked: 0, gateway: 0, count: 0 };
      map[l.offerName].spend += l.adSpend;
      map[l.offerName].revenue += l.revenue;
      map[l.offerName].tracked += l.trackedSales;
      map[l.offerName].gateway += l.gatewaySales;
      map[l.offerName].count += 1;
    });

    return Object.keys(map)
      .map((name) => {
        const item = map[name];
        const profit = item.revenue - item.spend;
        const roasVal = item.spend > 0 ? item.revenue / item.spend : 0;
        const cpaTracked = item.tracked > 0 ? item.spend / item.tracked : 0;
        const cpaGateway = item.gateway > 0 ? item.spend / item.gateway : 0;
        const trackingRate = item.gateway > 0 ? (item.tracked / item.gateway) * 100 : 0;

        return {
          name,
          ...item,
          profit,
          roas: roasVal,
          cpaTracked,
          cpaGateway,
          trackingRate
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [filteredLaunches]);

  // Ranking por BC
  const rankingBCs = useMemo(() => {
    const map: Record<string, { spend: number; revenue: number; accounts: Set<string>; count: number }> = {};
    filteredLaunches.forEach((l) => {
      if (!map[l.bcName]) map[l.bcName] = { spend: 0, revenue: 0, accounts: new Set(), count: 0 };
      map[l.bcName].spend += l.adSpend;
      map[l.bcName].revenue += l.revenue;
      map[l.bcName].accounts.add(l.accountName);
      map[l.bcName].count += 1;
    });

    return Object.keys(map)
      .map((name) => {
        const item = map[name];
        const profit = item.revenue - item.spend;
        const roasVal = item.spend > 0 ? item.revenue / item.spend : 0;

        // Fetch corresponding status from structures
        const bcStruct = structures.find((s) => s.type === 'bc' && s.name === name);
        const status = bcStruct?.status || 'Não Cadastrada';
        const minBal = bcStruct?.currentMinimumBalance || null;

        // Fetch accounts statuses
        const accountsListForBc = structures.filter((s) => s.type === 'account' && s.linkedTo === name);
        const accountsUsed = accountsListForBc.length;
        const accountsOn = accountsListForBc.filter((s) => s.status === 'ON').length;
        const accountsOff = accountsListForBc.filter((s) => s.status === 'OFF - Não deu ROI').length;
        const accountsBanned = accountsListForBc.filter((s) => s.status === 'Caiu').length;

        return {
          name,
          ...item,
          accountsUsed,
          accountsOn,
          accountsOff,
          accountsBanned,
          profit,
          roas: roasVal,
          status,
          minBal
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [filteredLaunches, structures]);

  // Ranking por Conta
  const rankingAccounts = useMemo(() => {
    const map: Record<string, { spend: number; revenue: number; offers: Set<string>; bc: string; count: number }> = {};
    filteredLaunches.forEach((l) => {
      if (!map[l.accountName]) map[l.accountName] = { spend: 0, revenue: 0, offers: new Set(), bc: l.bcName, count: 0 };
      map[l.accountName].spend += l.adSpend;
      map[l.accountName].revenue += l.revenue;
      map[l.accountName].offers.add(l.offerName);
      map[l.accountName].count += 1;
    });

    return Object.keys(map)
      .map((name) => {
        const item = map[name];
        const profit = item.revenue - item.spend;
        const roasVal = item.spend > 0 ? item.revenue / item.spend : 0;

        // Fetch corresponding details from structures
        const accountStruct = structures.find((s) => s.type === 'account' && s.name === name);
        const status = accountStruct?.status || 'Não Cadastrada';
        const reusableVal = accountStruct
          ? ['ON', 'OFF - Não deu ROI', 'Sem Saldo'].includes(accountStruct.status)
            ? 'Sim'
            : accountStruct.status === 'Caiu'
            ? 'Não'
            : 'Talvez'
          : '—';

        // Most rodada offer
        const offersArray = Array.from(item.offers);
        const mostRodadaOffer = offersArray.join(', ') || '—';

        return {
          name,
          ...item,
          profit,
          roas: roasVal,
          status,
          reusable: reusableVal,
          mostRodadaOffer
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [filteredLaunches, structures]);

  // Ranking por Domínio
  const rankingDomains = useMemo(() => {
    const map: Record<string, { spend: number; revenue: number; offers: Set<string>; origin: string }> = {};
    filteredLaunches.forEach((l) => {
      if (!map[l.domainName]) map[l.domainName] = { spend: 0, revenue: 0, offers: new Set(), origin: l.domainOrigin };
      map[l.domainName].spend += l.adSpend;
      map[l.domainName].revenue += l.revenue;
      map[l.domainName].offers.add(l.offerName);
    });

    return Object.keys(map)
      .map((name) => {
        const item = map[name];
        const profit = item.revenue - item.spend;
        const roasVal = item.spend > 0 ? item.revenue / item.spend : 0;

        const domainStruct = structures.find((s) => s.type === 'domain' && s.name === name);
        const status = domainStruct?.status || 'Não Cadastrado';

        return {
          name,
          ...item,
          profit,
          roas: roasVal,
          status,
          offersRodadas: Array.from(item.offers).join(', ') || '—'
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [filteredLaunches, structures]);

  // Ranking por Pixel
  const rankingPixels = useMemo(() => {
    const map: Record<string, { spend: number; revenue: number; tracked: number; gateway: number; originBc: string }> = {};
    filteredLaunches.forEach((l) => {
      if (!map[l.pixelName]) {
        map[l.pixelName] = { spend: 0, revenue: 0, tracked: 0, gateway: 0, originBc: l.pixelOrigin || l.bcName };
      }
      map[l.pixelName].spend += l.adSpend;
      map[l.pixelName].revenue += l.revenue;
      map[l.pixelName].tracked += l.trackedSales;
      map[l.pixelName].gateway += l.gatewaySales;
    });

    return Object.keys(map)
      .map((name) => {
        const item = map[name];
        const profit = item.revenue - item.spend;
        const roasVal = item.spend > 0 ? item.revenue / item.spend : 0;
        const trackingRate = item.gateway > 0 ? (item.tracked / item.gateway) * 100 : 0;

        const pixelStruct = structures.find((s) => s.type === 'pixel' && s.name === name);
        const status = pixelStruct?.status || 'Não Cadastrado';

        return {
          name,
          ...item,
          profit,
          roas: roasVal,
          trackingRate,
          status
        };
      })
      .sort((a, b) => b.profit - a.profit);
  }, [filteredLaunches, structures]);

  return (
    <div className="tk-dashboard-tab">
      {/* 1. FILTERS PANELS */}
      <div
        className="glass-card"
        style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        {/* Quick Period Filters */}
        <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div className="premium-tabs compact">
            {(Object.keys(PERIOD_LABELS) as PeriodFilter[]).map((p) => (
              <button
                key={p}
                className={`premium-tab ${period === p ? 'active' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>{filteredLaunches.length} lançamentos filtrados</span>
        </div>

        {/* Multi Select filters */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: '16px'
          }}
        >
          {/* Oferta filter */}
          <div className="tk-form-group">
            <label style={{ fontSize: '11px', color: '#9ca3af' }}>Oferta</label>
            <input
              type="text"
              className="tk-input"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              value={filterOffer}
              onChange={(e) => setFilterOffer(e.target.value)}
              placeholder="Pesquisar oferta..."
            />
          </div>

          {/* BC filter */}
          <div className="tk-form-group">
            <label style={{ fontSize: '11px', color: '#9ca3af' }}>BC</label>
            <input
              type="text"
              className="tk-input"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              value={filterBc}
              onChange={(e) => setFilterBc(e.target.value)}
              placeholder="Pesquisar BC..."
            />
          </div>

          {/* Conta filter */}
          <div className="tk-form-group">
            <label style={{ fontSize: '11px', color: '#9ca3af' }}>Conta</label>
            <input
              type="text"
              className="tk-input"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              placeholder="Pesquisar conta..."
            />
          </div>

          {/* Status Operational filter */}
          <div className="tk-form-group">
            <label style={{ fontSize: '11px', color: '#9ca3af' }}>Status Operacional</label>
            <select
              className="tk-select"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="ON">ON</option>
              <option value="OFF - Não deu ROI">OFF - Não deu ROI</option>
              <option value="BC Caiu">BC Caiu</option>
              <option value="Mínimo Alto">Mínimo Alto</option>
              <option value="Pausada">Pausada</option>
              <option value="Sem Saldo">Sem Saldo</option>
              <option value="Em Análise">Em Análise</option>
              <option value="Conta Caiu">Conta Caiu</option>
              <option value="Domínio Ruim">Domínio Ruim</option>
              <option value="Pixel Ruim">Pixel Ruim</option>
            </select>
          </div>

          {/* Resultado filter */}
          <div className="tk-form-group">
            <label style={{ fontSize: '11px', color: '#9ca3af' }}>Resultado</label>
            <select
              className="tk-select"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Deu ROI">Deu ROI</option>
              <option value="Não deu ROI">Não deu ROI</option>
              <option value="Neutro">Neutro</option>
              <option value="Não rodou">Não rodou</option>
            </select>
          </div>

          {/* Domínio Origin filter */}
          <div className="tk-form-group">
            <label style={{ fontSize: '11px', color: '#9ca3af' }}>Origem Domínio</label>
            <select
              className="tk-select"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              value={filterDomainOrigin}
              onChange={(e) => setFilterDomainOrigin(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="Próprio">Próprio</option>
              <option value="Plataforma">Plataforma</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(filterOffer || filterBc || filterAccount || filterPixel || filterDomain || filterStatus || filterResult || filterDomainOrigin) && (
          <button
            onClick={() => {
              setFilterOffer('');
              setFilterBc('');
              setFilterAccount('');
              setFilterPixel('');
              setFilterDomain('');
              setFilterStatus('');
              setFilterResult('');
              setFilterDomainOrigin('');
            }}
            className="tk-btn tk-btn-secondary"
            style={{ alignSelf: 'flex-end', padding: '6px 12px', fontSize: '11px' }}
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* 2. OPERATIONAL SUMMARY/ALERTS BANNER */}
      {operationalAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {operationalAlerts.map((alert, idx) => {
            let cls = 'tk-alert-info';
            if (alert.startsWith('🚨')) cls = 'tk-alert-error';
            else if (alert.startsWith('⚠️')) cls = 'tk-alert-warning';
            else if (alert.startsWith('🔥') || alert.startsWith('🌱')) cls = 'tk-alert-success';

            return (
              <div key={idx} className={`tk-alert-item ${cls}`}>
                <span>{alert}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. MAIN KPI GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {/* Card 1: Gasto Ads */}
        <div className="glass-card" style={{ padding: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '10px', color: '#ef4444' }}>
            <Wallet size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block' }}>Gasto Ads</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{formatCurrency(totalSpend)}</span>
          </div>
        </div>

        {/* Card 2: Faturamento */}
        <div className="glass-card" style={{ padding: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', color: '#10b981' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block' }}>Faturamento</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{formatCurrency(totalRevenue)}</span>
          </div>
        </div>

        {/* Card 3: Lucro Bruto */}
        <div className="glass-card" style={{ padding: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', color: '#10b981' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block' }}>Lucro Bruto</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: grossProfit >= 0 ? '#10b981' : '#ef4444' }}>
              {formatCurrency(grossProfit)}
            </span>
          </div>
        </div>

        {/* Card 4: Custos Operação */}
        <div className="glass-card" style={{ padding: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '10px', color: '#ef4444' }}>
            <DollarSign size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block' }}>Custos Operação</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{formatCurrency(totalCosts)}</span>
          </div>
        </div>

        {/* Card 5: Lucro Líquido */}
        <div className="glass-card" style={{ padding: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '10px',
              background: netProfit >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              borderRadius: '10px',
              color: netProfit >= 0 ? '#10b981' : '#ef4444'
            }}
          >
            <DollarSign size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block' }}>Lucro Líquido</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: netProfit >= 0 ? '#10b981' : '#ef4444' }}>
              {formatCurrency(netProfit)}
            </span>
          </div>
        </div>

        {/* Card 6: ROAS */}
        <div className="glass-card" style={{ padding: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '10px', color: '#a78bfa' }}>
            <Percent size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block' }}>ROAS Geral</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: roas >= 1 ? '#10b981' : '#fff' }}>
              {roas > 0 ? `${roas.toFixed(2)}x` : '—'}
            </span>
          </div>
        </div>

        {/* Card 7: Margem Líquida */}
        <div className="glass-card" style={{ padding: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '10px', color: '#a78bfa' }}>
            <Percent size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block' }}>Margem Líquida</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: netMargin >= 0 ? '#10b981' : '#ef4444' }}>
              {netMargin !== 0 ? `${netMargin.toFixed(1)}%` : '—'}
            </span>
          </div>
        </div>

        {/* Card 8: CPA Médio */}
        <div className="glass-card" style={{ padding: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '10px', color: '#3b82f6' }}>
            <Target size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block' }}>CPA Médio</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
              {avgCpa > 0 ? formatCurrency(avgCpa) : '—'}
            </span>
          </div>
        </div>

        {/* Card 9: Ticket Médio */}
        <div className="glass-card" style={{ padding: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '10px', color: '#3b82f6' }}>
            <ShoppingCart size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block' }}>Ticket Médio</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
              {avgTicket > 0 ? formatCurrency(avgTicket) : '—'}
            </span>
          </div>
        </div>

        {/* Card 10: Vendas Gateway (Vendas Trackeadas) */}
        <div className="glass-card" style={{ padding: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '10px', color: '#a78bfa' }}>
            <ShoppingCart size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block' }}>Vendas (Gate./Track.)</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
              {gatewaySales} <span style={{ fontSize: '13px', color: '#9ca3af' }}>({trackedSales})</span>
            </span>
          </div>
        </div>

        {/* Card 11: Diferença de Tracking */}
        <div className="glass-card" style={{ padding: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '10px',
              background: trackingDiff > 10 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(16, 185, 129, 0.08)',
              borderRadius: '10px',
              color: trackingDiff > 10 ? '#f59e0b' : '#10b981'
            }}
          >
            <Activity size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block' }}>Diferença de Tracking</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: trackingDiff > 10 ? '#f59e0b' : '#fff' }}>
              {trackingDiff} <span style={{ fontSize: '11px', color: '#9ca3af' }}>vendas</span>
            </span>
          </div>
        </div>

        {/* Card 12: Taxa de Tracking */}
        <div className="glass-card" style={{ padding: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ padding: '10px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '10px', color: '#a78bfa' }}>
            <Percent size={22} />
          </div>
          <div>
            <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block' }}>Taxa de Tracking</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
              {gatewaySales > 0 ? `${((trackedSales / gatewaySales) * 100).toFixed(0)}%` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* OPERATIONAL STRUCTURE STATS CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}
      >
        <div className="glass-card" style={{ padding: '12px 16px', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', display: 'block' }}>Contas ON / OFF</span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
            {activeAccountsCount} <span style={{ color: '#9ca3af', fontSize: '13px' }}>/ {offAccountsCount}</span>
          </span>
        </div>

        <div className="glass-card" style={{ padding: '12px 16px', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', display: 'block' }}>Contas Banidas</span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>{bannedAccountsCount}</span>
        </div>

        <div className="glass-card" style={{ padding: '12px 16px', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', display: 'block' }}>BCs Ativas / Mín. Alto</span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
            {activeBCsCount} <span style={{ color: '#3b82f6', fontSize: '13px' }}>/ {highMinBCsCount}</span>
          </span>
        </div>

        <div className="glass-card" style={{ padding: '12px 16px', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', display: 'block' }}>BCs Banidas</span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>{bannedBCsCount}</span>
        </div>

        <div className="glass-card" style={{ padding: '12px 16px', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', display: 'block' }}>Domínios Ativos</span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>{activeDomainsCount}</span>
        </div>

        <div className="glass-card" style={{ padding: '12px 16px', borderRadius: '12px' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', display: 'block' }}>Ofertas Rodando</span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#a78bfa' }}>{runningOffersCount}</span>
        </div>
      </div>

      {/* 4. MAIN CHART (Faturamento vs Gasto vs Lucro) */}
      <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} style={{ color: '#a78bfa' }} />
          <span>Gráfico Principal de Fluxo de Caixa (Últimos 15 dias rodados)</span>
        </h3>
        {chartData.length > 0 ? (
          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#121216',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="faturamento"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorFaturamento)"
                  name="Faturamento"
                />
                <Area
                  type="monotone"
                  dataKey="gasto"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorGasto)"
                  name="Gasto Ads"
                />
                <Area
                  type="monotone"
                  dataKey="lucroLiquido"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorLucro)"
                  name="Lucro Líquido"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            Nenhum dado de gráfico disponível para os filtros selecionados.
          </div>
        )}
      </div>

      {/* ===================================================
          5. RANKINGS & ANÁLISES (DIRECTLY BELOW DASHBOARD)
          =================================================== */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Percent size={20} style={{ color: '#a78bfa' }} />
          <span>Rankings e Análises da Operação</span>
        </h2>

        {/* 5.1. Ranking por Oferta */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '14px' }}>Ranking por Oferta</h3>
          <div className="tk-table-container" style={{ margin: 0 }}>
            <table className="tk-table">
              <thead>
                <tr>
                  <th>Oferta</th>
                  <th style={{ textAlign: 'right' }}>Gasto Ads</th>
                  <th style={{ textAlign: 'right' }}>Faturamento</th>
                  <th style={{ textAlign: 'right' }}>Lucro</th>
                  <th style={{ textAlign: 'right' }}>ROAS</th>
                  <th style={{ textAlign: 'right' }}>CPA Tracked</th>
                  <th style={{ textAlign: 'right' }}>CPA Gateway</th>
                  <th style={{ textAlign: 'center' }}>Vendas (T/G)</th>
                  <th style={{ textAlign: 'right' }}>Taxa Track</th>
                  <th style={{ textAlign: 'center' }}>Linhas</th>
                </tr>
              </thead>
              <tbody>
                {rankingOffers.map((item) => (
                  <tr key={item.name}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{item.name}</td>
                    <td style={{ textAlign: 'right', color: '#9ca3af' }}>{formatCurrency(item.spend)}</td>
                    <td style={{ textAlign: 'right', color: '#fff' }}>{formatCurrency(item.revenue)}</td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: item.profit > 0 ? '#10b981' : item.profit < 0 ? '#ef4444' : '#f59e0b'
                      }}
                    >
                      {formatCurrency(item.profit)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: item.roas >= 1.0 ? '#10b981' : '#ef4444' }}>
                      {item.roas > 0 ? `${item.roas.toFixed(2)}x` : '—'}
                    </td>
                    <td style={{ textAlign: 'right', color: '#9ca3af' }}>
                      {item.cpaTracked > 0 ? formatCurrency(item.cpaTracked) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', color: '#fff' }}>
                      {item.cpaGateway > 0 ? formatCurrency(item.cpaGateway) : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.tracked} / {item.gateway}
                    </td>
                    <td style={{ textAlign: 'right' }}>{item.trackingRate.toFixed(0)}%</td>
                    <td style={{ textAlign: 'center' }}>{item.count}</td>
                  </tr>
                ))}
                {rankingOffers.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                      Nenhum lançamento no período para calcular o ranking.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5.2. Ranking por BC */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '14px' }}>Ranking por BC (Business Center)</h3>
          <div className="tk-table-container" style={{ margin: 0 }}>
            <table className="tk-table">
              <thead>
                <tr>
                  <th>BC</th>
                  <th style={{ textAlign: 'right' }}>Gasto Ads</th>
                  <th style={{ textAlign: 'right' }}>Faturamento</th>
                  <th style={{ textAlign: 'right' }}>Lucro</th>
                  <th style={{ textAlign: 'right' }}>ROAS</th>
                  <th style={{ textAlign: 'center' }}>Contas (ON/OFF/Caiu)</th>
                  <th>Status Atual</th>
                  <th style={{ textAlign: 'right' }}>Mínimo</th>
                </tr>
              </thead>
              <tbody>
                {rankingBCs.map((item) => (
                  <tr key={item.name}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{item.name}</td>
                    <td style={{ textAlign: 'right', color: '#9ca3af' }}>{formatCurrency(item.spend)}</td>
                    <td style={{ textAlign: 'right', color: '#fff' }}>{formatCurrency(item.revenue)}</td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: item.profit > 0 ? '#10b981' : item.profit < 0 ? '#ef4444' : '#f59e0b'
                      }}
                    >
                      {formatCurrency(item.profit)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: item.roas >= 1.0 ? '#10b981' : '#ef4444' }}>
                      {item.roas > 0 ? `${item.roas.toFixed(2)}x` : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.accountsUsed} usadas <span style={{ color: '#9ca3af' }}>({item.accountsOn} ON / {item.accountsOff} OFF / {item.accountsBanned} ❌)</span>
                    </td>
                    <td>
                      {item.status.includes('Caiu') ? (
                        <span className="tk-badge tk-badge-red">{item.status}</span>
                      ) : (
                        <span className="tk-badge tk-badge-green">{item.status}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {item.minBal ? formatCurrency(item.minBal) : '—'}
                    </td>
                  </tr>
                ))}
                {rankingBCs.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                      Nenhum lançamento para ranking de BCs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5.3. Ranking por Conta */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '14px' }}>Ranking por Conta</h3>
          <div className="tk-table-container" style={{ margin: 0 }}>
            <table className="tk-table">
              <thead>
                <tr>
                  <th>Conta</th>
                  <th>BC Vinculada</th>
                  <th>Oferta mais rodada</th>
                  <th style={{ textAlign: 'right' }}>Gasto Ads</th>
                  <th style={{ textAlign: 'right' }}>Faturamento</th>
                  <th style={{ textAlign: 'right' }}>Lucro</th>
                  <th style={{ textAlign: 'right' }}>ROAS</th>
                  <th>Status Atual</th>
                  <th>Reutilizável?</th>
                </tr>
              </thead>
              <tbody>
                {rankingAccounts.map((item) => (
                  <tr key={item.name}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{item.name}</td>
                    <td>{item.bc}</td>
                    <td style={{ fontSize: '12px' }}>{item.mostRodadaOffer}</td>
                    <td style={{ textAlign: 'right', color: '#9ca3af' }}>{formatCurrency(item.spend)}</td>
                    <td style={{ textAlign: 'right', color: '#fff' }}>{formatCurrency(item.revenue)}</td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: item.profit > 0 ? '#10b981' : item.profit < 0 ? '#ef4444' : '#f59e0b'
                      }}
                    >
                      {formatCurrency(item.profit)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: item.roas >= 1.0 ? '#10b981' : '#ef4444' }}>
                      {item.roas > 0 ? `${item.roas.toFixed(2)}x` : '—'}
                    </td>
                    <td>
                      {item.status.includes('Caiu') ? (
                        <span className="tk-badge tk-badge-red">{item.status}</span>
                      ) : (
                        <span className="tk-badge tk-badge-green">{item.status}</span>
                      )}
                    </td>
                    <td>
                      {item.reusable === 'Sim' ? (
                        <span className="tk-badge tk-badge-green">Sim</span>
                      ) : item.reusable === 'Não' ? (
                        <span className="tk-badge tk-badge-red">Não</span>
                      ) : (
                        <span className="tk-badge tk-badge-yellow">Talvez</span>
                      )}
                    </td>
                  </tr>
                ))}
                {rankingAccounts.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                      Nenhuma conta lançada no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5.4. Ranking por Domínio */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '14px' }}>Ranking por Domínio</h3>
          <div className="tk-table-container" style={{ margin: 0 }}>
            <table className="tk-table">
              <thead>
                <tr>
                  <th>Domínio</th>
                  <th>Origem</th>
                  <th style={{ textAlign: 'right' }}>Gasto Ads</th>
                  <th style={{ textAlign: 'right' }}>Faturamento</th>
                  <th style={{ textAlign: 'right' }}>Lucro</th>
                  <th style={{ textAlign: 'right' }}>ROAS</th>
                  <th>Ofertas Rodadas</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rankingDomains.map((item) => (
                  <tr key={item.name}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{item.name}</td>
                    <td>{item.origin}</td>
                    <td style={{ textAlign: 'right', color: '#9ca3af' }}>{formatCurrency(item.spend)}</td>
                    <td style={{ textAlign: 'right', color: '#fff' }}>{formatCurrency(item.revenue)}</td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: item.profit > 0 ? '#10b981' : item.profit < 0 ? '#ef4444' : '#f59e0b'
                      }}
                    >
                      {formatCurrency(item.profit)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: item.roas >= 1.0 ? '#10b981' : '#ef4444' }}>
                      {item.roas > 0 ? `${item.roas.toFixed(2)}x` : '—'}
                    </td>
                    <td style={{ fontSize: '12px' }}>{item.offersRodadas}</td>
                    <td>
                      {['Ativo', 'Ativa'].includes(item.status) ? (
                        <span className="tk-badge tk-badge-green">{item.status}</span>
                      ) : (
                        <span className="tk-badge tk-badge-red">{item.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {rankingDomains.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                      Nenhum domínio lançado no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5.5. Ranking por Pixel */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '14px' }}>Ranking por Pixel</h3>
          <div className="tk-table-container" style={{ margin: 0 }}>
            <table className="tk-table">
              <thead>
                <tr>
                  <th>Pixel</th>
                  <th>BC/Conta de Origem</th>
                  <th style={{ textAlign: 'right' }}>Gasto Ads</th>
                  <th style={{ textAlign: 'right' }}>Faturamento</th>
                  <th style={{ textAlign: 'right' }}>Lucro</th>
                  <th style={{ textAlign: 'right' }}>ROAS</th>
                  <th style={{ textAlign: 'center' }}>Vendas (T/G)</th>
                  <th style={{ textAlign: 'right' }}>Taxa Track</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rankingPixels.map((item) => (
                  <tr key={item.name}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{item.name}</td>
                    <td>{item.originBc}</td>
                    <td style={{ textAlign: 'right', color: '#9ca3af' }}>{formatCurrency(item.spend)}</td>
                    <td style={{ textAlign: 'right', color: '#fff' }}>{formatCurrency(item.revenue)}</td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: item.profit > 0 ? '#10b981' : item.profit < 0 ? '#ef4444' : '#f59e0b'
                      }}
                    >
                      {formatCurrency(item.profit)}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: item.roas >= 1.0 ? '#10b981' : '#ef4444' }}>
                      {item.roas > 0 ? `${item.roas.toFixed(2)}x` : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {item.tracked} / {item.gateway}
                    </td>
                    <td style={{ textAlign: 'right' }}>{item.trackingRate.toFixed(0)}%</td>
                    <td>
                      {['Ativo', 'Ativa'].includes(item.status) ? (
                        <span className="tk-badge tk-badge-green">{item.status}</span>
                      ) : (
                        <span className="tk-badge tk-badge-red">{item.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {rankingPixels.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                      Nenhum pixel lançado no período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TikTokDashboard;
