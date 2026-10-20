# 前端 CI/CD：GitHub Actions 构建，Nginx 运行

> 本地实现不等于云端已启用；当前工作分支 `chore/github-actions-test` 待用户审核、提交、推送和 PR 到 main。
> 完整亲手部署教程：[后端 deploy/README.md](https://github.com/liuxu-david/admin_system_backstage/blob/main/deploy/README.md)（合入后在线可读）。
> 并列本地工作区可读 [后端手册](../../admin_system_backstage/deploy/README.md) 或 [根 DEPLOY.md](../../DEPLOY.md)；父目录不是 Git 仓库。

## 1. 文件和触发规则

工作流：[`.github/workflows/ci-cd.yml`](../.github/workflows/ci-cd.yml)。origin 为 `liuxu-david/admin_system_front`。两仓分别运行，不是在父目录建一条工作流。

| 事件／开关 | 行为 |
|---|---|
| PR 到 main | 检查、Docker 构建与隔离 Nginx smoke；不推 GHCR、不部署 |
| push main | 检查后推镜像，默认不部署 |
| workflow_dispatch | 选择 main，勾选 `deploy=true` 才部署 |
| 仓库 Actions variable `AUTO_DEPLOY_TEST=true` | 开启 main push 自动部署；首次 bootstrap 前不要开启 |

部署 job 用 Environment `test`、只允许 main、权限仅 `contents:read`。镜像发布用 `GITHUB_TOKEN`＋`packages:write`，不使用服务器拉包 PAT。

## 2. 检查与构建

标准 `ubuntu-24.04` Runner，Node `24.19.0`、pnpm `11.20.0`，官方 registry 冻结安装。当前前端没有独立 lint／单元 test 脚本，不虚构其覆盖。

```bash
pnpm install --frozen-lockfile --registry=https://registry.npmjs.org
pnpm type-check
pnpm exec vite build --mode test
pnpm audit --prod --audit-level=high --registry=https://registry.npmjs.org
python3 -m unittest discover -s .github/scripts -p 'test_*.py' -v
```

Docker 明确 `MODE=test`，类型检查不能省略。隔离 smoke 检查静态页面、SPA 回退和 Nginx 代理路由；不是完整真实后端端到端测试。只有 smoke 通过的同一镜像会推 GHCR，不二次构建替换。

镜像标签 `ghcr.io/liuxu-david/admin_system_front:sha-完整提交SHA` 供追踪；运行 Summary **Frontend test image** 输出 `ghcr.io/liuxu-david/admin_system_front@sha256:64位小写十六进制`。部署只接受此完整 digest，不能用 tag／latest、不能粘贴后端镜像。

仅构建 `linux/amd64`，服务器须 x86_64，不自动支持 ARM。服务器不用 Node、pnpm、PM2 或 `pnpm dev`／vite preview，只运行前端 Nginx 镜像。

`VITE_API_BASE_URL=/api` 是同源路径；`VITE_` 值会进入浏览器静态文件，不能放秘密，修改须重新构建。

## 3. 统一服务器约定

唯一新测试配置来源是**后端** `deploy/compose.yml`、`.env.example`、`manage.py`。用户 SFTP 上传到固定 `/opt/admin-system-test/`；CI 不覆盖服务器文件，不能用 DEPLOY_DIR 改路径。

四服务 `web`、`app`、`postgres`、`redis` 同一网络。`BACKEND_HOST=app`，Nginx 访问 `app:3000` 保留 `/api` 前缀；仅宿主 `127.0.0.1:8080:80`，数据库／后端不暴露公网。

首选本地 SSH 隧道 `127.0.0.1:18080 → 服务器127.0.0.1:8080`，浏览器用 `http://127.0.0.1:18080`，不需要域名。CORS 默认同一地址，不能换成公网明文登录。

服务器 `.env` 保留强随机秘密，`images.env` 由工具单独保存前后端版本；不要 source／eval。`APP_ENV=test` 仍走后端 migration，不自动 seed。首次需两仓 main 镜像，再人工 bootstrap、交互 seed、隧道登录和改密码，之后才开 CD。

私有 GHCR：对两包均有读取权限的账号，PAT classic `read:packages`，部署用户用 `docker login --password-stdin`；与 SSH 的 DEPLOY_USER 必须同一账号。代码公开不代表包公开。

## 4. 发布和回滚

服务器以同一部署用户执行，先输入本仓库成功 Summary 的完整 digest：

```bash
read -r -p "前端完整 digest: " IMAGE
python3 /opt/admin-system-test/manage.py deploy frontend "$IMAGE"
python3 /opt/admin-system-test/manage.py status
python3 /opt/admin-system-test/manage.py check
```

deploy／rollback 需已有成功 bootstrap。前端发布仅更新 FRONTEND_IMAGE 与 web，不覆盖后端版本或 `.env` 秘密。后端更新会重建 web 以重新解析后端 IP。

两仓共用服务器级 fcntl 锁，冲突直接拒绝，不是跨仓库排队；等前一操作结束且状态确认后重试。不要用手工 Compose 绕过锁，仓库内 concurrency 不能代替它。

```bash
python3 /opt/admin-system-test/manage.py rollback frontend
python3 /opt/admin-system-test/manage.py check
```

回退选成功历史中的不同旧版本；无记录则拒绝。检查失败不等于已自动恢复旧容器，`images.env` 只记录期望，须结合实际状态。后端回滚还需结构兼容确认且不恢复数据库，不由前端工作流处理。

## 5. GitHub test 环境和 SSH

两仓各建 Environment **test**，分支仅 main；可用时设置审批。环境 Variables：`DEPLOY_HOST`（私网IPv4／DNS）、`DEPLOY_PORT`、`DEPLOY_USER`、`USE_TAILSCALE`、`TAILSCALE_TAGS=tag:ci`；Secrets：`DEPLOY_SSH_KEY`、`DEPLOY_KNOWN_HOSTS`。

只有 `USE_TAILSCALE=true` 启用官方 v4.2.0 OAuth Action，再需 Secrets `TS_OAUTH_CLIENT_ID`、`TS_OAUTH_SECRET`。服务器正常账号接入；OAuth scope 为 **auth_keys Write**，tag须拥有或匹配tag:ci。ACL仅放CI到服务器SSH，不覆盖现有整份ACL；不需`id-token:write`。见[官方要求](https://github.com/tailscale/github-action/blob/v4.2.0/README.md)。

Tailscale只提供网络，不代替普通SSH公钥与known_hosts。ssh-keyscan采集后必须通过云控制台比对指纹；不禁用主机校验。不用Tailscale则自行提供安全可达通道，不把SSH对0.0.0.0/0开放来凑通路。

`AUTO_DEPLOY_TEST` 是**仓库级变量**。手动 Run workflow 选择main＋deploy后验收，才考虑设true。地址／key等放test环境，不把数据库秘密上传Actions。

## 6. 验收、排错和旧配置

首页和`/health`通过不代表账号／权限都正常；必须隧道登录、菜单与业务查询、刷新内部页面。查看日志可用服务器 `docker logs --tail=100 admin-system-test-web-1`，默认手工Compose不会读images.env。

| 现象 | 优先检查 |
|---|---|
| main没自动部署 | 默认行为；AUTO_DEPLOY_TEST是否为仓库变量，或是否手动勾deploy |
| 页面可开但502 | app是否健康，迁移、共享网络、Nginx旧IP；用管理工具发布 |
| 刷新404 | 当前镜像SPA回退；确认部署的是本次digest |
| 改VITE无效果 | 是否重建；重启Nginx不能改静态产物 |
| 拉包失败 | 部署用户、只读PAT、两包Read权限、SSO、名称与digest |
| SSH失败 | 先核对网络／tag／ACL、公钥／主机指纹，不关闭安全校验 |

旧 `.gitlab-ci.yml`、`docker-compose.deploy.yml` 与 `deploy/Caddyfile` 已删除。约1280MiB容器上限不是2GB容量保证，发布可短暂中断；备份需异地与恢复演练。

双方类型／build与前端audit已通过（前端0漏洞、后端仍3 moderate但high门槛通过）；actionlint／Compose静态检查通过，客户端mock测试后端9／前端8通过。独立PG／Redis＋宿主Node的真实后端链路通过，非新镜像验证。双端Docker构建在Docker Hub认证网络超时，镜像smoke及GitHub／GHCR／真实服务器发布未实跑；账户额度和网络也须自行确认，不承诺免费。
