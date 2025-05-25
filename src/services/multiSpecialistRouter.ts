import { TokenAnalyzer } from '@/utils/tokenAnalyzer';
import { SPECIALISTS } from '@/config/specialists';
import { RouterDecision, SpecialistScore, SpecialistProfile } from '@/types/specialists';

export class MultiSpecialistRouter {
  private static readonly GENERIC_THRESHOLD = 8;
  private static readonly ACTIVATION_THRESHOLD = 0.15; // ✅ ABBASSATO ulteriormente per multi-competenza
  private static readonly MAX_SPECIALISTS = 3;

  static route(userInput: string): RouterDecision {
    console.log('🧠 MultiSpecialistRouter.route called with:', userInput.substring(0, 100) + '...');
    
    const analysis = TokenAnalyzer.analyze(userInput) as any;
    
    // Condizioni più specifiche per API generica
    const isReallySimple = (
      analysis.complexity === 'low' && 
      analysis.count <= this.GENERIC_THRESHOLD &&
      analysis.creativeWeight < 0.2 &&
      analysis.technicalWeight < 0.2 &&
      analysis.analyticalWeight < 0.2 &&
      analysis.emotionalWeight < 0.2 &&
      (!analysis.multiCompetenceBonus || analysis.multiCompetenceBonus < 0.1) // ✅ Considera multi-competenza
    );
    
    if (isReallySimple) {
      console.log('🔄 Using generic API - input truly simple');
      return {
        useGeneric: true,
        selectedSpecialists: [],
        allScores: [],
        tokenCount: analysis.count,
        complexity: analysis.complexity,
        reasoning: `Input veramente semplice (${analysis.count} token, tutti i pesi < 0.2) - usando API generica`,
        activationThreshold: this.ACTIVATION_THRESHOLD
      };
    }

    // Calcola punteggi per tutti gli specialisti
    const allScores = this.calculateAllScores(analysis, userInput);
    
    // ✅ NUOVO: Soglia dinamica basata su multi-competenza
    const dynamicThreshold = analysis.multiCompetenceBonus > 0.3 
      ? this.ACTIVATION_THRESHOLD * 0.7 // Soglia più bassa per multi-competenza
      : this.ACTIVATION_THRESHOLD;
    
    console.log(`🎯 Using dynamic threshold: ${dynamicThreshold} (multiCompetence: ${analysis.multiCompetenceBonus})`);
    
    // Seleziona quelli sopra la soglia dinamica
    const selectedSpecialists = this.selectSpecialists(allScores, dynamicThreshold);
    
    const decision = {
      useGeneric: selectedSpecialists.length === 0,
      selectedSpecialists,
      allScores,
      tokenCount: analysis.count,
      complexity: analysis.complexity,
      reasoning: this.generateReasoning(selectedSpecialists, analysis, dynamicThreshold),
      activationThreshold: dynamicThreshold
    };

    console.log('📋 Final routing decision:', {
      useGeneric: decision.useGeneric,
      selectedCount: decision.selectedSpecialists.length,
      reasoning: decision.reasoning
    });

    return decision;
  }

