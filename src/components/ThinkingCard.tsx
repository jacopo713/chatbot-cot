import { Message } from '@/types/chat';
import { Brain, ChevronDown, ChevronUp, Copy, Check, Lightbulb } from 'lucide-react';
import { useState } from 'react';

interface ThinkingCardProps {
  message: Message;
}

export default function ThinkingCard({ message }: ThinkingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Anteprima del contenuto (prime 150 caratteri)
  const preview = message.content.slice(0, 150) + (message.content.length > 150 ? '...' : '');

  return (
    <div className="mb-4 max-w-3xl mr-auto">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Header della card */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-amber-100/50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-amber-800">Processo di Pensiero</h3>
                {message.isStreaming && (
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse-soft"></div>
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse-soft delay-75"></div>
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse-soft delay-150"></div>
                  </div>
                )}
              </div>
              <p className="text-sm text-amber-600 mt-1">
                {message.isStreaming ? 'Sto elaborando...' : 'Catena di pensieri creativi'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-600">
              {formatTime(message.timestamp)}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-amber-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-amber-600" />
            )}
          </div>
        </div>

        {/* Anteprima sempre visibile */}
        {!isExpanded && message.content && (
          <div className="px-4 pb-4">
            <p className="text-sm text-amber-700 italic leading-relaxed">
              {preview}
            </p>
            {message.content.length > 150 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                }}
                className="text-xs text-amber-600 hover:text-amber-800 mt-2 font-medium"
              >
                Leggi tutto →
              </button>
            )}
          </div>
        )}

        {/* Contenuto espanso */}
        {isExpanded && (
          <div className="border-t border-amber-200 bg-white/50">
            <div className="p-4">
              <div className="prose prose-sm max-w-none">
                {message.content.split('\n').map((line, index) => (
                  <p key={index} className="mb-3 text-amber-900 leading-relaxed">
                    {line || '\u00A0'}
                  </p>
                ))}
              </div>
              
              {/* Azioni */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-amber-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-600">
                    Pensiero generato alle {formatTime(message.timestamp)}
                  </span>
                  {message.content.length > 0 && (
                    <span className="text-xs text-amber-500">
                      • {message.content.length} caratteri
                    </span>
                  )}
                </div>
                
                {message.content && (
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
                    title="Copia pensiero"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copiato!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copia
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
