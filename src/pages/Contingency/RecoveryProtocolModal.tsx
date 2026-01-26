import React from 'react';
import { Modal, Button } from '../../components/ui';
import { CheckSquare, ExternalLink, AlertTriangle } from 'lucide-react';
import type { Asset, AssetType } from '../../types/assets';

interface RecoveryProtocolModalProps {
    isOpen: boolean;
    onClose: () => void;
    asset: Asset | null;
}

const PROTOCOLS: Record<AssetType, { title: string; steps: string[]; link?: string }> = {
    'PROFILE': {
        title: 'Recuperação de Perfil (Identidade)',
        steps: [
            'Acesse a qualidade da conta (Account Quality).',
            'Se solicitado, envie documento de identidade (RG/CNH) com foto nítida.',
            'Aguarde 24-48h sem tentar logar ou criar novos ativos.',
            'Se voltar, aqueça por 3 dias antes de anunciar.',
            'Se for Ban Permanente, marque este ativo como "Banido" e substitua.'
        ],
        link: 'https://business.facebook.com/accountquality'
    },
    'BM': {
        title: 'Recuperação de Business Manager',
        steps: [
            'Verifique qual admin causou o bloqueio (geralmente é um perfil restrito)',
            'Remova o admin problemático se possível.',
            'Envie a contestação explicando que segue as políticas.',
            'Se for bloqueio por falta de pagamento, pague o saldo manual.',
            'Documente o ID do chamado no campo de observações.'
        ],
        link: 'https://business.facebook.com/help/contact/2166173276743732'
    },
    'AD_ACCOUNT': {
        title: 'Conta de Anúncios Desativada',
        steps: [
            'Identifique o anúncio rejeitado.',
            'Não edite a campanha bloqueada! Duplique e corrija.',
            'Mande contestação para a conta, admitindo erro se houver.',
            'Verifique se o Pixel ainda está ativo.',
            'Pause campanhas em outras contas que usem o mesmo criativo.'
        ],
        link: 'https://business.facebook.com/help/contact/2026068680760273'
    },
    'PAGE': {
        title: 'Página Restrita (Fanpage)',
        steps: [
            'Verifique o Feedback Score da página.',
            'Poste conteúdo orgânico "family friendly" por 3 dias.',
            'Conteste a decisão em "Qualidade da Página".',
            'Se o score for < 2, considere criar uma nova página.'
        ],
        link: 'https://www.facebook.com/accountquality'
    },
    'PIXEL': {
        title: 'Pixel Bloqueado',
        steps: [
            'Troque o domínio verificado se necessário.',
            'Crie um novo Pixel na BM Backup.',
            'Atualize suas LPs com o novo Pixel.',
            'O Pixel antigo provavelmente está perdido.'
        ],
    },
    'DOMAIN': {
        title: 'Domínio Bloqueado',
        steps: [
            'Verifique se o domínio está na "blocklist" do Facebook.',
            'Conteste no Debugger Tool.',
            'Se não resolver em 48h, compre um domínio novo (.com ou .com.br).',
            'Use cloaker se estiver rodando Black.'
        ],
        link: 'https://developers.facebook.com/tools/debug/'
    }
};

export const RecoveryProtocolModal: React.FC<RecoveryProtocolModalProps> = ({ isOpen, onClose, asset }) => {
    if (!asset) return null;

    const protocol = PROTOCOLS[asset.type] || { title: 'Protocolo Genérico', steps: ['Contate o suporte.', 'Verifique as políticas.'] };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`🚨 Protocolo: ${protocol.title}`}>
            <div className="space-y-6">
                <div className="bg-error/10 border border-error/20 p-4 rounded-xl flex gap-3 items-start">
                    <AlertTriangle className="text-error shrink-0 mt-1" size={20} />
                    <div>
                        <p className="font-bold text-error">Ativo em Risco: {asset.name}</p>
                        <p className="text-sm text-secondary">Siga os passos abaixo rigorosamente para tentar recuperar.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {protocol.steps.map((step, index) => (
                        <div key={index} className="flex gap-3 items-start p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                            <div className="bg-zinc-800 rounded text-center w-6 h-6 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
                                {index + 1}
                            </div>
                            <p className="text-zinc-200 text-sm leading-relaxed">{step}</p>
                        </div>
                    ))}
                </div>

                {protocol.link && (
                    <div className="pt-2">
                        <a
                            href={protocol.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600/30 transition-all font-bold text-sm"
                        >
                            <ExternalLink size={16} />
                            Acessar Link Oficial de Contestação
                        </a>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <Button variant="ghost" onClick={onClose}>Fechar</Button>
                    <Button variant="primary" onClick={onClose} className="bg-success text-black hover:bg-success/90">
                        <CheckSquare size={16} className="mr-2" />
                        Marcar como Realizado
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
