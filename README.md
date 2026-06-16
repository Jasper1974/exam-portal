# Exam Portal — 在线期末考试系统

面向**国内网络环境**的轻量期末考试应用：学生填写**姓名 + 12 位学号**作答，选择题自动判分，简答题由服务端大模型辅助评分（**智谱 GLM 优先**，可切换 **Claude**）。可复用于课程期末、测验、作业。

## 功能

- 学生端：首页选卷 → 身份验证 → 限时答题 → 交卷查分
- 教师端：`/admin` 查看提交记录、导出 CSV
- 大模型：服务端统一路由 `src/lib/llm/router.ts`，不暴露 API Key
- 防重复：同一试卷 + 学号仅允许提交一次

## 本地运行

### 1. 依赖

```bash
npm install
```

### 2. 环境变量

```bash
copy .env.example .env.local
```

默认使用 SQLite（`prisma/dev.db`），无需安装数据库。

可选：使用 Docker Postgres 时，将 `prisma/schema.prisma` 的 `provider` 改为 `postgresql`，并设置 `DATABASE_URL`。

### 3. 迁移与示例试卷

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

浏览器打开 http://localhost:3000 ，示例试卷 slug：`final-2026`。

### 4. 大模型（可选，简答题评分）

在 `.env.local` 中配置至少一项：

```env
ZHIPU_API_KEY=          # 国内推荐，open.bigmodel.cn
ANTHROPIC_API_KEY=      # Claude，服务端调用
LLM_PROVIDER=auto       # auto | zhipu | claude
```

未配置时选择题仍可正常判分，简答题给予中间分并提示教师复核。

## 部署（学生通过网址访问）

推荐 **Vercel + Neon/Supabase Postgres**（学生端国内可访问，无需 VPN）：

1. 将本仓库推到 GitHub：`Jasper1974/exam-portal`
2. [Vercel](https://vercel.com) Import 项目
3. 环境变量：
   - `DATABASE_URL` — Neon/Supabase 连接串
   - `ADMIN_SECRET` — 教师后台口令（务必修改）
   - `ZHIPU_API_KEY` 或 `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_SITE_URL` — 部署后的 HTTPS 地址
4. 首次部署后 Vercel 会自动执行迁移与种子（见 `vercel.json`），或本地对生产库执行：

```bash
npm run db:deploy
npm run db:seed
```

学生访问：`https://你的域名.vercel.app`

## 自定义试卷

编辑 `prisma/seed.ts` 中的题目，或直接向数据库 `Exam` / `Question` 表写入数据，然后：

```bash
npm run db:seed
```

题目类型：`single`（单选）、`multiple`（多选）、`text`（简答，走 AI 评分）。

## 目录结构

```
src/
  app/              # 页面与 API
  components/       # 学生表单、试卷 UI
  lib/
    llm/router.ts   # 智谱 / Claude 可复用路由
    exams.ts        # 出题、提交、评分
    validation.ts   # 学号 12 位校验
prisma/             # 数据模型与种子
```

## 生产数据库说明

Vercel 等 Serverless 平台**不能**使用 SQLite 文件库。上线前请：

1. 在 [Neon](https://neon.tech) 或 Supabase 创建免费 Postgres
2. 将 `prisma/schema.prisma` 中 `provider` 改为 `postgresql`
3. 安装 `@prisma/adapter-pg` 与 `pg`，并在 `create-client.ts` 中按连接串切换 Postgres 适配器
4. 在 Vercel 填写 `DATABASE_URL`

若暂时只在局域网考试，可运行 `npm run dev` 或部署到带持久磁盘的 Railway。

MIT — 可在其他课程项目中复用本仓库代码与 LLM 路由层。
