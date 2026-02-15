from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from spiders.database_news import User, UserNewsFavorites, UserNewsHistory, News, Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import hashlib
from extensions import bcrypt

class UserService:
    def __init__(self, db: Session):
        self.db = db
    
    def register_user(self, username: str, email: str, password: str, avatar: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        用户注册
        
        Args:
            username: 用户名
            email: 邮箱
            password: 密码
            avatar: 头像URL（可选）
            
        Returns:
            用户信息字典，如果注册失败则返回None
        """
        # 检查用户名是否已存在
        existing_user = self.db.query(User).filter(
            or_(User.username == username, User.email == email)
        ).first()
        
        if existing_user:
            return None
        
        # 密码哈希
        password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
        
        # 创建用户
        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            avatar=avatar
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar": user.avatar,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """
        用户认证
        
        Args:
            username: 用户名或邮箱
            password: 密码
            
        Returns:
            用户信息字典，如果认证失败则返回None
        """
        # 查找用户
        user = self.db.query(User).filter(
            or_(User.username == username, User.email == username)
        ).first()
        
        if not user:
            return None
        
        # 验证密码
        if not bcrypt.check_password_hash(user.password_hash, password):
            return None
        
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar": user.avatar,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    

    def add_favorite(self, user_id: int, news_id: int) -> bool:
        """
        添加收藏
        
        Args:
            user_id: 用户ID
            news_id: 新闻ID
            
        Returns:
            是否成功添加
        """
        # 检查是否已收藏
        existing = self.db.query(UserNewsFavorites).filter(
            UserNewsFavorites.user_id == user_id,
            UserNewsFavorites.news_id == news_id
        ).first()
        
        if existing:
            return False
        
        # 添加收藏
        favorite = UserNewsFavorites(user_id=user_id, news_id=news_id)
        self.db.add(favorite)
        self.db.commit()
        
        return True
    
    def remove_favorite(self, user_id: int, news_id: int) -> bool:
        """
        取消收藏
        
        Args:
            user_id: 用户ID
            news_id: 新闻ID
            
        Returns:
            是否成功取消
        """
        favorite = self.db.query(UserNewsFavorites).filter(
            UserNewsFavorites.user_id == user_id,
            UserNewsFavorites.news_id == news_id
        ).first()
        
        if not favorite:
            return False
        
        self.db.delete(favorite)
        self.db.commit()
        
        return True
    
    def get_favorites(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """
        获取用户收藏列表
        
        Args:
            user_id: 用户ID
            page: 页码
            page_size: 每页数量
            
        Returns:
            收藏列表和分页信息
        """
        query = self.db.query(UserNewsFavorites).filter(
            UserNewsFavorites.user_id == user_id
        ).order_by(desc(UserNewsFavorites.created_at))
        
        total = query.count()
        total_pages = (total + page_size - 1) // page_size
        
        favorites = query.offset((page - 1) * page_size).limit(page_size).all()
        
        # 获取新闻详情
        news_list = []
        for fav in favorites:
            if fav.news:
                news_list.append({
                    "id": fav.news.id,
                    "title": fav.news.title,
                    "content": fav.news.content,
                    "source": fav.news.source,
                    "publish_time": fav.news.publish_time.isoformat() if fav.news.publish_time else None,
                    "views": fav.news.views,
                    "has_image": fav.news.has_image,
                    "image_url": fav.news.image_url,
                    "summary": fav.news.summary,
                    "favorited_at": fav.created_at.isoformat() if fav.created_at else None
                })
        
        return {
            "news": news_list,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages
            }
        }
    
    def is_favorite(self, user_id: int, news_id: int) -> bool:
        """
        检查是否已收藏
        
        Args:
            user_id: 用户ID
            news_id: 新闻ID
            
        Returns:
            是否已收藏
        """
        favorite = self.db.query(UserNewsFavorites).filter(
            UserNewsFavorites.user_id == user_id,
            UserNewsFavorites.news_id == news_id
        ).first()
        
        return favorite is not None
    
    def add_history(self, user_id: int, news_id: int) -> bool:
        """
        添加浏览历史
        
        Args:
            user_id: 用户ID
            news_id: 新闻ID
            
        Returns:
            是否成功添加
        """
        # 添加浏览历史
        history = UserNewsHistory(user_id=user_id, news_id=news_id)
        self.db.add(history)
        self.db.commit()
        
        return True
    
    def get_history(self, user_id: int, page: int = 1, page_size: int = 20) -> Dict[str, Any]:
        """
        获取用户浏览历史
        
        Args:
            user_id: 用户ID
            page: 页码
            page_size: 每页数量
            
        Returns:
            浏览历史列表和分页信息
        """
        query = self.db.query(UserNewsHistory).filter(
            UserNewsHistory.user_id == user_id
        ).order_by(desc(UserNewsHistory.viewed_at))
        
        total = query.count()
        total_pages = (total + page_size - 1) // page_size
        
        history_list = query.offset((page - 1) * page_size).limit(page_size).all()
        
        # 获取新闻详情
        news_list = []
        for hist in history_list:
            if hist.news:
                news_list.append({
                    "id": hist.news.id,
                    "title": hist.news.title,
                    "content": hist.news.content,
                    "source": hist.news.source,
                    "publish_time": hist.news.publish_time.isoformat() if hist.news.publish_time else None,
                    "views": hist.news.views,
                    "has_image": hist.news.has_image,
                    "image_url": hist.news.image_url,
                    "summary": hist.news.summary,
                    "viewed_at": hist.viewed_at.isoformat() if hist.viewed_at else None
                })
        
        return {
            "news": news_list,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages
            }
        }
    
    def get_user_sessions(self, user_id: int) -> List[Dict[str, Any]]:
        """
        获取用户的会话列表
        
        Args:
            user_id: 用户ID
            
        Returns:
            会话列表
        """
        sessions = self.db.query(Session).filter(
            Session.user_id == user_id
        ).order_by(desc(Session.updated_at)).all()
        
        return [
            {
                "session_id": session.id,
                "title": session.title,
                "created_at": session.created_at.isoformat() if session.created_at else None,
                "updated_at": session.updated_at.isoformat() if session.updated_at else None
            }
            for session in sessions
        ]
