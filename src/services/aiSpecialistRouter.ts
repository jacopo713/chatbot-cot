import { RouterDecision, SpecialistScore } from '@/types/specialists';
import { SPECIALISTS } from '@/config/specialists';

export class AISpecialistRouter {
  private static readonly EVALUATION_PROMPT = `Sei un esperto router per sistemi multi-specialista AI. Devi valutare quale/i specialista/i sono più adatti per rispondere a una domanda utente.

SPECIALISTI DISPONIBILI:
1. **analytic-technical** - Analitico Tecnico (INTJ): Esperto in problem solving tecnico, architetture software, programmazione, analisi sistemiche, ottimizzazioni, debugging
2. **creative-ideator** - Creativo Ideatore (ENFP): Esperto in brainstorming, contenuti creativi, innovazione, storytelling, ideazione, soluzioni originali
3. **critical-verifier** - Verificatore Critico (ISTJ): Esperto in quality assurance, verifica accuratezza, validazione, processi metodici, controlli sistematici
4. **empathetic-facilitator** - Facilitatore Empatico (ENFJ): Esperto in supporto umano, comunicazione, spiegazioni chiare, relazioni interpersonali, formazione

REGOLE DI VALUTAZIONE:
- Se la domanda è molto semplice (saluti base, risposte di 1-2 parole, "ciao", "grazie", domande basic), usa API generica E fornisci direttamente una risposta appropriata
- Per domande che richiedono una sola competenza specifica, seleziona 1 specialista
- Per domande multi-competenza o complesse, seleziona 2-3 specialisti più adatti
- Assegna pesi da 0.15 a 1.0 basati sulla rilevanza (soglia minima 0.15)
- Maggiore è la complessità/multi-competenza, più specialisti attiva

ESEMPI:
- "Ciao come stai?" → useGeneric: true + risposta diretta friendly
- "Grazie" → useGeneric: true + risposta cortese
- "Che ore sono?" → useGeneric: true + risposta informativa
- "Analizza l'architettura React" → analytic-technical: 0.9
- "Crea contenuti creativi per spiegare React" → creative-ideator: 0.8, empathetic-facilitator: 0.6

FORMATO OUTPUT RICHIESTO (JSON valido):

**Per domande SEMPLICI (useGeneric: true):**
{
  "useGeneric": true,
  "directResponse": "Risposta diretta alla domanda dell'utente",
  "specialists": [],
  "reasoning": "Spiegazione perché si usa API generica"
}

**Per domande COMPLESSE (useGeneric: false):**
{
  "useGeneric": false,
  "specialists": [
    {"id": "specialista-id", "weight": number, "reasoning": "spiegazione dettagliata"}
  ],
  "reasoning": "Spiegazione generale della decisione di routing"
}

DOMANDA UTENTE: "{userInput}"

Analizza la domanda e rispondi SOLO con il JSON richiesto. Se useGeneric è true, includi una risposta diretta e appropriata nel campo directResponse:`;

  static async route(userInput: string): Promise<RouterDecision & { directResponse?: string }> {
    try {
      console.log('🤖 AI Router evaluating:', userInput.substring(0, 100) + '...');
      
      const prompt = this.EVALUATION_PROMPT.replace('{userInput}', userInput);
      
      // Chiamata a DeepSeek per valutazione
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4, // Slightly higher for better generic responses
          max_tokens: 800, // Increased for potential direct responses
        }),
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content?.trim();
      
      if (!aiResponse) {
        throw new Error('No response from AI router');
      }

      console.log('🧠 AI Router response:', aiResponse.substring(0, 200) + '...');

      // Parse della risposta JSON
      const evaluation = this.parseAIResponse(aiResponse);
      
      // Conversione in RouterDecision (estesa)
      const decision = this.convertToRouterDecision(evaluation, userInput);
      
      console.log('📋 Final routing decision:', {
        useGeneric: decision.useGeneric,
        hasDirectResponse: !!(evaluation.directResponse),
        selectedCount: decision.selectedSpecialists.length,
        reasoning: decision.reasoning
      });

