# SMIL Marketing 项目规划文档

> 基于现有代码功能整理，用于指导后续开发与迭代。

---

## 一、项目概述

**SMIL Marketing** 是一个面向汽车行业的营销管理平台，涵盖行业资讯、配置定价、销量分析三大核心板块。采用前后端分离架构，前端 React + Vite + Tailwind，后端 FastAPI，数据存储使用 Supabase（Postgres + Storage）。

---

## 二、技术架构


| 层级   | 技术选型              | 说明                               |
| ---- | ----------------- | -------------------------------- |
| 前端框架 | React 18 + Vite   | SPA，开发体验好                        |
| 样式   | Tailwind CSS      | 原子化 CSS                          |
| 路由   | React Router v6   | 单页路由                             |
| 后端   | FastAPI           | 异步、自动文档                          |
| 数据库  | Supabase Postgres | 云托管 PostgreSQL                   |
| 文件存储 | Supabase Storage  | 车型 PDF 等文件                       |
| 代理   | Vite proxy        | `/api` → `http://127.0.0.1:8000` |


---

## 三、已实现功能

### 3.1 全局能力


| 功能     | 实现位置                              | 说明                       |
| ------ | --------------------------------- | ------------------------ |
| 国家选择   | `Layout.tsx` + `AppContext`       | 顶部下拉选择当前国家，影响配置定价等数据范围   |
| 新增国家   | `AddCountryModal` + `country` API | 弹窗录入中英文名称，写入 `country` 表 |
| 中/英文切换 | `AppContext`                      | 全局 locale，影响文案与部分排序      |
| 用户管理入口 | `Layout.tsx`                      | 链接 `/user`，页面待实现         |
| 多语言文案  | `AppContext.translations`         | 中英 key-value 映射          |


### 3.2 行业资讯（Industry News）


| 状态  | 说明               |
| --- | ---------------- |
| 占位  | 仅展示标题与占位文案，无业务逻辑 |


**路由**：`/industry-news`

### 3.3 配置定价（Config & Pricing）


| 功能          | 实现位置                                                | 说明                                                       |
| ----------- | --------------------------------------------------- | -------------------------------------------------------- |
| 车型搜索        | `ConfigPricing` + `searchModels`                    | 左侧栏搜索框，按 `country_id` + 关键词模糊匹配 `model`                  |
| 品牌建议        | `suggestBrands`                                     | 输入时按 `brand` 模糊匹配，返回去重品牌列表                               |
| 新增车型        | 弹窗 + `createModel`                                  | 品牌、车型名、年款（选填）                                            |
| 文件上传        | 多选 PDF/图片                                           | 支持拖拽排序、预览、删除                                             |
| PDF 合并      | `pdf_merge.py`                                      | 多 PDF/图片按顺序合并为单 PDF                                      |
| 上传到 Storage | `supabase_storage` + `merge_and_upload_model_files` | 合并后上传至 `vehicle-docs` bucket，URL 写入 `model.original_url` |
| 侧边栏折叠       | `ConfigPricing`                                     | 收起/展开左侧栏                                                 |


**路由**：`/config-pricing`（默认首页）

**数据流**：国家 → 搜索/新增车型 → 创建 model → 上传文件 → 合并 PDF → 存储 → 更新 `original_url`

### 3.4 销量分析（Sales Analysis）


| 状态  | 说明               |
| --- | ---------------- |
| 占位  | 仅展示标题与占位文案，无业务逻辑 |


**路由**：`/sales-analysis`

---

## 四、后端 API 一览


| 方法   | 路径                               | 说明                        |
| ---- | -------------------------------- | ------------------------- |
| GET  | `/health`                        | 健康检查                      |
| GET  | `/countries`                     | 国家列表，`locale` 控制排序（zh/en） |
| POST | `/countries`                     | 新增国家                      |
| GET  | `/models`                        | 车型搜索，`country_id` + `q`   |
| GET  | `/models/brands`                 | 品牌建议，`country_id` + `q`   |
| POST | `/models`                        | 新增车型                      |
| POST | `/models/{model_id}/files/merge` | 合并并上传文件，返回 `original_url` |