  private static calculateAllScores(analysis: any, userInput: string): SpecialistScore[] {
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
    analysis: any,
    userInput: string
  ): { score: number; reasoning: string; features: string[] } {
    let score = 0;
    const features: string[] = [];
    const reasons: string[] = [];

    // ✅ NUOVO: Bonus base per multi-competenza
    if (analysis.multiCompetenceBonus > 0) {
      score += analysis.multiCompetenceBonus * 0.2; // Bonus base per tutti quando c'è multi-competenza
      features.push(`Multi-competence: ${(analysis.multiCompetenceBonus * 100).toFixed(0)}%`);
      reasons.push(`richiesta multi-competenza (+${(analysis.multiCompetenceBonus * 20).toFixed(0)})`);
    }

    // Scoring per Analitico Tecnico (INTJ)
    if (specialist.id === 'analytic-technical') {
      if (analysis.technicalWeight > 0) {
        const techBonus = analysis.technicalWeight * 0.5;
        score += techBonus;
        features.push(`Technical: ${(analysis.technicalWeight * 100).toFixed(0)}%`);
        reasons.push(`forte contenuto tecnico (+${(techBonus * 100).toFixed(0)})`);
      }
      
      // ✅ MIGLIORATO: Bonus maggiore per contenuto analitico
      if (analysis.analyticalWeight > 0) {
        const analyticalBonus = analysis.analyticalWeight * 0.45; // Aumentato da 0.35 a 0.45
        score += analyticalBonus;
        features.push(`Analytical: ${(analysis.analyticalWeight * 100).toFixed(0)}%`);
        reasons.push(`richiede analisi (+${(analyticalBonus * 100).toFixed(0)})`);
      }

      // ✅ NUOVO: Bonus specifico per parole "analitico/analitiche"
      if (/\b(analitico|analitiche|analitici|analitica)\b/i.test(userInput)) {
        score += 0.35; // Bonus significativo
        features.push('Direct analytical request');
        reasons.push('richiesta esplicitamente analitica (+35)');
      }

      if (analysis.domainHints.includes('programming') || analysis.domainHints.includes('webdev') || analysis.domainHints.includes('analytical')) {
        score += 0.25;
        features.push('Programming/Analytical domain');
        reasons.push('dominio programmazione/analitico (+25)');
      }

      if (analysis.complexity === 'high') {
        score += 0.15;
        features.push('High complexity');
        reasons.push('alta complessità (+15)');
      } else if (analysis.complexity === 'medium') {
        score += 0.1;
        features.push('Medium complexity');
        reasons.push('media complessità (+10)');
      }
    }

    // Scoring per Creativo Ideatore (ENFP)  
    else if (specialist.id === 'creative-ideator') {
      if (analysis.creativeWeight > 0) {
        const creativeBonus = analysis.creativeWeight * 0.6;
        score += creativeBonus;
        features.push(`Creative: ${(analysis.creativeWeight * 100).toFixed(0)}%`);
        reasons.push(`contenuto creativo (+${(creativeBonus * 100).toFixed(0)})`);
      }

      if (analysis.domainHints.includes('writing') || analysis.domainHints.includes('design') || analysis.domainHints.includes('creative')) {
        score += 0.35;
        features.push('Creative domain');
        reasons.push('dominio creativo (+35)');
      }

      if (analysis.hasQuestions && analysis.complexity !== 'low') {
        score += 0.2;
        features.push('Open questions');
        reasons.push('domande esplorative (+20)');
      }

      if (/\b(idea|idee|brainstorm|concept|vision)\b/i.test(userInput)) {
        score += 0.3;
        features.push('Brainstorming keywords');
        reasons.push('richiesta brainstorming (+30)');
      }

      // Bonus per richieste numeriche di idee
      if (/\b(dammi|fornisci|elenca|lista)\s+\d+\s*(idee|soluzioni|modi|metodi|consigli)\b/i.test(userInput)) {
        score += 0.4;
        features.push('Numbered ideas request');
        reasons.push('richiesta numerica di idee (+40)');
      }

      // ✅ NUOVO: Bonus specifico per "creative"
      if (/\b(creative|creativi|creatività)\b/i.test(userInput)) {
        score += 0.3; // Nuovo bonus
        features.push('Direct creative request');
        reasons.push('richiesta esplicitamente creativa (+30)');
      }

      if (/\b(innovative|innovativ[aeo]|originale|nuovo|nuovi|nuove)\b/i.test(userInput)) {
        score += 0.25;
        features.push('Innovation request');
        reasons.push('richiesta innovazione (+25)');
      }

      if (/\b(contenut[io]|material[ei]|testo|articol[io])\b/i.test(userInput)) {
        score += 0.2;
        features.push('Content creation');
        reasons.push('creazione contenuti (+20)');
      }
    }

    // Scoring per Verificatore Critico (ISTJ)
    else if (specialist.id === 'critical-verifier') {
      if (analysis.analyticalWeight > 0) {
        const analyticalBonus = analysis.analyticalWeight * 0.4;
        score += analyticalBonus;
        features.push(`Analytical: ${(analysis.analyticalWeight * 100).toFixed(0)}%`);
        reasons.push(`richiede verifica (+${(analyticalBonus * 100).toFixed(0)})`);
      }

      if (/\b(verifica|controlla|valida|check|review)\b/i.test(userInput)) {
        score += 0.35;
        features.push('Verification request');
        reasons.push('richiesta verifica (+35)');
      }

      if (/\b(accurato|preciso|dettaglio|qualità)\b/i.test(userInput)) {
        score += 0.25;
        features.push('Quality focus');
        reasons.push('focus qualità (+25)');
      }

      if (analysis.complexity === 'medium' || analysis.complexity === 'high') {
        score += 0.15;
        features.push('Structured content');
        reasons.push('contenuto strutturato (+15)');
      }
    }

    // Scoring per Facilitatore Empatico (ENFJ)
    else if (specialist.id === 'empathetic-facilitator') {
      if (analysis.emotionalWeight > 0) {
        const emotionalBonus = analysis.emotionalWeight * 0.5;
        score += emotionalBonus;
        features.push(`Emotional: ${(analysis.emotionalWeight * 100).toFixed(0)}%`);
        reasons.push(`contenuto emotivo (+${(emotionalBonus * 100).toFixed(0)})`);
      }

      if (/\b(aiuto|supporto|consiglio|guida|help)\b/i.test(userInput)) {
        score += 0.3;
        features.push('Support request');
        reasons.push('richiesta supporto (+30)');
      }

      if (analysis.domainHints.includes('business')) {
        score += 0.2;
        features.push('Business context');
        reasons.push('contesto business (+20)');
      }

      if (/\b(team|collaborazione|comunicazione|relazione|persone|utenti)\b/i.test(userInput)) {
        score += 0.25;
        features.push('Human interaction');
        reasons.push('interazione umana (+25)');
      }

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

    console.log(`📊 ${specialist.name} score: ${score.toFixed(3)} - ${reasoning}`);

    return { score, reasoning, features };
  }

  // ✅ MODIFICATO: Accetta soglia dinamica
  private static selectSpecialists(allScores: SpecialistScore[], threshold: number): SpecialistScore[] {
    const sortedScores = [...allScores].sort((a, b) => b.score - a.score);
    const eligible = sortedScores.filter(score => score.score >= threshold);
    
    console.log(`🎯 Specialists above threshold (${threshold}):`, 
      eligible.map(s => ({ name: s.specialist.name, score: s.score.toFixed(3) })));
    
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

  private static generateReasoning(selected: SpecialistScore[], analysis: any, threshold: number): string {
    if (selected.length === 0) {
      return `Nessuno specialista sopra soglia ${threshold} - usando fallback generico`;
    }

    const specialistNames = selected.map(s => s.specialist.name).join(', ');
    const topScore = selected[0];
    
    let reasoning = `Attivati ${selected.length} specialisti: ${specialistNames}. `;
    reasoning += `Leader: ${topScore.specialist.name} (${(topScore.score * 100).toFixed(0)}%) - ${topScore.reasoning}`;
    
    if (analysis.multiCompetenceBonus > 0.3) {
      reasoning += ` [Multi-competenza rilevata: soglia abbassata a ${threshold}]`;
    }
    
    return reasoning;
  }
}
