export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'thinking';
  timestamp: Date;
  isStreaming?: boolean;
  phase?: 'creative' | 'analytical' | 'complete';
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

export interface CoTResponse {
  creativeThought: string;
  analyticalResponse: string;
}
