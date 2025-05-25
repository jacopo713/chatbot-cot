import { TokenAnalysis } from '@/types/specialists';

export class TokenAnalyzer {
  private static readonly SIMPLE_PATTERNS = [
    /^(ciao|salve|buongiorno|buonasera|hello|hi)$/i,
    /^(come stai|come va|tutto bene)$/i,
    /^(grazie|prego|scusa|perfetto|ok)$/i,
    /^(sì|no|forse|bene|male)$/i
  ];

  private static readonly TECHNICAL_TERMS = [
    'algoritmo', 'database', 'API', 'framework', 'codice', 'programmazione',
    'react', 'typescript', 'javascript', 'python', 'sql', 'html', 'css',
    'server', 'client', 'backend', 'frontend', 'deployment', 'bug', 'debug',
    'architettura', 'performance', 'ottimizzazione', 'sicurezza', 'testing'
  ];

  private static readonly CREATIVE_PATTERNS = [
    /\b(creare|scrivere|inventare|ideare|progettare|immaginare)\b/i,
    /\b(storia|racconto|poesia|articolo|blog|contenuto)\b/i,
    /\b(creativo|originale|innovativo|artistico|design)\b/i,
    /\b(brainstorm|ispirazione|concept|vision)\b/i,
    /\b(idee|idea)\b/i,
    /\b(innovative|innovazione|nuovo|nuovi|nuove)\b/i,
    /\b(suggest|suggerisci|proponi|consigli)\b/i,
    /\b(soluzioni|alternative|opzioni|possibilità)\b/i,
    /\b(dammi|fornisci|elenca|lista)\s+\d*\s*(idee|soluzioni|modi|metodi)\b/i,
    // ✅ AGGIUNTO: Pattern per "creative"
    /\b(creative|creatività)\b/i
  ];

  private static readonly EMOTIONAL_PATTERNS = [
    /\b(sento|provo|emozione|tristezza|gioia|rabbia|paura|ansia)\b/i,
    /\b(aiutami|supporto|consiglio|problema personale)\b/i,
    /\b(preoccupato|felice|triste|arrabbiato|confuso|stressato)\b/i,
    /\b(relazione|famiglia|amici|lavoro di squadra)\b/i
  ];

  // ✅ MIGLIORATO: Pattern analitici più estesi
  private static readonly ANALYTICAL_PATTERNS = [
    /\b(analizza|analisi|esamina|valuta|confronta|verifica)\b/i,
    /\b(dati|statistiche|metriche|performance|risultati)\b/i,
    /\b(pro e contro|vantaggi|svantaggi|alternative)\b/i,
    /\b(strategia|pianificazione|metodologia|processo)\b/i,
    // ✅ AGGIUNTI: Pattern per riconoscere meglio "analitico/analitiche"
    /\b(analitico|analitiche|analitici|analitica)\b/i,
    /\b(sistemati[ck]o|metodico|strutturato|logico)\b/i,
    /\b(approfondito|dettagliato|preciso|rigoroso)\b/i,
    /\b(ragionamento|logica|deduzione|studio)\b/i
  ];

  private static readonly URGENCY_PATTERNS = [
    /\b(urgente|subito|immediatamente|rapidamente|presto)\b/i,
    /\b(emergency|critico|importante|priorità|deadline)\b/i,
    /\b(help|aiuto|problema|errore|non funziona)\b/i
  ];

  private static readonly DOMAIN_KEYWORDS = {
    programming: ['codice', 'programmazione', 'sviluppo', 'software', 'app'],
    webdev: ['sito', 'web', 'html', 'css', 'frontend', 'backend'],
    data: ['dati', 'database', 'sql', 'analytics', 'report'],
    business: ['business', 'vendite', 'marketing', 'strategia', 'clienti'],
    design: ['design', 'ui', 'ux', 'grafica', 'visual', 'layout'],
    writing: ['scrivi', 'testo', 'articolo', 'content', 'blog', 'copy'],
    creative: ['idee', 'creative', 'innovative', 'brainstorm', 'concept'],
    analytical: ['analitico', 'analitiche', 'analisi', 'metodico', 'rigoroso']
  };

