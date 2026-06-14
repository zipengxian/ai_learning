# 多语种在线教育平台 - 实现计划（分解与优先级排序）

## [x] Task 1: 项目脚手架搭建与基础配置
- **优先级**：P0
- **依赖**：无
- **描述**：
  - 初始化前端 React 项目（使用 Vite 构建工具）
  - 初始化后端 Node.js/Express 项目
  - 配置 SQLite 数据库连接（使用 better-sqlite3）
  - 安装核心依赖：前端（react-router-dom, axios, recharts），后端（express, bcryptjs, jsonwebtoken, cors, better-sqlite3）
  - 建立项目目录结构
- **验收标准**：AC-1 ~ AC-10（基础架构支撑）
- **测试要求**：
  - `programmatic` TR-1.1：`npm run dev` 前端启动成功，显示默认页面
  - `programmatic` TR-1.2：`npm start` 后端启动成功，监听端口 3001
  - `programmatic` TR-1.3：后端 `/api/health` 接口返回 `{ status: "ok" }`

---

## [x] Task 2: 数据库 Schema 设计与种子数据
- **优先级**：P0
- **依赖**：Task 1
- **描述**：
  - 设计并创建数据库表：users, courses, units, vocabulary_words, grammar_questions, speaking_sentences, listening_exercises, learning_records, posts, replies, achievements, user_achievements
  - 编写数据库初始化脚本
  - 编写种子数据脚本，预置英语/日语/韩语的课程数据（每个语种 >= 3 个级别，每级别 >= 3 个单元，每单元包含 4 类活动的题目数据）
- **验收标准**：AC-2（课程分级浏览的数据基础）
- **测试要求**：
  - `programmatic` TR-2.1：运行种子脚本后，数据库中存在英语、日语、韩语三个语种的课程数据
  - `programmatic` TR-2.2：每个语种至少有入门、初级、中级三个级别，每级别至少 3 个课程单元
  - `programmatic` TR-2.3：每个课程单元至少包含 5 个单词、5 道语法题、3 个跟读句子、3 道听力题

---

## [x] Task 3: 后端用户认证 API
- **优先级**：P0
- **依赖**：Task 2
- **描述**：
  - 实现 POST `/api/auth/register` — 邮箱+密码注册，密码 bcrypt 哈希，JWT 令牌签发
  - 实现 POST `/api/auth/login` — 邮箱+密码登录，返回 JWT 令牌
  - 实现 GET `/api/auth/me` — 获取当前登录用户信息
  - 实现 JWT 认证中间件
  - 输入校验（邮箱格式、密码≥6位、重复邮箱拒绝）
- **验收标准**：AC-1
- **测试要求**：
  - `programmatic` TR-3.1：合法邮箱+密码注册返回 201 和 JWT 令牌
  - `programmatic` TR-3.2：重复邮箱注册返回 409 冲突错误
  - `programmatic` TR-3.3：密码不足 6 位返回 400 错误
  - `programmatic` TR-3.4：正确邮箱+密码登录返回 200 和 JWT 令牌
  - `programmatic` TR-3.5：错误密码登录返回 401 未授权错误
  - `programmatic` TR-3.6：携带有效令牌访问 `/api/auth/me` 返回用户信息

---

## [x] Task 4: 后端课程与活动数据 API
- **优先级**：P0
- **依赖**：Task 2
- **描述**：
  - 实现 GET `/api/languages` — 获取所有语种列表
  - 实现 GET `/api/courses?language=&level=` — 按语种和级别筛选课程单元列表
  - 实现 GET `/api/courses/:id` — 获取单个课程单元详情（含四类活动数据）
  - 实现 GET `/api/courses/:id/vocabulary` — 获取课程单词列表
  - 实现 GET `/api/courses/:id/grammar` — 获取课程语法题目列表
  - 实现 GET `/api/courses/:id/speaking` — 获取课程跟读句子列表
  - 实现 GET `/api/courses/:id/listening` — 获取课程听力题目列表
- **验收标准**：AC-2
- **测试要求**：
  - `programmatic` TR-4.1：GET `/api/languages` 返回包含 "英语"、"日语"、"韩语" 的数组
  - `programmatic` TR-4.2：GET `/api/courses?language=英语&level=初级` 返回该级别所有课程单元
  - `programmatic` TR-4.3：GET `/api/courses/:id` 返回课程详情及关联活动数据
  - `programmatic` TR-4.4：各活动子接口返回题目数量符合种子数据定义

