import { RouterDecision } from '@/types/specialists';
import { Info, Zap, Brain, MessageCircle, Users } from 'lucide-react';
import { useState } from 'react';

interface RoutingDebugPanelProps {
  decision: RouterDecision | null;
  isVisible?: boolean;
}

export default function RoutingDebugPanel({ decision, isVisible = false }: RoutingDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!decision || !isVisible) return null;

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 mb-4 text-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left hover:bg-neutral-100 p-2 rounded transition-colors"
      >
        <Info className="w-4 h-4 text-neutral-500" />
        <span className="font-medium text-neutral-700">
          Multi-Specialist Routing - {decision.useGeneric 
            ? 'API Generica' 
            : `${decision.selectedSpecialists.length} Specialisti Attivati`
          }
        </span>
        <div className={`ml-auto transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3 pl-6">
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
                <span>Soglia Attivazione: <strong>{(decision.activationThreshold * 100).toFixed(0)}%</strong></span>
              </div>

              <div className="bg-neutral-100 p-3 rounded">
                <strong className="text-neutral-700 block mb-2">Specialisti Attivati:</strong>
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
                        <div className="text-xs text-gray-500">
                          {specScore.features.join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-neutral-100 p-3 rounded">
                <strong className="text-neutral-700 block mb-1">Tutti i Punteggi:</strong>
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

          <div className="bg-neutral-100 p-2 rounded text-xs">
            <strong>Reasoning:</strong> {decision.reasoning}
          </div>
        </div>
      )}
    </div>
  );
}
