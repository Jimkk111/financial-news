# API接口文档

## 1. 基础信息

### 1.1 服务信息
- **服务地址**: http://localhost:8000
- **接口前缀**: /api
- **响应格式**: JSON

### 1.2 通用响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {}
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "错误代码",
    "message": "错误信息"
  }
}
```

### 1.3 常见错误代码
- `INVALID_PARAMETER`: 参数无效
- `SESSION_NOT_FOUND`: 会话不存在
- `NEWS_NOT_FOUND`: 新闻不存在
- `USER_EXISTS`: 用户已存在
- `INVALID_CREDENTIALS`: 用户名或密码错误
- `ALREADY_FAVORITED`: 已收藏
- `NOT_FAVORITED`: 未收藏
- `DATABASE_ERROR`: 数据库错误

## 2. 基础接口

### 2.1 根路径
- **路径**: `/`
- **方法**: GET
- **功能**: 欢迎信息
- **返回**: 
```json
{
  "message": "Welcome to LLM API"
}
```

### 2.2 健康检查
- **路径**: `/health`
- **方法**: GET
- **功能**: 健康检查
- **返回**: 
```json
{
  "status": "healthy"
}
```

## 3. AI助手接口

### 3.1 生成AI响应
- **路径**: `/api/generate`
- **方法**: POST
- **功能**: 生成AI响应
- **请求参数**:
```json
{
  "prompt": "提示词内容"
}
```
- **返回**:
```json
{
  "success": true,
  "data": {
    "response": "AI生成的回复内容",
    "model": "模型名称",
    "usage": {
      "prompt_tokens": 10,
      "completion_tokens": 50,
      "total_tokens": 60
    }
  }
}
```

### 3.2 创建会话
- **路径**: `/api/session/create`
- **方法**: POST
- **功能**: 创建新会话
- **返回**:
```json
{
  "success": true,
  "data": {
    "session_id": "会话ID"
  }
}
```

### 3.3 获取会话
- **路径**: `/api/session/<session_id>`
- **方法**: GET
- **功能**: 获取会话消息历史
- **返回**:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "role": "user",
        "content": "用户消息"
      },
      {
        "role": "assistant",
        "content": "AI回复"
      }
    ]
  }
}
```

### 3.4 删除会话
- **路径**: `/api/session/<session_id>`
- **方法**: DELETE
- **功能**: 删除会话
- **返回**:
```json
{
  "success": true,
  "data": {
    "message": "Session deleted successfully"
  }
}
```

### 3.5 删除会话内消息
- **路径**: `/api/session/<session_id>/message/<message_index>`
- **方法**: DELETE
- **功能**: 删除会话中的指定消息
- **返回**:
```json
{
  "success": true,
  "data": {
    "message": "Message deleted successfully"
  }
}
```

### 3.6 获取会话列表
- **路径**: `/api/sessions`
- **方法**: GET
- **功能**: 获取所有会话列表
- **返回**:
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "session_id": "会话ID",
        "title": "会话标题",
        "created_at": "2026-02-09T10:00:00",
        "updated_at": "2026-02-09T12:00:00",
        "message_count": 5
      }
    ]
  }
}
```

### 3.7 更新会话标题
- **路径**: `/api/session/<session_id>/title`
- **方法**: PUT
- **功能**: 更新会话标题
- **请求参数**:
```json
{
  "title": "新标题"
}
```
- **返回**:
```json
{
  "success": true,
  "data": {
    "message": "Title updated successfully"
  }
}
```

### 3.8 聊天完成
- **路径**: `/api/chat`
- **方法**: POST
- **功能**: 聊天完成
- **请求参数**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "用户消息"
    }
  ],
  "session_id": "会话ID（可选）",
  "stream": false
}
```
- **返回** (非流式):
```json
{
  "success": true,
  "data": {
    "role": "assistant",
    "content": "AI回复内容"
  }
}
```
- **返回** (流式): 多行JSON，每行一个chunk

## 4. 新闻接口

### 4.1 获取新闻列表
- **路径**: `/api/news`
- **方法**: GET
- **功能**: 获取新闻列表
- **查询参数**:
  - `page`: 页码（默认1）
  - `page_size`: 每页数量（默认20，最大100）
  - `category_id`: 分类ID（可选）
  - `tag_id`: 标签ID（可选）
  - `sort`: 排序方式（publish_time或views，默认publish_time）
- **返回**:
```json
{
  "success": true,
  "data": {
    "total": 100,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "title": "新闻标题",
        "summary": "新闻摘要",
        "content": "新闻正文",
        "publish_time": "2026-02-09T10:00:00",
        "source": "新浪财经",
        "author": "作者",
        "url": "新闻链接",
        "views": 100,
        "has_image": true,
        "category": {
          "id": 1,
          "name": "分类名称"
        },
        "tags": [
          {
            "id": 1,
            "name": "标签名称"
          }
        ]
      }
    ]
  }
}
```

