from sqlalchemy import create_engine, Column, String, Text, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
import pymysql
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 获取数据库配置
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_NAME = "ai financial news" # 部署前改为ai_financial_news

# 先连接到MySQL服务器（不指定数据库）
def create_database_if_not_exists():
    try:
        # 连接到MySQL服务器
        connection = pymysql.connect(
            host=DB_HOST,
            port=int(DB_PORT),
            user=DB_USER,
            password=DB_PASSWORD,
            charset='utf8mb4'
        )
        
        # 创建游标
        cursor = connection.cursor()
        
        # 检查数据库是否存在
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        
        # 提交并关闭
        connection.commit()
        cursor.close()
        connection.close()
    except Exception as e:
        raise

# 创建数据库（如果不存在）
create_database_if_not_exists()

# 创建数据库连接字符串
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# 创建数据库引擎
engine = create_engine(DATABASE_URL)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建基类
Base = declarative_base()

# 新闻表
class News(Base):
    __tablename__ = "news"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    source = Column(String(100), nullable=False)
    publish_time = Column(DateTime, nullable=False)
    create_time = Column(DateTime, default=datetime.utcnow)
    update_time = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    views = Column(Integer, default=0)
    has_image = Column(Boolean, default=False)
    image_url = Column(String(500))
    summary = Column(String(500))
    url = Column(String(500), unique=True)
    
    categories = relationship("NewsCategory", secondary="news_category_relation", back_populates="news_list")
    tags = relationship("NewsTag", secondary="news_tag_relation", back_populates="news_list")

# 新闻分类表
class NewsCategory(Base):
    __tablename__ = "news_categories"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)
    slug = Column(String(50), nullable=False, unique=True)
    
    news_list = relationship("News", secondary="news_category_relation", back_populates="categories")

# 新闻标签表
class NewsTag(Base):
    __tablename__ = "news_tags"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False, unique=True)
    slug = Column(String(50), nullable=False, unique=True)
    
    news_list = relationship("News", secondary="news_tag_relation", back_populates="tags")

# 新闻分类关系表
class NewsCategoryRelation(Base):
    __tablename__ = "news_category_relation"
    
    news_id = Column(Integer, ForeignKey("news.id", ondelete="CASCADE"), primary_key=True)
    category_id = Column(Integer, ForeignKey("news_categories.id", ondelete="CASCADE"), primary_key=True)

# 新闻标签关系表
class NewsTagRelation(Base):
    __tablename__ = "news_tag_relation"
    
    news_id = Column(Integer, ForeignKey("news.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(Integer, ForeignKey("news_tags.id", ondelete="CASCADE"), primary_key=True)

# 用户表
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(100), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    avatar = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    favorites = relationship("UserNewsFavorites", back_populates="user", cascade="all, delete-orphan")
    history = relationship("UserNewsHistory", back_populates="user", cascade="all, delete-orphan")

# 新闻收藏表
class UserNewsFavorites(Base):
    __tablename__ = "user_news_favorites"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    news_id = Column(Integer, ForeignKey("news.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="favorites")
    news = relationship("News")

# 新闻浏览历史表
class UserNewsHistory(Base):
    __tablename__ = "user_news_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    news_id = Column(Integer, ForeignKey("news.id", ondelete="CASCADE"))
    viewed_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="history")
    news = relationship("News")

# 会话表
class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title = Column(String(200), default="新会话")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan", order_by="Message.created_at")
    user = relationship("User", back_populates="sessions")

# 消息表
class Message(Base):
    __tablename__ = "messages"
    
    id = Column(String(36), primary_key=True, index=True)
    session_id = Column(String(36), ForeignKey("sessions.id"), index=True)
    role = Column(String(20))
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("Session", back_populates="messages")

# 数据库初始化函数
def init_db():
    Base.metadata.create_all(bind=engine)

# 获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