  static analyze(input: string): TokenAnalysis {
    const words = input.trim().split(/\s+/);
    const wordCount = words.length;
    const tokenCount = Math.ceil(wordCount * 1.3);
    const lowerInput = input.toLowerCase();

    console.log('🔍 TokenAnalyzer input:', { input, wordCount, tokenCount });

    // Verifica pattern semplici più ristretta
    const isSimple = this.SIMPLE_PATTERNS.some(pattern => pattern.test(input.trim()));
    
    // Verifica presenza di domande
    const hasQuestions = /\?/.test(input) || /\b(come|cosa|quando|dove|perché|chi)\b/i.test(input);
    
    // Calcola pesi specifici per ogni dimensione
    const technicalWeight = this.calculateTechnicalWeight(lowerInput);
    const creativeWeight = this.calculateCreativeWeight(input);
    const analyticalWeight = this.calculateAnalyticalWeight(input);
    const emotionalWeight = this.calculateEmotionalWeight(input);
    const urgencyLevel = this.calculateUrgencyLevel(input);
    
    // ✅ NUOVO: Rileva multi-competenza
    const multiCompetenceBonus = this.detectMultiCompetence(input);
    
    // Identifica domini
    const domainHints = this.identifyDomains(lowerInput);
    
    // Valori booleani per compatibilità
    const hasTechnicalTerms = technicalWeight > 0.3;
    const hasEmotionalContent = emotionalWeight > 0.3;
    const requiresCreativity = creativeWeight > 0.3;

    console.log('📊 Weights calculated:', {
      technical: technicalWeight,
      creative: creativeWeight,
      analytical: analyticalWeight,
      emotional: emotionalWeight,
      multiCompetence: multiCompetenceBonus,
      domains: domainHints
    });

    // Determina complessità con focus su contenuto multi-competenza
    let complexity: 'low' | 'medium' | 'high' = 'low';
    
    if (isSimple && tokenCount <= 5) {
      complexity = 'low';
    } else {
      const avgWeight = (technicalWeight + creativeWeight + analyticalWeight + emotionalWeight) / 4;
      
      // ✅ Multi-competenza aumenta automaticamente la complessità
      if (multiCompetenceBonus > 0.3) {
        complexity = 'high';
      } else if (creativeWeight > 0.4 || requiresCreativity) {
        complexity = tokenCount > 15 ? 'high' : 'medium';
      } else if (tokenCount > 50 || avgWeight > 0.6 || urgencyLevel > 0.7) {
        complexity = 'high';
      } else if (tokenCount > 15 || avgWeight > 0.3 || hasQuestions) {
        complexity = 'medium';
      }
    }

    console.log('🎯 Final complexity:', complexity, 'multiCompetence:', multiCompetenceBonus);

    return {
      count: tokenCount,
      words: wordCount,
      complexity,
      hasQuestions,
      hasTechnicalTerms,
      hasEmotionalContent,
      requiresCreativity,
      technicalWeight,
      creativeWeight,
      analyticalWeight,
      emotionalWeight,
      urgencyLevel,
      domainHints,
      // ✅ AGGIUNTO: Nuovo campo per multi-competenza
      multiCompetenceBonus
    } as TokenAnalysis & { multiCompetenceBonus: number };
  }

  // ✅ NUOVO: Rileva richieste multi-competenza
  private static detectMultiCompetence(input: string): number {
    let competenceTypes = 0;
    let bonus = 0;

    // Conta quanti tipi di competenze sono richieste
    if (this.CREATIVE_PATTERNS.some(p => p.test(input))) competenceTypes++;
    if (this.ANALYTICAL_PATTERNS.some(p => p.test(input))) competenceTypes++;
    if (this.TECHNICAL_TERMS.some(term => input.toLowerCase().includes(term))) competenceTypes++;
    if (this.EMOTIONAL_PATTERNS.some(p => p.test(input))) competenceTypes++;

    // Pattern specifici per combinazioni
    const combinationPatterns = [
      /\b(creative|creativi[tà]?)\s+e\s+(analitico|analitici?|analitiche?)\b/i,
      /\b(analitico|analitici?|analitiche?)\s+e\s+(creative|creativi[tà]?)\b/i,
      /\b(tecnico|tecniche?)\s+e\s+(creativ[oaie])\b/i,
      /\b(innovativ[oaie])\s+e\s+(analitico|metodico|strutturato)\b/i
    ];

    if (combinationPatterns.some(p => p.test(input))) {
      bonus += 0.4; // Bonus per combinazioni esplicite
      console.log('🔄 Multi-competence combination detected!');
    }

    if (competenceTypes >= 2) {
      bonus += competenceTypes * 0.15; // Bonus per ogni tipo aggiuntivo
      console.log(`🎯 Multiple competence types detected: ${competenceTypes}`);
    }

    return Math.min(bonus, 1.0);
  }