### 4.2 获取新闻详情
- **路径**: `/api/news/<news_id>`
- **方法**: GET
- **功能**: 获取新闻详情
- **返回**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "新闻标题",
    "summary": "新闻摘要",
    "content": "新闻正文（包含HTML标签）",
    "publish_time": "2026-02-09T10:00:00",
    "source": "新浪财经",
    "author": "作者",
    "url": "新闻链接",
    "views": 100,
    "has_image": true,
    "category": {
      "id": 1,
      "name": "分类名称"
    },
    "tags": [
      {
        "id": 1,
        "name": "标签名称"
      }
    ]
  }
}
```

### 4.3 获取新闻分类列表
- **路径**: `/api/news/categories`
- **方法**: GET
- **功能**: 获取新闻分类列表
- **返回**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "分类名称",
        "description": "分类描述"
      }
    ]
  }
}
```

### 4.4 获取新闻标签列表
- **路径**: `/api/news/tags`
- **方法**: GET
- **功能**: 获取新闻标签列表
- **返回**:
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": 1,
        "name": "标签名称"
      }
    ]
  }
}
```

### 4.5 搜索新闻
- **路径**: `/api/news/search`
- **方法**: GET
- **功能**: 搜索新闻
- **查询参数**:
  - `keyword`: 搜索关键词（必填）
  - `page`: 页码（默认1）
  - `page_size`: 每页数量（默认20，最大100）
- **返回**:
```json
{
  "success": true,
  "data": {
    "total": 50,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "title": "新闻标题",
        "summary": "新闻摘要",
        "publish_time": "2026-02-09T10:00:00",
        "source": "新浪财经"
      }
    ]
  }
}
```

### 4.6 按分类获取新闻
- **路径**: `/api/news/category/<category_id>`
- **方法**: GET
- **功能**: 按分类获取新闻
- **查询参数**:
  - `page`: 页码（默认1）
  - `page_size`: 每页数量（默认20，最大100）
- **返回**:
```json
{
  "success": true,
  "data": {
    "total": 30,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "title": "新闻标题",
        "summary": "新闻摘要",
        "publish_time": "2026-02-09T10:00:00",
        "source": "新浪财经"
      }
    ]
  }
}
```

### 4.7 按标签获取新闻
- **路径**: `/api/news/tag/<tag_id>`
- **方法**: GET
- **功能**: 按标签获取新闻
- **查询参数**:
  - `page`: 页码（默认1）
  - `page_size`: 每页数量（默认20，最大100）
- **返回**:
```json
{
  "success": true,
  "data": {
    "total": 25,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "title": "新闻标题",
        "summary": "新闻摘要",
        "publish_time": "2026-02-09T10:00:00",
        "source": "新浪财经"
      }
    ]
  }
}
```

### 4.8 获取热门新闻
- **路径**: `/api/news/hot`
- **方法**: GET
- **功能**: 获取热门新闻
- **查询参数**:
  - `limit`: 返回数量（默认10，最大20）
- **返回**:
```json
{
  "success": true,
  "data": {
    "news": [
      {
        "id": 1,
        "title": "新闻标题",
        "summary": "新闻摘要",
        "publish_time": "2026-02-09T10:00:00",
        "views": 1000
      }
    ]
  }
}
```

### 4.9 增加新闻阅读量
- **路径**: `/api/news/<news_id>/view`
- **方法**: POST
- **功能**: 增加新闻阅读量
- **返回**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "views": 101
  }
}
```

## 5. 用户接口

### 5.1 用户注册
- **路径**: `/api/user/register`
- **方法**: POST
- **功能**: 用户注册
- **请求参数**:
```json
{
  "username": "用户名",
  "email": "邮箱",
  "password": "密码",
  "avatar": "头像URL（可选）"
}
```
- **返回**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "用户名",
    "email": "邮箱",
    "avatar": "头像URL",
    "created_at": "2026-02-09T10:00:00"
  }
}
```

### 5.2 用户登录
- **路径**: `/api/user/login`
- **方法**: POST
- **功能**: 用户登录
- **请求参数**:
```json
{
  "username": "用户名",
  "password": "密码"
}
```
- **返回**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "用户名",
    "email": "邮箱",
    "avatar": "头像URL"
  }
}
```

### 5.3 添加收藏
- **路径**: `/api/user/<user_id>/favorites`
- **方法**: POST
- **功能**: 添加收藏
- **请求参数**:
```json
{
  "news_id": 123
}
```
- **返回**:
```json
{
  "success": true,
  "data": {
    "message": "Favorite added successfully"
  }
}
```

