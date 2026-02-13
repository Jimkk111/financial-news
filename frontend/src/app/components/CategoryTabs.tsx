import { useState, useEffect } from 'react';
import { getNewsCategories } from '@/services/newsService';

interface CategoryTabsProps {
  onCategoryChange: (categoryId: number | null) => void;
}

interface Category {
  id: number;
  name: string;
}

export function CategoryTabs({ onCategoryChange }: CategoryTabsProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoriesList = await getNewsCategories();
        setCategories(categoriesList);
      } catch (error) {
        console.error('获取分类失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (categoryId: number | null) => {
    setActiveCategory(categoryId);
    onCategoryChange(categoryId);
  };

  return (
    <div className="sticky top-[57px] z-40 bg-white border-b border-gray-200 mb-3">
      <div className="flex overflow-x-auto px-4 py-3 gap-6 scrollbar-hide">
        {/* 全部分类 */}
        <button
          key="all"
          onClick={() => handleCategoryClick(null)}
          className={`whitespace-nowrap text-sm transition-colors relative pb-1 ${
            activeCategory === null
              ? 'text-blue-600 font-medium'
              : 'text-gray-600'
          }`}
        >
          全部
          {activeCategory === null && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>

        {/* 后端获取的分类 */}
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`whitespace-nowrap text-sm transition-colors relative pb-1 ${
              activeCategory === category.id
                ? 'text-blue-600 font-medium'
                : 'text-gray-600'
            }`}
          >
            {category.name}
            {activeCategory === category.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
