import { TokenAnalyzer } from '@/utils/tokenAnalyzer';
import { SPECIALISTS } from '@/config/specialists';
import { RouterDecision, SpecialistScore, SpecialistProfile, TokenAnalysis } from '@/types/specialists';

export class MultiSpecialistRouter {
  private static readonly GENERIC_THRESHOLD = 12; // Leggermente più basso
  private static readonly ACTIVATION_THRESHOLD = 0.25; // Abbassato da 0.35 a 0.25
  private static readonly MAX_SPECIALISTS = 3;

  static route(userInput: string): RouterDecision {
    console.log('🧠 MultiSpecialistRouter.route called with:', userInput.substring(0, 100) + '...');
    
    const analysis = TokenAnalyzer.analyze(userInput);
    
    // Se l'input è molto semplice, usa API generica
    if (analysis.complexity === 'low' && analysis.count <= this.GENERIC_THRESHOLD) {
      console.log('🔄 Using generic API - input too simple');
      return {
        useGeneric: true,
        selectedSpecialists: [],
        allScores: [],
        tokenCount: analysis.count,
        complexity: analysis.complexity,
        reasoning: `Input semplice (${analysis.count} token) - usando API generica`,
        activationThreshold: this.ACTIVATION_THRESHOLD
      };
    }

    // Calcola punteggi per tutti gli specialisti
    const allScores = this.calculateAllScores(analysis, userInput);
    
    // Seleziona quelli sopra la soglia
    const selectedSpecialists = this.selectSpecialists(allScores);
    
    const decision = {
      useGeneric: selectedSpecialists.length === 0,
      selectedSpecialists,
      allScores,
      tokenCount: analysis.count,
      complexity: analysis.complexity,
      reasoning: this.generateReasoning(selectedSpecialists, analysis),
      activationThreshold: this.ACTIVATION_THRESHOLD
    };

    console.log('📋 Final routing decision:', {
      useGeneric: decision.useGeneric,
      selectedCount: decision.selectedSpecialists.length,
      reasoning: decision.reasoning
    });

    return decision;
  }

  private static calculateAllScores(analysis: TokenAnalysis, userInput: string): SpecialistScore[] {
    return SPECIALISTS.map(specialist => {
      const score = this.calculateSpecialistScore(specialist, analysis, userInput);
      return {
        specialist,
        score: score.score,
        reasoning: score.reasoning,
        features: score.features
      };
    });
  }

