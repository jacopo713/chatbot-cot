import { SpecialistProfile, ChainOfThoughtResponse } from './specialists';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
  specialist?: SpecialistProfile;
  phase?: 'analytical' | 'generating' | 'thinking';
  chainOfThought?: ChainOfThoughtResponse; // Nuovo: catena di pensiero
  messageType?: 'response' | 'thinking' | 'metacognition'; // Tipo di messaggio
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  specialistUsage?: { [key: string]: number }; // Traccia uso specialisti
}

export interface StreamResponse {
  choices: Array<{
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason?: string;
  }>;
}
