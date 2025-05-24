import { SpecialistProfile } from '@/types/specialists';
import { Brain, Code, Lightbulb, CheckCircle, Heart } from 'lucide-react';

interface SpecialistIndicatorProps {
  specialist: SpecialistProfile;
}

const getSpecialistIcon = (id: string) => {
  switch (id) {
    case 'analytic-technical':
      return <Code className="w-4 h-4" />;
    case 'creative-ideator':
      return <Lightbulb className="w-4 h-4" />;
    case 'critical-verifier':
      return <CheckCircle className="w-4 h-4" />;
    case 'empathetic-facilitator':
      return <Heart className="w-4 h-4" />;
    default:
      return <Brain className="w-4 h-4" />;
  }
};

const getSpecialistColor = (id: string) => {
  switch (id) {
    case 'analytic-technical':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'creative-ideator':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'critical-verifier':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'empathetic-facilitator':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    default:
      return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  }
};

export default function SpecialistIndicator({ specialist }: SpecialistIndicatorProps) {
  const colorClasses = getSpecialistColor(specialist.id);
  const icon = getSpecialistIcon(specialist.id);

  return (
    <div className={`
      inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs
      border ${colorClasses} font-medium
    `}>
      {icon}
      <span>{specialist.name}</span>
      <span className="text-xs opacity-75">({specialist.mbti})</span>
    </div>
  );
}
