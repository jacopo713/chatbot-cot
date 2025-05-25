import { Message, MultiChainMessage } from '@/types/chat';
import { User, Bot, Copy, Check, Brain, Lightbulb, Search } from 'lucide-react';
import { useState } from 'react';
import SpecialistIndicator from './SpecialistIndicator';
import MultiChainDisplay from './MultiChainDisplay';

interface MessageBubbleProps {
  message: Message | MultiChainMessage;
  onUpdateActiveChain?: (messageId: string, chainId: string) => void;
}

export default function MessageBubble({ message, onUpdateActiveChain }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  // Type guard per MultiChainMessage
  const isMultiChain = (msg: Message | MultiChainMessage): msg is MultiChainMessage => {
    return 'chainOfThoughts' in msg;
  };

  const isUser = !isMultiChain(message) && message.role === 'user';
  const isThinking = !isMultiChain(message) && message.messageType === 'thinking';

  const copyToClipboard = async () => {
    const content = isMultiChain(message) 
      ? message.chainOfThoughts.map(chain => 
          `${chain.specialist.name}:\n${chain.content}`
        ).join('\n\n---\n\n')
      : message.content;
      
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Gestisci MultiChainMessage separatamente
  if (isMultiChain(message)) {
    return (
      <div className="group animate-slide-in mb-6">
        <MultiChainDisplay 
          message={message} 
          onUpdateActiveChain={onUpdateActiveChain || (() => {})}
        />
        
        {/* Footer con timestamp e copy */}
        <div className="flex items-center justify-between mt-3 px-4">
          <span className="text-xs text-purple-500">
            {formatTime(message.timestamp)}
          </span>
          <button
            onClick={copyToClipboard}
            className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all hover:bg-purple-100"
            title="Copia tutte le chain of thought"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3 text-purple-500" />
            )}
          </button>
        </div>
      </div>
    );
  }

  // Gestione normale per Message singoli
  const getThinkingIcon = () => {
    if (message.phase === 'thinking') return <Brain className="w-4 h-4" />;
    if (message.phase === 'generating') return <Lightbulb className="w-4 h-4" />;
    return <Search className="w-4 h-4" />;
  };

  return (
    <div className={`
      group animate-slide-in mb-6
      ${isUser ? 'ml-auto' : 'mr-auto'}
    `}>
      <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${isUser 
            ? 'bg-primary-600 text-white' 
            : isThinking 
              ? 'bg-purple-600 text-white'
              : 'bg-neutral-200 text-neutral-600'
          }
        `}>
          {isUser ? (
            <User className="w-4 h-4" />
          ) : isThinking ? (
            <Brain className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </div>

        {/* Message Content */}
        <div className={`
          max-w-3xl px-4 py-3 rounded-2xl relative
          ${isUser 
            ? 'bg-primary-600 text-white rounded-br-md' 
            : isThinking
              ? 'bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 text-neutral-800 rounded-bl-md shadow-md'
              : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-md shadow-sm'
          }
        `}>
          {/* Chain of Thought Header */}
          {isThinking && (
            <div className="mb-3 pb-2 border-b border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-800">Chain of Thought</span>
                {message.specialist && (
                  <div className="ml-auto">
                    <SpecialistIndicator specialist={message.specialist} />
                  </div>
                )}
              </div>
              <p className="text-xs text-purple-600 italic">
                Processo di pensiero interno dello specialista - non la risposta finale
              </p>
            </div>
          )}

          {/* Specialist indicator per messaggi assistant normali */}
          {!isUser && !isThinking && message.specialist && (
            <div className="mb-3">
              <SpecialistIndicator specialist={message.specialist} />
            </div>
          )}

          {/* Streaming indicator */}
          {message.isStreaming && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex space-x-1">
                <div className={`w-2 h-2 rounded-full animate-pulse-soft ${
                  isThinking ? 'bg-purple-400' : 'bg-primary-400'
                }`}></div>
                <div className={`w-2 h-2 rounded-full animate-pulse-soft delay-75 ${
                  isThinking ? 'bg-purple-400' : 'bg-primary-400'
                }`}></div>
                <div className={`w-2 h-2 rounded-full animate-pulse-soft delay-150 ${
                  isThinking ? 'bg-purple-400' : 'bg-primary-400'
                }`}></div>
              </div>
              <span className={`text-xs ml-2 ${
                isThinking ? 'text-purple-600' : 'text-primary-400'
              }`}>
                {message.phase === 'thinking' ? '🧠 Sto ragionando...' : 
                 message.phase === 'analytical' ? '🔍 Sto analizzando...' : 
                 '✍️ Sto scrivendo...'}
              </span>
            </div>
          )}

          {/* Message content */}
          <div className="whitespace-pre-wrap leading-relaxed">
            {message.content}
          </div>

          {/* Special footer for chain of thought */}
          {isThinking && !message.isStreaming && (
            <div className="mt-4 pt-3 border-t border-purple-200">
              <div className="flex items-center gap-2 text-purple-600">
                <Lightbulb className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Processo di pensiero completato
                </span>
              </div>
              <p className="text-xs text-purple-500 mt-1">
                Questo è il ragionamento interno che lo specialista userebbe per rispondere
              </p>
            </div>
          )}

          {/* Timestamp and actions */}
          <div className={`
            flex items-center justify-between mt-3 pt-2 
            ${isUser ? 'border-t border-primary-500/20' : 
              isThinking ? 'border-t border-purple-200' : 'border-t border-neutral-200'}
          `}>
            <span className={`
              text-xs 
              ${isUser ? 'text-primary-200' : 
                isThinking ? 'text-purple-500' : 'text-neutral-500'}
            `}>
              {formatTime(message.timestamp)}
            </span>

            {!isUser && message.content && (
              <button
                onClick={copyToClipboard}
                className={`
                  opacity-0 group-hover:opacity-100 p-1 rounded transition-all
                  ${isThinking ? 'hover:bg-purple-100' : 'hover:bg-neutral-100'}
                `}
                title="Copia messaggio"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className={`w-3 h-3 ${isThinking ? 'text-purple-500' : 'text-neutral-500'}`} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
