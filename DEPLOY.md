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

# QQ SMTP 邮箱配置
# 1. 登录 QQ 邮箱 → 设置 → 账户 → POP3/SMTP 服务 → 开启 → 生成授权码
# 2. 将授权码填入 MAIL_PASSWORD
MAIL_USERNAME=你的QQ邮箱@qq.com
MAIL_PASSWORD=<QQ邮箱SMTP授权码>
MAIL_FROM_ADDRESS=你的QQ邮箱@qq.com
MAIL_FROM_NAME=Blessing Skin
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

### 3.5 邮箱配置（QQ SMTP）

在 `.env` 中配置 `MAIL_USERNAME`、`MAIL_PASSWORD`、`MAIL_FROM_ADDRESS`、`MAIL_FROM_NAME` 后启动容器即可。

获取 QQ SMTP 授权码：

1. 登录 QQ 邮箱 → 设置 → 账户 → POP3/IMAP/SMTP 服务
2. 开启 SMTP 服务 → 按提示发送短信 → 获取授权码
3. 将授权码填入 `MAIL_PASSWORD`

> 发件地址建议填 QQ 邮箱本身（如 `1142595583@qq.com`），不要填自有域名——自有域名没有 SPF 指向腾讯 SMTP，收件方可能拒收。

后台开启邮箱验证：`/admin/options` → 常规 → 勾选「注册需验证邮箱」。

### 3.6 数据库初始化（仅首次部署）

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

## 九、安全配置

### 9.1 密钥管理

本项目涉及以下敏感密钥，**绝对不能提交到 Git 仓库**：

| 密钥            | 用途                           | 生成方式                           |
| --------------- | ------------------------------ | ---------------------------------- |
| `APP_KEY`       | 加密 session、cookie、签名 URL | `php artisan key:generate`         |
| Passport 密钥对 | 签发/验证 OAuth2 token         | `php artisan passport:keys`        |
| `JWT_SECRET`    | 签发 JWT token                 | `php artisan jwt:secret`（如使用） |
| `DB_PASSWORD`   | 数据库访问                     | 手动设置强密码                     |
| `MAIL_PASSWORD` | SMTP 授权码                    | 从邮箱服务商获取                   |

**已加入 `.gitignore` 的文件：**

- `.env` / `.env.testing` / `.env.local` / `.env.production`
- `.devcontainer/.env.devcontainer`
- `storage/oauth-private.key` / `storage/oauth-public.key`

### 9.2 密钥轮换（首次部署或密钥泄露后必须执行）

```bash
# 进入容器
docker exec -it blessingskin-app bash

# 1. 重新生成 APP_KEY（所有旧 session 失效，用户需重新登录）
php artisan key:generate --force

# 2. 重新生成 Passport 密钥对（所有旧 OAuth2 token 失效）
php artisan passport:keys --force

# 3. 如果使用 JWT，重新生成 JWT_SECRET
php artisan jwt:secret --force

# 4. 退出容器后重启服务
exit
docker compose restart app
```

> **重要：** 本仓库的 Git 历史中曾包含真实密钥（APP_KEY、Passport 私钥、JWT_SECRET）。
> 如果你是 fork 或 clone 此仓库进行部署，**必须在首次部署时执行上述密钥轮换步骤**，
> 确保使用全新生成的密钥，而非历史中泄露的密钥。

### 9.3 Git 历史清理（仓库维护者执行）

如需彻底清除 Git 历史中的泄露密钥：

```bash
# 安装 BFG Repo-Cleaner (https://rtyley.github.io/bfg-repo-cleaner/)
# 创建替换规则文件
cat > passwords.txt << 'EOF'
eVX/xzF5NhpGB2luswliFx9XSBsbbAP21wOi68X/P34===>REMOVED_KEY
JaytOHG/JlLgulTVAhiS0tRqnAfCkQydbdP6VRmoAMY===>REMOVED_KEY
1tdM3gXarxYI4KlAHMBo238iC2tEb4I3EtBlZTQQXvInXIt7V2ix7hJ1KTvxCKZW==>REMOVED_KEY
EOF

# 清理历史
bfg --replace-text passwords.txt
bfg --delete-files .env.testing
bfg --delete-files .env.devcontainer

# 清理 reflog 并强制推送
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force --all
git push --force --tags
```

> 强制推送后，所有协作者需要重新 clone 仓库。

### 9.4 生产环境安全清单

- [ ] 服务器防火墙仅开放 22、80、443
- [ ] 确认 `APP_DEBUG=false`（生产环境禁止开启 debug）
- [ ] 配置 HTTPS（Let's Encrypt + certbot 或云厂商证书）
- [ ] Nginx 添加安全响应头（见下方）
- [ ] 移除 `X-Powered-By` 头，设置 `server_tokens off`
- [ ] 设置 `SESSION_SECURE_COOKIE=true`
- [ ] MySQL 使用强密码，定期更换
- [ ] `.env` 文件权限设为 600（仅 root 可读）
- [ ] 定期更新 Docker 镜像和系统补丁
- [ ] 配置日志轮转，避免磁盘写满

### 9.5 推荐的 Nginx 安全头

在 `docker/nginx.conf` 的 `server` 块中添加：

```nginx
# 安全响应头
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# 隐藏服务器版本
server_tokens off;
proxy_hide_header X-Powered-By;
```
