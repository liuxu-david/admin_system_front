# ───────── 构建阶段：vite 打包 ─────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# MODE=test 读 .env.test（测试环境）；MODE=staging 读 .env.staging（预发）
ARG MODE=test
RUN pnpm exec vite build --mode ${MODE}

# ───────── 运行阶段：nginx 托管静态文件 + 反代 API ─────────
FROM nginx:1.27-alpine

# 模板放 templates/，容器启动时 envsubst 渲染 BACKEND_HOST → conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
