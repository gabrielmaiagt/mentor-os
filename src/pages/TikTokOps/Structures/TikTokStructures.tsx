import React, { useState } from 'react';
import type { TikTokStructure, TikTokStructureType } from '../../../types/tiktok';
import { addStructure, updateStructure } from '../../../services/tiktokService';
import { useToast } from '../../../components/ui/Toast';
import { Plus, Edit2, Trash2, Layers, AlertCircle, CheckCircle } from 'lucide-react';

interface TikTokStructuresProps {
  structures: TikTokStructure[];
  onEdit: (struct: TikTokStructure) => void;
  onDelete: (id: string) => void;
}

const TYPE_LABELS: Record<TikTokStructureType, string> = {
  offer: 'Ofertas',
  bc: 'BCs',
  account: 'Contas',
  pixel: 'Pixels',
  domain: 'Domínios'
};

export const TikTokStructures: React.FC<TikTokStructuresProps> & {
  StructureFormModal: React.FC<any>;
} = ({ structures, onEdit, onDelete }) => {
  const [activeSubTab, setActiveSubTab] = useState<TikTokStructureType>('offer');

  // Filter structures by type
  const filtered = structures.filter((s) => s.type === activeSubTab);

  // Status badges formatter
  const renderStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (['ATIVA', 'ON', 'ATIVO'].includes(s)) {
      return <span className="tk-badge tk-badge-green">{status}</span>;
    }
    if (['CAIU', 'RUIM', 'BLOQUEADO', 'INATIVO'].includes(s)) {
      return <span className="tk-badge tk-badge-red">{status}</span>;
    }
    if (['MÍNIMO ALTO', 'SEM SALDO', 'EM ANÁLISE', 'OFF - NÃO DEU ROI'].includes(s)) {
      return <span className="tk-badge tk-badge-yellow">{status}</span>;
    }
    if (['TESTE', 'ESCALA', 'GUARDADO', 'COMPARTILHADO'].includes(s)) {
      return <span className="tk-badge tk-badge-blue">{status}</span>;
    }
    return <span className="tk-badge tk-badge-gray">{status}</span>;
  };

  return (
    <div className="tk-structures-tab">
      {/* Sub Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <div className="premium-tabs compact">
          {(Object.keys(TYPE_LABELS) as TikTokStructureType[]).map((type) => (
            <button
              key={type}
              className={`premium-tab ${activeSubTab === type ? 'active' : ''}`}
              onClick={() => setActiveSubTab(type)}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of structures list */}
      <div className="tk-table-container">
        <table className="tk-table">
          <thead>
            <tr>
              <th>Nome / Identificador</th>
              <th>Status</th>
              {activeSubTab === 'bc' && <th>Saldo Mínimo</th>}
              {activeSubTab === 'account' && <th>BC Vinculada</th>}
              {activeSubTab === 'pixel' && <th>Origem BC/Conta</th>}
              {activeSubTab === 'domain' && (
                <>
                  <th>Origem</th>
                  <th>Oferta</th>
                </>
              )}
              <th>Observação</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600, color: '#fff' }}>{item.name}</td>
                <td>{renderStatusBadge(item.status)}</td>
                {activeSubTab === 'bc' && (
                  <td>
                    {item.currentMinimumBalance
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          item.currentMinimumBalance
                        )
                      : '—'}
                  </td>
                )}
                {activeSubTab === 'account' && <td>{item.linkedTo || '—'}</td>}
                {activeSubTab === 'pixel' && <td>{item.linkedTo || '—'}</td>}
                {activeSubTab === 'domain' && (
                  <>
                    <td>{item.origin || '—'}</td>
                    <td>{item.linkedTo || '—'}</td>
                  </>
                )}
                <td style={{ color: '#9ca3af', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.notes || '—'}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      onClick={() => onEdit(item)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#a78bfa',
                        cursor: 'pointer'
                      }}
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer'
                      }}
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: '30px' }}>
                  Nenhuma estrutura desse tipo cadastrada ainda. Crie uma no botão superior!
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
// 2. MODAL FORMULÁRIO (StructureFormModal)
// ==========================================

interface StructureFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  editingStructure: TikTokStructure | null;
}