  private static calculateSpecialistScore(
    specialist: SpecialistProfile, 
    analysis: TokenAnalysis,
    userInput: string
  ): { score: number; reasoning: string; features: string[] } {
    let score = 0;
    const features: string[] = [];
    const reasons: string[] = [];

    // Scoring per Analitico Tecnico (INTJ)
    if (specialist.id === 'analytic-technical') {
      if (analysis.technicalWeight > 0) {
        const techBonus = analysis.technicalWeight * 0.5; // Aumentato da 0.4 a 0.5
        score += techBonus;
        features.push(`Technical: ${(analysis.technicalWeight * 100).toFixed(0)}%`);
        reasons.push(`forte contenuto tecnico (+${(techBonus * 100).toFixed(0)})`);
      }
      
      if (analysis.analyticalWeight > 0) {
        const analyticalBonus = analysis.analyticalWeight * 0.35; // Aumentato da 0.3 a 0.35
        score += analyticalBonus;
        features.push(`Analytical: ${(analysis.analyticalWeight * 100).toFixed(0)}%`);
        reasons.push(`richiede analisi (+${(analyticalBonus * 100).toFixed(0)})`);
      }

      if (analysis.domainHints.includes('programming') || analysis.domainHints.includes('webdev')) {
        score += 0.25; // Aumentato da 0.2 a 0.25
        features.push('Programming domain');
        reasons.push('dominio programmazione (+25)');
      }

      if (analysis.complexity === 'high') {
        score += 0.15; // Aumentato da 0.1 a 0.15
        features.push('High complexity');
        reasons.push('alta complessità (+15)');
      } else if (analysis.complexity === 'medium') {
        score += 0.1; // Nuovo bonus per medium complexity
        features.push('Medium complexity');
        reasons.push('media complessità (+10)');
      }
    }

    // Scoring per Creativo Ideatore (ENFP)  
    else if (specialist.id === 'creative-ideator') {
      if (analysis.creativeWeight > 0) {
        const creativeBonus = analysis.creativeWeight * 0.5; // Aumentato da 0.4 a 0.5
        score += creativeBonus;
        features.push(`Creative: ${(analysis.creativeWeight * 100).toFixed(0)}%`);
        reasons.push(`contenuto creativo (+${(creativeBonus * 100).toFixed(0)})`);
      }

      if (analysis.domainHints.includes('writing') || analysis.domainHints.includes('design')) {
        score += 0.3; // Aumentato da 0.25 a 0.3
        features.push('Creative domain');
        reasons.push('dominio creativo (+30)');
      }

      if (analysis.hasQuestions && analysis.complexity !== 'low') {
        score += 0.2; // Aumentato da 0.15 a 0.2
        features.push('Open questions');
        reasons.push('domande esplorative (+20)');
      }

      if (/\b(idea|brainstorm|concept|vision)\b/i.test(userInput)) {
        score += 0.25; // Aumentato da 0.2 a 0.25
        features.push('Brainstorming keywords');
        reasons.push('richiesta brainstorming (+25)');
      }

      // Nuovo: bonus per richieste di contenuto
      if (/\b(contenut[io]|material[ei]|testo|articol[io])\b/i.test(userInput)) {
        score += 0.2;
        features.push('Content creation');
        reasons.push('creazione contenuti (+20)');
      }
    }

    // Scoring per Verificatore Critico (ISTJ)
    else if (specialist.id === 'critical-verifier') {
      if (analysis.analyticalWeight > 0) {
        const analyticalBonus = analysis.analyticalWeight * 0.4; // Aumentato da 0.35 a 0.4
        score += analyticalBonus;
        features.push(`Analytical: ${(analysis.analyticalWeight * 100).toFixed(0)}%`);
        reasons.push(`richiede verifica (+${(analyticalBonus * 100).toFixed(0)})`);
      }

      if (/\b(verifica|controlla|valida|check|review)\b/i.test(userInput)) {
        score += 0.35; // Aumentato da 0.3 a 0.35
        features.push('Verification request');
        reasons.push('richiesta verifica (+35)');
      }

      if (/\b(accurato|preciso|dettaglio|qualità)\b/i.test(userInput)) {
        score += 0.25; // Aumentato da 0.2 a 0.25
        features.push('Quality focus');
        reasons.push('focus qualità (+25)');
      }

      if (analysis.complexity === 'medium' || analysis.complexity === 'high') {
        score += 0.15; // Aumentato da 0.1 a 0.15
        features.push('Structured content');
        reasons.push('contenuto strutturato (+15)');
      }
    }

    // Scoring per Facilitatore Empatico (ENFJ)
    else if (specialist.id === 'empathetic-facilitator') {
      if (analysis.emotionalWeight > 0) {
        const emotionalBonus = analysis.emotionalWeight * 0.5; // Aumentato da 0.4 a 0.5
        score += emotionalBonus;
        features.push(`Emotional: ${(analysis.emotionalWeight * 100).toFixed(0)}%`);
        reasons.push(`contenuto emotivo (+${(emotionalBonus * 100).toFixed(0)})`);
      }

      if (/\b(aiuto|supporto|consiglio|guida|help)\b/i.test(userInput)) {
        score += 0.3; // Aumentato da 0.25 a 0.3
        features.push('Support request');
        reasons.push('richiesta supporto (+30)');
      }

      if (analysis.domainHints.includes('business')) {
        score += 0.2; // Aumentato da 0.15 a 0.2
        features.push('Business context');
        reasons.push('contesto business (+20)');
      }

      if (/\b(team|collaborazione|comunicazione|relazione|persone|utenti)\b/i.test(userInput)) {
        score += 0.25; // Aumentato da 0.2 a 0.25
        features.push('Human interaction');
        reasons.push('interazione umana (+25)');
      }

      // Nuovo: bonus per spiegazioni/divulgazione
      if (/\b(spiega|spiegare|spiegarla|spiegazione|illustra|presenta)\b/i.test(userInput)) {
        score += 0.2;
        features.push('Explanation request');
        reasons.push('richiesta spiegazione (+20)');
      }
    }

    // Normalizza il punteggio
    score = Math.min(score, 1.0);

    const reasoning = reasons.length > 0 
      ? reasons.join(', ')  
      : 'basso match con le caratteristiche dello specialista';

    console.log(`📊 Final score for ${specialist.name}:`, { score, reasoning, features });

    return { score, reasoning, features };
  }

  private static selectSpecialists(allScores: SpecialistScore[]): SpecialistScore[] {
    const sortedScores = [...allScores].sort((a, b) => b.score - a.score);
    const eligible = sortedScores.filter(score => score.score >= this.ACTIVATION_THRESHOLD);
    
    console.log(`🎯 Specialists above threshold (${this.ACTIVATION_THRESHOLD}):`, 
      eligible.map(s => ({ name: s.specialist.name, score: s.score })));
    
    const selected = eligible.slice(0, this.MAX_SPECIALISTS);
    
    const totalScore = selected.reduce((sum, spec) => sum + spec.score, 0);
    if (totalScore > 0) {
      selected.forEach(spec => {
        const oldScore = spec.score;
        spec.score = spec.score / totalScore;
        console.log(`📈 Normalized ${spec.specialist.name}: ${oldScore.toFixed(3)} -> ${spec.score.toFixed(3)}`);
      });
    }

    return selected;
  }

  private static generateReasoning(selected: SpecialistScore[], analysis: TokenAnalysis): string {
    if (selected.length === 0) {
      return `Nessuno specialista sopra soglia ${this.ACTIVATION_THRESHOLD} - usando fallback generico`;
    }

    const specialistNames = selected.map(s => s.specialist.name).join(', ');
    const topScore = selected[0];
    
    return `Attivati ${selected.length} specialisti: ${specialistNames}. ` +
           `Leader: ${topScore.specialist.name} (${(topScore.score * 100).toFixed(0)}%) - ${topScore.reasoning}`;
  }
}
