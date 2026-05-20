import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import {
  TrendingUp,
  LayoutDashboard,
  Calendar,
  Layers,
  DollarSign,
  Plus,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import {
  subscribeLaunches,
  subscribeCosts,
  subscribeStructures,
  addLaunch,
  updateLaunch,
  deleteLaunch,
  addCost,
  updateCost,
  deleteCost,
  addStructure,
  updateStructure,
  deleteStructure
} from '../../services/tiktokService';
import type { TikTokLaunch, TikTokCost, TikTokStructure } from '../../types/tiktok';
import { format } from 'date-fns';
import { Button } from '../../components/ui';

// Subcomponents
import TikTokDashboard from './Dashboard/TikTokDashboard';
import TikTokLaunches from './Launches/TikTokLaunches';
import TikTokStructures from './Structures/TikTokStructures';
import TikTokCosts from './Costs/TikTokCosts';
import TikTokGlossary from './TikTokGlossary';

import './TikTokOpsLayout.css';

type ActiveTab = 'DASHBOARD' | 'LAUNCHES' | 'STRUCTURES' | 'COSTS';

const TikTokOpsLayout: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const userId = user?.id || '';

  // Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('DASHBOARD');

  // Real-time Firestore Data States
  const [launches, setLaunches] = useState<TikTokLaunch[]>([]);
  const [costs, setCosts] = useState<TikTokCost[]>([]);
  const [structures, setStructures] = useState<TikTokStructure[]>([]);
  const [loading, setLoading] = useState(true);

  // Glossary Overlay State
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  // Modal Open States
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);

  // Edit/Duplicate States
  const [editingLaunch, setEditingLaunch] = useState<TikTokLaunch | null>(null);
  const [editingCost, setEditingCost] = useState<TikTokCost | null>(null);
  const [editingStructure, setEditingStructure] = useState<TikTokStructure | null>(null);

  // Load Real-time Data
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const unsubLaunches = subscribeLaunches(userId, (data) => {
      setLaunches(data);
    });

    const unsubCosts = subscribeCosts(userId, (data) => {
      setCosts(data);
    });

    const unsubStructures = subscribeStructures(userId, (data) => {
      setStructures(data);
      setLoading(false);
    });

    return () => {
      unsubLaunches();
      unsubCosts();
      unsubStructures();
    };
  }, [userId]);

  // Launch modal close helper
  const closeLaunchModal = () => {
    setIsLaunchModalOpen(false);
    setEditingLaunch(null);
  };

  // Cost modal close helper
  const closeCostModal = () => {
    setIsCostModalOpen(false);
    setEditingCost(null);
  };

  // Structure modal close helper
  const closeStructureModal = () => {
    setIsStructureModalOpen(false);
    setEditingStructure(null);
  };

  // Triggering actions from subtabs
  const handleEditLaunch = (launch: TikTokLaunch) => {
    setEditingLaunch(launch);
    setIsLaunchModalOpen(true);
  };

  const handleDuplicateLaunch = (launch: TikTokLaunch) => {
    // Duplicate opens launch modal with existing launch fields, but fresh date
    const dup = { ...launch, id: '', date: format(new Date(), 'yyyy-MM-dd') };
    setEditingLaunch(dup as TikTokLaunch);
    setIsLaunchModalOpen(true);
  };

  const handleEditCost = (cost: TikTokCost) => {
    setEditingCost(cost);
    setIsCostModalOpen(true);
  };

  const handleEditStructure = (struct: TikTokStructure) => {
    setEditingStructure(struct);
    setIsStructureModalOpen(true);
  };

  return (
    <div className="tiktok-ops-page">
      {/* Top Header */}
      <header className="tiktok-ops-header">
        <div className="tiktok-header-titles">
          <h1>Central TikTok Ops</h1>
          <p>Controle financeiro e operacional de BCs, contas, domínios, pixels e ofertas.</p>
        </div>
        <div className="tiktok-header-actions">
          <button className="tk-btn tk-btn-secondary" onClick={() => setIsGlossaryOpen(true)}>
            <HelpCircle size={16} />
            <span>Glossário</span>
          </button>
          <button className="tk-btn tk-btn-secondary" onClick={() => setIsStructureModalOpen(true)}>
            <Plus size={16} />
            <span>Nova Estrutura</span>
          </button>
          <button className="tk-btn tk-btn-secondary" onClick={() => setIsCostModalOpen(true)}>
            <Plus size={16} />
            <span>Novo Custo</span>
          </button>
          <button className="tk-btn tk-btn-primary" onClick={() => setIsLaunchModalOpen(true)}>
            <Plus size={16} />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="tiktok-nav-tabs">
        <div className="premium-tabs">
          <button
            className={`premium-tab ${activeTab === 'DASHBOARD' ? 'active' : ''}`}
            onClick={() => setActiveTab('DASHBOARD')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button
            className={`premium-tab ${activeTab === 'LAUNCHES' ? 'active' : ''}`}
            onClick={() => setActiveTab('LAUNCHES')}
          >
            <Calendar size={18} />
            <span>Lançamentos</span>
            <span className="tab-badge">{launches.length}</span>
          </button>
          <button
            className={`premium-tab ${activeTab === 'STRUCTURES' ? 'active' : ''}`}
            onClick={() => setActiveTab('STRUCTURES')}
          >
            <Layers size={18} />
            <span>Estruturas</span>
            <span className="tab-badge">{structures.length}</span>
          </button>
          <button
            className={`premium-tab ${activeTab === 'COSTS' ? 'active' : ''}`}
            onClick={() => setActiveTab('COSTS')}
          >
            <DollarSign size={18} />
            <span>Custos</span>
            <span className="tab-badge">{costs.length}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="tiktok-tab-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#9ca3af' }}>
            Carregando dados da operação...
          </div>
        ) : (
          <>
            {activeTab === 'DASHBOARD' && (
              <TikTokDashboard
                launches={launches}
                costs={costs}
                structures={structures}
                onNewLaunch={() => setIsLaunchModalOpen(true)}
                onNewCost={() => setIsCostModalOpen(true)}
                onNewStructure={() => setIsStructureModalOpen(true)}
              />
            )}

            {activeTab === 'LAUNCHES' && (
              <TikTokLaunches
                launches={launches}
                structures={structures}
                onEdit={handleEditLaunch}
                onDuplicate={handleDuplicateLaunch}
                onDelete={async (id) => {
                  if (confirm('Tem certeza que deseja excluir este lançamento?')) {
                    try {
                      await deleteLaunch(id);
                      toast.success('Lançamento excluído com sucesso!');
                    } catch (e) {
                      toast.error('Erro ao excluir lançamento');
                    }
                  }
                }}
              />
            )}

            {activeTab === 'STRUCTURES' && (
              <TikTokStructures
                structures={structures}
                onEdit={handleEditStructure}
                onDelete={async (id) => {
                  if (confirm('Tem certeza que deseja excluir esta estrutura?')) {
                    try {
                      await deleteStructure(id);
                      toast.success('Estrutura excluída!');
                    } catch (e) {
                      toast.error('Erro ao excluir estrutura');
                    }
                  }
                }}
              />
            )}

            {activeTab === 'COSTS' && (
              <TikTokCosts
                costs={costs}
                onEdit={handleEditCost}
                onDelete={async (id) => {
                  if (confirm('Tem certeza que deseja excluir este custo?')) {
                    try {
                      await deleteCost(id);
                      toast.success('Custo excluído!');
                    } catch (e) {
                      toast.error('Erro ao excluir custo');
                    }
                  }
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Global Modals for Creating/Editing */}
      <TikTokLaunches.LaunchFormModal
        isOpen={isLaunchModalOpen}
        onClose={closeLaunchModal}
        userId={userId}
        editingLaunch={editingLaunch}
        structures={structures}
      />

      <TikTokCosts.CostFormModal
        isOpen={isCostModalOpen}
        onClose={closeCostModal}
        userId={userId}
        editingCost={editingCost}
      />

      <TikTokStructures.StructureFormModal
        isOpen={isStructureModalOpen}
        onClose={closeStructureModal}
        userId={userId}
        editingStructure={editingStructure}
      />

      {/* Glossary Modal */}
      {isGlossaryOpen && <TikTokGlossary onClose={() => setIsGlossaryOpen(false)} />}
    </div>
  );
};

export default TikTokOpsLayout;