---

## [x] Task 5: 后端学习记录与进度 API
- **优先级**：P1
- **依赖**：Task 3, Task 4
- **描述**：
  - 实现 POST `/api/learning/records` — 提交活动完成记录（课程ID、活动类型、得分）
  - 实现 GET `/api/learning/progress` — 获取当前用户学习进度摘要（完成课程数、各技能得分、连续学习天数）
  - 实现 GET `/api/learning/history` — 获取学习历史记录列表
  - 实现连续学习天数计算逻辑（基于学习记录时间戳）
- **验收标准**：AC-7
- **测试要求**：
  - `programmatic` TR-5.1：提交活动记录后，数据库中写入对应 learning_records 行
  - `programmatic` TR-5.2：GET `/api/learning/progress` 返回完成课程数、各技能平均分
  - `programmatic` TR-5.3：存在连续日期的学习记录时，连续学习天数正确计算

---

## [x] Task 6: 后端学习路径推荐 API
- **优先级**：P1
- **依赖**：Task 5
- **描述**：
  - 实现 GET `/api/recommendations` — 基于用户当前等级和未完成课程返回推荐课程列表
  - 推荐逻辑：优先推荐同级未完成课程 → 同级完成后推荐下一级别 → 跨语种推荐入门课程
- **验收标准**：AC-8
- **测试要求**：
  - `programmatic` TR-6.1：新用户（无学习记录）推荐入门级别课程
  - `programmatic` TR-6.2：已完成入门级别所有课程的用户，推荐初级课程
  - `programmatic` TR-6.3：推荐列表不包含已完成的课程

---

## [x] Task 7: 后端社区讨论 API
- **优先级**：P1
- **依赖**：Task 3
- **描述**：
  - 实现 GET `/api/posts?page=&limit=` — 分页获取帖子列表（倒序）
  - 实现 POST `/api/posts` — 创建新帖子
  - 实现 GET `/api/posts/:id` — 获取帖子详情（含回帖列表）
  - 实现 POST `/api/posts/:id/replies` — 创建回帖
- **验收标准**：AC-9
- **测试要求**：
  - `programmatic` TR-7.1：创建帖子后，帖子列表接口返回该帖子
  - `programmatic` TR-7.2：帖子按发布时间倒序排列
  - `programmatic` TR-7.3：GET `/api/posts?page=1&limit=10` 正确分页
  - `programmatic` TR-7.4：创建回帖后，帖子详情接口包含回帖数据

---

## [x] Task 8: 后端成就系统 API
- **优先级**：P1
- **依赖**：Task 5
- **描述**：
  - 实现成就检查逻辑（连续学习 3/7/30 天、完成 1/5/10 门课程、累计 50/100/200 积分等）
  - 在用户提交学习记录后触发成就检查，满足条件自动授予徽章
  - 实现 GET `/api/achievements` — 获取所有成就列表及用户获得状态
  - 实现 GET `/api/users/:id/achievements` — 获取用户已获得成就
- **验收标准**：AC-10
- **测试要求**：
  - `programmatic` TR-8.1：用户首次完成课程后，自动获得"初次学习"成就
  - `programmatic` TR-8.2：用户连续学习 3 天后，自动获得"连续学习3天"成就
  - `programmatic` TR-8.3：GET `/api/achievements` 返回所有成就及当前用户是否已获得

---

## [x] Task 9: 前端路由与布局框架
- **优先级**：P0
- **依赖**：Task 1
- **描述**：
  - 配置 React Router，定义路由：`/`(首页), `/login`, `/register`, `/courses`(课程中心), `/courses/:id`(课程学习页), `/dashboard`(学习看板), `/recommend`(推荐路径), `/community`(社区), `/profile`(个人主页)
  - 实现全局布局组件（Header 导航栏 + Footer + 主体内容区）
  - 实现路由守卫（未登录重定向到登录页）
  - 实现 JWT 存储与自动携带（axios 拦截器）
- **测试要求**：
  - `programmatic` TR-9.1：访问 `/courses` 未登录时自动跳转到 `/login`
  - `programmatic` TR-9.2：登录后可以正常访问所有受保护路由
  - `programmatic` TR-9.3：导航栏根据登录状态显示不同内容（未登录显示登录/注册，已登录显示用户菜单）

---

## [x] Task 10: 前端用户认证页面
- **优先级**：P0
- **依赖**：Task 3, Task 9
- **描述**：
  - 实现注册页面（邮箱、密码、确认密码表单，前端校验 + 提交）
  - 实现登录页面（邮箱、密码表单，错误提示）
  - 登录/注册成功后存储 JWT 并跳转首页
