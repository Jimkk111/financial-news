import { Home, Bot, User } from 'lucide-react';

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function BottomNav({ activeTab = 'home', onTabChange }: BottomNavProps) {
  const navItems = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'ai', label: 'AI助手', icon: Bot },
    { id: 'profile', label: '个人', icon: User }
  ];

  const handleTabClick = (id: string) => {
    if (onTabChange) {
      onTabChange(id);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-6 transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs ${isActive ? 'font-medium' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}