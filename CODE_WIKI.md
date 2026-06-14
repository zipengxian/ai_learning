# Code Wiki - 多语种在线教育平台 & K12 学习平台

---

## 目录

1. [项目概述](#1-项目概述)
2. [仓库整体架构](#2-仓库整体架构)
3. [系统一：多语种在线教育平台 (client + server)](#3-系统一多语种在线教育平台-client--server)
   - 3.1 [后端服务 (server)](#31-后端服务-server)
   - 3.2 [前端应用 (client)](#32-前端应用-client)
4. [系统二：K12 学习平台 (k12-platform)](#4-系统二k12-学习平台-k12-platform)
   - 4.1 [Monorepo 结构](#41-monorepo-结构)
   - 4.2 [后端服务 (packages/server)](#42-后端服务-packagesserver)
   - 4.3 [Web 前端 (packages/web)](#43-web-前端-packagesweb)
   - 4.4 [Mobile 移动端 (packages/mobile)](#44-mobile-移动端-packagesmobile)
   - 4.5 [Desktop 桌面端 (packages/desktop)](#45-desktop-桌面端-packagesdesktop)
   - 4.6 [共享模块 (packages/shared)](#46-共享模块-packagesshared)
5. [依赖关系图](#5-依赖关系图)
6. [项目运行方式](#6-项目运行方式)
7. [技术栈总结](#7-技术栈总结)

---

## 1. 项目概述

本仓库包含 **两个独立的在线教育系统**：

| 系统 | 目录 | 定位 | 技术栈 |
|------|------|------|--------|
| 多语种在线教育平台 | `client/` + `server/` | 面向外语学习者的多语种（英语/日语/韩语）学习平台 | React + Express + SQLite |
| K12 学习平台 | `k12-platform/` | 面向中小学生的全学科辅导平台，集成 AI 对话/批改/出题 | React/RN/Electron + Express + Prisma + LLM |

---

## 2. 仓库整体架构

```
ai_learning/
├── client/                         # 多语种平台 - 前端 (React + Vite)
│   ├── public/
│   └── src/
│       ├── api/                    # API 请求层
│       ├── components/             # 通用组件
│       ├── hooks/                  # 自定义 Hooks (AuthContext)
│       ├── pages/                  # 页面组件 (12个)
│       └── utils/                  # 工具函数
│
├── server/                         # 多语种平台 - 后端 (Express + SQLite)
│   ├── data/                       # SQLite 数据库文件
│   └── src/
│       ├── db/                     # 数据库层 (初始化/Schema/种子数据)
│       ├── middleware/             # 中间件 (JWT认证)
│       └── routes/                 # 路由层 (6个模块)
│
├── k12-platform/                   # K12 平台 - Monorepo (pnpm workspace)
│   ├── packages/
│   │   ├── server/                 # 后端服务 (Express + Prisma + LLM)
│   │   ├── web/                    # Web 前端 (React + TypeScript)
│   │   ├── mobile/                 # 移动端 (React Native + Expo)
│   │   ├── desktop/                # 桌面端 (Electron + Vite)
│   │   └── shared/                 # 共享类型/工具
│   ├── pnpm-workspace.yaml
│   └── tsconfig.base.json
│
├── start.sh                        # 多语种平台一键启动脚本
└── CODE_WIKI.md                    # 本文件
```

---

## 3. 系统一：多语种在线教育平台 (client + server)

### 3.1 后端服务 (server)

**路径**: `f:\work\public_product\ai_learning\server\`

#### 3.1.1 入口与配置

| 文件 | 说明 |
|------|------|
| [src/index.js](file:///f:/work/public_product/ai_learning/server/src/index.js) | Express 应用入口，注册中间件与路由，监听 `3001` 端口 |
| [package.json](file:///f:/work/public_product/ai_learning/server/package.json) | 项目配置，类型 `module`（ESM），依赖: express / better-sqlite3 / bcryptjs / jsonwebtoken / cors |

启动代码核心逻辑：

```js
// src/index.js 关键代码
const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', authRoutes);         // 认证
app.use('/api', coursesRouter);           // 课程
app.use('/api/posts', postsRouter);       // 社区帖子
app.use('/api/learning', learningRouter); // 学习记录
app.use('/api/recommendations', recommendationsRouter); // 推荐
app.use('/api', achievementsRouter);      // 成就系统
app.listen(3001);
```

#### 3.1.2 数据库层 (db/)

| 文件 | 说明 |
|------|------|
| [database.js](file:///f:/work/public_product/ai_learning/server/src/db/database.js) | SQLite 连接初始化，使用 `better-sqlite3` 库，启用 WAL 模式和外键约束 |
| [schema.js](file:///f:/work/public_product/ai_learning/server/src/db/schema.js) | 数据库表结构定义（DDL），导出 `initDatabase()` |
| [init.js](file:///f:/work/public_product/ai_learning/server/src/db/init.js) | 独立初始化脚本入口 |
| [seed.js](file:///f:/work/public_product/ai_learning/server/src/db/seed.js) | 种子数据脚本，填充英语/日语/韩语课程及成就数据 |

**数据库 Schema (10 张表)**:

| 表名 | 关键字段 | 说明 |
|------|----------|------|
| `users` | id, email, password, username | 用户表 |
| `courses` | id, language, level, title, description | 课程表（按语种+级别组织） |
| `vocabulary_words` | id, course_id, word, meaning, example | 词汇表 |
| `grammar_questions` | id, course_id, question, options, correct_answer | 语法选择题 |
| `speaking_sentences` | id, course_id, sentence, translation | 口语跟读句子 |
| `listening_exercises` | id, course_id, question, options, correct_answer | 听力练习 |
| `learning_records` | id, user_id, course_id, activity_type, score | 学习记录 |
| `posts` | id, user_id, title, content | 社区帖子 |
| `replies` | id, post_id, user_id, content | 帖子回复 |
| `achievements` | id, name, description, icon, condition_type, condition_value | 成就定义 |
| `user_achievements` | id, user_id, achievement_id, earned_at | 用户获得的成就 |

**种子数据规模**:
- 英语 9 门课程 (入门/初级/中级 各3门) — 涵盖问候、数字、日常物品、餐厅、问路、购物、旅行、商务、文化
- 日语 9 门课程 — 涵盖五十音、寒暄、自我介绍、日常、交通、餐厅、敬语、商务、新闻
- 韩语 9 门课程 — 涵盖韩文基础、问候、数字、购物、餐厅、交通、文化、职场、时事
- 9 个成就定义

#### 3.1.3 中间件 (middleware/)

| 文件 | 说明 |
|------|------|
| [auth.js](file:///f:/work/public_product/ai_learning/server/src/middleware/auth.js) | JWT 认证中间件，从 `Authorization: Bearer <token>` 提取并验证 Token |

**功能**：
- 校验 Authorization Header 格式
- 使用 `jwt.verify()` 验证 Token
- 将 `{id, email}` 写入 `req.user`

#### 3.1.4 路由层 (routes/)

##### 认证模块 [auth.js](file:///f:/work/public_product/ai_learning/server/src/routes/auth.js)

| 路由 | 方法 | 认证 | 功能 |
|------|------|------|------|
| `/api/auth/register` | POST | 否 | 注册：校验邮箱密码格式，bcrypt 哈希密码，返回 JWT |
| `/api/auth/login` | POST | 否 | 登录：邮箱+密码校验，返回 JWT (7天有效) |
| `/api/auth/me` | GET | 是 | 获取当前用户信息 |

##### 课程模块 [courses.js](file:///f:/work/public_product/ai_learning/server/src/routes/courses.js)

| 路由 | 方法 | 认证 | 功能 |
|------|------|------|------|
| `/api/languages` | GET | 否 | 获取语种列表（DISTINCT language） |
| `/api/courses` | GET | 是 | 课程列表，支持 `?language=&level=` 筛选 |
| `/api/courses/:id` | GET | 是 | 课程详情（含四类活动计数） |
| `/api/courses/:id/vocabulary` | GET | 是 | 获取课程词汇表 |
| `/api/courses/:id/grammar` | GET | 是 | 获取语法题（不含答案） |
| `/api/courses/:id/speaking` | GET | 是 | 获取口语跟读句子 |
| `/api/courses/:id/listening` | GET | 是 | 获取听力题（不含答案） |
| `/api/courses/:id/grammar/check` | POST | 是 | 提交语法答案并评分 |
| `/api/courses/:id/listening/check` | POST | 是 | 提交听力答案并评分 |

**评分逻辑**：对比用户提交的 `{answers: [{question_id, answer}]}` 与数据库中的 `correct_answer`，返回每题对错、正确答案、解析及总分。

##### 学习记录模块 [learning.js](file:///f:/work/public_product/ai_learning/server/src/routes/learning.js)

| 路由 | 方法 | 认证 | 功能 |
|------|------|------|------|
| `/api/learning/records` | POST | 是 | 创建学习记录（`course_id` / `activity_type` / `score`），完成后触发成就检查 |
| `/api/learning/progress` | GET | 是 | 学习进度摘要：完成课程数 / 总活动数 / 四类技能均分 / 连续学习天数 |
| `/api/learning/history` | GET | 是 | 分页获取学习历史记录（含课程信息） |

**关键函数**：
- `checkAndAwardAchievements(userId)` (from achievements.js)：每创建学习记录时调用，检查是否达成新成就
- 连续学习天数计算：从当天向前遍历日期 Set，统计连续有学习记录的天数

##### 推荐模块 [recommendations.js](file:///f:/work/public_product/ai_learning/server/src/routes/recommendations.js)

| 路由 | 方法 | 认证 | 功能 |
|------|------|------|------|
| `/api/recommendations` | GET | 是 | 三级优先级推荐 |

**推荐算法**：
1. **优先级1（当前级别未完成）**：用户学过语种中，最高级别有待完成课程 → 推荐
2. **优先级2（下一级别）**：当前级别全部完成 → 推荐下一级别课程
3. **优先级3（新语种入门）**：从未学过的语种 → 推荐入门课程
4. 总计最多 6 门推荐

##### 社区帖子模块 [posts.js](file:///f:/work/public_product/ai_learning/server/src/routes/posts.js)

| 路由 | 方法 | 认证 | 功能 |
|------|------|------|------|
| `/api/posts` | GET | 是 | 分页获取帖子列表（标题预览100字，含回复数） |
| `/api/posts` | POST | 是 | 创建帖子（标题≤200字） |
| `/api/posts/:id` | GET | 是 | 帖子详情 + 回复列表 |
| `/api/posts/:id/replies` | POST | 是 | 创建回复 |

##### 成就模块 [achievements.js](file:///f:/work/public_product/ai_learning/server/src/routes/achievements.js)

| 路由 | 方法 | 认证 | 功能 |
|------|------|------|------|
| `/api/achievements` | GET | 是 | 获取全部成就（含当前用户获得状态） |
| `/api/users/:id/achievements` | GET | 是 | 获取指定用户的成就列表 |

**成就条件类型**：
- `completed_courses`：完成N门课程
- `streak_days`：连续学习N天
- `total_score`：累计积分达N分

**核心函数**：
- `checkAndAwardAchievements(userId)`：检查用户是否满足成就条件，满足则插入 `user_achievements` 表（`INSERT OR IGNORE`），返回新获得的成就列表
- `calculateStreakDays(userId)`：计算用户连续学习天数

---

### 3.2 前端应用 (client)

**路径**: `f:\work\public_product\ai_learning\client\`

#### 3.2.1 技术配置

| 文件 | 说明 |
|------|------|
| [package.json](file:///f:/work/public_product/ai_learning/client/package.json) | React 19 + react-router-dom 7 + axios + recharts，Vite 8 构建 |
| [vite.config.js](file:///f:/work/public_product/ai_learning/client/vite.config.js) | 配置 `/api` 代理到 `http://localhost:3001` |

#### 3.2.2 入口与路由

[App.jsx](file:///f:/work/public_product/ai_learning/client/src/App.jsx) 使用 `react-router-dom` 的 `BrowserRouter` + `Routes`：

**路由表**:

| 路径 | 组件 | 公开/保护 |
|------|------|-----------|
| `/` | HomePage | 公开 |
| `/login` | LoginPage | 公开 |
| `/register` | RegisterPage | 公开 |
| `/courses` | CoursesPage | 需认证 |
| `/courses/:id` | CourseDetailPage | 需认证 |
| `/courses/:id/vocabulary` | VocabularyPage | 需认证 |
| `/courses/:id/grammar` | GrammarPage | 需认证 |
| `/courses/:id/listening` | ListeningPage | 需认证 |
| `/courses/:id/speaking` | SpeakingPage | 需认证 |
| `/dashboard` | DashboardPage | 需认证 |
| `/recommend` | RecommendPage | 需认证 |
| `/community` | CommunityPage | 需认证 |
| `/community/:id` | PostDetailPage | 需认证 |
| `/profile` | ProfilePage | 需认证 |

#### 3.2.3 核心模块

##### API 层 [api/index.js](file:///f:/work/public_product/ai_learning/client/src/api/index.js)

```js
// Axios 实例配置
const api = axios.create({
  baseURL: '/api',      // 通过 Vite proxy 转发到后端
  timeout: 10000,
});

// 请求拦截器：自动附加 JWT Token
// 响应拦截器：401 时自动清除 token 并跳转登录页
```

##### 认证上下文 [hooks/AuthContext.jsx](file:///f:/work/public_product/ai_learning/client/src/hooks/AuthContext.jsx)

`AuthProvider` + `useAuth()` Hook：
- **状态**: `user`, `token`, `loading`, `isAuthenticated`
- **方法**: `login(email, password)`, `register(username, email, password)`, `logout()`
- **初始化**: 从 `localStorage` 恢复 Token，调用 `/auth/me` 验证有效性

##### 布局组件 [components/Layout.jsx](file:///f:/work/public_product/ai_learning/client/src/components/Layout.jsx)

全局布局：Header（导航栏 + 登录状态）+ `<Outlet />` + Footer

##### 路由守卫 [components/ProtectedRoute.jsx](file:///f:/work/public_product/ai_learning/client/src/components/ProtectedRoute.jsx)

- `loading` 状态下显示"加载中..."
- 未认证则 `<Navigate to="/login">`

##### 工具函数 [utils/timeFormat.js](file:///f:/work/public_product/ai_learning/client/src/utils/timeFormat.js)

`formatRelativeTime(dateString)`：ISO 时间转中文相对时间（"刚刚"/"3分钟前"/"2小时前"/"5天前"/"2个月前"）

#### 3.2.4 页面组件说明

| 页面 | 关键功能 |
|------|----------|
| **HomePage** | 平台首页 |
| **LoginPage / RegisterPage** | 登录注册表单，调用 `useAuth()` |
| **CoursesPage** | 语种标签切换 + 级别筛选 → 课程卡片网格 → 进入详情 |
| **CourseDetailPage** | 课程信息 + 4 种学习活动入口（词汇/语法/口语/听力） |
| **VocabularyPage** | 单词卡片学习 |
| **GrammarPage** | 选择题作答 + 自动评分 |
| **ListeningPage** | 听力题作答 + 自动评分 |
| **SpeakingPage** | 跟读句子练习 |
| **DashboardPage** | Recharts 柱状图（四项技能得分）+ 统计卡片 + 学习时间线 |
| **RecommendPage** | 三级推荐列表（继续学习 / 下一级别 / 新语种入门） |
| **CommunityPage** | 帖子列表（分页） |
| **PostDetailPage** | 帖子详情 + 回复列表 + 发表回复 |
| **ProfilePage** | 用户个人资料页 |

---

## 4. 系统二：K12 学习平台 (k12-platform)

**路径**: `f:\work\public_product\ai_learning\k12-platform\`

### 4.1 Monorepo 结构

使用 **pnpm workspace** 管理，配置文件 [pnpm-workspace.yaml](file:///f:/work/public_product/ai_learning/k12-platform/pnpm-workspace.yaml)：

```
packages:
  - 'packages/*'
```

| 包名 | 目录 | 类型 | 描述 |
|------|------|------|------|
| `@k12/server` | packages/server | Node.js | Express 后端 + Prisma ORM + LLM 集成 |
| `@k12/web` | packages/web | Web | React + TS Web 前端 |
| `@k12/mobile` | packages/mobile | Mobile | React Native + Expo 移动端 |
| `@k12/desktop` | packages/desktop | Desktop | Electron 桌面端 |
| `@k12/shared` | packages/shared | Lib | 共享类型定义和工具函数 |

根 [package.json](file:///f:/work/public_product/ai_learning/k12-platform/package.json) 脚本：

```json
{
  "dev:web":      "pnpm --filter @k12/web dev",
  "dev:desktop":  "pnpm --filter @k12/desktop dev",
  "dev:mobile":   "pnpm --filter @k12/mobile start",
  "dev:server":   "pnpm --filter @k12/server dev",
  "typecheck":     "同时对所有包执行 tsc --noEmit",
  "lint":          "eslint packages/*/src --ext .ts,.tsx"
}
```

---

### 4.2 后端服务 (packages/server)

**路径**: `f:\work\public_product\ai_learning\k12-platform\packages\server\`

#### 4.2.1 依赖

```
express / @prisma/client / bcryptjs / jsonwebtoken / cors / dotenv / morgan
```

#### 4.2.2 入口与应用

| 文件 | 说明 |
|------|------|
| [src/index.ts](file:///f:/work/public_product/ai_learning/k12-platform/packages/server/src/index.ts) | 服务器启动入口，读取 config 端口 |
| [src/app.ts](file:///f:/work/public_product/ai_learning/k12-platform/packages/server/src/app.ts) | Express 应用工厂：安全头 / CORS / JSON 解析 / 日志 / 路由 / 错误处理 |
| [src/config/index.ts](file:///f:/work/public_product/ai_learning/k12-platform/packages/server/src/config/index.ts) | 环境配置：端口(3001) / JWT密钥 / 数据库URL |

中间件链：
1. 安全响应头（`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, HSTS）
2. 响应时间记录（`X-Response-Time`）
3. CORS（origin: `localhost:5173`）
4. JSON body parser
5. 请求日志 (`requestLogger`)
6. 全局错误处理 (`errorHandler`)

#### 4.2.3 数据库 (Prisma + SQLite)

[prisma/schema.prisma](file:///f:/work/public_product/ai_learning/k12-platform/packages/server/prisma/schema.prisma) — 数据模型：

```
User ──┬── StudyRecord ──── KnowledgePoint ───── Chapter ──┬── Subject
       ├── WrongAnswer ───── Question ──────────────────────┤
       └── ChatHistory                                      └── Grade
```

| 模型 | 关键字段 | 说明 |
|------|----------|------|
| **User** | email(unique), password, nickname, grade, subjects, phone, avatar | 用户（支持年级和学科偏好） |
| **Subject** | name(unique), icon, sortOrder | 学科（语文/数学/英语/物理/化学/生物/历史/地理） |
| **Grade** | name(unique), level(1-12) | 年级（一年级 ~ 高三） |
| **Chapter** | subjectId, gradeId, title, description | 章节（关联学科+年级） |
| **KnowledgePoint** | chapterId, title, content(markdown), videoUrl | 知识点 |
| **Question** | knowledgePointId, type(choice/fill/judge/essay), content, options(json), answer, explanation, difficulty(1-3) | 题目 |
| **StudyRecord** | userId, knowledgePointId, status, score | 学习记录 |
| **WrongAnswer** | userId, questionId, userAnswer, correctAnswer | 错题记录 |
| **ChatHistory** | userId, sessionId, role(user/assistant), content | AI 对话历史 |

#### 4.2.4 路由层

##### 健康检查 [routes/health.ts](file:///f:/work/public_product/ai_learning/k12-platform/packages/server/src/routes/health.ts)

`GET /api/health` — 返回 `{ status: "ok" }`

##### 认证模块 [routes/auth.ts](file:///f:/work/public_product/ai_learning/k12-platform/packages/server/src/routes/auth.ts)

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/auth/register` | POST | 注册（email/nickname/password必填，支持 grade/phone 可选） |
| `/api/auth/login` | POST | 登录（支持邮箱或手机号登录） |
| `/api/auth/me` | GET | 获取当前用户完整信息 |
| `/api/auth/profile` | PUT | 更新用户资料（nickname/grade/subjects/avatar） |

##### 课程模块 [routes/courses.ts](file:///f:/work/public_product/ai_learning/k12-platform/packages/server/src/routes/courses.ts)

获取学科列表、年级列表、章节列表、知识点详情、题目列表等

##### 学习模块 [routes/study.ts](file:///f:/work/public_product/ai_learning/k12-platform/packages/server/src/routes/study.ts)

| 路由 | 方法 | 功能 |
|------|------|------|
| `/api/study/records` | POST | 创建/更新学习记录 (upsert) |
| `/api/study/progress` | GET | 学习进度摘要（含学科/年级进度、完成率、正确率、最近活动） |
| `/api/wrong-answers` | GET | 分页获取错题列表（支持学科/知识点筛选） |
| `/api/wrong-answers/:id` | DELETE | 删除错题记录 |
| `/api/study/stats` | GET | 今日/本周统计（完成数、正确率、周趋势、待复习数） |

##### AI 模块 [routes/ai.ts](file:///f:/work/public_product/ai_learning/k12-platform/packages/server/src/routes/ai.ts) 核心功能

| 路由 | 方法 | 功能 | 说明 |
|------|------|------|------|
| `/api/ai/chat` | POST | SSE 流式对话 | AI 学习助手，支持上下文（知识点/章节/题目），LaTeX 公式 |
| `/api/ai/chat/save` | POST | 保存对话记录 | |
| `/api/ai/chat/history` | GET | 获取会话历史 | |
| `/api/ai/chat/sessions` | GET | 获取用户会话列表 | 自动取第一个用户消息作标题 |
| `/api/ai/essay-grade` | POST | 作文批改 | 四维度评分（立意/结构/语言/内容，各25分） |
| `/api/ai/generate-questions` | POST | 智能出题 | 支持选择题/填空题/判断题/问答题混合，1-10道 |
| `/api/ai/photo-search` | POST | 拍照搜题 | 支持 base64 图片，调用多模态 LLM 识别并解答 |

#### 4.2.5 LLM 服务 [services/llm.ts](file:///f:/work/public_product/ai_learning/k12-platform/packages/server/src/services/llm.ts)

支持**三种提供商自动切换**：

| 提供商 | 条件 | API 端点 | 模型 |
|--------|------|----------|------|
| **DeepSeek** | `DEEPSEEK_API_KEY` 存在 | `api.deepseek.com` | deepseek-chat |
| **Qwen (通义千问)** | `DASHSCOPE_API_KEY` 存在 | `dashscope.aliyuncs.com` | qwen-plus |
| **Fallback** | 无 API Key | 本地模拟 | 预设回复（按关键词匹配） |

**核心函数**：
- `callLLM(messages, onToken)` — 统一入口，自动选择提供商
- `callDeepSeek(messages, onToken)` — DeepSeek 流式调用
- `callQwen(messages, onToken)` — Qwen 流式调用（OpenAI 兼容模式）
- `callFallback(message, onToken)` — 本地模拟流式输出（50ms/字）
- `parseSSEStream(body, onData)` — 通用 SSE 流解析器

#### 4.2.6 中间件

| 文件 | 说明 |
|------|------|
| [middleware/auth.ts](file:///f:/work/public_product/ai_learning/k12-platform/packages/server/src/middleware/auth.ts) | `requireAuth()` + `optionalAuth()` — JWT 认证 / 可选认证，验证后查询 Prisma 确认用户存在 |
| [middleware/logger.ts](file:///f:/work/public_product/ai_learning/k12-platform/packages/server/src/middleware/logger.ts) | 请求日志中间件 |
| [middleware/errorHandler.ts](file:///f:/work/public_product/ai_learning/k12-platform/packages/server/src/middleware/errorHandler.ts) | 全局错误处理中间件 |

---

### 4.3 Web 前端 (packages/web)

**路径**: `f:\work\public_product\ai_learning\k12-platform\packages\web\`

#### 4.3.1 路由与页面

[App.tsx](file:///f:/work/public_product/ai_learning/k12-platform/packages/web/src/App.tsx) 使用 React lazy + Suspense：

| 路径 | 页面组件 | 功能 |
|------|----------|------|
| `/login` | LoginPage | 登录 |
| `/register` | RegisterPage | 注册 |
| `/` | HomePage | 首页（需认证） |
| `/preferences` | PreferencesPage | 学科/年级偏好设置 |
| `/study` | StudyCenterPage | 学习中心 |
| `/study/:knowledgePointId` | LearningPage | 知识点学习页 |
| `/practice` | PracticePage | 练习/做题 |
| `/practice/:knowledgePointId` | PracticePage | 指定知识点练习 |
| `/wrong-book` | WrongBookPage | 错题本 |
| `/ai-chat` | AIChatPage | AI 对话（SSE 流式） |
| `/essay-grading` | EssayGradingPage | 作文批改 |
| `/generate-questions` | QuestionGenerationPage | AI 出题 |
| `/photo-search` | PhotoSearchPage | 拍照搜题 |
| `/profile` | ProfilePage | 个人资料 |

#### 4.3.2 核心组件

| 目录/文件 | 说明 |
|-----------|------|
| `components/layout/MainLayout.tsx` | 主布局 |
| `components/layout/ThreeColumnLayout.tsx` | 三栏布局（侧边栏+主内容+AI面板） |
| `components/layout/AIPanel.tsx` | AI 对话面板 |
| `components/layout/TopBar.tsx` | 顶部导航栏 |
| `components/layout/ThemeToggle.tsx` | 主题切换 |
| `components/chat/ChatInput.tsx` | AI 对话输入框 |
| `components/chat/ChatMessage.tsx` | 对话消息气泡 |
| `components/chat/InlineAIChat.tsx` | 内联 AI 对话 |
| `components/chat/SessionList.tsx` | 会话列表 |
| `components/markdown/MarkdownRenderer.tsx` | Markdown 渲染器（支持 KaTeX 数学公式） |
| `components/ImageWithLazy.tsx` | 懒加载图片 |
| `components/OfflineIndicator.tsx` | 离线状态指示器 |
| `components/PreferenceSetup.tsx` | 偏好设置向导 |
| `components/ProtectedRoute.tsx` | 路由守卫 |

#### 4.3.3 API 层

| 文件 | 说明 |
|------|------|
| `api/client.ts` | Axios 实例（请求/响应拦截器） |
| `api/auth.ts` | 认证 API |
| `api/ai.ts` | AI 对话/批改/出题/搜题 API |
| `api/courses.ts` | 课程相关 API |
| `api/study.ts` | 学习记录相关 API |

#### 4.3.4 状态管理

| 文件 | 说明 |
|------|------|
| `store/authStore.ts` | Zustand 认证状态 |
| `store/layoutStore.ts` | Zustand 布局状态 |

---

### 4.4 Mobile 移动端 (packages/mobile)

**路径**: `f:\work\public_product\ai_learning\k12-platform\packages\mobile\`

React Native + Expo 应用，主入口 [App.tsx](file:///f:/work/public_product/ai_learning/k12-platform/packages/mobile/App.tsx)

#### 页面 (screens/)

| 屏幕 | 功能 |
|------|------|
| HomeScreen | 首页 |
| StudyScreen | 学习中心 |
| LearningDetailScreen | 知识点详情 |
| AIChatScreen | AI 对话 |
| PhotoSearchScreen | 拍照搜题 |
| ProfileScreen | 个人资料 |

#### 其他

| 文件 | 说明 |
|------|------|
| `contexts/AuthContext.tsx` | 认证上下文 |
| `navigation/AppNavigator.tsx` | 导航配置 |
| `services/api.ts` | API 请求服务 |

---

### 4.5 Desktop 桌面端 (packages/desktop)

**路径**: `f:\work\public_product\ai_learning\k12-platform\packages\desktop\`

Electron + Vite 应用：

| 文件 | 说明 |
|------|------|
| `electron/main.ts` | Electron 主进程 |
| `electron/preload.ts` | 预加载脚本 |

---

### 4.6 共享模块 (packages/shared)

**路径**: `f:\work\public_product\ai_learning\k12-platform\packages\shared\`

[src/types/index.ts](file:///f:/work/public_product/ai_learning/k12-platform/packages/shared/src/types/index.ts) — 共享 TypeScript 类型定义：

| 类型 | 用途 |
|------|------|
| `UserRole` enum | 用户角色（student/teacher/parent/admin） |
| `Grade` enum | 年级（1-12） |
| `Subject` enum | 学科（9科） |
| `User` interface | 用户数据 |
| `Course` interface | 课程数据 |
| `LearningProgress` interface | 学习进度 |
| `ApiResponse<T>` | 通用 API 响应格式 |
| `PaginationParams` / `PaginatedResponse<T>` | 分页参数与响应 |

---

## 5. 依赖关系图

```
┌──────────────────────────────────────────────────────────────────┐
│                    多语种在线教育平台                              │
│                                                                  │
│   ┌─────────────┐     HTTP (JWT)     ┌─────────────────┐        │
│   │   client/    │ ◄────────────────►│    server/      │        │
│   │  (React 19)  │   /api/* proxy   │  (Express 5)    │        │
│   │  Vite :5173  │                   │  SQLite :3001   │        │
│   └─────────────┘                    └──────┬──────────┘        │
│       │                                     │                    │
│       │ axios + react-router-dom            │ better-sqlite3     │
│       │ recharts                            │ bcryptjs + jwt     │
│       ▼                                     ▼                    │
│   React Context (AuthProvider)         app.db (WAL mode)         │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       K12 学习平台                                │
│                                                                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│   │  web/    │  │ mobile/  │  │ desktop/ │                     │
│   │ (React)  │  │ (RN+Expo)│  │(Electron)│                     │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘                     │
│        │              │             │                             │
│        └──────────────┼─────────────┘                             │
│                       │ HTTP (JWT)                                │
│                       ▼                                           │
│               ┌──────────────┐                                   │
│               │  server/     │                                   │
│               │ (Express 4)  │                                   │
│               │ :3001        │                                   │
│               └──────┬───────┘                                   │
│                      │                                           │
│         ┌────────────┼────────────┐                              │
│         ▼            ▼            ▼                              │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│   │  Prisma  │ │ DeepSeek │ │  Qwen    │                        │
│   │ (SQLite) │ │   API    │ │  API     │                        │
│   └──────────┘ └──────────┘ └──────────┘                        │
│                                                                  │
│   ┌──────────────────┐                                           │
│   │    shared/        │  ←── 被所有前端包依赖                      │
│   │ (类型 + 工具)      │                                          │
│   └──────────────────┘                                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. 项目运行方式

### 6.1 多语种在线教育平台

#### 环境要求
- Node.js >= 18
- npm

#### 一键启动 (Linux/Mac)

```bash
bash start.sh
```

该脚本会依次执行：
1. 安装 `server/` 和 `client/` 的依赖
2. 初始化数据库并填充种子数据
3. 并行启动后端 (`:3001`) 和前端 (`:5173`)

#### 手动启动

```bash
# 1. 安装依赖
cd server && npm install
cd client && npm install

# 2. 初始化数据库（创建表 + 种子数据）
cd server && npm run seed

# 3. 启动后端（终端1）
cd server && npm start
# → http://localhost:3001

# 4. 启动前端（终端2）
cd client && npm run dev
# → http://localhost:5173
```

**前端 Vite 自动将 `/api` 代理到 `http://localhost:3001`**

#### 数据库独立操作

```bash
cd server
npm run init-db     # 仅创建表（不填充数据）
npm run seed        # 创建表 + 填充英语/日语/韩语课程种子数据
```

### 6.2 K12 学习平台

#### 环境要求
- Node.js >= 18
- pnpm

#### 启动步骤

```bash
cd k12-platform

# 1. 安装依赖
pnpm install

# 2. 初始化数据库
cd packages/server
npx prisma migrate dev      # 执行迁移
npx prisma db seed          # 填充种子数据

# 3. 配置环境变量
# 编辑 packages/server/.env:
#   DATABASE_URL="file:./dev.db"
#   JWT_SECRET="your-secret"
#   DEEPSEEK_API_KEY="sk-xxx"  # 可选，用于 AI 功能
#   DASHSCOPE_API_KEY="sk-xxx" # 可选，通义千问

# 4. 启动服务
# 后端
pnpm --filter @k12/server dev
# → http://localhost:3001

# Web 前端
pnpm --filter @k12/web dev
# → http://localhost:5173

# 移动端
pnpm --filter @k12/mobile start

# 桌面端
pnpm --filter @k12/desktop dev
```

#### 根级快捷命令

```bash
pnpm dev:server    # 启动后端
pnpm dev:web       # 启动 Web 前端
pnpm typecheck     # 所有包 TypeScript 类型检查
pnpm lint          # ESLint 检查
pnpm format        # Prettier 格式化
```

---

## 7. 技术栈总结

### 多语种在线教育平台

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + React Router DOM 7 |
| 构建工具 | Vite 8 |
| HTTP 客户端 | Axios |
| 数据可视化 | Recharts |
| 后端框架 | Express 5 |
| 数据库 | SQLite (better-sqlite3) |
| 认证 | JWT + bcryptjs |
| 包格式 | ESM (`type: "module"`) |

### K12 学习平台

| 层级 | 技术 |
|------|------|
| Monorepo 管理 | pnpm workspace |
| 前端框架 | React 18 + React Router DOM 6 + TypeScript |
| 移动端 | React Native + Expo |
| 桌面端 | Electron + Vite |
| 构建工具 | Vite 5 |
| 后端框架 | Express 4 + TypeScript |
| ORM | Prisma 5 |
| 数据库 | SQLite |
| 认证 | JWT + bcryptjs |
| AI 集成 | DeepSeek API / Qwen (通义千问) DashScope API |
| 流式通信 | SSE (Server-Sent Events) |
| 数学渲染 | KaTeX |
| 状态管理 | Zustand |
| 包格式 | TypeScript → CommonJS/ESM |

---

*文档生成时间: 2026-06-15*