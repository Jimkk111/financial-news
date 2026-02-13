import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { searchNews, type SearchResultItem } from "@/services/newsService";
import { BottomNav } from "./BottomNav";

interface SearchResultsProps {
  keyword: string;
  onNewsClick: (id: number) => void;
  onBack: () => void;
  onTabChange?: (tab: string) => void;
}

export function SearchResults({ keyword, onNewsClick, onBack, onTabChange }: SearchResultsProps) {
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    performSearch();
  }, [keyword]);

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

  async function performSearch() {
    if (!keyword.trim()) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await searchNews(keyword.trim());
      setResults(response.news || []);
    } catch (error) {
      console.error('搜索新闻失败:', error);
      setError('搜索失败，请稍后重试');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/>
            <path d="m12 19-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="text-lg font-semibold">搜索结果</h1>
      </div>
      
      <div className="p-4 pb-20">
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            搜索关键词: <span className="text-gray-900 font-medium">{keyword}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            找到 {results.length} 条相关新闻
          </p>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <p className="text-gray-500">搜索中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500">{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">未找到相关新闻</p>
            <p className="text-gray-400 text-sm mt-2">请尝试使用其他关键词</p>
          </div>
        ) : (
          <div>
            {results.map((item) => (
              <div 
                key={item.id} 
                className="mb-4 bg-white cursor-pointer active:bg-gray-50 transition-colors"
                onClick={() => onNewsClick(item.id)}
              >
                <div>
                  {/* Text Content */}
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{item.source}</span>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{formatTime(item.publish_time)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="h-px bg-gray-200 mt-4" />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <BottomNav
          activeTab="home"
          onTabChange={onTabChange}
        />
      </div>
    </div>
  );
}
