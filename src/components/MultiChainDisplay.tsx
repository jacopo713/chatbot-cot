import { MultiChainMessage, ChainOfThoughtEntry } from '@/types/chat';
import { useState } from 'react';
import { Brain, Clock, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import SpecialistIndicator from './SpecialistIndicator';

interface MultiChainDisplayProps {
  message: MultiChainMessage;
  onUpdateActiveChain: (messageId: string, chainId: string) => void;
}

export default function MultiChainDisplay({ message, onUpdateActiveChain }: MultiChainDisplayProps) {
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

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4 shadow-lg animate-slide-in">
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="font-bold text-purple-800 text-lg">Multiple Chain of Thought</h3>
          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
            {message.chainOfThoughts.length} Specialisti Attivati
          </span>
        </div>
        <p className="text-sm text-purple-600 italic">
          Processi di pensiero paralleli - Seleziona uno specialista per vedere il suo ragionamento
        </p>
      </div>

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
    </div>
  );
}
