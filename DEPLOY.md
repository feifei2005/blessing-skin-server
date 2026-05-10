# Blessing Skin Server 部署手册

## 架构概览

```
用户浏览器
    │
    ├─ skin.小小只suki.cn ──── EdgeOne Pages (React SPA 前端, Git 自动构建)
    │
    └─ skin_api.小小只suki.cn ─ 腾讯云 CVM 119.29.28.59
                                   │
                                   ├─ Nginx :80 (反向代理)
                                   ├─ Apache + PHP 8.2 (app 容器)
                                   └─ MySQL 8.0 (db 容器)
```

---

## 一、部署状态

| 组件       | 地址                                               |
| ---------- | -------------------------------------------------- |
| 前端 SPA   | https://skin.小小只suki.cn                         |
| 前端仓库   | https://github.com/feifei2005/blessing-skin-server |
| 后端 API   | https://skin_api.小小只 suki.cn                    |
| 后端服务器 | root@119.29.28.59                                  |

---

## 二、服务器文件结构

```
/root/blessing-skin-server/
├── docker-compose.yml          # 容器编排
├── .env                        # docker-compose 环境变量
├── docker/
│   ├── Dockerfile.prod         # 生产环境 Dockerfile
│   ├── entrypoint.sh           # 容器启动脚本
│   ├── nginx.conf              # Nginx 反向代理配置
│   └── sources.list            # apt 源 (腾讯云镜像)
└── ... (项目源代码)
```

---

## 三、后端部署

### 3.1 环境要求

- 服务器：腾讯云 CVM, Debian 13
- Docker 29+ 和 Docker Compose v5+
- 配置 Docker Hub 镜像加速

### 3.2 Docker 配置

```bash
# /etc/docker/daemon.json
{
  "registry-mirrors": ["https://docker.1panel.live"],
  "log-driver": "json-file",
  "log-opts": {"max-size": "10m", "max-file": "3"}
}
systemctl restart docker
```

### 3.3 环境变量

创建 `/root/blessing-skin-server/.env`：

```env
DB_ROOT_PASSWORD=<MySQL root 密码>
DB_DATABASE=blessingskin
DB_USERNAME=blessingskin
DB_PASSWORD=<应用数据库密码>

API_DOMAIN=skin_api.xn--suki-uf1gk54ba.cn
SPA_DOMAIN=skin.xn--suki-uf1gk54ba.cn
```

### 3.4 构建与启动

```bash
cd /root/blessing-skin-server

# 预拉取基础镜像
docker pull node:20-alpine
docker pull composer:latest
docker pull php:8.2-apache
docker pull nginx:alpine

# 构建应用镜像
docker compose build

# 启动所有服务
docker compose up -d

# 查看状态
docker compose ps
```

### 3.5 数据库初始化（仅首次部署）

```bash
# 运行数据库迁移
docker exec blessingskin-app php artisan migrate --force

# 生成 Passport 密钥
docker exec blessingskin-app php artisan passport:keys --force

# 创建 SPA OAuth 客户端
echo "" | docker exec -i blessingskin-app php artisan passport:client --public \
  --name "Blessing Skin SPA" \
  --redirect_uri "https://skin.xn--suki-uf1gk54ba.cn/auth/callback"

# ↑ 记下输出的 Client ID，用于前端构建环境变量
```

---

## 四、前端部署（EdgeOne Pages Git 集成）

### 4.1 构建配置

EdgeOne Pages 从 GitHub 仓库自动构建，设置如下：

| 配置项   | 值           |
| -------- | ------------ |
| 框架预设 | Custom       |
| 构建命令 | `yarn build` |
| 输出目录 | `public/app` |
| 根目录   | 留空         |

### 4.2 环境变量（在 EdgeOne 控制台设置）

| 变量名                      | 值                                       |
| --------------------------- | ---------------------------------------- |
| `REACT_APP_API_BASE`        | `https://skin_api.xn--suki-uf1gk54ba.cn` |
| `REACT_APP_OAUTH_CLIENT_ID` | `1`（从 3.5 获取）                       |

### 4.3 构建产出说明

`yarn build` 执行三个步骤：

1. **webpack 编译** → 产出 JS/CSS/HTML
2. **生成 `config.json`** → 写入 API 地址（从 `REACT_APP_API_BASE` 环境变量）
3. **生成 `_redirects`** → SPA 路由兜底规则

每次 `git push` 后 EdgeOne 自动重新部署。

### 4.4 自定义域名

在 EdgeOne Pages 控制台 → 项目设置 → 自定义域名，绑定 `skin.小小只suki.cn`。

---

## 五、DNS 配置（Cloudflare）

域名：**小小只 suki.cn**

| 类型  | 名称     | 内容                       | 代理状态      |
| ----- | -------- | -------------------------- | ------------- |
| A     | skin_api | 119.29.28.59               | 仅 DNS (灰云) |
| CNAME | skin     | EdgeOne Pages 提供的 CNAME | 仅 DNS (灰云) |

> 两个记录均关闭 Cloudflare 代理（灰云），因为服务器在国内。

---

## 六、验证

```bash
# 后端
curl https://skin_api.xn--suki-uf1gk54ba.cn/api/

# 前端
curl https://skin.xn--suki-uf1gk54ba.cn/
```

---

## 七、运维命令

```bash
ssh root@119.29.28.59
cd /root/blessing-skin-server

# 查看状态
docker compose ps

# 查看日志
docker logs -f blessingskin-app
docker logs -f blessingskin-nginx

# 重启
docker compose restart

# 重建并重启
docker compose up -d --build

# 进入容器
docker exec -it blessingskin-app bash

# 运行 artisan
docker exec blessingskin-app php artisan <command>

# MySQL 备份
docker exec blessingskin-db mysqldump -u blessingskin -p blessingskin > backup.sql
```

---

## 八、Docker 镜像构建细节

`docker/Dockerfile.prod` 四阶段构建，全部使用国内镜像源：

| 阶段     | 基础镜像        | 操作                            | 镜像源                 |
| -------- | --------------- | ------------------------------- | ---------------------- |
| frontend | node:20-alpine  | yarn install + webpack build    | npmmirror.com          |
| vendor   | composer:latest | composer install                | mirrors.aliyun.com     |
| builder  | composer:latest | 组装代码 + artisan key:generate | -                      |
| final    | php:8.2-apache  | 安装 gd/zip/mysql 扩展 + Apache | mirrors.tencentyun.com |

---

## 九、安全建议

- [ ] 服务器防火墙仅开放 22、80、443
- [ ] 配置 HTTPS (Let's Encrypt + certbot)
- [ ] 定期更新 Docker 镜像
- [ ] MySQL 密码定期更换
- [ ] `.env` 和 `.client_id` 不要提交到 Git
