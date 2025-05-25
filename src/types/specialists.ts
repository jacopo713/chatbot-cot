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

export interface SpecialistScore {
  specialist: SpecialistProfile;
  score: number;
  reasoning: string;
  features: string[];
}

export interface RouterDecision {
  useGeneric: boolean;
  selectedSpecialists: SpecialistScore[];
  allScores: SpecialistScore[];
  tokenCount: number;
  complexity: 'low' | 'medium' | 'high';
  reasoning: string;
  activationThreshold: number;
  directResponse?: string; // ✅ NUOVO: Risposta diretta per casi generici
}

export interface TokenAnalysis {
  count: number;
  words: number;
  complexity: 'low' | 'medium' | 'high';
  hasQuestions: boolean;
  hasTechnicalTerms: boolean;
  hasEmotionalContent: boolean;
  requiresCreativity: boolean;
  technicalWeight: number;
  creativeWeight: number;
  analyticalWeight: number;
  emotionalWeight: number;
  urgencyLevel: number;
  domainHints: string[];
  multiCompetenceBonus?: number;
}

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
