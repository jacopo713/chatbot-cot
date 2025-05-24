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
}

export interface RouterDecision {
  useGeneric: boolean;
  selectedSpecialist?: SpecialistProfile;
  tokenCount: number;
  complexity: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface TokenAnalysis {
  count: number;
  words: number;
  complexity: 'low' | 'medium' | 'high';
  hasQuestions: boolean;
  hasTechnicalTerms: boolean;
  hasEmotionalContent: boolean;
  requiresCreativity: boolean;
}
