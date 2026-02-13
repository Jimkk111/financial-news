#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
新浪财经爬虫程序
功能：抓取新浪财经5类新闻数据并存储到MySQL数据库
"""

import os
import sys
import time
import json
import logging
import datetime
import requests
from html.parser import HTMLParser
import re

# 添加上级目录到系统路径，以便导入database模块
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('sina_spider.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# 数据库配置
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'password'),
    'database': os.getenv('DB_NAME', 'ai financial news')
}

# 分类映射
CATEGORY_MAP = {
    '财经要闻': 2509,
    '公司新闻': 1686,
    '政策解读': 2516,
    '市场动态': 2514,
    '国际财经': 2510
}

# 列表页API
LIST_API_URL = 'https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid={lid}&k=&num=50&page=1'

# 请求头
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9'
}

class ContentParser(HTMLParser):
    """精确的HTML解析器，只提取正文区域中的内容（包含图片）"""
    
    def __init__(self):
        super().__init__()
        self.in_content = False
        self.content_parts = []
        self.current_tag = ''
        self.current_attrs = []
        self.current_data = ''
        self.current_p_html = ''
        self.div_depth = 0
        self.target_div_found = False
        self.skip_div = False
        self.skip_depth = 0
        self.skip_content = False
        self.exclude_image_url = '//n.sinaimg.cn/finance/c30320b4/20190809/cj_sinafinance_app2x.png'
    
    def handle_starttag(self, tag, attrs):
        self.current_tag = tag
        self.current_attrs = attrs
        
        # 检查是否进入正文区域
        if tag == 'div':
            attrs_dict = dict(attrs)
            class_attr = attrs_dict.get('class', '')
            id_attr = attrs_dict.get('id', '')
            
            # 检查是否是二维码区域
            if 'appendQr_wrap' in class_attr:
                self.skip_div = True
                self.skip_depth = 1
                return
            
            # 如果正在跳过某个div，增加深度
            if self.skip_div:
                self.skip_depth += 1
                return
            
            # 只匹配最精确的正文区域：id="artibody"且class包含"article"
            if 'artibody' in id_attr and 'article' in class_attr:
                self.in_content = True
                self.div_depth = 1
                self.target_div_found = True
            elif self.in_content:
                self.div_depth += 1
        
        # 如果正在跳过div，直接返回
        if self.skip_div:
            return
        
        # 如果已经跳过内容，直接返回
        if self.skip_content:
            return
        
        # 如果在正文区域，处理标签
        if self.in_content:
            # 只保留h标签、img标签和p标签
            if tag == 'p':
                # 检查是否是article-editor段落
                attrs_dict = dict(attrs)
                class_attr = attrs_dict.get('class', '')
                if 'article-editor' in class_attr:
                    self.skip_content = True
                    return
                # 开始构建p标签的HTML
                attrs_str = ' '.join([f'{k}="{v}"' for k, v in attrs])
                if attrs_str:
                    self.current_p_html = f'<p {attrs_str}>'
                else:
                    self.current_p_html = '<p>'
                self.current_data = ''
            elif tag == 'img':
                # 检查是否是需要排除的图片
                img_src = dict(attrs).get('src', '')
                if img_src == self.exclude_image_url:
                    return
                # 提取完整的img标签
                attrs_str = ' '.join([f'{k}="{v}"' for k, v in attrs])
                img_tag = f'<img {attrs_str}>'
                self.content_parts.append(img_tag)
            elif tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                # 构建h标签的HTML
                attrs_str = ' '.join([f'{k}="{v}"' for k, v in attrs])
                if attrs_str:
                    h_html = f'<{tag} {attrs_str}>'
                else:
                    h_html = f'<{tag}>'
                self.content_parts.append(h_html)

    def handle_endtag(self, tag):
        # 处理跳过的div
        if self.skip_div:
            if tag == 'div':
                self.skip_depth -= 1
                if self.skip_depth <= 0:
                    self.skip_div = False
            return
        
        # 如果已经跳过内容，直接返回
        if self.skip_content:
            return
        
        if self.in_content:
            if tag == 'p' and self.current_data:
                # 完成p标签的HTML
                self.current_p_html += self.current_data
                self.current_p_html += '</p>'
                self.content_parts.append(self.current_p_html)
            elif tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                # 处理h标签的结束标签
                end_tag_html = f'</{tag}>'
                self.content_parts.append(end_tag_html)
            
            if tag == 'div':
                self.div_depth -= 1
                if self.div_depth <= 0:
                    self.in_content = False
        
        self.current_tag = ''

    def handle_data(self, data):
        # 如果正在跳过div，直接返回
        if self.skip_div:
            return
        
        # 如果已经跳过内容，直接返回
        if self.skip_content:
            return
        
        if self.in_content:
            if self.current_tag == 'p':
                self.current_data += data
            elif self.current_tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                # 对于h标签内的文本，直接添加
                self.content_parts.append(data)

def init_database():
    """初始化数据库表结构和分类数据"""
    try:
        # 尝试导入数据库模块
        from database_news import SessionLocal, Base, engine, NewsCategory
        
        # 创建表结构
        Base.metadata.create_all(bind=engine)
        
        # 初始化分类数据
        db = SessionLocal()
        try:
            for category_name in CATEGORY_MAP:
                slug = category_name.lower().replace(' ', '-')
                category = db.query(NewsCategory).filter_by(name=category_name).first()
                if not category:
                    category = NewsCategory(name=category_name, slug=slug)
                    db.add(category)
            db.commit()
            logger.info('数据库初始化完成')
        finally:
            db.close()
    except Exception as e:
        logger.error(f'数据库初始化失败: {e}')
        raise

def parse_detail(url):
    """解析详情页，提取正文（包含图片）"""
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        
        # 检测编码
        encoding = response.apparent_encoding
        response.encoding = encoding
        
        # 使用自定义解析器提取正文
        parser = ContentParser()
        parser.feed(response.text)
        
        # 组合内容：段落和图片
        content = '\n'.join(parser.content_parts)
        
        # 如果自定义解析器失败，尝试使用简单的字符串提取
        if not content:
            # 尝试提取<p>标签和<img>标签内容
            paragraphs = re.findall(r'<p[^>]*>(.*?)</p>', response.text, re.DOTALL)
            images = re.findall(r'<img[^>]+>', response.text)
            
            if paragraphs or images:
                content = '\n'.join([re.sub(r'<[^>]*>', '', p).strip() for p in paragraphs if re.sub(r'<[^>]*>', '', p).strip()])
                if images:
                    content += '\n' + '\n'.join(images)
        
        return content
    except Exception as e:
        logger.error(f'解析详情页 {url} 失败: {e}')
        return ''

def run_spider():
    """主爬虫逻辑"""
    logger.info('开始抓取新浪财经新闻')
    
    # 初始化数据库
    init_database()
    
    from database_news import SessionLocal, News, NewsCategory, NewsTag
    
    for category_name, lid in CATEGORY_MAP.items():
        logger.info(f'开始抓取分类: {category_name} (lid: {lid})')
        
        try:
            # 请求列表页
            list_url = LIST_API_URL.format(lid=lid)
            response = requests.get(list_url, headers=HEADERS, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if not data.get('result', {}).get('data'):
                logger.warning(f'分类 {category_name} 无数据')
                continue
            
            news_list = data['result']['data']
            logger.info(f'获取到 {len(news_list)} 条新闻')
            
            # 遍历新闻列表
            for news_item in news_list:
                try:
                    # 提取基础字段
                    title = news_item.get('title', '')
                    url = news_item.get('url', '')
                    intro = news_item.get('intro', '')
                    media_name = news_item.get('media_name', '')
                    ctime = news_item.get('ctime', '')
                    img = news_item.get('img', '')
                    keywords = news_item.get('keywords', '')
                    
                    if not url:
                        logger.warning('新闻URL为空，跳过')
                        continue
                    
                    # 去重检查
                    db = SessionLocal()
                    try:
                        existing_news = db.query(News).filter_by(url=url).first()
                        if existing_news:
                            logger.info(f'新闻已存在: {title}')
                            continue
                    finally:
                        db.close()
                    
                    # 解析详情页
                    content = parse_detail(url)
                    
                    # 校验正文长度
                    if len(content) < 50:
                        logger.warning(f'正文无效（长度小于50字）: {title}')
                        continue
                    
                    # 处理时间
                    try:
                        publish_time = datetime.datetime.fromtimestamp(int(ctime)) if ctime else datetime.datetime.now()
                    except:
                        publish_time = datetime.datetime.now()
                    
                    # 只抓取2026年1月1日0点以后的新闻
                    cutoff_date = datetime.datetime(2026, 1, 1, 0, 0, 0)
                    if publish_time < cutoff_date:
                        logger.info(f'新闻发布时间早于2026年1月1日，跳过: {title}')
                        continue
                    
                    # 处理图片
                    has_image = 1 if img else 0
                    image_url = None
                    if img:
                        if isinstance(img, dict) and 'u' in img:
                            image_url = img['u']
                        else:
                            image_url = img
                    
                    # 事务入库
                    db = SessionLocal()
                    try:
                        # 创建新闻对象
                        news = News(
                            title=title,
                            content=content,
                            summary=intro,
                            source=media_name,
                            publish_time=publish_time,
                            url=url,
                            has_image=has_image,
                            image_url=image_url
                        )
                        
                        # 添加分类
                        category = db.query(NewsCategory).filter_by(name=category_name).first()
                        if category:
                            news.categories.append(category)
                        
                        # 添加标签
                        if keywords:
                            tag_list = [tag.strip() for tag in keywords.split(',') if tag.strip()]
                            for tag_name in tag_list:
                                tag = db.query(NewsTag).filter_by(name=tag_name).first()
                                if not tag:
                                    tag = NewsTag(name=tag_name, slug=tag_name.lower().replace(' ', '-'))
                                    db.add(tag)
                                    db.flush()  # 获取tag.id
                                news.tags.append(tag)
                        
                        db.add(news)
                        db.commit()
                        logger.info(f'成功抓取新闻: {title}')
                    except Exception as e:
                        db.rollback()
                        logger.error(f'入库失败: {e}')
                    finally:
                        db.close()
                    
                    # 礼貌延时
                    time.sleep(1)
                    
                except Exception as e:
                    logger.error(f'处理新闻失败: {e}')
                    continue
            
        except Exception as e:
            logger.error(f'抓取分类 {category_name} 失败: {e}')
            continue
    
    logger.info('新浪财经新闻抓取完成')

if __name__ == '__main__':
    try:
        # 运行爬虫
        run_spider()
    except Exception as e:
        logger.error(f'程序运行失败: {e}')
