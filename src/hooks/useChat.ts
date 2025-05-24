import { useState, useCallback, useRef } from 'react';
import { Message, ChatSession } from '@/types/chat';
import { RouterDecision } from '@/types/specialists';

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [routingInfo, setRoutingInfo] = useState<RouterDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
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

    // Reset error state
    setError(null);

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
      console.log('Starting routing for:', content.substring(0, 50) + '...');

      // FASE 1: Routing con timeout
      const routingResponse = await fetch('/api/router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: content }),
        signal: abortControllerRef.current?.signal,
      });

      if (!routingResponse.ok) {
        throw new Error(`Routing failed: ${routingResponse.status}`);
      }
      
      const routingData = await routingResponse.json();
      const decision: RouterDecision = routingData.decision;
      setRoutingInfo(decision);

      console.log('Routing decision:', decision);

      // Messaggio di risposta dell'assistente
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        role: 'assistant',
        timestamp: new Date(),
        isStreaming: true,
        specialist: decision.selectedSpecialist,
        phase: 'analytical'
      };

      addMessageToSession(sessionId, assistantMessage);

      // Breve pausa per mostrare fase di analisi
      await new Promise(resolve => setTimeout(resolve, 800));

      // Aggiorna a fase generativa
      updateMessageInSession(sessionId, assistantMessage.id, {
        phase: 'generating'
      });

      console.log('Starting generation phase...');

      // FASE 2: Generazione con gestione errori migliorata
      const apiMessages = [
        ...(session?.messages || []),
        userMessage
      ].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: apiMessages,
          specialist: decision.selectedSpecialist
        }),
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream available');

      let accumulatedContent = '';
      let hasContent = false;

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
                hasContent = true;
                accumulatedContent += deltaContent;
                
                updateMessageInSession(sessionId, assistantMessage.id, {
                  content: accumulatedContent
                });
              }
            } catch (e) {
              console.warn('Skipping malformed streaming data');
            }
          }
        }
      }

      // Verifica se abbiamo ricevuto contenuto
      if (!hasContent) {
        throw new Error('No content received from API');
      }

      updateMessageInSession(sessionId, assistantMessage.id, {
        isStreaming: false,
        phase: undefined
      });

      console.log('Message completed successfully');

    } catch (error: any) {
      console.error('Error in sendMessage:', error);
      
      if (error.name !== 'AbortError') {
        // Gestione errori user-friendly
        let errorMessage = 'Mi dispiace, si è verificato un errore. ';
        
        if (error.message?.includes('timeout')) {
          errorMessage += 'La richiesta ha impiegato troppo tempo. Riprova con una domanda più semplice.';
        } else if (error.message?.includes('Network')) {
          errorMessage += 'Problema di connessione. Verifica la tua connessione internet.';
        } else if (error.message?.includes('configuration')) {
          errorMessage += 'Errore di configurazione del servizio.';
        } else {
          errorMessage += 'Riprova più tardi.';
        }
        
        setError(errorMessage);
        
        // Rimuovi il messaggio assistant vuoto e aggiungi errore
        setSessions(prev => prev.map(session =>
          session.id === sessionId
            ? {
                ...session,
                messages: session.messages.filter(msg => 
                  !(msg.role === 'assistant' && msg.content === '' && msg.isStreaming)
                ).concat([{
                  id: (Date.now() + 2).toString(),
                  content: errorMessage,
                  role: 'assistant',
                  timestamp: new Date(),
                }])
              }
            : session
        ));
      }
    } finally {
      setIsLoading(false);
      setRoutingInfo(null);
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
    setError(null); // Reset error when switching sessions
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sessions,
    currentSession,
    isLoading,
    routingInfo,
    error,
    sendMessage,
    stopGeneration,
    createNewSession,
    selectSession,
    deleteSession,
    clearError,
  };
}
