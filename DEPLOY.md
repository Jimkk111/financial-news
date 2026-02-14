# 全栈项目 Docker 部署说明

## 项目结构
```
financial-news/
├── backend/             # 后端 Python 代码
│   ├── Dockerfile       # 后端 Dockerfile
│   ├── db_init/         # 数据库初始化脚本
│   └── requirements.txt # Python 依赖
├── frontend/            # 前端 React 代码
│   ├── Dockerfile       # 前端 Dockerfile
│   └── nginx.conf       # Nginx 配置
└── docker-compose.yml   # Docker Compose 配置
```

## 部署步骤

### 1. 准备工作
- 确保云服务器已安装 Docker 和 Docker Compose
- 克隆项目代码到云服务器

### 2. 安装 Docker 和 Docker Compose
```bash
# 更新包管理器
sudo apt update

# 安装 Docker
sudo apt install docker.io -y

# 安装 Docker Compose
sudo apt install docker-compose -y

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 添加当前用户到 docker 组（可选，避免每次使用 sudo）
sudo usermod -aG docker $USER
newgrp docker
```

### 3. 部署项目

#### 3.1 进入项目目录
```bash
cd financial-news
```

#### 3.2 启动服务
```bash
# 构建并启动服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 4. 验证部署
- 前端访问：`http://服务器IP`
- 后端 API：`http://服务器IP:8000/api`
- 健康检查：`http://服务器IP:8000/health`

### 5. 环境变量配置

#### 5.1 后端环境变量
后端服务通过 `docker-compose.yml` 中的 `environment` 部分配置环境变量。主要包括：
- `FLASK_ENV`：Flask 运行环境
- `DATABASE_URL`：数据库连接 URL
- `DB_HOST`：数据库主机
- `DB_PORT`：数据库端口
- `DB_USER`：数据库用户名
- `DB_PASSWORD`：数据库密码

#### 5.2 数据库配置
数据库服务配置：
- `MYSQL_ROOT_PASSWORD`：MySQL 根密码
- `MYSQL_USER`：数据库用户名
- `MYSQL_PASSWORD`：数据库密码
- `MYSQL_DATABASE`：数据库名称

### 6. 数据持久化
- 数据库数据存储在 `mysql-data` 卷中，确保数据持久化
- 数据库初始化脚本位于 `backend/db_init/init.sql`，会在首次启动时自动执行

### 7. 常见问题处理

#### 7.1 端口占用
如果端口 80 或 8000 已被占用，可以修改 `docker-compose.yml` 中的端口映射：
```yaml
# 前端
ports:
  - "8080:80"  # 将 8080 改为其他端口

# 后端
ports:
  - "8081:8000"  # 将 8081 改为其他端口
```

#### 7.2 数据库连接失败
- 检查数据库服务是否正常启动
- 检查数据库用户名和密码是否正确
- 检查网络连接是否正常

#### 7.3 构建失败
- 检查网络连接是否正常（可能需要下载依赖）
- 检查 Docker 镜像是否可用
- 检查代码是否有语法错误

### 8. 服务管理

#### 8.1 启动服务
```bash
docker-compose up -d
```

#### 8.2 停止服务
```bash
docker-compose down
```

#### 8.3 重启服务
```bash
docker-compose restart
```

#### 8.4 查看服务状态
```bash
docker-compose ps
```

#### 8.5 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### 9. 性能优化（可选）

#### 9.1 调整 Docker 资源限制
在 `docker-compose.yml` 中添加资源限制：
```yaml
services:
  backend:
    # ...
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: "512M"

  frontend:
    # ...
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: "256M"

  db:
    # ...
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: "1G"
```

#### 9.2 启用 Docker 缓存
在构建镜像时，Docker 会自动使用缓存。可以通过合理组织 `Dockerfile` 来优化缓存使用。

### 10. 安全建议

#### 10.1 更改默认密码
在生产环境中，应更改 `docker-compose.yml` 中的默认密码：
- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`

#### 10.2 配置防火墙
使用 `ufw` 配置防火墙，只允许必要的端口：
```bash
# 启用防火墙
sudo ufw enable

# 允许 SSH
sudo ufw allow ssh

# 允许前端端口
sudo ufw allow 80/tcp

# 允许后端端口（可选，仅在需要直接访问后端时开放）
sudo ufw allow 8000/tcp

# 查看防火墙状态
sudo ufw status
```

#### 10.3 使用 HTTPS
在生产环境中，建议配置 HTTPS。可以使用 Nginx 反向代理或 Let's Encrypt 证书。

## 总结

本部署方案使用 Docker Compose 管理三个服务：
1. **前端**：使用 Nginx 提供静态文件服务，端口 80
2. **后端**：Flask 应用，端口 8000
3. **数据库**：MySQL 8.0，端口 3306

通过 Docker 容器化部署，实现了环境隔离、依赖管理和快速部署，适合在云服务器上运行。
