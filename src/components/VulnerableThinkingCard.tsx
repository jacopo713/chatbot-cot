import { Message, ThinkingPhase } from '@/types/chat';
import { Brain, AlertCircle, RefreshCw, CheckCircle, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';
interface VulnerableThinkingCardProps {
message: Message;
}
export default function VulnerableThinkingCard({ message }: VulnerableThinkingCardProps) {
const [isExpanded, setIsExpanded] = useState(true);
const getPhaseIcon = (type: ThinkingPhase['type']) => {
switch (type) {
case 'initial':
return <Brain className="w-4 h-4" />;
case 'doubt':
return <AlertCircle className="w-4 h-4" />;
case 'reconsideration':
return <RefreshCw className="w-4 h-4" />;
case 'final':
return <CheckCircle className="w-4 h-4" />;
}
};
const getPhaseColor = (type: ThinkingPhase['type']) => {
switch (type) {
case 'initial':
return 'text-blue-600 bg-blue-50 border-blue-200';
case 'doubt':
return 'text-orange-600 bg-orange-50 border-orange-200';
case 'reconsideration':
return 'text-purple-600 bg-purple-50 border-purple-200';
case 'final':
return 'text-green-600 bg-green-50 border-green-200';
}
};
const getPhaseName = (type: ThinkingPhase['type']) => {
switch (type) {
case 'initial':
return 'Pensiero Iniziale';
case 'doubt':
return 'Momento di Dubbio';
case 'reconsideration':
return 'Riconsiderazione';
case 'final':
return 'Pensiero Finale';
}
};
const formatTime = (date: Date) => {
return date.toLocaleTimeString('it-IT', {
hour: '2-digit',
minute: '2-digit',
second: '2-digit'
});
};
return (
<div className="mb-6 max-w-3xl mr-auto animate-fade-in-up">
{/* Header principale */}
<div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl overflow-hidden shadow-soft">
<div
className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/30 transition-colors"
onClick={() => setIsExpanded(!isExpanded)}
>
<div className="flex items-center gap-3">
<div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
<Brain className="w-5 h-5 text-white" />
</div>
<div>
<h3 className="font-semibold text-indigo-800">Processo di Pensiero Vulnerabile</h3>
<p className="text-sm text-indigo-600">
{message.isStreaming ? 'Sto elaborando...' : ${message.thinkingPhases?.length || 0} fasi di pensiero}
</p>
</div>
</div>
      <button className="p-2 hover:bg-white/50 rounded-lg transition-colors">
        {isExpanded ? <X className="w-5 h-5 text-indigo-600" /> : <TrendingUp className="w-5 h-5 text-indigo-600" />}
      </button>
    </div>

    {/* Contenuto espanso */}
    {isExpanded && (
      <div className="border-t border-indigo-200 bg-white/40">
        <div className="p-4">
          {/* Fasi del pensiero */}
          {message.thinkingPhases?.map((phase, index) => (
            <div key={index} className="mb-4 last:mb-0">
              <div className={`border rounded-xl p-4 ${getPhaseColor(phase.type)} bg-opacity-30`}>
                {/* Header della fase */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPhaseIcon(phase.type)}
                    <span className="font-medium">{getPhaseName(phase.type)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Confidenza:</span>
                      <span className={`font-medium ${
                        phase.confidence > 70 ? 'text-green-600' : 
                        phase.confidence > 40 ? 'text-orange-600' : 
                        'text-red-600'
                      }`}>
                        {phase.confidence}%
                      </span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{formatTime(phase.timestamp)}</span>
                  </div>
                </div>

                {/* Contenuto della fase */}
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {phase.content}
                  </p>
                </div>

                {/* Indicatore di correzione se questa fase è stata corretta */}
                {message.corrections?.includes(phase.content) && (
                  <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                    <p className="text-sm italic opacity-70">
                      ⚠️ Questo pensiero è stato successivamente riconsiderato
                    </p>
                  </div>
                )}
              </div>

              {/* Connettore visuale tra fasi */}
              {index < (message.thinkingPhases?.length || 0) - 1 && (
                <div className="flex justify-center my-2">
                  <div className="w-0.5 h-8 bg-gradient-to-b from-gray-300 to-transparent"></div>
                </div>
              )}
            </div>
          ))}

          {/* Indicatore di streaming */}
          {message.isStreaming && (
            <div className="flex items-center justify-center gap-2 p-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-150"></div>
              </div>
              <span className="text-sm text-indigo-600">
                Elaborando {message.currentThinkingPhase ? getPhaseName(message.currentThinkingPhase) : ''}...
              </span>
            </div>
          )}
        </div>
      </div>
    )}
  </div>
</div>
);
}
