import { useState, useCallback, useRef } from 'react';
import { Message, ChatSession, MultiChainMessage, ChainOfThoughtEntry } from '@/types/chat';
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
      specialistUsage: {},
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

  const addMessageToSession = useCallback((sessionId: string, message: Message | MultiChainMessage) => {
    setSessions(prev => prev.map(session =>
      session.id === sessionId
        ? {
            ...session,
            messages: [...session.messages, message],
            updatedAt: new Date(),
            // Traccia uso specialisti per MultiChainMessage
            specialistUsage: 'chainOfThoughts' in message 
              ? message.chainOfThoughts.reduce((usage, chain) => ({
                  ...usage,
                  [chain.specialist.id]: (usage[chain.specialist.id] || 0) + 1
                }), session.specialistUsage || {})
              : 'specialist' in message && message.specialist ? {
                  ...session.specialistUsage,
                  [message.specialist.id]: (session.specialistUsage?.[message.specialist.id] || 0) + 1
                } : session.specialistUsage
          }
        : session
    ));
  }, []);

  const updateMultiChainMessage = useCallback((
    sessionId: string, 
    messageId: string, 
    chainId: string, 
    updates: Partial<ChainOfThoughtEntry>
  ) => {
    setSessions(prev => prev.map(session =>
      session.id === sessionId
        ? {
            ...session,
            messages: session.messages.map(msg =>
              msg.id === messageId && 'chainOfThoughts' in msg
                ? {
                    ...msg,
                    chainOfThoughts: msg.chainOfThoughts.map(chain =>
                      chain.id === chainId ? { ...chain, ...updates } : chain
                    )
                  }
                : msg
            )
          }
        : session
    ));
  }, []);

  const updateActiveChain = useCallback((messageId: string, chainId: string) => {
    if (!currentSessionId) return;

    setSessions(prev => prev.map(session =>
      session.id === currentSessionId
        ? {
            ...session,
            messages: session.messages.map(msg =>
              msg.id === messageId && 'chainOfThoughts' in msg
                ? { ...msg, activeChainId: chainId }
                : msg
            )
          }
        : session
    ));
  }, [currentSessionId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

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

    const session = sessions.find(s => s.id === sessionId);
    if (!session || session.messages.length === 0) {
      updateSessionTitle(sessionId, content);
    }

    setIsLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      console.log('🤖 Starting AI-powered routing for:', content.substring(0, 50) + '...');

      // FASE 1: AI-Powered Routing (con possibile risposta diretta)
      const routingResponse = await fetch('/api/router', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: content }),
        signal: abortControllerRef.current?.signal,
      });

      if (!routingResponse.ok) {
        throw new Error(`AI routing failed: ${routingResponse.status}`);
      }
      
      const routingData = await routingResponse.json();
      const decision: RouterDecision = routingData.decision;
      setRoutingInfo(decision);

      console.log('📊 AI routing decision:', decision);

      // ✅ NUOVO: Se ha risposta diretta, usala subito
      if (decision.useGeneric && decision.directResponse) {
        console.log('⚡ Using direct response from AI router');
        
        const directMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: decision.directResponse,
          role: 'assistant',
          timestamp: new Date(),
          messageType: 'response'
        };

        addMessageToSession(sessionId, directMessage);
        setIsLoading(false);
        setRoutingInfo(null);
        return;
      }

      // Se usa API generica senza risposta diretta, mostra messaggio di fallback
      if (decision.useGeneric) {
        const simpleMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: `Input troppo semplice per attivare gli specialisti. 
          
Per vedere multiple chain of thought, prova domande più complesse che attivano più specialisti come:
- "Analizza l'architettura di React e crea contenuti creativi per spiegarla"
- "Verifica questa informazione tecnica e fornisci supporto per implementarla"
- "Brainstorm idee innovative per questo problema tecnico complesso"`,
          role: 'assistant',
          timestamp: new Date(),
          messageType: 'response'
        };

        addMessageToSession(sessionId, simpleMessage);
        setIsLoading(false);
        setRoutingInfo(null);
        return;
      }

      // FASE 2: Multiple Chain of Thought (resto del codice invariato)
      console.log(`🚀 Creating multi-chain message for ${decision.selectedSpecialists.length} specialists`);

      const multiChainMessage: MultiChainMessage = {
        id: (Date.now() + 1).toString(),
        userMessageId: userMessage.id,
        role: 'multi-assistant',
        timestamp: new Date(),
        chainOfThoughts: decision.selectedSpecialists.map((specScore, index) => ({
          id: `chain-${specScore.specialist.id}-${Date.now()}-${index}`,
          specialist: specScore.specialist,
          content: '',
          isStreaming: true,
          isComplete: false,
          weight: specScore.score,
          startTime: new Date(),
        })),
        activeChainId: '',
        messageType: 'multi-thinking'
      };

      if (multiChainMessage.chainOfThoughts.length > 0) {
        multiChainMessage.activeChainId = multiChainMessage.chainOfThoughts[0].id;
      }

      addMessageToSession(sessionId, multiChainMessage);

      console.log(`🚀 Starting ${decision.selectedSpecialists.length} parallel chain of thoughts`);

      // Prepara i messaggi per l'API
      const apiMessages = [
        ...(session?.messages || []),
        userMessage
      ].filter(msg => 'role' in msg && msg.role !== 'multi-assistant')
       .map(msg => ({
         role: (msg as Message).role,
         content: (msg as Message).content
       }));

      console.log('📨 API messages prepared:', { count: apiMessages.length });

      // Esegui le chain of thought in parallelo (resto identico)
      const chainPromises = decision.selectedSpecialists.map(async (specScore, index) => {
        const chainId = multiChainMessage.chainOfThoughts[index].id;
        
        try {
          console.log(`🤖 Starting chain ${index + 1}/${decision.selectedSpecialists.length}: ${specScore.specialist.name}`);
          
          await new Promise(resolve => setTimeout(resolve, index * 500));

          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              messages: apiMessages,
              specialist: specScore.specialist,
              mode: 'thinking'
            }),
            signal: abortControllerRef.current?.signal,
          });

          if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`Chain ${specScore.specialist.name} failed: ${response.status} - ${errorText}`);
          }

          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response stream available');

          let accumulatedContent = '';
          let hasReceivedData = false;

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
                    hasReceivedData = true;
                    accumulatedContent += deltaContent;
                    
                    updateMultiChainMessage(sessionId, multiChainMessage.id, chainId, {
                      content: accumulatedContent
                    });
                  }
                } catch (e) {
                  console.warn('⚠️ Skipping malformed streaming data for', specScore.specialist.name, ':', e);
                }
              }
            }
          }

          if (!hasReceivedData) {
            throw new Error('No content received from API');
          }

          updateMultiChainMessage(sessionId, multiChainMessage.id, chainId, {
            isStreaming: false,
            isComplete: true,
            endTime: new Date()
          });

          console.log(`✅ Chain of thought completed for ${specScore.specialist.name}`);

        } catch (error: any) {
          console.error(`❌ Error in chain ${specScore.specialist.name}:`, error);
          
          if (error.name !== 'AbortError') {
            updateMultiChainMessage(sessionId, multiChainMessage.id, chainId, {
              isStreaming: false,
              isComplete: false,
              error: error.message || 'Errore sconosciuto',
              endTime: new Date()
            });
          }
        }
      });

      Promise.all(chainPromises).then(() => {
        console.log('🎉 All chain of thoughts completed');
      }).catch((error) => {
        console.error('❌ Some chains failed:', error);
      });

    } catch (error: any) {
      console.error('❌ Error in AI-powered process:', error);
      
      if (error.name !== 'AbortError') {
        let errorMessage = 'Mi dispiace, si è verificato un errore durante il processo AI. ';
        
        if (error.message?.includes('timeout')) {
          errorMessage += 'Il processo ha impiegato troppo tempo. Riprova con una domanda più semplice.';
        } else if (error.message?.includes('Network')) {
          errorMessage += 'Problema di connessione. Verifica la tua connessione internet.';
        } else {
          errorMessage += 'Riprova più tardi.';
        }
        
        setError(errorMessage);
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
    updateMultiChainMessage
  ]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    setError(null);
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
    updateActiveChain,
  };
}
