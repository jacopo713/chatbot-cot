import { TokenAnalyzer } from '@/utils/tokenAnalyzer';
import { SPECIALISTS } from '@/config/specialists';
import { RouterDecision, SpecialistProfile } from '@/types/specialists';

export class SpecialistRouter {
  private static readonly GENERIC_THRESHOLD = 15; // token limit per API generica

  static route(userInput: string): RouterDecision {
    const analysis = TokenAnalyzer.analyze(userInput);
    
    // Se l'input è molto semplice, usa API generica
    if (analysis.complexity === 'low' && analysis.count <= this.GENERIC_THRESHOLD) {
      return {
        useGeneric: true,
        tokenCount: analysis.count,
        complexity: analysis.complexity,
        reasoning: `Input semplice (${analysis.count} token) - usando API generica`
      };
    }

    // Seleziona lo specialista più appropriato
    const selectedSpecialist = this.selectSpecialist(analysis);
    
    return {
      useGeneric: false,
      selectedSpecialist,
      tokenCount: analysis.count,
      complexity: analysis.complexity,
      reasoning: `Input complesso (${analysis.count} token) - routing a ${selectedSpecialist.name}`
    };
  }

  private static selectSpecialist(analysis: any): SpecialistProfile {
    // Logica di selezione basata sull'analisi dell'input
    
    // Priorità per contenuto tecnico
    if (analysis.hasTechnicalTerms) {
      return SPECIALISTS.find(s => s.id === 'analytic-technical')!;
    }
    
    // Priorità per richieste creative
    if (analysis.requiresCreativity) {
      return SPECIALISTS.find(s => s.id === 'creative-ideator')!;
    }
    
    // Priorità per contenuto emotivo o supporto
    if (analysis.hasEmotionalContent) {
      return SPECIALISTS.find(s => s.id === 'empathetic-facilitator')!;
    }
    
    // Per input complessi che richiedono verifica (domande articolate)
    if (analysis.hasQuestions && analysis.complexity === 'high') {
      return SPECIALISTS.find(s => s.id === 'critical-verifier')!;
    }
    
    // Default: Facilitatore Empatico per interazioni generali
    return SPECIALISTS.find(s => s.id === 'empathetic-facilitator')!;
  }
}
