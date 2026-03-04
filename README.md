# SMIL Marketing

行业资讯、配置定价、销量分析 — 前端 + 后端一体化项目框架。

## 技术栈

| 维度     | 工具               | 说明 |
|----------|--------------------|------|
| 前端框架 | React (Vite)       | 速度快，生态强 |
| 样式     | Tailwind CSS       | 简洁风格 |
| 后端     | FastAPI            | Python 高性能、文档友好 |
| 数据库   | SQLite             | 轻量本地存储 |
| AI SDK   | Google Generative AI | 官方 Python SDK |

## 项目结构

```
smil_marketing/
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/ # 布局等公共组件
│   │   ├── context/   # 国家、语言等全局状态
│   │   ├── pages/     # 行业资讯、配置定价、销量分析
│   │   └── ...
│   └── package.json
├── backend/           # FastAPI
│   ├── app/
│   │   ├── database.py
│   │   └── routers/
│   ├── db/            # SQLite 文件（自动创建）
│   ├── main.py
│   └── requirements.txt
└── README.md
```

## 功能板块

- **行业资讯**：占位，待完善
- **配置定价**：左侧栏顶部为车型搜索框，主内容区待完善
- **销量分析**：占位，待完善

顶部：国家选择 → 三个 Tab → 右侧中/英文切换、用户管理入口。

## 快速开始

### 前端

```bash
cd frontend
npm install
npm run dev
```

访问：http://localhost:5173  
默认进入「配置定价」页。

### 后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 前端
```bash
cd frontend
npm install   # 首次需安装依赖
npm run dev
```

API 文档：http://localhost:8000/docs  
前端通过 `/api/*` 代理到后端（见 `frontend/vite.config.ts`）。

### 环境变量（可选）

- 后端：`GOOGLE_API_KEY` — 使用 Google Generative AI 时配置

## 下一步

- 配置定价：实现左侧「搜索车型」的交互与接口
- 按需完善行业资讯、销量分析、用户管理
