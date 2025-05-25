import { SpecialistProfile, ChainOfThoughtResponse } from './specialists';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
  specialist?: SpecialistProfile;
  phase?: 'analytical' | 'generating' | 'thinking';
  chainOfThought?: ChainOfThoughtResponse;
  messageType?: 'response' | 'thinking' | 'metacognition';
}

// Nuovo: Messaggio che contiene multiple chain of thought
export interface MultiChainMessage {
  id: string;
  userMessageId: string; // ID del messaggio utente che ha generato questa risposta
  role: 'multi-assistant';
  timestamp: Date;
  chainOfThoughts: ChainOfThoughtEntry[]; // Array di catene di pensiero
  activeChainId?: string; // Quale catena è attualmente selezionata per la visualizzazione
  messageType: 'multi-thinking';
}

export interface ChainOfThoughtEntry {
  id: string;
  specialist: SpecialistProfile;
  content: string;
  isStreaming: boolean;
  isComplete: boolean;
  weight: number; // Peso/punteggio dello specialista (0-1)
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: (Message | MultiChainMessage)[]; // Supporta entrambi i tipi
  createdAt: Date;
  updatedAt: Date;
  specialistUsage?: { [key: string]: number };
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
