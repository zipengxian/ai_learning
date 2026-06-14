# 中小学学习平台 - 实现计划（分解与优先级排序）

---

## [x] Task 1: 项目基础架构搭建（Web + 桌面端 + 移动端 Monorepo）
- **优先级**：P0
- **依赖**：无
- **描述**：
  - 使用 pnpm workspace 初始化 Monorepo 结构：`packages/web`, `packages/desktop`, `packages/mobile`, `packages/shared`
  - Web 端：Vite + React 18 + TypeScript 模板
  - 桌面端：Electron + Vite 模板，复用 `packages/web` 代码
  - 移动端：Expo + React Native 模板
  - 共享包 `packages/shared`：类型定义、API 封装、工具函数
  - 配置 ESLint、Prettier、TypeScript 共享配置
- **验收标准**：AC-1（三栏布局的基础架构支撑）
- **测试要求**：
  - `programmatic` TR-1.1：Web 端 `npm run dev` 启动成功
  - `programmatic` TR-1.2：桌面端 `npm run dev` 启动 Electron 窗口
  - `programmatic` TR-1.3：移动端 `npx expo start` 启动成功
  - `programmatic` TR-1.4：`packages/shared` 可在三个端中正常导入

---

## [x] Task 2: 后端 API 基础框架
- **优先级**：P0
- **依赖**：无
- **描述**：
  - Node.js + Express + TypeScript 后端项目
  - PostgreSQL 数据库连接（使用 Prisma ORM）
  - 目录结构：`src/routes/`, `src/middleware/`, `src/services/`, `src/prisma/`
  - 健康检查端点 `/api/health`
  - CORS 配置、JSON body parser、请求日志中间件
- **测试要求**：
  - `programmatic` TR-2.1：`npm run dev` 后端启动成功
  - `programmatic` TR-2.2：`/api/health` 返回 `{ status: "ok" }`
  - `programmatic` TR-2.3：Prisma schema 可正常同步到数据库

---

## [x] Task 3: 数据库 Schema 设计与种子数据
- **优先级**：P0
- **依赖**：Task 2
- **描述**：
  - Prisma Schema 定义以下模型：
    - `User`（id, email, phone, password, nickname, grade, avatar, created_at）
    - `Subject`（id, name, icon, sort_order）— 语文/数学/英语/物理/化学/生物/历史/地理
    - `Grade`（id, name, level）— 一年级到高三
    - `Chapter`（id, subject_id, grade_id, title, description, sort_order）
    - `KnowledgePoint`（id, chapter_id, title, content, video_url, sort_order）
    - `Question`（id, knowledge_point_id, type, content, options, answer, explanation, difficulty）
    - `StudyRecord`（id, user_id, knowledge_point_id, status, score, completed_at）
    - `WrongAnswer`（id, user_id, question_id, user_answer, correct_answer, created_at）
    - `ChatHistory`（id, user_id, session_id, role, content, created_at）
  - 种子数据脚本：预置 1-9 年级的语文、数学、英语基础章节和示例题目
- **验收标准**：AC-2 的数据基础
- **测试要求**：
  - `programmatic` TR-3.1：Prisma migrate 成功创建所有表
  - `programmatic` TR-3.2：种子数据包含至少 2 个年级 × 3 个学科的基础章节
  - `programmatic` TR-3.3：每章节至少包含 1 个知识点和 3 道练习题

---

## [x] Task 4: 后端用户认证 API
- **优先级**：P0
- **依赖**：Task 3
- **描述**：
  - POST `/api/auth/register` — 邮箱/手机号注册
  - POST `/api/auth/login` — 登录，签发 JWT
  - GET `/api/auth/me` — 获取当前用户信息
  - PUT `/api/auth/profile` — 更新用户信息（年级、学科偏好）
  - JWT 认证中间件
  - bcrypt 密码哈希
- **测试要求**：
  - `programmatic` TR-4.1：注册成功返回 JWT
  - `programmatic` TR-4.2：重复邮箱注册返回 409
  - `programmatic` TR-4.3：登录成功返回 200 + JWT
  - `programmatic` TR-4.4：未认证请求返回 401

---

## [x] Task 5: 后端课程内容 API
- **优先级**：P0
- **依赖**：Task 3
- **描述**：
  - GET `/api/subjects` — 获取所有学科列表
  - GET `/api/grades` — 获取所有年级列表
  - GET `/api/chapters?subject=&grade=` — 按学科和年级获取章节大纲
  - GET `/api/chapters/:id/knowledge-points` — 获取章节下知识点列表
  - GET `/api/knowledge-points/:id` — 获取知识点详情（含练习题）
  - GET `/api/questions?knowledge_point=&type=&difficulty=` — 按条件筛选题目
  - POST `/api/questions/check` — 提交答案并批改
