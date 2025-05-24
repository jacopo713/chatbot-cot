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
    'server', 'client', 'backend', 'frontend', 'deployment', 'bug', 'debug'
  ];

  private static readonly CREATIVE_PATTERNS = [
    /\b(creare|scrivere|inventare|ideare|progettare|immaginare)\b/i,
    /\b(storia|racconto|poesia|articolo|blog|contenuto)\b/i,
    /\b(creativo|originale|innovativo|artistico)\b/i
  ];

  private static readonly EMOTIONAL_PATTERNS = [
    /\b(sento|provo|emozione|tristezza|gioia|rabbia|paura|ansia)\b/i,
    /\b(aiutami|supporto|consiglio|problema personale)\b/i,
    /\b(preoccupato|felice|triste|arrabbiato|confuso)\b/i
  ];

  static analyze(input: string): TokenAnalysis {
    const words = input.trim().split(/\s+/);
    const wordCount = words.length;
    
    // Stima approssimativa dei token (circa 1.3 token per parola in italiano)
    const tokenCount = Math.ceil(wordCount * 1.3);

    // Verifica pattern semplici
    const isSimple = this.SIMPLE_PATTERNS.some(pattern => pattern.test(input));
    
    // Verifica presenza di domande
    const hasQuestions = /\?/.test(input) || /\b(come|cosa|quando|dove|perché|chi)\b/i.test(input);
    
    // Verifica termini tecnici
    const hasTechnicalTerms = this.TECHNICAL_TERMS.some(term => 
      input.toLowerCase().includes(term.toLowerCase())
    );
    
    // Verifica contenuto emotivo
    const hasEmotionalContent = this.EMOTIONAL_PATTERNS.some(pattern => 
      pattern.test(input)
    );
    
    // Verifica richieste creative
    const requiresCreativity = this.CREATIVE_PATTERNS.some(pattern => 
      pattern.test(input)
    );

    // Determina complessità
    let complexity: 'low' | 'medium' | 'high' = 'low';
    
    if (isSimple && tokenCount <= 10) {
      complexity = 'low';
    } else if (
      tokenCount > 50 || 
      hasTechnicalTerms || 
      requiresCreativity || 
      (hasQuestions && tokenCount > 20)
    ) {
      complexity = 'high';
    } else if (tokenCount > 20 || hasQuestions || hasEmotionalContent) {
      complexity = 'medium';
    }

    return {
      count: tokenCount,
      words: wordCount,
      complexity,
      hasQuestions,
      hasTechnicalTerms,
      hasEmotionalContent,
      requiresCreativity
    };
  }
}
