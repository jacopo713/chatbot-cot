import { Message } from '@/types/chat';
import { User, Bot, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
            : 'bg-neutral-200 text-neutral-600'
          }
        `}>
          {isUser ? (
            <User className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </div>

        {/* Message Content */}
        <div className={`
          max-w-3xl px-4 py-3 rounded-2xl relative
          ${isUser 
            ? 'bg-primary-600 text-white rounded-br-md' 
            : 'bg-white border border-neutral-200 text-neutral-800 rounded-bl-md shadow-sm'
          }
        `}>
          {/* Streaming indicator */}
          {message.isStreaming && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse-soft"></div>
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse-soft delay-75"></div>
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse-soft delay-150"></div>
              </div>
              <span className="text-xs text-primary-400 ml-2">
                {message.phase === 'analytical' ? 'Sto analizzando...' : 'Sto scrivendo...'}
              </span>
            </div>
          )}

          {/* Message text with proper formatting */}
          <div className="prose prose-sm max-w-none">
            {message.content.split('\n').map((line, index) => (
              <p key={index} className={`
                ${index === 0 ? 'mt-0' : 'mt-2'} mb-0 leading-relaxed
                ${isUser ? 'text-white' : 'text-neutral-800'}
              `}>
                {line || '\u00A0'}
              </p>
            ))}
          </div>

          {/* Timestamp and actions */}
          <div className={`
            flex items-center justify-between mt-3 pt-2 
            ${isUser ? 'border-t border-primary-500/20' : 'border-t border-neutral-200'}
          `}>
            <span className={`
              text-xs 
              ${isUser ? 'text-primary-200' : 'text-neutral-500'}
            `}>
              {formatTime(message.timestamp)}
            </span>

            {!isUser && message.content && (
              <button
                onClick={copyToClipboard}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-100 rounded transition-all"
                title="Copia messaggio"
              >
                {copied ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Copy className="w-3 h-3 text-neutral-500" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
