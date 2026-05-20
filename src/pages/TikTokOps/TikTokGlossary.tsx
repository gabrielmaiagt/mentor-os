import React from 'react';
import { X, HelpCircle } from 'lucide-react';

interface TikTokGlossaryProps {
  onClose: () => void;
}

const terms = [
  {
    term: 'BC (Business Center)',
    definition: 'Business Center do TikTok, usado para organizar e rodar contas de anúncio da operação de forma integrada.'
  },
  {
    term: 'Conta',
    definition: 'Conta de anúncio específica dentro de uma BC para veiculação de campanhas.'
  },
  {
    term: 'Mínimo Alto',
    definition: 'Quando a BC para de aceitar saldo mínimo baixo (ex: R$ 60) e passa a exigir um valor inicial muito alto (ex: R$ 1.200). Isso não significa que a BC caiu, mas que ficou inviável de usar temporariamente.'
  },
  {
    term: 'BC Caiu',
    definition: 'Quando a Business Center inteira foi banida ou bloqueada pelo TikTok Ads, ficando totalmente inutilizável.'
  },
  {
    term: 'Conta Caiu',
    definition: 'Quando uma conta de anúncio específica foi bloqueada ou banida, enquanto a BC de origem pode ou não continuar de pé.'
  },
  {
    term: 'OFF - Não deu ROI',
    definition: 'A conta ou o lançamento continuam ativos/vivos, porém foram desligados ou pausados naquele dia porque não geraram retorno financeiro satisfatório. Podem ser reutilizados posteriormente.'
  },
  {
    term: 'Pixel',
    definition: 'Mapeamento do pixel usado para tracking. Pode referenciar o pixel principal guardado/protegido em uma conta e compartilhado com as demais contas operacionais.'
  },
  {
    term: 'Domínio',
    definition: 'Endereço da oferta rodando. Pode ser um domínio próprio (ex: ofertatiktok1.com) ou domínio de plataforma integrada (ex: sharkbot).'
  },
  {
    term: 'Vendas Trackeadas',
    definition: 'Quantidade de vendas que foram reportadas e marcadas corretamente no pixel/painel do TikTok Ads.'
  },
  {
    term: 'Vendas Gateway',
    definition: 'Total de vendas que de fato chegaram e foram aprovadas no gateway de pagamento integrado (número real de faturamento).'
  },
  {
    term: 'Diferença de Tracking',
    definition: 'Diferença entre o número real de vendas no gateway e o número de vendas trackeadas no TikTok (Vendas Gateway - Vendas Trackeadas).'
  }
];

export const TikTokGlossary: React.FC<TikTokGlossaryProps> = ({ onClose }) => {
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
          maxWidth: '650px',
          maxHeight: '85vh',
          borderRadius: '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(139, 92, 246, 0.2)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle size={20} style={{ color: '#a78bfa' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>Glossário TikTok Ops</h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* List of Terms */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {terms.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                padding: '14px',
                borderRadius: '12px'
              }}
            >
              <h4 style={{ color: '#a78bfa', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
                {item.term}
              </h4>
              <p style={{ color: '#d1d5db', fontSize: '13px', lineHeight: '1.5' }}>
                {item.definition}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TikTokGlossary;
