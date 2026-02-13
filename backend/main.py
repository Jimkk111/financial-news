from flask import Flask, request, jsonify, Response, stream_with_context
import os
from dotenv import load_dotenv
from services.ai_service import AIService
from services.news_service import NewsService
from services.user_service import UserService
from spiders.database_news import get_db, News, NewsCategory, NewsTag

# 加载环境变量
load_dotenv()

# 创建 Flask 应用
app = Flask(__name__)

# 初始化 AI 服务
ai_service = AIService()

# 配置 CORS
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response

# 错误处理
def error_response(code: str, message: str):
    return jsonify({
        "success": False,
        "error": {
            "code": code,
            "message": message
        }
    })

def success_response(data):
    return jsonify({
        "success": True,
        "data": data
    })

# 根路径
@app.route('/')
def read_root():
    return jsonify({"message": "hi~"})

# 健康检查
@app.route('/health')
def health_check():
    return jsonify({"status": "healthy"})

# ==================== AI 助手接口 ====================

# 生成 AI 响应接口
@app.route('/api/generate', methods=['POST'])
def generate_response():
    data = request.json
    prompt = data.get('prompt')
    if not prompt:
        return error_response("INVALID_PARAMETER", "Prompt is required")
    return success_response(ai_service.generate_response(prompt))

# 创建会话接口
@app.route('/api/session/create', methods=['POST'])
def create_session():
    data = request.json
    user_id = data.get('user_id') if data else None
    session_id = ai_service.create_session(user_id)
    return success_response({"session_id": session_id})

# 获取会话接口
@app.route('/api/session/<session_id>')
def get_session(session_id):
    user_id = request.args.get('user_id', type=int)
    messages = ai_service.get_session(session_id, user_id)
    if messages is None:
        return error_response("SESSION_NOT_FOUND", "Session not found or not owned by user")
    return success_response({"messages": messages})

