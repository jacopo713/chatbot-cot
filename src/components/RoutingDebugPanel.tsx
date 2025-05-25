import { RouterDecision } from '@/types/specialists';
import { Info, Zap, Brain, MessageCircle, Users, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface RoutingDebugPanelProps {
  decision: RouterDecision | null;
  isVisible?: boolean;
}

export default function RoutingDebugPanel({ decision, isVisible = false }: RoutingDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!decision || !isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-3 mb-4 text-sm shadow-md">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left hover:bg-purple-100 p-2 rounded transition-colors"
      >
        <Sparkles className="w-4 h-4 text-purple-500" />
        <span className="font-bold text-purple-800">
          🤖 AI-Powered Routing - {decision.useGeneric 
            ? 'API Generica' 
            : `${decision.selectedSpecialists.length} Specialisti Attivati`
          }
        </span>
        <div className="ml-2 px-2 py-1 bg-purple-200 text-purple-800 rounded-full text-xs font-medium">
          NEW AI
        </div>
        <div className={`ml-auto transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3 pl-6">
          <div className="bg-purple-100 p-3 rounded-lg border border-purple-300">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-purple-800">Sistema AI-Powered:</span>
            </div>
            <div className="text-xs text-purple-700 space-y-1">
              <p>• L'AI valuta intelligentemente ogni domanda</p>
              <p>• Sceglie automaticamente gli specialisti più adatti</p>
              <p>• Assegna pesi basati sulla rilevanza effettiva</p>
              <p>• Si adatta a combinazioni complesse e multi-competenza</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-blue-500" />
            <span>Token Count: <strong>{decision.tokenCount}</strong></span>
          </div>
          
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <span>Complexity: <strong className={`
              ${decision.complexity === 'low' ? 'text-green-600' : 
                decision.complexity === 'medium' ? 'text-orange-600' : 'text-red-600'}
            `}>
              {decision.complexity.toUpperCase()}
            </strong></span>
          </div>

          {!decision.useGeneric && decision.selectedSpecialists.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                <span>Soglia AI: <strong>{(decision.activationThreshold * 100).toFixed(0)}%</strong></span>
              </div>

              <div className="bg-white p-3 rounded border border-purple-200">
                <strong className="text-purple-800 block mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Specialisti Selezionati dall'AI:
                </strong>
                <div className="space-y-2">
                  {decision.selectedSpecialists.map((specScore) => (
                    <div key={specScore.specialist.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">{specScore.specialist.name}</span>
                        <span className="text-xs text-gray-500">({specScore.specialist.mbti})</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-purple-600">
                          {(specScore.score * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500 max-w-xs truncate">
                          {specScore.reasoning}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded border">
                <strong className="text-gray-700 block mb-1">Tutti i Punteggi AI:</strong>
                <div className="space-y-1 text-xs">
                  {decision.allScores.map((score) => (
                    <div key={score.specialist.id} className="flex justify-between">
                      <span>{score.specialist.name}:</span>
                      <span className={score.score >= decision.activationThreshold ? 'text-green-600 font-bold' : 'text-gray-500'}>
                        {(score.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-3 rounded text-xs border border-purple-300">
            <strong className="text-purple-800 flex items-center gap-1 mb-1">
              <Sparkles className="w-3 h-3" />
              AI Reasoning:
            </strong>
            <div className="text-purple-700">{decision.reasoning}</div>
          </div>

          <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded italic">
            💡 Questo sistema usa DeepSeek per valutare intelligentemente quale specialista o combinazione di specialisti è più adatta per ogni domanda, sostituendo le regole hardcoded con decisioni AI context-aware.
          </div>
        </div>
      )}
    </div>
  );
}
