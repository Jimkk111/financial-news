import { Calendar } from 'lucide-react';

interface HeaderProps {
  onUserClick: () => void;
}

export function Header({ onUserClick }: HeaderProps) {
  const today = new Date().toLocaleDateString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit',
    weekday: 'short'
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">财经快讯</span>
        </div>
        
        {/* Date */}
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar size={14} />
          <span>{today}</span>
        </div>
        
        {/* User Avatar */}
        <div 
          className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-medium cursor-pointer"
          onClick={onUserClick}
        >
          用户
        </div>
      </div>
    </header>
  );
}
