import { ChainOfThoughtEntry } from '@/types/chat';

export interface SynthesisRequest {
  userQuery: string;
  chainOfThoughts: ChainOfThoughtEntry[];
}

export interface SynthesisResponse {
  finalAnswer: string;
  synthesisReasoning: string;
  specialistsUsed: string[];
  weightDistribution: { [specialistId: string]: number };
}

export class AISynthesizer {
  private static readonly SYNTHESIS_PROMPT = `Sei un AI Synthesizer esperto che deve creare la risposta finale ottimale combinando multiple chain of thought di specialisti diversi.

COMPITO: Analizza le catene di pensiero fornite e crea una risposta finale completa, coerente e ottimizzata che integri i migliori insight di ogni specialista.

SPECIALISTI E I LORO RUOLI:
- **Analitico Tecnico (INTJ)**: Fornisce analisi tecniche, soluzioni strutturate, approcci sistematici
- **Creativo Ideatore (ENFP)**: Offre idee innovative, approcci creativi, soluzioni originali
- **Verificatore Critico (ISTJ)**: Valida accuracy, identifica rischi, assicura qualità
- **Facilitatore Empatico (ENFJ)**: Rende accessibile, considera aspetti umani, migliora comunicazione

REGOLE DI SINTESI:
1. **Integrazione Intelligente**: Non concatenare semplicemente le risposte, ma integrarle in modo fluido
2. **Peso Contestuale**: Considera i pesi degli specialisti ma adatta al contesto della domanda
3. **Eliminazione Ridondanze**: Rimuovi duplicazioni mantenendo i punti chiave unici
4. **Coerenza Narrativa**: Crea una risposta che scorre naturalmente
5. **Completezza**: Copri tutti gli aspetti importanti emersi dalle chain
6. **Chiarezza**: Rendi la risposta accessibile e ben strutturata

FORMATO OUTPUT RICHIESTO (JSON):
{
  "finalAnswer": "Risposta finale completa e ottimizzata che integra tutti gli insight",
  "synthesisReasoning": "Spiegazione di come hai combinato le diverse catene di pensiero",
  "keyInsights": [
    "Insight principale dal primo specialista",
    "Insight principale dal secondo specialista"
  ],
  "approach": "Descrizione dell'approccio di sintesi utilizzato"
}

DOMANDA UTENTE: "{userQuery}"

CATENE DI PENSIERO DA SINTETIZZARE:

{chainOfThoughts}

Analizza tutte le catene di pensiero e fornisci la sintesi ottimale in formato JSON:`;

  static async synthesize(request: SynthesisRequest): Promise<SynthesisResponse> {
    try {
      console.log('🧠 AI Synthesizer starting synthesis for:', request.userQuery.substring(0, 50) + '...');
      console.log('📊 Processing', request.chainOfThoughts.length, 'chain of thoughts');

      // Prepara le chain of thought per il prompt
      const chainTexts = request.chainOfThoughts
        .filter(chain => chain.content && chain.isComplete && !chain.error)
        .map((chain, index) => 
          `**${chain.specialist.name} (Peso: ${(chain.weight * 100).toFixed(0)}%)**:\n${chain.content}`
        ).join('\n\n---\n\n');

      if (!chainTexts) {
        throw new Error('No valid chain of thoughts to synthesize');
      }

      const prompt = this.SYNTHESIS_PROMPT
        .replace('{userQuery}', request.userQuery)
        .replace('{chainOfThoughts}', chainTexts);

      console.log('📤 Sending synthesis request to DeepSeek...');

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6, // Bilanciato per creatività e coerenza
          max_tokens: 2500, // Spazio per risposte complete
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content?.trim();
      
      if (!aiResponse) {
        throw new Error('No response from AI synthesizer');
      }

      console.log('✅ AI Synthesizer response received');

      // Parse della risposta JSON
      const synthesis = this.parseSynthesisResponse(aiResponse);
      
      // Calcola distribuzione pesi
      const weightDistribution: { [specialistId: string]: number } = {};
      request.chainOfThoughts.forEach(chain => {
        weightDistribution[chain.specialist.id] = chain.weight;
      });

      const result: SynthesisResponse = {
        finalAnswer: synthesis.finalAnswer,
        synthesisReasoning: synthesis.synthesisReasoning || synthesis.approach || 'AI synthesis completed',
        specialistsUsed: request.chainOfThoughts.map(chain => chain.specialist.name),
        weightDistribution
      };

      console.log('🎯 Synthesis completed successfully');
      return result;

    } catch (error) {
      console.error('❌ AI Synthesizer Error:', error);
      
      // Fallback: concatenazione semplice con formatting
      return this.fallbackSynthesis(request);
    }
  }

  private static parseSynthesisResponse(response: string): any {
    try {
      // Cerca il JSON nella risposta
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        // Se non c'è JSON, usa la risposta come finalAnswer
        return {
          finalAnswer: response,
          synthesisReasoning: 'Direct response from AI synthesizer'
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.finalAnswer) {
        throw new Error('Missing finalAnswer in synthesis response');
      }

      return parsed;
    } catch (error) {
      console.error('❌ Synthesis JSON Parse Error:', error);
      
      // Fallback: usa la risposta grezza
      return {
        finalAnswer: response,
        synthesisReasoning: 'Fallback parsing - using raw response'
      };
    }
  }

  private static fallbackSynthesis(request: SynthesisRequest): SynthesisResponse {
    console.log('🔄 Using fallback synthesis method');
    
    const validChains = request.chainOfThoughts.filter(
      chain => chain.content && chain.isComplete && !chain.error
    );

    if (validChains.length === 0) {
      return {
        finalAnswer: 'Mi dispiace, non sono riuscito a processare adeguatamente le catene di pensiero degli specialisti. Potresti riformulare la domanda?',
        synthesisReasoning: 'No valid chains available for synthesis',
        specialistsUsed: [],
        weightDistribution: {}
      };
    }

    // Sintesi semplice basata sui pesi
    const sortedChains = validChains.sort((a, b) => b.weight - a.weight);
    const mainInsight = sortedChains[0];
    
    let fallbackAnswer = `Basandomi sull'analisi degli specialisti:\n\n`;
    
    // Aggiungi insight principale
    fallbackAnswer += `**${mainInsight.specialist.name}** (insight principale):\n`;
    fallbackAnswer += `${mainInsight.content.substring(0, 300)}...\n\n`;
    
    // Aggiungi insight complementari
    if (sortedChains.length > 1) {
      fallbackAnswer += `**Considerazioni aggiuntive:**\n`;
      sortedChains.slice(1, 3).forEach(chain => {
        fallbackAnswer += `• **${chain.specialist.name}**: ${chain.content.substring(0, 150)}...\n`;
      });
    }

    const weightDistribution: { [specialistId: string]: number } = {};
    validChains.forEach(chain => {
      weightDistribution[chain.specialist.id] = chain.weight;
    });

    return {
      finalAnswer: fallbackAnswer,
      synthesisReasoning: 'Fallback synthesis - weighted combination of specialist insights',
      specialistsUsed: validChains.map(chain => chain.specialist.name),
      weightDistribution
    };
  }
}
