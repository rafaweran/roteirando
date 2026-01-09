/**
 * Função para gerar texto com IA usando Google Gemini API
 */

interface GenerateTextOptions {
  prompt: string;
  context?: string;
  maxTokens?: number;
}

export async function generateTextWithAI(options: GenerateTextOptions): Promise<string> {
  const { prompt, context, maxTokens = 500 } = options;
  
  // Obter API key das variáveis de ambiente
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 
                 (import.meta as any).env?.GEMINI_API_KEY ||
                 (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY);
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada. Configure a variável de ambiente VITE_GEMINI_API_KEY.');
  }

  try {
    // Construir o prompt completo
    const fullPrompt = context 
      ? `${context}\n\n${prompt}`
      : prompt;

    // Chamar a API do Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: fullPrompt
            }]
          }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `Erro na API: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    
    // Extrair o texto gerado
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('Resposta da API não contém texto gerado');
    }

    return generatedText.trim();
  } catch (error: any) {
    console.error('❌ Erro ao gerar texto com IA:', error);
    throw new Error(
      error.message || 
      'Erro ao gerar texto com IA. Verifique sua API key e conexão com a internet.'
    );
  }
}

/**
 * Gera uma descrição de passeio baseada nas informações fornecidas
 */
export async function generateTourDescription(tourInfo: {
  name: string;
  date?: string;
  location?: string;
  price?: string;
  tripName?: string;
  tripDestination?: string;
}): Promise<string> {
  const { name, date, location, price, tripName, tripDestination } = tourInfo;
  
  const context = tripName 
    ? `Você é um especialista em escrever descrições atraentes de passeios turísticos.`
    : `Você é um especialista em escrever descrições atraentes de passeios turísticos.`;

  const prompt = `Escreva uma descrição atrativa e profissional para o seguinte passeio turístico:

Nome do passeio: ${name}
${date ? `Data: ${date}` : ''}
${location ? `Local: ${location}` : ''}
${price ? `Preço: ${price}` : ''}
${tripName ? `Viagem: ${tripName}` : ''}
${tripDestination ? `Destino: ${tripDestination}` : ''}

A descrição deve:
- Ser envolvente e atrativa
- Destacar os principais pontos de interesse
- Ser escrita em português brasileiro
- Ter entre 100 e 200 palavras
- Ser profissional mas acessível
- Incluir informações sobre o que o visitante pode esperar

Escreva apenas a descrição, sem títulos ou formatação extra:`;

  return await generateTextWithAI({ prompt, context, maxTokens: 300 });
}


