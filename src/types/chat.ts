export interface ThinkingPhase {
type: 'initial' | 'doubt' | 'reconsideration' | 'final';
content: string;
confidence: number; // 0-100
timestamp: Date;
}
export interface Message {
id: string;
content: string;
role: 'user' | 'assistant' | 'thinking';
timestamp: Date;
isStreaming?: boolean;
phase?: 'creative' | 'analytical' | 'complete';
// Nuovo: per messaggi thinking con fasi multiple
thinkingPhases?: ThinkingPhase[];
currentThinkingPhase?: ThinkingPhase['type'];
corrections?: string[]; // Pensieri che sono stati corretti
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
export interface VulnerableThoughtResponse {
phase: ThinkingPhase['type'];
content: string;
confidence: number;
correction?: string;
}
