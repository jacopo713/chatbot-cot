import { useState, useCallback, useRef } from 'react';
import { Message, ChatSession, MultiChainMessage, ChainOfThoughtEntry, FinalSynthesis } from '@/types/chat';
import { RouterDecision } from '@/types/specialists';

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [routingInfo, setRoutingInfo] = useState<RouterDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // ✅ NUOVO: Ref per tracciare chain content in tempo reale
  const chainContentRef = useRef<Map<string, {
    chainId: string;
    specialist: any;
    content: string;
    isComplete: boolean;
    weight: number;
    error?: string;
  }>>(new Map());

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
    // ✅ NUOVO: Aggiorna anche la ref per il tracking in tempo reale
    const currentChain = chainContentRef.current.get(chainId);
    if (currentChain) {
      chainContentRef.current.set(chainId, {
        ...currentChain,
        content: updates.content || currentChain.content,
        isComplete: updates.isComplete || currentChain.isComplete,
        error: updates.error || currentChain.error
      });
    }

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

  const updateMultiChainStatus = useCallback((
    sessionId: string,
    messageId: string,
    updates: {
      synthesisStatus?: 'pending' | 'processing' | 'completed' | 'failed';
      finalSynthesis?: FinalSynthesis;
    }
  ) => {
    setSessions(prev => prev.map(session =>
      session.id === sessionId
        ? {
            ...session,
            messages: session.messages.map(msg =>
              msg.id === messageId && 'chainOfThoughts' in msg
                ? { ...msg, ...updates }
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

  // ✅ MIGLIORATO: Sintesi usando chain content in tempo reale invece dello stato React
  const triggerSynthesis = useCallback(async (
    sessionId: string,
    messageId: string,
    userQuery: string,
    chainIds: string[]
  ) => {
    try {
      console.log('🧠 Starting synthesis with real-time chain content...');
      
      // ✅ NUOVO: Costruisci chainOfThoughts dalla ref invece dello stato React
      const chainOfThoughts: ChainOfThoughtEntry[] = chainIds.map(chainId => {
        const chainData = chainContentRef.current.get(chainId);
        if (!chainData) {
          console.warn(`⚠️ Chain ${chainId} not found in ref`);
          return null;
        }

        return {
          id: chainData.chainId,
          specialist: chainData.specialist,
          content: chainData.content,
          isStreaming: false,
          isComplete: chainData.isComplete,
          weight: chainData.weight,
          startTime: new Date(), // Placeholder, non critico per sintesi
          error: chainData.error
        };
      }).filter(Boolean) as ChainOfThoughtEntry[];

      console.log('🔍 Real-time synthesis chain state:');
      chainOfThoughts.forEach((chain, index) => {
        console.log(`  Chain ${index + 1} (${chain.specialist.name}):`);
        console.log(`    - Content length: ${chain.content?.length || 0}`);
        console.log(`    - Is complete: ${chain.isComplete}`);
        console.log(`    - Has error: ${!!chain.error}`);
        console.log(`    - Weight: ${chain.weight}`);
      });
      
      // Aggiorna status a processing
      updateMultiChainStatus(sessionId, messageId, {
        synthesisStatus: 'processing'
      });

      const response = await fetch('/api/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuery,
          chainOfThoughts
        }),
      });

      if (!response.ok) {
        throw new Error(`Synthesis API error: ${response.status}`);
      }

      const data = await response.json();
      const synthesis = data.synthesis;

      console.log('✅ Synthesis completed successfully');

      // Crea oggetto FinalSynthesis
      const finalSynthesis: FinalSynthesis = {
        id: `synthesis-${Date.now()}`,
        content: synthesis.finalAnswer,
        synthesisReasoning: synthesis.synthesisReasoning,
        specialistsUsed: synthesis.specialistsUsed,
        weightDistribution: synthesis.weightDistribution,
        timestamp: new Date(),
        isVisible: true // Mostra automaticamente la sintesi finale
      };

      // Aggiorna il messaggio con la sintesi completata
      updateMultiChainStatus(sessionId, messageId, {
        synthesisStatus: 'completed',
        finalSynthesis
      });

    } catch (error: any) {
      console.error('❌ Synthesis Error:', error);
      
      updateMultiChainStatus(sessionId, messageId, {
        synthesisStatus: 'failed'
      });

      // Mostra errore all'utente ma non blocca l'esperienza
      setError(`Sintesi fallita: ${error.message || 'Errore sconosciuto'}. Le chain of thought individuali restano disponibili.`);
    }
  }, [updateMultiChainStatus]);

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
          
Per vedere multiple chain of thought con sintesi finale, prova domande più complesse che attivano più specialisti come:
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

      // FASE 2: Multiple Chain of Thought
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
        messageType: 'multi-thinking',
        synthesisStatus: 'pending'
      };

      if (multiChainMessage.chainOfThoughts.length > 0) {
        multiChainMessage.activeChainId = multiChainMessage.chainOfThoughts[0].id;
      }

      addMessageToSession(sessionId, multiChainMessage);

      // ✅ NUOVO: Inizializza chain content ref
      chainContentRef.current.clear();
      multiChainMessage.chainOfThoughts.forEach(chain => {
        chainContentRef.current.set(chain.id, {
          chainId: chain.id,
          specialist: chain.specialist,
          content: '',
          isComplete: false,
          weight: chain.weight
        });
      });

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

      // ✅ NUOVO: Track completion più robusto
      let completedChains = 0;
      const totalChains = decision.selectedSpecialists.length;
      const chainIds = multiChainMessage.chainOfThoughts.map(c => c.id);

      // Esegui le chain of thought in parallelo
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
                    
                    // ✅ AGGIORNA: Sia lo stato React che la ref
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

          // ✅ MIGLIORATO: Update finale completo
          updateMultiChainMessage(sessionId, multiChainMessage.id, chainId, {
            content: accumulatedContent,
            isStreaming: false,
            isComplete: true,
            endTime: new Date()
          });

          console.log(`✅ Chain of thought completed for ${specScore.specialist.name} (${accumulatedContent.length} chars)`);

          // ✅ NUOVO: Check completion più affidabile
          completedChains++;
          console.log(`📊 Completed chains: ${completedChains}/${totalChains}`);
          
          if (completedChains === totalChains) {
            console.log('🎯 All chains completed, triggering synthesis...');
            // ✅ NUOVO: Delay ridotto e sintesi diretta
            setTimeout(() => {
              triggerSynthesis(sessionId, multiChainMessage.id, content, chainIds);
            }, 1000); // Ridotto a 1 secondo
          }

        } catch (error: any) {
          console.error(`❌ Error in chain ${specScore.specialist.name}:`, error);
          
          if (error.name !== 'AbortError') {
            // ✅ AGGIORNA: Anche errori nella ref
            const chainData = chainContentRef.current.get(chainId);
            if (chainData) {
              chainContentRef.current.set(chainId, {
                ...chainData,
                error: error.message || 'Errore sconosciuto',
                isComplete: false
              });
            }

            updateMultiChainMessage(sessionId, multiChainMessage.id, chainId, {
              isStreaming: false,
              isComplete: false,
              error: error.message || 'Errore sconosciuto',
              endTime: new Date()
            });

            // ✅ NUOVO: Anche le chain fallite contano per il completamento
            completedChains++;
            console.log(`📊 Completed chains (with error): ${completedChains}/${totalChains}`);
            
            if (completedChains === totalChains) {
              console.log('🎯 All chains processed (some with errors), triggering synthesis...');
              setTimeout(() => {
                triggerSynthesis(sessionId, multiChainMessage.id, content, chainIds);
              }, 1000);
            }
          }
        }
      });

      Promise.all(chainPromises).then(() => {
        console.log('🎉 All chain of thoughts processing completed');
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
    updateMultiChainMessage,
    triggerSynthesis
  ]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    setError(null);
    // ✅ NUOVO: Pulisci chain content ref quando cambi sessione
    chainContentRef.current.clear();
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
      chainContentRef.current.clear();
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
