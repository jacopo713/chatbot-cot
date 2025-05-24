import { RouterDecision } from '@/types/specialists';
import { Info, Zap, Brain, MessageCircle } from 'lucide-react';
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
          Routing Info - {decision.useGeneric ? 'API Generica' : decision.selectedSpecialist?.name}
        </span>
        <div className={`ml-auto transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2 pl-6">
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

          {decision.selectedSpecialist && (
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              <span>Specialist: <strong>{decision.selectedSpecialist.name}</strong> ({decision.selectedSpecialist.mbti})</span>
            </div>
          )}

          <div className="bg-neutral-100 p-2 rounded text-xs">
            <strong>Reasoning:</strong> {decision.reasoning}
          </div>
        </div>
      )}
    </div>
  );
}