      // Aggiungi directResponse se presente
      return {
        ...decision,
        ...(evaluation.directResponse && { directResponse: evaluation.directResponse })
      };

    } catch (error) {
      console.error('❌ AI Router Error:', error);
      
      // Fallback al sistema precedente in caso di errore
      console.log('🔄 Falling back to rule-based routing');
      return this.fallbackRouting(userInput);
    }
  }

  private static parseAIResponse(response: string): any {
    try {
      // Cerca il JSON nella risposta (potrebbe avere testo prima/dopo)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validazione base
      if (typeof parsed.useGeneric !== 'boolean') {
        throw new Error('Invalid useGeneric field');
      }
      
      if (!parsed.useGeneric && (!Array.isArray(parsed.specialists) || parsed.specialists.length === 0)) {
        throw new Error('Invalid specialists array for complex routing');
      }

      // Validazione per risposta generica
      if (parsed.useGeneric && !parsed.directResponse) {
        console.warn('⚠️ Generic routing without direct response, falling back');
        throw new Error('Generic routing missing directResponse');
      }

      return parsed;
    } catch (error) {
      console.error('❌ JSON Parse Error:', error);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  private static convertToRouterDecision(evaluation: any, userInput: string): RouterDecision {
    const tokenCount = Math.ceil(userInput.split(/\s+/).length * 1.3);
    
    if (evaluation.useGeneric) {
      return {
        useGeneric: true,
        selectedSpecialists: [],
        allScores: [],
        tokenCount,
        complexity: 'low',
        reasoning: evaluation.reasoning || 'AI Router determined generic API usage with direct response',
        activationThreshold: 0.15
      };
    }

    // Converti specialists in SpecialistScore (come prima)
    const selectedSpecialists: SpecialistScore[] = evaluation.specialists.map((spec: any) => {
      const specialist = SPECIALISTS.find(s => s.id === spec.id);
      
      if (!specialist) {
        throw new Error(`Unknown specialist ID: ${spec.id}`);
      }

      return {
        specialist,
        score: spec.weight,
        reasoning: spec.reasoning || 'AI Router selection',
        features: [`AI Score: ${(spec.weight * 100).toFixed(0)}%`]
      };
    });

    // Crea allScores con tutti gli specialisti
    const allScores: SpecialistScore[] = SPECIALISTS.map(specialist => {
      const selected = selectedSpecialists.find(s => s.specialist.id === specialist.id);
      
      if (selected) {
        return selected;
      }

      return {
        specialist,
        score: 0,
        reasoning: 'Not selected by AI Router',
        features: ['AI Score: 0%']
      };
    });

    // Determina complessità basata su numero di specialisti
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    if (selectedSpecialists.length >= 3) complexity = 'high';
    else if (selectedSpecialists.length === 1) complexity = 'medium';

    return {
      useGeneric: false,
      selectedSpecialists,
      allScores,
      tokenCount,
      complexity,
      reasoning: evaluation.reasoning || `AI Router selected ${selectedSpecialists.length} specialists`,
      activationThreshold: 0.15
    };
  }

  private static fallbackRouting(userInput: string): RouterDecision & { directResponse?: string } {
    const tokenCount = Math.ceil(userInput.split(/\s+/).length * 1.3);
    
    // Fallback per domande molto semplici con risposta diretta
    const simplePatterns = [
      { pattern: /^(ciao|hello|hi|salve|buongiorno|buonasera)$/i, response: "Ciao! Come posso aiutarti oggi? 😊" },
      { pattern: /^(come stai|come va|tutto bene)$/i, response: "Grazie per aver chiesto! Sto bene e sono qui per aiutarti. Come posso esserti utile?" },
      { pattern: /^(grazie|thanks|thx)$/i, response: "Prego! È stato un piacere aiutarti. Se hai altre domande, sono qui! 🙂" },
      { pattern: /^(ok|okay|va bene|perfetto)$/i, response: "Perfetto! Se hai bisogno di altro, fammi sapere." },
      { pattern: /^(arrivederci|ciao|bye|addio)$/i, response: "Arrivederci! È stato un piacere chiacchierare con te. A presto! 👋" }
    ];
    
    for (const { pattern, response } of simplePatterns) {
      if (pattern.test(userInput.trim())) {
        return {
          useGeneric: true,
          selectedSpecialists: [],
          allScores: [],
          tokenCount,
          complexity: 'low',
          reasoning: 'Fallback routing - simple greeting/response with direct answer',
          activationThreshold: 0.15,
          directResponse: response
        };
      }
    }

    // Default: usa Facilitatore Empatico come fallback sicuro (senza risposta diretta)
    const empathetic = SPECIALISTS.find(s => s.id === 'empathetic-facilitator')!;
    
    const selectedSpecialists: SpecialistScore[] = [{
      specialist: empathetic,
      score: 0.8,
      reasoning: 'Fallback routing - empathetic default',
      features: ['Fallback']
    }];

    const allScores: SpecialistScore[] = SPECIALISTS.map(specialist => ({
      specialist,
      score: specialist.id === 'empathetic-facilitator' ? 0.8 : 0,
      reasoning: specialist.id === 'empathetic-facilitator' ? 'Fallback default' : 'Not selected',
      features: specialist.id === 'empathetic-facilitator' ? ['Fallback'] : []
    }));

    return {
      useGeneric: false,
      selectedSpecialists,
      allScores,
      tokenCount,
      complexity: 'medium',
      reasoning: 'Fallback routing - using empathetic facilitator as safe default',
      activationThreshold: 0.15
    };
  }
}
