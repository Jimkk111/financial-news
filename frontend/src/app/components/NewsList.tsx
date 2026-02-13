import { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { getNewsList, type NewsItem as NewsType } from '@/services/newsService';

interface NewsListProps {
  onNewsClick: (id: number) => void;
  categoryId?: number | null;
}

interface NewsItem {
  id: number;
  title: string;
  source: string;
  time: string;
  hasImage: boolean;
  image: string | null;
}

export function NewsList({ onNewsClick, categoryId }: NewsListProps) {
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 当分类变化时，重置状态并重新加载新闻
    setPage(1);
    setNewsData([]);
    setHasMore(true);
  }, [categoryId]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);
        
        // 正确调用getNewsList函数，传递单独的参数
        console.log('正在获取新闻列表，参数:', { page, categoryId });
        const response = await getNewsList(
          page,
          20,
          categoryId || undefined,
          undefined,
          'publish_time'
        );
        
        console.log('获取新闻列表响应:', response);
        
        // 检查response是否存在且包含news字段
        if (!response || !Array.isArray(response.news)) {
          console.error('无效的新闻列表响应格式:', response);
          throw new Error('无效的新闻列表响应格式');
        }
        
        // 从response.news中获取新闻数据
        const formattedNews: NewsItem[] = response.news.map((news: NewsType) => ({
          id: news.id,
          title: news.title,
          source: news.source,
          time: formatTime(news.publish_time),
          hasImage: news.has_image,
          image: news.image_url || null
        }));
        
        if (page === 1) {
          setNewsData(formattedNews);
        } else {
          setNewsData(prev => [...prev, ...formattedNews]);
        }
        
        // 检查是否还有更多新闻
        setHasMore(formattedNews.length === 20);
      } catch (err) {
        console.error('获取新闻列表失败:', err);
        setError('获取新闻列表失败，请稍后重试');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchNews();
  }, [page, categoryId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          console.log('触发加载更多');
          setPage(prev => prev + 1);
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '0px 0px 200px 0px' // 提前200px触发加载
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
      console.log('开始观察滚动');
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMore, loadingMore, loading]);

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
      <div className="px-4 py-8 text-center text-gray-500">
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-8 text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="px-4 pb-20">
      {newsData.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">该分类暂无新闻</p>
          <p className="text-gray-400 text-sm mt-2">请尝试选择其他分类</p>
        </div>
      ) : (
        newsData.map((news) => (
          <div 
            key={news.id} 
            className="mb-4 bg-white cursor-pointer active:bg-gray-50 transition-colors"
            onClick={() => onNewsClick(news.id)}
          >
            <div>
              {/* Text Content */}
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                  {news.title}
                </h3>
                
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{news.source}</span>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{news.time}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Divider */}
            <div className="h-px bg-gray-200 mt-4" />
          </div>
        ))
      )}
      
      {/* Loading More Indicator */}
      {loadingMore && (
        <div className="text-center py-4 text-gray-500 text-sm">
          加载更多新闻...
        </div>
      )}
      
      {/* End of List Indicator */}
      {!hasMore && newsData.length > 0 && (
        <div className="text-center py-4 text-gray-400 text-sm">
          已加载全部新闻
        </div>
      )}
      
      {/* Observer Target */}
      <div ref={observerRef} className="h-1"></div>
    </div>
  );
}