- **测试要求**：
  - `programmatic` TR-5.1：GET `/api/subjects` 返回完整学科列表
  - `programmatic` TR-5.2：GET `/api/chapters?subject=数学&grade=1` 返回一年级数学章节
  - `programmatic` TR-5.3：POST `/api/questions/check` 正确批改并返回结果

---

## [x] Task 6: 后端学习记录与错题本 API
- **优先级**：P1
- **依赖**：Task 4, Task 5
- **描述**：
  - POST `/api/study/records` — 记录学习完成状态
  - GET `/api/study/progress` — 获取学习进度摘要（完成章节数、总时长等）
  - GET `/api/wrong-answers?subject=&knowledge_point=` — 获取错题列表（按学科/知识点筛选）
  - DELETE `/api/wrong-answers/:id` — 在掌握后删除错题记录
- **测试要求**：
  - `programmatic` TR-6.1：提交学习记录后进度接口数据更新
  - `programmatic` TR-6.2：答错题目自动记录到错题本
  - `programmatic` TR-6.3：错题按学科和知识点归类

---

## [x] Task 7: 后端 AI 助手 API
- **优先级**：P0
- **依赖**：Task 4
- **描述**：
  - POST `/api/ai/chat` — SSE 流式对话接口
    - 接收：`{ message, context: { chapter_id?, knowledge_point_id?, question_id?, history: [...] } }`
    - 调用第三方 LLM API（DeepSeek/通义千问），流式返回
    - 支持 Markdown 和 LaTeX 格式输出
  - POST `/api/ai/chat/save` — 保存对话历史
  - GET `/api/ai/chat/history?session_id=` — 获取对话历史
  - GET `/api/ai/chat/sessions` — 获取会话列表
  - 上下文感知：将当前学习章节/题目信息作为 system prompt 传递给 LLM
  - API 不可用时的降级方案：返回预设问答库匹配结果
- **测试要求**：
  - `programmatic` TR-7.1：SSE 接口正确返回流式数据（需 mock LLM）
  - `programmatic` TR-7.2：对话历史保存和读取正常
  - `programmatic` TR-7.3：上下文信息正确传递给 LLM
  - `programmatic` TR-7.4：LLM 不可用时降级返回预设回答

---

## [x] Task 8: 三端共享组件库 - Trae 风格 UI
- **优先级**：P0
- **依赖**：Task 1
- **描述**：
  - 在 `packages/shared` 中构建基础 UI 组件库，参考 Trae 设计风格：
  - **布局组件**：
    - `ThreeColumnLayout` — 左侧导航 + 中央内容 + 右侧 AI 面板
    - `SidePanel` — 可收起/展开/拖拽宽度的侧边栏
    - `TopBar` — 顶部导航栏（搜索、主题切换、用户菜单）
  - **通用组件**：
    - `Button`, `Input`, `Select`, `Card`, `Modal`, `Tabs`, `Badge`, `Tag`
    - `MarkdownRenderer` — Markdown + LaTeX 渲染（支持公式、代码高亮）
    - `LoadingSpinner`, `EmptyState`, `ErrorBoundary`
  - **主题系统**：
    - CSS 变量体系（颜色、间距、字体、圆角、阴影）
    - 明暗两套主题，默认跟随系统
    - 主题切换上下文 ThemeProvider
  - 组件在 Web 端使用原生 DOM，在移动端使用 React Native 适配层
- **验收标准**：AC-1, AC-7
- **测试要求**：
  - `human-judgment` TR-8.1：三栏布局正确渲染，左侧面板可收起/展开
  - `human-judgment` TR-8.2：主题切换后所有组件配色正确切换
  - `human-judgment` TR-8.3：AI 面板可拖拽调整宽度（桌面端）
  - `programmatic` TR-8.4：Markdown 渲染器正确渲染代码块和 LaTeX 公式

---

## [x] Task 9: 前端 Web 端 - 布局框架与路由
- **优先级**：P0
- **依赖**：Task 1, Task 8
- **描述**：
  - 实现 Trae 风格三栏布局
  - 配置路由：
    - `/` — 首页（学习看板）
    - `/study` — 学习中心（大纲浏览 + 内容学习）
    - `/practice` — 练习中心
    - `/wrong-book` — 错题本
    - `/ai-chat` — AI 对话（独立全屏模式）
    - `/profile` — 个人中心
  - 实现路由守卫
  - 全局状态管理（Zustand）：用户状态、主题状态、AI 面板状态
  - 搜索栏：支持按知识点/章节关键字搜索
