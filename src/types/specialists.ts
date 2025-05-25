export interface MBTIProfile {
  E: number; // Extraversion vs Introversion
  I: number;
  N: number; // Intuition vs Sensing  
  S: number;
  T: number; // Thinking vs Feeling
  F: number;
  J: number; // Judging vs Perceiving
  P: number;
}

export interface BigFiveProfile {
  O: number; // Openness (0-1)
  C: number; // Conscientiousness (0-1)
  E: number; // Extraversion (0-1)
  A: number; // Agreeableness (0-1)
  N: number; // Neuroticism (0-1)
}

export interface SpecialistProfile {
  id: string;
  name: string;
  mbti: string;
  mbtiProfile: MBTIProfile;
  bigFive: BigFiveProfile;
  notes: string;
  systemPrompt: string;
  chainOfThoughtPrompt: string;
}

// Nuovo: Punteggio per ogni specialista
export interface SpecialistScore {
  specialist: SpecialistProfile;
  score: number; // 0-1, quanto è adatto per questo input
  reasoning: string; // Perché ha questo punteggio
  features: string[]; // Quali feature dell'input hanno influenzato il punteggio
}

// Modificato: Router decision ora supporta multi-specialisti
export interface RouterDecision {
  useGeneric: boolean;
  selectedSpecialists: SpecialistScore[]; // Array invece di uno solo
  allScores: SpecialistScore[]; // Tutti i punteggi per debug
  tokenCount: number;
  complexity: 'low' | 'medium' | 'high';
  reasoning: string;
  activationThreshold: number; // Soglia usata
}

export interface TokenAnalysis {
  count: number;
  words: number;
  complexity: 'low' | 'medium' | 'high';
  hasQuestions: boolean;
  hasTechnicalTerms: boolean;
  hasEmotionalContent: boolean;
  requiresCreativity: boolean;
  // Nuove feature per scoring più preciso
  technicalWeight: number; // 0-1, quanto è tecnico
  creativeWeight: number; // 0-1, quanto richiede creatività
  analyticalWeight: number; // 0-1, quanto richiede analisi
  emotionalWeight: number; // 0-1, quanto ha contenuto emotivo
  urgencyLevel: number; // 0-1, livello di urgenza percepito
  domainHints: string[]; // Domini identificati (es. ["programming", "web-dev"])
}

// Nuovi tipi per chain of thought
export interface ChainOfThoughtStep {
  step: number;
  phase: string;
  reasoning: string;
  considerations: string[];
  decision?: string;
}

export interface ChainOfThoughtResponse {
  specialistId: string;
  specialistName: string;
  userInput: string;
  thinkingProcess: ChainOfThoughtStep[];
  finalApproach: string;
  metacognitionNotes?: string;
}

// Tipi per metacognizione
export interface SpecialistPerformanceMetrics {
  specialistId: string;
  totalUses: number;
  averageThinkingSteps: number;
  commonPatterns: string[];
  strengths: string[];
  improvementAreas: string[];
  lastOptimized: Date;
}

export interface MetacognitionAnalysis {
  overallEfficiency: number;
  specialistMetrics: SpecialistPerformanceMetrics[];
  recommendedOptimizations: string[];
  systemImprovement: string[];
}