- **验收标准**：AC-1
- **测试要求**：
  - `programmatic` TR-10.1：注册表单校验：邮箱格式不正确显示错误提示
  - `programmatic` TR-10.2：注册表单校验：密码 < 6 位显示错误提示
  - `programmatic` TR-10.3：注册表单校验：两次密码不一致显示错误提示
  - `programmatic` TR-10.4：成功注册后自动跳转到首页
  - `programmatic` TR-10.5：错误密码登录显示"邮箱或密码错误"提示

---

## [x] Task 11: 前端课程中心与课程详情页
- **优先级**：P0
- **依赖**：Task 4, Task 9
- **描述**：
  - 实现课程中心页面：语种选择 tabs + 级别筛选 tabs，展示课程单元卡片列表
  - 实现课程详情页：展示课程标题、描述、四类学习活动的入口按钮
- **验收标准**：AC-2
- **测试要求**：
  - `programmatic` TR-11.1：课程中心默认展示第一个语种的入门级别课程列表
  - `programmatic` TR-11.2：切换语种 tab 后课程列表更新
  - `programmatic` TR-11.3：切换级别 tab 后课程列表更新
  - `programmatic` TR-11.4：点击课程卡片跳转到课程详情页，显示四类活动入口

---

## [x] Task 12: 前端单词记忆模块（闪卡）
- **优先级**：P0
- **依赖**：Task 4, Task 9
- **描述**：
  - 实现闪卡组件：正面显示单词，点击翻转显示释义和例句
  - 实现"已掌握"/"需复习"两个操作按钮
  - 实现进度条显示当前进度
  - 完成后显示本轮正确率并提交学习记录
- **验收标准**：AC-3
- **测试要求**：
  - `programmatic` TR-12.1：闪卡初始显示单词正面
  - `programmatic` TR-12.2：点击翻转后显示释义面
  - `programmatic` TR-12.3：点击"已掌握"或"需复习"后自动切换到下一张
  - `programmatic` TR-12.4：全部单词完成后显示正确率并提交记录

---

## [x] Task 13: 前端语法练习模块
- **优先级**：P0
- **依赖**：Task 4, Task 9
- **描述**：
  - 实现语法选择题组件：展示题目和 4 个选项
  - 用户选择后立即显示正确/错误反馈（绿色/红色高亮）
  - 支持"下一题"按钮
  - 完成后显示总分并提交学习记录
- **验收标准**：AC-4
- **测试要求**：
  - `programmatic` TR-13.1：每题展示题干和 4 个选项
  - `programmatic` TR-13.2：选择后正确选项高亮绿色，错误选项高亮红色
  - `programmatic` TR-13.3：完成后显示总分与正确率
  - `programmatic` TR-13.4：提交学习记录中包含得分

---

## [x] Task 14: 前端口语跟读模块
- **优先级**：P1
- **依赖**：Task 4, Task 9
- **描述**：
  - 检测浏览器是否支持 Web Speech API，不支持则显示提示
  - 实现跟读组件：展示待读句子，点击麦克风开始录音
  - 调用 SpeechRecognition 获取识别文本
  - 计算识别文本与原文的相似度（简单字符串匹配）
  - 显示匹配结果并提交学习记录
- **验收标准**：AC-5
- **测试要求**：
  - `programmatic` TR-14.1：不支持 Speech API 时显示"您的浏览器不支持语音识别"提示
  - `programmatic` TR-14.2：支持时点击麦克风按钮开始语音识别
  - `programmatic` TR-14.3：识别完成后显示识别文本与原文对比
  - `programmatic` TR-14.4：提交学习记录中包含跟读完成状态

---

## [x] Task 15: 前端听力训练模块
- **优先级**：P1
- **依赖**：Task 4, Task 9
- **描述**：
  - 实现音频播放组件（使用 HTML5 Audio，音频源使用示例占位或 TTS 生成）
  - 播放后展示理解题（选择题）
  - 每题作答后显示正确/错误
  - 完成后显示得分并提交学习记录
- **验收标准**：AC-6
- **测试要求**：
  - `programmatic` TR-15.1：点击播放按钮播放音频
  - `programmatic` TR-15.2：音频播放完毕后显示理解题
  - `programmatic` TR-15.3：提交答案后显示得分
  - `programmatic` TR-15.4：提交学习记录中包含得分

