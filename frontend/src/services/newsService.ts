// 新闻服务API调用
import { API_BASE_URL } from '../config/api';
export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  publish_time: string;
  source: string;
  author?: string;
  url?: string;
  views: number;
  has_image: boolean;
  image_url?: string;
  category: Category;
  tags: Tag[];
}

export interface NewsDetail {
  id: number;
  title: string;
  summary: string;
  content: string;
  publish_time: string;
  source: string;
  author?: string;
  url?: string;
  views: number;
  has_image: boolean;
  image_url?: string;
  category: Category;
  tags: Tag[];
}

export interface NewsListResponse {
  news: NewsItem[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export interface SearchResultItem {
  id: number;
  title: string;
  summary: string;
  publish_time: string;
  source: string;
}

export interface SearchResponse {
  total: number;
  page: number;
  page_size: number;
  news: SearchResultItem[];
}

export interface HotNewsItem {
  id: number;
  title: string;
  summary: string;
  publish_time: string;
  views: number;
}

// 获取新闻列表
export async function getNewsList(
  page: number = 1,
  pageSize: number = 20,
  categoryId?: number,
  tagId?: number,
  sort: 'publish_time' | 'views' = 'publish_time'
): Promise<NewsListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
    sort
  });
  
  if (categoryId) {
    params.append('category_id', categoryId.toString());
  }
  
  if (tagId) {
    params.append('tag_id', tagId.toString());
  }
  
  const response = await fetch(`${API_BASE_URL}/api/news?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch news list');
  }
  
  const data = await response.json();
  return data.data;
}

// 获取新闻详情
export async function getNewsDetail(newsId: number): Promise<NewsDetail> {
  const response = await fetch(`${API_BASE_URL}/api/news/${newsId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch news detail');
  }
  
  const data = await response.json();
  return data.data;
}

// 增加新闻浏览量
export async function incrementNewsViews(newsId: number): Promise<{ id: number; views: number }> {
  const response = await fetch(`http://118.195.165.73:8000/api/news/${newsId}/view`, {
    method: 'POST'
  });
  
  if (!response.ok) {
    throw new Error('Failed to increment news views');
  }
  
  const data = await response.json();
  return data.data;
}

// 获取新闻分类列表
export async function getNewsCategories(): Promise<Category[]> {
  const response = await fetch(`http://118.195.165.73:8000/api/news/categories`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch news categories');
  }
  
  const data = await response.json();
  return data.data.categories;
}

// 获取新闻标签列表
export async function getNewsTags(): Promise<Tag[]> {
  const response = await fetch(`${API_BASE_URL}/api/news/tags`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch news tags');
  }
  
  const data = await response.json();
  return data.data.tags;
}

// 搜索新闻
export async function searchNews(
  keyword: string,
  page: number = 1,
  pageSize: number = 20
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    keyword,
    page: page.toString(),
    page_size: pageSize.toString()
  });
  
  try {
    const response = await fetch(`http://118.195.165.73:8000/api/news/search?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to search news');
    }
    
    const data = await response.json();
    
    if (!data || !data.data) {
      throw new Error('Invalid response format');
    }
    
    return data.data;
  } catch (error) {
    console.error('Search news error:', error);
    throw error;
  }
}

// 按分类获取新闻
export async function getNewsByCategory(
  categoryId: number,
  page: number = 1,
  pageSize: number = 20
): Promise<NewsListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  });
  
  const response = await fetch(`${API_BASE_URL}/api/news/category/${categoryId}?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch news by category');
  }
  
  const data = await response.json();
  return data.data;
}

// 按标签获取新闻
export async function getNewsByTag(
  tagId: number,
  page: number = 1,
  pageSize: number = 20
): Promise<NewsListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  });
  
  const response = await fetch(`http://118.195.165.73:8000/api/news/tag/${tagId}?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch news by tag');
  }
  
  const data = await response.json();
  return data.data;
}

// 获取热门新闻
export async function getHotNews(limit: number = 10): Promise<HotNewsItem[]> {
  const params = new URLSearchParams({
    limit: limit.toString()
  });
  
  const response = await fetch(`${API_BASE_URL}/api/news/hot?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch hot news');
  }
  
  const data = await response.json();
  return data.data.news;
}
