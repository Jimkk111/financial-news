#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
36氪人工智能频道爬虫
功能：抓取36氪AI频道的新闻列表和详情页，提取完整数据并存入数据库
"""

import os
import sys
import time
import logging
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import re

# 添加上级目录到系统路径，以便导入数据库模块
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('36kr_spider.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# 基础配置
BASE_URL = 'https://www.36kr.com'
AI_CHANNEL_URL = 'https://www.36kr.com/information/AI/'

# 请求头
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9'
}

def convert_time(time_str):
    """
    处理时间字符串，转换为标准datetime
    
    Args:
        time_str: 时间字符串，如 "5分钟前", "3小时前", "昨天", "2023-10-27"
        
    Returns:
        datetime: 标准datetime对象
    """
    time_str = time_str.strip()
    
    # 处理相对时间
    if "分钟前" in time_str:
        minutes = int(re.search(r'\d+', time_str).group())
        return datetime.now() - timedelta(minutes=minutes)
    elif "小时前" in time_str:
        hours = int(re.search(r'\d+', time_str).group())
        return datetime.now() - timedelta(hours=hours)
    elif "昨天" in time_str:
        return datetime.now() - timedelta(days=1)
    elif "天前" in time_str:
        days = int(re.search(r'\d+', time_str).group())
        return datetime.now() - timedelta(days=days)
    # 处理绝对时间
    else:
        try:
            # 尝试多种日期格式
            formats = ['%Y-%m-%d', '%Y/%m/%d', '%Y年%m月%d日']
            for fmt in formats:
                try:
                    return datetime.strptime(time_str, fmt)
                except ValueError:
                    continue
            # 如果都失败，返回当前时间
            logger.warning(f'无法解析时间格式: {time_str}')
            return datetime.now()
        except Exception as e:
            logger.error(f'时间转换失败: {e}')
            return datetime.now()

def parse_detail(url):
    """
    抓取详情页，提取正文内容
    
    Args:
        url: 详情页URL
        
    Returns:
        str: 提取的正文内容（保留原始HTML标签和文本结构）
    """
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 尝试找到正文容器
        content_container = soup.find('div', class_='common-width content articleDetailContent kr-rich-text-wrapper')
        if not content_container:
            content_container = soup.find('div', class_='article-mian-content')
        
        if not content_container:
            logger.warning(f'无法找到正文容器: {url}')
            return ''
        
        # 移除噪点内容
        editor_note = content_container.find('div', class_='editor-note')
        if editor_note:
            editor_note.decompose()
        
        article_footer = content_container.find('div', class_='article-footer-txt')
        if article_footer:
            article_footer.decompose()
        
        # 提取正文内容（保留原始HTML标签）
        content_parts = []
        
        # 遍历容器内的所有子节点
        for child in content_container.children:
            if child.name == 'p':
                # 保留段落的原始HTML
                p_html = str(child)
                if p_html.strip():
                    content_parts.append(p_html)
            elif child.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                # 保留标题的原始HTML
                h_html = str(child)
                if h_html.strip():
                    content_parts.append(h_html)
            elif child.name == 'img':
                # 处理图片，保留原始HTML标签
                # 36Kr图片通常使用懒加载，优先读取data-src属性
                img_tag = child
                src = img_tag.get('src', '')
                data_src = img_tag.get('data-src', '')
                
                # 如果src是占位符，使用data-src
                if data_src and ('default' in src.lower() or 'loading' in src.lower() or not src):
                    img_tag['src'] = data_src
                
                img_html = str(img_tag)
                content_parts.append(img_html)
            elif child.name == 'div':
                # 处理div内的内容
                for sub_child in child.children:
                    if sub_child.name == 'p':
                        p_html = str(sub_child)
                        if p_html.strip():
                            content_parts.append(p_html)
                    elif sub_child.name == 'img':
                        # 处理图片，保留原始HTML标签
                        img_tag = sub_child
                        src = img_tag.get('src', '')
                        data_src = img_tag.get('data-src', '')
                        
                        # 如果src是占位符，使用data-src
                        if data_src and ('default' in src.lower() or 'loading' in src.lower() or not src):
                            img_tag['src'] = data_src
                        
                        img_html = str(img_tag)
                        content_parts.append(img_html)
        
        # 用\n拼接内容，保留段落结构
        content = '\n'.join(content_parts)
        
        # 清理多余的空白
        content = re.sub(r'\n{2,}', '\n', content)
        
        return content
    except Exception as e:
        logger.error(f'解析详情页失败: {url}, 错误: {e}')
        return ''

def crawl_36kr_ai():
    """
    主函数：抓取36氪AI频道的新闻
    """
    logger.info('开始抓取36氪人工智能频道新闻')
    
    # 初始化数据库连接
    try:
        from spiders.database_news import SessionLocal, News, NewsCategory, NewsCategoryRelation
        db = SessionLocal()
    except Exception as e:
        logger.error(f'数据库连接失败: {e}')
        return
    
    try:
        # 确保AI分类存在
        ai_category = db.query(NewsCategory).filter_by(name='人工智能').first()
        if not ai_category:
            ai_category = NewsCategory(name='人工智能', slug='ai_news')
            db.add(ai_category)
            db.commit()
            db.refresh(ai_category)
        ai_category_id = ai_category.id
        logger.info(f'AI分类ID: {ai_category_id}')
        
        # 抓取列表页
        response = requests.get(AI_CHANNEL_URL, headers=HEADERS, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 查找所有新闻项
        news_items = soup.find_all(class_='information-flow-item')
        logger.info(f'找到 {len(news_items)} 条新闻')
        
        for item in news_items:
            try:
                # 提取标题和URL
                title_elem = item.find('a', class_='article-item-title')
                if not title_elem:
                    continue
                
                title = title_elem.get_text(strip=True)
                url = title_elem.get('href', '')
                
                # 补全URL
                if url and not url.startswith('http'):
                    url = BASE_URL + url
                
                # 提取摘要
                summary_elem = item.find('a', class_='article-item-description')
                summary = summary_elem.get_text(strip=True) if summary_elem else ''
                
                # 提取来源
                source_elem = item.find('a', class_='kr-flow-bar-author')
                source = source_elem.get_text(strip=True) if source_elem else '36氪'
                
                # 提取发布时间
                time_elem = item.find('span', class_='kr-flow-bar-time')
                time_str = time_elem.get_text(strip=True) if time_elem else ''
                publish_time = convert_time(time_str)
                
                # 检查是否已存在
                existing_news = db.query(News).filter_by(url=url).first()
                if existing_news:
                    logger.info(f'新闻已存在: {title}')
                    continue
                
                # 抓取详情页正文
                content = parse_detail(url)
                
                # 校验正文长度
                if len(content) < 50:
                    logger.warning(f'正文过短，跳过: {title}')
                    continue
                
                # 创建新闻对象
                news = News(
                    title=title,
                    content=content,
                    summary=summary,
                    source=source,
                    publish_time=publish_time,
                    url=url,
                    has_image=1 if '<img' in content else 0,
                    image_url=None  # 36氪图片使用懒加载，这里不提取具体图片URL
                )
                
                # 添加分类关联
                news.categories.append(ai_category)
                
                # 保存到数据库
                db.add(news)
                db.commit()
                logger.info(f'成功抓取新闻: {title}')
                
                # 礼貌延时
                time.sleep(2)
                
            except Exception as e:
                logger.error(f'处理新闻失败: {e}')
                db.rollback()
                continue
        
        logger.info('36氪人工智能频道新闻抓取完成')
        
    except Exception as e:
        logger.error(f'抓取过程失败: {e}')
    finally:
        db.close()

if __name__ == '__main__':
    try:
        crawl_36kr_ai()
    except Exception as e:
        logger.error(f'程序运行失败: {e}')
