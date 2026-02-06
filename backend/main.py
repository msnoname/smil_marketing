"""
SMIL Marketing - FastAPI 后端入口
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import health


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用启动时初始化数据库等资源"""
    init_db()  # 同步调用，无需 aiosqlite
    yield
    # 关闭时清理（如需要）


app = FastAPI(
    title="SMIL Marketing API",
    description="行业资讯、配置定价、销量分析",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])


@app.get("/")
async def root():
    return {"message": "SMIL Marketing API", "docs": "/docs"}