- **测试要求**：
  - `programmatic` TR-9.1：未登录重定向到登录页
  - `human-judgment` TR-9.2：三栏布局在各路由下保持一致
  - `human-judgment` TR-9.3：AI 面板收起/展开动画流畅

---

## [x] Task 10: 前端 Web 端 - 用户认证页面
- **优先级**：P0
- **依赖**：Task 4, Task 9
- **描述**：
  - 登录页（邮箱/手机号 + 密码）
  - 注册页（邮箱/手机号 + 密码 + 确认密码 + 选择年级）
  - 首页首次引导（选择学科偏好）
  - 页面采用卡片式布局，居中显示，简洁风格
- **测试要求**：
  - `programmatic` TR-10.1：注册后自动登录并跳转引导页
  - `programmatic` TR-10.2：偏好设置后首页展示对应学科内容
  - `programmatic` TR-10.3：登录 token 过期后自动跳转登录页

---

## [x] Task 11: 前端 Web 端 - 学习中心（大纲 + 内容）
- **优先级**：P0
- **依赖**：Task 5, Task 9
- **描述**：
  - 左侧面板：学科选择 tabs + 年级选择 + 章节大纲树
  - 中央内容区：
    - 知识点讲解页面（标题 + 正文 + 示例 + 视频）
    - 练习题页面（选择题/填空题/判断题 UI）
    - 作答交互与自动批改反馈
  - 知识点完成后可标记"已掌握"
- **验收标准**：AC-2, AC-3
- **测试要求**：
  - `programmatic` TR-11.1：大纲树正确展示章节和知识点层级
  - `programmatic` TR-11.2：选择题作答后显示正确/错误反馈
  - `programmatic` TR-11.3：提交答案后学习记录写入后端

---

## [x] Task 12: 前端 Web 端 - AI 助手面板
- **优先级**：P0
- **依赖**：Task 7, Task 8, Task 9
- **描述**：
  - 右侧面板常驻 AI 聊天窗口
  - 消息输入框 + 发送按钮
  - SSE 流式消息展示（逐字输出效果）
  - Markdown + LaTeX 渲染对话内容
  - 上下文感知：点击知识点旁的"问AI"按钮自动带入上下文
  - 对话历史展示（按会话分组）
  - 清除对话、新建会话
  - AI 面板收起/展开按钮
- **验收标准**：AC-4, AC-5
- **测试要求**：
  - `programmatic` TR-12.1：发送消息后 SSE 流式渲染正常
  - `programmatic` TR-12.2：LaTeX 公式正确渲染
  - `human-judgment` TR-12.3：点击"问AI"按钮后消息框携带上下文信息
  - `programmatic` TR-12.4：对话历史保存后可重新加载

---

## [x] Task 13: 前端 Web 端 - 错题本与学习看板
- **优先级**：P1
- **依赖**：Task 6, Task 9
- **描述**：
  - 错题本页面：
    - 按学科筛选错题
    - 展示题目 + 用户答案 + 正确答案 + 解析
    - "重新练习"功能（重置错题记录）
    - "已掌握"标记（从错题本移除）
  - 学习看板（首页）：
    - 今日学习统计（完成知识点数、正确率）
    - 本周学习趋势（简单图表）
    - 最近学习记录时间线
    - 待复习错题数提醒
- **验收标准**：AC-6
- **测试要求**：
  - `programmatic` TR-13.1：错题本正确展示所有错题
  - `programmatic` TR-13.2：标记已掌握后错题消失
  - `human-judgment` TR-13.3：看板图表数据正确

---

## [x] Task 14: 桌面端 Electron 封装
- **优先级**：P1
- **依赖**：Task 9
- **描述**：
  - 在 `packages/desktop` 中配置 Electron 主进程
  - 加载 Web 端构建产物
  - 配置窗口标题、图标、最小尺寸
  - 配置系统托盘
  - 配置自动更新（electron-updater）
  - 打包配置（electron-builder）：Windows .exe / macOS .dmg
- **验收标准**：AC-9
- **测试要求**：
  - `programmatic` TR-14.1：Electron 开发模式启动窗口正常
  - `programmatic` TR-14.2：打包后安装包可正常安装和运行
  - `programmatic` TR-14.3：窗口最小尺寸限制生效

---

## [x] Task 15: 移动端 React Native 适配
- **优先级**：P1
- **依赖**：Task 1, Task 8
- **描述**：
  - 底部 Tab 导航：首页 / 学习 / AI / 我的
  - 从 `packages/shared` 复用组件（需 React Native 适配层）
  - 左侧导航改为抽屉式（Drawer Navigation）
  - AI 助手改为全屏聊天页面
  - 学习内容展示适配触控操作
  - 离线缓存：使用 expo-file-system + SQLite 缓存章节内容
  - 视频播放使用 expo-av
