import { TokenAnalysis } from '@/types/specialists';

export class TokenAnalyzer {
  private static readonly SIMPLE_PATTERNS = [
    /^(ciao|salve|buongiorno|buonasera|hello|hi)/i,
    /^(come stai|come va|tutto bene)/i,
    /^(grazie|prego|scusa|perfetto|ok)/i,
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
    /\b(brainstorm|ispirazione|concept|vision)\b/i
  ];

  private static readonly EMOTIONAL_PATTERNS = [
    /\b(sento|provo|emozione|tristezza|gioia|rabbia|paura|ansia)\b/i,
    /\b(aiutami|supporto|consiglio|problema personale)\b/i,
    /\b(preoccupato|felice|triste|arrabbiato|confuso|stressato)\b/i,
    /\b(relazione|famiglia|amici|lavoro di squadra)\b/i
  ];

  private static readonly ANALYTICAL_PATTERNS = [
    /\b(analizza|analisi|esamina|valuta|confronta|verifica)\b/i,
    /\b(dati|statistiche|metriche|performance|risultati)\b/i,
    /\b(pro e contro|vantaggi|svantaggi|alternative)\b/i,
    /\b(strategia|pianificazione|metodologia|processo)\b/i
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
    writing: ['scrivi', 'testo', 'articolo', 'content', 'blog', 'copy']
  };

  static analyze(input: string): TokenAnalysis {
    const words = input.trim().split(/\s+/);
    const wordCount = words.length;
    const tokenCount = Math.ceil(wordCount * 1.3);
    const lowerInput = input.toLowerCase();

    // Verifica pattern semplici
    const isSimple = this.SIMPLE_PATTERNS.some(pattern => pattern.test(input));
    
    // Verifica presenza di domande
    const hasQuestions = /\?/.test(input) || /\b(come|cosa|quando|dove|perché|chi)\b/i.test(input);
    
    // Calcola pesi specifici per ogni dimensione
    const technicalWeight = this.calculateTechnicalWeight(lowerInput);
    const creativeWeight = this.calculateCreativeWeight(input);
    const analyticalWeight = this.calculateAnalyticalWeight(input);
    const emotionalWeight = this.calculateEmotionalWeight(input);
    const urgencyLevel = this.calculateUrgencyLevel(input);
    
    // Identifica domini
    const domainHints = this.identifyDomains(lowerInput);
    
    // Valori booleani per compatibilità
    const hasTechnicalTerms = technicalWeight > 0.3;
    const hasEmotionalContent = emotionalWeight > 0.3;
    const requiresCreativity = creativeWeight > 0.3;

    // Determina complessità basata sui nuovi pesi
    let complexity: 'low' | 'medium' | 'high' = 'low';
    
    if (isSimple && tokenCount <= 10) {
      complexity = 'low';
    } else {
      const avgWeight = (technicalWeight + creativeWeight + analyticalWeight + emotionalWeight) / 4;
      
      if (tokenCount > 50 || avgWeight > 0.6 || urgencyLevel > 0.7) {
        complexity = 'high';
      } else if (tokenCount > 20 || avgWeight > 0.3 || hasQuestions) {
        complexity = 'medium';
      }
    }

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
      domainHints
    };
  }

  private static calculateTechnicalWeight(input: string): number {
    let weight = 0;
    let matches = 0;

    // Termini tecnici diretti
    this.TECHNICAL_TERMS.forEach(term => {
      if (input.includes(term.toLowerCase())) {
        weight += 0.2;
        matches++;
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

    // Pattern creativi
    if (this.CREATIVE_PATTERNS.some(pattern => pattern.test(input))) weight += 0.3;
    
    // Richieste di contenuto originale
    if (/\b(originale|unico|nuovo|fresco|innovativo)\b/i.test(input)) weight += 0.2;
    if (/\b(idea|concept|vision|inspirazione)\b/i.test(input)) weight += 0.15;
    
    // Richieste narrative
    if (/\b(storia|racconto|personaggio|plot)\b/i.test(input)) weight += 0.25;

    return Math.min(weight, 1.0);
  }

  private static calculateAnalyticalWeight(input: string): number {
    let weight = 0;

    // Pattern analitici
    if (this.ANALYTICAL_PATTERNS.some(pattern => pattern.test(input))) weight += 0.3;
    
    // Richieste di comparazione
    if (/\b(confronta|paragona|differenza|similarity)\b/i.test(input)) weight += 0.25;
    if (/\b(migliore|peggiore|ottimale|efficiente)\b/i.test(input)) weight += 0.2;
    
    // Richieste di verifica
    if (/\b(verifica|controlla|valida|accurate)\b/i.test(input)) weight += 0.2;

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
