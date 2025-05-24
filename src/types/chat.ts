import { SpecialistProfile } from './specialists';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
  specialist?: SpecialistProfile; // Info sullo specialista usato
  phase?: 'analytical' | 'generating'; // Fase della risposta
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
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
