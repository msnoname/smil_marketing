"""
Supabase 相关配置：
- Postgres 数据库：用 SUPABASE_DB_URL（连接串）+ SQLAlchemy
- Storage：用 SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + supabase 客户端
"""
import os
from typing import Any

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

# 加载环境变量（从 .env 文件）
load_dotenv()

# 从环境变量读取 Supabase Postgres 连接串
SUPABASE_DB_URL = os.getenv("SUPABASE_DB_URL")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Storage 客户端（仅在使用 Storage 时需要；未安装 supabase 或未配置时为 None）
_supabase_storage_client: Any = None


def get_supabase_storage_client() -> Any:
    """获取 Supabase 客户端，用于 Storage API。需安装 supabase 并配置 SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY。"""
    global _supabase_storage_client
    if _supabase_storage_client is not None:
        return _supabase_storage_client
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY 未配置。"
            "请在 .env 中设置（Supabase 项目 URL 与 Service role key）。"
        )
    try:
        from supabase import create_client  # type: ignore
        _supabase_storage_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    except ImportError as e:
        raise RuntimeError(
            "未安装 supabase。请在 backend 目录执行: pip install -r requirements.txt"
        ) from e
    return _supabase_storage_client

if not SUPABASE_DB_URL:
    raise RuntimeError(
        "SUPABASE_DB_URL 未配置。请在 .env 文件中设置，格式：\n"
        "SUPABASE_DB_URL=postgresql+psycopg://postgres.xxxxx:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
    )

# 创建 Postgres 引擎
engine = create_engine(
    SUPABASE_DB_URL,
    echo=False,  # 设为 True 可查看 SQL 日志
    pool_pre_ping=True,  # 连接前检查连接是否有效
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def init_db():
    """创建表（如有 Base 子类），并确保 model 表有 original_url 列。"""
    Base.metadata.create_all(bind=engine)
    # 为已有 model 表补充 original_url（新表 create_all 已包含）
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE model ADD COLUMN IF NOT EXISTS original_url VARCHAR(500)"))
        conn.execute(text("ALTER TABLE model ADD COLUMN IF NOT EXISTS cn_url VARCHAR(500)"))
        conn.execute(text("ALTER TABLE model ADD COLUMN IF NOT EXISTS en_url VARCHAR(500)"))
        conn.commit()


def get_db():
    """依赖：获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
