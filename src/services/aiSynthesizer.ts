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

      // ✅ DEBUGGING DETTAGLIATO: Log dello stato di ogni chain
      console.log('🔍 Chain details debug:');
      request.chainOfThoughts.forEach((chain, index) => {
        console.log(`  Chain ${index + 1} (${chain.specialist.name}):`);
        console.log(`    - hasContent: ${!!chain.content} (length: ${chain.content?.length || 0})`);
        console.log(`    - isComplete: ${chain.isComplete}`);
        console.log(`    - hasError: ${!!chain.error}`);
        console.log(`    - isStreaming: ${chain.isStreaming}`);
        console.log(`    - weight: ${chain.weight}`);
        if (chain.error) {
          console.log(`    - error: ${chain.error}`);
        }
        if (chain.content) {
          console.log(`    - content preview: "${chain.content.substring(0, 100)}..."`);
        }
      });

      // ✅ MODIFICATO: Filtro molto più permissivo
      const validChains = request.chainOfThoughts.filter(chain => {
        const hasMinimalContent = chain.content && chain.content.trim().length > 5; // Solo 5 caratteri minimi
        const noBlockingError = !chain.error || chain.content; // Accetta anche chain con errore se hanno contenuto
        
        const isValid = hasMinimalContent && noBlockingError;
        
        console.log(`  Chain ${chain.specialist.name} validation:`, {
          hasMinimalContent,
          noBlockingError,
          isValid
        });
        
        return isValid;
      });

      console.log(`✅ Valid chains after filtering: ${validChains.length}/${request.chainOfThoughts.length}`);

      if (validChains.length === 0) {
        console.log('❌ No valid chains - attempting super-permissive fallback...');
        
        // ✅ SUPER-FALLBACK: Usa qualsiasi chain con anche 1 carattere
        const anyChainsWithContent = request.chainOfThoughts.filter(chain => 
          chain.content && chain.content.trim().length > 0
        );
        
        if (anyChainsWithContent.length > 0) {
          console.log(`🔄 Found ${anyChainsWithContent.length} chains with any content, using those`);
          return this.fallbackSynthesis({ ...request, chainOfThoughts: anyChainsWithContent });
        }
        
        // ✅ ULTIMO-FALLBACK: Se proprio non c'è niente, usa le chain "complete" anche senza contenuto
        const completedChains = request.chainOfThoughts.filter(chain => chain.isComplete);
        if (completedChains.length > 0) {
          console.log(`🆘 Using ${completedChains.length} completed chains as last resort`);
          return this.emergencyFallback(request.userQuery, completedChains);
        }
        
        throw new Error('No valid chain of thoughts to synthesize');
      }

      // Prepara le chain of thought per il prompt
      const chainTexts = validChains
        .map((chain, index) => 
          `**${chain.specialist.name} (Peso: ${(chain.weight * 100).toFixed(0)}%)**:\n${chain.content}`
        ).join('\n\n---\n\n');

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
      
      // Calcola distribuzione pesi usando chain valide
      const weightDistribution: { [specialistId: string]: number } = {};
      validChains.forEach(chain => {
        weightDistribution[chain.specialist.id] = chain.weight;
      });

      const result: SynthesisResponse = {
        finalAnswer: synthesis.finalAnswer,
        synthesisReasoning: synthesis.synthesisReasoning || synthesis.approach || 'AI synthesis completed',
        specialistsUsed: validChains.map(chain => chain.specialist.name),
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

  // ✅ NUOVO: Fallback di emergenza per chain complete senza contenuto
  private static emergencyFallback(userQuery: string, completedChains: ChainOfThoughtEntry[]): SynthesisResponse {
    console.log('🆘 Using emergency fallback - chains completed but no content');
    
    const specialistNames = completedChains.map(c => c.specialist.name).join(', ');
    
    return {
      finalAnswer: `Gli specialisti ${specialistNames} hanno processato la tua richiesta "${userQuery}", ma si è verificato un problema nel recuperare il contenuto delle loro analisi. 

Questo può accadere per problemi di timing o di connessione. Ti consiglio di:

1. **Riprovare la stessa domanda** - Spesso una nuova richiesta risolve il problema
2. **Riformulare la domanda** - Prova con parole diverse o più specifiche
3. **Controllare la connessione** - Assicurati che la connessione internet sia stabile

Gli specialisti sono stati attivati correttamente, quindi il sistema di routing AI funziona bene.`,
      synthesisReasoning: 'Emergency fallback - specialists activated but content not available',
      specialistsUsed: completedChains.map(c => c.specialist.name),
      weightDistribution: completedChains.reduce((acc, chain) => {
        acc[chain.specialist.id] = chain.weight;
        return acc;
      }, {} as { [key: string]: number })
    };
  }

  private static fallbackSynthesis(request: SynthesisRequest): SynthesisResponse {
    console.log('🔄 Using fallback synthesis method');
    
    // ✅ MODIFICATO: Usa chain con contenuto, anche non complete
    const chainsWithContent = request.chainOfThoughts.filter(
      chain => chain.content && chain.content.trim().length > 0
    );

    console.log(`📊 Fallback synthesis with ${chainsWithContent.length} chains with content`);

    if (chainsWithContent.length === 0) {
      return {
        finalAnswer: `Ho processato la tua richiesta "${request.userQuery}" ma non sono riuscito a recuperare il contenuto delle analisi degli specialisti. 

Questo potrebbe essere dovuto a:
- Problemi temporanei di connessione con i servizi AI
- Timing issue tra i diversi processi
- Sovraccarico dei server DeepSeek

**Suggerimenti:**
- Riprova con la stessa domanda
- Assicurati che la connessione internet sia stabile
- Se il problema persiste, prova a riformulare la domanda

Il sistema di routing AI ha funzionato correttamente, identificando gli specialisti appropriati per la tua richiesta.`,
        synthesisReasoning: 'No chains with content available - possible timing or connection issue',
        specialistsUsed: [],
        weightDistribution: {}
      };
    }

    // Sintesi semplice basata sui pesi
    const sortedChains = chainsWithContent.sort((a, b) => b.weight - a.weight);
    const mainInsight = sortedChains[0];
    
    let fallbackAnswer = `**Sintesi AI da ${chainsWithContent.length} specialista/i:**\n\n`;
    
    // Aggiungi insight principale
    fallbackAnswer += `## ${mainInsight.specialist.name} (Specialista principale - ${(mainInsight.weight * 100).toFixed(0)}%)\n`;
    fallbackAnswer += `${mainInsight.content.substring(0, 800)}${mainInsight.content.length > 800 ? '...' : ''}\n\n`;
    
    // Aggiungi insight complementari
    if (sortedChains.length > 1) {
      fallbackAnswer += `## Considerazioni aggiuntive:\n\n`;
      sortedChains.slice(1).forEach(chain => {
        fallbackAnswer += `### ${chain.specialist.name} (${(chain.weight * 100).toFixed(0)}%)\n`;
        fallbackAnswer += `${chain.content.substring(0, 500)}${chain.content.length > 500 ? '...' : ''}\n\n`;
      });
    }

    fallbackAnswer += `\n---\n*Sintesi automatica generata dal fallback system - ${chainsWithContent.length} specialisti hanno contribuito con i loro insight.*`;

    const weightDistribution: { [specialistId: string]: number } = {};
    chainsWithContent.forEach(chain => {
      weightDistribution[chain.specialist.id] = chain.weight;
    });

    return {
      finalAnswer: fallbackAnswer,
      synthesisReasoning: `Fallback synthesis usando ${chainsWithContent.length} chain con contenuto disponibile. Sintesi concatenativa con priorità basata sui pesi degli specialisti.`,
      specialistsUsed: chainsWithContent.map(chain => chain.specialist.name),
      weightDistribution
    };
  }
}
