import { useChat } from '@/hooks/useChat';
import { useRef, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import RoutingDebugPanel from './RoutingDebugPanel';
import ErrorDisplay from './ErrorDisplay';
import { MessageCircle, Brain, Settings, Lightbulb, Code2, Users, Sparkles } from 'lucide-react';

export default function ChatInterface() {
  const {
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
  } = useChat();

  const [showDebug, setShowDebug] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const EmptyState = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto p-8">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-purple-200 relative">
          <Users className="w-10 h-10 text-purple-600" />
          <Sparkles className="w-4 h-4 text-blue-500 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold text-neutral-800 mb-3">
          🤖 AI-Powered Multi-Specialist System
        </h2>
        <p className="text-neutral-600 mb-6 leading-relaxed text-lg">
          Sistema intelligente che usa <strong>AI per selezionare automaticamente</strong> gli specialisti più adatti. 
          L'AI valuta ogni domanda e sceglie la combinazione ottimale di esperti.
        </p>
        
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6 border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-800">🚀 Nuovo Sistema AI-Powered:</h3>
          </div>
          <div className="text-sm text-purple-700 space-y-2 text-left">
            <p>• <strong>Valutazione Intelligente</strong> → L'AI analizza ogni domanda e sceglie gli specialisti</p>
            <p>• <strong>Pesi Automatici</strong> → Assegna automaticamente i pesi in base alla rilevanza</p>
            <p>• <strong>Context-Aware</strong> → Si adatta al contesto e alle sfumature della domanda</p>
            <p>• <strong>Multi-Competenza</strong> → Riconosce quando servono più specialisti insieme</p>
            <p>• <strong>Evoluzione Continua</strong> → Migliora nel tempo invece di usare regole fisse</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-neutral-700 mb-3">Prova questi esempi - l'AI sceglierà automaticamente:</p>
          {[
            { 
              text: "Analizza l'architettura di React e crea contenuti creativi per spiegarla ai principianti", 
              expected: "AI sceglierà: Analitico Tecnico + Creativo Ideatore + Facilitatore Empatico",
              icon: <Users className="w-4 h-4" />
            },
            { 
              text: "Verifica questa informazione tecnica complessa e fornisci supporto emotivo per implementarla in team", 
              expected: "AI sceglierà: Verificatore Critico + Analitico Tecnico + Facilitatore Empatico",
              icon: <Brain className="w-4 h-4" />
            },
            { 
              text: "Brainstorm soluzioni innovative per ottimizzare performance mantenendo codice leggibile", 
              expected: "AI sceglierà: Creativo Ideatore + Analitico Tecnico + Verificatore Critico",
              icon: <Lightbulb className="w-4 h-4" />
            },
            { 
              text: "Come implementare autenticazione OAuth in Node.js?", 
              expected: "AI sceglierà: Analitico Tecnico (focus tecnico specifico)",
              icon: <Code2 className="w-4 h-4" />
            },
            { 
              text: "Ciao, come stai?", 
              expected: "AI sceglierà: API Generica (troppo semplice per specialisti)",
              icon: <MessageCircle className="w-4 h-4" />
            }
          ].map((example, index) => (
            <div key={index} className="group">
              <button
                onClick={() => sendMessage(example.text)}
                className="w-full p-4 bg-white hover:bg-neutral-50 rounded-lg border border-neutral-200 text-left transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="text-neutral-500 mt-0.5">
                    {example.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-neutral-800 mb-2 font-medium">{example.text}</div>
                    <div className="text-xs text-purple-600">
                      <span className="font-medium">🤖 AI previsto →</span> {example.expected}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-neutral-500 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <strong className="text-purple-800">🚀 SISTEMA AI-POWERED ATTIVO</strong>
          </div>
          <p>Invece di regole hardcoded, ora un'AI valuta intelligentemente ogni domanda e sceglie automaticamente gli specialisti più adatti con i pesi appropriati. Più intelligente, più flessibile, più preciso!</p>
        </div>
      </div>
    </div>
  );

  const getThinkingCount = () => {
    return currentSession?.messages.filter(m => 
      ('messageType' in m && m.messageType === 'thinking') || 
      ('messageType' in m && m.messageType === 'multi-thinking')
    ).length || 0;
  };

  const getMultiChainCount = () => {
    return currentSession?.messages.filter(m => 
      'chainOfThoughts' in m
    ).length || 0;
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSession?.id || null}
        onSelectSession={selectSession}
        onNewChat={createNewSession}
        onDeleteSession={deleteSession}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center relative">
                <Users className="w-5 h-5 text-white" />
                <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1" />
              </div>
              <div>
                <h1 className="font-semibold text-neutral-800 flex items-center gap-2">
                  {currentSession?.title || 'AI-Powered Multi-Specialist System'}
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                    🤖 AI
                  </span>
                </h1>
                {currentSession?.messages.length ? (
                  <div className="flex items-center gap-4 text-sm text-neutral-500">
                    <span>{currentSession.messages.length} messaggi</span>
                    {getThinkingCount() > 0 && (
                      <span className="flex items-center gap-1">
                        <Brain className="w-3 h-3 text-purple-500" />
                        {getThinkingCount()} thinking processes
                      </span>
                    )}
                    {getMultiChainCount() > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-blue-500" />
                        {getMultiChainCount()} multi-chain
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-500" />
                    AI Router Intelligente Attivo
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Debug Toggle */}
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`p-2 rounded-md transition-colors ${
                  showDebug 
                    ? 'bg-purple-100 text-purple-600' 
                    : 'hover:bg-neutral-100 text-neutral-500'
                }`}
                title="Toggle AI Router Debug Info"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></div>
                  </div>
                  <span>🤖 AI sta processando...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-neutral-50">
          {!currentSession?.messages.length ? (
            <EmptyState />
          ) : (
            <div className="max-w-5xl mx-auto px-6 py-8">
              {/* Error Display */}
              {error && (
                <ErrorDisplay 
                  error={error} 
                  onClose={clearError}
                />
              )}
              
              {/* Debug Panel */}
              <RoutingDebugPanel decision={routingInfo} isVisible={showDebug} />
              
              {currentSession.messages.map((message) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  onUpdateActiveChain={updateActiveChain}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <ChatInput
          onSendMessage={sendMessage}
          onStopGeneration={stopGeneration}
          isLoading={isLoading}
          disabled={false}
        />
      </div>
    </div>
  );
}