  private static calculateTechnicalWeight(input: string): number {
    let weight = 0;

    // Termini tecnici diretti
    this.TECHNICAL_TERMS.forEach(term => {
      if (input.includes(term.toLowerCase())) {
        weight += 0.2;
      }
    });

    // Pattern tecnici complessi
    if (/\b(implementa|develop|deploy|setup|config)\b/i.test(input)) weight += 0.15;
    if (/\b(error|exception|stack trace|log)\b/i.test(input)) weight += 0.25;
    if (/\b(optimization|performance|scalability)\b/i.test(input)) weight += 0.2;

    return Math.min(weight, 1.0);
  }

  private static calculateCreativeWeight(input: string): number {
    let weight = 0;
    let matchedPatterns: string[] = [];

    // Pattern creativi
    this.CREATIVE_PATTERNS.forEach(pattern => {
      if (pattern.test(input)) {
        weight += 0.35;
        matchedPatterns.push(pattern.toString());
      }
    });
    
    // Bonus per richieste dirette di idee
    if (/\b(dammi|fornisci|elenca|lista)\s+\d*\s*(idee|soluzioni|modi|metodi|consigli)\b/i.test(input)) {
      weight += 0.4;
      matchedPatterns.push('direct-ideas-request');
    }
    
    // Richieste di contenuto originale
    if (/\b(originale|unico|nuovo|fresco|innovativo)\b/i.test(input)) {
      weight += 0.25;
      matchedPatterns.push('originality-request');
    }
    
    if (/\b(idea|concept|vision|inspirazione)\b/i.test(input)) {
      weight += 0.2;
      matchedPatterns.push('concept-request');
    }
    
    // Richieste narrative
    if (/\b(storia|racconto|personaggio|plot)\b/i.test(input)) {
      weight += 0.25;
      matchedPatterns.push('narrative-request');
    }

    console.log('🎨 Creative weight calculation:', { weight, matchedPatterns });
    return Math.min(weight, 1.0);
  }

  // ✅ MIGLIORATO: Calcolo analitico più sensibile
  private static calculateAnalyticalWeight(input: string): number {
    let weight = 0;
    let matchedPatterns: string[] = [];

    // Pattern analitici principali
    this.ANALYTICAL_PATTERNS.forEach(pattern => {
      if (pattern.test(input)) {
        weight += 0.3; // Peso uguale ai pattern creativi
        matchedPatterns.push(pattern.toString());
      }
    });
    
    // Richieste di comparazione
    if (/\b(confronta|paragona|differenza|similarity)\b/i.test(input)) {
      weight += 0.25;
      matchedPatterns.push('comparison-request');
    }
    
    if (/\b(migliore|peggiore|ottimale|efficiente)\b/i.test(input)) {
      weight += 0.2;
      matchedPatterns.push('optimization-request');
    }
    
    // Richieste di verifica
    if (/\b(verifica|controlla|valida|accurate)\b/i.test(input)) {
      weight += 0.2;
      matchedPatterns.push('verification-request');
    }

    console.log('🔍 Analytical weight calculation:', { weight, matchedPatterns });
    return Math.min(weight, 1.0);
  }

  private static calculateEmotionalWeight(input: string): number {
    let weight = 0;

    // Pattern emotivi
    if (this.EMOTIONAL_PATTERNS.some(pattern => pattern.test(input))) weight += 0.3;
    
    // Richieste di supporto
    if (/\b(supporto|aiuto|consiglio|guide me)\b/i.test(input)) weight += 0.2;
    if (/\b(difficile|challenging|problema|issue)\b/i.test(input)) weight += 0.15;
    
    // Contesto umano/sociale
    if (/\b(team|gruppo|collaborazione|communication)\b/i.test(input)) weight += 0.15;

    return Math.min(weight, 1.0);
  }

  private static calculateUrgencyLevel(input: string): number {
    let urgency = 0;

    if (this.URGENCY_PATTERNS.some(pattern => pattern.test(input))) urgency += 0.4;
    
    // Punto esclamativo = urgenza
    const exclamationCount = (input.match(/!/g) || []).length;
    urgency += Math.min(exclamationCount * 0.2, 0.3);
    
    // Parole in CAPS (indicano urgenza/emphasis)
    const capsWords = input.match(/\b[A-Z]{2,}\b/g) || [];
    urgency += Math.min(capsWords.length * 0.1, 0.2);

    return Math.min(urgency, 1.0);
  }

  private static identifyDomains(input: string): string[] {
    const domains: string[] = [];

    Object.entries(this.DOMAIN_KEYWORDS).forEach(([domain, keywords]) => {
      const matches = keywords.filter(keyword => input.includes(keyword.toLowerCase()));
      if (matches.length > 0) {
        domains.push(domain);
      }
    });

    return domains;
  }
}
