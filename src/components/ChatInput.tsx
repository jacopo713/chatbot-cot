import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStopGeneration: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function ChatInput({ 
  onSendMessage, 
  onStopGeneration, 
  isLoading, 
  disabled = false 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleStop = () => {
    onStopGeneration();
  };

  return (
    <div className="border-t border-neutral-200 bg-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex items-end gap-3">
          {/* Text Area */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Scrivi il tuo messaggio..."
              disabled={disabled}
              className={`
                w-full px-4 py-3 pr-12 rounded-2xl border border-neutral-300
                resize-none outline-none transition-all duration-200
                min-h-[52px] max-h-32 overflow-y-auto
                ${disabled 
                  ? 'bg-neutral-100 cursor-not-allowed' 
                  : 'bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                }
              `}
              rows={1}
            />
            
            {/* Character counter for long messages */}
            {message.length > 100 && (
              <div className="absolute -bottom-6 right-2 text-xs text-neutral-500">
                {message.length}/2000
              </div>
            )}
          </div>

          {/* Action Button */}
          {isLoading ? (
            <button
              onClick={handleStop}
              className="p-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-colors flex-shrink-0"
              title="Ferma generazione"
            >
              <Square className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || disabled}
              className={`
                p-3 rounded-2xl transition-colors flex-shrink-0
                ${message.trim() && !disabled
                  ? 'bg-primary-600 text-white hover:bg-primary-700' 
                  : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                }
              `}
              title="Invia messaggio (Invio)"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Helper text */}
        <div className="mt-2 text-xs text-neutral-500 text-center">
          Premi <kbd className="px-1 py-0.5 bg-neutral-200 rounded text-neutral-700">Invio</kbd> per inviare, 
          <kbd className="px-1 py-0.5 bg-neutral-200 rounded text-neutral-700 ml-1">Shift + Invio</kbd> per andare a capo
        </div>
      </div>
    </div>
  );
}
