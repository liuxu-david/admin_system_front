# 前端 CI/CD 与部署手册（运维小白版·前端）

> 目标：照着做，做完「推代码到 GitLab → 服务器前端自动更新」打通。
> **前置**：GitLab / Runner / Registry / 装好 Docker 的服务器——这些公共设施**一次搭好两个项目共用**，还没搭过先做【后端仓库 `docs/ci-cd.md` 第 1、2 节】（含完整命令和验证方法），再回来做本篇。

## 0. 先理解：前端部署后长什么样

前端打包产物是一堆静态文件（HTML/JS/CSS），部署 = 放进一个 **nginx 容器**里对外服务：

```
浏览器 ──▶ 前端容器(nginx:80)
             ├─ /            → 返回静态文件（Vue 打包产物）
             └─ /api/xxx     → 反向代理转发给后端容器:3000 ──▶ PG / Redis
```

- 因为 `/api` 是 nginx 转发的，前端和后端**同源**，没有跨域问题。
- 镜像分两种模式构建：`MODE=test`（读 `.env.test`）/ `MODE=staging`（读 `.env.staging`）——目前两者内容相同，留作以后区分。
- **nginx 的 SPA 规则已配好**（刷新不会 404），不用管。

## 1. GitLab 建项目并推代码（一次性）

```bash
# GitLab 上（后端同款步骤）建空项目 admin-front，然后在你电脑：
git remote add gitlab http://gitlab.你的IP/admin/admin-front.git
git push gitlab main
git push gitlab develop
```

## 2. 配 CI 变量（一次性）

GitLab 项目 → Settings → CI/CD → Variables（和后端的变量**各自项目各配一套**）：

| 变量名 | 值 | 说明 |
|---|---|---|
| TEST_SSH_HOST | 服务器IP | 和后端同一台即可 |
| TEST_SSH_USER | root | |
| TEST_SSH_KEY | 部署私钥**全部内容** | 和后端用的是同一对密钥，公钥已在服务器上 |
| TEST_DEPLOY_DIR | /opt/admin-frontend-test | 前端自己的目录，别和后端混 |

## 3. 服务器准备部署目录（每环境一次）

```bash
mkdir -p /opt/admin-frontend-test && cd /opt/admin-frontend-test
cat > .env <<'EOF'
WEB_PORT=80
# 后端地址：默认 host.docker.internal = "宿主机"（容器访问宿主机端口的固定写法）
# 后端部署在另一台机器时，改成那台的内网 IP
BACKEND_HOST=host.docker.internal
EOF
```
> 前提：后端已先部署好且 `curl http://127.0.0.1:3000/health` 通（后端默认只绑宿主机回环，同机正好够用）。

## 4. 第一次部署

```bash
git checkout develop && git push gitlab develop
```
→ GitLab 项目 → Build → Pipelines：check → package → deploy:test 全绿。
✅ 验证（服务器上）：
```bash
curl http://127.0.0.1/          # 返回 HTML（<!DOCTYPE html>...）
curl http://127.0.0.1/health    # {"code":0,...}（说明 nginx→后端的反代链路也通了）
```
浏览器打开 `http://服务器IP/` 能看到登录页 → 用 admin 登录走一遍。

## 5. 日常怎么用

| 想干什么 | 怎么做 |
|---|---|
| 日常开发 | feature 分支 → MR → 合入 `develop` → 自动部署测试 |
| 上预发 | `develop` 合入 `main` → 流水线手动按钮 ▶ `deploy:staging`（自动用 staging 模式构建） |
| 改了 .env.test 里的变量 | 必须重新走构建部署才生效（`VITE_` 变量是**打包时**写死进 JS 的） |
| 看前端容器日志 | `docker logs admin-web --tail 50` |

## 6. 常见问题

| 现象 | 原因 / 处理 |
|---|---|
| 页面能开但登录报错/接口 404 | nginx→后端不通：检查后端起没起、`.env` 的 BACKEND_HOST 对不对 |
| /api 返回 502 Bad Gateway | 同上，nginx 找不到后端；后端在另一台机就把 BACKEND_HOST 改成那台内网 IP 后 `docker compose -f docker-compose.deploy.yml up -d` |
| 改了环境变量没生效 | `VITE_` 是构建期变量，重启容器没用，要重新触发流水线构建 |
| 刷新页面 404 | 用了旧镜像（没带 SPA 规则），确认流水线重新构建部署过 |
