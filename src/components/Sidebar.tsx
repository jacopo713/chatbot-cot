import { ChatSession } from '@/types/chat';
import { Plus, MessageSquare, Trash2, Menu } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export default function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Oggi';
    if (days === 1) return 'Ieri';
    if (days < 7) return `${days} giorni fa`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`
      bg-neutral-50 border-r border-neutral-200 h-full flex flex-col
      transition-all duration-200 ease-in-out
      ${isCollapsed ? 'w-16' : 'w-80'}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <Menu className="w-5 h-5 text-neutral-600" />
          </button>
          
          {!isCollapsed && (
            <button
              onClick={onNewChat}
              className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuova Chat
            </button>
          )}
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {isCollapsed ? (
          <div className="p-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`
                  w-full p-3 mb-2 rounded-md transition-colors group
                  ${currentSessionId === session.id 
                    ? 'bg-primary-100 border-l-4 border-primary-600' 
                    : 'hover:bg-neutral-100'
                  }
                `}
              >
                <MessageSquare className="w-5 h-5 text-neutral-600 mx-auto" />
              </button>
            ))}
          </div>
        ) : (
          <div className="p-2">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p>Nessuna chat ancora</p>
                <p className="text-sm">Inizia una nuova conversazione</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`
                    group mb-2 rounded-md transition-colors cursor-pointer
                    ${currentSessionId === session.id 
                      ? 'bg-primary-50 border-l-4 border-primary-600' 
                      : 'hover:bg-neutral-100'
                    }
                  `}
                  onClick={() => onSelectSession(session.id)}
                >
                  <div className="p-3 flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-neutral-500 mt-1 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-800 truncate">
                            {session.title}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            {formatDate(session.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
