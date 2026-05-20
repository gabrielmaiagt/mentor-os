import React, { useState } from 'react';
import type { TikTokCost, TikTokCostType, TikTokPaidBy, TikTokPaymentMethod } from '../../../types/tiktok';
import { addCost, updateCost } from '../../../services/tiktokService';
import { useToast } from '../../../components/ui/Toast';
import { Edit2, Trash2, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface TikTokCostsProps {
  costs: TikTokCost[];
  onEdit: (cost: TikTokCost) => void;
  onDelete: (id: string) => void;
}

const COST_TYPE_LABELS: Record<TikTokCostType, string> = {
  BCs: 'BCs',
  Contas: 'Contas',
  Domínio: 'Domínios',
  Criativos: 'Criativos',
  Chip: 'Chips/SIM',
  Proxy: 'Proxies',
  Ferramenta: 'Ferramentas',
  Aquecimento: 'Aquecimento',
  Farm: 'Farm',
  Outro: 'Outros'
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export const TikTokCosts: React.FC<TikTokCostsProps> & {
  CostFormModal: React.FC<any>;
} = ({ costs, onEdit, onDelete }) => {
  return (
    <div className="tk-costs-tab">
      <div className="tk-table-container">
        <table className="tk-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo de Custo</th>
              <th>Descrição</th>
              <th style={{ textAlign: 'right' }}>Qtd</th>
              <th style={{ textAlign: 'right' }}>Unitário</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th>Pago Por</th>
              <th>Metodo</th>
              <th>Observação</th>
              <th style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {costs.map((item) => (
              <tr key={item.id}>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} style={{ color: '#a78bfa' }} />
                    {format(parseISO(item.date + 'T12:00:00'), 'dd/MM/yyyy')}
                  </span>
                </td>
                <td style={{ fontWeight: 600, color: '#fff' }}>{COST_TYPE_LABELS[item.costType]}</td>
                <td>{item.description}</td>
                <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitValue)}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>
                  {formatCurrency(item.totalValue)}
                </td>
                <td>{item.paidBy}</td>
                <td>{item.paymentMethod}</td>
                <td style={{ color: '#9ca3af', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.notes || '—'}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                      onClick={() => onEdit(item)}
                      style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer' }}
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {costs.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', color: '#9ca3af', padding: '30px' }}>
                  Nenhum custo extra lançado na operação ainda. Cadastre o primeiro!
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
// 2. FORMULÁRIO MODAL (CostFormModal)
// ==========================================

interface CostFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  editingCost: TikTokCost | null;
}

export const CostFormModal: React.FC<CostFormModalProps> = ({
  isOpen,
  onClose,
  userId,
  editingCost
}) => {
  const toast = useToast();

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [costType, setCostType] = useState<TikTokCostType>('BCs');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitValue, setUnitValue] = useState('');
  const [paidBy, setPaidBy] = useState<TikTokPaidBy>('Do bolso');
  const [paymentMethod, setPaymentMethod] = useState<TikTokPaymentMethod>('PIX');
  const [notes, setNotes] = useState('');

  // Load editing state
  React.useEffect(() => {
    if (editingCost) {
      setDate(editingCost.date);
      setCostType(editingCost.costType);
      setDescription(editingCost.description);
      setQuantity(editingCost.quantity.toString());
      setUnitValue(editingCost.unitValue.toString());
      setPaidBy(editingCost.paidBy);
      setPaymentMethod(editingCost.paymentMethod);
      setNotes(editingCost.notes || '');
    } else {
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setCostType('BCs');
      setDescription('');
      setQuantity('1');
      setUnitValue('');
      setPaidBy('Do bolso');
      setPaymentMethod('PIX');
      setNotes('');
    }
  }, [editingCost, isOpen]);

  if (!isOpen) return null;

  // Calculate dynamic total value
  const qty = Number(quantity) || 0;
  const unit = Number(unitValue) || 0;
  const total = qty * unit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !unitValue) {
      toast.error('Preencha a descrição e o valor unitário!');
      return;
    }

    const payload = {
      date,
      costType,
      description,
      quantity: qty,
      unitValue: unit,
      totalValue: total,
      paidBy,
      paymentMethod,
      notes
    };

    try {
      if (editingCost && editingCost.id) {
        await updateCost(editingCost.id, payload);
        toast.success('Custo atualizado!');
      } else {
        await addCost(userId, payload);
        toast.success('Custo adicionado à operação!');
      }
      onClose();
    } catch (e) {
      toast.error('Erro ao salvar custo');
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
            {editingCost ? 'Editar Custo' : 'Novo Custo Operacional'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div className="tk-form">
            {/* Data */}
            <div className="tk-form-group">
              <label>Data de Pagamento</label>
              <input
                type="date"
                className="tk-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Tipo */}
            <div className="tk-form-group">
              <label>Tipo de Custo</label>
              <select
                className="tk-select"
                value={costType}
                onChange={(e) => setCostType(e.target.value as TikTokCostType)}
              >
                <option value="BCs">Compra de BCs</option>
                <option value="Contas">Compra de Contas</option>
                <option value="Domínio">Domínio</option>
                <option value="Criativos">Criativos</option>
                <option value="Chip">Chips/SIM</option>
                <option value="Proxy">Proxies</option>
                <option value="Ferramenta">Ferramentas</option>
                <option value="Aquecimento">Aquecimento</option>
                <option value="Farm">Farm</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            {/* Descrição */}
            <div className="tk-form-group tk-form-full">
              <label>Descrição do Item</label>
              <input
                type="text"
                className="tk-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: 5 Contas Premium aquecidas no pix"
              />
            </div>

            {/* Quantidade */}
            <div className="tk-form-group">
              <label>Quantidade</label>
              <input
                type="number"
                className="tk-input"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
              />
            </div>

            {/* Valor Unitário */}
            <div className="tk-form-group">
              <label>Valor Unitário (R$)</label>
              <input
                type="number"
                step="0.01"
                className="tk-input"
                value={unitValue}
                onChange={(e) => setUnitValue(e.target.value)}
                placeholder="0,00"
              />
            </div>

            {/* Pago Por */}
            <div className="tk-form-group">
              <label>Pago Por</label>
              <select
                className="tk-select"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value as TikTokPaidBy)}
              >
                <option value="Do bolso">Do bolso</option>
                <option value="Lucro da operação">Lucro da operação</option>
                <option value="Cartão">Cartão</option>
                <option value="Parceiro">Parceiro</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            {/* Forma de Pagamento */}
            <div className="tk-form-group">
              <label>Forma de Pagamento</label>
              <select
                className="tk-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as TikTokPaymentMethod)}
              >
                <option value="PIX">PIX</option>
                <option value="Cartão">Cartão de Crédito</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            {/* Total Exibido (Calculado) */}
            <div className="tk-form-group tk-form-full">
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.1)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  justifyContent: 'between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>Valor Total Previsto</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444' }}>
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Observações */}
            <div className="tk-form-group tk-form-full">
              <label>Observação</label>
              <textarea
                className="tk-textarea"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anotações gerais"
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
              {editingCost ? 'Salvar Alterações' : 'Lançar Custo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

TikTokCosts.CostFormModal = CostFormModal;

export default TikTokCosts;
