import type { PdfBriefing } from '../types/pdfbuilder';

const GEMINI_SCHEMA = {
  type: "OBJECT",
  properties: {
    refinedTitle: { 
      type: "STRING", 
      description: "Título premium, chamativo e profissional para o entregável." 
    },
    subtitle: { 
      type: "STRING", 
      description: "Subtítulo contendo uma promessa clara do que o material entrega." 
    },
    audience: { 
      type: "STRING", 
      description: "Público-alvo específico do entregável." 
    },
    mainPromise: { 
      type: "STRING", 
      description: "A dor principal solucionada e o resultado final prometido pelo material." 
    },
    visualStyle: { 
      type: "STRING", 
      enum: ["premium", "artesanal", "feminino", "dark", "minimalista", "educacional"],
      description: "O estilo visual recomendado para o nicho e tema."
    },
    themeColor: { 
      type: "STRING", 
      description: "Cor hexadecimal sugerida para o tema primário (ex: #ec4899 para feminino)." 
    },
    pages: {
      type: "ARRAY",
      description: "Lista ordenada de páginas que compõem o entregável. Crie entre 5 e 8 páginas relevantes.",
      items: {
        type: "OBJECT",
        properties: {
          type: { 
            type: "STRING", 
            enum: ["cover", "instruction", "materials", "table", "checklist", "tips", "errors", "content", "next_step"],
            description: "O tipo estrutural da página."
          },
          title: { 
            type: "STRING", 
            description: "Título principal da página." 
          },
          subtitle: { 
            type: "STRING", 
            description: "Subtítulo opcional da página." 
          },
          blocks: { 
            type: "ARRAY", 
            items: { type: "STRING" },
            description: "Lista de blocos de texto ou parágrafos. Devem conter dados ricos e explicações profundas, sem placeholders." 
          },
          columns: { 
            type: "ARRAY", 
            items: { type: "STRING" },
            description: "Títulos das colunas se for uma página do tipo table (ex: ['Modelo', 'Fita', 'Quantidade', 'Custo estimado'])." 
          },
          rows: { 
            type: "ARRAY", 
            items: { 
              type: "ARRAY", 
              items: { type: "STRING" } 
            },
            description: "Linhas da tabela correspondendo às colunas." 
          },
          checklist: {
            type: "ARRAY",
            description: "Lista de itens a checar com checkbox.",
            items: {
              type: "OBJECT",
              properties: {
                label: { type: "STRING", description: "Descrição prática do item a ser feito." },
                checked: { type: "BOOLEAN" }
              },
              required: ["label"]
            }
          },
          tips: { 
            type: "ARRAY", 
            items: { type: "STRING" },
            description: "Dicas de ouro, macetes ou avisos rápidos de destaque." 
          },
          warnings: { 
            type: "ARRAY", 
            items: { type: "STRING" },
            description: "Erros comuns que as pessoas cometem ou pontos críticos a evitar." 
          },
          ctaText: { 
            type: "STRING", 
            description: "O texto do botão de ação da última página (ex: 'Quero Garantir Minha Vaga no WhatsApp')." 
          },
          ctaLink: { 
            type: "STRING", 
            description: "O link sugerido para a chamada (ex: https://wa.me/...)." 
          }
        },
        required: ["type", "title"]
      }
    }
  },
  required: ["refinedTitle", "subtitle", "audience", "mainPromise", "visualStyle", "themeColor", "pages"]
};

export async function refineIdea(
  rawIdea: string,
  options: {
    niche: string;
    productName: string;
    audience: string;
    visualTone: string;
    depthLevel: 'iniciante' | 'intermediario' | 'avancado';
  },
  apiKey: string
): Promise<PdfBriefing> {
  if (!apiKey) {
    throw new Error("Gemini API Key não fornecida. Configure em Configurações.");
  }

  const prompt = `
Você é um Copywriter e Designer Editorial Premium especializado em infoprodutos e entregáveis de altíssimo valor percebido.
Sua missão é transformar a seguinte ideia bruta de entregável em um material premium completo, denso, prático e estruturado em JSON para renderização em A4.

DADOS DA SOLICITAÇÃO:
- Ideia Bruta: "${rawIdea}"
- Nicho: "${options.niche}"
- Nome do Produto: "${options.productName}"
- Público-Alvo sugerido: "${options.audience || 'Geral'}"
- Tom Visual preferido: "${options.visualTone}"
- Nível de Profundidade: "${options.depthLevel}"

INSTRUÇÕES CRÍTICAS DE CONTEÚDO (NÃO USE PLACEHOLDERS):
1. Escreva o conteúdo completo e detalhado. NUNCA gere textos como '[adicione mais texto]' ou '[detalhe o passo 2 aqui]'. Escreva as orientações práticas reais de forma clara, didática e motivadora.
2. Formate as páginas de acordo com a estrutura do material. Um material premium DEVE ter:
   - Uma página 'cover' (Capa forte)
   - Uma página 'instruction' (Como usar este material / Promessa do método)
   - Páginas de conteúdo ('materials', 'table', 'checklist', 'tips', 'errors', ou 'content' com explicações)
   - Uma página final 'next_step' (CTA forte de Upsell direcionando para um próximo passo, exemplo: continuar o aprendizado no curso principal ou suporte direto).
3. Paleta de cores sugerida para "themeColor":
   - "feminino" -> "#ec4899" (rosa vibrante)
   - "artesanal" -> "#d97706" (âmbar/dourado)
   - "premium" -> "#8b5cf6" (violeta elegante)
   - "dark" -> "#10b981" (esmeralda em fundo escuro)
   - "minimalista" -> "#4b5563" (cinza sofisticado)
   - "educacional" -> "#3b82f6" (azul confiável)

Ajuste a cor sugerida e o estilo de acordo com a escolha ou nicho.
Gere conteúdo altamente informativo, rico em listas e dados concretos.
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: GEMINI_SCHEMA
          }
        })
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData?.error?.message || `Erro HTTP ${response.status}`);
    }

    const resJson = await response.json();
    const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      throw new Error("A resposta da IA veio sem conteúdo textual.");
    }

    const briefing: PdfBriefing = JSON.parse(rawText);
    
    // Add rawIdea for reference
    briefing.rawIdea = rawIdea;

    return briefing;
  } catch (error: any) {
    console.error("Erro na chamada do Gemini API:", error);
    throw new Error(error.message || "Erro desconhecido ao chamar a API do Gemini.");
  }
}
