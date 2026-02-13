import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Eye, BookmarkPlus, TrendingUp, Heart, HeartOff } from 'lucide-react';
import { getNewsDetail, incrementNewsViews, News as NewsType } from '@/services/newsService';
import { addHistory, addFavorite, removeFavorite, checkFavorite } from '@/services/userService';

interface NewsDetailProps {
  newsId: number;
  onBack: () => void;
  userId: number;
}

export function NewsDetail({ newsId, onBack, userId }: NewsDetailProps) {
  const [news, setNews] = useState<NewsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriting, setFavoriting] = useState(false);

  // 添加浏览历史
  const addNewsHistory = async () => {
    if (!userId) return;

    // 检查本地存储，避免重复添加
    const historyKey = `history_${userId}_${newsId}`;
    const hasAddedHistory = localStorage.getItem(historyKey);
    
    if (hasAddedHistory) {
      console.log('新闻已添加到浏览历史，跳过重复添加');
      return;
    }

    try {
      const response = await addHistory(userId, newsId);
      
      if (response.success) {
        // 添加成功后，在本地存储中标记
        localStorage.setItem(historyKey, 'true');
        // 设置过期时间，24小时后可以重新添加
        setTimeout(() => {
          localStorage.removeItem(historyKey);
        }, 24 * 60 * 60 * 1000);
      }
    } catch (error) {
      console.error('添加浏览历史失败:', error);
    }
  };

  // 检查收藏状态
  const checkFavoritedStatus = async () => {
    if (!userId) return;

    try {
      const response = await checkFavorite(userId, newsId);
      if (response.success && response.data) {
        setIsFavorited(response.data.is_favorite);
      }
    } catch (error) {
      console.error('检查收藏状态失败:', error);
    }
  };

  // 切换收藏状态
  const toggleFavorite = async () => {
    if (!userId || favoriting) return;

    setFavoriting(true);

    try {
      if (isFavorited) {
        // 取消收藏
        const response = await removeFavorite(userId, newsId);
        if (response.success) {
          setIsFavorited(false);
        }
      } else {
        // 添加收藏
        const response = await addFavorite(userId, newsId);
        if (response.success) {
          setIsFavorited(true);
        }
      }
    } catch (error) {
      console.error('切换收藏状态失败:', error);
    } finally {
      setFavoriting(false);
    }
  };

  useEffect(() => {
    const fetchNewsDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const newsDetail = await getNewsDetail(newsId);
        setNews(newsDetail);
        
        try {
          await incrementNewsViews(newsId);
        } catch (viewError) {
          console.error('增加阅读量失败:', viewError);
        }
        
        // 添加浏览历史
        await addNewsHistory();
        
        // 检查收藏状态
        await checkFavoritedStatus();
      } catch (err) {
        console.error('获取新闻详情失败:', err);
        setError('获取新闻详情失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    fetchNewsDetail();
  }, [newsId, userId]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error || '新闻不存在'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-medium">新闻详情</span>
          <div className="flex items-center gap-2">
            <button 
              className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${isFavorited ? 'text-red-500' : 'text-gray-500'}`}
              onClick={toggleFavorite}
              disabled={!userId || favoriting}
              title={isFavorited ? '取消收藏' : '添加收藏'}
            >
              {isFavorited ? <Heart size={20} fill="currentColor" /> : <Heart size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-14">
        {/* Title Section */}
        <div className="bg-white px-4 py-5">
          <h1 className="text-xl font-semibold text-gray-900 mb-4 leading-relaxed">
            {news.title}
          </h1>
          
          {/* Meta Info */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
            <span className="text-blue-600">{news.source}</span>
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{formatTime(news.publish_time)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Eye size={12} />
              <span>{news.views} 阅读</span>
            </div>
          </div>
        </div>



        {/* Article Content */}
        <article className="bg-white px-4 py-5 mt-2">
          <div 
            className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: news.content }}
            style={{
              fontSize: '15px',
              lineHeight: '1.8',
              textAlign: 'justify'
            }}
          />
        </article>

        {/* Tags */}
        {news.tags && news.tags.length > 0 && (
          <div className="bg-white px-4 py-4 mt-2">
            <div className="flex flex-wrap gap-2">
              {news.tags.map((tag) => (
                <span 
                  key={tag.id}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
