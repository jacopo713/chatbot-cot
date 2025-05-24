import { useChat } from '@/hooks/useChat';
import { useRef, useEffect } from 'react';
import Sidebar from './Sidebar';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { MessageCircle, Brain } from 'lucide-react';

export default function ChatInterface() {
  const {
    sessions,
    currentSession,
    isLoading,
    sendMessage,
    stopGeneration,
    createNewSession,
    selectSession,
    deleteSession,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  const EmptyState = () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-lg mx-auto p-8">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Brain className="w-8 h-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-semibold text-neutral-800 mb-3">
          ChatBot AI
        </h2>
        <p className="text-neutral-600 mb-6 leading-relaxed">
          Un assistente AI intelligente pronto ad aiutarti con qualsiasi domanda o richiesta.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {[
            "Spiegami un concetto complesso",
            "Aiutami a risolvere un problema",
            "Scrivi del codice",
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
                  {currentSession?.title || 'ChatBot AI'}
                </h1>
                {currentSession?.messages.length && (
                  <p className="text-sm text-neutral-500">
                    {currentSession.messages.length} messaggi
                  </p>
                )}
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-primary-600">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse delay-75"></div>
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse delay-150"></div>
                </div>
                <span>Sto scrivendo...</span>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-neutral-50">
          {!currentSession?.messages.length ? (
            <EmptyState />
          ) : (
            <div className="max-w-4xl mx-auto px-6 py-8">
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