# 删除会话接口
@app.route('/api/session/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    user_id = request.args.get('user_id', type=int)
    result = ai_service.delete_session(session_id, user_id)
    if "error" in result:
        return error_response("SESSION_ERROR", result["error"])
    return success_response(result)

# 删除会话内消息接口
@app.route('/api/session/<session_id>/message/<int:message_index>', methods=['DELETE'])
def delete_message(session_id, message_index):
    user_id = request.args.get('user_id', type=int)
    result = ai_service.delete_message(session_id, message_index, user_id)
    if "error" in result:
        return error_response("SESSION_ERROR", result["error"])
    return success_response(result)

# 获取会话列表接口
@app.route('/api/sessions')
def get_sessions():
    user_id = request.args.get('user_id', type=int)
    return success_response(ai_service.get_sessions(user_id))

# 更新会话标题接口
@app.route('/api/session/<session_id>/title', methods=['PUT'])
def update_session_title(session_id):
    data = request.json
    title = data.get('title')
    user_id = data.get('user_id')
    if not title:
        return error_response("INVALID_PARAMETER", "Title is required")
    result = ai_service.update_session_title(session_id, title, user_id)
    if "error" in result:
        return error_response("SESSION_ERROR", result["error"])
    return success_response(result)

# 聊天完成接口
@app.route('/api/chat', methods=['POST'])
def chat_completion():
    data = request.json
    messages = data.get('messages')
    session_id = data.get('session_id')
    stream = data.get('stream', False)
    user_id = data.get('user_id')
    if not messages:
        return error_response("INVALID_PARAMETER", "Messages is required")
    
    if stream:
        @stream_with_context
        def generate():
            for chunk in ai_service.chat_completion(messages, session_id, stream=True, user_id=user_id):
                import json
                yield json.dumps(chunk) + '\n'
        return Response(generate(), mimetype='application/json')
    else:
        result = ai_service.chat_completion(messages, session_id, stream=False, user_id=user_id)
        # 检查result是否为字典（非流式响应）
        if isinstance(result, dict):
            if "error" in result:
                return error_response("SESSION_ERROR", result["error"])
            return success_response(result)
        # 检查result是否为可迭代对象（可能的其他情况）
        elif hasattr(result, '__iter__'):
            for item in result:
                return success_response(item)
        return error_response("NO_RESPONSE", "No response generated")

# ==================== 新闻接口 ====================

# 获取新闻列表
@app.route('/api/news')
def get_news_list():
    try:
        db = next(get_db())
        news_service = NewsService(db)
        
        page = int(request.args.get('page', 1))
        page_size = min(int(request.args.get('page_size', 20)), 100)
        category_id = request.args.get('category_id', type=int)
        tag_id = request.args.get('tag_id', type=int)
        sort = request.args.get('sort', 'publish_time')
        
        if page < 1:
            return error_response("INVALID_PARAMETER", "Page must be greater than 0")
        if page_size < 1:
            return error_response("INVALID_PARAMETER", "Page size must be greater than 0")
        if sort not in ['publish_time', 'views']:
            return error_response("INVALID_PARAMETER", "Sort must be 'publish_time' or 'views'")
        
        result = news_service.get_news_list(
            page=page,
            page_size=page_size,
            category_id=category_id,
            tag_id=tag_id,
            sort=sort
        )
        return success_response(result)
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

# 获取单条新闻详情
@app.route('/api/news/<int:news_id>')
def get_news_detail(news_id):
    try:
        db = next(get_db())
        news_service = NewsService(db)
        
        news = news_service.get_news_by_id(news_id)
        if not news:
            return error_response("NEWS_NOT_FOUND", "News not found")
        
        return success_response(news)
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

# 获取新闻分类列表
@app.route('/api/news/categories')
def get_categories():
    try:
        db = next(get_db())
        news_service = NewsService(db)
        
        categories = news_service.get_categories()
        return success_response({"categories": categories})
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

# 获取新闻标签列表
@app.route('/api/news/tags')
def get_tags():
    try:
        db = next(get_db())
        news_service = NewsService(db)
        
        tags = news_service.get_tags()
        return success_response({"tags": tags})
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

# 搜索新闻
@app.route('/api/news/search')
def search_news():
    try:
        db = next(get_db())
        news_service = NewsService(db)
        
        keyword = request.args.get('keyword')
        if not keyword:
            return error_response("INVALID_PARAMETER", "Keyword is required")
        
        page = int(request.args.get('page', 1))
        page_size = min(int(request.args.get('page_size', 20)), 100)
        
        result = news_service.search_news(
            keyword=keyword,
            page=page,
            page_size=page_size
        )
        return success_response(result)
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

# 按分类获取新闻
@app.route('/api/news/category/<int:category_id>')
def get_news_by_category(category_id):
    try:
        db = next(get_db())
        news_service = NewsService(db)
        
        page = int(request.args.get('page', 1))
        page_size = min(int(request.args.get('page_size', 20)), 100)
        
        result = news_service.get_news_by_category(
            category_id=category_id,
            page=page,
            page_size=page_size
        )
        return success_response(result)
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

# 按标签获取新闻
@app.route('/api/news/tag/<int:tag_id>')
def get_news_by_tag(tag_id):
    try:
        db = next(get_db())
        news_service = NewsService(db)
        
        page = int(request.args.get('page', 1))
        page_size = min(int(request.args.get('page_size', 20)), 100)
        
        result = news_service.get_news_by_tag(
            tag_id=tag_id,
            page=page,
            page_size=page_size
        )
        return success_response(result)
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

# 获取热门新闻
@app.route('/api/news/hot')
def get_hot_news():
    try:
        db = next(get_db())
        news_service = NewsService(db)
        
        limit = min(int(request.args.get('limit', 10)), 20)
        
        news = news_service.get_hot_news(limit=limit)
        return success_response({"news": news})
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

# 增加新闻阅读量
@app.route('/api/news/<int:news_id>/view', methods=['POST'])
def increment_news_views(news_id):
    try:
        db = next(get_db())
        news_service = NewsService(db)
        
        result = news_service.increment_views(news_id)
        if not result:
            return error_response("NEWS_NOT_FOUND", "News not found")
        
        return success_response(result)
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

# ==================== 用户接口 ====================

# 用户注册接口
@app.route('/api/user/register', methods=['POST'])
def register_user():
    try:
        db = next(get_db())
        user_service = UserService(db)
        
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        avatar = data.get('avatar')
        
        if not username or not email or not password:
            return error_response("INVALID_PARAMETER", "Username, email and password are required")
        
        result = user_service.register_user(username, email, password, avatar)
        if not result:
            return error_response("USER_EXISTS", "Username or email already exists")
        
        return success_response(result)
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

# 用户登录接口
@app.route('/api/user/login', methods=['POST'])
def login_user():
    try:
        db = next(get_db())
        user_service = UserService(db)
        
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return error_response("INVALID_PARAMETER", "Username and password are required")
        
        result = user_service.authenticate_user(username, password)
        if not result:
            return error_response("INVALID_CREDENTIALS", "Invalid username or password")
        
        return success_response(result)
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()



# 添加收藏接口
@app.route('/api/user/<int:user_id>/favorites', methods=['POST'])
def add_favorite(user_id):
    try:
        db = next(get_db())
        user_service = UserService(db)
        
        data = request.json
        news_id = data.get('news_id')
        
        if not news_id:
            return error_response("INVALID_PARAMETER", "News ID is required")
        
        result = user_service.add_favorite(user_id, news_id)
        if not result:
            return error_response("ALREADY_FAVORITED", "News already favorited")
        
        return success_response({"message": "Favorite added successfully"})
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

# 取消收藏接口
@app.route('/api/user/<int:user_id>/favorites/<int:news_id>', methods=['DELETE'])
def remove_favorite(user_id, news_id):
    try:
        db = next(get_db())
        user_service = UserService(db)
        
        result = user_service.remove_favorite(user_id, news_id)
        if not result:
            return error_response("NOT_FAVORITED", "News not in favorites")
        
        return success_response({"message": "Favorite removed successfully"})
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

# 获取收藏列表接口
@app.route('/api/user/<int:user_id>/favorites')
def get_favorites(user_id):
    try:
        db = next(get_db())
        user_service = UserService(db)
        
        page = int(request.args.get('page', 1))
        page_size = min(int(request.args.get('page_size', 20)), 100)
        
        result = user_service.get_favorites(user_id, page, page_size)
        return success_response(result)
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

# 检查是否收藏接口
@app.route('/api/user/<int:user_id>/favorites/<int:news_id>/check')
def check_favorite(user_id, news_id):
    try:
        db = next(get_db())
        user_service = UserService(db)
        
        result = user_service.is_favorite(user_id, news_id)
        return success_response({"is_favorite": result})
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

# 添加浏览历史接口
@app.route('/api/user/<int:user_id>/history', methods=['POST'])
def add_history(user_id):
    try:
        db = next(get_db())
        user_service = UserService(db)
        
        data = request.json
        news_id = data.get('news_id')
        
        if not news_id:
            return error_response("INVALID_PARAMETER", "News ID is required")
        
        user_service.add_history(user_id, news_id)
        return success_response({"message": "History added successfully"})
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

# 获取浏览历史接口
@app.route('/api/user/<int:user_id>/history')
def get_history(user_id):
    try:
        db = next(get_db())
        user_service = UserService(db)
        
        page = int(request.args.get('page', 1))
        page_size = min(int(request.args.get('page_size', 20)), 100)
        
        result = user_service.get_history(user_id, page, page_size)
        return success_response(result)
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

# 获取用户会话列表接口
@app.route('/api/user/<int:user_id>/sessions')
def get_user_sessions(user_id):
    try:
        db = next(get_db())
        user_service = UserService(db)
        
        result = user_service.get_user_sessions(user_id)
        return success_response({"sessions": result})
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

# 创建用户会话接口
@app.route('/api/user/<int:user_id>/session/create', methods=['POST'])
def create_user_session(user_id):
    try:
        db = next(get_db())
        
        data = request.json
        title = data.get('title', '新会话')
        
        import uuid
        session_id = str(uuid.uuid4())
        
        from spiders.database_news import Session as DBSession
        new_session = DBSession(id=session_id, user_id=user_id, title=title)
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        
        return success_response({"session_id": session_id})
    except Exception as e:
        return error_response("DATABASE_ERROR", str(e))
    finally:
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
