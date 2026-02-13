# 新闻数据API接口文档

## 概述

本文档描述了新闻数据API接口的设计和实现。新闻API与AI助手服务共享同一个Flask应用实例，通过不同的路径区分功能模块。

- **基础路径**: `/api/news`
- **AI助手路径**: `/api/*` (用于AI助手相关接口)
- **响应格式**: JSON

## 统一响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    // 具体数据
  }
}
```

### 失败响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述"
  }
}
```

## 错误码说明

| 错误码 | 描述 |
|--------|------|
| NEWS_NOT_FOUND | 新闻不存在 |
| CATEGORY_NOT_FOUND | 分类不存在 |
| TAG_NOT_FOUND | 标签不存在 |
| INVALID_PARAMETER | 参数错误 |
| DATABASE_ERROR | 数据库错误 |
| SESSION_NOT_FOUND | 会话不存在 |
| NO_RESPONSE | 无响应生成 |

## 接口列表

### 1. 获取新闻列表

**接口**: `GET /api/news`

**参数**:
- `page` (可选): 页码，默认1
- `page_size` (可选): 每页数量，默认20，最大100
- `category_id` (可选): 分类ID
- `tag_id` (可选): 标签ID
- `sort` (可选): 排序方式，`publish_time`(发布时间) 或 `views`(阅读量)，默认`publish_time`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "news": [
      {
        "id": 1,
        "title": "新闻标题",
        "content": "新闻内容",
        "source": "新闻来源",
        "publish_time": "2024-01-01T10:00:00",
        "views": 12345,
        "has_image": true,
        "image_url": "https://example.com/image.jpg",
        "summary": "新闻摘要",
        "categories": [
          {
            "id": 1,
            "name": "财经要闻",
            "slug": "finance-news"
          }
        ],
        "tags": [
          {
            "id": 1,
            "name": "重要",
            "slug": "important"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total": 100,
      "total_pages": 5
    }
  }
}
```

### 2. 获取单条新闻详情

**接口**: `GET /api/news/{news_id}`

**参数**:
- `news_id` (必需): 新闻ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "新闻标题",
    "content": "新闻完整内容",
    "source": "新闻来源",
    "publish_time": "2024-01-01T10:00:00",
    "create_time": "2024-01-01T09:00:00",
    "update_time": "2024-01-01T10:00:00",
    "views": 12345,
    "has_image": true,
    "image_url": "https://example.com/image.jpg",
    "summary": "新闻摘要",
    "categories": [...],
    "tags": [...]
  }
}
```

### 3. 获取新闻分类列表

**接口**: `GET /api/news/categories`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "财经要闻",
        "slug": "finance-news",
        "news_count": 150
      }
    ]
  }
}
```

### 4. 获取新闻标签列表

**接口**: `GET /api/news/tags`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "tags": [
      {
        "id": 1,
        "name": "重要",
        "slug": "important",
        "news_count": 80
      }
    ]
  }
}
```

### 5. 搜索新闻

**接口**: `GET /api/news/search`

**参数**:
- `keyword` (必需): 搜索关键词
- `page` (可选): 页码，默认1
- `page_size` (可选): 每页数量，默认20

**响应示例**: 同获取新闻列表接口

### 6. 按分类获取新闻

**接口**: `GET /api/news/category/{category_id}`

**参数**:
- `category_id` (必需): 分类ID
- `page` (可选): 页码，默认1
- `page_size` (可选): 每页数量，默认20

**响应示例**: 同获取新闻列表接口

### 7. 按标签获取新闻

**接口**: `GET /api/news/tag/{tag_id}`

**参数**:
- `tag_id` (必需): 标签ID
- `page` (可选): 页码，默认1
- `page_size` (可选): 每页数量，默认20

**响应示例**: 同获取新闻列表接口

### 8. 获取热门新闻

**接口**: `GET /api/news/hot`

**参数**:
- `limit` (可选): 数量限制，默认10，最大20

**响应示例**:
```json
{
  "success": true,
  "data": {
    "news": [
      {
        "id": 1,
        "title": "新闻标题",
        "views": 12345,
        "has_image": true,
        "image_url": "https://example.com/image.jpg"
      }
    ]
  }
}
```

### 9. 增加新闻阅读量

**接口**: `POST /api/news/{news_id}/view`

**参数**:
- `news_id` (必需): 新闻ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "news_id": 1,
    "views": 12346
  }
}
```

## AI助手接口

### 生成AI响应
**接口**: `POST /api/generate`

### 创建会话
**接口**: `POST /api/session/create`

### 获取会话
**接口**: `GET /api/session/{session_id}`

### 删除会话
**接口**: `DELETE /api/session/{session_id}`

### 删除会话内消息
**接口**: `DELETE /api/session/{session_id}/message/{message_index}`

### 获取会话列表
**接口**: `GET /api/sessions`

### 更新会话标题
**接口**: `PUT /api/session/{session_id}/title`

### 聊天完成
**接口**: `POST /api/chat`

## 技术实现

### 数据库模型
- `News`: 新闻表
- `NewsCategory`: 新闻分类表
- `NewsTag`: 新闻标签表
- `NewsCategoryRelation`: 新闻分类关系表
- `NewsTagRelation`: 新闻标签关系表

### 服务层
- `NewsService`: 新闻服务类，处理所有新闻相关的业务逻辑

### 接口层
- Flask路由处理所有HTTP请求
- 统一的错误处理和响应格式

## 测试示例

### 测试获取新闻列表
```bash
curl http://localhost:8000/api/news
```

### 测试获取新闻详情
```bash
curl http://localhost:8000/api/news/1
```

### 测试搜索新闻
```bash
curl "http://localhost:8000/api/news/search?keyword=经济"
```

### 测试按分类获取新闻
```bash
curl http://localhost:8000/api/news/category/1
```

### 测试获取热门新闻
```bash
curl http://localhost:8000/api/news/hot
```

### 测试增加阅读量
```bash
curl -X POST http://localhost:8000/api/news/1/view
```

## 部署说明

1. 确保MySQL数据库已创建并初始化
2. 安装所需依赖: `pip install -r requirements.txt`
3. 配置环境变量 (`.env` 文件)
4. 启动服务: `python main.py`
5. 服务将在 `http://localhost:8000` 上运行

## 注意事项

- 所有接口都支持CORS跨域访问
- 分页参数默认值: page=1, page_size=20
- page_size最大限制为100
- 热门新闻的limit参数最大限制为20
- 时间格式使用ISO 8601标准
- 数据库连接使用连接池管理
