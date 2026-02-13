import { useEffect } from 'react';
import { Settings, ChevronRight, Bell, Heart, FileText, HelpCircle, Shield, User, Wallet, TrendingUp, BookOpen } from 'lucide-react';
import { BottomNav } from './BottomNav';

interface ProfileProps {
  username: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onNavigateToPersonalInfo: () => void;
  onNavigateToCollection: () => void;
  onNavigateToHistory: () => void;
}

const menuSections = [
  {
    title: '我的服务',
    items: [
      { icon: Wallet, label: '我的钱包', badge: null, color: 'text-blue-600', hidden: true }, // 隐藏但不删除，后续可能会用到
      { icon: Heart, label: '我的收藏', badge: null, color: 'text-red-600' }, // 保持显示
      { icon: BookOpen, label: '阅读历史', badge: null, color: 'text-purple-600' }, // 保持显示
    ]
    // 保持显示整个"我的服务"部分
  },
  {
    title: '设置',
    items: [
      { icon: Bell, label: '消息通知', badge: null, color: 'text-orange-600', hidden: true }, // 隐藏但不删除，后续可能会用到
      { icon: Shield, label: '隐私设置', badge: null, color: 'text-indigo-600', hidden: true }, // 隐藏但不删除，后续可能会用到
      { icon: Settings, label: '账号设置', badge: null, color: 'text-gray-600', hidden: true }, // 隐藏但不删除，后续可能会用到
    ],
    hidden: true // 隐藏整个"设置"部分
  },
  {
    title: '帮助',
    items: [
      { icon: HelpCircle, label: '帮助中心', badge: null, color: 'text-blue-500', hidden: true }, // 隐藏但不删除，后续可能会用到
      { icon: FileText, label: '用户协议', badge: null, color: 'text-gray-600', hidden: true }, // 隐藏但不删除，后续可能会用到
    ],
    hidden: true // 隐藏整个"帮助"部分
  }
];

export function Profile({ username, onTabChange, onLogout, onNavigateToPersonalInfo, onNavigateToCollection, onNavigateToHistory }: ProfileProps) {
  useEffect(() => {
    if (!username) {
      onLogout();
    }
  }, [username, onLogout]);

  if (!username) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 pt-12 pb-6 px-4">
        {/* User Info */}
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={onNavigateToPersonalInfo}
            className="w-20 h-20 bg-transparent rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
          >
            <User className="text-white" size={40} />
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">{username}</h2>
          </div>
        </div>


      </div>

      {/* Menu Sections */}
      <div className="px-4 mt-4">
        {menuSections.map((section, index) => {
          // 只渲染非隐藏的部分
          if (section.hidden) return null;
          
          return (
            <div key={index} className="mb-4">
              {section.title && (
                <h3 className="text-sm font-semibold text-gray-500 mb-2 px-2">
                  {section.title}
                </h3>
              )}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {section.items.map((item, itemIndex) => {
                  // 只渲染非隐藏的菜单项
                  if (item.hidden) return null;
                  
                  const Icon = item.icon;
                  const handleClick = () => {
                    if (item.label === '我的收藏') {
                      onNavigateToCollection();
                    } else if (item.label === '阅读历史') {
                      onNavigateToHistory();
                    }
                  };
                  return (
                    <button
                      key={itemIndex}
                      className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors border-b last:border-b-0 border-gray-100"
                      onClick={handleClick}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`${item.color}`}>
                          <Icon size={22} />
                        </div>
                        <span className="text-gray-900 font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight size={18} className="text-gray-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Version Info */}
        <div className="text-center text-gray-400 text-xs mb-4">
          <p>AI金融快讯 v1.0.0</p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab="profile" onTabChange={onTabChange} />
    </div>
  );
}
