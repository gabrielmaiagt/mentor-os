import React, { useState, useEffect } from 'react';
import { Settings, Play, LayoutDashboard, Search, Filter, ShieldAlert, RefreshCw } from 'lucide-react';
import { useMentee } from '../../hooks/queries/useMentee';
import {
  useAdLibraryConfig,
  useSaveAdLibraryConfig,
  useAdLibraryOffers,
  useSaveAdLibraryOffer,
  useUpdateAdLibraryOffer,
  useDeleteAdLibraryOffer
} from '../../hooks/queries/useAdLibrary';
import { TokenSetupCard, KeywordManager, MinerProgress, AdOfferCard } from '../../components/adlibrary';
import { Button, Card } from '../../components/ui';
import {
  generateCombinations,
  searchAds,
  countPageActiveAds,
  getLibraryLink,
  detectCtaSignals,
  sleep
} from '../../services/adLibraryService';
import type { AdLibraryOffer, ScanProgress, ScanLog } from '../../types/adlibrary';
import './AdLibraryMiner.css';

export const AdLibraryMinerPage: React.FC = () => {
  const { data: mentee, isLoading: isLoadingMentee } = useMentee();
  const { data: config, isLoading: isLoadingConfig } = useAdLibraryConfig(mentee?.id);
  const { data: savedOffers = [], isLoading: isLoadingOffers } = useAdLibraryOffers(mentee?.id);

  const saveConfig = useSaveAdLibraryConfig();
  const saveOffer = useSaveAdLibraryOffer();
  const updateOffer = useUpdateAdLibraryOffer();
  const deleteOffer = useDeleteAdLibraryOffer();

  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'config' | 'miner' | 'dashboard'>('config');

  // Local state for configuration
  const [baseKeywords, setBaseKeywords] = useState<string[]>([]);
  const [intentKeywords, setIntentKeywords] = useState<string[]>([]);
  const [accessToken, setAccessToken] = useState('');
  const [country, setCountry] = useState('BR');
  const [minDaysRunning, setMinDaysRunning] = useState(7);
  const [minPageAds, setMinPageAds] = useState(10);

  // Search/Filter state for Dashboard
  const [searchFilter, setSearchFilter] = useState('');
  const [ctaFilter, setCtaFilter] = useState<string>('ALL');

  // Miner Runner State
  const [scanProgress, setScanProgress] = useState<ScanProgress>({
    status: 'idle',
    totalCombinations: 0,
    currentCombinationIndex: 0,
    currentCombination: '',
    adsFound: 0,
    pagesChecked: 0,
    qualifiedOffers: 0,
    logs: [],
  });

  const [cancelScan, setCancelScan] = useState(false);

  // Default values initialization
  useEffect(() => {
    if (config) {
      setBaseKeywords(config.baseKeywords || [
        'receita de pão',
        'artesanato para vender',
        'laços',
        'feltro',
        'sabonete artesanal'
      ]);
      setIntentKeywords(config.intentKeywords || [
        'whatsapp',
        'chame no whatsapp',
        'receba no whatsapp',
        'faça e venda',
        'renda extra',
        'curso',
        'apostila',
        'moldes'
      ]);
      setAccessToken(config.accessToken || '');
      setCountry(config.country || 'BR');
      setMinDaysRunning(config.minDaysRunning || 7);
      setMinPageAds(config.minPageAds || 10);
    }
  }, [config]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const newLog: ScanLog = { timestamp, type, message };
    setScanProgress(prev => ({
      ...prev,
      logs: [...prev.logs, newLog]
    }));
  };

  const handleAddBaseKeyword = (word: string) => {
    if (!baseKeywords.includes(word)) {
      setBaseKeywords(prev => [...prev, word]);
    }
  };

  const handleRemoveBaseKeyword = (idx: number) => {
    setBaseKeywords(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddIntentKeyword = (word: string) => {
    if (!intentKeywords.includes(word)) {
      setIntentKeywords(prev => [...prev, word]);
    }
  };

  const handleRemoveIntentKeyword = (idx: number) => {
    setIntentKeywords(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveConfig = () => {
    if (!mentee?.id) return;
    saveConfig.mutate({
      menteeId: mentee.id,
      config: {
        baseKeywords,
        intentKeywords,
        accessToken,
        country,
        minDaysRunning,
        minPageAds,
      }
    });
  };

  const handleSaveToken = (newToken: string) => {
    setAccessToken(newToken);
    if (mentee?.id) {
      saveConfig.mutate({
        menteeId: mentee.id,
        config: {
          baseKeywords,
          intentKeywords,
          accessToken: newToken,
          country,
          minDaysRunning,
          minPageAds,
        }
      });
    }
  };

  // The Core Mining Engine
  const startMining = async () => {
    if (!accessToken) {
      alert('Por favor, configure o Meta Access Token antes de iniciar.');
      setActiveTab('config');
      return;
    }

    // Save configurations first
    handleSaveConfig();
    setActiveTab('miner');
    setCancelScan(false);

    const combos = generateCombinations(baseKeywords, intentKeywords);
    
    setScanProgress({
      status: 'running',
      totalCombinations: combos.length,
      currentCombinationIndex: 0,
      currentCombination: '',
      adsFound: 0,
      pagesChecked: 0,
      qualifiedOffers: 0,
      logs: [],
    });

    addLog(`Iniciando mineração automática com ${combos.length} combinações de palavras-chave.`, 'info');
    addLog(`Filtros ativos: Min. ${minDaysRunning} dias rodando | Min. ${minPageAds} ads ativos na página.`, 'info');

    let adsCount = 0;
    let pagesCheckedCount = 0;
    let qualifiedOffersCount = 0;
    const processedPages = new Set<string>();

    for (let i = 0; i < combos.length; i++) {
      // Check cancellation request
      if (cancelScan) {
        addLog('Mineração cancelada pelo usuário.', 'warning');
        break;
      }

      const combo = combos[i];
      setScanProgress(prev => ({
        ...prev,
        currentCombinationIndex: i + 1,
        currentCombination: combo,
      }));

      addLog(`[${i + 1}/${combos.length}] Buscando anúncios para: "${combo}"...`, 'info');

      try {
        const rawAds = await searchAds(combo, accessToken, country);
        addLog(`Encontrados ${rawAds.length} anúncios ativos para "${combo}".`, 'info');
        adsCount += rawAds.length;
        setScanProgress(prev => ({ ...prev, adsFound: adsCount }));

        // Filter and group by Page ID
        const adsByPageMap = new Map<string, typeof rawAds>();
        const now = new Date();

        rawAds.forEach(ad => {
          // Check running time
          const startStr = ad.ad_delivery_start_time || ad.ad_creation_time;
          if (!startStr) return;

          const startDate = new Date(startStr);
          const diffTime = Math.abs(now.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays >= minDaysRunning) {
            if (!adsByPageMap.has(ad.page_id)) {
              adsByPageMap.set(ad.page_id, []);
            }
            adsByPageMap.get(ad.page_id)!.push(ad);
          }
        });

        addLog(`Identificadas ${adsByPageMap.size} páginas com anúncios há mais de ${minDaysRunning} dias.`, 'info');

        // Check each Page unique ID
        for (const [pageId, pageAds] of adsByPageMap.entries()) {
          if (cancelScan) break;

          if (processedPages.has(pageId)) {
            continue; // Skip pages already analyzed in this session
          }
          processedPages.add(pageId);
          pagesCheckedCount++;
          setScanProgress(prev => ({ ...prev, pagesChecked: pagesCheckedCount }));

          addLog(`Analisando página: "${pageAds[0].page_name}" (ID: ${pageId})...`, 'info');
          
          // Delay to respect rate limit (~1 sec)
          await sleep(1000);

          // Get active ads count for the page
          const activeAdsCount = await countPageActiveAds(pageId, accessToken, country);
          addLog(`Página "${pageAds[0].page_name}" possui ${activeAdsCount} anúncios ativos no momento.`, 'info');

          if (activeAdsCount >= minPageAds) {
            qualifiedOffersCount++;
            setScanProgress(prev => ({ ...prev, qualifiedOffers: qualifiedOffersCount }));
            addLog(`✅ Página QUALIFICADA! "${pageAds[0].page_name}" atende ao critério de 10+ ads ativos.`, 'success');

            // Collect Representative Ad
            const representativeAd = pageAds[0];
            const startStr = representativeAd.ad_delivery_start_time || representativeAd.ad_creation_time;
            const startDateObj = startStr ? new Date(startStr) : new Date();
            const diffDays = Math.ceil(Math.abs(now.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));

            // Extract ad copy text
            const adTextContent = representativeAd.ad_creative_bodies?.[0] || '';
            const ctaSignalsDetected = detectCtaSignals(adTextContent);

            // Construct new offer entry
            const newOffer: AdLibraryOffer = {
              keyword: combo,
              pageName: representativeAd.page_name,
              pageId: pageId,
              libraryLink: getLibraryLink(pageId),
              adLink: representativeAd.ad_snapshot_url || getLibraryLink(pageId),
              adText: adTextContent,
              startDate: startDateObj.toISOString().split('T')[0],
              daysRunning: diffDays,
              pageAdCount: activeAdsCount,
              niche: 'Artesanato',
              subNiche: combo.replace('whatsapp', '').replace('curso', '').replace('renda extra', '').replace(baseKeywords.find(k => combo.includes(k)) || '', '').trim(),
              offerType: ctaSignalsDetected.includes('WhatsApp') ? 'X1 / WhatsApp' : 'Tráfego Direto',
              ctaSignals: ctaSignalsDetected,
              status: 'NEW',
              notes: `CTA forte: ${ctaSignalsDetected.join(', ') || 'Nenhum sinal explícito'}. Potencial oferta de Artesanato.`,
              scannedAt: new Date(),
              createdAt: new Date()
            };

            // Save to Firestore automatically
            if (mentee?.id) {
              await saveOffer.mutateAsync({ menteeId: mentee.id, offer: newOffer });
              addLog(`Salvo no Dashboard: "${representativeAd.page_name}"`, 'success');
            }
          } else {
            addLog(`Página descartada: apenas ${activeAdsCount} ads ativos.`, 'info');
          }
        }

      } catch (err: any) {
        addLog(`Erro ao processar combinação "${combo}": ${err.message}`, 'error');
        console.error(err);
      }

      // Delay between combinations (~2.5 sec)
      await sleep(2500);
    }

    setScanProgress(prev => ({
      ...prev,
      status: cancelScan ? 'idle' : 'done'
    }));
    addLog(`Mineração finalizada. Total de ofertas salvas nesta sessão: ${qualifiedOffersCount}`, 'success');
  };

  const handleCancelScan = () => {
    setCancelScan(true);
    addLog('Cancelamento solicitado pelo operador...', 'warning');
  };

  // Inline Handlers for saved offers in Dashboard
  const handleUpdateOfferStatus = (id: string, status: 'NEW' | 'SAVED' | 'DISCARDED') => {
    updateOffer.mutate({ id, data: { status } });
  };

  const handleUpdateOfferNotes = (id: string, notes: string) => {
    updateOffer.mutate({ id, data: { notes } });
  };

  const handleUpdateOfferDetails = (id: string, details: { niche: string; subNiche: string; offerType: string }) => {
    updateOffer.mutate({ id, data: details });
  };

  const handleDeleteOffer = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta oferta do dashboard?')) {
      deleteOffer.mutate(id);
    }
  };

  // Filter list
  const filteredOffers = savedOffers.filter(offer => {
    const textMatch = offer.pageName.toLowerCase().includes(searchFilter.toLowerCase()) || 
                      offer.adText.toLowerCase().includes(searchFilter.toLowerCase()) ||
                      offer.keyword.toLowerCase().includes(searchFilter.toLowerCase());
    
    if (ctaFilter === 'ALL') return textMatch;
    return textMatch && offer.ctaSignals.includes(ctaFilter);
  });

  const combinationsCount = baseKeywords.length * intentKeywords.length;

  if (isLoadingMentee || isLoadingConfig || isLoadingOffers) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[300px]">
        <RefreshCw className="animate-spin text-accent-primary mr-2" size={24} />
        <span className="text-secondary">Carregando painel de mineração...</span>
      </div>
    );
  }

  return (
    <div className="adlibrary-miner-container">
      {/* Header Title */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <Search className="text-accent-primary" size={28} /> Minerador Biblioteca Meta
          </h1>
          <p className="text-sm text-secondary">
            Encontre ofertas validadas de WhatsApp (X1) e low ticket rodando há mais de 7 dias com alta escala.
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="premium-tabs mb-6">
        <button
          className={`premium-tab ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          <Settings size={18} />
          <span>Configurações</span>
        </button>
        <button
          className={`premium-tab ${activeTab === 'miner' ? 'active' : ''}`}
          onClick={() => setActiveTab('miner')}
        >
          <Play size={18} />
          <span>Painel de Mineração</span>
          {scanProgress.status === 'running' && (
            <span className="tab-badge animate-pulse">NO AR</span>
          )}
        </button>
        <button
          className={`premium-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard Mined ({savedOffers.length})</span>
        </button>
      </div>

      {/* Panel Render */}
      {activeTab === 'config' && (
        <div className="flex flex-col gap-6">
          <TokenSetupCard token={accessToken} onSaveToken={handleSaveToken} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <KeywordManager
              title="Palavras-Chave Base (Produtos)"
              description="Nomes dos produtos, receitas ou subnichos a serem cruzados."
              keywords={baseKeywords}
              onAddKeyword={handleAddBaseKeyword}
              onRemoveKeyword={handleRemoveBaseKeyword}
              placeholder="Ex: laços, feltro, receita..."
              badgeColor="var(--accent-primary)"
            />
            <KeywordManager
              title="Palavras de Intenção (CTA / WhatsApp)"
              description="Termos que sugerem destino de WhatsApp ou ação faça-e-venda."
              keywords={intentKeywords}
              onAddKeyword={handleAddIntentKeyword}
              onRemoveKeyword={handleRemoveIntentKeyword}
              placeholder="Ex: whatsapp, chame no, renda extra..."
              badgeColor="var(--accent-secondary)"
            />
          </div>

          {/* Search Filters Card */}
          <Card padding="md" className="glass-card">
            <div className="flex flex-col gap-4">
              <h4 className="font-semibold text-lg text-primary border-b pb-2 border-subtle">Filtros Meta API</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-secondary">País Alvo</label>
                  <select
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="input-field"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="BR">Brasil (BR)</option>
                    <option value="PT">Portugal (PT)</option>
                    <option value="US">Estados Unidos (US)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-secondary">Min. Dias Rodando</label>
                  <input
                    type="number"
                    min="1"
                    value={minDaysRunning}
                    onChange={e => setMinDaysRunning(Number(e.target.value))}
                    className="input-field"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px', color: '#fff' }}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-secondary">Min. Ads Ativos na Página</label>
                  <input
                    type="number"
                    min="1"
                    value={minPageAds}
                    onChange={e => setMinPageAds(Number(e.target.value))}
                    className="input-field"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px', color: '#fff' }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center border-t pt-4 border-subtle mt-2">
                <span className="text-xs text-secondary">
                  Serão pesquisadas <strong className="text-primary">{combinationsCount} combinações</strong> na Meta API.
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleSaveConfig} disabled={saveConfig.isPending}>
                    Salvar Filtros
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={startMining}
                    disabled={scanProgress.status === 'running' || !accessToken}
                  >
                    🚀 Iniciar Mineração
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'miner' && (
        <div className="flex flex-col gap-6">
          <MinerProgress progress={scanProgress} onCancel={handleCancelScan} />
          
          {scanProgress.status === 'idle' && (
            <div className="text-center p-8 bg-white/[0.01] rounded-xl border border-dashed border-white/10">
              <p className="text-secondary mb-4 text-sm">O minerador está pronto. Certifique-se de configurar as palavras-chave.</p>
              <Button variant="primary" onClick={startMining} disabled={!accessToken}>
                Iniciar Mineração
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="flex flex-col gap-6">
          {/* Filters Dashboard Row */}
          <div className="flex flex-wrap gap-3 items-center justify-between bg-white/[0.01] p-3 rounded-xl border border-white/[0.04]">
            <div className="flex gap-2 items-center flex-1 min-w-[280px]">
              <Search className="text-secondary" size={18} />
              <input
                type="text"
                placeholder="Filtrar por Página, Keyword ou Texto..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="flex-1 input-field"
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '13px' }}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-secondary flex items-center gap-1.5"><Filter size={14} /> CTA:</span>
              <select
                value={ctaFilter}
                onChange={e => setCtaFilter(e.target.value)}
                className="input-field"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
              >
                <option value="ALL">Qualquer Sinal</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Renda Extra">Renda Extra</option>
                <option value="Curso/Material">Curso/Material</option>
                <option value="Promocional">Promocional</option>
              </select>
            </div>
          </div>

          {/* Grid Offers List */}
          {filteredOffers.length === 0 ? (
            <div className="text-center p-12 bg-white/[0.01] rounded-xl border border-dashed border-white/10">
              <ShieldAlert className="text-secondary m-auto mb-2" size={32} />
              <h4 className="font-semibold text-primary">Nenhuma Oferta Minerada Encontrada</h4>
              <p className="text-xs text-secondary mt-1">Execute a mineração para carregar novas ofertas ou limpe os filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOffers.map((offer) => (
                <AdOfferCard
                  key={offer.id}
                  offer={offer}
                  onUpdateStatus={handleUpdateOfferStatus}
                  onUpdateNotes={handleUpdateOfferNotes}
                  onUpdateDetails={handleUpdateOfferDetails}
                  onDelete={handleDeleteOffer}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdLibraryMinerPage;
