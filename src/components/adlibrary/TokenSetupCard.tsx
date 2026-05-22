import React, { useState } from 'react';
import { Key, ExternalLink, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, Button } from '../ui';

interface TokenSetupCardProps {
  token: string;
  onSaveToken: (newToken: string) => void;
}

export const TokenSetupCard: React.FC<TokenSetupCardProps> = ({ token, onSaveToken }) => {
  const [inputToken, setInputToken] = useState(token);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleTestToken = async () => {
    if (!inputToken.trim()) {
      setValidationStatus('invalid');
      setErrorMessage('O token não pode estar vazio.');
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');
    setErrorMessage('');

    try {
      // Test the token against Meta Graph API
      const res = await fetch(`https://graph.facebook.com/v20.0/me?access_token=${encodeURIComponent(inputToken)}`);
      const data = await res.json();
      
      if (res.ok && data && data.id) {
        setValidationStatus('valid');
        onSaveToken(inputToken);
      } else {
        setValidationStatus('invalid');
        const apiError = data?.error?.message || 'Resposta inválida da API da Meta.';
        setErrorMessage(apiError);
      }
    } catch (err: any) {
      setValidationStatus('invalid');
      setErrorMessage(err.message || 'Erro ao validar token. Verifique a conexão.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card padding="md" className="glass-card mb-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b pb-3 border-subtle">
          <div className="flex items-center gap-2">
            <Key className="text-accent-primary" size={22} />
            <h3 className="font-semibold text-lg">Configurar Token da Meta API</h3>
          </div>
          {token && validationStatus === 'idle' && (
            <span className="text-xs text-green-400 bg-green-950 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
              <CheckCircle size={12} /> Configurado
            </span>
          )}
          {validationStatus === 'valid' && (
            <span className="text-xs text-green-400 bg-green-950 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
              <CheckCircle size={12} /> Token Válido
            </span>
          )}
          {validationStatus === 'invalid' && (
            <span className="text-xs text-error bg-red-950 px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
              <XCircle size={12} /> Inválido
            </span>
          )}
        </div>

        <div className="text-sm text-secondary">
          <p className="mb-2">
            Para minerar anúncios automaticamente da Biblioteca de Anúncios, você precisa de um <strong>Facebook Graph API Access Token</strong>.
          </p>
          <div className="bg-bg-secondary p-3 rounded-lg border border-subtle flex flex-col gap-1.5 mb-3">
            <span className="font-semibold text-primary text-xs uppercase tracking-wider">Como obter seu token:</span>
            <ol className="list-decimal pl-4 space-y-1 text-xs">
              <li>Acesse o <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-accent-primary inline-flex items-center gap-0.5 hover:underline">Graph API Explorer <ExternalLink size={12} /></a></li>
              <li>Faça login na sua conta do Facebook.</li>
              <li>No canto superior direito, selecione um Aplicativo ou deixe o padrão.</li>
              <li>Em <strong>Permissions</strong> (Permissões), certifique-se de ter acesso básico ou adicione <code>ads_read</code>.</li>
              <li>Clique em <strong>Generate Access Token</strong> e copie o código gerado.</li>
            </ol>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-secondary">Acesso Token da Meta API</label>
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Eneter EAAB..."
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              className="flex-1 input-field"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '8px 12px',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px'
              }}
            />
            <Button 
              variant="secondary" 
              onClick={handleTestToken}
              disabled={isValidating || !inputToken.trim()}
              className="flex items-center gap-1.5"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="animate-spin" size={16} /> Validando...
                </>
              ) : (
                'Salvar e Testar'
              )}
            </Button>
          </div>
          {errorMessage && (
            <div className="text-xs text-error flex items-start gap-1.5 mt-1 bg-red-950/30 p-2 rounded border border-red-900/55">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
