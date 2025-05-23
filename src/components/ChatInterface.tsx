import { useChat } from '@/hooks/useChat';
import { useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import MessageBubble from './MessageBubble';
import ThinkingCard from './ThinkingCard';
import ChatInput from './ChatInput';
import { Sparkles, MessageCircle, Brain, Eye, EyeOff } from 'lucide-react';

export default function ChatInterface() {
  const {
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
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const getPhaseDisplay = () => {
    switch (currentPhase) {
      case 'creative':
        return { text: 'Fase Creativa...', color: 'text-amber-600', icon: Sparkles };
      case 'analytical':
        return { text: 'Fase Analitica...', color: 'text-blue-600', icon: Brain };
      default:
        return null;
    }
  };

  const phaseDisplay = getPhaseDisplay();

  const EmptyState = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-lg mx-auto p-8">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Brain className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-semibold text-neutral-800 mb-3">
          ChatBot CoT (Chain of Thought)
        </h2>
        <p className="text-neutral-600 mb-6 leading-relaxed">
          Un assistente AI che utilizza un processo di ragionamento a due fasi: 
          prima genera pensieri creativi, poi fornisce risposte analitiche basate su quei pensieri.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {[
            "Spiegami un concetto complesso",
            "Aiutami a risolvere un problema",
            "Analizza una situazione",
            "Brainstorming creativo"
          ].map((suggestion, index) => (
            <button
              key={index}
              onClick={() => sendMessage(suggestion)}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-full text-sm text-neutral-700 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

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
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-neutral-800">
                  {currentSession?.title || 'ChatBot CoT'}
                </h1>
                <div className="flex items-center gap-2">
                  {currentSession?.messages.length && (
                    <p className="text-sm text-neutral-500">
                      {currentSession.messages.filter(m => m.role !== 'thinking').length} messaggi
                    </p>
                  )}
                  {phaseDisplay && (
                    <div className="flex items-center gap-1">
                      <phaseDisplay.icon className={`w-4 h-4 ${phaseDisplay.color}`} />
                      <span className={`text-sm ${phaseDisplay.color}`}>
                        {phaseDisplay.text}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Toggle Thinking View */}
            <button
              onClick={toggleShowThinking}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md transition-colors
                ${showThinking 
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }
              `}
              title={showThinking ? 'Nascondi catene di pensiero' : 'Mostra catene di pensiero'}
            >
              {showThinking ? (
                <>
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Pensieri Visibili</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span className="text-sm">Solo Risposte</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-neutral-50">
          {!currentSession?.messages.length ? (
            <EmptyState />
          ) : (
            <div className="max-w-4xl mx-auto px-6 py-8">
              {currentSession.messages.map((message) => {
                // Se è un messaggio di thinking e non vogliamo mostrarli, saltiamo
                if (message.role === 'thinking' && !showThinking) {
                  return null;
                }
                
                // Rendering del messaggio appropriato
                if (message.role === 'thinking') {
                  return <ThinkingCard key={message.id} message={message} />;
                } else {
                  return <MessageBubble key={message.id} message={message} />;
                }
              })}
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