---

## 五、数据模型

### 5.1 country


| 字段         | 类型           | 说明   |
| ---------- | ------------ | ---- |
| id         | UUID         | 主键   |
| country_cn | VARCHAR(100) | 中文名称 |
| country_en | VARCHAR(100) | 英文名称 |


### 5.2 model（车型）


| 字段           | 类型           | 说明                         |
| ------------ | ------------ | -------------------------- |
| id           | UUID         | 主键                         |
| country_id   | UUID         | 外键 → country.id，CASCADE 删除 |
| brand        | VARCHAR(100) | 品牌                         |
| model        | VARCHAR(200) | 车型名称                       |
| model_year   | INTEGER      | 年款，可选                      |
| original_url | VARCHAR(500) | 合并后 PDF 的公开 URL            |


---

## 六、环境与依赖

### 6.1 后端环境变量（`.env`）


| 变量                        | 必填             | 说明                                       |
| ------------------------- | -------------- | ---------------------------------------- |
| SUPABASE_DB_URL           | 是              | Postgres 连接串（`postgresql+psycopg://...`） |
| SUPABASE_URL              | 是（用 Storage 时） | Supabase 项目 URL                          |
| SUPABASE_SERVICE_ROLE_KEY | 是（用 Storage 时） | Service role key                         |
| GOOGLE_API_KEY            | 否              | Google Generative AI（当前未使用）              |


### 6.2 Supabase 配置

- **Bucket**：`vehicle-docs`，需在控制台创建并设为 public
- **数据库**：通过 `init_db()` 自动建表，并为 `model` 表补充 `original_url` 列

### 6.3 主要依赖

- **后端**：FastAPI、SQLAlchemy、pypdf、img2pdf、supabase、Pillow、openpyxl 等
- **前端**：React、React Router、Tailwind、Vite

---

## 七、待完善 / 规划项

### 7.1 配置定价

- 主内容区：选中车型后展示配置与定价详情（当前为占位）
- 利用 `original_url` 展示或解析 PDF 内容
- 车型编辑、删除能力
- 品牌建议与搜索的进一步优化（如拼音、别名）

### 7.2 行业资讯

- 资讯列表与详情
- 数据来源与存储设计
- 可选：与 Google AI 等集成做摘要或推荐

### 7.3 销量分析

- 销量数据录入与展示
- 图表与报表（可考虑 openpyxl 导出）
- 按国家、车型、时间维度筛选

### 7.4 用户管理

- `/user` 页面实现
- 登录/注册、权限控制（如 Supabase Auth）
- 多用户、多角色（如管理员/普通用户）

### 7.5 基础设施

- 错误边界与全局错误提示
- 加载状态与骨架屏
- 单元测试与 E2E 测试
- CI/CD 与部署流程

---

## 八、目录结构速览

```
smil_marketing/
├── frontend/
│   ├── src/
│   │   ├── api/           # countries, models 等 API 封装
│   │   ├── components/    # Layout, Icons, AddCountryModal
│   │   ├── context/       # AppContext（locale、country、t）
│   │   └── pages/         # IndustryNews, ConfigPricing, SalesAnalysis
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── database.py    # Supabase Postgres + Storage 客户端
│   │   ├── models/        # Country, VehicleModel
│   │   ├── routers/       # health, country, vehicle_model
│   │   ├── schemas/       # Pydantic 请求/响应模型
│   │   ├── pdf_merge.py   # PDF/图片合并
│   │   └── supabase_storage.py
│   ├── main.py
│   └── requirements.txt
└── plan.md
```

---

## 九、快速启动

```bash
# 后端
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 前端
cd frontend && npm install && npm run dev
```

- 前端：[http://localhost:5173](http://localhost:5173)  
- API 文档：[http://localhost:8000/docs](http://localhost:8000/docs)

---

*文档生成时间：基于当前代码库状态*