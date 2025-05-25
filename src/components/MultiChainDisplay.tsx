import { MultiChainMessage, ChainOfThoughtEntry } from '@/types/chat';
import { useState } from 'react';
import { Brain, Clock, Zap, CheckCircle, AlertCircle, Sparkles, Eye, EyeOff, Users } from 'lucide-react';
import SpecialistIndicator from './SpecialistIndicator';

interface MultiChainDisplayProps {
  message: MultiChainMessage;
  onUpdateActiveChain: (messageId: string, chainId: string) => void;
}

export default function MultiChainDisplay({ message, onUpdateActiveChain }: MultiChainDisplayProps) {
  const [showChains, setShowChains] = useState(!message.finalSynthesis?.isVisible);
  
  const activeChain = message.chainOfThoughts.find(chain => chain.id === message.activeChainId) 
    || message.chainOfThoughts[0];

  const getChainStatus = (chain: ChainOfThoughtEntry) => {
    if (chain.error) return 'error';
    if (chain.isComplete) return 'complete';
    if (chain.isStreaming) return 'streaming';
    return 'waiting';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'streaming': return <Zap className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDuration = (chain: ChainOfThoughtEntry) => {
    if (!chain.endTime) return chain.isStreaming ? 'In corso...' : 'In attesa...';
    const duration = chain.endTime.getTime() - chain.startTime.getTime();
    return `${(duration / 1000).toFixed(1)}s`;
  };

  const allChainsComplete = message.chainOfThoughts.every(chain => 
    chain.isComplete || chain.error
  );

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4 shadow-lg animate-slide-in">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="font-bold text-purple-800 text-lg">
            {message.finalSynthesis ? 'AI Multi-Specialist Analysis' : 'Multiple Chain of Thought'}
          </h3>
          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
            {message.chainOfThoughts.length} Specialisti
          </span>
          
          {/* Synthesis Status */}
          {message.synthesisStatus && (
            <div className="ml-auto flex items-center gap-2">
              {message.synthesisStatus === 'processing' && (
                <div className="flex items-center gap-2 text-purple-600">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></div>
                  </div>
                  <span className="text-xs">Sintetizzando...</span>
                </div>
              )}
              {message.synthesisStatus === 'completed' && message.finalSynthesis && (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Sintesi Completata
                </span>
              )}
              {message.synthesisStatus === 'failed' && (
                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                  Sintesi Fallita
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Toggle between synthesis and chains */}
        {message.finalSynthesis && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-purple-600 italic">
              {showChains 
                ? 'Processi di pensiero individuali - Seleziona uno specialista'
                : 'Risposta finale sintetizzata da tutti gli specialisti'
              }
            </p>
            <button
              onClick={() => setShowChains(!showChains)}
              className="flex items-center gap-2 px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full text-xs font-medium transition-colors"
            >
              {showChains ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showChains ? 'Mostra Sintesi Finale' : 'Mostra Chain of Thought'}
            </button>
          </div>
        )}
        
        {!message.finalSynthesis && (
          <p className="text-sm text-purple-600 italic">
            {allChainsComplete 
              ? 'Tutti i processi completati - Sintesi in arrivo...'
              : 'Processi di pensiero paralleli in corso - Seleziona uno specialista'
            }
          </p>
        )}
      </div>

      {/* Final Synthesis View */}
      {message.finalSynthesis && !showChains && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800">Risposta Finale Ottimizzata</span>
            <div className="ml-auto text-xs text-green-600">
              {message.finalSynthesis.specialistsUsed.length} specialisti sintetizzati
            </div>
          </div>

          <div className="whitespace-pre-wrap leading-relaxed text-gray-800 mb-4">
            {message.finalSynthesis.content}
          </div>

          {/* Synthesis Details */}
          <div className="mt-4 pt-3 border-t border-green-200">
            <details className="group">
              <summary className="cursor-pointer text-sm font-medium text-green-700 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Dettagli Sintesi ({message.finalSynthesis.specialistsUsed.join(', ')})
              </summary>
              <div className="mt-3 space-y-2 text-sm text-green-700">
                <div>
                  <strong>Approccio di Sintesi:</strong>
                  <p className="text-green-600 mt-1">{message.finalSynthesis.synthesisReasoning}</p>
                </div>
                <div>
                  <strong>Distribuzione Pesi:</strong>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(message.finalSynthesis.weightDistribution).map(([id, weight]) => {
                      const specialist = message.chainOfThoughts.find(c => c.specialist.id === id);
                      return specialist ? (
                        <span key={id} className="px-2 py-1 bg-green-100 rounded text-xs">
                          {specialist.specialist.name}: {(weight * 100).toFixed(0)}%
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      )}

      {/* Chain of Thought View */}
      {(!message.finalSynthesis || showChains) && (
        <>
          {/* Specialist Cards/Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {message.chainOfThoughts.map((chain) => {
              const status = getChainStatus(chain);
              const isActive = chain.id === activeChain.id;
              
              return (
                <button
                  key={chain.id}
                  onClick={() => onUpdateActiveChain(message.id, chain.id)}
                  className={`
                    p-3 rounded-lg border-2 transition-all text-left
                    ${isActive 
                      ? 'border-purple-400 bg-purple-100 shadow-md' 
                      : 'border-purple-200 bg-white hover:border-purple-300 hover:bg-purple-50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <SpecialistIndicator specialist={chain.specialist} />
                    </div>
                    <div className="ml-2 flex flex-col items-end">
                      {getStatusIcon(status)}
                      <span className="text-xs text-gray-500 mt-1">
                        {(chain.weight * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">
                      {formatDuration(chain)}
                    </div>
                    
                    {/* Mini preview del contenuto */}
                    {chain.content && (
                      <div className="text-xs text-gray-700 line-clamp-2">
                        {chain.content.substring(0, 80)}...
                      </div>
                    )}
                    
                    {chain.error && (
                      <div className="text-xs text-red-600">
                        Errore: {chain.error}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Chain Content */}
          <div className="bg-white rounded-lg border border-purple-300 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-purple-800">
                Ragionamento di {activeChain.specialist.name}
              </span>
              {activeChain.isStreaming && (
                <div className="flex items-center gap-2 text-purple-600">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></div>
                  </div>
                  <span className="text-xs">Pensando...</span>
                </div>
              )}
            </div>

            {/* Contenuto della catena di pensiero attiva */}
            <div className="whitespace-pre-wrap leading-relaxed text-gray-800">
              {activeChain.content || (
                <div className="text-gray-500 italic text-center py-8">
                  {activeChain.error 
                    ? `Errore nel processo di pensiero: ${activeChain.error}`
                    : activeChain.isStreaming 
                      ? "Lo specialista sta elaborando il suo ragionamento..."
                      : "In attesa dell'inizio del processo di pensiero..."
                  }
                </div>
              )}
            </div>

            {/* Footer con informazioni aggiuntive */}
            {activeChain.isComplete && (
              <div className="mt-4 pt-3 border-t border-purple-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-purple-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Processo di pensiero completato</span>
                  </div>
                  <div className="text-purple-500">
                    Peso: {(activeChain.weight * 100).toFixed(0)}% • {formatDuration(activeChain)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
