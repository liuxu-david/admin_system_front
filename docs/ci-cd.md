# CI/CD 与部署（前端独立仓库版）

> 构建/部署/nginx 排障时读。后端是独立仓库独立流水线，见后端仓库 docs/ci-cd.md。

## 全景

```
MR/develop/main → check（vue-tsc + vite build）
develop 合入    → package（docker build MODE=test → 推 Registry）→ deploy:test（自动）
main 合入       → package（MODE=staging）→ deploy:staging（手动确认 ▶）
```

镜像 = nginx + 静态文件：SPA fallback + `/api` 反代后端 + gzip + assets 长缓存（`nginx.conf.template`）。

## 镜像里的 MODE

`Dockerfile` 的 `ARG MODE` 决定读哪个 env 文件：test → `.env.test`、staging → `.env.staging`。两者目前都是 `VITE_API_BASE_URL=/api`（同源走 nginx 反代）。**这是构建期变量，打包后不可变**。

## 一次性准备

与后端同套路（详细命令抄后端 docs/ci-cd.md）：建仓推送 → GitLab Registry 可用 → Runner(docker executor + privileged) → 配 4 个变量（TEST_SSH_HOST/USER/KEY/DEPLOY_DIR + STAGING 四件）。

服务器上前端目录（如 `/opt/admin-frontend-test`）的 `.env`：

```bash
WEB_PORT=80
# 后端地址：默认 host.docker.internal（宿主机，compose 已配 host-gateway 映射）。
# 后端在另一台机器就写那台的内网 IP。
BACKEND_HOST=host.docker.internal
```

> 前提：后端已部署且 `127.0.0.1:3000/health` 通（后端 APP_BIND 默认 127.0.0.1，同机正好）。

## 部署验证

```bash
curl http://127.0.0.1/           # 返回 index.html
curl http://127.0.0.1/health     # 反代到后端，应返回 {"code":0,...}
docker logs admin-web --tail 30  # 排障
```

## 上预发额外要做

- 外层域名 + HTTPS（云负载均衡或宿主 nginx 加证书，转发到 WEB_PORT）
- 通知后端把 `CORS_ORIGINS` 配上预发域名（虽然同源反代下基本用不到，兜底）
- 确认 `.env.staging` 与实际后端地址匹配（都走反代则无需改）

## 排障速查

| 现象 | 处理 |
|---|---|
| 页面白屏/刷新 404 | 旧镜像没带 SPA fallback；确认重新构建部署了 |
| /api 502 | BACKEND_HOST 不对或后端没起；`docker exec admin-web wget -qO- http://$BACKEND_HOST:3000/health` 验证连通 |
| 环境变量改了没生效 | VITE_ 是构建期注入，必须重新打镜像，重启容器没用 |
