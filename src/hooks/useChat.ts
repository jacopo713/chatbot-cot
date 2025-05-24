import { useState, useCallback, useRef } from 'react';
import { Message, ChatSession } from '@/types/chat';

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    abortControllerRef.current = new AbortController();

    try {
      // Prepariamo i messaggi per l'API
      const apiMessages = [
        ...(session?.messages || []),
        userMessage
      ].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Messaggio di risposta dell'assistente
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: true,
      };

      addMessageToSession(sessionId, assistantMessage);

      // Stream della risposta
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) throw new Error('Failed to fetch response');

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
                
                updateMessageInSession(sessionId, assistantMessage.id, {
                  content: accumulatedContent
                });
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }

      updateMessageInSession(sessionId, assistantMessage.id, {
        isStreaming: false
      });

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sending message:', error);
        
        // Aggiungi messaggio di errore
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: 'Mi dispiace, si è verificato un errore. Riprova più tardi.',
          role: 'assistant',
          timestamp: new Date(),
        };
        addMessageToSession(sessionId, errorMessage);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [
    currentSessionId,
    sessions,
    createNewSession,
    updateSessionTitle,
    addMessageToSession,
    updateMessageInSession
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

  return {
    sessions,
    currentSession,
    isLoading,
    sendMessage,
    stopGeneration,
    createNewSession,
    selectSession,
    deleteSession,
  };
}
