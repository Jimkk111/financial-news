import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Clock, Eye, Trash2 } from 'lucide-react';
import { getFavorites, removeFavorite } from '@/services/userService';

interface CollectionProps {
  onBack: () => void;
  onNewsClick: (id: number) => void;
  userId: string;
}

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  source: string;
  publish_time: string;
  image_url: string | null;
  has_image: boolean;
  views: number;
  favorited_at?: string;
  viewed_at?: string;
}

interface PaginationInfo {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

interface CollectionState {
  items: NewsItem[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
}

export function Collection({ onBack, onNewsClick, userId }: CollectionProps) {
  const [state, setState] = useState<CollectionState>({
    items: [],
    loading: true,
    error: null,
    pagination: {
      page: 1,
      page_size: 20,
      total: 0,
      total_pages: 1
    }
  });

  const formatTime = (timeString: string): string => {
    const now = new Date();
    const time = new Date(timeString);
    const diffMs = now.getTime() - time.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}天前`;
    } else if (diffHours > 0) {
      return `${diffHours}小时前`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}分钟前`;
    }
  };

  // 获取收藏列表
  const fetchFavorites = async () => {
    if (!userId) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: '用户未登录'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      const response = await getFavorites(userId, state.pagination.page, state.pagination.page_size);
      
      if (response.success && response.data) {
        setState({
          items: response.data.news,
          loading: false,
          error: null,
          pagination: response.data.pagination
        });
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error?.message || '获取收藏列表失败'
        }));
      }
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: '网络错误，请稍后重试'
      }));
    }
  };

  // 取消收藏
  const handleRemoveFavorite = async (newsId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发新闻点击

    if (!userId) return;

    try {
      const response = await removeFavorite(userId, newsId);
      
      if (response.success) {
        // 从列表中移除该新闻
        setState(prev => ({
          ...prev,
          items: prev.items.filter(item => item.id !== newsId),
          pagination: {
            ...prev.pagination,
            total: Math.max(0, prev.pagination.total - 1)
          }
        }));
      } else {
        console.error('取消收藏失败:', response.error?.message);
      }
    } catch (error) {
      console.error('取消收藏失败:', error);
    }
  };

  // 初始加载和userId变化时重新加载
  useEffect(() => {
    fetchFavorites();
  }, [userId, state.pagination.page, state.pagination.page_size]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
          <button 
            onClick={onBack} 
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="font-medium">我的收藏</span>
          <div className="w-8"></div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-14 pb-16">
        {state.loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">加载中...</div>
          </div>
        ) : state.error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">{state.error}</div>
          </div>
        ) : state.items.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {state.items.map((item) => (
              <div 
                key={item.id} 
                className="bg-white p-4 hover:bg-gray-50 transition-colors"
                onClick={() => onNewsClick(item.id)}
              >
                <div className="flex flex-col gap-3">
                  {/* Title */}
                  <h3 className="text-base font-medium text-gray-900 leading-relaxed">
                    {item.title}
                  </h3>
                  
                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="text-blue-600">{item.source}</span>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{formatTime(item.publish_time)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye size={12} />
                        <span>{item.views} 阅读</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleRemoveFavorite(item.id, e)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="取消收藏"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  

                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <Heart className="text-gray-300" size={48} />
            <p className="text-gray-500 mt-3">暂无收藏内容</p>
            <p className="text-gray-400 text-sm mt-1">收藏的新闻会显示在这里</p>
          </div>
        )}
      </main>
    </div>
  );
}