- **验收标准**：AC-8, AC-11
- **测试要求**：
  - `programmatic` TR-15.1：底部 Tab 导航切换正常
  - `programmatic` TR-15.2：抽屉导航可正常打开和关闭
  - `programmatic` TR-15.3：离线状态下可浏览已缓存内容
  - `programmatic` TR-15.4：AI 全屏聊天页面功能与 Web 端一致

---

## [x] Task 16: 跨设备进度同步
- **优先级**：P1
- **依赖**：Task 6, Task 13, Task 15
- **描述**：
  - 学习记录、错题本数据统一存储在后端
  - 移动端登录后自动拉取最新进度
  - 学习完成后实时同步到后端
  - 离线状态下暂存本地，联网后自动同步
  - 冲突处理：以服务端最新时间为准
- **验收标准**：AC-10
- **测试要求**：
  - `programmatic` TR-16.1：A 设备学习后，B 设备刷新可见最新进度
  - `programmatic` TR-16.2：离线学习的记录在联网后自动上传

---

## [x] Task 17: AI 助手增强 - 作文批改 & 智能出题
- **优先级**：P2
- **依赖**：Task 12
- **描述**：
  - 作文批改模式：用户提交作文，AI 从立意、结构、语言等方面给出批改建议
  - 智能出题模式：基于当前知识点，AI 自动生成练习题
  - 拍照搜题（移动端）：调用相机拍照，OCR 识别题目后 AI 解答
- **测试要求**：
  - `human-judgment` TR-17.1：作文批改建议合理、有针对性
  - `programmatic` TR-17.2：AI 出题结果包含题目和正确答案
  - `programmatic` TR-17.3：拍照搜题可识别并解答（需 mock OCR）

---

## [x] Task 18: 性能优化与生产配置
- **优先级**：P2
- **依赖**：Task 9, Task 14, Task 15
- **描述**：
  - 代码分割（React.lazy）+ 路由级懒加载
  - 图片和资源懒加载
  - 服务端渲染优化（首屏加载）
  - Electron 应用启动速度优化
  - 移动端包体积优化
  - 生产环境 CI/CD 配置
- **测试要求**：
  - `programmatic` TR-18.1：Web 端 Lighthouse 评分 > 85
  - `programmatic` TR-18.2：桌面端安装包 < 100MB
  - `programmatic` TR-18.3：移动端安装包 < 50MB（Expo）

---

# 任务依赖关系

```
Task 1 (Monorepo 架构)
├── Task 8 (共享组件库) ← 依赖 Task 1
│   ├── Task 9 (Web 端布局路由) ← 依赖 Task 1 + Task 8
│   │   ├── Task 10 (认证页面) ← 依赖 Task 4 + Task 9
│   │   ├── Task 11 (学习中心) ← 依赖 Task 5 + Task 9
│   │   ├── Task 12 (AI 助手面板) ← 依赖 Task 7 + Task 8 + Task 9
│   │   ├── Task 13 (错题本与看板) ← 依赖 Task 6 + Task 9
│   │   └── Task 14 (桌面端) ← 依赖 Task 9
│   └── Task 15 (移动端) ← 依赖 Task 1 + Task 8
├── Task 2 (后端框架)
│   ├── Task 3 (数据库 + 种子) ← 依赖 Task 2
│   │   ├── Task 4 (认证 API) ← 依赖 Task 3
│   │   ├── Task 5 (课程 API) ← 依赖 Task 3
│   │   └── Task 6 (学习记录 API) ← 依赖 Task 4 + Task 5
│   └── Task 7 (AI 助手 API) ← 依赖 Task 4
├── Task 16 (跨设备同步) ← 依赖 Task 6 + Task 13 + Task 15
└── Task 17 (AI 增强功能) ← 依赖 Task 12
    └── Task 18 (性能优化) ← 依赖 Task 9 + Task 14 + Task 15
```

# 并行执行建议

- **批次 1**：Task 1（Monorepo）+ Task 2（后端框架）
- **批次 2**：Task 3（数据库）+ Task 8（共享组件库）
- **批次 3**：Task 4（认证 API）+ Task 5（课程 API）+ Task 9（Web 端布局）
- **批次 4**：Task 6（学习记录 API）+ Task 7（AI 助手 API）+ Task 10（前端认证）+ Task 11（学习中心）
- **批次 5**：Task 12（AI 助手面板）+ Task 13（错题本）+ Task 14（桌面端）+ Task 15（移动端）
- **批次 6**：Task 16（跨设备同步）
- **批次 7**：Task 17（AI 增强）+ Task 18（性能优化）