import { AlertTriangle, X, RefreshCw } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  onClose: () => void;
  onRetry?: () => void;
}

export default function ErrorDisplay({ error, onClose, onRetry }: ErrorDisplayProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-800 text-sm">{error}</p>
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Riprova
              </button>
            )}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded transition-colors"
            >
              <X className="w-3 h-3" />
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
