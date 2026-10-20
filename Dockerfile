FROM node:24.19.0-bookworm-slim AS builder
WORKDIR /app
RUN npm install --global pnpm@11.20.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG MODE=test
RUN pnpm type-check && pnpm exec vite build --mode ${MODE}

FROM nginx:stable-alpine
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