---

## [x] Task 16: 前端学习进度看板
- **优先级**：P1
- **依赖**：Task 5, Task 9
- **描述**：
  - 实现看板页面：总完成课程数、连续学习天数、各技能得分分布图表
  - 使用 Recharts 绘制柱状图/雷达图展示各技能得分
  - 展示最近学习活动时间线
- **验收标准**：AC-7
- **测试要求**：
  - `programmatic` TR-16.1：看板页面展示完成课程总数
  - `programmatic` TR-16.2：看板页面展示连续学习天数
  - `programmatic` TR-16.3：图表展示词汇/语法/口语/听力四项技能得分
  - `programmatic` TR-16.4：无学习记录时显示空状态提示

---

## [x] Task 17: 前端个性化推荐页面
- **优先级**：P1
- **依赖**：Task 6, Task 9
- **描述**：
  - 实现推荐页面组件，展示推荐课程列表
  - 每个推荐项显示课程标题、语种、级别和"开始学习"按钮
  - 整合到首页 Dashboard 或独立推荐页面
- **验收标准**：AC-8
- **测试要求**：
  - `programmatic` TR-17.1：推荐页面展示至少一个推荐课程
  - `programmatic` TR-17.2：点击"开始学习"跳转到对应课程详情页
  - `programmatic` TR-17.3：无推荐课程时显示空状态提示

---

## [x] Task 18: 前端社区讨论区
- **优先级**：P1
- **依赖**：Task 7, Task 9
- **描述**：
  - 实现帖子列表页：分页展示，显示标题、作者、发布时间
  - 实现发帖表单（标题 + 内容）
  - 实现帖子详情页：显示帖子内容和回帖列表
  - 实现回帖表单
- **验收标准**：AC-9
- **测试要求**：
  - `programmatic` TR-18.1：帖子列表按时间倒序展示
  - `programmatic` TR-18.2：点击"发帖"按钮可打开发帖表单，提交后列表刷新
  - `programmatic` TR-18.3：帖子详情页显示回帖列表
  - `programmatic` TR-18.4：提交回帖后回帖列表刷新

---

## [x] Task 19: 前端成就展示页面
- **优先级**：P1
- **依赖**：Task 8, Task 9
- **描述**：
  - 实现成就展示组件（徽章墙），展示所有成就及用户获得状态
  - 已获得徽章高亮显示，未获得徽章灰色显示带锁定图标
  - 集成到个人主页
- **验收标准**：AC-10
- **测试要求**：
  - `programmatic` TR-19.1：成就墙展示所有成就徽章
  - `programmatic` TR-19.2：已获得徽章与未获得徽章视觉上有明显区别
  - `programmatic` TR-19.3：个人主页包含成就徽章展示区域

---

# 任务依赖关系

```
Task 1 (脚手架)
├── Task 2 (数据库+种子)
│   ├── Task 3 (认证API)
│   ├── Task 4 (课程API)
│   └── Task 9 (前端路由布局)
├── Task 5 (学习记录API) ← Task 3 + Task 4
│   ├── Task 6 (推荐API)
│   │   └── Task 17 (前端推荐页) ← Task 9
│   └── Task 8 (成就API)
│       └── Task 19 (前端成就页) ← Task 9
├── Task 7 (社区API) ← Task 3
│   └── Task 18 (前端社区) ← Task 9
├── Task 10 (前端认证页) ← Task 3 + Task 9
├── Task 11 (前端课程页) ← Task 4 + Task 9
│   ├── Task 12 (前端单词模块) ← Task 4 + Task 9
│   ├── Task 13 (前端语法模块) ← Task 4 + Task 9
│   ├── Task 14 (前端口语模块) ← Task 4 + Task 9
│   └── Task 15 (前端听力模块) ← Task 4 + Task 9
└── Task 16 (前端进度看板) ← Task 5 + Task 9
```

# 并行执行建议

以下任务组可并行执行：
- **批次 1**: Task 1
- **批次 2**: Task 2, Task 9（Task 1 完成后）
- **批次 3**: Task 3, Task 4（Task 2 完成后）
- **批次 4**: Task 5, Task 7, Task 10, Task 11（Task 3 和 Task 4 完成后）
- **批次 5**: Task 6, Task 8, Task 12, Task 13, Task 14, Task 15, Task 16, Task 18（相关依赖完成后）
- **批次 6**: Task 17, Task 19（Task 6 和 Task 8 完成后）