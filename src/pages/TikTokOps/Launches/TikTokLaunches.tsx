import React, { useState, useEffect } from 'react';
import type { TikTokLaunch, TikTokStructure, TikTokOperationalStatus, TikTokReusable, TikTokDayResult, TikTokDomainOrigin } from '../../../types/tiktok';
import { addLaunch, updateLaunch, addStructure } from '../../../services/tiktokService';
import { useToast } from '../../../components/ui/Toast';
import { Edit2, Copy, Trash2, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TikTokLaunchesProps {
  launches: TikTokLaunch[];
  structures: TikTokStructure[];
  onEdit: (launch: TikTokLaunch) => void;
  onDuplicate: (launch: TikTokLaunch) => void;
  onDelete: (id: string) => void;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const TikTokLaunches: React.FC<TikTokLaunchesProps> & {
  LaunchFormModal: React.FC<any>;
} = (props) => {
  const { launches, onEdit, onDuplicate, onDelete } = props;
  // Status badges color map
  const renderStatusBadge = (status: TikTokOperationalStatus) => {
    let cls = 'tk-badge-gray';
    if (['ON', 'ESCALA'].includes(status)) cls = 'tk-badge-green';
    else if (['BC CAIU', 'CONTA CAIU', 'DOMÍNIO RUIM', 'PIXEL RUIM'].includes(status.toUpperCase()))
      cls = 'tk-badge-red';
    else if (['OFF - NÃO DEU ROI', 'SEM SALDO', 'PAUSADA'].includes(status.toUpperCase()))
      cls = 'tk-badge-yellow';
    else if (['MÍNIMO ALTO', 'EM ANÁLISE', 'TESTE'].includes(status.toUpperCase())) cls = 'tk-badge-blue';

    return <span className={`tk-badge ${cls}`}>{status}</span>;
  };

  // Reusable badge color map
  const renderReusableBadge = (reusable: TikTokReusable) => {
    if (reusable === 'Sim') return <span className="tk-badge tk-badge-green">Sim</span>;
    if (reusable === 'Não') return <span className="tk-badge tk-badge-red">Não</span>;
    return <span className="tk-badge tk-badge-yellow">Talvez</span>;
  };

  // Day Result badge color map
  const renderResultBadge = (result: TikTokDayResult) => {
    if (result === 'Deu ROI') return <span className="tk-badge tk-badge-green">Deu ROI</span>;
    if (result === 'Não deu ROI') return <span className="tk-badge tk-badge-red">Sem ROI</span>;
    if (result === 'Neutro') return <span className="tk-badge tk-badge-yellow">Neutro</span>;
    return <span className="tk-badge tk-badge-gray">Não Rodou</span>;
  };

  // ── DATE FILTER ──────────────────────────────────────────────
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  const [dateFilter, setDateFilter] = useState('');

  const filtered = dateFilter
    ? launches.filter((l) => l.date === dateFilter)
    : launches;

  const daySpend   = filtered.reduce((a, l) => a + l.adSpend, 0);
  const dayRevenue = filtered.reduce((a, l) => a + l.revenue, 0);
  const dayProfit  = dayRevenue - daySpend;
  const dayRoas    = daySpend > 0 ? dayRevenue / daySpend : 0;

  return (
    <div className="tk-launches-tab">

      {/* ── BARRA DE FILTRO + RESUMO ── */}
      <div
        className="glass-card"
        style={{
          padding: '14px 20px',
          borderRadius: '14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={16} style={{ color: '#a78bfa' }} />
          <input
            type="date"
            className="tk-input"
            style={{ padding: '6px 10px', fontSize: '13px', width: '150px' }}
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`tk-btn ${dateFilter === todayStr ? 'tk-btn-primary' : 'tk-btn-secondary'}`}
            style={{ padding: '5px 12px', fontSize: '12px' }}
            onClick={() => setDateFilter(dateFilter === todayStr ? '' : todayStr)}
          >
            Hoje
          </button>
          <button
            className={`tk-btn ${dateFilter === yesterdayStr ? 'tk-btn-primary' : 'tk-btn-secondary'}`}
            style={{ padding: '5px 12px', fontSize: '12px' }}
            onClick={() => setDateFilter(dateFilter === yesterdayStr ? '' : yesterdayStr)}
          >
            Ontem
          </button>
          {dateFilter && (
            <button
              className="tk-btn tk-btn-secondary"
              style={{ padding: '5px 12px', fontSize: '12px' }}
              onClick={() => setDateFilter('')}
            >
              Ver Todos
            </button>
          )}
        </div>

        {filtered.length > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', alignItems: 'center', fontSize: '13px' }}>
            <span style={{ color: '#9ca3af' }}>
              <span style={{ color: '#ef4444', fontWeight: 600 }}>{formatCurrency(daySpend)}</span> gasto
            </span>
            <span style={{ color: '#9ca3af' }}>
              <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(dayRevenue)}</span> fat.
            </span>
            <span style={{ color: '#9ca3af' }}>
              Lucro:{' '}
              <span style={{ color: dayProfit >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                {formatCurrency(dayProfit)}
              </span>
            </span>
            <span style={{ color: '#9ca3af' }}>
              ROAS:{' '}
              <span style={{ color: dayRoas >= 1 ? '#10b981' : '#fff', fontWeight: 600 }}>
                {dayRoas > 0 ? `${dayRoas.toFixed(2)}x` : '—'}
              </span>
            </span>
            <span style={{ color: '#6b7280', fontSize: '12px' }}>
              {filtered.length} lançamento{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <div className="tk-table-container" style={{ overflowX: 'auto' }}>
        <table className="tk-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Oferta</th>
              <th>BC / Conta</th>
              <th>Pixel</th>
              <th>Domínio</th>
              <th style={{ textAlign: 'right' }}>Gasto</th>
              <th style={{ textAlign: 'center' }}>Vendas (T/G)</th>
              <th style={{ textAlign: 'right' }}>Faturamento</th>
              <th style={{ textAlign: 'right' }}>Lucro</th>
              <th style={{ textAlign: 'right' }}>ROAS</th>
              <th>Status</th>
              <th>Resultado</th>
              <th>Reútil.</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const profit = item.revenue - item.adSpend;
              const roas = item.adSpend > 0 ? item.revenue / item.adSpend : 0;
              const isDiffHigh = item.gatewaySales - item.trackedSales >= 10; // Alerta de diferença de tracking

              return (
                <tr key={item.id}>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                      <Calendar size={13} style={{ color: '#a78bfa' }} />
                      {format(parseISO(item.date + 'T12:00:00'), 'dd/MM')}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{item.offerName}</td>
                  <td>
                    <div style={{ fontSize: '13px', color: '#fff' }}>{item.bcName}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>C: {item.accountName}</div>
                  </td>
                  <td style={{ fontSize: '12px' }}>{item.pixelName}</td>
                  <td style={{ fontSize: '12px' }}>
                    <div>{item.domainName}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>{item.domainOrigin}</div>
                  </td>
                  <td style={{ textAlign: 'right', color: '#9ca3af' }}>{formatCurrency(item.adSpend)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ color: '#fff', fontWeight: 500 }}>
                      {item.trackedSales} <span style={{ color: '#9ca3af' }}>({item.gatewaySales})</span>
                    </span>
                    {isDiffHigh && (
                      <span
                        title={`Diferença alta de tracking: ${item.gatewaySales - item.trackedSales} vendas a mais no gateway`}
                        style={{ marginLeft: '4px', color: '#f59e0b', cursor: 'help' }}
                      >
                        ⚠️
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', color: '#fff' }}>{formatCurrency(item.revenue)}</td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      color: profit > 0 ? '#10b981' : profit < 0 ? '#ef4444' : '#f59e0b'
                    }}
                  >
                    {formatCurrency(profit)}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      color: roas >= 1.0 ? '#10b981' : roas > 0 ? '#ef4444' : '#9ca3af'
                    }}
                  >
                    {roas > 0 ? `${roas.toFixed(2)}x` : '—'}
                  </td>
                  <td>{renderStatusBadge(item.operationalStatus)}</td>
                  <td>{renderResultBadge(item.dayResult)}</td>
                  <td>{renderReusableBadge(item.reusable)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => onEdit(item)}
                        style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer' }}
                        title="Editar"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => onDuplicate(item)}
                        style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }}
                        title="Duplicar"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        title="Excluir"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={14} style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  {dateFilter
                    ? `Nenhum lançamento em ${format(new Date(dateFilter + 'T12:00:00'), 'dd/MM/yyyy')}.`
                    : 'Nenhum lançamento cadastrado ainda. Lance o seu primeiro teste de TikTok!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// 2. MODAL DE FORMULÁRIO (LaunchFormModal)
// ==========================================

interface LaunchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  editingLaunch: TikTokLaunch | null;
  structures: TikTokStructure[];
}

export const LaunchFormModal: React.FC<LaunchFormModalProps> = ({
  isOpen,
  onClose,
  userId,
  editingLaunch,
  structures
}) => {
  const toast = useToast();

  // Form Fields State
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [offerName, setOfferName] = useState('');
  const [bcName, setBcName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [pixelName, setPixelName] = useState('');
  const [pixelOrigin, setPixelOrigin] = useState('');
  const [domainName, setDomainName] = useState('');
  const [domainOrigin, setDomainOrigin] = useState<TikTokDomainOrigin>('Próprio');

  const [adSpend, setAdSpend] = useState('');
  const [trackedSales, setTrackedSales] = useState('');
  const [gatewaySales, setGatewaySales] = useState('');
  const [revenue, setRevenue] = useState('');

  const [operationalStatus, setOperationalStatus] = useState<TikTokOperationalStatus>('ON');
  const [dayResult, setDayResult] = useState<TikTokDayResult>('Neutro');
  const [currentMinimumBalance, setCurrentMinimumBalance] = useState('');
  const [reusable, setReusable] = useState<TikTokReusable>('Sim');
  const [notes, setNotes] = useState('');

  // Track manual modifications to allow automatic fills
  const [isDayResultManual, setIsDayResultManual] = useState(false);
  const [isReusableManual, setIsReusableManual] = useState(false);

  // Filter existing structures to list in autocompletes
  const offersList = structures.filter((s) => s.type === 'offer');
  const bcsList = structures.filter((s) => s.type === 'bc');
  const accountsList = structures.filter((s) => s.type === 'account');
  const pixelsList = structures.filter((s) => s.type === 'pixel');
  const domainsList = structures.filter((s) => s.type === 'domain');

  // Load Form states on open/edit
  useEffect(() => {
    if (editingLaunch) {
      setDate(editingLaunch.date);
      setOfferName(editingLaunch.offerName);
      setBcName(editingLaunch.bcName);
      setAccountName(editingLaunch.accountName);
      setPixelName(editingLaunch.pixelName);
      setPixelOrigin(editingLaunch.pixelOrigin || '');
      setDomainName(editingLaunch.domainName);
      setDomainOrigin(editingLaunch.domainOrigin);
      setAdSpend(editingLaunch.adSpend.toString());
      setTrackedSales(editingLaunch.trackedSales.toString());
      setGatewaySales(editingLaunch.gatewaySales.toString());
      setRevenue(editingLaunch.revenue.toString());
      setOperationalStatus(editingLaunch.operationalStatus);
      setDayResult(editingLaunch.dayResult);
      setCurrentMinimumBalance(
        editingLaunch.currentMinimumBalance ? editingLaunch.currentMinimumBalance.toString() : ''
      );
      setReusable(editingLaunch.reusable);
      setNotes(editingLaunch.notes || '');

      // Mark as manual override since it's an existing record
      setIsDayResultManual(true);
      setIsReusableManual(true);
    } else {
      // Defaults
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setOfferName('');
      setBcName('');
      setAccountName('');
      setPixelName('');
      setPixelOrigin('');
      setDomainName('');
      setDomainOrigin('Próprio');
      setAdSpend('');
      setTrackedSales('');
      setGatewaySales('');
      setRevenue('');
      setOperationalStatus('ON');
      setDayResult('Neutro');
      setCurrentMinimumBalance('');
      setReusable('Sim');
      setNotes('');

      setIsDayResultManual(false);
      setIsReusableManual(false);
    }
  }, [editingLaunch, isOpen]);

  // Dynamic automatic fills based on changes
  useEffect(() => {
    if (!isOpen) return;

    const spendNum = Number(adSpend) || 0;
    const revNum = Number(revenue) || 0;
    const profit = revNum - spendNum;

    // 1. Auto-calc Day Result if not overridden manually
    if (!isDayResultManual) {
      if (spendNum === 0 && revNum === 0) {
        setDayResult('Não rodou');
      } else if (profit > 0) {
        setDayResult('Deu ROI');
      } else if (profit < 0) {
        setDayResult('Não deu ROI');
      } else {
        setDayResult('Neutro');
      }
    }

    // 2. Auto-calc Reusable if not overridden manually
    if (!isReusableManual) {
      const statusUpper = operationalStatus.toUpperCase();
      if (['ON', 'ESCALA', 'TESTE', 'OFF - NÃO DEU ROI', 'SEM SALDO'].includes(statusUpper)) {
        setReusable('Sim');
      } else if (statusUpper.includes('CAIU') || ['DOMÍNIO RUIM', 'PIXEL RUIM'].includes(statusUpper)) {
        setReusable('Não');
      } else if (['MÍNIMO ALTO', 'PAUSADA', 'EM ANÁLISE'].includes(statusUpper)) {
        setReusable('Talvez');
      } else {
        setReusable('Sim');
      }
    }
  }, [adSpend, revenue, operationalStatus, isDayResultManual, isReusableManual, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!offerName || !bcName || !accountName || !pixelName || !domainName) {
      toast.error('Preencha os campos obrigatórios (Oferta, BC, Conta, Pixel e Domínio)!');
      return;
    }

    const spendNum = Number(adSpend) || 0;
    const revNum = Number(revenue) || 0;
    const trackedNum = Number(trackedSales) || 0;
    const gatewayNum = Number(gatewaySales) || 0;

    const payload: any = {
      date,
      offerId: structures.find((s) => s.type === 'offer' && s.name === offerName)?.id || 'custom',
      offerName,
      bcId: structures.find((s) => s.type === 'bc' && s.name === bcName)?.id || 'custom',
      bcName,
      accountId: structures.find((s) => s.type === 'account' && s.name === accountName)?.id || 'custom',
      accountName,
      pixelId: structures.find((s) => s.type === 'pixel' && s.name === pixelName)?.id || 'custom',
      pixelName,
      pixelOrigin: pixelOrigin || null,
      domainId: structures.find((s) => s.type === 'domain' && s.name === domainName)?.id || 'custom',
      domainName,
      domainOrigin,
      adSpend: spendNum,
      trackedSales: trackedNum,
      gatewaySales: gatewayNum,
      revenue: revNum,
      operationalStatus,
      dayResult,
      currentMinimumBalance: currentMinimumBalance ? Number(currentMinimumBalance) : null,
      reusable,
      notes
    };

    try {
      if (editingLaunch && editingLaunch.id) {
        await updateLaunch(editingLaunch.id, payload);
        toast.success('Lançamento atualizado!');
      } else {
        await addLaunch(userId, payload);
        toast.success('Lançamento realizado com sucesso!');
      }

      // AUTO-REGISTRATION OF STRUCTURES:
      // Asynchronously register any structure typed by the user that doesn't exist yet!
      const checkAndRegister = async (nameVal: string, typeVal: 'offer' | 'bc' | 'account' | 'pixel' | 'domain', extraFields = {}) => {
        const exists = structures.some((s) => s.type === typeVal && s.name.toLowerCase() === nameVal.toLowerCase());
        if (!exists && nameVal.trim()) {
          try {
            await addStructure(userId, {
              type: typeVal,
              name: nameVal,
              status: typeVal === 'account' ? 'ON' : 'Ativa',
              notes: 'Cadastrado automaticamente via lançamento.',
              ...extraFields
            });
          } catch (err) {
            console.error('Erro ao auto-registrar estrutura:', err);
          }
        }
      };

      checkAndRegister(offerName, 'offer');
      checkAndRegister(bcName, 'bc', { currentMinimumBalance: currentMinimumBalance ? Number(currentMinimumBalance) : null });
      checkAndRegister(accountName, 'account', { linkedTo: bcName });
      checkAndRegister(pixelName, 'pixel', { linkedTo: pixelOrigin });
      checkAndRegister(domainName, 'domain', { origin: domainOrigin, linkedTo: offerName });

      onClose();
    } catch (e) {
      toast.error('Erro ao salvar lançamento');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '700px',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          maxHeight: '90vh'
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'between',
            alignItems: 'center'
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>
            {editingLaunch ? 'Editar Lançamento' : 'Novo Lançamento Diário'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto' }}>
          <div className="tk-form">
            {/* Data */}
            <div className="tk-form-group">
              <label>Data</label>
              <input
                type="date"
                className="tk-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Oferta Autocomplete */}
            <div className="tk-form-group">
              <label>Oferta *</label>
              <input
                type="text"
                list="offers-list"
                className="tk-input"
                value={offerName}
                onChange={(e) => setOfferName(e.target.value)}
                placeholder="Ex: hot gorda"
              />
              <datalist id="offers-list">
                {offersList.map((o) => (
                  <option key={o.id} value={o.name} />
                ))}
              </datalist>
            </div>

            {/* BC Autocomplete */}
            <div className="tk-form-group">
              <label>Business Center (BC) *</label>
              <input
                type="text"
                list="bcs-list"
                className="tk-input"
                value={bcName}
                onChange={(e) => setBcName(e.target.value)}
                placeholder="Ex: BC 17 David"
              />
              <datalist id="bcs-list">
                {bcsList.map((b) => (
                  <option key={b.id} value={b.name} />
                ))}
              </datalist>
            </div>

            {/* Conta Autocomplete */}
            <div className="tk-form-group">
              <label>Conta de Anúncio *</label>
              <input
                type="text"
                list="accounts-list"
                className="tk-input"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Ex: 65"
              />
              <datalist id="accounts-list">
                {accountsList.map((a) => (
                  <option key={a.id} value={a.name} />
                ))}
              </datalist>
            </div>

            {/* Pixel Autocomplete */}
            <div className="tk-form-group">
              <label>Pixel *</label>
              <input
                type="text"
                list="pixels-list"
                className="tk-input"
                value={pixelName}
                onChange={(e) => setPixelName(e.target.value)}
                placeholder="Ex: Pixel BC 17 David"
              />
              <datalist id="pixels-list">
                {pixelsList.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>

            {/* Pixel Origin */}
            <div className="tk-form-group">
              <label>BC/Conta de Origem do Pixel</label>
              <input
                type="text"
                className="tk-input"
                value={pixelOrigin}
                onChange={(e) => setPixelOrigin(e.target.value)}
                placeholder="Ex: BC 17 David (Para contingência)"
              />
            </div>

            {/* Domínio Autocomplete */}
            <div className="tk-form-group">
              <label>Domínio *</label>
              <input
                type="text"
                list="domains-list"
                className="tk-input"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                placeholder="Ex: sharkbot / domain.com"
              />
              <datalist id="domains-list">
                {domainsList.map((d) => (
                  <option key={d.id} value={d.name} />
                ))}
              </datalist>
            </div>

            {/* Origem do Domínio */}
            <div className="tk-form-group">
              <label>Origem do Domínio</label>
              <select
                className="tk-select"
                value={domainOrigin}
                onChange={(e) => setDomainOrigin(e.target.value as TikTokDomainOrigin)}
              >
                <option value="Próprio">Próprio</option>
                <option value="Plataforma">Plataforma</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            {/* Gasto Ads */}
            <div className="tk-form-group">
              <label>Gasto Ads (R$)</label>
              <input
                type="number"
                step="0.01"
                className="tk-input"
                value={adSpend}
                onChange={(e) => setAdSpend(e.target.value)}
                placeholder="0,00"
              />
            </div>

            {/* Faturamento */}
            <div className="tk-form-group">
              <label>Faturamento (R$)</label>
              <input
                type="number"
                step="0.01"
                className="tk-input"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="0,00"
              />
            </div>

            {/* Vendas Trackeadas */}
            <div className="tk-form-group">
              <label>Vendas Trackeadas (TikTok Pixel)</label>
              <input
                type="number"
                className="tk-input"
                value={trackedSales}
                onChange={(e) => setTrackedSales(e.target.value)}
                placeholder="Ex: 7"
              />
            </div>

            {/* Vendas no Gateway */}
            <div className="tk-form-group">
              <label>Vendas no Gateway (Real)</label>
              <input
                type="number"
                className="tk-input"
                value={gatewaySales}
                onChange={(e) => setGatewaySales(e.target.value)}
                placeholder="Ex: 37"
              />
            </div>

            {/* Status Operacional */}
            <div className="tk-form-group">
              <label>Status Operacional</label>
              <select
                className="tk-select"
                value={operationalStatus}
                onChange={(e) => setOperationalStatus(e.target.value as TikTokOperationalStatus)}
              >
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
                <option value="Teste">Teste</option>
                <option value="Escala">Escala</option>
                <option value="Encerrada">Encerrada</option>
              </select>
            </div>

            {/* Resultado do Dia */}
            <div className="tk-form-group">
              <label>Resultado do Dia (Auto-fill)</label>
              <select
                className="tk-select"
                value={dayResult}
                onChange={(e) => {
                  setDayResult(e.target.value as TikTokDayResult);
                  setIsDayResultManual(true);
                }}
              >
                <option value="Deu ROI">Deu ROI</option>
                <option value="Não deu ROI">Não deu ROI</option>
                <option value="Neutro">Neutro</option>
                <option value="Não rodou">Não rodou</option>
              </select>
            </div>

            {/* Reutilizável? */}
            <div className="tk-form-group">
              <label>Reutilizável? (Auto-fill)</label>
              <select
                className="tk-select"
                value={reusable}
                onChange={(e) => {
                  setReusable(e.target.value as TikTokReusable);
                  setIsReusableManual(true);
                }}
              >
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
                <option value="Talvez">Talvez</option>
              </select>
            </div>

            {/* Saldo Mínimo Atual */}
            <div className="tk-form-group">
              <label>Saldo Mínimo Atual (Se Mínimo Alto)</label>
              <input
                type="number"
                className="tk-input"
                value={currentMinimumBalance}
                onChange={(e) => setCurrentMinimumBalance(e.target.value)}
                placeholder="Ex: 1200"
              />
            </div>

            {/* Observações */}
            <div className="tk-form-group tk-form-full">
              <label>Observação</label>
              <textarea
                className="tk-textarea"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações gerais..."
              />
            </div>
          </div>

          <div
            style={{
              marginTop: '20px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}
          >
            <button
              type="button"
              className="tk-btn tk-btn-secondary"
              onClick={onClose}
              style={{ padding: '8px 16px' }}
            >
              Cancelar
            </button>
            <button type="submit" className="tk-btn tk-btn-primary" style={{ padding: '8px 20px' }}>
              {editingLaunch ? 'Salvar Lançamento' : 'Lançar Dados'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

TikTokLaunches.LaunchFormModal = LaunchFormModal;

export default TikTokLaunches;
