import { useChat } from '@/hooks/useChat';
import { useRef, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import RoutingDebugPanel from './RoutingDebugPanel';
import ErrorDisplay from './ErrorDisplay';
import { MessageCircle, Brain, Settings, Lightbulb, Code2 } from 'lucide-react';

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
  } = useChat();

  const [showDebug, setShowDebug] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const EmptyState = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto p-8">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6 border-2 border-purple-200">
          <Brain className="w-10 h-10 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-neutral-800 mb-3">
          ChatBot AI - Chain of Thought
        </h2>
        <p className="text-neutral-600 mb-6 leading-relaxed text-lg">
          Esplora come ragionano gli <strong>specialisti AI</strong> prima di rispondere. 
          Vedrai il loro processo di pensiero interno, non la risposta finale.
        </p>
        
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 mb-6 border border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-800">Come funziona:</h3>
          </div>
          <div className="text-sm text-purple-700 space-y-2 text-left">
            <p>• <strong>Input semplici</strong> → Usa API generica (nessun chain of thought)</p>
            <p>• <strong>Domande complesse</strong> → Attiva uno specialista che mostra il suo ragionamento</p>
            <p>• <strong>4 Specialisti disponibili</strong> → Ognuno con personalità MBTI/Big Five</p>
            <p>• <strong>Obiettivo</strong> → Capire come ragiona ogni specialista per ottimizzarli</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-neutral-700 mb-3">Prova questi esempi per attivare gli specialisti:</p>
          {[
            { 
              text: "Analizza l'architettura di React in dettaglio", 
              specialist: "Analitico Tecnico (INTJ)",
              icon: <Code2 className="w-4 h-4" />
            },
            { 
              text: "Crea una storia fantastica originale con personaggi dettagliati", 
              specialist: "Creativo Ideatore (ENFP)",
              icon: <Lightbulb className="w-4 h-4" />
            },
            { 
              text: "Verifica se questa informazione è accurata e fornisci fonti", 
              specialist: "Verificatore Critico (ISTJ)",
              icon: <Settings className="w-4 h-4" />
            },
            { 
              text: "Ho bisogno di supporto emotivo per questa situazione difficile", 
              specialist: "Facilitatore Empatico (ENFJ)",
              icon: <Brain className="w-4 h-4" />
            },
            { 
              text: "Ciao, come stai?", 
              specialist: "API Generica (semplice)",
              icon: <MessageCircle className="w-4 h-4" />
            }
          ].map((example, index) => (
            <div key={index} className="group">
              <button
                onClick={() => sendMessage(example.text)}
                className="w-full p-3 bg-white hover:bg-neutral-50 rounded-lg border border-neutral-200 text-left transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="text-neutral-500 mt-0.5">
                    {example.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-neutral-800 mb-1">{example.text}</div>
                    <div className="text-xs text-neutral-500">→ {example.specialist}</div>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-neutral-500 bg-neutral-50 rounded-lg p-3">
          💡 <strong>Per sviluppatori:</strong> Questo sistema aiuta a capire e ottimizzare 
          i pattern di ragionamento di ogni specialista AI attraverso la metacognizione.
        </div>
      </div>
    </div>
  );

  const getThinkingCount = () => {
    return currentSession?.messages.filter(m => m.messageType === 'thinking').length || 0;
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
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-neutral-800">
                  {currentSession?.title || 'Chain of Thought AI'}
                </h1>
                {currentSession?.messages.length ? (
                  <div className="flex items-center gap-4 text-sm text-neutral-500">
                    <span>{currentSession.messages.length} messaggi</span>
                    {getThinkingCount() > 0 && (
                      <span className="flex items-center gap-1">
                        <Brain className="w-3 h-3 text-purple-500" />
                        {getThinkingCount()} chain of thought
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">Modalità Chain of Thought attiva</p>
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
                title="Toggle Debug Info"
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
                  <span>Processando pensiero...</span>
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
            <div className="max-w-4xl mx-auto px-6 py-8">
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
                <MessageBubble key={message.id} message={message} />
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
