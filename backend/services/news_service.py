from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from spiders.database_news import News, NewsCategory, NewsTag, NewsCategoryRelation, NewsTagRelation
from typing import List, Optional, Dict, Any
from datetime import datetime

class NewsService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_news_list(
        self,
        page: int = 1,
        page_size: int = 20,
        category_id: Optional[int] = None,
        tag_id: Optional[int] = None,
        sort: str = "publish_time"
    ) -> Dict[str, Any]:
        query = self.db.query(News)
        
        if category_id:
            query = query.join(NewsCategoryRelation).filter(
                NewsCategoryRelation.category_id == category_id
            )
        
        if tag_id:
            query = query.join(NewsTagRelation).filter(
                NewsTagRelation.tag_id == tag_id
            )
        
        if sort == "views":
            query = query.order_by(desc(News.views))
        else:
            query = query.order_by(desc(News.publish_time))
        
        total = query.count()
        total_pages = (total + page_size - 1) // page_size
        
        news_list = query.offset((page - 1) * page_size).limit(page_size).all()
        
        return {
            "news": [self._format_news(news) for news in news_list],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages
            }
        }
    
    def get_news_by_id(self, news_id: int) -> Optional[Dict[str, Any]]:
        news = self.db.query(News).filter(News.id == news_id).first()
        if not news:
            return None
        return self._format_news_detail(news)
    
    def get_categories(self) -> List[Dict[str, Any]]:
        categories = self.db.query(NewsCategory).all()
        result = []
        for category in categories:
            news_count = self.db.query(NewsCategoryRelation).filter(
                NewsCategoryRelation.category_id == category.id
            ).count()
            result.append({
                "id": category.id,
                "name": category.name,
                "slug": category.slug,
                "news_count": news_count
            })
        return result
    
    def get_tags(self) -> List[Dict[str, Any]]:
        tags = self.db.query(NewsTag).all()
        result = []
        for tag in tags:
            news_count = self.db.query(NewsTagRelation).filter(
                NewsTagRelation.tag_id == tag.id
            ).count()
            result.append({
                "id": tag.id,
                "name": tag.name,
                "slug": tag.slug,
                "news_count": news_count
            })
        return result
    
    def search_news(
        self,
        keyword: str,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        query = self.db.query(News).filter(
            or_(
                News.title.like(f"%{keyword}%"),
                News.content.like(f"%{keyword}%")
            )
        ).order_by(desc(News.publish_time))
        
        total = query.count()
        total_pages = (total + page_size - 1) // page_size
        
        news_list = query.offset((page - 1) * page_size).limit(page_size).all()
        
        return {
            "news": [self._format_news(news) for news in news_list],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages
            }
        }
    
    def get_news_by_category(
        self,
        category_id: int,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        return self.get_news_list(page=page, page_size=page_size, category_id=category_id)
    
    def get_news_by_tag(
        self,
        tag_id: int,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        return self.get_news_list(page=page, page_size=page_size, tag_id=tag_id)
    
    def get_hot_news(self, limit: int = 10) -> List[Dict[str, Any]]:
        news_list = self.db.query(News).order_by(desc(News.views)).limit(limit).all()
        return [
            {
                "id": news.id,
                "title": news.title,
                "views": news.views,
                "has_image": news.has_image,
                "image_url": news.image_url
            }
            for news in news_list
        ]
    
    def increment_views(self, news_id: int) -> Optional[Dict[str, Any]]:
        news = self.db.query(News).filter(News.id == news_id).first()
        if not news:
            return None
        news.views += 1
        self.db.commit()
        return {
            "news_id": news.id,
            "views": news.views
        }
    
    def _format_news(self, news: News) -> Dict[str, Any]:
        return {
            "id": news.id,
            "title": news.title,
            "content": news.content,
            "source": news.source,
            "publish_time": news.publish_time.isoformat() if news.publish_time else None,
            "views": news.views,
            "has_image": news.has_image,
            "image_url": news.image_url,
            "summary": news.summary,
            "categories": [
                {
                    "id": cat.id,
                    "name": cat.name,
                    "slug": cat.slug
                }
                for cat in news.categories
            ],
            "tags": [
                {
                    "id": tag.id,
                    "name": tag.name,
                    "slug": tag.slug
                }
                for tag in news.tags
            ]
        }
    
    def _format_news_detail(self, news: News) -> Dict[str, Any]:
        return {
            "id": news.id,
            "title": news.title,
            "content": news.content,
            "source": news.source,
            "publish_time": news.publish_time.isoformat() if news.publish_time else None,
            "create_time": news.create_time.isoformat() if news.create_time else None,
            "update_time": news.update_time.isoformat() if news.update_time else None,
            "views": news.views,
            "has_image": news.has_image,
            "image_url": news.image_url,
            "summary": news.summary,
            "categories": [
                {
                    "id": cat.id,
                    "name": cat.name,
                    "slug": cat.slug
                }
                for cat in news.categories
            ],
            "tags": [
                {
                    "id": tag.id,
                    "name": tag.name,
                    "slug": tag.slug
                }
                for tag in news.tags
            ]
        }