### 5.4 取消收藏
- **路径**: `/api/user/<user_id>/favorites/<news_id>`
- **方法**: DELETE
- **功能**: 取消收藏
- **返回**:
```json
{
  "success": true,
  "data": {
    "message": "Favorite removed successfully"
  }
}
```

### 5.5 获取收藏列表
- **路径**: `/api/user/<user_id>/favorites`
- **方法**: GET
- **功能**: 获取收藏列表
- **查询参数**:
  - `page`: 页码（默认1）
  - `page_size`: 每页数量（默认20，最大100）
- **返回**:
```json
{
  "success": true,
  "data": {
    "total": 10,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "news_id": 123,
        "created_at": "2026-02-09T12:00:00",
        "news": {
          "id": 123,
          "title": "新闻标题",
          "summary": "新闻摘要",
          "publish_time": "2026-02-09T10:00:00",
          "source": "新浪财经"
        }
      }
    ]
  }
}
```

### 5.6 检查是否收藏
- **路径**: `/api/user/<user_id>/favorites/<news_id>/check`
- **方法**: GET
- **功能**: 检查是否收藏
- **返回**:
```json
{
  "success": true,
  "data": {
    "is_favorite": true
  }
}
```

### 5.7 添加浏览历史
- **路径**: `/api/user/<user_id>/history`
- **方法**: POST
- **功能**: 添加浏览历史
- **请求参数**:
```json
{
  "news_id": 123
}
```
- **返回**:
```json
{
  "success": true,
  "data": {
    "message": "History added successfully"
  }
}
```

### 5.8 获取浏览历史
- **路径**: `/api/user/<user_id>/history`
- **方法**: GET
- **功能**: 获取浏览历史
- **查询参数**:
  - `page`: 页码（默认1）
  - `page_size`: 每页数量（默认20，最大100）
- **返回**:
```json
{
  "success": true,
  "data": {
    "total": 50,
    "page": 1,
    "page_size": 20,
    "items": [
      {
        "id": 1,
        "news_id": 123,
        "viewed_at": "2026-02-09T12:00:00",
        "news": {
          "id": 123,
          "title": "新闻标题",
          "summary": "新闻摘要",
          "publish_time": "2026-02-09T10:00:00",
          "source": "新浪财经"
        }
      }
    ]
  }
}
```

### 5.9 获取用户会话列表
- **路径**: `/api/user/<user_id>/sessions`
- **方法**: GET
- **功能**: 获取用户会话列表
- **返回**:
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid-string",
        "user_id": 1,
        "title": "会话标题",
        "created_at": "2026-02-09T10:00:00",
        "updated_at": "2026-02-09T12:00:00"
      }
    ]
  }
}
```

### 5.10 创建用户会话
- **路径**: `/api/user/<user_id>/session/create`
- **方法**: POST
- **功能**: 创建用户会话
- **请求参数**:
```json
{
  "title": "新会话标题"
}
```
- **返回**:
```json
{
  "success": true,
  "data": {
    "session_id": "uuid-string"
  }
}
```

## 6. 接口使用示例

### 6.1 示例1: 生成AI响应

**请求**:
```bash
curl -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "你好，请介绍一下你自己"}'
```

**响应**:
```json
{
  "success": true,
  "data": {
    "response": "你好！我是一个AI助手，由DeepSeek开发。我可以帮助你回答问题、提供信息、进行对话等。我会尽最大努力为你提供准确和有用的信息。",
    "model": "deepseek-chat",
    "usage": {
      "prompt_tokens": 8,
      "completion_tokens": 45,
      "total_tokens": 53
    }
  }
}
```

### 6.2 示例2: 获取新闻列表

**请求**:
```bash
curl http://localhost:8000/api/news?page=1&page_size=10
```

**响应**:
```json
{
  "success": true,
  "data": {
    "total": 100,
    "page": 1,
    "page_size": 10,
    "items": [
      {
        "id": 1,
        "title": "新闻标题1",
        "summary": "新闻摘要1",
        "content": "新闻正文1",
        "publish_time": "2026-02-09T10:00:00",
        "source": "新浪财经",
        "author": "作者1",
        "url": "新闻链接1",
        "views": 100,
        "has_image": false,
        "category": {
          "id": 1,
          "name": "财经"
        },
        "tags": []
      }
    ]
  }
}
```

### 6.3 示例3: 用户注册

**请求**:
```bash
curl -X POST http://localhost:8000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "123456"}'
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "avatar": null,
    "created_at": "2026-02-09T12:00:00"
  }
}
```