export const StructureFormModal: React.FC<StructureFormModalProps> = ({
  isOpen,
  onClose,
  userId,
  editingStructure
}) => {
  const toast = useToast();

  const [type, setType] = useState<TikTokStructureType>('offer');
  const [name, setName] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkNames, setBulkNames] = useState('');
  const [status, setStatus] = useState('Ativa');
  const [linkedTo, setLinkedTo] = useState('');
  const [origin, setOrigin] = useState('Próprio');
  const [notes, setNotes] = useState('');
  const [currentMinimumBalance, setCurrentMinimumBalance] = useState('');

  // When editingStructure is loaded, fill states
  React.useEffect(() => {
    if (editingStructure) {
      setType(editingStructure.type);
      setName(editingStructure.name);
      setStatus(editingStructure.status);
      setLinkedTo(editingStructure.linkedTo || '');
      setOrigin(editingStructure.origin || 'Próprio');
      setNotes(editingStructure.notes || '');
      setCurrentMinimumBalance(
        editingStructure.currentMinimumBalance ? editingStructure.currentMinimumBalance.toString() : ''
      );
      setBulkMode(false);
      setBulkNames('');
    } else {
      // Defaults
      setType('offer');
      setName('');
      setStatus('Ativa');
      setLinkedTo('');
      setOrigin('Próprio');
      setNotes('');
      setCurrentMinimumBalance('');
      setBulkMode(false);
      setBulkNames('');
    }
  }, [editingStructure, isOpen]);

  // Adjust default status based on type
  React.useEffect(() => {
    if (!editingStructure) {
      if (type === 'offer') setStatus('Ativa');
      else if (type === 'bc') setStatus('Ativa');
      else if (type === 'account') setStatus('ON');
      else if (type === 'pixel') setStatus('Ativo');
      else if (type === 'domain') setStatus('Ativo');
    }
  }, [type, editingStructure]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (bulkMode) {
      const namesList = bulkNames
        .split(/[\n,]+/)
        .map((n) => n.trim())
        .filter((n) => n.length > 0);

      if (namesList.length === 0) {
        toast.error('Insira pelo menos um nome para cadastro em massa!');
        return;
      }

      try {
        let count = 0;
        for (const singleName of namesList) {
          const payload: any = {
            type,
            name: singleName,
            status,
            notes,
            linkedTo: linkedTo || null,
            origin: type === 'domain' ? origin : null,
            currentMinimumBalance: type === 'bc' && currentMinimumBalance ? Number(currentMinimumBalance) : null
          };
          await addStructure(userId, payload);
          count++;
        }
        toast.success(`${count} estruturas cadastradas com sucesso!`);
        onClose();
      } catch (e) {
        toast.error('Erro ao salvar estruturas em massa');
      }
    } else {
      if (!name.trim()) {
        toast.error('O campo nome é obrigatório!');
        return;
      }

      const payload: any = {
        type,
        name,
        status,
        notes,
        linkedTo: linkedTo || null,
        origin: type === 'domain' ? origin : null,
        currentMinimumBalance: type === 'bc' && currentMinimumBalance ? Number(currentMinimumBalance) : null
      };

      try {
        if (editingStructure && editingStructure.id) {
          await updateStructure(editingStructure.id, payload);
          toast.success('Estrutura atualizada!');
        } else {
          await addStructure(userId, payload);
          toast.success('Estrutura cadastrada com sucesso!');
        }
        onClose();
      } catch (e) {
        toast.error('Erro ao salvar estrutura');
      }
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
          maxWidth: '500px',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(139, 92, 246, 0.2)'
        }}
      >
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'between',
            alignItems: 'center'
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>
            {editingStructure ? 'Editar Estrutura' : 'Nova Estrutura'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div className="tk-form">
            {/* Tipo */}
            <div className="tk-form-group tk-form-full">
              <label>Tipo de Estrutura</label>
              <select
                className="tk-select"
                value={type}
                onChange={(e) => setType(e.target.value as TikTokStructureType)}
                disabled={!!editingStructure}
              >
                <option value="offer">Oferta</option>
                <option value="bc">Business Center (BC)</option>
                <option value="account">Conta de Anúncio</option>
                <option value="pixel">Pixel</option>
                <option value="domain">Domínio</option>
              </select>
            </div>

            {/* Bulk Mode Switch (Apenas no cadastro) */}
            {!editingStructure && (
              <div
                className="tk-form-group tk-form-full"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '-5px 0 15px 0',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(167, 139, 250, 0.08)'
                }}
              >
                <input
                  type="checkbox"
                  id="bulkModeCheckbox"
                  checked={bulkMode}
                  onChange={(e) => setBulkMode(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#a78bfa' }}
                />
                <label
                  htmlFor="bulkModeCheckbox"
                  style={{
                    margin: 0,
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#c084fc',
                    userSelect: 'none'
                  }}
                >
                  Cadastrar várias ao mesmo tempo (Modo em Massa)
                </label>
              </div>
            )}

            {/* Nome / Identificador (Condicional ao Modo em Massa) */}
            {bulkMode ? (
              <div className="tk-form-group tk-form-full">
                <label>Nomes / Identificadores (um por linha ou separados por vírgulas)</label>
                <textarea
                  className="tk-input"
                  style={{
                    minHeight: '100px',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    padding: '8px 12px',
                    lineHeight: '1.4',
                    resize: 'vertical'
                  }}
                  rows={4}
                  value={bulkNames}
                  onChange={(e) => setBulkNames(e.target.value)}
                  placeholder={
                    type === 'offer'
                      ? "Ex:\noferta_gorda\noferta_magra\noferta_premium"
                      : type === 'bc'
                      ? "Ex:\nBC 01 David\nBC 02 David\nBC 03 David"
                      : type === 'domain'
                      ? "Ex:\nofertadom1.com, ofertadom2.com, ofertadom3.com"
                      : "Insira os nomes separados por linha ou vírgula..."
                  }
                />
                <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                  Será gerada uma estrutura independente para cada nome listado acima.
                </span>
              </div>
            ) : (
              <div className="tk-form-group tk-form-full">
                <label>Nome / Identificador</label>
                <input
                  type="text"
                  className="tk-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    type === 'offer'
                      ? 'Ex: hot gorda'
                      : type === 'bc'
                      ? 'Ex: BC 17 David'
                      : type === 'account'
                      ? 'Ex: Conta 65'
                      : type === 'pixel'
                      ? 'Ex: Pixel BC 17 David'
                      : 'Ex: ofertatiktok1.com'
                  }
                />
              </div>
            )}

            {/* Status (Diferente dependendo do Tipo) */}
            <div className="tk-form-group tk-form-full">
              <label>Status</label>
              {type === 'offer' && (
                <select className="tk-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Ativa">Ativa</option>
                  <option value="Inativa">Inativa</option>
                </select>
              )}
              {type === 'bc' && (
                <select className="tk-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Ativa">Ativa</option>
                  <option value="Caiu">Caiu</option>
                  <option value="Mínimo Alto">Mínimo Alto</option>
                  <option value="Em Análise">Em Análise</option>
                  <option value="Pausada">Pausada</option>
                  <option value="Encerrada">Encerrada</option>
                </select>
              )}
              {type === 'account' && (
                <select className="tk-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="ON">ON</option>
                  <option value="OFF - Não deu ROI">OFF - Não deu ROI</option>
                  <option value="Caiu">Caiu</option>
                  <option value="Sem Saldo">Sem Saldo</option>
                  <option value="Em Análise">Em Análise</option>
                  <option value="Teste">Teste</option>
                  <option value="Escala">Escala</option>
                  <option value="Encerrada">Encerrada</option>
                </select>
              )}
              {type === 'pixel' && (
                <select className="tk-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Ativo">Ativo</option>
                  <option value="Guardado">Guardado</option>
                  <option value="Compartilhado">Compartilhado</option>
                  <option value="Ruim">Ruim</option>
                  <option value="Inativo">Inativo</option>
                </select>
              )}
              {type === 'domain' && (
                <select className="tk-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Ativo">Ativo</option>
                  <option value="Ruim">Ruim</option>
                  <option value="Bloqueado">Bloqueado</option>
                  <option value="Teste">Teste</option>
                  <option value="Encerrado">Encerrado</option>
                </select>
              )}
            </div>

            {/* Condicionais por Tipo */}
            {type === 'bc' && (
              <div className="tk-form-group tk-form-full">
                <label>Saldo Mínimo Atual (Opcional)</label>
                <input
                  type="number"
                  className="tk-input"
                  value={currentMinimumBalance}
                  onChange={(e) => setCurrentMinimumBalance(e.target.value)}
                  placeholder="Ex: 1200"
                />
              </div>
            )}

            {type === 'account' && (
              <div className="tk-form-group tk-form-full">
                <label>BC Vinculada</label>
                <input
                  type="text"
                  className="tk-input"
                  value={linkedTo}
                  onChange={(e) => setLinkedTo(e.target.value)}
                  placeholder="Ex: BC 17 David"
                />
              </div>
            )}

            {type === 'pixel' && (
              <div className="tk-form-group tk-form-full">
                <label>BC/Conta de Origem do Pixel</label>
                <input
                  type="text"
                  className="tk-input"
                  value={linkedTo}
                  onChange={(e) => setLinkedTo(e.target.value)}
                  placeholder="Ex: BC 17 David"
                />
              </div>
            )}

            {type === 'domain' && (
              <>
                <div className="tk-form-group">
                  <label>Origem do Domínio</label>
                  <select className="tk-select" value={origin} onChange={(e) => setOrigin(e.target.value)}>
                    <option value="Próprio">Próprio</option>
                    <option value="Plataforma">Plataforma</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="tk-form-group">
                  <label>Oferta Vinculada</label>
                  <input
                    type="text"
                    className="tk-input"
                    value={linkedTo}
                    onChange={(e) => setLinkedTo(e.target.value)}
                    placeholder="Ex: hot gorda"
                  />
                </div>
              </>
            )}

            {/* Observações */}
            <div className="tk-form-group tk-form-full">
              <label>Observação</label>
              <textarea
                className="tk-textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações sobre contingência, links, etc."
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
              {editingStructure ? 'Salvar Alterações' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

TikTokStructures.StructureFormModal = StructureFormModal;

export default TikTokStructures;
