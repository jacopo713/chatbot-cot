import { useState, useCallback, useRef } from 'react';
import { Message, ChatSession } from '@/types/chat';

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'creative' | 'analytical' | 'complete'>('complete');
  const [showThinking, setShowThinking] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'Nuova Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  }, []);

  const updateSessionTitle = useCallback((sessionId: string, firstMessage: string) => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, title, updatedAt: new Date() }
        : session
    ));
  }, []);

  const addMessageToSession = useCallback((sessionId: string, message: Message) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId
        ? {
            ...session,
            messages: [...session.messages, message],
            updatedAt: new Date(),
          }
        : session
    ));
  }, []);

  const updateMessageInSession = useCallback((sessionId: string, messageId: string, updates: Partial<Message>) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId
        ? {
            ...session,
            messages: session.messages.map(msg =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            )
          }
        : session
    ));
  }, []);

  const streamResponse = useCallback(async (
    endpoint: string, 
    sessionId: string, 
    messageId: string, 
    messages: any[], 
    additionalData?: any
  ): Promise<string> => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, ...additionalData }),
      signal: abortControllerRef.current?.signal,
    });

    if (!response.ok) throw new Error(`Failed to fetch from ${endpoint}`);

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response stream');

    let accumulatedContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            const deltaContent = parsed.choices?.[0]?.delta?.content || '';
            
            if (deltaContent) {
              accumulatedContent += deltaContent;
              
              updateMessageInSession(sessionId, messageId, {
                content: accumulatedContent
              });
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    return accumulatedContent;
  }, [updateMessageInSession]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = createNewSession();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    addMessageToSession(sessionId, userMessage);

    // Aggiorniamo il titolo se è il primo messaggio
    const session = sessions.find(s => s.id === sessionId);
    if (!session || session.messages.length === 0) {
      updateSessionTitle(sessionId, content);
    }

    setIsLoading(true);
    setCurrentPhase('creative');
    abortControllerRef.current = new AbortController();

    try {
      // Prepariamo i messaggi per l'API (solo user e assistant, no thinking)
      const apiMessages = [
        ...(session?.messages.filter(msg => msg.role !== 'thinking') || []),
        userMessage
      ].map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      // FASE 1: Pensiero creativo
      const thinkingMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'thinking',
        timestamp: new Date(),
        isStreaming: true,
        phase: 'creative',
      };

      addMessageToSession(sessionId, thinkingMessage);

      const creativeThought = await streamResponse(
        '/api/chat/creative',
        sessionId,
        thinkingMessage.id,
        apiMessages
      );

      updateMessageInSession(sessionId, thinkingMessage.id, {
        isStreaming: false,
        phase: 'complete'
      });

      // FASE 2: Risposta analitica basata SOLO sui pensieri creativi
      setCurrentPhase('analytical');

      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: true,
        phase: 'analytical',
      };

      addMessageToSession(sessionId, assistantMessage);

      // Passiamo solo il pensiero creativo e la domanda originale
      await streamResponse(
        '/api/chat/analytical',
        sessionId,
        assistantMessage.id,
        [],
        { 
          creativeThought,
          originalQuestion: content
        }
      );

      updateMessageInSession(sessionId, assistantMessage.id, {
        isStreaming: false,
        phase: 'complete'
      });

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sending message:', error);
      }
    } finally {
      setIsLoading(false);
      setCurrentPhase('complete');
      abortControllerRef.current = null;
    }
  }, [
    currentSessionId, 
    sessions, 
    createNewSession, 
    updateSessionTitle, 
    addMessageToSession, 
    updateMessageInSession, 
    streamResponse
  ]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  const toggleShowThinking = useCallback(() => {
    setShowThinking(prev => !prev);
  }, []);

  return {
    sessions,
    currentSession,
    isLoading,
    currentPhase,
    showThinking,
    sendMessage,
    stopGeneration,
    createNewSession,
    selectSession,
    deleteSession,
    toggleShowThinking,
  };
}
