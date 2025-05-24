import { Message } from '@/types/chat';
import { User, Bot, Copy, Check, Brain, Lightbulb, Search } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import SpecialistIndicator from './SpecialistIndicator';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isThinking = message.messageType === 'thinking';

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

          {/* Message content with Markdown support */}
          <div className={`markdown-content ${isThinking ? 'thinking-markdown' : ''}`}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Code blocks with syntax highlighting
                code: ({ node, inline, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeContent = String(children).replace(/\n$/, '');
                  
                  if (!inline && match) {
                    return (
                      <div className="relative group">
                        <div className="flex items-center justify-between bg-neutral-800 text-neutral-200 px-4 py-2 text-sm font-mono rounded-t-lg">
                          <span>{match[1]}</span>
                          <button
                            onClick={() => navigator.clipboard.writeText(codeContent)}
                            className="opacity-60 hover:opacity-100 transition-opacity"
                            title="Copia codice"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <SyntaxHighlighter
                          language={match[1]}
                          style={vscDarkPlus}
                          customStyle={{
                            margin: 0,
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: 0,
                            borderBottomLeftRadius: '0.5rem',
                            borderBottomRightRadius: '0.5rem',
                          }}
                          {...props}
                        >
                          {codeContent}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }

                  // Inline code
                  return (
                    <code 
                      className={`px-1.5 py-0.5 rounded text-sm font-mono ${
                        isUser 
                          ? 'bg-primary-500/20 text-primary-100' 
                          : isThinking
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-neutral-100 text-neutral-800'
                      }`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },

                // Blockquotes
                blockquote: ({ children, ...props }) => {
                  return (
                    <blockquote 
                      className={`border-l-4 pl-4 py-2 my-3 italic ${
                        isUser 
                          ? 'border-primary-300 text-primary-100' 
                          : isThinking
                            ? 'border-purple-300 text-purple-700 bg-purple-50/50'
                            : 'border-neutral-300 text-neutral-600 bg-neutral-50'
                      }`}
                      {...props}
                    >
                      {children}
                    </blockquote>
                  );
                },

                // Tables
                table: ({ children, ...props }) => {
                  return (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-collapse border border-neutral-300" {...props}>
                        {children}
                      </table>
                    </div>
                  );
                },

                th: ({ children, ...props }) => {
                  return (
                    <th 
                      className={`border border-neutral-300 px-3 py-2 text-left font-semibold ${
                        isUser 
                          ? 'bg-primary-500/20 text-primary-100' 
                          : isThinking
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-neutral-100 text-neutral-800'
                      }`}
                      {...props}
                    >
                      {children}
                    </th>
                  );
                },

                td: ({ children, ...props }) => {
                  return (
                    <td 
                      className={`border border-neutral-300 px-3 py-2 ${
                        isUser ? 'text-white' : 'text-neutral-700'
                      }`}
                      {...props}
                    >
                      {children}
                    </td>
                  );
                },

                // Links - versione semplificata
                a: (props) => {
                  const linkClass = `underline transition-colors ${
                    isUser 
                      ? 'text-primary-200 hover:text-white' 
                      : isThinking
                        ? 'text-purple-600 hover:text-purple-800'
                        : 'text-primary-600 hover:text-primary-800'
                  }`;
                  
                  return (
                    <a 
                      className={linkClass}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    />
                  );
                },

                // Lists
                ul: ({ children, ...props }) => {
                  return (
                    <ul className="list-disc list-inside my-2 space-y-1" {...props}>
                      {children}
                    </ul>
                  );
                },

                ol: ({ children, ...props }) => {
                  return (
                    <ol className="list-decimal list-inside my-2 space-y-1" {...props}>
                      {children}
                    </ol>
                  );
                },

                li: ({ children, ...props }) => {
                  return (
                    <li className="ml-2" {...props}>
                      {children}
                    </li>
                  );
                },

                // Headings
                h1: ({ children, ...props }) => {
                  return (
                    <h1 
                      className={`text-xl font-bold mt-4 mb-2 ${
                        isUser ? 'text-white' : isThinking ? 'text-purple-800' : 'text-neutral-800'
                      }`}
                      {...props}
                    >
                      {children}
                    </h1>
                  );
                },

                h2: ({ children, ...props }) => {
                  return (
                    <h2 
                      className={`text-lg font-semibold mt-3 mb-2 ${
                        isUser ? 'text-white' : isThinking ? 'text-purple-700' : 'text-neutral-800'
                      }`}
                      {...props}
                    >
                      {children}
                    </h2>
                  );
                },

                h3: ({ children, ...props }) => {
                  return (
                    <h3 
                      className={`text-base font-semibold mt-3 mb-1 ${
                        isUser ? 'text-white' : isThinking ? 'text-purple-700' : 'text-neutral-800'
                      }`}
                      {...props}
                    >
                      {children}
                    </h3>
                  );
                },

                // Paragraphs
                p: ({ children, ...props }) => {
                  return (
                    <p 
                      className={`mb-2 leading-relaxed ${
                        isUser ? 'text-white' : isThinking ? 'text-neutral-800' : 'text-neutral-800'
                      }`}
                      {...props}
                    >
                      {children}
                    </p>
                  );
                },

                // Horizontal rules
                hr: ({ ...props }) => {
                  return (
                    <hr 
                      className={`my-4 border-t ${
                        isUser 
                          ? 'border-primary-300' 
                          : isThinking 
                            ? 'border-purple-200' 
                            : 'border-neutral-300'
                      }`}
                      {...props}
                    />
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
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
